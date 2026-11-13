/**
 * Seeds starter content. Usage:  npm run seed          (only fills empty collections)
 *                                npm run seed -- --fresh (wipes content first)
 * NOTE: Testimonials, portfolio entries and stats below are PLACEHOLDERS.
 *       Replace them with your real data from the admin panel before going live.
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from './config/db.js';
import { Course, Product, Service, Portfolio, Testimonial, Setting } from './models/index.js';
import { OnlineCourse, Batch, LiveSession, Webinar } from './models/lms.js';

const fresh = process.argv.includes('--fresh');

const courses = [
  {
    title: 'Java Full Stack Development',
    category: 'Full Stack',
    icon: 'java',
    duration: '6 Months',
    fee: '₹35,000',
    level: 'Beginner to Advanced',
    shortDescription: 'Core Java, Advanced Java, Spring Boot, Hibernate, REST APIs, React and MySQL with live projects.',
    description:
      'Become an industry-ready Java Full Stack Developer. This program takes you from Java fundamentals to building enterprise-grade applications with Spring Boot microservices and a modern React frontend.\n\nYou will work on real-world projects, learn version control, deployment and interview preparation.',
    technologies: ['Java', 'Spring Boot', 'Hibernate', 'MySQL', 'React', 'HTML/CSS', 'Git'],
    highlights: ['Live project training', 'Interview preparation', 'Placement assistance', 'Course completion certificate'],
    syllabus: [
      { module: 'Core Java', topics: ['OOPs concepts', 'Collections framework', 'Exception handling', 'Multithreading', 'Java 8+ features'] },
      { module: 'Advanced Java', topics: ['JDBC', 'Servlets & JSP', 'MVC architecture'] },
      { module: 'Spring & Spring Boot', topics: ['Dependency Injection', 'Spring MVC', 'Spring Data JPA', 'REST APIs', 'Spring Security & JWT'] },
      { module: 'Database', topics: ['SQL fundamentals', 'MySQL', 'Hibernate ORM'] },
      { module: 'Frontend', topics: ['HTML5, CSS3, JavaScript', 'Bootstrap', 'React basics'] },
      { module: 'Project & Deployment', topics: ['Git & GitHub', 'Capstone project', 'Deployment on cloud'] },
    ],
    featured: true,
    order: 1,
  },
  {
    title: 'MERN Full Stack Development',
    category: 'Full Stack',
    icon: 'react',
    duration: '6 Months',
    fee: '₹35,000',
    shortDescription: 'MongoDB, Express.js, React and Node.js – build and deploy modern full stack JavaScript apps.',
    description:
      'Master the most in-demand JavaScript stack. Build responsive frontends with React, powerful REST APIs with Node & Express and scalable databases with MongoDB.\n\nIncludes authentication, payment integration and cloud deployment.',
    technologies: ['JavaScript', 'React', 'Node.js', 'Express', 'MongoDB', 'Tailwind CSS', 'Git'],
    highlights: ['3+ real-world projects', 'Industry mentors', 'Placement assistance', 'Certificate'],
    syllabus: [
      { module: 'Web Fundamentals', topics: ['HTML5 & CSS3', 'Responsive design', 'Tailwind / Bootstrap'] },
      { module: 'JavaScript', topics: ['ES6+', 'DOM', 'Async/Await & Promises', 'Fetch API'] },
      { module: 'React.js', topics: ['Components & Hooks', 'React Router', 'State management', 'API integration'] },
      { module: 'Node.js & Express', topics: ['REST API design', 'Middleware', 'JWT authentication', 'File uploads'] },
      { module: 'MongoDB', topics: ['CRUD operations', 'Mongoose', 'Aggregation'] },
      { module: 'Deployment', topics: ['Git & GitHub', 'Hosting on cloud / VPS', 'Capstone project'] },
    ],
    featured: true,
    order: 2,
  },
  {
    title: 'Python Full Stack Development',
    category: 'Full Stack',
    icon: 'python',
    duration: '6 Months',
    fee: '₹35,000',
    shortDescription: 'Python, Django, REST Framework, React and SQL – from basics to deployable web applications.',
    description:
      'Learn Python from scratch and build complete web applications using Django and Django REST Framework with a React frontend. Also covers basics of data handling with Pandas.',
    technologies: ['Python', 'Django', 'DRF', 'React', 'PostgreSQL', 'MySQL', 'Git'],
    highlights: ['Hands-on projects', 'Placement assistance', 'Certificate'],
    syllabus: [
      { module: 'Core Python', topics: ['Data types & control flow', 'Functions & modules', 'OOPs', 'File handling'] },
      { module: 'Advanced Python', topics: ['Exception handling', 'Decorators & generators', 'Pandas basics'] },
      { module: 'Django', topics: ['Models, Views, Templates', 'Admin panel', 'Authentication', 'Django REST Framework'] },
      { module: 'Frontend', topics: ['HTML, CSS, JavaScript', 'React basics'] },
      { module: 'Project', topics: ['Capstone project', 'Deployment'] },
    ],
    featured: true,
    order: 3,
  },
  {
    title: 'PHP Full Stack Development',
    category: 'Full Stack',
    icon: 'php',
    duration: '4 Months',
    fee: '₹25,000',
    shortDescription: 'PHP, MySQL, Laravel, JavaScript and WordPress – build dynamic websites and web apps.',
    description:
      'Build dynamic, database-driven websites and web applications with PHP and Laravel. Also learn WordPress customization to start freelancing quickly.',
    technologies: ['PHP', 'MySQL', 'Laravel', 'JavaScript', 'jQuery', 'Bootstrap', 'WordPress'],
    highlights: ['Live projects', 'Freelancing guidance', 'Certificate'],
    syllabus: [
      { module: 'Web Basics', topics: ['HTML5, CSS3', 'JavaScript & jQuery', 'Bootstrap'] },
      { module: 'Core PHP', topics: ['Syntax & arrays', 'Forms & sessions', 'OOPs in PHP'] },
      { module: 'MySQL', topics: ['Database design', 'CRUD with PDO'] },
      { module: 'Laravel', topics: ['MVC & routing', 'Eloquent ORM', 'Authentication', 'REST APIs'] },
      { module: 'WordPress', topics: ['Themes & plugins', 'Customization'] },
    ],
    featured: true,
    order: 4,
  },
  {
    title: 'C and C++ Programming',
    category: 'Programming',
    icon: 'cpp',
    duration: '3 Months',
    fee: '₹10,000',
    level: 'Beginner',
    shortDescription: 'Build strong programming fundamentals with C, C++, OOPs and Data Structures.',
    description:
      'The perfect starting point for students and beginners. Develop logic building and problem-solving skills with C and C++, and learn data structures used in coding interviews.',
    technologies: ['C', 'C++', 'STL', 'Data Structures'],
    highlights: ['Logic building', 'Ideal for college students', 'Certificate'],
    syllabus: [
      { module: 'C Programming', topics: ['Variables & operators', 'Control statements', 'Arrays & strings', 'Functions', 'Pointers', 'Structures & file handling'] },
      { module: 'C++ Programming', topics: ['Classes & objects', 'Inheritance & polymorphism', 'Templates', 'STL'] },
      { module: 'Data Structures', topics: ['Linked lists', 'Stacks & queues', 'Trees', 'Sorting & searching'] },
    ],
    featured: true,
    order: 5,
  },
  {
    title: 'Digital Marketing',
    category: 'Marketing',
    icon: 'marketing',
    duration: '3 Months',
    fee: '₹15,000',
    shortDescription: 'SEO, Social Media, Google Ads, Meta Ads, Content and Email Marketing with live campaigns.',
    description:
      'Learn to grow businesses online. Plan and run real campaigns on Google and social platforms, optimize websites for search engines and measure results with analytics.',
    technologies: ['SEO', 'Google Ads', 'Meta Ads', 'Google Analytics', 'Canva', 'WordPress'],
    highlights: ['Live campaigns', 'Freelancing & agency guidance', 'Certificate'],
    syllabus: [
      { module: 'Fundamentals', topics: ['Digital marketing overview', 'Website basics with WordPress'] },
      { module: 'SEO', topics: ['Keyword research', 'On-page & off-page SEO', 'Local SEO / Google Business Profile'] },
      { module: 'Social Media Marketing', topics: ['Facebook & Instagram', 'LinkedIn', 'Content planning'] },
      { module: 'Paid Ads', topics: ['Google Ads', 'Meta Ads', 'Campaign optimization'] },
      { module: 'Analytics & More', topics: ['Google Analytics', 'Email marketing', 'Freelancing'] },
    ],
    featured: true,
    order: 6,
  },
];

const services = [
  {
    title: 'Custom Software Development',
    icon: 'cogs',
    shortDescription: 'Tailor-made software built around your business processes – web, desktop and mobile.',
    description: 'We analyse your requirements and build secure, scalable software that fits exactly how your business works – from ERP and CRM to automation tools.',
    features: ['Requirement analysis', 'UI/UX design', 'Web & mobile apps', 'Maintenance & support'],
    featured: true,
    order: 1,
  },
  {
    title: 'Major & Minor Projects',
    icon: 'project',
    shortDescription: 'Academic projects for B.Tech, BCA, MCA, M.Tech & diploma students with guidance.',
    description: 'Get industry-standard academic projects with source code, documentation, report and complete explanation so you can present with confidence.',
    features: ['Java, Python, PHP, MERN, Android', 'Source code + documentation', 'Project report & PPT', 'One-to-one explanation'],
    featured: true,
    order: 2,
  },
  {
    title: 'Ready-made Software',
    icon: 'software',
    shortDescription: 'Proven, ready-to-deploy software products customised with your branding.',
    description: 'Save time and cost with our ready-made solutions for schools, clinics, retail, coaching institutes and more – quickly customised for your needs.',
    features: ['Quick deployment', 'Custom branding', 'Training & support', 'Affordable pricing'],
    featured: true,
    order: 3,
  },
  {
    title: 'Website Development',
    icon: 'web',
    shortDescription: 'Fast, responsive and SEO-friendly business websites and e-commerce stores.',
    description: 'From business websites to full e-commerce platforms, we design and develop websites that load fast and convert visitors into customers.',
    features: ['Responsive design', 'SEO ready', 'E-commerce & payments', 'Admin panel'],
    featured: true,
    order: 4,
  },
];

const products = [
  {
    title: 'School Management System',
    category: 'Education',
    icon: 'school',
    price: 'Starting ₹19,999',
    shortDescription: 'Admissions, fees, attendance, exams, results and parent communication in one place.',
    description: 'A complete ERP for schools and colleges with role-based access for admin, teachers, students and parents.',
    features: ['Student admission & records', 'Fee management & receipts', 'Attendance', 'Exams & report cards', 'SMS / WhatsApp notifications'],
    technologies: ['MERN', 'MySQL'],
    featured: true,
    order: 1,
  },
  {
    title: 'Billing & Inventory (GST)',
    category: 'Retail',
    icon: 'invoice',
    price: 'Starting ₹9,999',
    shortDescription: 'GST billing, stock management, purchase, sales and reports for shops & distributors.',
    description: 'Fast GST-ready billing software with barcode support, inventory tracking and detailed business reports.',
    features: ['GST invoices', 'Barcode billing', 'Stock alerts', 'Purchase & sales reports', 'Multi-user'],
    technologies: ['React', 'Node.js'],
    featured: true,
    order: 2,
  },
  {
    title: 'Hospital / Clinic Management',
    category: 'Healthcare',
    icon: 'hospital',
    price: 'Starting ₹24,999',
    shortDescription: 'OPD, IPD, appointments, prescriptions, billing and pharmacy management.',
    description: 'Digitise your clinic or hospital with patient records, appointment booking, billing and pharmacy modules.',
    features: ['Patient registration', 'Appointments', 'Prescriptions', 'Billing', 'Pharmacy stock'],
    technologies: ['MERN'],
    featured: true,
    order: 3,
  },
  {
    title: 'Coaching Institute Management',
    category: 'Education',
    icon: 'graduation',
    price: 'Starting ₹14,999',
    shortDescription: 'Enquiries, batches, fees, attendance and online tests for coaching centres.',
    description: 'Manage your coaching institute end-to-end – from lead management to batch scheduling and fee reminders.',
    features: ['Lead / enquiry tracking', 'Batch management', 'Fee reminders', 'Online tests'],
    technologies: ['MERN'],
    featured: true,
    order: 4,
  },
  {
    title: 'CRM Software',
    category: 'Business',
    icon: 'users',
    price: 'On request',
    shortDescription: 'Track leads, follow-ups, deals and team performance.',
    description: 'A simple yet powerful CRM to help your sales team never miss a follow-up.',
    features: ['Lead pipeline', 'Follow-up reminders', 'Team management', 'Reports'],
    technologies: ['React', 'Node.js', 'MongoDB'],
    order: 5,
  },
  {
    title: 'E-commerce Website',
    category: 'Retail',
    icon: 'cart',
    price: 'Starting ₹29,999',
    shortDescription: 'Online store with product catalogue, cart, payment gateway and order management.',
    description: 'Launch your online store with a modern storefront and powerful admin dashboard.',
    features: ['Product catalogue', 'Cart & checkout', 'Payment gateway', 'Order tracking', 'Admin dashboard'],
    technologies: ['MERN'],
    order: 6,
  },
];

// PLACEHOLDER content – replace with real entries
const portfolio = [
  { title: 'School ERP Implementation', client: 'Sample Client – School', category: 'Education', description: 'Complete school ERP with fee and exam modules.', technologies: ['MERN'], featured: true, order: 1 },
  { title: 'Retail Billing System', client: 'Sample Client – Retail', category: 'Retail', description: 'GST billing & inventory for a multi-store retailer.', technologies: ['React', 'Node.js'], featured: true, order: 2 },
  { title: 'Corporate Website', client: 'Sample Client – Services', category: 'Website', description: 'SEO-friendly corporate website with lead capture.', technologies: ['React', 'Tailwind'], featured: true, order: 3 },
];

// PLACEHOLDER content – replace with real testimonials from your students/clients
const testimonials = [
  { name: 'Sample Student', type: 'Student', designation: 'MERN Stack Trainee', message: 'Replace this with a real student review from the admin panel. Practical training with live projects helped me become job ready.', rating: 5, featured: true, order: 1 },
  { name: 'Sample Client', type: 'Client', designation: 'Business Owner', company: 'Sample Company', message: 'Replace this with a real client review. The team delivered our software on time and supports us well.', rating: 5, featured: true, order: 2 },
  { name: 'Sample Student 2', type: 'Student', designation: 'Java Full Stack Trainee', message: 'Replace this with a real student review. Trainers explain every concept clearly with examples.', rating: 5, featured: true, order: 3 },
];

const settings = {
  siteName: 'Virag Training Solutions',
  tagline: 'Learn. Build. Grow.',
  phone: '+91 00000 00000',
  whatsapp: '910000000000',
  email: 'info@viragtrainingsolutions.com',
  address: 'Your office address, City, State – PIN',
  workingHours: 'Mon – Sat: 9:00 AM – 7:00 PM',
  heroTitle: 'Become an Industry-Ready Developer',
  heroSubtitle:
    'Job-oriented training in Java, MERN, Python, PHP, C/C++ & Digital Marketing – plus custom software, academic projects and ready-made software for your business.',
  aboutTitle: 'Training & Software Solutions under one roof',
  aboutText:
    'Virag Training Solutions is an IT training and software development company. We train students and professionals with practical, project-based learning and build reliable software for businesses.\n\nOur trainers are working developers, so every course is aligned with what the industry actually uses.',
  mission: 'To make quality, practical IT education accessible and help every learner build a successful career.',
  vision: 'To be the most trusted partner for IT skills and software solutions.',
  stats: [
    { label: 'Students Trained', value: '1000+' },
    { label: 'Projects Delivered', value: '200+' },
    { label: 'Ready-made Software', value: '10+' },
    { label: 'Years Experience', value: '5+' },
  ],
};

const day = 24 * 3600 * 1000;
const at = (days, h = 19, m = 0) => {
  const d = new Date(Date.now() + days * day);
  d.setHours(h, m, 0, 0);
  return d;
};

// SAMPLE LMS content – edit from Admin → Online Courses / Live Batches / Webinars
const onlineCourses = [
  {
    title: 'MERN Stack Masterclass – Build 5 Real Projects',
    subtitle: 'Learn MongoDB, Express, React & Node.js from zero and become a job-ready full stack developer.',
    category: 'Web Development',
    price: 2999,
    mrp: 9999,
    offerEndsAt: new Date(Date.now() + 5 * day),
    description: 'A complete, project-based recorded course. Watch at your own pace, practise with assignments and get a certificate on completion.',
    whatYouLearn: ['Build responsive UIs with React & Tailwind', 'Create secure REST APIs with Node & Express', 'Design MongoDB databases with Mongoose', 'JWT authentication & role-based access', 'Payment gateway integration', 'Deploy full stack apps to the cloud'],
    requirements: ['A laptop with internet', 'Basic computer knowledge – no coding experience needed'],
    forWho: ['College students (BCA, B.Tech, MCA)', 'Freshers looking for a developer job', 'Working professionals switching to IT'],
    includes: ['40+ hours of HD video', 'Downloadable source code', 'Assignments & quizzes', 'Lifetime access', 'Certificate of completion', 'WhatsApp doubt support'],
    instructor: { name: 'Lead Trainer', title: 'Senior Full Stack Developer', bio: 'Replace with your trainer bio from the admin panel.' },
    faqs: [
      { q: 'How long do I get access?', a: 'Lifetime access, including all future updates.' },
      { q: 'Will I get a certificate?', a: 'Yes, a certificate is generated automatically once you complete all lessons.' },
      { q: 'What if I have doubts?', a: 'You can ask doubts on our WhatsApp support group.' },
    ],
    sections: [
      { title: 'Getting Started', lessons: [
        { title: 'Welcome & course overview', type: 'video', duration: 6, isPreview: true },
        { title: 'Setting up VS Code, Node & Git', type: 'video', duration: 14, isPreview: true },
        { title: 'Course resources', type: 'article', content: 'All source code and notes are shared in each section.', duration: 2 },
      ] },
      { title: 'JavaScript & React Fundamentals', lessons: [
        { title: 'Modern JavaScript (ES6+)', type: 'video', duration: 35 },
        { title: 'React components, props & state', type: 'video', duration: 42 },
        { title: 'Hooks deep dive', type: 'video', duration: 38 },
      ] },
      { title: 'Backend with Node, Express & MongoDB', lessons: [
        { title: 'Building a REST API', type: 'video', duration: 40 },
        { title: 'MongoDB & Mongoose', type: 'video', duration: 36 },
        { title: 'JWT authentication', type: 'video', duration: 30 },
      ] },
    ],
    featured: true,
  },
];

const batches = [
  {
    title: 'Java Full Stack – Live Weekend Batch',
    subtitle: 'Live interactive classes with a mentor, assignments, projects and placement support.',
    startDate: at(7),
    schedule: 'Sat & Sun, 10:00 AM – 1:00 PM',
    durationText: '6 Months',
    price: 24999,
    mrp: 35000,
    capacity: 30,
    meetingLink: 'https://meet.google.com/your-meeting-link',
    description: 'Learn Java Full Stack in a small live batch with personal attention. Every class is recorded so you never miss anything.',
    whatYouLearn: ['Core & Advanced Java', 'Spring Boot & REST APIs', 'React frontend', 'MySQL & Hibernate', 'Capstone project'],
    includes: ['Live interactive classes', 'Class recordings', 'Assignments & projects', 'Mock interviews', 'Certificate'],
    trainer: { name: 'Lead Trainer', title: 'Java Architect', bio: 'Replace with your trainer bio.' },
    faqs: [{ q: 'What if I miss a class?', a: 'Every class recording is available in your dashboard.' }],
    featured: true,
  },
];

const webinars = [
  {
    title: 'Free Masterclass: How to Become a Full Stack Developer in 2026',
    subtitle: 'A 90-minute live session with a clear roadmap, live coding demo and career Q&A.',
    startsAt: at(5, 19, 0),
    durationMins: 90,
    platform: 'Zoom',
    joinLink: 'https://zoom.us/j/your-meeting-id',
    price: 0,
    seats: 500,
    ctaText: 'Reserve My Free Seat',
    description: 'Confused about where to start? In this free live masterclass we will share a step-by-step roadmap to become a full stack developer and land your first job.',
    whatYouLearn: ['The exact skills companies hire for', 'Java vs MERN vs Python – which to choose', 'Live demo: build an app in 20 minutes', 'How to build a portfolio that gets interviews'],
    bonuses: ['Free roadmap PDF', 'Interview question bank', 'Certificate of participation'],
    host: { name: 'Lead Trainer', title: 'Senior Developer & Mentor', bio: 'Replace with host bio.' },
    faqs: [{ q: 'Is it really free?', a: 'Yes, 100% free. Just register to get the joining link.' }, { q: 'Will there be a recording?', a: 'Attend live for the best experience and bonuses.' }],
    featured: true,
  },
];

async function fill(Model, docs) {
  if (fresh) await Model.deleteMany({});
  if (await Model.estimatedDocumentCount()) return console.log(`- ${Model.modelName}: already has data, skipped`);
  for (const d of docs) await Model.create(d); // create() one by one so slug hooks run
  console.log(`+ ${Model.modelName}: ${docs.length} added`);
}

try {
  await connectDB();
  await fill(Course, courses);
  await fill(Service, services);
  await fill(Product, products);
  await fill(Portfolio, portfolio);
  await fill(Testimonial, testimonials);
  await fill(OnlineCourse, onlineCourses);
  await fill(Webinar, webinars);
  if (fresh) await LiveSession.deleteMany({});
  if (!(await Batch.estimatedDocumentCount()) || fresh) {
    await fill(Batch, batches);
    const b = await Batch.findOne();
    if (b && !(await LiveSession.exists({ batch: b._id }))) {
      await LiveSession.create([
        { batch: b._id, title: 'Orientation & Java setup', startsAt: at(7, 10), durationMins: 180 },
        { batch: b._id, title: 'Java basics – variables, data types, operators', startsAt: at(8, 10), durationMins: 180 },
        { batch: b._id, title: 'Control statements & loops', startsAt: at(14, 10), durationMins: 180 },
      ]);
      console.log('+ LiveSession: 3 added');
    }
  } else console.log('- Batch: already has data, skipped');
  if (fresh) await Setting.deleteMany({});
  // The site may already have created an empty settings doc on first visit: fill only blank fields
  const s = (await Setting.findOne()) || new Setting();
  const filled = [];
  for (const [k, v] of Object.entries(settings)) {
    const cur = s.get(k);
    if (cur === undefined || cur === '' || (Array.isArray(cur) && cur.length === 0)) {
      s.set(k, v);
      filled.push(k);
    }
  }
  await s.save();
  console.log(filled.length ? `+ Settings: filled ${filled.join(', ')}` : '- Settings: already filled, skipped');
  console.log('Seed complete.');
} catch (e) {
  console.error(e);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
