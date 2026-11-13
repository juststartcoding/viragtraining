import { useState } from 'react';
import toast from 'react-hot-toast';
import { FaPaperPlane } from 'react-icons/fa';
import { api, errMsg, useApi } from '../lib/api';

const empty = { name: '', email: '', phone: '', interest: '', message: '', website: '' };

/** Lead capture form. `interest` pre-selects a course/product/service. */
export default function EnquiryForm({ interest = '', source = '', compact = false, title = 'Send us an enquiry' }) {
  const [form, setForm] = useState({ ...empty, interest });
  const [sending, setSending] = useState(false);
  const { data: courses } = useApi('/courses', []);
  const { data: services } = useApi('/services', []);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      const { data } = await api.post('/enquiries', { ...form, source: source || location.pathname });
      toast.success(data.message);
      setForm({ ...empty, interest });
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setSending(false);
    }
  };

  const options = [...new Set([interest, ...courses.map((c) => c.title), ...services.map((s) => s.title), 'Ready-made Software', 'Other'].filter(Boolean))];

  return (
    <form onSubmit={submit} className="card p-6 md:p-8">
      <h3 className="text-xl">{title}</h3>
      <p className="mt-1 text-sm text-slate-500">We usually respond within a few hours.</p>
      <div className={`mt-6 grid gap-4 ${compact ? '' : 'sm:grid-cols-2'}`}>
        <div>
          <label className="label">Full name *</label>
          <input className="input" required maxLength={100} value={form.name} onChange={set('name')} placeholder="Your name" />
        </div>
        <div>
          <label className="label">Phone *</label>
          <input className="input" required type="tel" maxLength={20} value={form.phone} onChange={set('phone')} placeholder="+91 98xxxxxx" />
        </div>
        <div>
          <label className="label">Email</label>
          <input className="input" type="email" maxLength={150} value={form.email} onChange={set('email')} placeholder="you@example.com" />
        </div>
        <div>
          <label className="label">Interested in</label>
          <select className="input" value={form.interest} onChange={set('interest')}>
            <option value="">Select</option>
            {options.map((o) => <option key={o}>{o}</option>)}
          </select>
        </div>
        <div className={compact ? '' : 'sm:col-span-2'}>
          <label className="label">Message</label>
          <textarea className="input min-h-28" maxLength={2000} value={form.message} onChange={set('message')} placeholder="Tell us about your requirement" />
        </div>
        {/* honeypot – hidden from humans */}
        <input type="text" tabIndex={-1} autoComplete="off" value={form.website} onChange={set('website')} className="hidden" aria-hidden="true" />
      </div>
      <button disabled={sending} className="btn btn-primary mt-6 w-full">
        <FaPaperPlane /> {sending ? 'Sending...' : 'Submit Enquiry'}
      </button>
    </form>
  );
}
