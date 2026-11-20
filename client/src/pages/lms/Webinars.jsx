import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FaCalendarAlt, FaClock, FaVideo, FaUsers, FaGift, FaCheckCircle, FaGoogle, FaWhatsapp, FaArrowRight, FaLock } from 'react-icons/fa';
import { api, useApi, assetUrl, errMsg } from '../../lib/api';
import { completeCheckout } from '../../lib/checkout';
import { fmtDateTime, fmtTime, fmtDate, inr, googleCalendarUrl } from '../../lib/format';
import { useStudent } from '../../context/StudentContext';
import { Seo, PageHeader, SkeletonGrid, Empty, Loader, SectionHeading, FitImage } from '../../components/ui';
import { Reveal } from '../../components/Effects';
import { WebinarCard, CheckList, Faqs, Person, Countdown, ManualPaymentModal } from '../../components/lms';
import NotFound from '../NotFound';

const isOver = (w) => new Date(w.startsAt).getTime() + w.durationMins * 60000 < Date.now();

export function Webinars() {
  const { data, loading } = useApi('/webinars', []);
  const upcoming = data.filter((w) => !isOver(w)).sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));
  const past = data.filter(isOver);
  return (
    <>
      <Seo title="Webinars & Masterclasses" description="Free and paid live webinars on programming, careers and digital marketing." />
      <PageHeader title="Webinars & Masterclasses" subtitle="Live sessions with industry experts. Register free and get the joining link instantly." crumbs={[{ label: 'Webinars' }]} />
      <section className="section bg-dots">
        <div className="container-x">
          {loading ? <SkeletonGrid /> : upcoming.length ? (
            <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
              {upcoming.map((w, i) => <Reveal key={w._id} delay={(i % 3) * 120} className="h-full"><WebinarCard w={w} /></Reveal>)}
            </div>
          ) : <Empty text="No upcoming webinars right now. Follow us to get notified about the next one." />}
          {past.length > 0 && (
            <>
              <h2 className="mb-6 mt-16 text-2xl">Past webinars</h2>
              <div className="grid gap-7 opacity-80 sm:grid-cols-2 lg:grid-cols-3">{past.map((w) => <WebinarCard key={w._id} w={w} />)}</div>
            </>
          )}
        </div>
      </section>
    </>
  );
}

function Success({ data, w }) {
  const info = data.webinar || w;
  const shareText = encodeURIComponent(`I just registered for "${info.title}". Join me: ${location.href}`);
  return (
    <div className="text-center">
      <div className="icon-3d mx-auto h-16 w-16 bg-gradient-to-br from-emerald-400 to-teal-600 text-3xl"><FaCheckCircle /></div>
      <h3 className="mt-4 text-2xl">{data.already ? 'You are already registered!' : 'You’re registered! 🎉'}</h3>
      <p className="mt-2 text-sm text-slate-500">{fmtDateTime(info.startsAt)} · {info.platform}</p>
      {data.joinLink ? (
        <div className="mt-5 rounded-2xl bg-brand-50 p-4 text-left">
          <div className="text-xs font-semibold uppercase tracking-wide text-brand-700">Your joining link</div>
          <a href={data.joinLink} target="_blank" rel="noreferrer" className="mt-1 block break-all font-semibold text-brand-700 underline">{data.joinLink}</a>
          <p className="mt-2 text-xs text-slate-500">Save this link. Join 5 minutes before the start time.</p>
        </div>
      ) : (
        <p className="mt-5 rounded-2xl bg-amber-50 p-4 text-sm text-amber-800">The joining link will be shared with you before the webinar.</p>
      )}
      <div className="mt-5 grid gap-3">
        <a href={googleCalendarUrl({ title: info.title, startsAt: info.startsAt, durationMins: info.durationMins, details: data.joinLink ? `Join: ${data.joinLink}` : '' })} target="_blank" rel="noreferrer" className="btn btn-outline"><FaGoogle /> Add to Google Calendar</a>
        <a href={`https://wa.me/?text=${shareText}`} target="_blank" rel="noreferrer" className="btn bg-[#25D366] text-white hover:bg-[#1ebe5b]"><FaWhatsapp /> Invite friends on WhatsApp</a>
      </div>
    </div>
  );
}

function RegisterForm({ w }) {
  const { student } = useStudent();
  const [form, setForm] = useState({ name: student?.name || '', email: student?.email || '', phone: student?.phone || '', city: '' });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);
  const [manual, setManual] = useState(null);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  if (isOver(w)) {
    return (
      <div className="text-center">
        <h3 className="text-xl">This webinar has ended</h3>
        <p className="mt-2 text-sm text-slate-500">Thanks for your interest! Check out our upcoming sessions.</p>
        <Link to="/webinars" className="btn btn-primary mt-5">Upcoming webinars <FaArrowRight /></Link>
      </div>
    );
  }
  if (done) return <Success data={done} w={w} />;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { data } = await api.post(`/webinars/${w._id}/register`, form);
      const r = await completeCheckout(data);
      if (r.status === 'registered' || r.status === 'paid' || r.status === 'enrolled') setDone(r);
      else if (r.status === 'manual') setManual(r);
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  const full = w.seatsLeft === 0;
  return (
    <form onSubmit={submit}>
      <h3 className="text-xl">{w.price > 0 ? 'Book your seat' : 'Register for free'}</h3>
      <p className="mt-1 text-sm text-slate-500">{w.registeredCount > 0 ? `${w.registeredCount}+ people have already registered` : 'Limited seats available'}</p>
      <div className="mt-5 space-y-3">
        <input className="input" required placeholder="Full name *" maxLength={100} value={form.name} onChange={set('name')} />
        <input className="input" required type="email" placeholder="Email address *" maxLength={150} value={form.email} onChange={set('email')} />
        <input className="input" required type="tel" placeholder="WhatsApp number *" maxLength={20} value={form.phone} onChange={set('phone')} />
        <input className="input" placeholder="City" maxLength={80} value={form.city} onChange={set('city')} />
      </div>
      <button disabled={busy || full} className="btn btn-accent mt-5 w-full py-4 text-base">
        {full ? 'All seats booked' : busy ? 'Please wait...' : w.price > 0 ? `${w.ctaText || 'Book My Seat'} – ${inr(w.price)}` : w.ctaText || 'Reserve My Free Seat'}
      </button>
      <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-slate-400"><FaLock /> We respect your privacy. No spam.</p>
      {w.seatsLeft !== null && w.seatsLeft > 0 && w.seatsLeft <= 50 && <p className="mt-2 text-center text-xs font-semibold text-red-600">Only {w.seatsLeft} seats left!</p>}
      {manual && <ManualPaymentModal info={manual} title={w.title} onClose={() => setManual(null)} />}
    </form>
  );
}

export function WebinarLanding() {
  const { slug } = useParams();
  const { data: w, loading, error } = useApi(`/webinars/${slug}`);
  if (loading) return <div className="pt-32"><Loader /></div>;
  if (error || !w) return <NotFound />;
  const over = isOver(w);

  return (
    <>
      <Seo title={w.title} description={w.subtitle} />
      <section className="hero-grid relative overflow-hidden bg-brand-950 pb-16 pt-28 text-white md:pt-36 lg:pb-24">
        <div className="orb -left-24 top-10 h-96 w-96 bg-accent-500/25" />
        <div className="orb right-10 bottom-0 h-80 w-80 bg-purple-600/30" />
        <div className="container-x relative grid items-start gap-10 lg:grid-cols-[1.25fr_1fr]">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-accent-500/20 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-accent-400 ring-1 ring-accent-500/40">
              {over ? 'Webinar ended' : <><span className="h-2 w-2 animate-pulse rounded-full bg-accent-400" /> {w.price > 0 ? 'Live paid masterclass' : 'Free live masterclass'}</>}
            </span>
            <h1 className="mt-5 text-4xl leading-tight text-white md:text-[3.2rem]">{w.title}</h1>
            <p className="mt-5 text-lg text-brand-100/85">{w.subtitle}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              {[[FaCalendarAlt, fmtDate(w.startsAt, { weekday: 'long' })], [FaClock, `${fmtTime(w.startsAt)} · ${w.durationMins} mins`], [FaVideo, `Live on ${w.platform}`], w.registeredCount > 0 && [FaUsers, `${w.registeredCount}+ registered`]].filter(Boolean).map(([I, t]) => (
                <span key={t} className="glass flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium"><I className="text-accent-400" /> {t}</span>
              ))}
            </div>
            {!over && <div className="mt-10"><div className="mb-3 text-sm font-semibold uppercase tracking-wider text-brand-200">Starts in</div><Countdown to={w.startsAt} /></div>}
            {w.host?.name && (
              <div className="mt-10 flex items-center gap-4">
                {w.host.photo ? <img src={assetUrl(w.host.photo)} alt="" className="h-14 w-14 rounded-full object-cover ring-2 ring-white/30" /> : <span className="icon-3d h-14 w-14 rounded-full bg-gradient-to-br from-accent-400 to-rose-600 text-xl font-bold">{w.host.name[0]}</span>}
                <div><div className="text-xs text-brand-200">Hosted by</div><div className="font-semibold text-white">{w.host.name}</div>{w.host.title && <div className="text-sm text-brand-200">{w.host.title}</div>}</div>
              </div>
            )}
          </div>
          <div id="register" className="rounded-3xl bg-white p-6 text-slate-800 shadow-2xl shadow-black/40 md:p-8 lg:sticky lg:top-24">
            {w.banner && <FitImage src={w.banner} lazy={false} className="-mx-2 -mt-2 mb-6 aspect-video w-[calc(100%+1rem)] rounded-2xl" />}
            <RegisterForm w={w} />
          </div>
        </div>
      </section>

      <div className="container-x grid gap-10 py-16 lg:grid-cols-[1.25fr_1fr]">
        <div className="space-y-14">
          {w.whatYouLearn?.length > 0 && <Reveal className="rounded-3xl border border-brand-100 bg-brand-50/50 p-6 md:p-8"><h2 className="mb-6 text-2xl">In this webinar you’ll discover</h2><CheckList items={w.whatYouLearn} cols={1} /></Reveal>}
          {w.bonuses?.length > 0 && (
            <Reveal className="rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-6 md:p-8">
              <h2 className="mb-6 flex items-center gap-3 text-2xl"><span className="icon-3d h-11 w-11 bg-gradient-to-br from-amber-400 to-orange-600 text-lg"><FaGift /></span> Bonuses for live attendees</h2>
              <CheckList items={w.bonuses} cols={1} />
            </Reveal>
          )}
          {w.description && <Reveal><h2 className="mb-4 text-2xl">About this webinar</h2><p className="prose-text">{w.description}</p></Reveal>}
          <Reveal><Person p={w.host} label="Your Host" /></Reveal>
        </div>
      </div>

      {w.faqs?.length > 0 && (
        <section className="section bg-slate-50"><div className="container-x max-w-3xl"><SectionHeading title="Frequently asked questions" /><Faqs items={w.faqs} /></div></section>
      )}

      {!over && (
        <section className="section">
          <div className="container-x">
            <Reveal className="hero-grid relative overflow-hidden rounded-[2rem] bg-brand-950 p-10 text-center md:p-16">
              <div className="orb left-1/3 top-0 h-72 w-72 bg-accent-500/30" />
              <h2 className="relative text-3xl text-white md:text-4xl">Don’t miss this <span className="text-gradient">live session</span></h2>
              <p className="relative mt-3 text-brand-100/80">{fmtDateTime(w.startsAt)} · {w.platform}</p>
              <div className="relative mt-8 flex justify-center"><Countdown to={w.startsAt} /></div>
              <a href="#register" className="btn btn-accent relative mt-10 px-8 py-4 text-base">{w.ctaText || 'Reserve My Seat'} <FaArrowRight /></a>
            </Reveal>
          </div>
        </section>
      )}
    </>
  );
}
