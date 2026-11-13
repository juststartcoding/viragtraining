import { Router } from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import rateLimit from 'express-rate-limit';
import { OnlineCourse, Batch, LiveSession, Webinar, WebinarRegistration, User, Enrollment, Order } from '../models/lms.js';
import { protect } from '../middleware/auth.js';
import { crudRouter } from '../utils/crudRouter.js';
import { asyncHandler, escapeRegex, HttpError } from '../utils/helpers.js';
import { startCheckout, fulfillOrder, verifyCheckoutSignature, verifyWebhookSignature, razorpayEnabled } from '../utils/payments.js';

const router = Router();
const s = (v, max = 200) => String(v ?? '').trim().slice(0, max);
const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RX = /^[+\d][\d\s-]{7,18}$/;
const oid = (v) => (mongoose.isValidObjectId(v) ? v : null);
const byKey = (key) => (mongoose.isValidObjectId(key) ? { $or: [{ _id: key }, { slug: key }] } : { slug: String(key) });

/* ============================ Public shaping ============================ */
const courseStats = (c) => {
  const lessons = (c.sections || []).flatMap((x) => x.lessons || []);
  return { lessonsCount: lessons.length, totalMinutes: lessons.reduce((n, l) => n + (l.duration || 0), 0) };
};

/** Hide paid lesson content from the public; keep free previews playable */
function publicCourse(c, { list }) {
  const out = { ...c, ...courseStats(c) };
  if (list) {
    delete out.sections;
    delete out.faqs;
    return out;
  }
  out.sections = (c.sections || []).map((sec) => ({
    _id: sec._id,
    title: sec.title,
    lessons: sec.lessons.map((l) => ({
      _id: l._id,
      title: l.title,
      type: l.type,
      duration: l.duration,
      isPreview: l.isPreview,
      ...(l.isPreview ? { videoUrl: l.videoUrl, content: l.content, resourceUrl: l.resourceUrl } : {}),
    })),
  }));
  return out;
}

async function publicBatch(b) {
  const { meetingLink, ...rest } = b;
  const enrolled = await Enrollment.countDocuments({ batch: b._id, status: 'active' });
  return { ...rest, enrolledCount: enrolled, seatsLeft: b.capacity ? Math.max(b.capacity - enrolled, 0) : null };
}

async function publicWebinar(w) {
  const { joinLink, replayUrl, ...rest } = w;
  const registered = await WebinarRegistration.countDocuments({ webinar: w._id, status: { $ne: 'cancelled' } });
  return { ...rest, registeredCount: registered, seatsLeft: w.seats ? Math.max(w.seats - registered, 0) : null, hasReplay: !!replayUrl };
}

router.use('/online-courses', crudRouter(OnlineCourse, { searchFields: ['title', 'subtitle'], transform: publicCourse }));
router.use('/batches', crudRouter(Batch, { filterFields: ['status'], sort: { order: 1, startDate: 1 }, transform: publicBatch }));

/* ============================ Student auth ============================ */
const signStudent = (id) => jwt.sign({ id, role: 'student' }, process.env.JWT_SECRET, { expiresIn: '30d' });
const studentDto = (u) => ({ id: u._id, name: u.name, email: u.email, phone: u.phone });

export const protectStudent = asyncHandler(async (req, _res, next) => {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!token) throw new HttpError(401, 'Please login to continue');
  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw new HttpError(401, 'Session expired, please login again');
  }
  if (payload.role !== 'student') throw new HttpError(401, 'Please login as a student');
  const user = await User.findById(payload.id);
  if (!user || !user.active) throw new HttpError(401, 'Account not found or disabled');
  req.user = user;
  next();
});

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, message: { message: 'Too many attempts, try again later' } });

router.post(
  '/student/register',
  authLimiter,
  asyncHandler(async (req, res) => {
    const name = s(req.body?.name, 100);
    const email = s(req.body?.email, 150).toLowerCase();
    const phone = s(req.body?.phone, 20);
    const password = String(req.body?.password || '');
    if (!name) throw new HttpError(400, 'Name is required');
    if (!EMAIL_RX.test(email)) throw new HttpError(400, 'Valid email is required');
    if (!PHONE_RX.test(phone)) throw new HttpError(400, 'Valid phone number is required');
    if (password.length < 6) throw new HttpError(400, 'Password must be at least 6 characters');
    if (await User.exists({ email })) throw new HttpError(409, 'An account with this email already exists. Please login.');
    const user = await User.create({ name, email, phone, password });
    // Link earlier webinar registrations made with the same email
    await WebinarRegistration.updateMany({ email, user: null }, { user: user._id });
    res.status(201).json({ token: signStudent(user._id), user: studentDto(user) });
  })
);

router.post(
  '/student/login',
  authLimiter,
  asyncHandler(async (req, res) => {
    const email = s(req.body?.email, 150).toLowerCase();
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.matchPassword(String(req.body?.password || '')))) throw new HttpError(401, 'Invalid email or password');
    if (!user.active) throw new HttpError(403, 'Your account is disabled. Please contact us.');
    res.json({ token: signStudent(user._id), user: studentDto(user) });
  })
);

router.get('/student/me', protectStudent, (req, res) => res.json(studentDto(req.user)));

router.put(
  '/student/me',
  protectStudent,
  asyncHandler(async (req, res) => {
    if (req.body?.name) req.user.name = s(req.body.name, 100);
    if (req.body?.phone !== undefined) req.user.phone = s(req.body.phone, 20);
    await req.user.save();
    res.json(studentDto(req.user));
  })
);

router.put(
  '/student/password',
  protectStudent,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).select('+password');
    if (!(await user.matchPassword(String(req.body?.currentPassword || '')))) throw new HttpError(400, 'Current password is incorrect');
    const pw = String(req.body?.newPassword || '');
    if (pw.length < 6) throw new HttpError(400, 'New password must be at least 6 characters');
    user.password = pw;
    await user.save();
    res.json({ message: 'Password updated' });
  })
);

/* ============================ Student dashboard ============================ */
router.get(
  '/student/dashboard',
  protectStudent,
  asyncHandler(async (req, res) => {
    const uid = req.user._id;
    const enrollments = await Enrollment.find({ user: uid, status: 'active' })
      .populate('course', 'title slug thumbnail sections instructor certificate')
      .populate('batch', 'title slug thumbnail schedule startDate status platform trainer')
      .lean();

    const courses = enrollments
      .filter((e) => e.kind === 'course' && e.course)
      .map((e) => {
        const { lessonsCount } = courseStats(e.course);
        const done = e.completedLessons.length;
        return {
          enrollmentId: e._id,
          course: { _id: e.course._id, title: e.course.title, slug: e.course.slug, thumbnail: e.course.thumbnail, instructor: e.course.instructor, certificate: e.course.certificate },
          lessonsCount,
          completed: done,
          progress: lessonsCount ? Math.round((Math.min(done, lessonsCount) / lessonsCount) * 100) : 0,
          completedAt: e.completedAt,
        };
      });

    const batches = enrollments.filter((e) => e.kind === 'batch' && e.batch).map((e) => e.batch);
    const batchIds = batches.map((b) => b._id);
    const now = Date.now();
    const sessions = await LiveSession.find({ batch: { $in: batchIds } }).sort({ startsAt: 1 }).populate('batch', 'title').lean();
    const strip = ({ meetingLink, attendees, ...x }) => ({ ...x, attended: attendees.some((a) => String(a) === String(uid)) });
    const upcoming = sessions.filter((x) => new Date(x.startsAt).getTime() + x.durationMins * 60000 >= now).map(strip);
    const past = sessions.filter((x) => new Date(x.startsAt).getTime() + x.durationMins * 60000 < now).reverse().map(strip);

    const webinars = await WebinarRegistration.find({ $or: [{ user: uid }, { email: req.user.email }], status: { $ne: 'cancelled' } })
      .populate('webinar', 'title slug startsAt durationMins platform joinLink replayUrl banner price')
      .sort({ createdAt: -1 })
      .lean();

    const orders = await Order.find({ user: uid }).sort({ createdAt: -1 }).limit(30).lean();

    res.json({
      user: studentDto(req.user),
      courses,
      batches,
      upcoming,
      past,
      webinars: webinars
        .filter((w) => w.webinar)
        .map((w) => {
          const end = new Date(w.webinar.startsAt).getTime() + w.webinar.durationMins * 60000;
          const canSee = w.webinar.price <= 0 || w.paid;
          return {
            _id: w._id,
            status: w.status,
            paid: w.paid,
            webinar: { ...w.webinar, joinLink: canSee && end >= now ? w.webinar.joinLink : '', replayUrl: canSee ? w.webinar.replayUrl : '' },
          };
        }),
      orders,
    });
  })
);

/* Enrollment status for landing pages */
router.get(
  '/student/enrollment',
  protectStudent,
  asyncHandler(async (req, res) => {
    const kind = req.query.kind === 'batch' ? 'batch' : 'course';
    const id = oid(req.query.id);
    if (!id) throw new HttpError(400, 'Invalid id');
    const e = await Enrollment.findOne({ user: req.user._id, [kind]: id, status: 'active' }).lean();
    const pending = e ? null : await Order.findOne({ user: req.user._id, refId: id, status: 'pending' }).select('_id amount').lean();
    res.json({ enrolled: !!e, pending: !!pending, pendingOrder: pending ? { orderId: pending._id, amount: pending.amount } : null });
  })
);

/* Full course content for enrolled students */
router.get(
  '/student/courses/:slug',
  protectStudent,
  asyncHandler(async (req, res) => {
    const course = await OnlineCourse.findOne(byKey(req.params.slug)).lean();
    if (!course) throw new HttpError(404, 'Course not found');
    const enrollment = await Enrollment.findOne({ user: req.user._id, course: course._id, status: 'active' }).lean();
    if (!enrollment) throw new HttpError(403, 'You are not enrolled in this course');
    res.json({
      course: { ...course, ...courseStats(course) },
      progress: { completedLessons: enrollment.completedLessons.map(String), lastLesson: enrollment.lastLesson, completedAt: enrollment.completedAt, enrollmentId: enrollment._id },
    });
  })
);

router.post(
  '/student/courses/:id/progress',
  protectStudent,
  asyncHandler(async (req, res) => {
    const course = await OnlineCourse.findById(oid(req.params.id)).lean();
    if (!course) throw new HttpError(404, 'Course not found');
    const lessonIds = course.sections.flatMap((x) => x.lessons.map((l) => String(l._id)));
    const lessonId = String(req.body?.lessonId || '');
    if (!lessonIds.includes(lessonId)) throw new HttpError(400, 'Invalid lesson');
    const e = await Enrollment.findOne({ user: req.user._id, course: course._id, status: 'active' });
    if (!e) throw new HttpError(403, 'You are not enrolled in this course');

    const set = new Set(e.completedLessons.map(String));
    if (req.body?.completed === false) set.delete(lessonId);
    else if (req.body?.completed === true) set.add(lessonId);
    e.completedLessons = [...set].filter((x) => lessonIds.includes(x));
    e.lastLesson = lessonId;
    if (!e.completedAt && lessonIds.length && e.completedLessons.length >= lessonIds.length) e.completedAt = new Date();
    await e.save();
    res.json({ completedLessons: e.completedLessons.map(String), completedAt: e.completedAt });
  })
);

/* Join live class: checks enrollment, marks attendance, returns the meeting link */
router.get(
  '/student/sessions/:id/join',
  protectStudent,
  asyncHandler(async (req, res) => {
    const session = await LiveSession.findById(oid(req.params.id));
    if (!session) throw new HttpError(404, 'Class not found');
    const enrolled = await Enrollment.exists({ user: req.user._id, batch: session.batch, status: 'active' });
    if (!enrolled) throw new HttpError(403, 'You are not enrolled in this batch');
    const start = session.startsAt.getTime();
    const end = start + session.durationMins * 60000;
    if (Date.now() < start - 30 * 60000) throw new HttpError(400, 'Class link opens 30 minutes before the start time');
    if (Date.now() > end + 60 * 60000) throw new HttpError(400, 'This class has ended');
    const batch = await Batch.findById(session.batch).select('meetingLink').lean();
    const link = session.meetingLink || batch?.meetingLink;
    if (!link) throw new HttpError(400, 'Meeting link not added yet. Please contact your trainer.');
    await LiveSession.updateOne({ _id: session._id }, { $addToSet: { attendees: req.user._id } });
    res.json({ link });
  })
);

/* ============================ Checkout ============================ */
router.post(
  '/student/checkout',
  protectStudent,
  asyncHandler(async (req, res) => {
    const kind = req.body?.kind === 'batch' ? 'batch' : 'course';
    const Model = kind === 'batch' ? Batch : OnlineCourse;
    const item = await Model.findOne({ _id: oid(req.body?.id), published: true }).lean();
    if (!item) throw new HttpError(404, 'Not found');
    if (await Enrollment.exists({ user: req.user._id, [kind]: item._id, status: 'active' })) return res.json({ alreadyEnrolled: true });
    if (kind === 'batch' && item.capacity) {
      const count = await Enrollment.countDocuments({ batch: item._id, status: 'active' });
      if (count >= item.capacity) throw new HttpError(400, 'Sorry, this batch is full');
    }
    if (kind === 'batch' && item.status === 'completed') throw new HttpError(400, 'This batch has completed');
    // Reuse an existing pending manual order instead of creating duplicates
    const pending = await Order.findOne({ user: req.user._id, refId: item._id, status: 'pending' }).lean();
    if (pending && !razorpayEnabled()) return res.json({ manual: true, orderId: pending._id, amount: pending.amount });
    res.json(await startCheckout({ kind, item, user: req.user }));
  })
);

/* Public webinar registration (no account needed) */
const regLimiter = rateLimit({ windowMs: 60 * 60 * 1000, limit: 20, message: { message: 'Too many registrations from this network' } });

router.post(
  '/webinars/:key/register',
  regLimiter,
  asyncHandler(async (req, res) => {
    const w = await Webinar.findOne({ ...byKey(req.params.key), published: true }).lean();
    if (!w) throw new HttpError(404, 'Webinar not found');
    const name = s(req.body?.name, 100);
    const email = s(req.body?.email, 150).toLowerCase();
    const phone = s(req.body?.phone, 20);
    const city = s(req.body?.city, 80);
    if (!name) throw new HttpError(400, 'Name is required');
    if (!EMAIL_RX.test(email)) throw new HttpError(400, 'Valid email is required');
    if (!PHONE_RX.test(phone)) throw new HttpError(400, 'Valid phone number is required');
    if (new Date(w.startsAt).getTime() + w.durationMins * 60000 < Date.now()) throw new HttpError(400, 'This webinar has ended');

    const info = { title: w.title, startsAt: w.startsAt, durationMins: w.durationMins, platform: w.platform };
    const existing = await WebinarRegistration.findOne({ webinar: w._id, email });
    const free = !w.price;
    if (existing && (free || existing.paid)) return res.json({ registered: true, already: true, joinLink: w.joinLink, webinar: info });

    if (w.seats) {
      const count = await WebinarRegistration.countDocuments({ webinar: w._id, status: { $ne: 'cancelled' } });
      if (count >= w.seats) throw new HttpError(400, 'Sorry, all seats are booked');
    }

    if (free) {
      await WebinarRegistration.create({ webinar: w._id, name, email, phone, city });
      return res.status(201).json({ registered: true, joinLink: w.joinLink, webinar: info });
    }
    // Paid webinar: keep a lead record, then start payment
    if (!existing) await WebinarRegistration.create({ webinar: w._id, name, email, phone, city, paid: false });
    res.json(await startCheckout({ kind: 'webinar', item: w, guest: { name, email, phone } }));
  })
);

/* Razorpay success callback from the browser */
router.post(
  '/checkout/verify',
  asyncHandler(async (req, res) => {
    const { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: sig } = req.body || {};
    if (!verifyCheckoutSignature(orderId, paymentId, sig)) throw new HttpError(400, 'Payment verification failed');
    const order = await Order.findOne({ razorpayOrderId: String(orderId) });
    if (!order) throw new HttpError(404, 'Order not found');
    order.razorpayPaymentId = String(paymentId);
    await fulfillOrder(order);
    const out = { success: true, kind: order.kind };
    if (order.kind === 'webinar') {
      const w = await Webinar.findById(order.refId).lean();
      Object.assign(out, { joinLink: w?.joinLink, webinar: w && { title: w.title, startsAt: w.startsAt, durationMins: w.durationMins, platform: w.platform } });
    }
    res.json(out);
  })
);

/* Razorpay webhook (Dashboard → Webhooks → events: payment.captured, order.paid) */
router.post(
  '/checkout/webhook',
  asyncHandler(async (req, res) => {
    if (!verifyWebhookSignature(req.rawBody, req.headers['x-razorpay-signature'])) throw new HttpError(400, 'Invalid signature');
    const payment = req.body?.payload?.payment?.entity;
    if (payment?.order_id && ['payment.captured', 'order.paid'].includes(req.body.event)) {
      const order = await Order.findOne({ razorpayOrderId: payment.order_id });
      if (order) {
        order.razorpayPaymentId = payment.id;
        await fulfillOrder(order);
      }
    }
    res.json({ ok: true });
  })
);

/* Public certificate verification */
router.get(
  '/certificates/:id',
  asyncHandler(async (req, res) => {
    const e = await Enrollment.findOne({ _id: oid(req.params.id), kind: 'course', status: 'active', completedAt: { $ne: null } })
      .populate('user', 'name')
      .populate('course', 'title instructor certificate')
      .lean();
    if (!e || !e.course?.certificate) throw new HttpError(404, 'Certificate not found');
    res.json({ id: e._id, studentName: e.user?.name, courseTitle: e.course.title, instructor: e.course.instructor?.name, completedAt: e.completedAt });
  })
);

/* ============================ Webinars (CRUD after custom routes) ============================ */
router.use('/webinars', crudRouter(Webinar, { filterFields: [], sort: { startsAt: -1 }, transform: publicWebinar }));

/* ============================ Admin: LMS management ============================ */
const admin = Router();
admin.use(protect);

admin.get(
  '/lms-stats',
  asyncHandler(async (_req, res) => {
    const [students, enrollments, pendingOrders, revenueAgg, upcomingWebinars, upcomingClasses] = await Promise.all([
      User.countDocuments(),
      Enrollment.countDocuments({ status: 'active' }),
      Order.countDocuments({ status: 'pending' }),
      Order.aggregate([{ $match: { status: 'paid' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      Webinar.find({ startsAt: { $gte: new Date() } }).sort({ startsAt: 1 }).limit(3).select('title startsAt').lean(),
      LiveSession.find({ startsAt: { $gte: new Date(Date.now() - 2 * 3600000) } }).sort({ startsAt: 1 }).limit(5).populate('batch', 'title').lean(),
    ]);
    for (const w of upcomingWebinars) w.registrations = await WebinarRegistration.countDocuments({ webinar: w._id });
    res.json({ students, enrollments, pendingOrders, revenue: revenueAgg[0]?.total || 0, upcomingWebinars, upcomingClasses });
  })
);

/* Students */
admin.get(
  '/students',
  asyncHandler(async (req, res) => {
    const q = typeof req.query.search === 'string' && req.query.search.trim() ? new RegExp(escapeRegex(req.query.search.trim()), 'i') : null;
    const users = await User.find(q ? { $or: [{ name: q }, { email: q }, { phone: q }] } : {}).sort({ createdAt: -1 }).limit(500).lean();
    const counts = await Enrollment.aggregate([{ $match: { status: 'active' } }, { $group: { _id: '$user', n: { $sum: 1 } } }]);
    const map = Object.fromEntries(counts.map((c) => [String(c._id), c.n]));
    res.json(users.map((u) => ({ ...u, enrollments: map[String(u._id)] || 0 })));
  })
);

admin.post(
  '/students',
  asyncHandler(async (req, res) => {
    const email = s(req.body?.email, 150).toLowerCase();
    if (!EMAIL_RX.test(email)) throw new HttpError(400, 'Valid email is required');
    if (await User.exists({ email })) throw new HttpError(409, 'Student with this email already exists');
    const password = String(req.body?.password || '');
    if (password.length < 6) throw new HttpError(400, 'Password must be at least 6 characters');
    const u = await User.create({ name: s(req.body?.name, 100), email, phone: s(req.body?.phone, 20), password });
    res.status(201).json(studentDto(u));
  })
);

admin.get(
  '/students/:id',
  asyncHandler(async (req, res) => {
    const user = await User.findById(oid(req.params.id)).lean();
    if (!user) throw new HttpError(404, 'Student not found');
    const enrollments = await Enrollment.find({ user: user._id }).populate('course', 'title slug sections').populate('batch', 'title slug').sort({ createdAt: -1 }).lean();
    const orders = await Order.find({ user: user._id }).sort({ createdAt: -1 }).lean();
    res.json({
      user,
      enrollments: enrollments.map((e) => ({
        ...e,
        course: e.course && { _id: e.course._id, title: e.course.title, slug: e.course.slug, lessonsCount: courseStats(e.course).lessonsCount },
      })),
      orders,
    });
  })
);

admin.put(
  '/students/:id',
  asyncHandler(async (req, res) => {
    const u = await User.findById(oid(req.params.id));
    if (!u) throw new HttpError(404, 'Student not found');
    if (req.body?.name) u.name = s(req.body.name, 100);
    if (req.body?.phone !== undefined) u.phone = s(req.body.phone, 20);
    if (typeof req.body?.active === 'boolean') u.active = req.body.active;
    if (req.body?.password) {
      if (String(req.body.password).length < 6) throw new HttpError(400, 'Password must be at least 6 characters');
      u.password = String(req.body.password);
    }
    await u.save();
    res.json(studentDto(u));
  })
);

/* Manual enrollment (offline / cash / UPI payments) */
admin.post(
  '/enrollments',
  asyncHandler(async (req, res) => {
    const kind = req.body?.kind === 'batch' ? 'batch' : 'course';
    const user = await User.findById(oid(req.body?.userId));
    if (!user) throw new HttpError(404, 'Student not found');
    const item = await (kind === 'batch' ? Batch : OnlineCourse).findById(oid(req.body?.refId));
    if (!item) throw new HttpError(404, `${kind} not found`);
    const e = await Enrollment.findOneAndUpdate(
      { user: user._id, [kind]: item._id },
      { $set: { status: 'active', kind }, $setOnInsert: { source: 'admin' } },
      { upsert: true, new: true }
    );
    res.status(201).json(e);
  })
);

admin.patch(
  '/enrollments/:id',
  asyncHandler(async (req, res) => {
    const e = await Enrollment.findById(oid(req.params.id));
    if (!e) throw new HttpError(404, 'Not found');
    if (['active', 'revoked'].includes(req.body?.status)) e.status = req.body.status;
    await e.save();
    res.json(e);
  })
);

/* Orders */
admin.get(
  '/orders',
  asyncHandler(async (req, res) => {
    const q = typeof req.query.status === 'string' && req.query.status ? { status: req.query.status } : {};
    res.json(await Order.find(q).populate('user', 'name email phone').sort({ createdAt: -1 }).limit(500).lean());
  })
);

admin.post(
  '/orders/:id/approve',
  asyncHandler(async (req, res) => {
    const order = await Order.findById(oid(req.params.id));
    if (!order) throw new HttpError(404, 'Order not found');
    if (req.body?.notes) order.notes = s(req.body.notes, 500);
    await fulfillOrder(order);
    res.json(order);
  })
);

admin.post(
  '/orders/:id/cancel',
  asyncHandler(async (req, res) => {
    const order = await Order.findById(oid(req.params.id));
    if (!order) throw new HttpError(404, 'Order not found');
    if (order.status === 'paid') throw new HttpError(400, 'Paid orders cannot be cancelled here');
    order.status = 'cancelled';
    await order.save();
    res.json(order);
  })
);

/* Batch management: students + live classes + attendance */
admin.get(
  '/batches/:id/manage',
  asyncHandler(async (req, res) => {
    const batch = await Batch.findById(oid(req.params.id)).lean();
    if (!batch) throw new HttpError(404, 'Batch not found');
    const [enrollments, sessions] = await Promise.all([
      Enrollment.find({ batch: batch._id }).populate('user', 'name email phone').sort({ createdAt: 1 }).lean(),
      LiveSession.find({ batch: batch._id }).sort({ startsAt: 1 }).lean(),
    ]);
    res.json({ batch, enrollments, sessions });
  })
);

const sessionData = (b) => ({
  title: s(b.title, 200),
  startsAt: b.startsAt ? new Date(b.startsAt) : undefined,
  durationMins: Number(b.durationMins) || 60,
  meetingLink: s(b.meetingLink, 500),
  recordingUrl: s(b.recordingUrl, 500),
  notes: s(b.notes, 2000),
});

admin.post(
  '/batches/:id/sessions',
  asyncHandler(async (req, res) => {
    const batch = await Batch.findById(oid(req.params.id));
    if (!batch) throw new HttpError(404, 'Batch not found');
    res.status(201).json(await LiveSession.create({ ...sessionData(req.body || {}), batch: batch._id }));
  })
);

admin.put(
  '/sessions/:id',
  asyncHandler(async (req, res) => {
    const x = await LiveSession.findById(oid(req.params.id));
    if (!x) throw new HttpError(404, 'Class not found');
    const data = sessionData(req.body || {});
    if (!data.startsAt) delete data.startsAt;
    x.set(data);
    if (Array.isArray(req.body?.attendees)) x.attendees = req.body.attendees.filter(oid);
    await x.save();
    res.json(x);
  })
);

admin.delete(
  '/sessions/:id',
  asyncHandler(async (req, res) => {
    await LiveSession.findByIdAndDelete(oid(req.params.id));
    res.json({ message: 'Deleted' });
  })
);

/* Webinar registrations */
admin.get(
  '/webinars/:id/registrations',
  asyncHandler(async (req, res) => {
    const webinar = await Webinar.findById(oid(req.params.id)).lean();
    if (!webinar) throw new HttpError(404, 'Webinar not found');
    const registrations = await WebinarRegistration.find({ webinar: webinar._id }).sort({ createdAt: -1 }).lean();
    res.json({ webinar, registrations });
  })
);

admin.patch(
  '/registrations/:id',
  asyncHandler(async (req, res) => {
    const r = await WebinarRegistration.findById(oid(req.params.id));
    if (!r) throw new HttpError(404, 'Not found');
    if (req.body?.status) r.status = String(req.body.status);
    if (typeof req.body?.paid === 'boolean') r.paid = req.body.paid;
    await r.save();
    res.json(r);
  })
);

admin.delete(
  '/registrations/:id',
  asyncHandler(async (req, res) => {
    await WebinarRegistration.findByIdAndDelete(oid(req.params.id));
    res.json({ message: 'Deleted' });
  })
);

router.use('/admin', admin);

export default router;
