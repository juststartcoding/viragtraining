import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  FaArrowLeft, FaPlus, FaTrash, FaEdit, FaUsers, FaVideo, FaCheckCircle, FaExternalLinkAlt, FaWhatsapp, FaSearch,
  FaUserPlus, FaRupeeSign, FaClipboardList, FaCalendarAlt, FaCheck, FaTimes, FaBan,
} from 'react-icons/fa';
import { api, useApi, errMsg } from '../lib/api';
import { fmtDateTime, fmtDate, inr, toLocalInput } from '../lib/format';
import { Loader } from '../components/ui';
import { Modal } from '../components/lms';

const waLink = (phone = '', text = '') => {
  const d = phone.replace(/\D/g, '');
  return `https://wa.me/${d.length === 10 ? `91${d}` : d}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
};

function downloadCsv(name, cols, rows) {
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csv = [cols.map((c) => c[1]).join(','), ...rows.map((r) => cols.map(([k]) => esc(typeof k === 'function' ? k(r) : r[k])).join(','))].join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv' }));
  a.download = `${name}-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
}

const Back = ({ to, label }) => (
  <Link to={to} className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-brand-600"><FaArrowLeft /> {label}</Link>
);

/* ======================= LMS dashboard widget ======================= */
export function LmsOverview() {
  const { data } = useApi('/admin/lms-stats');
  if (!data) return null;
  const cards = [
    ['Revenue (paid orders)', inr(data.revenue).replace('Free', '₹0'), FaRupeeSign, '/admin/orders', 'from-emerald-500 to-teal-700'],
    ['Pending payments', data.pendingOrders, FaClipboardList, '/admin/orders', 'from-amber-500 to-orange-600'],
    ['Students', data.students, FaUsers, '/admin/students', 'from-brand-500 to-brand-800'],
    ['Active enrollments', data.enrollments, FaCheckCircle, '/admin/students', 'from-indigo-500 to-purple-700'],
  ];
  return (
    <div className="mb-8">
      <h2 className="mb-4 text-lg">LMS & Sales</h2>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(([l, v, I, to, g]) => (
          <Link key={l} to={to} className={`flex items-center gap-4 rounded-2xl bg-gradient-to-br ${g} p-5 text-white shadow-lg transition hover:-translate-y-0.5`}>
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 text-xl"><I /></span>
            <div><div className="text-sm text-white/80">{l}</div><div className="text-2xl font-extrabold">{v}</div></div>
          </Link>
        ))}
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="card p-5">
          <h3 className="mb-3 text-base">Upcoming live classes</h3>
          {data.upcomingClasses.length ? (
            <ul className="space-y-2 text-sm">
              {data.upcomingClasses.map((c) => (
                <li key={c._id} className="flex justify-between gap-3"><span><b className="text-slate-800">{c.title}</b> <span className="text-slate-500">· {c.batch?.title}</span></span><span className="shrink-0 text-xs text-slate-500">{fmtDateTime(c.startsAt)}</span></li>
              ))}
            </ul>
          ) : <p className="text-sm text-slate-400">No classes scheduled.</p>}
        </div>
        <div className="card p-5">
          <h3 className="mb-3 text-base">Upcoming webinars</h3>
          {data.upcomingWebinars.length ? (
            <ul className="space-y-2 text-sm">
              {data.upcomingWebinars.map((w) => (
                <li key={w._id} className="flex justify-between gap-3"><Link to={`/admin/webinars/${w._id}`} className="font-semibold text-slate-800 hover:text-brand-600">{w.title}</Link><span className="shrink-0 text-xs text-slate-500">{w.registrations} regs · {fmtDate(w.startsAt)}</span></li>
              ))}
            </ul>
          ) : <p className="text-sm text-slate-400">No upcoming webinars.</p>}
        </div>
      </div>
    </div>
  );
}

/* ======================= Batch manage ======================= */
const emptySession = { title: '', startsAt: '', durationMins: 60, meetingLink: '', recordingUrl: '', notes: '' };

function SessionForm({ batchId, session, onClose, onSaved }) {
  const [f, setF] = useState(session ? { ...session, startsAt: toLocalInput(session.startsAt) } : emptySession);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    const body = { ...f, startsAt: new Date(f.startsAt).toISOString() };
    try {
      if (session?._id) await api.put(`/admin/sessions/${session._id}`, body);
      else await api.post(`/admin/batches/${batchId}/sessions`, body);
      toast.success('Class saved');
      onSaved();
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal onClose={onClose}>
      <form onSubmit={save} className="space-y-3">
        <h3 className="text-lg">{session?._id ? 'Edit class' : 'Schedule a live class'}</h3>
        <div><label className="label">Topic / title *</label><input className="input" required value={f.title} onChange={set('title')} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Date & time *</label><input className="input" type="datetime-local" required value={f.startsAt} onChange={set('startsAt')} /></div>
          <div><label className="label">Duration (min)</label><input className="input" type="number" min={15} value={f.durationMins} onChange={set('durationMins')} /></div>
        </div>
        <div><label className="label">Meeting link (optional)</label><input className="input" type="url" placeholder="Leave empty to use batch default link" value={f.meetingLink} onChange={set('meetingLink')} /></div>
        <div><label className="label">Recording URL (after class)</label><input className="input" type="url" value={f.recordingUrl} onChange={set('recordingUrl')} /></div>
        <div><label className="label">Notes for students</label><textarea className="input" rows={2} value={f.notes} onChange={set('notes')} /></div>
        <button disabled={busy} className="btn btn-primary w-full">{busy ? 'Saving...' : 'Save class'}</button>
      </form>
    </Modal>
  );
}

function AddStudent({ kind, refId, onClose, onSaved }) {
  const [q, setQ] = useState('');
  const { data: students } = useApi(`/admin/students${q.length >= 2 ? `?search=${encodeURIComponent(q)}` : ''}`, []);
  const [creating, setCreating] = useState(false);
  const [nf, setNf] = useState({ name: '', email: '', phone: '', password: '' });

  const enroll = async (userId) => {
    try {
      await api.post('/admin/enrollments', { userId, kind, refId });
      toast.success('Student enrolled');
      onSaved();
    } catch (err) {
      toast.error(errMsg(err));
    }
  };
  const create = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/admin/students', nf);
      await enroll(data.id);
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  return (
    <Modal onClose={onClose}>
      <h3 className="text-lg">Enroll a student</h3>
      {!creating ? (
        <>
          <div className="relative mt-4"><FaSearch className="absolute left-4 top-3.5 text-slate-400" /><input className="input pl-10" placeholder="Search by name, email or phone" value={q} onChange={(e) => setQ(e.target.value)} autoFocus /></div>
          <ul className="mt-3 max-h-72 divide-y divide-slate-100 overflow-y-auto">
            {students.slice(0, 30).map((s) => (
              <li key={s._id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <div className="min-w-0"><div className="font-semibold text-slate-800">{s.name}</div><div className="truncate text-xs text-slate-500">{s.email} · {s.phone}</div></div>
                <button onClick={() => enroll(s._id)} className="btn btn-primary btn-sm">Enroll</button>
              </li>
            ))}
            {!students.length && <li className="py-4 text-center text-sm text-slate-400">No students found</li>}
          </ul>
          <button onClick={() => setCreating(true)} className="btn btn-outline btn-sm mt-4 w-full"><FaUserPlus /> Create new student account</button>
        </>
      ) : (
        <form onSubmit={create} className="mt-4 space-y-3">
          <input className="input" required placeholder="Full name" value={nf.name} onChange={(e) => setNf({ ...nf, name: e.target.value })} />
          <input className="input" required type="email" placeholder="Email (login ID)" value={nf.email} onChange={(e) => setNf({ ...nf, email: e.target.value })} />
          <input className="input" placeholder="Phone" value={nf.phone} onChange={(e) => setNf({ ...nf, phone: e.target.value })} />
          <input className="input" required minLength={6} placeholder="Password (share with student)" value={nf.password} onChange={(e) => setNf({ ...nf, password: e.target.value })} />
          <div className="flex gap-2"><button type="button" onClick={() => setCreating(false)} className="btn btn-outline flex-1">Back</button><button className="btn btn-primary flex-1">Create & enroll</button></div>
        </form>
      )}
    </Modal>
  );
}

function Attendance({ session, enrollments, onClose, onSaved }) {
  const [set, setSet] = useState(new Set(session.attendees.map(String)));
  const toggle = (id) => setSet((s) => {
    const n = new Set(s);
    n.has(id) ? n.delete(id) : n.add(id);
    return n;
  });
  const save = async () => {
    try {
      await api.put(`/admin/sessions/${session._id}`, { ...session, attendees: [...set] });
      toast.success('Attendance saved');
      onSaved();
    } catch (err) {
      toast.error(errMsg(err));
    }
  };
  return (
    <Modal onClose={onClose}>
      <h3 className="text-lg">Attendance</h3>
      <p className="text-sm text-slate-500">{session.title} · {fmtDateTime(session.startsAt)}</p>
      <p className="mt-1 text-xs text-slate-400">Students who clicked “Join Class” are marked automatically.</p>
      <ul className="mt-4 max-h-80 space-y-1 overflow-y-auto">
        {enrollments.filter((e) => e.user).map((e) => (
          <li key={e._id}>
            <label className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 hover:bg-slate-50">
              <input type="checkbox" className="h-5 w-5 accent-brand-600" checked={set.has(String(e.user._id))} onChange={() => toggle(String(e.user._id))} />
              <span className="text-sm text-slate-800">{e.user.name}</span>
            </label>
          </li>
        ))}
      </ul>
      <button onClick={save} className="btn btn-primary mt-4 w-full">Save attendance ({set.size} present)</button>
    </Modal>
  );
}

export function BatchManage() {
  const { id } = useParams();
  const { data, loading, reload } = useApi(`/admin/batches/${id}/manage`);
  const [sessionForm, setSessionForm] = useState(null);
  const [adding, setAdding] = useState(false);
  const [attendance, setAttendance] = useState(null);
  if (loading || !data) return <Loader />;
  const { batch, enrollments, sessions } = data;
  const active = enrollments.filter((e) => e.status === 'active' && e.user);
  const now = Date.now();

  const delSession = async (s) => {
    if (!confirm(`Delete class "${s.title}"?`)) return;
    await api.delete(`/admin/sessions/${s._id}`);
    reload();
  };
  const toggleEnrollment = async (e) => {
    const status = e.status === 'active' ? 'revoked' : 'active';
    if (status === 'revoked' && !confirm(`Remove ${e.user?.name} from this batch?`)) return;
    await api.patch(`/admin/enrollments/${e._id}`, { status });
    reload();
  };

  return (
    <div>
      <Back to="/admin/r/batches" label="All batches" />
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl">{batch.title}</h1>
          <p className="text-sm text-slate-500">{batch.schedule} · {batch.platform} · starts {fmtDate(batch.startDate)}</p>
        </div>
        <a href={`/batches/${batch.slug}`} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm"><FaExternalLinkAlt /> Landing page</a>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <section className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg"><FaVideo className="text-brand-600" /> Live classes ({sessions.length})</h2>
            <button onClick={() => setSessionForm({})} className="btn btn-primary btn-sm"><FaPlus /> Schedule class</button>
          </div>
          {!batch.meetingLink && <p className="mb-3 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">Tip: add a default meeting link in the batch settings, or add a link to each class.</p>}
          <ul className="divide-y divide-slate-100">
            {sessions.map((s) => {
              const past = new Date(s.startsAt).getTime() + s.durationMins * 60000 < now;
              return (
                <li key={s._id} className="flex flex-wrap items-center gap-3 py-3">
                  <div className={`flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl text-xs ${past ? 'bg-slate-100 text-slate-500' : 'bg-brand-50 text-brand-700'}`}>
                    <b className="text-base leading-none">{new Date(s.startsAt).getDate()}</b>{new Date(s.startsAt).toLocaleDateString('en-IN', { month: 'short' })}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-slate-800">{s.title}</div>
                    <div className="text-xs text-slate-500">{fmtDateTime(s.startsAt)} · {s.durationMins}m {s.recordingUrl && '· 🎥 recording added'}</div>
                  </div>
                  <button onClick={() => setAttendance(s)} className="btn btn-outline btn-sm" title="Attendance"><FaCheckCircle /> {s.attendees.length}/{active.length}</button>
                  <button onClick={() => setSessionForm(s)} className="rounded-lg p-2 text-brand-600 hover:bg-brand-50" aria-label="Edit"><FaEdit /></button>
                  <button onClick={() => delSession(s)} className="rounded-lg p-2 text-red-500 hover:bg-red-50" aria-label="Delete"><FaTrash /></button>
                </li>
              );
            })}
            {!sessions.length && <li className="py-8 text-center text-sm text-slate-400">No classes yet. Click “Schedule class”.</li>}
          </ul>
        </section>

        <section className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg"><FaUsers className="text-brand-600" /> Students ({active.length}{batch.capacity ? `/${batch.capacity}` : ''})</h2>
            <div className="flex gap-2">
              <button onClick={() => downloadCsv('batch-students', [[(r) => r.user?.name, 'Name'], [(r) => r.user?.email, 'Email'], [(r) => r.user?.phone, 'Phone'], ['status', 'Status'], ['source', 'Source']], enrollments)} className="btn btn-outline btn-sm">CSV</button>
              <button onClick={() => setAdding(true)} className="btn btn-primary btn-sm"><FaUserPlus /> Add</button>
            </div>
          </div>
          <ul className="divide-y divide-slate-100">
            {enrollments.filter((e) => e.user).map((e) => (
              <li key={e._id} className={`flex items-center gap-3 py-2.5 text-sm ${e.status !== 'active' ? 'opacity-50' : ''}`}>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-slate-800">{e.user.name} {e.status !== 'active' && <span className="text-xs text-red-500">(removed)</span>}</div>
                  <div className="truncate text-xs text-slate-500">{e.user.email} · {e.user.phone}</div>
                </div>
                {e.user.phone && <a href={waLink(e.user.phone)} target="_blank" rel="noreferrer" className="rounded-lg p-2 text-green-600 hover:bg-green-50" aria-label="WhatsApp"><FaWhatsapp /></a>}
                <button onClick={() => toggleEnrollment(e)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100" title={e.status === 'active' ? 'Remove' : 'Restore'}>{e.status === 'active' ? <FaBan /> : <FaCheck />}</button>
              </li>
            ))}
            {!enrollments.length && <li className="py-8 text-center text-sm text-slate-400">No students yet.</li>}
          </ul>
        </section>
      </div>

      {sessionForm && <SessionForm batchId={id} session={sessionForm._id ? sessionForm : null} onClose={() => setSessionForm(null)} onSaved={() => { setSessionForm(null); reload(); }} />}
      {adding && <AddStudent kind="batch" refId={id} onClose={() => setAdding(false)} onSaved={() => { setAdding(false); reload(); }} />}
      {attendance && <Attendance session={attendance} enrollments={active} onClose={() => setAttendance(null)} onSaved={() => { setAttendance(null); reload(); }} />}
    </div>
  );
}

/* ======================= Webinar registrations ======================= */
const REG_STYLE = { registered: 'bg-blue-50 text-blue-700', attended: 'bg-emerald-50 text-emerald-700', 'no-show': 'bg-slate-100 text-slate-500', cancelled: 'bg-red-50 text-red-600' };

export function WebinarRegistrations() {
  const { id } = useParams();
  const { data, loading, reload } = useApi(`/admin/webinars/${id}/registrations`);
  const [q, setQ] = useState('');
  if (loading || !data) return <Loader />;
  const { webinar: w, registrations } = data;
  const list = registrations.filter((r) => !q || `${r.name} ${r.email} ${r.phone} ${r.city}`.toLowerCase().includes(q.toLowerCase()));
  const count = (st) => registrations.filter((r) => r.status === st).length;

  const update = async (r, patch) => {
    try {
      await api.patch(`/admin/registrations/${r._id}`, patch);
      reload();
    } catch (err) {
      toast.error(errMsg(err));
    }
  };
  const remove = async (r) => {
    if (!confirm(`Delete registration of ${r.name}?`)) return;
    await api.delete(`/admin/registrations/${r._id}`);
    reload();
  };
  const reminder = `Hi! Reminder: "${w.title}" starts ${fmtDateTime(w.startsAt)}.${w.joinLink ? ` Join here: ${w.joinLink}` : ''}`;

  return (
    <div>
      <Back to="/admin/r/webinars" label="All webinars" />
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl">{w.title}</h1>
          <p className="text-sm text-slate-500">{fmtDateTime(w.startsAt)} · {w.platform} · {w.price > 0 ? inr(w.price) : 'Free'}</p>
        </div>
        <div className="flex gap-2">
          <a href={`/webinars/${w.slug}`} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm"><FaExternalLinkAlt /> Landing page</a>
          <button onClick={() => downloadCsv('webinar-registrations', [['name', 'Name'], ['email', 'Email'], ['phone', 'Phone'], ['city', 'City'], ['status', 'Status'], [(r) => (r.paid ? 'Yes' : 'No'), 'Paid'], [(r) => fmtDateTime(r.createdAt), 'Registered at']], registrations)} className="btn btn-primary btn-sm">Export CSV</button>
        </div>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[['Total registrations', registrations.length], ['Attended', count('attended')], ['No-show', count('no-show')], ['Paid', registrations.filter((r) => r.paid).length]].map(([l, v]) => (
          <div key={l} className="card p-5"><div className="text-sm text-slate-500">{l}</div><div className="text-3xl font-extrabold text-slate-900">{v}</div></div>
        ))}
      </div>

      <div className="card overflow-x-auto">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4">
          <input className="input w-72" placeholder="Search name, email, phone, city" value={q} onChange={(e) => setQ(e.target.value)} />
          <span className="text-xs text-slate-500">Tip: use the WhatsApp icon to send a reminder with the join link.</span>
        </div>
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Name</th><th className="px-4 py-3">Contact</th><th className="px-4 py-3">City</th><th className="px-4 py-3">Registered</th><th className="px-4 py-3">Status</th><th className="px-4 py-3" /></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {list.map((r) => (
              <tr key={r._id}>
                <td className="px-4 py-3 font-semibold text-slate-900">{r.name} {w.price > 0 && <span className={`ml-1 rounded px-1.5 py-0.5 text-[10px] font-bold ${r.paid ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{r.paid ? 'PAID' : 'UNPAID'}</span>}</td>
                <td className="px-4 py-3 text-slate-600"><div>{r.email}</div><div className="text-xs">{r.phone}</div></td>
                <td className="px-4 py-3 text-slate-600">{r.city}</td>
                <td className="px-4 py-3 text-xs text-slate-500">{fmtDateTime(r.createdAt)}</td>
                <td className="px-4 py-3">
                  <select className={`rounded-full border-0 px-2.5 py-1 text-xs font-semibold ${REG_STYLE[r.status]}`} value={r.status} onChange={(e) => update(r, { status: e.target.value })}>
                    {Object.keys(REG_STYLE).map((s) => <option key={s}>{s}</option>)}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    {w.price > 0 && !r.paid && <button onClick={() => update(r, { paid: true })} className="btn btn-outline btn-sm" title="Mark paid">Mark paid</button>}
                    <a href={waLink(r.phone, reminder)} target="_blank" rel="noreferrer" className="rounded-lg p-2 text-green-600 hover:bg-green-50" aria-label="WhatsApp reminder"><FaWhatsapp /></a>
                    <button onClick={() => remove(r)} className="rounded-lg p-2 text-red-500 hover:bg-red-50" aria-label="Delete"><FaTrash /></button>
                  </div>
                </td>
              </tr>
            ))}
            {!list.length && <tr><td colSpan={6} className="py-12 text-center text-slate-400">No registrations yet. Share the landing page link to start collecting registrations.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ======================= Students ======================= */
function StudentDetail({ id, onClose }) {
  const { data, reload } = useApi(`/admin/students/${id}`);
  const { data: courses } = useApi('/online-courses/admin/all', []);
  const { data: batches } = useApi('/batches/admin/all', []);
  const [enroll, setEnroll] = useState({ kind: 'course', refId: '' });
  const [pw, setPw] = useState('');
  if (!data) return <Modal onClose={onClose}><Loader className="py-10" /></Modal>;
  const { user, enrollments, orders } = data;

  const doEnroll = async () => {
    if (!enroll.refId) return toast.error('Select a course or batch');
    try {
      await api.post('/admin/enrollments', { userId: user._id, ...enroll });
      toast.success('Enrolled');
      reload();
    } catch (err) {
      toast.error(errMsg(err));
    }
  };
  const toggle = async (e) => {
    await api.patch(`/admin/enrollments/${e._id}`, { status: e.status === 'active' ? 'revoked' : 'active' });
    reload();
  };
  const update = async (patch, msg) => {
    try {
      await api.put(`/admin/students/${user._id}`, patch);
      toast.success(msg);
      reload();
    } catch (err) {
      toast.error(errMsg(err));
    }
  };
  const options = enroll.kind === 'course' ? courses : batches;

  return (
    <Modal wide onClose={onClose}>
      <div className="max-h-[80vh] overflow-y-auto pr-2">
        <h3 className="text-xl">{user.name}</h3>
        <p className="text-sm text-slate-500">{user.email} · {user.phone} · joined {fmtDate(user.createdAt)}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {user.phone && <a href={waLink(user.phone)} target="_blank" rel="noreferrer" className="btn btn-sm bg-[#25D366] text-white"><FaWhatsapp /> WhatsApp</a>}
          <button onClick={() => update({ active: !user.active }, user.active ? 'Account disabled' : 'Account enabled')} className={`btn btn-sm ${user.active ? 'btn-danger' : 'btn-primary'}`}>{user.active ? 'Disable account' : 'Enable account'}</button>
        </div>

        <h4 className="mb-2 mt-6 font-bold text-slate-900">Enrollments</h4>
        <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
          {enrollments.map((e) => (
            <li key={e._id} className={`flex items-center justify-between gap-3 p-3 text-sm ${e.status !== 'active' ? 'opacity-50' : ''}`}>
              <div>
                <span className={`mr-2 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${e.kind === 'course' ? 'bg-indigo-50 text-indigo-700' : 'bg-emerald-50 text-emerald-700'}`}>{e.kind}</span>
                <b className="text-slate-800">{e.course?.title || e.batch?.title || '(deleted)'}</b>
                {e.kind === 'course' && e.course && <span className="ml-2 text-xs text-slate-500">{e.completedLessons.length}/{e.course.lessonsCount} lessons{e.completedAt ? ' · ✅ completed' : ''}</span>}
                <span className="ml-2 text-xs text-slate-400">via {e.source}</span>
              </div>
              <button onClick={() => toggle(e)} className="btn btn-outline btn-sm">{e.status === 'active' ? 'Revoke' : 'Restore'}</button>
            </li>
          ))}
          {!enrollments.length && <li className="p-4 text-center text-sm text-slate-400">No enrollments</li>}
        </ul>
        <div className="mt-3 flex flex-wrap gap-2 rounded-xl bg-slate-50 p-3">
          <select className="input w-36" value={enroll.kind} onChange={(e) => setEnroll({ kind: e.target.value, refId: '' })}><option value="course">Online course</option><option value="batch">Live batch</option></select>
          <select className="input min-w-0 flex-1" value={enroll.refId} onChange={(e) => setEnroll({ ...enroll, refId: e.target.value })}>
            <option value="">Select...</option>
            {options.map((o) => <option key={o._id} value={o._id}>{o.title}</option>)}
          </select>
          <button onClick={doEnroll} className="btn btn-primary btn-sm">Enroll manually</button>
        </div>

        <h4 className="mb-2 mt-6 font-bold text-slate-900">Orders</h4>
        {orders.length ? (
          <ul className="space-y-1 text-sm">{orders.map((o) => <li key={o._id} className="flex justify-between"><span>{o.title}</span><span className="text-slate-500">{inr(o.amount)} · {o.status} · {fmtDate(o.createdAt)}</span></li>)}</ul>
        ) : <p className="text-sm text-slate-400">No orders</p>}

        <h4 className="mb-2 mt-6 font-bold text-slate-900">Reset password</h4>
        <div className="flex gap-2"><input className="input" placeholder="New password (min 6)" value={pw} onChange={(e) => setPw(e.target.value)} /><button onClick={() => pw.length >= 6 ? update({ password: pw }, 'Password reset') : toast.error('Min 6 characters')} className="btn btn-outline">Reset</button></div>
      </div>
    </Modal>
  );
}

export function Students() {
  const [q, setQ] = useState('');
  const { data, loading, reload } = useApi(`/admin/students${q ? `?search=${encodeURIComponent(q)}` : ''}`, []);
  const [open, setOpen] = useState(null);
  const [creating, setCreating] = useState(false);
  const [nf, setNf] = useState({ name: '', email: '', phone: '', password: '' });

  const create = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/students', nf);
      toast.success('Student created');
      setCreating(false);
      setNf({ name: '', email: '', phone: '', password: '' });
      reload();
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div><h1 className="text-2xl">Students</h1><p className="text-sm text-slate-500">{data.length} students</p></div>
        <div className="flex gap-2">
          <input className="input w-64" placeholder="Search name, email, phone" value={q} onChange={(e) => setQ(e.target.value)} />
          <button onClick={() => downloadCsv('students', [['name', 'Name'], ['email', 'Email'], ['phone', 'Phone'], ['enrollments', 'Enrollments'], [(r) => fmtDate(r.createdAt), 'Joined']], data)} className="btn btn-outline">CSV</button>
          <button onClick={() => setCreating(true)} className="btn btn-primary"><FaUserPlus /> Add student</button>
        </div>
      </div>
      <div className="card overflow-x-auto">
        {loading ? <Loader className="py-14" /> : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Name</th><th className="px-4 py-3">Email</th><th className="px-4 py-3">Phone</th><th className="px-4 py-3">Enrollments</th><th className="px-4 py-3">Joined</th><th /></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((u) => (
                <tr key={u._id} className="hover:bg-slate-50/60">
                  <td className="px-4 py-3 font-semibold text-slate-900">{u.name} {!u.active && <span className="text-xs text-red-500">(disabled)</span>}</td>
                  <td className="px-4 py-3 text-slate-600">{u.email}</td>
                  <td className="px-4 py-3 text-slate-600">{u.phone}</td>
                  <td className="px-4 py-3"><span className="chip">{u.enrollments}</span></td>
                  <td className="px-4 py-3 text-xs text-slate-500">{fmtDate(u.createdAt)}</td>
                  <td className="px-4 py-3 text-right"><button onClick={() => setOpen(u._id)} className="btn btn-outline btn-sm">Manage</button></td>
                </tr>
              ))}
              {!data.length && <tr><td colSpan={6} className="py-14 text-center text-slate-400">No students yet.</td></tr>}
            </tbody>
          </table>
        )}
      </div>
      {open && <StudentDetail id={open} onClose={() => { setOpen(null); reload(); }} />}
      {creating && (
        <Modal onClose={() => setCreating(false)}>
          <form onSubmit={create} className="space-y-3">
            <h3 className="text-lg">Add student</h3>
            <input className="input" required placeholder="Full name" value={nf.name} onChange={(e) => setNf({ ...nf, name: e.target.value })} />
            <input className="input" required type="email" placeholder="Email (login ID)" value={nf.email} onChange={(e) => setNf({ ...nf, email: e.target.value })} />
            <input className="input" placeholder="Phone" value={nf.phone} onChange={(e) => setNf({ ...nf, phone: e.target.value })} />
            <input className="input" required minLength={6} placeholder="Password (share with student)" value={nf.password} onChange={(e) => setNf({ ...nf, password: e.target.value })} />
            <button className="btn btn-primary w-full">Create student</button>
          </form>
        </Modal>
      )}
    </div>
  );
}

/* ======================= Orders ======================= */
const ORDER_STYLE = { paid: 'bg-emerald-50 text-emerald-700', pending: 'bg-amber-50 text-amber-700', created: 'bg-slate-100 text-slate-500', failed: 'bg-red-50 text-red-600', cancelled: 'bg-slate-100 text-slate-400' };

export function Orders() {
  const [status, setStatus] = useState('');
  const { data, loading, reload } = useApi(`/admin/orders${status ? `?status=${status}` : ''}`, []);

  const approve = async (o) => {
    const notes = prompt(`Approve payment of ${inr(o.amount)} for "${o.title}"?\nOptional note (e.g. UPI ref no.):`, '');
    if (notes === null) return;
    try {
      await api.post(`/admin/orders/${o._id}/approve`, { notes });
      toast.success('Payment approved – access granted');
      reload();
    } catch (err) {
      toast.error(errMsg(err));
    }
  };
  const cancel = async (o) => {
    if (!confirm('Cancel this order?')) return;
    await api.post(`/admin/orders/${o._id}/cancel`);
    reload();
  };
  const buyer = (o) => o.user || o.guest || {};

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div><h1 className="text-2xl">Orders & Payments</h1><p className="text-sm text-slate-500">Approve manual (UPI/bank) payments here to give access instantly.</p></div>
        <div className="flex gap-2">
          <select className="input w-44" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All orders</option>
            {Object.keys(ORDER_STYLE).map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <button onClick={() => downloadCsv('orders', [[(o) => fmtDateTime(o.createdAt), 'Date'], ['title', 'Item'], ['kind', 'Type'], ['amount', 'Amount'], ['status', 'Status'], ['gateway', 'Gateway'], [(o) => buyer(o).name, 'Buyer'], [(o) => buyer(o).email, 'Email'], [(o) => buyer(o).phone, 'Phone'], ['razorpayPaymentId', 'Payment ID'], ['notes', 'Notes']], data)} className="btn btn-outline">CSV</button>
        </div>
      </div>
      <div className="card overflow-x-auto">
        {loading ? <Loader className="py-14" /> : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Date</th><th className="px-4 py-3">Item</th><th className="px-4 py-3">Buyer</th><th className="px-4 py-3">Amount</th><th className="px-4 py-3">Status</th><th /></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((o) => {
                const b = buyer(o);
                return (
                  <tr key={o._id}>
                    <td className="px-4 py-3 text-xs text-slate-500">{fmtDateTime(o.createdAt)}<div className="font-mono">#{String(o._id).slice(-8).toUpperCase()}</div></td>
                    <td className="px-4 py-3"><div className="font-semibold text-slate-900">{o.title}</div><div className="text-xs capitalize text-slate-500">{o.kind} · {o.gateway}</div></td>
                    <td className="px-4 py-3 text-slate-600"><div>{b.name}</div><div className="text-xs">{b.email} {b.phone && `· ${b.phone}`}</div></td>
                    <td className="px-4 py-3 font-semibold">{inr(o.amount)}</td>
                    <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${ORDER_STYLE[o.status]}`}>{o.status}</span>{o.notes && <div className="mt-1 text-xs text-slate-400">{o.notes}</div>}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        {['pending', 'created'].includes(o.status) && <button onClick={() => approve(o)} className="btn btn-primary btn-sm"><FaCheck /> Approve</button>}
                        {['pending', 'created'].includes(o.status) && <button onClick={() => cancel(o)} className="btn btn-outline btn-sm"><FaTimes /></button>}
                        {b.phone && <a href={waLink(b.phone, `Hi ${b.name}, regarding your order for "${o.title}" (${inr(o.amount)})`)} target="_blank" rel="noreferrer" className="rounded-lg p-2 text-green-600 hover:bg-green-50" aria-label="WhatsApp"><FaWhatsapp /></a>}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!data.length && <tr><td colSpan={6} className="py-14 text-center text-slate-400">No orders found.</td></tr>}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

