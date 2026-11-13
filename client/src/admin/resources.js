import { ICON_OPTIONS } from '../components/Icon';
import { inr, fmtDateTime, fmtDate } from '../lib/format';

/**
 * Admin CRUD config. Add a new content type by:
 *  1) creating a Mongoose model + one `router.use(...)` line on the server
 *  2) adding an entry here — the list page and form are generated automatically.
 *
 * Field types: text | textarea | number | select | checkbox | image | list (array of strings, one per line) | syllabus | url
 */
const common = [
  { name: 'order', label: 'Sort order', type: 'number', help: 'Lower numbers appear first' },
  { name: 'featured', label: 'Show on home page (featured)', type: 'checkbox' },
  { name: 'published', label: 'Published (visible on website)', type: 'checkbox', default: true },
];

export const resources = {
  courses: {
    label: 'Courses',
    singular: 'Course',
    endpoint: '/courses',
    publicPath: (i) => `/courses/${i.slug}`,
    columns: [
      { key: 'title', label: 'Title' },
      { key: 'category', label: 'Category' },
      { key: 'duration', label: 'Duration' },
      { key: 'fee', label: 'Fee' },
    ],
    fields: [
      { name: 'title', label: 'Course title', type: 'text', required: true, full: true },
      { name: 'slug', label: 'URL slug', type: 'text', help: 'Leave empty to auto-generate' },
      { name: 'category', label: 'Category', type: 'text', placeholder: 'Full Stack / Programming / Marketing' },
      { name: 'icon', label: 'Icon', type: 'select', options: ICON_OPTIONS },
      { name: 'duration', label: 'Duration', type: 'text', placeholder: '6 Months' },
      { name: 'mode', label: 'Mode', type: 'text', placeholder: 'Online / Offline' },
      { name: 'level', label: 'Level', type: 'text' },
      { name: 'fee', label: 'Fee', type: 'text', placeholder: '₹25,000' },
      { name: 'image', label: 'Cover image', type: 'image', full: true },
      { name: 'shortDescription', label: 'Short description', type: 'textarea', rows: 2, full: true },
      { name: 'description', label: 'Full description', type: 'textarea', rows: 6, full: true },
      { name: 'technologies', label: 'Technologies (one per line)', type: 'list' },
      { name: 'highlights', label: 'Highlights (one per line)', type: 'list' },
      { name: 'syllabus', label: 'Syllabus / curriculum', type: 'syllabus', full: true },
      ...common,
    ],
  },
  products: {
    label: 'Software Products',
    singular: 'Product',
    endpoint: '/products',
    publicPath: (i) => `/software/${i.slug}`,
    columns: [
      { key: 'title', label: 'Title' },
      { key: 'category', label: 'Category' },
      { key: 'price', label: 'Price' },
    ],
    fields: [
      { name: 'title', label: 'Product name', type: 'text', required: true, full: true },
      { name: 'slug', label: 'URL slug', type: 'text', help: 'Leave empty to auto-generate' },
      { name: 'category', label: 'Category', type: 'text', placeholder: 'Education / Retail / Healthcare' },
      { name: 'icon', label: 'Icon', type: 'select', options: ICON_OPTIONS },
      { name: 'price', label: 'Price', type: 'text', placeholder: 'Starting ₹9,999' },
      { name: 'demoUrl', label: 'Live demo URL', type: 'url', full: true },
      { name: 'image', label: 'Screenshot / image', type: 'image', full: true },
      { name: 'shortDescription', label: 'Short description', type: 'textarea', rows: 2, full: true },
      { name: 'description', label: 'Full description', type: 'textarea', rows: 6, full: true },
      { name: 'features', label: 'Features (one per line)', type: 'list' },
      { name: 'technologies', label: 'Technologies (one per line)', type: 'list' },
      ...common,
    ],
  },
  services: {
    label: 'Services',
    singular: 'Service',
    endpoint: '/services',
    columns: [{ key: 'title', label: 'Title' }, { key: 'shortDescription', label: 'Description' }],
    fields: [
      { name: 'title', label: 'Service name', type: 'text', required: true, full: true },
      { name: 'icon', label: 'Icon', type: 'select', options: ICON_OPTIONS },
      { name: 'image', label: 'Image (optional)', type: 'image' },
      { name: 'shortDescription', label: 'Short description', type: 'textarea', rows: 2, full: true },
      { name: 'description', label: 'Full description', type: 'textarea', rows: 5, full: true },
      { name: 'features', label: 'Features (one per line)', type: 'list', full: true },
      ...common,
    ],
  },
  portfolio: {
    label: 'Portfolio',
    singular: 'Project',
    endpoint: '/portfolio',
    columns: [{ key: 'title', label: 'Project' }, { key: 'client', label: 'Client' }, { key: 'category', label: 'Category' }],
    fields: [
      { name: 'title', label: 'Project title', type: 'text', required: true, full: true },
      { name: 'client', label: 'Client name', type: 'text' },
      { name: 'category', label: 'Category', type: 'text', placeholder: 'Website / Education / Retail' },
      { name: 'projectUrl', label: 'Project URL', type: 'url', full: true },
      { name: 'image', label: 'Image', type: 'image', full: true },
      { name: 'description', label: 'Description', type: 'textarea', rows: 4, full: true },
      { name: 'technologies', label: 'Technologies (one per line)', type: 'list', full: true },
      ...common,
    ],
  },
  testimonials: {
    label: 'Testimonials',
    singular: 'Testimonial',
    endpoint: '/testimonials',
    columns: [{ key: 'name', label: 'Name' }, { key: 'type', label: 'Type' }, { key: 'designation', label: 'Designation' }, { key: 'rating', label: 'Rating' }],
    fields: [
      { name: 'name', label: 'Name', type: 'text', required: true },
      { name: 'type', label: 'Type', type: 'select', options: ['Student', 'Client'] },
      { name: 'designation', label: 'Designation / Course', type: 'text' },
      { name: 'company', label: 'Company', type: 'text' },
      { name: 'rating', label: 'Rating (1-5)', type: 'number', min: 1, max: 5, default: 5 },
      { name: 'photo', label: 'Photo', type: 'image' },
      { name: 'message', label: 'Review', type: 'textarea', rows: 5, required: true, full: true },
      ...common,
    ],
  },
};

/* ======================= LMS ======================= */
resources.onlineCourses = {
  label: 'Online Courses',
  singular: 'Online Course',
  endpoint: '/online-courses',
  publicPath: (i) => `/learn/${i.slug}`,
  columns: [
    { key: 'title', label: 'Title' },
    { key: 'price', label: 'Price', format: inr },
    { key: 'sections', label: 'Lessons', format: (s = []) => s.reduce((n, x) => n + (x.lessons?.length || 0), 0) },
    { key: 'category', label: 'Category' },
  ],
  fields: [
    { name: 'title', label: 'Course title', type: 'text', required: true, full: true },
    { name: 'subtitle', label: 'Subtitle (shown under the title on the sales page)', type: 'textarea', rows: 2, full: true },
    { name: 'slug', label: 'URL slug', type: 'text', help: 'Leave empty to auto-generate' },
    { name: 'category', label: 'Category', type: 'text' },
    { name: 'price', label: 'Selling price (₹, 0 = free)', type: 'number' },
    { name: 'mrp', label: 'MRP (₹, shown struck-through)', type: 'number' },
    { name: 'offerEndsAt', label: 'Offer ends at (countdown)', type: 'datetime', help: 'Optional – shows urgency countdown' },
    { name: 'level', label: 'Level', type: 'text' },
    { name: 'language', label: 'Language', type: 'text' },
    { name: 'certificate', label: 'Give certificate on completion', type: 'checkbox', default: true },
    { name: 'thumbnail', label: 'Thumbnail', type: 'image', full: true },
    { name: 'promoVideoUrl', label: 'Promo video URL (YouTube/Vimeo)', type: 'url', full: true },
    { name: 'sections', label: 'Curriculum (sections & lessons)', type: 'curriculum', full: true },
    { name: 'description', label: 'About this course', type: 'textarea', rows: 6, full: true },
    { name: 'whatYouLearn', label: 'What you’ll learn (one per line)', type: 'list' },
    { name: 'includes', label: 'This course includes (one per line)', type: 'list' },
    { name: 'requirements', label: 'Requirements (one per line)', type: 'list' },
    { name: 'forWho', label: 'Who is this for (one per line)', type: 'list' },
    { name: 'instructor', label: 'Instructor', type: 'person', full: true },
    { name: 'faqs', label: 'FAQs', type: 'faqs', full: true },
    ...common,
  ],
};

resources.batches = {
  label: 'Live Batches',
  singular: 'Batch',
  endpoint: '/batches',
  publicPath: (i) => `/batches/${i.slug}`,
  actions: [{ label: 'Manage classes & students', to: (i) => `/admin/batches/${i._id}` }],
  columns: [
    { key: 'title', label: 'Batch' },
    { key: 'startDate', label: 'Starts', format: fmtDate },
    { key: 'price', label: 'Price', format: inr },
    { key: 'status', label: 'Status' },
  ],
  fields: [
    { name: 'title', label: 'Batch title', type: 'text', required: true, full: true },
    { name: 'subtitle', label: 'Subtitle', type: 'textarea', rows: 2, full: true },
    { name: 'slug', label: 'URL slug', type: 'text', help: 'Leave empty to auto-generate' },
    { name: 'status', label: 'Status', type: 'select', options: ['upcoming', 'ongoing', 'completed'] },
    { name: 'startDate', label: 'Start date', type: 'datetime' },
    { name: 'schedule', label: 'Schedule', type: 'text', placeholder: 'Mon–Fri, 7:00–8:30 PM' },
    { name: 'durationText', label: 'Duration', type: 'text', placeholder: '3 Months' },
    { name: 'mode', label: 'Mode', type: 'text' },
    { name: 'platform', label: 'Platform', type: 'text', placeholder: 'Google Meet / Zoom' },
    { name: 'meetingLink', label: 'Default meeting link (private – only enrolled students)', type: 'url', full: true },
    { name: 'price', label: 'Fee (₹, 0 = free)', type: 'number' },
    { name: 'mrp', label: 'MRP (₹)', type: 'number' },
    { name: 'capacity', label: 'Max students (0 = unlimited)', type: 'number' },
    { name: 'thumbnail', label: 'Thumbnail', type: 'image', full: true },
    { name: 'description', label: 'About this batch', type: 'textarea', rows: 5, full: true },
    { name: 'whatYouLearn', label: 'What you’ll learn (one per line)', type: 'list' },
    { name: 'includes', label: 'What you get (one per line)', type: 'list' },
    { name: 'trainer', label: 'Trainer', type: 'person', full: true },
    { name: 'faqs', label: 'FAQs', type: 'faqs', full: true },
    ...common,
  ],
};

resources.webinars = {
  label: 'Webinars',
  singular: 'Webinar',
  endpoint: '/webinars',
  publicPath: (i) => `/webinars/${i.slug}`,
  actions: [{ label: 'Registrations', to: (i) => `/admin/webinars/${i._id}` }],
  columns: [
    { key: 'title', label: 'Webinar' },
    { key: 'startsAt', label: 'Date & time', format: fmtDateTime },
    { key: 'price', label: 'Price', format: inr },
  ],
  fields: [
    { name: 'title', label: 'Webinar title', type: 'text', required: true, full: true },
    { name: 'subtitle', label: 'Subtitle / promise', type: 'textarea', rows: 2, full: true },
    { name: 'slug', label: 'URL slug', type: 'text', help: 'Leave empty to auto-generate' },
    { name: 'startsAt', label: 'Starts at', type: 'datetime', required: true },
    { name: 'durationMins', label: 'Duration (minutes)', type: 'number', default: 60 },
    { name: 'platform', label: 'Platform', type: 'text', placeholder: 'Zoom / Google Meet / YouTube Live' },
    { name: 'joinLink', label: 'Join link (shown only after registration)', type: 'url', full: true },
    { name: 'replayUrl', label: 'Replay / recording URL (for registered users)', type: 'url', full: true },
    { name: 'price', label: 'Price (₹, 0 = free)', type: 'number' },
    { name: 'mrp', label: 'MRP (₹)', type: 'number' },
    { name: 'seats', label: 'Seats (0 = unlimited)', type: 'number' },
    { name: 'ctaText', label: 'Button text', type: 'text', placeholder: 'Reserve My Free Seat' },
    { name: 'banner', label: 'Banner image', type: 'image', full: true },
    { name: 'description', label: 'About the webinar', type: 'textarea', rows: 5, full: true },
    { name: 'whatYouLearn', label: 'What they’ll discover (one per line)', type: 'list' },
    { name: 'bonuses', label: 'Bonuses (one per line)', type: 'list' },
    { name: 'host', label: 'Host', type: 'person', full: true },
    { name: 'faqs', label: 'FAQs', type: 'faqs', full: true },
    ...common,
  ],
};

export const emptyFor = (fields) =>
  Object.fromEntries(
    fields.map((f) => [
      f.name,
      f.default ?? (f.type === 'checkbox' ? false : f.type === 'number' ? 0 : ['list', 'syllabus', 'faqs', 'curriculum'].includes(f.type) ? [] : f.type === 'person' ? {} : f.type === 'datetime' ? null : f.type === 'select' ? f.options[0] : ''),
    ])
  );
