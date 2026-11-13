import { useParams, Link } from 'react-router-dom';
import { FaPrint, FaCheckCircle } from 'react-icons/fa';
import { useApi } from '../../lib/api';
import { fmtDate } from '../../lib/format';
import { useSettings } from '../../context/SettingsContext';
import { Loader, Seo } from '../../components/ui';
import { Logo } from '../../components/Layout';

/** Printable certificate. The URL doubles as a public verification link. */
export default function Certificate() {
  const { id } = useParams();
  const { settings } = useSettings();
  const { data: c, loading, error } = useApi(`/certificates/${id}`);
  if (loading) return <Loader className="min-h-screen items-center" />;
  if (error || !c)
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
        <h1 className="text-2xl">Certificate not found</h1>
        <p className="text-slate-500">This certificate ID is invalid or the course is not yet completed.</p>
        <Link to="/" className="btn btn-primary">Go home</Link>
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-200 p-4 print:bg-white print:p-0 md:p-10">
      <Seo title={`Certificate – ${c.studentName}`} />
      <style>{`@media print { @page { size: A4 landscape; margin: 0 } .no-print { display: none !important } }`}</style>
      <div className="no-print mx-auto mb-6 flex max-w-5xl flex-wrap items-center justify-between gap-3">
        <span className="flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700"><FaCheckCircle /> Verified certificate</span>
        <button onClick={() => window.print()} className="btn btn-primary"><FaPrint /> Print / Save as PDF</button>
      </div>
      <div className="mx-auto aspect-[1.414] max-w-5xl bg-white p-3 shadow-2xl print:shadow-none">
        <div className="relative flex h-full flex-col items-center justify-between overflow-hidden border-[10px] border-double border-brand-800 p-8 text-center md:p-14">
          <div className="absolute -left-24 -top-24 h-64 w-64 rounded-full bg-brand-100" />
          <div className="absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-accent-400/20" />
          <div className="relative"><Logo /></div>
          <div className="relative">
            <div className="text-sm font-bold uppercase tracking-[0.4em] text-accent-600">Certificate of Completion</div>
            <p className="mt-6 text-slate-500">This is to certify that</p>
            <h1 className="mt-3 font-serif text-4xl italic text-brand-900 md:text-6xl">{c.studentName}</h1>
            <div className="mx-auto mt-4 h-px w-2/3 bg-gradient-to-r from-transparent via-brand-300 to-transparent" />
            <p className="mt-5 text-slate-500">has successfully completed the online course</p>
            <h2 className="mt-2 text-2xl text-slate-900 md:text-3xl">{c.courseTitle}</h2>
          </div>
          <div className="relative grid w-full grid-cols-3 items-end gap-4 text-sm">
            <div><div className="font-semibold text-slate-900">{fmtDate(c.completedAt)}</div><div className="mt-1 border-t border-slate-300 pt-1 text-slate-500">Date</div></div>
            <div className="flex justify-center"><div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-amber-500 text-xs font-extrabold uppercase text-amber-900 shadow-lg ring-4 ring-amber-200">Certified</div></div>
            <div><div className="font-semibold text-slate-900">{c.instructor || settings.siteName}</div><div className="mt-1 border-t border-slate-300 pt-1 text-slate-500">Instructor</div></div>
          </div>
          <div className="relative text-[11px] text-slate-400">Certificate ID: {c.id} · Verify at {location.host}/certificate/{c.id}</div>
        </div>
      </div>
    </div>
  );
}
