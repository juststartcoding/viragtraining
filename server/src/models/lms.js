import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { contentPlugin, slugPlugin } from './plugins.js';

const { Schema, model } = mongoose;
const str = { type: String, trim: true, default: '' };
const strList = { type: [String], default: [] };
const num = (d = 0) => ({ type: Number, default: d, min: 0 });

const faqSchema = new Schema({ q: str, a: str }, { _id: false });
const personSchema = new Schema({ name: str, title: str, bio: str, photo: str }, { _id: false });

/* ======================= Online (recorded) course ======================= */
const lessonSchema = new Schema({
  title: { type: String, trim: true, default: 'Untitled lesson' },
  type: { type: String, enum: ['video', 'article', 'pdf'], default: 'video' },
  videoUrl: str, // YouTube (unlisted) / Vimeo / Google Drive / direct mp4
  content: str, // article text / notes
  resourceUrl: str, // PDF / download link
  duration: num(), // minutes
  isPreview: { type: Boolean, default: false },
});
const sectionSchema = new Schema({
  title: { type: String, trim: true, default: 'New section' },
  lessons: { type: [lessonSchema], default: [] },
});

const onlineCourseSchema = new Schema({
  title: { type: String, required: true, trim: true },
  subtitle: str,
  category: { ...str, default: 'Development' },
  level: { ...str, default: 'Beginner to Advanced' },
  language: { ...str, default: 'Hindi + English' },
  thumbnail: str,
  promoVideoUrl: str,
  price: num(), // selling price (0 = free)
  mrp: num(), // shown struck-through
  offerEndsAt: { type: Date, default: null },
  description: str,
  whatYouLearn: strList,
  requirements: strList,
  forWho: strList,
  includes: strList,
  instructor: { type: personSchema, default: () => ({}) },
  faqs: { type: [faqSchema], default: [] },
  sections: { type: [sectionSchema], default: [] },
  certificate: { type: Boolean, default: true },
});
onlineCourseSchema.plugin(contentPlugin);
onlineCourseSchema.plugin(slugPlugin);

/* ======================= Live batch ======================= */
const batchSchema = new Schema({
  title: { type: String, required: true, trim: true },
  subtitle: str,
  thumbnail: str,
  description: str,
  startDate: { type: Date, default: null },
  schedule: str, // e.g. "Mon–Fri, 7:00–8:30 PM"
  durationText: str, // e.g. "3 Months"
  mode: { ...str, default: 'Live Online' },
  platform: { ...str, default: 'Google Meet' },
  meetingLink: str, // default link for every class (hidden from public)
  trainer: { type: personSchema, default: () => ({}) },
  price: num(),
  mrp: num(),
  capacity: num(), // 0 = unlimited
  status: { type: String, enum: ['upcoming', 'ongoing', 'completed'], default: 'upcoming' },
  whatYouLearn: strList,
  includes: strList,
  faqs: { type: [faqSchema], default: [] },
});
batchSchema.plugin(contentPlugin);
batchSchema.plugin(slugPlugin);

const liveSessionSchema = new Schema(
  {
    batch: { type: Schema.Types.ObjectId, ref: 'Batch', required: true, index: true },
    title: { type: String, required: true, trim: true },
    startsAt: { type: Date, required: true, index: true },
    durationMins: num(60),
    meetingLink: str, // overrides batch link
    recordingUrl: str,
    notes: str,
    attendees: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

/* ======================= Webinar ======================= */
const webinarSchema = new Schema({
  title: { type: String, required: true, trim: true },
  subtitle: str,
  banner: str,
  description: str,
  startsAt: { type: Date, required: true },
  durationMins: num(60),
  platform: { ...str, default: 'Zoom' },
  joinLink: str, // shared only after registration
  replayUrl: str,
  host: { type: personSchema, default: () => ({}) },
  price: num(), // 0 = free
  mrp: num(),
  seats: num(), // 0 = unlimited
  ctaText: { ...str, default: 'Reserve My Seat' },
  whatYouLearn: strList,
  bonuses: strList,
  faqs: { type: [faqSchema], default: [] },
});
webinarSchema.plugin(contentPlugin);
webinarSchema.plugin(slugPlugin);

const webinarRegistrationSchema = new Schema(
  {
    webinar: { type: Schema.Types.ObjectId, ref: 'Webinar', required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 150 },
    phone: { type: String, required: true, trim: true, maxlength: 20 },
    city: { ...str, maxlength: 80 },
    status: { type: String, enum: ['registered', 'attended', 'no-show', 'cancelled'], default: 'registered' },
    paid: { type: Boolean, default: false },
    amount: num(),
    order: { type: Schema.Types.ObjectId, ref: 'Order', default: null },
  },
  { timestamps: true }
);
webinarRegistrationSchema.index({ webinar: 1, email: 1 }, { unique: true });

/* ======================= Student (user) ======================= */
const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { ...str, maxlength: 20 },
    password: { type: String, required: true, minlength: 6, select: false },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);
userSchema.pre('save', async function () {
  if (this.isModified('password')) this.password = await bcrypt.hash(this.password, 12);
});
userSchema.methods.matchPassword = function (pw) {
  return bcrypt.compare(pw, this.password);
};

/* ======================= Enrollment (course or batch) ======================= */
const enrollmentSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    kind: { type: String, enum: ['course', 'batch'], required: true },
    course: { type: Schema.Types.ObjectId, ref: 'OnlineCourse', default: null },
    batch: { type: Schema.Types.ObjectId, ref: 'Batch', default: null },
    status: { type: String, enum: ['active', 'revoked'], default: 'active' },
    source: { type: String, enum: ['purchase', 'free', 'admin'], default: 'purchase' },
    completedLessons: [{ type: Schema.Types.ObjectId }],
    lastLesson: { type: Schema.Types.ObjectId, default: null },
    completedAt: { type: Date, default: null },
    order: { type: Schema.Types.ObjectId, ref: 'Order', default: null },
  },
  { timestamps: true }
);
enrollmentSchema.index({ user: 1, course: 1, batch: 1 }, { unique: true });

/* ======================= Order / payment ======================= */
const orderSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    guest: { name: str, email: str, phone: str }, // webinar buyers without an account
    kind: { type: String, enum: ['course', 'batch', 'webinar'], required: true },
    refId: { type: Schema.Types.ObjectId, required: true },
    title: str,
    amount: num(), // INR
    currency: { ...str, default: 'INR' },
    status: { type: String, enum: ['created', 'pending', 'paid', 'failed', 'cancelled'], default: 'created', index: true },
    gateway: { type: String, enum: ['razorpay', 'manual', 'free'], default: 'razorpay' },
    razorpayOrderId: { ...str, index: true },
    razorpayPaymentId: str,
    paidAt: { type: Date, default: null },
    notes: str,
  },
  { timestamps: true }
);

export const OnlineCourse = model('OnlineCourse', onlineCourseSchema);
export const Batch = model('Batch', batchSchema);
export const LiveSession = model('LiveSession', liveSessionSchema);
export const Webinar = model('Webinar', webinarSchema);
export const WebinarRegistration = model('WebinarRegistration', webinarRegistrationSchema);
export const User = model('User', userSchema);
export const Enrollment = model('Enrollment', enrollmentSchema);
export const Order = model('Order', orderSchema);
