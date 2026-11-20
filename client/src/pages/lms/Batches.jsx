import { useParams, Link } from 'react-router-dom';
import { FaCalendarAlt, FaClock, FaVideo, FaHourglassHalf, FaUsers, FaShieldAlt, FaChalkboardTeacher, FaRecordVinyl, FaUserCheck } from 'react-icons/fa';
import { useApi, assetUrl } from '../../lib/api';
import { fmtDate, inr, discount } from '../../lib/format';
import { Seo, PageHeader, SkeletonGrid, Empty, Loader, SectionHeading, FitImage } from '../../components/ui';
import { Reveal } from '../../components/Effects';
import { BatchCard, CheckList, Faqs, PriceTag, Person, PurchaseButton, Countdown } from '../../components/lms';
import NotFound from '../NotFound';

export function Batches() {
  const { data, loading } = useApi('/batches', []);
  const open = data.filter((b) => b.status !== 'completed');
  return (
    <>
      <Seo title="Live Batches" description="Join live, mentor-led online batches with recordings, assignments and placement support." />
      <PageHeader title="Live Online Batches" subtitle="Learn live with a mentor in small batches. Every class is recorded and available in your dashboard." crumbs={[{ label: 'Live Batches' }]} />
      <section className="section bg-dots">
        <div className="container-x">
          {loading ? <SkeletonGrid /> : open.length ? (
            <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
              {open.map((b, i) => <Reveal key={b._id} delay={(i % 3) * 120} className="h-full"><BatchCard b={b} /></Reveal>)}
            </div>
          ) : <Empty text="New batches will be announced soon. Contact us to get notified." />}
        </div>
      </section>
    </>
  );
}

export function BatchLanding() {
  const { slug } = useParams();
  const { data: b, loading, error } = useApi(`/batches/${slug}`);
  if (loading) return <div className="pt-32"><Loader /></div>;
  if (error || !b) return <NotFound />;

  const startsSoon = b.startDate && new Date(b.startDate) > new Date();
  const full = b.seatsLeft === 0;
  const facts = [
    b.startDate && [FaCalendarAlt, 'Batch starts', fmtDate(b.startDate, { weekday: 'short' })],
    b.schedule && [FaClock, 'Schedule', b.schedule],
    b.durationText && [FaHourglassHalf, 'Duration', b.durationText],
    [FaVideo, 'Mode', `${b.mode} · ${b.platform}`],
  ].filter(Boolean);

  return (
    <>
      <Seo title={b.title} description={b.subtitle} />
      <section className="hero-grid relative overflow-hidden bg-brand-950 pb-16 pt-28 text-white md:pt-36 lg:pb-24">
        <div className="orb -left-24 top-10 h-96 w-96 bg-emerald-500/25" />
        <div className="orb right-10 bottom-0 h-72 w-72 bg-brand-500/40" />
        <div className="container-x relative grid gap-10 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <nav className="mb-5 text-sm text-brand-200"><Link to="/batches" className="hover:text-white">Live Batches</Link></nav>
            <span className="mb-5 inline-flex items-center gap-2 rounded-full bg-red-500/20 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-red-300 ring-1 ring-red-500/40">
              <span className="h-2 w-2 animate-pulse rounded-full bg-red-400" /> Live interactive batch
            </span>
            <h1 className="text-4xl leading-tight text-white md:text-5xl">{b.title}</h1>
            <p className="mt-5 text-lg text-brand-100/85">{b.subtitle}</p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {facts.map(([I, l, v]) => (
                <div key={l} className="glass flex items-center gap-3 rounded-2xl p-4">
                  <span className="icon-3d h-10 w-10 shrink-0 bg-gradient-to-br from-brand-400 to-brand-700 text-sm"><I /></span>
                  <div><div className="text-xs text-brand-200">{l}</div><div className="font-semibold text-white">{v}</div></div>
                </div>
              ))}
            </div>
            {startsSoon && <div className="mt-8"><div className="mb-3 text-sm font-semibold text-brand-100">Batch starts in</div><Countdown to={b.startDate} size="sm" /></div>}
          </div>
          <div>
            <div className="rounded-3xl bg-white p-3 text-slate-800 shadow-2xl shadow-black/40 lg:sticky lg:top-24">
              {b.thumbnail ? (
                <FitImage src={b.thumbnail} alt={b.title} lazy={false} className="aspect-video w-full rounded-2xl" />
              ) : (
                <div className="grid-lines flex aspect-video items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-800"><FaChalkboardTeacher className="text-6xl text-white/90" /></div>
              )}
              <div className="p-4">
                <PriceTag price={b.price} mrp={b.mrp} />
                {b.capacity > 0 && (
                  <div className="mt-4">
                    <div className="mb-1.5 flex justify-between text-xs font-medium text-slate-600"><span><FaUsers className="mr-1 inline" /> {b.enrolledCount} enrolled</span><span className={b.seatsLeft <= 5 ? 'text-red-600' : ''}>{b.seatsLeft} seats left</span></div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-accent-500" style={{ width: `${Math.min((b.enrolledCount / b.capacity) * 100, 100)}%` }} /></div>
                  </div>
                )}
                {full ? (
                  <div className="mt-5 rounded-xl bg-red-50 p-4 text-center font-semibold text-red-600">This batch is full. <Link to="/contact" className="underline">Join waitlist</Link></div>
                ) : (
                  <PurchaseButton kind="batch" item={b} className="mt-5 w-full" />
                )}
                <p className="mt-3 flex items-center justify-center gap-2 text-xs text-slate-500"><FaShieldAlt className="text-emerald-500" /> Secure payment · Class links in your dashboard</p>
                {b.includes?.length > 0 && <div className="mt-5 border-t border-slate-100 pt-5"><div className="mb-3 text-sm font-bold text-slate-900">What you get</div><CheckList items={b.includes} cols={1} /></div>}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container-x grid gap-10 py-16 lg:grid-cols-[1.2fr_1fr]">
        <div className="space-y-14">
          {b.whatYouLearn?.length > 0 && <Reveal className="rounded-3xl border border-brand-100 bg-brand-50/50 p-6 md:p-8"><h2 className="mb-6 text-2xl">What you’ll learn</h2><CheckList items={b.whatYouLearn} /></Reveal>}
          {b.description && <Reveal><h2 className="mb-4 text-2xl">About this batch</h2><p className="prose-text">{b.description}</p></Reveal>}
          <Reveal>
            <h2 className="mb-5 text-2xl">How live classes work</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {[[FaUserCheck, 'Enroll & get access', 'Your class schedule appears in your dashboard.'], [FaVideo, 'Join live', 'Click “Join Class” 30 minutes before the class starts.'], [FaRecordVinyl, 'Watch recordings', 'Missed a class? Recordings are added to your dashboard.']].map(([I, t, d], i) => (
                <div key={t} className="card p-5">
                  <span className="icon-3d mb-4 h-11 w-11 bg-gradient-to-br from-emerald-500 to-teal-700"><I /></span>
                  <div className="text-xs font-bold text-brand-600">STEP {i + 1}</div>
                  <h3 className="mt-1 text-base">{t}</h3>
                  <p className="mt-1 text-sm text-slate-500">{d}</p>
                </div>
              ))}
            </div>
          </Reveal>
          <Reveal><Person p={b.trainer} label="Your Trainer" /></Reveal>
        </div>
      </div>

      {b.faqs?.length > 0 && (
        <section className="section bg-slate-50">
          <div className="container-x max-w-3xl"><SectionHeading title="Frequently asked questions" /><Faqs items={b.faqs} /></div>
        </section>
      )}

      {!full && (
        <>
          <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-3 border-t border-slate-200 bg-white/95 p-3 backdrop-blur lg:hidden">
            <div><div className="text-lg font-extrabold text-slate-900">{inr(b.price)}</div>{discount(b.price, b.mrp) > 0 && <div className="text-xs text-slate-400 line-through">{inr(b.mrp)}</div>}</div>
            <PurchaseButton kind="batch" item={b} className="!py-3 flex-1" label="Join Batch" />
          </div>
          <div className="h-20 lg:hidden" />
        </>
      )}
    </>
  );
}
