/**
 * Server-side SEO for the React single-page app.
 *  - /robots.txt and a database-driven /sitemap.xml
 *  - Every page's HTML gets the right <title>, description, canonical URL,
 *    Open Graph / Twitter tags (WhatsApp, Facebook, LinkedIn previews) and
 *    schema.org JSON-LD, before any JavaScript runs.
 *  - Search Console / Bing verification and GA4, Clarity, Meta Pixel snippets
 *    from Admin → Site Settings.
 */
import fs from 'fs';
import path from 'path';
import { Router } from 'express';
import { Course, Product, Setting } from './models/index.js';
import { OnlineCourse, Batch, Webinar } from './models/lms.js';

/* ------------------------------ helpers ------------------------------ */
const esc = (s = '') => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const clip = (s = '', n = 160) => {
  const t = String(s || '').replace(/\s+/g, ' ').trim();
  return t.length > n ? `${t.slice(0, n - 1).trimEnd()}…` : t;
};
// JSON inside <script>: escape "<" so content can never close the tag
const jsonLd = (o) => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, '\\u003c')}</script>`;
const clean = (o) => JSON.parse(JSON.stringify(o)); // drop undefined keys

export const baseUrl = (req) =>
  (process.env.SITE_URL || `${process.env.NODE_ENV === 'production' ? 'https' : req.protocol}://${req.get('host')}`).replace(/\/$/, '');

let cache = { at: 0, data: null };
export const clearSeoCache = () => {
  cache.at = 0;
};
async function settings() {
  if (cache.data && Date.now() - cache.at < 60_000) return cache.data;
  cache = { at: Date.now(), data: (await Setting.findOne().lean()) || {} };
  return cache.data;
}

const NOINDEX = /^\/(admin|dashboard|login|register|certificate)(\/|$)|^\/learn\/[^/]+\/watch\/?$/;

const STATIC = {
  '/': { title: 'IT Training & Software Solutions', description: null },
  '/courses': { title: 'Training Courses', description: 'Job-oriented Java, MERN, Python, PHP Full Stack, C/C++ and Digital Marketing training with live projects and placement assistance.' },
  '/learn': { title: 'Online Courses', description: 'Self-paced online courses with lifetime access, real projects and a certificate on completion.' },
  '/batches': { title: 'Live Batches', description: 'Join live, mentor-led online batches with class recordings, assignments and placement support.' },
  '/webinars': { title: 'Webinars & Masterclasses', description: 'Free and paid live webinars on programming, careers and digital marketing.' },
  '/software': { title: 'Ready-made Software', description: 'Ready-to-deploy software for schools, hospitals, retail, coaching institutes and businesses.' },
  '/services': { title: 'Software Services', description: 'Custom software development, major & minor academic projects, website development and ready-made software.' },
  '/portfolio': { title: 'Portfolio', description: 'Software and websites delivered by our team.' },
  '/testimonials': { title: 'Testimonials', description: 'What our students and clients say about us.' },
  '/about': { title: 'About Us', description: null },
  '/contact': { title: 'Contact Us', description: 'Contact us for course admissions and software requirements.' },
  '/login': { title: 'Student Login' },
  '/register': { title: 'Create Account' },
  '/dashboard': { title: 'My Dashboard' },
};

/* ------------------------------ schema.org ------------------------------ */
function organization(s, base, abs) {
  const socials = Object.values(s.socials || {}).filter((u) => /^https?:\/\//.test(u || ''));
  return clean({
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    '@id': `${base}/#organization`,
    name: s.siteName || 'Virag Training Solutions',
    url: base,
    logo: abs(s.logo) || `${base}/og-default.jpg`,
    image: abs(s.seoImage) || `${base}/og-default.jpg`,
    description: s.tagline || undefined,
    telephone: s.phone || undefined,
    email: s.email || undefined,
    address: s.address ? { '@type': 'PostalAddress', streetAddress: s.address, addressCountry: 'IN' } : undefined,
    sameAs: socials.length ? socials : undefined,
  });
}

const breadcrumbs = (base, items) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [['Home', '/'], ...items].map(([name, p], i) => ({ '@type': 'ListItem', position: i + 1, name, item: `${base}${p}` })),
});

const faqPage = (faqs = []) => {
  const list = faqs.filter((f) => f.q && f.a);
  return list.length
    ? { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: list.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) }
    : null;
};

const offer = (price, url) =>
  clean({ '@type': 'Offer', price: String(Number(price) || 0), priceCurrency: 'INR', category: Number(price) > 0 ? 'Paid' : 'Free', availability: 'https://schema.org/InStock', url });

function courseLd({ name, description, url, image, provider, offers, instance }) {
  return clean({
    '@context': 'https://schema.org',
    '@type': 'Course',
    name,
    description: clip(description, 300) || name,
    url,
    image: image || undefined,
    provider: { '@type': 'Organization', name: provider.name, sameAs: provider.url },
    offers: offers || undefined,
    hasCourseInstance: instance ? [instance] : undefined,
  });
}

/* ------------------------------ detail pages ------------------------------ */
const DETAIL = [
  {
    rx: /^\/courses\/([^/]+)\/?$/,
    async load(slug, ctx) {
      const c = await Course.findOne({ slug, published: true }).lean();
      if (!c) return null;
      const mode = /online/i.test(c.mode) && /offline/i.test(c.mode) ? 'Blended' : /online/i.test(c.mode) ? 'Online' : 'Onsite';
      return {
        title: c.title,
        description: c.shortDescription || c.description,
        image: c.image,
        ld: [
          courseLd({ name: c.title, description: c.description || c.shortDescription, url: ctx.url, image: ctx.abs(c.image), provider: ctx.provider, instance: { '@type': 'CourseInstance', courseMode: mode } }),
          breadcrumbs(ctx.base, [['Courses', '/courses'], [c.title, ctx.path]]),
        ],
      };
    },
  },
  {
    rx: /^\/learn\/([^/]+)\/?$/,
    async load(slug, ctx) {
      const c = await OnlineCourse.findOne({ slug, published: true }).lean();
      if (!c) return null;
      const mins = (c.sections || []).flatMap((s) => s.lessons || []).reduce((n, l) => n + (l.duration || 0), 0);
      return {
        title: c.title,
        description: c.subtitle || c.description,
        image: c.thumbnail,
        ld: [
          courseLd({
            name: c.title,
            description: c.description || c.subtitle,
            url: ctx.url,
            image: ctx.abs(c.thumbnail),
            provider: ctx.provider,
            offers: offer(c.price, ctx.url),
            instance: clean({ '@type': 'CourseInstance', courseMode: 'Online', courseWorkload: mins ? `PT${Math.max(1, Math.round(mins / 60))}H` : undefined }),
          }),
          breadcrumbs(ctx.base, [['Online Courses', '/learn'], [c.title, ctx.path]]),
          faqPage(c.faqs),
        ],
      };
    },
  },
  {
    rx: /^\/batches\/([^/]+)\/?$/,
    async load(slug, ctx) {
      const b = await Batch.findOne({ slug, published: true }).lean();
      if (!b) return null;
      return {
        title: b.title,
        description: b.subtitle || b.description,
        image: b.thumbnail,
        ld: [
          courseLd({
            name: b.title,
            description: b.description || b.subtitle,
            url: ctx.url,
            image: ctx.abs(b.thumbnail),
            provider: ctx.provider,
            offers: offer(b.price, ctx.url),
            instance: clean({ '@type': 'CourseInstance', courseMode: /offline/i.test(b.mode) ? 'Blended' : 'Online', startDate: b.startDate ? new Date(b.startDate).toISOString() : undefined, instructor: b.trainer?.name ? { '@type': 'Person', name: b.trainer.name } : undefined }),
          }),
          breadcrumbs(ctx.base, [['Live Batches', '/batches'], [b.title, ctx.path]]),
          faqPage(b.faqs),
        ],
      };
    },
  },
  {
    rx: /^\/webinars\/([^/]+)\/?$/,
    async load(slug, ctx) {
      const w = await Webinar.findOne({ slug, published: true }).lean();
      if (!w) return null;
      const start = new Date(w.startsAt);
      const end = new Date(start.getTime() + (w.durationMins || 60) * 60000);
      return {
        title: w.title,
        description: w.subtitle || w.description,
        image: w.banner,
        type: 'article',
        ld: [
          clean({
            '@context': 'https://schema.org',
            '@type': 'Event',
            name: w.title,
            description: clip(w.description || w.subtitle, 300) || w.title,
            startDate: start.toISOString(),
            endDate: end.toISOString(),
            eventStatus: 'https://schema.org/EventScheduled',
            eventAttendanceMode: 'https://schema.org/OnlineEventAttendanceMode',
            location: { '@type': 'VirtualLocation', url: ctx.url },
            image: [ctx.abs(w.banner) || `${ctx.base}/og-default.jpg`],
            organizer: { '@type': 'Organization', name: ctx.provider.name, url: ctx.base },
            performer: w.host?.name ? { '@type': 'Person', name: w.host.name } : undefined,
            offers: { ...offer(w.price, ctx.url), validFrom: new Date(w.createdAt || Date.now()).toISOString() },
          }),
          breadcrumbs(ctx.base, [['Webinars', '/webinars'], [w.title, ctx.path]]),
          faqPage(w.faqs),
        ],
      };
    },
  },
  {
    rx: /^\/software\/([^/]+)\/?$/,
    async load(slug, ctx) {
      const p = await Product.findOne({ slug, published: true }).lean();
      if (!p) return null;
      return { title: p.title, description: p.shortDescription || p.description, image: p.image, ld: [breadcrumbs(ctx.base, [['Software', '/software'], [p.title, ctx.path]])] };
    },
  },
];

/* ------------------------------ head rendering ------------------------------ */
const ID = {
  verification: /^[A-Za-z0-9_-]{10,100}$/,
  ga4: /^G-[A-Z0-9]{4,20}$/,
  clarity: /^[a-z0-9]{5,20}$/i,
  pixel: /^\d{5,20}$/,
};

function tracking(s) {
  const out = [];
  const ga = (s.ga4Id || '').trim();
  if (ID.ga4.test(ga)) {
    out.push(`<script async src="https://www.googletagmanager.com/gtag/js?id=${ga}"></script>`);
    out.push(`<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${ga}');</script>`);
  }
  const cl = (s.clarityId || '').trim();
  if (ID.clarity.test(cl)) {
    out.push(`<script>(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","${cl}");</script>`);
  }
  const px = (s.metaPixelId || '').trim();
  if (ID.pixel.test(px)) {
    out.push(`<script>!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${px}');fbq('track','PageView');</script>`);
  }
  return out;
}

let template = null;
function loadTemplate(distDir) {
  if (!template || process.env.NODE_ENV !== 'production') {
    template = fs
      .readFileSync(path.join(distDir, 'index.html'), 'utf8')
      .replace(/<title>[\s\S]*?<\/title>\s*/i, '')
      .replace(/<meta\s+name="description"[^>]*>\s*/i, '');
  }
  return template;
}

/** Sends index.html with page-specific SEO tags (404 status for unknown pages) */
export async function renderPage(req, res, distDir) {
  const s = await settings();
  const base = baseUrl(req);
  let pathname = req.path;
  try {
    pathname = decodeURIComponent(req.path);
  } catch {
    /* malformed %-encoding: use the raw path */
  }
  pathname = pathname.replace(/\/+$/, '') || '/';
  const abs = (p) => (!p ? '' : /^https?:\/\//.test(p) ? p : `${base}${p.startsWith('/') ? '' : '/'}${p}`);
  const siteName = s.siteName || 'Virag Training Solutions';
  const ctx = { base, abs, path: pathname, url: `${base}${pathname === '/' ? '/' : pathname}`, provider: { name: siteName, url: base } };

  let page = STATIC[pathname] ? { ...STATIC[pathname] } : null;
  let status = 200;
  if (!page) {
    for (const d of DETAIL) {
      const m = pathname.match(d.rx);
      if (m) {
        page = await d.load(m[1], ctx);
        break;
      }
    }
  }
  const noindex = NOINDEX.test(pathname);
  if (!page && noindex) page = { title: pathname.startsWith('/admin') ? 'Admin' : pathname.endsWith('/watch') ? 'Learn' : 'My Account' };
  if (!page) {
    status = 404;
    page = { title: 'Page not found' };
  }

  const title = pathname === '/' ? `${siteName} – ${page.title}` : `${page.title} | ${siteName}`;
  const description = clip(page.description || (pathname === '/' || pathname === '/about' ? s.heroSubtitle || s.aboutText : '') || s.heroSubtitle || `${siteName} – ${s.tagline || 'IT training and software solutions'}`);
  const image = abs(page.image) || abs(s.seoImage) || `${base}/og-default.jpg`;
  const robots = noindex || status === 404 ? 'noindex, nofollow' : 'index, follow, max-image-preview:large';

  const ld = [organization(s, base, abs), ...(page.ld || []).filter(Boolean)];
  if (pathname === '/') ld.push({ '@context': 'https://schema.org', '@type': 'WebSite', name: siteName, url: `${base}/`, publisher: { '@id': `${base}/#organization` } });

  const head = [
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${esc(description)}" />`,
    `<meta name="robots" content="${robots}" />`,
    status === 200 && !noindex ? `<link rel="canonical" href="${esc(ctx.url)}" />` : '',
    `<meta property="og:site_name" content="${esc(siteName)}" />`,
    `<meta property="og:type" content="${page.type || 'website'}" />`,
    `<meta property="og:title" content="${esc(title)}" />`,
    `<meta property="og:description" content="${esc(description)}" />`,
    `<meta property="og:url" content="${esc(ctx.url)}" />`,
    `<meta property="og:image" content="${esc(image)}" />`,
    `<meta property="og:locale" content="en_IN" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(title)}" />`,
    `<meta name="twitter:description" content="${esc(description)}" />`,
    `<meta name="twitter:image" content="${esc(image)}" />`,
    ID.verification.test(s.googleVerification || '') ? `<meta name="google-site-verification" content="${s.googleVerification}" />` : '',
    ID.verification.test(s.bingVerification || '') ? `<meta name="msvalidate.01" content="${s.bingVerification}" />` : '',
    ...(noindex || status === 404 ? [] : ld.map(jsonLd)),
    ...(pathname.startsWith('/admin') ? [] : tracking(s)),
  ]
    .filter(Boolean)
    .join('\n    ');

  const html = loadTemplate(distDir).replace('</head>', `    ${head}\n  </head>`);
  res.status(status).set('Cache-Control', 'no-cache').type('html').send(html);
}

/* ------------------------------ robots.txt & sitemap.xml ------------------------------ */
export function seoRouter() {
  const r = Router();

  r.get('/robots.txt', (req, res) => {
    // /api is NOT blocked: Google needs it to render the pages' content
    res.type('text/plain').send(
      ['User-agent: *', 'Allow: /', 'Disallow: /admin', 'Disallow: /dashboard', 'Disallow: /login', 'Disallow: /register', 'Disallow: /certificate/', 'Disallow: /learn/*/watch', '', `Sitemap: ${baseUrl(req)}/sitemap.xml`, ''].join('\n')
    );
  });

  r.get('/sitemap.xml', async (req, res, next) => {
    try {
      const base = baseUrl(req);
      const pub = { published: true };
      const [courses, online, batches, webinars, products] = await Promise.all([
        Course.find(pub).select('slug updatedAt').lean(),
        OnlineCourse.find(pub).select('slug updatedAt').lean(),
        Batch.find({ ...pub, status: { $ne: 'completed' } }).select('slug updatedAt').lean(),
        Webinar.find(pub).select('slug updatedAt').lean(),
        Product.find(pub).select('slug updatedAt').lean(),
      ]);
      const urls = [
        ['/', null, '1.0'],
        ...['/courses', '/learn', '/batches', '/webinars', '/software', '/services', '/portfolio', '/testimonials', '/about', '/contact'].map((p) => [p, null, '0.8']),
        ...courses.map((d) => [`/courses/${d.slug}`, d.updatedAt, '0.9']),
        ...online.map((d) => [`/learn/${d.slug}`, d.updatedAt, '0.9']),
        ...batches.map((d) => [`/batches/${d.slug}`, d.updatedAt, '0.8']),
        ...webinars.map((d) => [`/webinars/${d.slug}`, d.updatedAt, '0.7']),
        ...products.map((d) => [`/software/${d.slug}`, d.updatedAt, '0.7']),
      ];
      const xml = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        ...urls.map(([p, at, pr]) => `  <url><loc>${esc(base + p)}</loc>${at ? `<lastmod>${new Date(at).toISOString().slice(0, 10)}</lastmod>` : ''}<priority>${pr}</priority></url>`),
        '</urlset>',
        '',
      ].join('\n');
      res.type('application/xml').set('Cache-Control', 'public, max-age=600').send(xml);
    } catch (e) {
      next(e);
    }
  });

  return r;
}
