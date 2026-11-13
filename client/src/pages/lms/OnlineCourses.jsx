import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FaPlayCircle, FaLock, FaChevronDown, FaFileAlt, FaFilePdf, FaGlobe, FaSignal, FaClock, FaBookOpen, FaCertificate, FaShieldAlt, FaInfinity } from 'react-icons/fa';
import { useApi, assetUrl } from '../../lib/api';
import { inr, discount, fmtMins } from '../../lib/format';
import { Seo, PageHeader, SkeletonGrid, Empty, Loader, SectionHeading } from '../../components/ui';
import { Reveal } from '../../components/Effects';
import { TestimonialCard } from '../../components/Cards';
import { OnlineCourseCard, Countdown, CheckList, Faqs, PriceTag, Person, PurchaseButton, VideoPlayer, Modal } from '../../components/lms';
import NotFound from '../NotFound';

export function OnlineCourses() {
  const { data, loading } = useApi('/online-courses', []);
  return (
    <>
      <Seo title="Online Courses" description="Self-paced recorded courses with lifetime access, projects and certificate." />
      <PageHeader title="Online Courses" subtitle="Learn at your own pace with lifetime access, real projects and a certificate on completion." crumbs={[{ label: 'Online Courses' }]} />
      <section className="section bg-dots">
        <div className="container-x">
          {loading ? <SkeletonGrid /> : data.length ? (
            <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
              {data.map((c, i) => <Reveal key={c._id} delay={(i % 3) * 120} className="h-full"><OnlineCourseCard c={c} /></Reveal>)}
            </div>
          ) : <Empty text="New online courses are coming soon." />}
        </div>
      </section>
    </>
  );
}

const LESSON_ICON = { video: FaPlayCircle, article: FaFileAlt, pdf: FaFilePdf };

function Curriculum({ sections, onPreview }) {
  const [open, setOpen] = useState(0);
  return (
    <div className="space-y-3">
      {sections.map((s, i) => (
        <div key={s._id} className="card overflow-hidden">
          <button onClick={() => setOpen(open === i ? -1 : i)} className="flex w-full items-center justify-between gap-4 bg-slate-50 px-5 py-4 text-left">
            <span className="font-semibold text-slate-900">{s.title}</span>
            <span className="flex shrink-0 items-center gap-3 text-xs text-slate-500">
              {s.lessons.length} lessons · {fmtMins(s.lessons.reduce((n, l) => n + (l.duration || 0), 0))}
              <FaChevronDown className={`transition ${open === i ? 'rotate-180' : ''}`} />
            </span>
          </button>
          {open === i && (
            <ul className="divide-y divide-slate-100">
              {s.lessons.map((l) => {
                const I = LESSON_ICON[l.type] || FaPlayCircle;
                return (
                  <li key={l._id} className="flex items-center gap-3 px-5 py-3 text-sm">
                    <I className={l.isPreview ? 'text-brand-600' : 'text-slate-400'} />
                    <span className="flex-1 text-slate-700">{l.title}</span>
                    {l.isPreview ? (
                      <button onClick={() => onPreview(l)} className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 hover:bg-brand-100">Preview</button>
                    ) : (
                      <FaLock className="text-xs text-slate-300" />
                    )}
                    {l.duration > 0 && <span className="w-12 text-right text-xs text-slate-400">{fmtMins(l.duration)}</span>}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}

export function OnlineCourseLanding() {
  const { slug } = useParams();
  const { data: c, loading, error } = useApi(`/online-courses/${slug}`);
  const { data: reviews } = useApi('/testimonials?type=Student&limit=3', []);
  const [preview, setPreview] = useState(null);

  if (loading) return <div className="pt-32"><Loader /></div>;
  if (error || !c) return <NotFound />;

  const offerLive = c.offerEndsAt && new Date(c.offerEndsAt) > new Date();
  const facts = [
    [FaBookOpen, `${c.lessonsCount} lessons`],
    c.totalMinutes > 0 && [FaClock, `${fmtMins(c.totalMinutes)} total`],
    [FaSignal, c.level],
    [FaGlobe, c.language],
    c.certificate && [FaCertificate, 'Certificate'],
  ].filter(Boolean);

  return (
    <>
      <Seo title={c.title} description={c.subtitle} />

      {/* HERO */}
      <section className="hero-grid relative overflow-hidden bg-brand-950 pb-16 pt-28 text-white md:pt-36 lg:pb-24">
        <div className="orb -left-24 top-10 h-96 w-96 bg-brand-500/40" />
        <div className="orb right-1/3 bottom-0 h-72 w-72 bg-purple-600/25" />
        <div className="container-x relative grid gap-10 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <nav className="mb-5 text-sm text-brand-200"><Link to="/learn" className="hover:text-white">Online Courses</Link> / <span className="text-white">{c.category}</span></nav>
            {offerLive && <span className="mb-5 inline-flex items-center gap-2 rounded-full bg-accent-500/20 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-accent-400 ring-1 ring-accent-500/40">🔥 Limited time offer – {discount(c.price, c.mrp)}% off</span>}
            <h1 className="text-4xl leading-tight text-white md:text-5xl">{c.title}</h1>
            <p className="mt-5 text-lg text-brand-100/85">{c.subtitle}</p>
            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-sm text-brand-100">
              {facts.map(([I, t]) => <span key={t} className="flex items-center gap-2"><I className="text-accent-400" /> {t}</span>)}
            </div>
            {c.instructor?.name && <p className="mt-6 text-sm text-brand-200">Created by <b className="text-white">{c.instructor.name}</b>{c.instructor.title && `, ${c.instructor.title}`}</p>}
            {offerLive && (
              <div className="mt-8">
                <div className="mb-3 text-sm font-semibold text-brand-100">Offer ends in</div>
                <Countdown to={c.offerEndsAt} size="sm" />
              </div>
            )}
          </div>

          {/* Buy box */}
          <div className="lg:row-span-2">
            <div className="rounded-3xl bg-white p-3 text-slate-800 shadow-2xl shadow-black/40 lg:sticky lg:top-24">
              {c.promoVideoUrl ? (
                <VideoPlayer url={c.promoVideoUrl} title={c.title} />
              ) : c.thumbnail ? (
                <img src={assetUrl(c.thumbnail)} alt={c.title} className="aspect-video w-full rounded-2xl object-cover" />
              ) : (
                <div className="flex aspect-video items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-800"><FaPlayCircle className="text-6xl text-white/80" /></div>
              )}
              <div className="p-4">
                <PriceTag price={c.price} mrp={c.mrp} />
                <PurchaseButton kind="course" item={c} className="mt-5 w-full" />
                <p className="mt-3 flex items-center justify-center gap-2 text-xs text-slate-500"><FaShieldAlt className="text-emerald-500" /> Secure payment · Instant access</p>
                {c.includes?.length > 0 && (
                  <div className="mt-5 border-t border-slate-100 pt-5">
                    <div className="mb-3 text-sm font-bold text-slate-900">This course includes</div>
                    <CheckList items={c.includes} cols={1} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container-x grid gap-10 py-16 lg:grid-cols-[1.2fr_1fr]">
        <div className="space-y-14">
          {c.whatYouLearn?.length > 0 && (
            <Reveal className="rounded-3xl border border-brand-100 bg-brand-50/50 p-6 md:p-8">
              <h2 className="mb-6 text-2xl">What you’ll learn</h2>
              <CheckList items={c.whatYouLearn} />
            </Reveal>
          )}
          {c.sections?.length > 0 && (
            <Reveal>
              <h2 className="text-2xl">Course curriculum</h2>
              <p className="mb-5 mt-1 text-sm text-slate-500">{c.sections.length} sections · {c.lessonsCount} lessons · {fmtMins(c.totalMinutes)} total length</p>
              <Curriculum sections={c.sections} onPreview={setPreview} />
            </Reveal>
          )}
          {c.description && <Reveal><h2 className="mb-4 text-2xl">About this course</h2><p className="prose-text">{c.description}</p></Reveal>}
          {c.requirements?.length > 0 && <Reveal><h2 className="mb-4 text-2xl">Requirements</h2><CheckList items={c.requirements} cols={1} /></Reveal>}
          {c.forWho?.length > 0 && <Reveal><h2 className="mb-4 text-2xl">Who this course is for</h2><CheckList items={c.forWho} cols={1} /></Reveal>}
          <Reveal><Person p={c.instructor} /></Reveal>
        </div>
      </div>

      {/* Guarantee strip */}
      <section className="bg-slate-50 py-14">
        <div className="container-x grid gap-6 md:grid-cols-3">
          {[[FaInfinity, 'Lifetime access', 'Learn at your own pace, forever – including updates.'], [FaCertificate, 'Get certified', 'Shareable certificate when you finish the course.'], [FaShieldAlt, 'Secure checkout', 'UPI, cards & net banking with secure payment.']].map(([I, t, d]) => (
            <Reveal key={t} className="card flex items-start gap-4 p-6">
              <span className="icon-3d h-12 w-12 shrink-0 bg-gradient-to-br from-brand-500 to-brand-800"><I /></span>
              <div><h3 className="text-base">{t}</h3><p className="mt-1 text-sm text-slate-500">{d}</p></div>
            </Reveal>
          ))}
        </div>
      </section>

      {reviews.length > 0 && (
        <section className="section">
          <div className="container-x">
            <SectionHeading eyebrow="Student reviews" title="What learners say" />
            <div className="grid gap-6 md:grid-cols-3">{reviews.map((t) => <TestimonialCard key={t._id} t={t} />)}</div>
          </div>
        </section>
      )}

      {c.faqs?.length > 0 && (
        <section className="section bg-slate-50">
          <div className="container-x max-w-3xl">
            <SectionHeading title="Frequently asked questions" />
            <Faqs items={c.faqs} />
          </div>
        </section>
      )}

      {/* Final CTA */}
      <section className="section">
        <div className="container-x">
          <Reveal className="hero-grid relative overflow-hidden rounded-[2rem] bg-brand-950 p-10 text-center md:p-16">
            <div className="orb left-1/4 top-0 h-72 w-72 bg-brand-500/40" />
            <h2 className="relative text-3xl text-white md:text-4xl">Start learning <span className="text-gradient">today</span></h2>
            <p className="relative mx-auto mt-3 max-w-xl text-brand-100/80">Join now and get instant access to all lessons, projects and resources.</p>
            <div className="relative mx-auto mt-8 flex max-w-md flex-col items-center gap-4">
              <PriceTag price={c.price} mrp={c.mrp} light />
              <PurchaseButton kind="course" item={c} className="w-full" />
            </div>
          </Reveal>
        </div>
      </section>

      {/* Mobile sticky buy bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-3 border-t border-slate-200 bg-white/95 p-3 backdrop-blur lg:hidden">
        <div><div className="text-lg font-extrabold text-slate-900">{inr(c.price)}</div>{discount(c.price, c.mrp) > 0 && <div className="text-xs text-slate-400 line-through">{inr(c.mrp)}</div>}</div>
        <PurchaseButton kind="course" item={c} className="!py-3 flex-1" label="Enroll Now" />
      </div>
      <div className="h-20 lg:hidden" />

      {preview && (
        <Modal wide onClose={() => setPreview(null)}>
          <h3 className="mb-4 pr-8 text-lg">Preview: {preview.title}</h3>
          {preview.type === 'video' ? <VideoPlayer url={preview.videoUrl} title={preview.title} /> : <p className="prose-text max-h-[60vh] overflow-y-auto">{preview.content || 'Preview content'}</p>}
          {preview.resourceUrl && <a href={assetUrl(preview.resourceUrl)} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm mt-4">Open resource</a>}
        </Modal>
      )}
    </>
  );
}
