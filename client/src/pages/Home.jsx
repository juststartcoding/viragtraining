import { lazy, Suspense, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FaArrowRight, FaChalkboardTeacher, FaLaptopCode, FaBriefcase, FaCertificate, FaUserTie, FaHeadset,
  FaCheckCircle, FaRocket, FaUserGraduate, FaJava, FaPlay,
} from 'react-icons/fa';
import {
  SiReact, SiNodedotjs, SiMongodb, SiExpress, SiSpringboot, SiPython, SiDjango, SiPhp, SiLaravel, SiMysql,
  SiJavascript, SiHtml5, SiTailwindcss, SiGit, SiCplusplus, SiGoogleads, SiWordpress, SiPostgresql, SiBootstrap, SiMeta,
} from 'react-icons/si';
import { useSettings } from '../context/SettingsContext';
import { useApi, assetUrl } from '../lib/api';
import { Seo, SectionHeading, SkeletonGrid } from '../components/ui';
import { CourseCard, ProductCard, ServiceCard, PortfolioCard, TestimonialCard } from '../components/Cards';
import { Reveal, Counter, SafeBoundary, hasWebGL, Cube } from '../components/Effects';
import EnquiryForm from '../components/EnquiryForm';
import Icon from '../components/Icon';

const HeroScene = lazy(() => import('../components/three/HeroScene'));

const TECH = [
  [FaJava, 'Java', '#f89820'], [SiSpringboot, 'Spring Boot', '#6db33f'], [SiReact, 'React', '#61dafb'], [SiNodedotjs, 'Node.js', '#5fa04e'],
  [SiExpress, 'Express', '#ffffff'], [SiMongodb, 'MongoDB', '#47a248'], [SiPython, 'Python', '#ffd43b'], [SiDjango, 'Django', '#44b78b'],
  [SiPhp, 'PHP', '#8892bf'], [SiLaravel, 'Laravel', '#ff2d20'], [SiMysql, 'MySQL', '#4479a1'], [SiPostgresql, 'PostgreSQL', '#4169e1'],
  [SiJavascript, 'JavaScript', '#f7df1e'], [SiHtml5, 'HTML5', '#e34f26'], [SiTailwindcss, 'Tailwind', '#06b6d4'], [SiBootstrap, 'Bootstrap', '#7952b3'],
  [SiCplusplus, 'C++', '#00599c'], [SiGit, 'Git', '#f05032'], [SiGoogleads, 'Google Ads', '#fbbc04'], [SiMeta, 'Meta Ads', '#0866ff'], [SiWordpress, 'WordPress', '#21759b'],
];

const WHY = [
  { icon: FaChalkboardTeacher, title: 'Industry Expert Trainers', text: 'Learn from working developers who build real software every day.', g: 'from-brand-500 to-brand-800' },
  { icon: FaLaptopCode, title: 'Live Project Training', text: 'Every course includes hands-on, real-world projects for your portfolio.', g: 'from-indigo-500 to-purple-700' },
  { icon: FaBriefcase, title: 'Placement Assistance', text: 'Resume building, mock interviews and job referrals.', g: 'from-emerald-500 to-teal-700' },
  { icon: FaCertificate, title: 'Certification', text: 'Get a course completion certificate recognised by employers.', g: 'from-orange-500 to-rose-600' },
  { icon: FaUserTie, title: 'Flexible Batches', text: 'Weekday, weekend, online and offline batches available.', g: 'from-sky-500 to-blue-700' },
  { icon: FaHeadset, title: 'Lifetime Support', text: 'Doubt-clearing and career guidance even after course completion.', g: 'from-fuchsia-500 to-pink-700' },
];

/** Fallback visual when WebGL is unavailable: CSS 3D cubes and glowing orbs */
function SceneFallback() {
  return (
    <div className="relative flex h-full items-center justify-center">
      <div className="absolute h-72 w-72 rounded-full bg-gradient-to-br from-brand-500 to-brand-800 opacity-80 blur-sm shadow-[0_0_120px_rgb(59_108_246/0.6)]" />
      <Cube size={150} className="relative" />
    </div>
  );
}

function Hero({ courses }) {
  const { settings: s } = useSettings();
  const [webgl, setWebgl] = useState(false);
  useEffect(() => {
    setWebgl(hasWebGL());
  }, []);

  const title = s.heroTitle || 'Become an Industry-Ready Developer';
  const words = title.split(' ');
  const head = words.slice(0, -2).join(' ');
  const tail = words.slice(-2).join(' ');
  const firstStat = s.stats?.[0];

  return (
    <section className="hero-grid relative overflow-hidden bg-brand-950 pt-28 text-white md:pt-36">
      <div className="orb -left-32 top-20 h-96 w-96 bg-brand-500/40" />
      <div className="orb right-0 top-0 h-96 w-96 bg-purple-600/25" style={{ animationDelay: '-4s' }} />
      <div className="orb bottom-0 left-1/3 h-72 w-72 bg-accent-500/20" style={{ animationDelay: '-8s' }} />

      <div className="container-x relative grid items-center gap-6 pb-16 lg:grid-cols-[1.05fr_1fr] lg:pb-20">
        <div className="relative z-10">
          <Reveal>
            <span className="glass inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-brand-100">
              <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-400 opacity-75" /><span className="relative inline-flex h-2 w-2 rounded-full bg-accent-400" /></span>
              Admissions open – New batches
            </span>
          </Reveal>
          <Reveal delay={100}>
            <h1 className="mt-6 text-[2.6rem] leading-[1.08] text-white sm:text-6xl lg:text-[4.2rem]">
              {head} <span className="text-gradient">{tail}</span>
            </h1>
          </Reveal>
          <Reveal delay={200}>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-brand-100/80">{s.heroSubtitle}</p>
          </Reveal>
          <Reveal delay={300} className="mt-9 flex flex-wrap gap-3">
            <Link to="/courses" className="btn btn-accent px-7 py-3.5 text-base">Explore Courses <FaArrowRight /></Link>
            <Link to="/contact" className="btn btn-ghost-light px-6 py-3.5 text-base backdrop-blur">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-[10px] text-brand-700"><FaPlay /></span>
              Book Free Demo
            </Link>
          </Reveal>
          {firstStat && (
            <Reveal delay={400} className="mt-10 flex items-center gap-4">
              <div className="flex -space-x-3">
                {['from-brand-400 to-brand-700', 'from-accent-400 to-rose-600', 'from-emerald-400 to-teal-700', 'from-purple-400 to-indigo-700'].map((g, i) => (
                  <span key={g} className={`flex h-10 w-10 items-center justify-center rounded-full border-2 border-brand-950 bg-gradient-to-br ${g} text-sm`}>
                    <FaUserGraduate />
                  </span>
                ))}
              </div>
              <div className="text-sm text-brand-100/80">
                <b className="text-lg text-white"><Counter value={firstStat.value} /></b> {firstStat.label.toLowerCase()}
              </div>
            </Reveal>
          )}
        </div>

        {/* 3D visual */}
        <div className="relative h-[340px] sm:h-[440px] lg:h-[560px]">
          {s.heroImage ? (
            <img src={assetUrl(s.heroImage)} alt="" className="h-full w-full rounded-3xl object-cover shadow-2xl" />
          ) : webgl ? (
            <SafeBoundary fallback={<SceneFallback />}>
              <Suspense fallback={<SceneFallback />}>
                <HeroScene />
              </Suspense>
            </SafeBoundary>
          ) : (
            <SceneFallback />
          )}

          {/* floating glass cards */}
          <div className="glass animate-float absolute left-0 top-6 hidden rounded-2xl p-4 sm:block lg:-left-6">
            <div className="flex items-center gap-3">
              <span className="icon-3d h-11 w-11 bg-gradient-to-br from-emerald-400 to-teal-600"><FaCheckCircle /></span>
              <div><div className="text-sm font-bold text-white">100% Practical</div><div className="text-xs text-brand-200">Live project learning</div></div>
            </div>
          </div>
          <div className="glass animate-float-delay absolute bottom-10 right-0 hidden rounded-2xl p-4 sm:block">
            <div className="flex items-center gap-3">
              <span className="icon-3d h-11 w-11 bg-gradient-to-br from-accent-400 to-rose-600"><FaRocket /></span>
              <div><div className="text-sm font-bold text-white">Placement Support</div><div className="text-xs text-brand-200">Resume · Mock interviews</div></div>
            </div>
          </div>
          {courses.length > 0 && (
            <div className="glass animate-float-slow absolute bottom-0 left-4 hidden rounded-2xl p-3 xl:block">
              <div className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-brand-200">Top courses</div>
              <div className="flex gap-2">
                {courses.slice(0, 5).map((c) => (
                  <Link key={c._id} to={`/courses/${c.slug}`} title={c.title} className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-lg text-brand-700 shadow-lg transition hover:-translate-y-1">
                    <Icon name={c.icon} />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tech marquee */}
      <div className="relative border-t border-white/10 bg-white/[0.03] py-6 backdrop-blur">
        <div className="marquee overflow-hidden">
          <div className="marquee-track gap-10">
            {[...TECH, ...TECH].map(([I, name, color], i) => (
              <span key={i} className="flex items-center gap-2.5 whitespace-nowrap text-sm font-semibold text-brand-100/70 transition hover:text-white">
                <I className="text-2xl" style={{ color }} /> {name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function StatsBand() {
  const { settings: s } = useSettings();
  if (!s.stats?.length) return null;
  const icons = [FaUserGraduate, FaLaptopCode, FaRocket, FaCertificate];
  return (
    <section className="relative z-10 -mt-px bg-gradient-to-b from-brand-950 to-white pb-4">
      <div className="container-x">
        <div className="grid gap-4 rounded-3xl border border-white/60 bg-white/80 p-4 shadow-2xl shadow-brand-950/20 backdrop-blur-xl sm:grid-cols-2 lg:grid-cols-4 lg:p-6">
          {s.stats.map((st, i) => {
            const I = icons[i % icons.length];
            return (
              <Reveal key={st.label} delay={i * 100} className="flex items-center gap-4 rounded-2xl p-4 transition hover:bg-brand-50/70">
                <span className="icon-3d h-14 w-14 shrink-0 bg-gradient-to-br from-brand-500 to-brand-800 text-xl"><I /></span>
                <div>
                  <div className="text-3xl font-extrabold text-slate-900"><Counter value={st.value} /></div>
                  <div className="text-sm text-slate-500">{st.label}</div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Grid({ items, render, cols = 'sm:grid-cols-2 lg:grid-cols-3' }) {
  return (
    <div className={`grid gap-7 ${cols}`}>
      {items.map((x, i) => (
        <Reveal key={x._id} delay={(i % 3) * 120} className="h-full">
          {render(x, i)}
        </Reveal>
      ))}
    </div>
  );
}

export default function Home() {
  const courses = useApi('/courses?featured=true&limit=6', []);
  const services = useApi('/services?featured=true&limit=4', []);
  const products = useApi('/products?featured=true&limit=6', []);
  const portfolio = useApi('/portfolio?featured=true&limit=3', []);
  const testimonials = useApi('/testimonials?featured=true&limit=6', []);

  return (
    <>
      <Seo title="IT Training & Software Solutions" description="Job-oriented Java, MERN, Python, PHP Full Stack, C/C++ & Digital Marketing training. Custom software, academic projects & ready-made software." />
      <Hero courses={courses.data} />
      <StatsBand />

      {/* Courses */}
      <section className="section bg-dots">
        <div className="container-x">
          <SectionHeading eyebrow="Training Programs" title={<>Job-oriented courses that <span className="text-gradient-brand">get you hired</span></>} subtitle="Learn from industry experts with hands-on projects, real-world case studies and placement support." />
          {courses.loading ? <SkeletonGrid count={6} /> : <Grid items={courses.data} render={(c, i) => <CourseCard course={c} index={i} />} />}
          <Reveal className="mt-12 text-center"><Link to="/courses" className="btn btn-primary px-7">View all courses <FaArrowRight /></Link></Reveal>
        </div>
      </section>

      {/* Why us */}
      <section className="section relative overflow-hidden bg-slate-50">
        <div className="orb -right-20 top-20 h-80 w-80 bg-brand-300/30" />
        <div className="container-x relative grid items-center gap-14 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <SectionHeading center={false} eyebrow="Why Choose Us" title={<>Learning that is <span className="text-gradient-brand">practical, personal</span> and career-focused</>} subtitle="We don't just teach syntax – we train you to think, build and ship like a professional developer." />
            <Reveal>
              <Link to="/about" className="btn btn-outline">More about us <FaArrowRight /></Link>
            </Reveal>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            {WHY.map(({ icon: I, title, text, g }, i) => (
              <Reveal key={title} delay={(i % 2) * 120} className={i % 2 ? 'sm:translate-y-8' : ''}>
                <div className="card group h-full p-6 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-brand-900/10">
                  <span className={`icon-3d mb-5 h-14 w-14 bg-gradient-to-br ${g} text-xl transition duration-500 group-hover:-rotate-6 group-hover:scale-110`}><I /></span>
                  <h3 className="text-base">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-500">{text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Services – dark band */}
      {services.data.length > 0 && (
        <section className="section hero-grid relative overflow-hidden bg-brand-950">
          <div className="orb left-1/4 top-0 h-96 w-96 bg-brand-600/30" />
          <div className="container-x relative">
            <Reveal className="mx-auto mb-14 max-w-2xl text-center">
              <span className="glass inline-flex rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-brand-100">Software Solutions</span>
              <h2 className="mt-4 text-3xl text-white md:text-[2.6rem] md:leading-tight">We build software that <span className="text-gradient">grows your business</span></h2>
              <p className="mt-4 text-lg text-brand-100/75">From custom development to academic projects and ready-made products.</p>
            </Reveal>
            <Grid items={services.data} cols="md:grid-cols-2 lg:grid-cols-4" render={(s, i) => <ServiceCard service={s} index={i} />} />
          </div>
        </section>
      )}

      {/* Products */}
      {products.data.length > 0 && (
        <section className="section bg-dots">
          <div className="container-x">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <SectionHeading center={false} eyebrow="Ready-made Software" title={<>Deploy proven software in <span className="text-gradient-brand">days, not months</span></>} />
              <Reveal className="mb-12"><Link to="/software" className="btn btn-outline">All products <FaArrowRight /></Link></Reveal>
            </div>
            <Grid items={products.data} render={(p, i) => <ProductCard product={p} index={i} />} />
          </div>
        </section>
      )}

      {/* Portfolio */}
      {portfolio.data.length > 0 && (
        <section className="section bg-slate-50">
          <div className="container-x">
            <SectionHeading eyebrow="Our Work" title="Client portfolio" subtitle="A few of the projects we have delivered." />
            <Grid items={portfolio.data} render={(p, i) => <PortfolioCard item={p} index={i} />} />
            <Reveal className="mt-12 text-center"><Link to="/portfolio" className="btn btn-outline">View portfolio <FaArrowRight /></Link></Reveal>
          </div>
        </section>
      )}

      {/* Testimonials */}
      {testimonials.data.length > 0 && (
        <section className="section">
          <div className="container-x">
            <SectionHeading eyebrow="Testimonials" title={<>What our <span className="text-gradient-brand">students & clients</span> say</>} />
            <Grid items={testimonials.data} cols="md:grid-cols-2 lg:grid-cols-3" render={(t) => <TestimonialCard t={t} />} />
          </div>
        </section>
      )}

      {/* CTA + enquiry */}
      <section className="section pt-0">
        <div className="container-x">
          <Reveal className="hero-grid relative grid items-center gap-10 overflow-hidden rounded-[2rem] bg-brand-950 p-8 shadow-2xl shadow-brand-950/30 md:p-14 lg:grid-cols-2">
            <div className="orb -left-10 -top-10 h-72 w-72 bg-brand-500/40" />
            <div className="orb bottom-0 right-1/3 h-60 w-60 bg-accent-500/25" />
            <div className="absolute bottom-10 left-10 hidden opacity-60 lg:block"><Cube size={70} /></div>
            <div className="relative text-white">
              <h2 className="text-3xl text-white md:text-[2.6rem] md:leading-tight">Ready to start your <span className="text-gradient">career in IT?</span></h2>
              <p className="mt-4 text-brand-100/85">Book a free counselling session or a demo class. Have a software requirement? Tell us and get a free consultation.</p>
              <ul className="mt-8 space-y-4 text-brand-50">
                {['Free career counselling', 'Free demo class', 'Free software consultation'].map((x) => (
                  <li key={x} className="flex items-center gap-3">
                    <span className="icon-3d h-8 w-8 bg-gradient-to-br from-emerald-400 to-teal-600 text-sm"><FaCheckCircle /></span> {x}
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative"><EnquiryForm source="home" /></div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
