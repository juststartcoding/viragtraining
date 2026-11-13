import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FaPlus, FaEdit, FaTrash, FaTimes, FaExternalLinkAlt, FaStar, FaEyeSlash, FaCog } from 'react-icons/fa';
import { api, errMsg, useApi } from '../lib/api';
import { resources, emptyFor } from './resources';
import { Field } from './Fields';
import { Loader } from '../components/ui';
import NotFound from '../pages/NotFound';

function FormModal({ config, item, onClose, onSaved }) {
  const [form, setForm] = useState(() => ({ ...emptyFor(config.fields), ...(item || {}) }));
  const [saving, setSaving] = useState(false);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (item?._id) await api.put(`${config.endpoint}/${item._id}`, form);
      else await api.post(config.endpoint, form);
      toast.success(`${config.singular} saved`);
      onSaved();
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-sm" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form onSubmit={save} className="flex h-full w-full max-w-4xl flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg">{item?._id ? 'Edit' : 'Add'} {config.singular}</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-2 hover:bg-slate-100" aria-label="Close"><FaTimes /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="grid gap-5 sm:grid-cols-2">
            {config.fields.map((f) => (
              <div key={f.name} className={f.full || ['syllabus', 'curriculum'].includes(f.type) ? 'sm:col-span-2' : ''}>
                {f.type !== 'checkbox' && <label className="label">{f.label}{f.required && ' *'}</label>}
                <Field f={f} value={form[f.name]} onChange={(v) => setForm((s) => ({ ...s, [f.name]: v }))} />
                {f.help && <p className="mt-1 text-xs text-slate-400">{f.help}</p>}
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
          <button type="button" onClick={onClose} className="btn btn-outline">Cancel</button>
          <button disabled={saving} className="btn btn-primary">{saving ? 'Saving...' : 'Save'}</button>
        </div>
      </form>
    </div>
  );
}

export default function ResourceManager() {
  const { resource } = useParams();
  const config = resources[resource];
  const { data, loading, reload } = useApi(config ? `${config.endpoint}/admin/all` : null, []);
  const [editing, setEditing] = useState(null); // null = closed, {} = new, item = edit
  const [q, setQ] = useState('');

  if (!config) return <NotFound />;

  const remove = async (item) => {
    if (!confirm(`Delete "${item.title || item.name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`${config.endpoint}/${item._id}`);
      toast.success('Deleted');
      reload();
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  const toggle = async (item, key) => {
    try {
      await api.put(`${config.endpoint}/${item._id}`, { [key]: !item[key] });
      reload();
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  const list = data.filter((i) => !q || JSON.stringify(i).toLowerCase().includes(q.toLowerCase()));

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl">{config.label}</h1>
          <p className="text-sm text-slate-500">{data.length} total</p>
        </div>
        <div className="flex gap-3">
          <input className="input w-56" placeholder="Search..." value={q} onChange={(e) => setQ(e.target.value)} />
          <button onClick={() => setEditing({})} className="btn btn-primary"><FaPlus /> Add {config.singular}</button>
        </div>
      </div>

      <div className="card overflow-x-auto">
        {loading ? <Loader className="py-16" /> : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                {config.columns.map((c) => <th key={c.key} className="px-4 py-3 font-semibold">{c.label}</th>)}
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {list.map((item) => (
                <tr key={item._id} className="hover:bg-slate-50/60">
                  {config.columns.map((c, ci) => (
                    <td key={c.key} className={`px-4 py-3 ${ci === 0 ? 'font-semibold text-slate-900' : 'text-slate-600'} max-w-xs truncate`}>{c.format ? c.format(item[c.key]) : String(item[c.key] ?? '')}</td>
                  ))}
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5">
                      <button onClick={() => toggle(item, 'published')} className={`rounded-full px-2.5 py-1 text-xs font-medium ${item.published ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`} title="Toggle published">
                        {item.published ? 'Live' : <span className="flex items-center gap-1"><FaEyeSlash /> Hidden</span>}
                      </button>
                      <button onClick={() => toggle(item, 'featured')} className={`rounded-full px-2 py-1 text-xs ${item.featured ? 'bg-amber-50 text-amber-500' : 'text-slate-300'}`} title="Toggle featured">
                        <FaStar />
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      {config.actions?.map((a) => (
                        <Link key={a.label} to={a.to(item)} className="btn btn-outline btn-sm whitespace-nowrap" title={a.label}><FaCog /> {a.label}</Link>
                      ))}
                      {config.publicPath && item.published && (
                        <a href={config.publicPath(item)} target="_blank" rel="noreferrer" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" title="View on site"><FaExternalLinkAlt /></a>
                      )}
                      <button onClick={() => setEditing(item)} className="rounded-lg p-2 text-brand-600 hover:bg-brand-50" title="Edit"><FaEdit /></button>
                      <button onClick={() => remove(item)} className="rounded-lg p-2 text-red-500 hover:bg-red-50" title="Delete"><FaTrash /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {!list.length && (
                <tr><td colSpan={config.columns.length + 2} className="py-14 text-center text-slate-400">No records yet. Click “Add {config.singular}”.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {editing && (
        <FormModal
          key={editing._id || 'new'}
          config={config}
          item={editing._id ? editing : null}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            reload();
          }}
        />
      )}
    </div>
  );
}
