import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { Course, Product, Service, Portfolio, Testimonial, Enquiry, Setting } from '../models/index.js';
import { crudRouter } from '../utils/crudRouter.js';
import { protect } from '../middleware/auth.js';
import { asyncHandler, HttpError } from '../utils/helpers.js';
import authRoutes from './auth.js';
import uploadRoutes from './upload.js';
import lmsRoutes from './lms.js';

const router = Router();

router.get('/health', (_req, res) => res.json({ ok: true }));
router.use('/auth', authRoutes);
router.use('/upload', uploadRoutes);

/* ---- LMS: online courses, live batches, webinars, students, orders ---- */
router.use('/', lmsRoutes);

/* ---- Content resources (add a new model + one line here to add a new section) ---- */
// Course fees are only sent to the public when Admin → Site Settings → "Show course fees" is on
const courseFees = async (course) => {
  if (await Setting.exists({ showCourseFees: true })) return course;
  const { fee, ...rest } = course;
  return rest;
};
router.use('/courses', crudRouter(Course, { searchFields: ['title', 'shortDescription', 'technologies'], transform: courseFees }));
router.use('/products', crudRouter(Product, { searchFields: ['title', 'shortDescription', 'features'] }));
router.use('/services', crudRouter(Service, { filterFields: [] }));
router.use('/portfolio', crudRouter(Portfolio, { searchFields: ['title', 'client'] }));
router.use('/testimonials', crudRouter(Testimonial, { searchFields: ['name', 'message'], filterFields: ['type'] }));

/* ---- Site settings (singleton) ---- */
const getSettings = async () => (await Setting.findOne()) || Setting.create({});

router.get('/settings', asyncHandler(async (_req, res) => res.json(await getSettings())));
router.put(
  '/settings',
  protect,
  asyncHandler(async (req, res) => {
    const s = await getSettings();
    const { _id, __v, createdAt, updatedAt, ...data } = req.body || {};
    s.set(data);
    await s.save();
    res.json(s);
  })
);

/* ---- Enquiries (public submit, admin manage) ---- */
const enquiryLimiter = rateLimit({ windowMs: 60 * 60 * 1000, limit: 10, message: { message: 'Too many enquiries. Please call us directly.' } });

router.post(
  '/enquiries',
  enquiryLimiter,
  asyncHandler(async (req, res) => {
    const pick = (k) => String(req.body?.[k] ?? '').trim();
    if (pick('website')) return res.status(201).json({ message: 'Thank you!' }); // honeypot field for bots
    const phone = pick('phone');
    if (!/^[+\d][\d\s-]{7,18}$/.test(phone)) throw new HttpError(400, 'Please enter a valid phone number');
    await Enquiry.create({
      name: pick('name'),
      email: pick('email'),
      phone,
      interest: pick('interest'),
      message: pick('message'),
      source: pick('source'),
    });
    res.status(201).json({ message: 'Thank you! Our team will contact you shortly.' });
  })
);

router.get(
  '/enquiries',
  protect,
  asyncHandler(async (req, res) => {
    const q = typeof req.query.status === 'string' && req.query.status ? { status: req.query.status } : {};
    res.json(await Enquiry.find(q).sort({ createdAt: -1 }).limit(500).lean());
  })
);

router.patch(
  '/enquiries/:id',
  protect,
  asyncHandler(async (req, res) => {
    const e = await Enquiry.findById(req.params.id);
    if (!e) throw new HttpError(404, 'Not found');
    if (req.body?.status !== undefined) e.status = String(req.body.status);
    if (req.body?.notes !== undefined) e.notes = String(req.body.notes);
    await e.save();
    res.json(e);
  })
);

router.delete(
  '/enquiries/:id',
  protect,
  asyncHandler(async (req, res) => {
    await Enquiry.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  })
);

/* ---- Dashboard stats ---- */
router.get(
  '/stats',
  protect,
  asyncHandler(async (_req, res) => {
    const [courses, products, services, portfolio, testimonials, enquiries, newEnquiries, latest] = await Promise.all([
      Course.countDocuments(),
      Product.countDocuments(),
      Service.countDocuments(),
      Portfolio.countDocuments(),
      Testimonial.countDocuments(),
      Enquiry.countDocuments(),
      Enquiry.countDocuments({ status: 'new' }),
      Enquiry.find().sort({ createdAt: -1 }).limit(6).lean(),
    ]);
    res.json({ courses, products, services, portfolio, testimonials, enquiries, newEnquiries, latest });
  })
);

export default router;
