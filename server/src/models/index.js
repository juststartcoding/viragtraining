import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { contentPlugin, slugPlugin } from './plugins.js';

const { Schema, model } = mongoose;
const str = { type: String, trim: true, default: '' };
const strList = { type: [String], default: [] };

/* ---------- Training course ---------- */
const courseSchema = new Schema({
  title: { type: String, required: true, trim: true },
  category: { ...str, default: 'Programming' },
  icon: { ...str, default: 'code' },
  image: str,
  shortDescription: str,
  description: str,
  duration: str,
  mode: { ...str, default: 'Online / Offline' },
  level: { ...str, default: 'Beginner to Advanced' },
  fee: str,
  technologies: strList,
  highlights: strList,
  syllabus: {
    type: [{ module: { type: String, trim: true }, topics: [String] }],
    default: [],
  },
});
courseSchema.plugin(contentPlugin);
courseSchema.plugin(slugPlugin);

/* ---------- Ready-made software product ---------- */
const productSchema = new Schema({
  title: { type: String, required: true, trim: true },
  category: { ...str, default: 'Business' },
  icon: { ...str, default: 'software' },
  image: str,
  shortDescription: str,
  description: str,
  features: strList,
  technologies: strList,
  price: str,
  demoUrl: str,
});
productSchema.plugin(contentPlugin);
productSchema.plugin(slugPlugin);

/* ---------- Service ---------- */
const serviceSchema = new Schema({
  title: { type: String, required: true, trim: true },
  icon: { ...str, default: 'cogs' },
  image: str,
  shortDescription: str,
  description: str,
  features: strList,
});
serviceSchema.plugin(contentPlugin);
serviceSchema.plugin(slugPlugin);

/* ---------- Client portfolio ---------- */
const portfolioSchema = new Schema({
  title: { type: String, required: true, trim: true },
  client: str,
  category: { ...str, default: 'Web Application' },
  image: str,
  description: str,
  technologies: strList,
  projectUrl: str,
});
portfolioSchema.plugin(contentPlugin);
portfolioSchema.plugin(slugPlugin);

/* ---------- Testimonial ---------- */
const testimonialSchema = new Schema({
  name: { type: String, required: true, trim: true },
  type: { type: String, enum: ['Student', 'Client'], default: 'Student' },
  designation: str,
  company: str,
  photo: str,
  message: { type: String, required: true, trim: true },
  rating: { type: Number, min: 1, max: 5, default: 5 },
});
testimonialSchema.plugin(contentPlugin);

/* ---------- Enquiry (lead) ---------- */
const enquirySchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, trim: true, lowercase: true, maxlength: 150, default: '' },
    phone: { type: String, required: true, trim: true, maxlength: 20 },
    interest: { ...str, maxlength: 150 },
    message: { ...str, maxlength: 2000 },
    source: { ...str, maxlength: 200 },
    status: { type: String, enum: ['new', 'contacted', 'converted', 'closed'], default: 'new', index: true },
    notes: str,
  },
  { timestamps: true }
);

/* ---------- Site settings (single document) ---------- */
const settingSchema = new Schema(
  {
    siteName: { ...str, default: 'Virag Training Solutions' },
    tagline: { ...str, default: 'Learn. Build. Grow.' },
    logo: str,
    phone: str,
    whatsapp: str,
    email: str,
    address: str,
    mapEmbedUrl: str,
    workingHours: str,
    showCourseFees: { type: Boolean, default: false }, // classroom course fees on the public site
    // SEO & analytics (rendered into every page's <head> by server/src/seo.js)
    seoImage: str, // default share image (1200×630) for WhatsApp/Facebook previews
    googleVerification: str, // Search Console HTML-tag code (content="…")
    bingVerification: str,
    ga4Id: str, // G-XXXXXXX
    clarityId: str,
    metaPixelId: str,
    paymentInstructions: { ...str, default: 'Pay via UPI / bank transfer and share the screenshot on WhatsApp. Your access will be activated after verification.' },
    heroTitle: str,
    heroSubtitle: str,
    heroImage: str,
    aboutTitle: str,
    aboutText: str,
    mission: str,
    vision: str,
    stats: { type: [{ label: String, value: String }], default: [] },
    socials: {
      facebook: str,
      instagram: str,
      linkedin: str,
      youtube: str,
      twitter: str,
    },
  },
  { timestamps: true }
);

/* ---------- Admin user ---------- */
const adminSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 8, select: false },
  },
  { timestamps: true }
);
adminSchema.pre('save', async function () {
  if (this.isModified('password')) this.password = await bcrypt.hash(this.password, 12);
});
adminSchema.methods.matchPassword = function (pw) {
  return bcrypt.compare(pw, this.password);
};

export const Course = model('Course', courseSchema);
export const Product = model('Product', productSchema);
export const Service = model('Service', serviceSchema);
export const Portfolio = model('Portfolio', portfolioSchema);
export const Testimonial = model('Testimonial', testimonialSchema);
export const Enquiry = model('Enquiry', enquirySchema);
export const Setting = model('Setting', settingSchema);
export const Admin = model('Admin', adminSchema);
