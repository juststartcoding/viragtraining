import { useEffect, useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  FaBookOpen, FaVideo, FaUsers, FaReceipt, FaUserCog, FaPlayCircle, FaCertificate, FaCalendarAlt, FaClock,
  FaExternalLinkAlt, FaGoogle, FaCheckCircle, FaSignOutAlt, FaChalkboard,
} from 'react-icons/fa';
import { useStudent } from '../../context/StudentContext';
import { api, useApi, assetUrl, errMsg } from '../../lib/api';
import { fmtDateTime, fmtDate, inr, googleCalendarUrl } from '../../lib/format';
import { Seo, Loader } from '../../components/ui';

const TABS = [
  { id: 'courses', label: 'My Courses', icon: FaBookOpen },
  { id: 'classes', label: 'Live Classes', icon: FaVideo },
  { id: 'webinars', label: 'Webinars', icon: FaChalkboard },
  { id: 'orders', label: 'Orders', icon: FaReceipt },
  { id: 'profile', label: 'Profile', icon: FaUserCog },
];

function EmptyBox({ text, cta, to }) {
  return (
    <div className="card flex flex-col items-center p-12 text-center">
      <p className="text-slate-500">{text}</p>
      {cta && <Link to={to} className="btn btn-primary mt-5">{cta}</Link>}
    </div>
  );
}

function Courses({ items }) {
  if (!items.length) return <EmptyBox text="You haven’t enrolled in any online course yet." cta="Browse online courses" to="/learn" />;
  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {items.map((e) => (
        <div key={e.enrollmentId} className="card flex flex-col overflow-hidden">
          {e.course.thumbnail ? (
            <img src={assetUrl(e.course.thumbnail)} alt="" className="h-40 w-full object-cover" />
          ) : (
            <div className="grid-lines flex h-40 items-center justify-center bg-gradient-to-br from-indigo-600 to-purple-800"><FaPlayCircle className="text-5xl text-white/80" /></div>
          )}
          <div className="flex flex-1 flex-col p-5">
            <h3 className="text-base leading-snug">{e.course.title}</h3>
            <div className="mt-4">
              <div className="mb-1.5 flex justify-between text-xs text-slate-500"><span>{e.completed}/{e.lessonsCount} lessons</span><b className="text-slate-800">{e.progress}%</b></div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-emerald-500 transition-all" style={{ width: `${e.progress}%` }} /></div>
            </div>
            <div className="mt-5 flex gap-2 pt-1">
              <Link to={`/learn/${e.course.slug}/watch`} className="btn btn-primary btn-sm flex-1">{e.progress > 0 ? 'Continue' : 'Start'} learning</Link>
              {e.completedAt && e.course.certificate && (
                <Link to={`/certificate/${e.enrollmentId}`} className="btn btn-sm bg-amber-50 text-amber-700 hover:bg-amber-100"><FaCertificate /> Certificate</Link>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ClassRow({ s, past }) {
  const [busy, setBusy] = useState(false);
  const start = new Date(s.startsAt).getTime();
  const end = start + s.durationMins * 60000;
  const now = Date.now();
  const live = now >= start - 30 * 60000 && now <= end + 60 * 60000;
  const join = async () => {
    setBusy(true);
    const win = window.open('', '_blank'); // open synchronously to avoid popup blockers
    try {
      const { data } = await api.get(`/student/sessions/${s._id}/join`);
      if (win) win.location.href = data.link;
      else location.href = data.link;
    } catch (e) {
      win?.close();
      toast.error(errMsg(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="card flex flex-wrap items-center gap-4 p-5">
      <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
        <span className="text-xs font-semibold uppercase">{new Date(s.startsAt).toLocaleDateString('en-IN', { month: 'short' })}</span>
        <span className="text-2xl font-extrabold leading-none">{new Date(s.startsAt).getDate()}</span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-xs font-semibold text-brand-600">{s.batch?.title}</div>
        <div className="font-semibold text-slate-900">{s.title}</div>
        <div className="mt-1 flex flex-wrap gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1"><FaClock /> {fmtDateTime(s.startsAt)} · {s.durationMins} min</span>
          {s.attended && <span className="flex items-center gap-1 text-emerald-600"><FaCheckCircle /> Attended</span>}
        </div>
        {s.notes && <p className="mt-2 text-sm text-slate-600">{s.notes}</p>}
      </div>
      <div className="flex flex-wrap gap-2">
        {!past && (
          live ? (
            <button onClick={join} disabled={busy} className="btn btn-accent btn-sm"><span className="h-2 w-2 animate-pulse rounded-full bg-white" /> {busy ? 'Opening...' : 'Join Class'}</button>
          ) : (
            <a href={googleCalendarUrl({ title: s.title, startsAt: s.startsAt, durationMins: s.durationMins })} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm"><FaGoogle /> Add to calendar</a>
          )
        )}
        {s.recordingUrl && <a href={s.recordingUrl} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm"><FaPlayCircle /> Recording</a>}
      </div>
    </div>
  );
}

function Classes({ data }) {
  if (!data.batches.length) return <EmptyBox text="You are not enrolled in any live batch yet." cta="View live batches" to="/batches" />;
  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2">
        {data.batches.map((b) => (
          <div key={b._id} className="card flex items-center gap-4 p-5">
            <span className="icon-3d h-12 w-12 shrink-0 bg-gradient-to-br from-emerald-500 to-teal-700"><FaUsers /></span>
            <div><div className="font-semibold text-slate-900">{b.title}</div><div className="text-xs text-slate-500">{b.schedule} · {b.platform}</div></div>
          </div>
        ))}
      </div>
      <div>
        <h3 className="mb-4 text-lg">Upcoming classes</h3>
        {data.upcoming.length ? <div className="space-y-3">{data.upcoming.map((s) => <ClassRow key={s._id} s={s} />)}</div> : <p className="text-sm text-slate-500">No upcoming classes scheduled yet. You’ll see them here once your trainer schedules them.</p>}
      </div>
      {data.past.length > 0 && (
        <div>
          <h3 className="mb-4 text-lg">Past classes & recordings</h3>
          <div className="space-y-3">{data.past.map((s) => <ClassRow key={s._id} s={s} past />)}</div>
        </div>
      )}
    </div>
  );
}

function Webinars({ items }) {
  if (!items.length) return <EmptyBox text="You haven’t registered for any webinar yet." cta="See upcoming webinars" to="/webinars" />;
  return (
    <div className="space-y-3">
      {items.map(({ _id, webinar: w, paid }) => (
        <div key={_id} className="card flex flex-wrap items-center gap-4 p-5">
          <span className="icon-3d h-12 w-12 shrink-0 bg-gradient-to-br from-orange-500 to-rose-600"><FaCalendarAlt /></span>
          <div className="min-w-0 flex-1">
            <Link to={`/webinars/${w.slug}`} className="font-semibold text-slate-900 hover:text-brand-700">{w.title}</Link>
            <div className="text-xs text-slate-500">{fmtDateTime(w.startsAt)} · {w.platform}{w.price > 0 && !paid && ' · Payment pending'}</div>
          </div>
          {w.joinLink && <a href={w.joinLink} target="_blank" rel="noreferrer" className="btn btn-accent btn-sm"><FaExternalLinkAlt /> Join link</a>}
          {w.replayUrl && <a href={w.replayUrl} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm"><FaPlayCircle /> Replay</a>}
        </div>
      ))}
    </div>
  );
}

const ORDER_STYLE = { paid: 'bg-emerald-50 text-emerald-700', pending: 'bg-amber-50 text-amber-700', created: 'bg-slate-100 text-slate-500', failed: 'bg-red-50 text-red-600', cancelled: 'bg-slate-100 text-slate-500' };

function Orders({ items }) {
  if (!items.length) return <EmptyBox text="No orders yet." />;
  return (
    <div className="card overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Date</th><th className="px-4 py-3">Item</th><th className="px-4 py-3">Amount</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Order ID</th></tr></thead>
        <tbody className="divide-y divide-slate-100">
          {items.map((o) => (
            <tr key={o._id}>
              <td className="px-4 py-3 text-slate-500">{fmtDate(o.createdAt)}</td>
              <td className="px-4 py-3 font-medium text-slate-900">{o.title}</td>
              <td className="px-4 py-3">{inr(o.amount)}</td>
              <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${ORDER_STYLE[o.status]}`}>{o.status === 'pending' ? 'Awaiting verification' : o.status}</span></td>
              <td className="px-4 py-3"><code className="text-xs">{String(o._id).slice(-8).toUpperCase()}</code></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Profile() {
  const { student, setStudent } = useStudent();
  const [p, setP] = useState({ name: student.name, phone: student.phone || '' });
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '' });
  const saveProfile = async (e) => {
    e.preventDefault();
    try {
      setStudent((await api.put('/student/me', p)).data);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(errMsg(err));
    }
  };
  const savePw = async (e) => {
    e.preventDefault();
    try {
      await api.put('/student/password', pw);
      toast.success('Password changed');
      setPw({ currentPassword: '', newPassword: '' });
    } catch (err) {
      toast.error(errMsg(err));
    }
  };
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form onSubmit={saveProfile} className="card space-y-4 p-6">
        <h3 className="text-lg">Profile</h3>
        <div><label className="label">Email</label><input className="input bg-slate-50" disabled value={student.email} /></div>
        <div><label className="label">Name</label><input className="input" required value={p.name} onChange={(e) => setP({ ...p, name: e.target.value })} /></div>
        <div><label className="label">Phone</label><input className="input" value={p.phone} onChange={(e) => setP({ ...p, phone: e.target.value })} /></div>
        <button className="btn btn-primary">Save</button>
      </form>
      <form onSubmit={savePw} className="card space-y-4 p-6">
        <h3 className="text-lg">Change password</h3>
        <div><label className="label">Current password</label><input className="input" type="password" required value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} /></div>
        <div><label className="label">New password</label><input className="input" type="password" required minLength={6} value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} /></div>
        <button className="btn btn-primary">Update password</button>
      </form>
    </div>
  );
}

export default function StudentDashboard() {
  const { student, checking, logout } = useStudent();
  const [params, setParams] = useSearchParams();
  const tab = TABS.some((t) => t.id === params.get('tab')) ? params.get('tab') : 'courses';
  const { data, loading } = useApi(student ? '/student/dashboard' : null);
  const [, tick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => tick((x) => x + 1), 60000); // refresh "Join" availability
    return () => clearInterval(t);
  }, []);

  if (checking) return <div className="pt-32"><Loader /></div>;
  if (!student) return <Navigate to="/login?next=/dashboard" replace />;

  const counts = data && { courses: data.courses.length, classes: data.upcoming.length, webinars: data.webinars.length, orders: data.orders.length };

  return (
    <>
      <Seo title="My Dashboard" />
      <section className="hero-grid relative overflow-hidden bg-brand-950 pb-24 pt-28 text-white md:pt-32">
        <div className="orb -left-20 top-10 h-80 w-80 bg-brand-500/40" />
        <div className="container-x relative flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-brand-200">Welcome back,</p>
            <h1 className="text-3xl text-white md:text-4xl">{student.name} 👋</h1>
          </div>
          <button onClick={logout} className="btn btn-ghost-light btn-sm"><FaSignOutAlt /> Logout</button>
        </div>
      </section>
      <div className="container-x relative -mt-14 pb-20">
        <div className="mb-8 flex gap-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-xl shadow-brand-950/10">
          {TABS.map(({ id, label, icon: I }) => (
            <button key={id} onClick={() => setParams({ tab: id })}
              className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${tab === id ? 'bg-brand-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'}`}>
              <I /> {label}
              {counts?.[id] > 0 && <span className={`rounded-full px-2 text-xs ${tab === id ? 'bg-white/20' : 'bg-slate-100'}`}>{counts[id]}</span>}
            </button>
          ))}
        </div>
        {loading || !data ? <Loader /> : (
          <>
            {tab === 'courses' && <Courses items={data.courses} />}
            {tab === 'classes' && <Classes data={data} />}
            {tab === 'webinars' && <Webinars items={data.webinars} />}
            {tab === 'orders' && <Orders items={data.orders} />}
            {tab === 'profile' && <Profile />}
          </>
        )}
      </div>
    </>
  );
}
