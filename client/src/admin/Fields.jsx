import { useState } from 'react';
import toast from 'react-hot-toast';
import { FaCloudUploadAlt, FaTrash, FaPlus, FaArrowUp, FaArrowDown, FaChevronDown } from 'react-icons/fa';
import { api, assetUrl, errMsg } from '../lib/api';
import { toLocalInput } from '../lib/format';

export function ImageField({ value, onChange }) {
  const [busy, setBusy] = useState(false);
  const upload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('image', file);
    setBusy(true);
    try {
      const { data } = await api.post('/upload', fd);
      onChange(data.url);
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
      e.target.value = '';
    }
  };
  return (
    <div className="flex items-center gap-4">
      {value ? (
        <img src={assetUrl(value)} alt="" className="h-20 w-28 rounded-lg border border-slate-200 object-cover" />
      ) : (
        <div className="flex h-20 w-28 items-center justify-center rounded-lg border border-dashed border-slate-300 text-xs text-slate-400">No image</div>
      )}
      <div className="flex flex-col gap-2">
        <label className="btn btn-outline btn-sm cursor-pointer">
          <FaCloudUploadAlt /> {busy ? 'Uploading...' : 'Upload'}
          <input type="file" accept="image/*" className="hidden" onChange={upload} disabled={busy} />
        </label>
        {value && <button type="button" onClick={() => onChange('')} className="btn btn-danger btn-sm">Remove</button>}
      </div>
    </div>
  );
}

/** Array of strings edited as one item per line */
export function ListField({ value = [], onChange, rows = 5 }) {
  const [text, setText] = useState(value.join('\n'));
  return (
    <textarea
      className="input font-mono text-xs"
      rows={rows}
      value={text}
      onChange={(e) => {
        setText(e.target.value);
        onChange(e.target.value.split('\n').map((s) => s.trim()).filter(Boolean));
      }}
    />
  );
}

export function SyllabusField({ value = [], onChange }) {
  const update = (i, patch) => onChange(value.map((m, idx) => (idx === i ? { ...m, ...patch } : m)));
  return (
    <div className="space-y-3">
      {value.map((m, i) => (
        <div key={i} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex gap-2">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">{i + 1}</span>
            <input className="input" placeholder="Module name" value={m.module} onChange={(e) => update(i, { module: e.target.value })} />
            <button type="button" className="btn btn-danger btn-sm" onClick={() => onChange(value.filter((_, idx) => idx !== i))} aria-label="Remove module">
              <FaTrash />
            </button>
          </div>
          <label className="mt-3 block text-xs text-slate-500">Topics (one per line)</label>
          <ListField rows={3} value={m.topics || []} onChange={(topics) => update(i, { topics })} />
        </div>
      ))}
      <button type="button" className="btn btn-outline btn-sm" onClick={() => onChange([...value, { module: '', topics: [] }])}>
        <FaPlus /> Add module
      </button>
    </div>
  );
}

const move = (arr, i, d) => {
  const a = [...arr];
  const j = i + d;
  if (j < 0 || j >= a.length) return a;
  [a[i], a[j]] = [a[j], a[i]];
  return a;
};

export function FaqField({ value = [], onChange }) {
  const upd = (i, patch) => onChange(value.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  return (
    <div className="space-y-3">
      {value.map((f, i) => (
        <div key={i} className="flex gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <div className="flex-1 space-y-2">
            <input className="input" placeholder="Question" value={f.q} onChange={(e) => upd(i, { q: e.target.value })} />
            <textarea className="input" rows={2} placeholder="Answer" value={f.a} onChange={(e) => upd(i, { a: e.target.value })} />
          </div>
          <button type="button" className="btn btn-danger btn-sm self-start" onClick={() => onChange(value.filter((_, j) => j !== i))} aria-label="Remove"><FaTrash /></button>
        </div>
      ))}
      <button type="button" className="btn btn-outline btn-sm" onClick={() => onChange([...value, { q: '', a: '' }])}><FaPlus /> Add FAQ</button>
    </div>
  );
}

export function PersonField({ value = {}, onChange }) {
  const v = value || {};
  const set = (k) => (e) => onChange({ ...v, [k]: e.target.value });
  return (
    <div className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2">
      <input className="input" placeholder="Name" value={v.name || ''} onChange={set('name')} />
      <input className="input" placeholder="Title / designation" value={v.title || ''} onChange={set('title')} />
      <textarea className="input sm:col-span-2" rows={3} placeholder="Short bio" value={v.bio || ''} onChange={set('bio')} />
      <div className="sm:col-span-2"><ImageField value={v.photo} onChange={(url) => onChange({ ...v, photo: url })} /></div>
    </div>
  );
}

/** Uploads a PDF/image and returns its URL */
export function FileUpload({ onUploaded, accept = 'application/pdf,image/*' }) {
  const [busy, setBusy] = useState(false);
  const up = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('image', file);
    setBusy(true);
    try {
      onUploaded((await api.post('/upload', fd)).data.url);
      toast.success('Uploaded');
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
      e.target.value = '';
    }
  };
  return (
    <label className="btn btn-outline btn-sm shrink-0 cursor-pointer">
      <FaCloudUploadAlt /> {busy ? '...' : 'Upload'}
      <input type="file" accept={accept} className="hidden" onChange={up} disabled={busy} />
    </label>
  );
}

/** Course builder: sections -> lessons */
export function CurriculumField({ value = [], onChange }) {
  const [openLesson, setOpenLesson] = useState(null);
  const setSection = (si, patch) => onChange(value.map((s, i) => (i === si ? { ...s, ...patch } : s)));
  const setLesson = (si, li, patch) => setSection(si, { lessons: value[si].lessons.map((l, j) => (j === li ? { ...l, ...patch } : l)) });
  const total = value.reduce((n, s) => n + (s.lessons?.length || 0), 0);
  const addLesson = (si) => {
    const sec = value[si];
    setSection(si, { lessons: [...(sec.lessons || []), { title: '', type: 'video', duration: 0, isPreview: false }] });
    setOpenLesson(`${si}-${sec.lessons?.length || 0}`);
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-500">
        {value.length} sections · {total} lessons. Video URL: YouTube (unlisted), Vimeo, Google Drive or direct .mp4 link. Tick “Free preview” to show a lesson on the sales page.
      </p>
      {value.map((sec, si) => (
        <div key={sec._id || si} className="overflow-hidden rounded-2xl border border-slate-200">
          <div className="flex items-center gap-2 bg-slate-100 p-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-xs font-bold text-white">{si + 1}</span>
            <input className="input py-2 font-semibold" value={sec.title} onChange={(e) => setSection(si, { title: e.target.value })} placeholder="Section title" />
            <button type="button" className="rounded-lg p-2 text-slate-500 hover:bg-white" onClick={() => onChange(move(value, si, -1))} aria-label="Move up"><FaArrowUp /></button>
            <button type="button" className="rounded-lg p-2 text-slate-500 hover:bg-white" onClick={() => onChange(move(value, si, 1))} aria-label="Move down"><FaArrowDown /></button>
            <button type="button" className="rounded-lg p-2 text-red-500 hover:bg-white" onClick={() => window.confirm('Delete this section and its lessons?') && onChange(value.filter((_, i) => i !== si))} aria-label="Delete section"><FaTrash /></button>
          </div>
          <div className="divide-y divide-slate-100">
            {(sec.lessons || []).map((l, li) => {
              const key = `${si}-${li}`;
              const isOpen = openLesson === key;
              return (
                <div key={l._id || key} className="bg-white">
                  <div className="flex items-center gap-2 px-3 py-2">
                    <span className="w-6 text-center text-xs text-slate-400">{li + 1}</span>
                    <input className="input flex-1 py-1.5" value={l.title} onChange={(e) => setLesson(si, li, { title: e.target.value })} placeholder="Lesson title" />
                    {l.isPreview && <span className="hidden rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 sm:inline">PREVIEW</span>}
                    <button type="button" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" onClick={() => setOpenLesson(isOpen ? null : key)} aria-label="Edit lesson"><FaChevronDown className={isOpen ? 'rotate-180' : ''} /></button>
                    <button type="button" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100" onClick={() => setSection(si, { lessons: move(sec.lessons, li, -1) })} aria-label="Up"><FaArrowUp /></button>
                    <button type="button" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100" onClick={() => setSection(si, { lessons: move(sec.lessons, li, 1) })} aria-label="Down"><FaArrowDown /></button>
                    <button type="button" className="rounded-lg p-2 text-red-400 hover:bg-red-50" onClick={() => setSection(si, { lessons: sec.lessons.filter((_, j) => j !== li) })} aria-label="Delete lesson"><FaTrash /></button>
                  </div>
                  {isOpen && (
                    <div className="grid gap-3 bg-slate-50 px-4 py-4 sm:grid-cols-3">
                      <div>
                        <label className="label text-xs">Type</label>
                        <select className="input" value={l.type} onChange={(e) => setLesson(si, li, { type: e.target.value })}>
                          <option value="video">Video</option>
                          <option value="article">Article / notes</option>
                          <option value="pdf">PDF</option>
                        </select>
                      </div>
                      <div>
                        <label className="label text-xs">Duration (minutes)</label>
                        <input type="number" min={0} className="input" value={l.duration || 0} onChange={(e) => setLesson(si, li, { duration: Number(e.target.value) })} />
                      </div>
                      <label className="flex items-end gap-2 pb-3 text-sm">
                        <input type="checkbox" className="h-5 w-5 accent-brand-600" checked={!!l.isPreview} onChange={(e) => setLesson(si, li, { isPreview: e.target.checked })} /> Free preview
                      </label>
                      {l.type === 'video' && (
                        <div className="sm:col-span-3">
                          <label className="label text-xs">Video URL</label>
                          <input className="input" value={l.videoUrl || ''} onChange={(e) => setLesson(si, li, { videoUrl: e.target.value })} placeholder="https://youtu.be/..." />
                        </div>
                      )}
                      <div className="sm:col-span-3">
                        <label className="label text-xs">{l.type === 'pdf' ? 'PDF URL' : 'Resource / download URL (optional)'}</label>
                        <div className="flex gap-2">
                          <input className="input" value={l.resourceUrl || ''} onChange={(e) => setLesson(si, li, { resourceUrl: e.target.value })} placeholder="https://..." />
                          <FileUpload onUploaded={(url) => setLesson(si, li, { resourceUrl: url })} />
                        </div>
                      </div>
                      <div className="sm:col-span-3">
                        <label className="label text-xs">{l.type === 'article' ? 'Article content' : 'Notes (optional)'}</label>
                        <textarea className="input" rows={l.type === 'article' ? 8 : 3} value={l.content || ''} onChange={(e) => setLesson(si, li, { content: e.target.value })} />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            <div className="bg-white p-3">
              <button type="button" className="btn btn-outline btn-sm" onClick={() => addLesson(si)}><FaPlus /> Add lesson</button>
            </div>
          </div>
        </div>
      ))}
      <button type="button" className="btn btn-primary btn-sm" onClick={() => onChange([...value, { title: `Section ${value.length + 1}`, lessons: [] }])}><FaPlus /> Add section</button>
    </div>
  );
}

export function Field({ f, value, onChange }) {
  switch (f.type) {
    case 'textarea':
      return <textarea className="input" rows={f.rows || 3} required={f.required} value={value ?? ''} onChange={(e) => onChange(e.target.value)} placeholder={f.placeholder} />;
    case 'number':
      return <input type="number" className="input" min={f.min} max={f.max} value={value ?? 0} onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))} />;
    case 'select':
      return (
        <select className="input" value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
          {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      );
    case 'checkbox':
      return (
        <label className="flex cursor-pointer items-center gap-3 text-sm">
          <input type="checkbox" className="h-5 w-5 accent-brand-600" checked={!!value} onChange={(e) => onChange(e.target.checked)} />
          {f.label}
        </label>
      );
    case 'image':
      return <ImageField value={value} onChange={onChange} />;
    case 'list':
      return <ListField value={value || []} onChange={onChange} />;
    case 'syllabus':
      return <SyllabusField value={value || []} onChange={onChange} />;
    case 'datetime':
      return <input type="datetime-local" className="input" required={f.required} value={toLocalInput(value)} onChange={(e) => onChange(e.target.value ? new Date(e.target.value).toISOString() : null)} />;
    case 'faqs':
      return <FaqField value={value || []} onChange={onChange} />;
    case 'person':
      return <PersonField value={value || {}} onChange={onChange} />;
    case 'curriculum':
      return <CurriculumField value={value || []} onChange={onChange} />;
    default:
      return <input type={f.type === 'url' ? 'url' : 'text'} className="input" required={f.required} value={value ?? ''} onChange={(e) => onChange(e.target.value)} placeholder={f.placeholder} />;
  }
}
