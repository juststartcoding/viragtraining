import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { FaChevronDown, FaUserCircle, FaBars, FaTimes, FaPhoneAlt, FaEnvelope, FaMapMarkerAlt, FaWhatsapp, FaFacebookF, FaInstagram, FaLinkedinIn, FaYoutube, FaTwitter } from 'react-icons/fa';
import { useSettings } from '../context/SettingsContext';
import { useStudent } from '../context/StudentContext';
import { assetUrl } from '../lib/api';

const NAV = [
  { to: '/', label: 'Home' },
  {
    label: 'Courses',
    children: [
      { to: '/courses', label: 'Classroom Training', desc: 'Job-oriented programs with placement support' },
      { to: '/learn', label: 'Online Courses', desc: 'Self-paced recorded courses with certificate' },
      { to: '/batches', label: 'Live Batches', desc: 'Live online classes with a mentor' },
    ],
  },
  { to: '/webinars', label: 'Webinars' },
  { to: '/software', label: 'Software' },
  { to: '/services', label: 'Services' },
  { to: '/portfolio', label: 'Portfolio' },
  { to: '/contact', label: 'Contact' },
];
const FLAT_NAV = NAV.flatMap((n) => n.children || [n]);

export function Logo({ light = false }) {
  const { settings } = useSettings();
  if (settings.logo) return <img src={assetUrl(settings.logo)} alt={settings.siteName} className="h-10 w-auto" />;
  return (
    <span className="flex items-center gap-2.5">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-800 text-lg font-extrabold text-white shadow-lg shadow-brand-600/30">
        V<span className="text-accent-400">.</span>
      </span>
      <span className="leading-tight">
        <span className={`block text-base font-extrabold ${light ? 'text-white' : 'text-slate-900'}`}>Virag</span>
        <span className={`block text-[11px] font-semibold uppercase tracking-[0.15em] ${light ? 'text-brand-200' : 'text-brand-600'}`}>Training Solutions</span>
      </span>
    </span>
  );
}

function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { pathname } = useLocation();
  const { student } = useStudent();
  // Pages with a dark header start with transparent nav
  const solid = scrolled || open;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const linkCls = ({ isActive }) =>
    `rounded-lg px-3 py-2 text-sm font-medium transition ${
      isActive ? (solid ? 'text-brand-700 bg-brand-50' : 'text-white bg-white/10') : solid ? 'text-slate-600 hover:text-brand-700' : 'text-brand-100 hover:text-white'
    }`;

  return (
    <header className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${solid ? 'bg-white/95 shadow-sm backdrop-blur' : 'bg-transparent'}`}>
      <div className="container-x flex h-18 items-center justify-between py-3">
        <Link to="/" aria-label="Home">
          <Logo light={!solid} />
        </Link>
        <nav className="hidden items-center gap-0.5 xl:flex">
          {NAV.map((n) =>
            n.children ? (
              <div key={n.label} className="group relative">
                <button className={`${linkCls({ isActive: n.children.some((c) => pathname.startsWith(c.to)) })} flex items-center gap-1.5`}>
                  {n.label} <FaChevronDown className="text-[10px] transition group-hover:rotate-180" />
                </button>
                <div className="invisible absolute left-0 top-full w-80 translate-y-2 pt-3 opacity-0 transition-all group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                  <div className="rounded-2xl border border-slate-100 bg-white p-2 shadow-2xl shadow-brand-950/20">
                    {n.children.map((c) => (
                      <Link key={c.to} to={c.to} className="block rounded-xl px-4 py-3 transition hover:bg-brand-50">
                        <div className="text-sm font-semibold text-slate-900">{c.label}</div>
                        <div className="text-xs text-slate-500">{c.desc}</div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <NavLink key={n.to} to={n.to} end={n.to === '/'} className={linkCls}>
                {n.label}
              </NavLink>
            )
          )}
        </nav>
        <div className="flex items-center gap-2">
          <Link to={student ? '/dashboard' : '/login'} className={`hidden items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition sm:flex ${solid ? 'text-slate-700 hover:bg-slate-100' : 'text-white hover:bg-white/10'}`}>
            <FaUserCircle className="text-lg" /> {student ? 'My Dashboard' : 'Login'}
          </Link>
          <Link to="/contact" className="btn btn-accent hidden md:inline-flex">
            Enquire Now
          </Link>
          <button onClick={() => setOpen(!open)} className={`rounded-lg p-2 text-xl xl:hidden ${solid ? 'text-slate-800' : 'text-white'}`} aria-label="Menu">
            {open ? <FaTimes /> : <FaBars />}
          </button>
        </div>
      </div>
      {open && (
        <nav className="container-x flex max-h-[80vh] flex-col gap-1 overflow-y-auto border-t border-slate-100 pb-5 pt-3 xl:hidden">
          <NavLink to={student ? '/dashboard' : '/login'} className={linkCls}>{student ? '👤 My Dashboard' : '👤 Student Login'}</NavLink>
          {FLAT_NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.to === '/'} className={linkCls}>
              {n.label}
            </NavLink>
          ))}
          <Link to="/contact" className="btn btn-accent mt-2">Enquire Now</Link>
        </nav>
      )}
    </header>
  );
}

function Footer() {
  const { settings: s } = useSettings();
  const socials = [
    ['facebook', FaFacebookF],
    ['instagram', FaInstagram],
    ['linkedin', FaLinkedinIn],
    ['youtube', FaYoutube],
    ['twitter', FaTwitter],
  ].filter(([k]) => s.socials?.[k]);

  return (
    <footer className="bg-brand-950 text-brand-100/80">
      <div className="container-x grid gap-10 py-16 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <Logo light />
          <p className="mt-5 text-sm leading-relaxed">{s.tagline}. Practical IT training and reliable software solutions for students and businesses.</p>
          {socials.length > 0 && (
            <div className="mt-5 flex gap-2">
              {socials.map(([k, I]) => (
                <a key={k} href={s.socials[k]} target="_blank" rel="noreferrer" aria-label={k} className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 transition hover:bg-accent-500 hover:text-white">
                  <I />
                </a>
              ))}
            </div>
          )}
        </div>
        <div>
          <h4 className="mb-4 text-white">Quick Links</h4>
          <ul className="space-y-2 text-sm">
            {FLAT_NAV.slice(1).map((n) => (
              <li key={n.to}><Link to={n.to} className="hover:text-white">{n.label}</Link></li>
            ))}
            <li><Link to="/about" className="hover:text-white">About</Link></li>
            <li><Link to="/testimonials" className="hover:text-white">Testimonials</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-4 text-white">Training Programs</h4>
          <ul className="space-y-2 text-sm">
            {['Java Full Stack', 'MERN Full Stack', 'Python Full Stack', 'PHP Full Stack', 'C & C++ Programming', 'Digital Marketing'].map((c) => (
              <li key={c}><Link to="/courses" className="hover:text-white">{c}</Link></li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="mb-4 text-white">Get in Touch</h4>
          <ul className="space-y-3 text-sm">
            {s.phone && <li className="flex gap-3"><FaPhoneAlt className="mt-1 shrink-0 text-accent-400" /><a href={`tel:${s.phone}`} className="hover:text-white">{s.phone}</a></li>}
            {s.email && <li className="flex gap-3"><FaEnvelope className="mt-1 shrink-0 text-accent-400" /><a href={`mailto:${s.email}`} className="break-all hover:text-white">{s.email}</a></li>}
            {s.address && <li className="flex gap-3"><FaMapMarkerAlt className="mt-1 shrink-0 text-accent-400" /><span>{s.address}</span></li>}
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-x flex flex-col items-center justify-between gap-2 py-6 text-xs sm:flex-row">
          <p>© {new Date().getFullYear()} {s.siteName}. All rights reserved.</p>
          <p>ViragTrainingSolutions.com</p>
        </div>
      </div>
    </footer>
  );
}

function WhatsAppButton() {
  const { settings } = useSettings();
  const num = (settings.whatsapp || '').replace(/\D/g, '');
  if (!num) return null;
  const text = encodeURIComponent('Hello, I would like to know more about your courses / software.');
  return (
    <a href={`https://wa.me/${num}?text=${text}`} target="_blank" rel="noreferrer" aria-label="Chat on WhatsApp"
      className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-3xl text-white shadow-xl shadow-green-600/30 transition hover:scale-110">
      <FaWhatsapp />
    </a>
  );
}

export default function Layout() {
  const { pathname } = useLocation();
  // Block body on purpose: newer browsers return a Promise from scrollTo, and an effect must not return one
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);
  return (
    <>
      <Navbar />
      <main className="min-h-[60vh]">
        <Outlet />
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  );
}
