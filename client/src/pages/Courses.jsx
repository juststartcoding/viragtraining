import { useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FaClock, FaLaptop, FaSignal, FaRupeeSign, FaCheckCircle, FaChevronDown } from 'react-icons/fa';
import { useApi, assetUrl } from '../lib/api';
import { Seo, PageHeader, SkeletonGrid, Empty, FilterTabs, Loader } from '../components/ui';
import { CourseCard } from '../components/Cards';
import EnquiryForm from '../components/EnquiryForm';
import NotFound from './NotFound';

export function Courses() {
  const { data, loading } = useApi('/courses', []);
  const [cat, setCat] = useState('All');
  const [q, setQ] = useState('');
  const cats = useMemo(() => [...new Set(data.map((c) => c.category).filter(Boolean))], [data]);
  const list = data.filter(
    (c) => (cat === 'All' || c.category === cat) && (!q || `${c.title} ${c.shortDescription} ${c.technologies?.join(' ')}`.toLowerCase().includes(q.toLowerCase()))
  );

  return (
    <>
      <Seo title="Training Courses" description="Java, MERN, Python, PHP Full Stack, C/C++ and Digital Marketing courses with live projects and placement assistance." />
      <PageHeader title="Our Training Programs" subtitle="Practical, job-oriented courses designed with industry experts." crumbs={[{ label: 'Courses' }]} />
      <section className="section">
        <div className="container-x">
          <div className="mx-auto mb-8 max-w-md">
            <input className="input" placeholder="Search courses, e.g. React, Java..." value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          {cats.length > 1 && <FilterTabs options={cats} value={cat} onChange={setCat} />}
          {loading ? <SkeletonGrid count={6} /> : list.length ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((c, i) => <CourseCard key={c._id} course={c} index={i} />)}
            </div>
          ) : <Empty text="No courses found." />}
        </div>
      </section>
    </>
  );
}

function Syllabus({ modules }) {
  const [open, setOpen] = useState(0);
  return (
    <div className="space-y-3">
      {modules.map((m, i) => (
        <div key={i} className="overflow-hidden rounded-xl border border-slate-200">
          <button onClick={() => setOpen(open === i ? -1 : i)} className="flex w-full items-center justify-between bg-slate-50 px-5 py-4 text-left font-semibold text-slate-800">
            <span><span className="mr-3 text-brand-600">{String(i + 1).padStart(2, '0')}</span>{m.module}</span>
            <FaChevronDown className={`transition ${open === i ? 'rotate-180' : ''}`} />
          </button>
          {open === i && (
            <ul className="grid gap-2 px-5 py-4 sm:grid-cols-2">
              {m.topics.map((t) => (
                <li key={t} className="flex items-start gap-2 text-sm text-slate-600"><FaCheckCircle className="mt-0.5 shrink-0 text-emerald-500" />{t}</li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}

export function CourseDetail() {
  const { slug } = useParams();
  const { data: c, loading, error } = useApi(`/courses/${slug}`);
  if (loading) return <div className="pt-32"><Loader /></div>;
  if (error || !c) return <NotFound />;

  const facts = [
    { icon: FaClock, label: 'Duration', value: c.duration },
    { icon: FaLaptop, label: 'Mode', value: c.mode },
    { icon: FaSignal, label: 'Level', value: c.level },
    { icon: FaRupeeSign, label: 'Fee', value: c.fee },
  ].filter((f) => f.value);

  return (
    <>
      <Seo title={c.title} description={c.shortDescription} />
      <PageHeader title={c.title} subtitle={c.shortDescription} crumbs={[{ label: 'Courses', to: '/courses' }, { label: c.title }]} />
      <section className="section">
        <div className="container-x grid gap-10 lg:grid-cols-3">
          <div className="space-y-10 lg:col-span-2">
            {facts.length > 0 && (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {facts.map(({ icon: I, label, value }) => (
                  <div key={label} className="card p-4">
                    <I className="text-xl text-brand-600" />
                    <div className="mt-2 text-xs text-slate-500">{label}</div>
                    <div className="font-semibold text-slate-900">{value}</div>
                  </div>
                ))}
              </div>
            )}
            {c.image && <img src={assetUrl(c.image)} alt={c.title} className="w-full rounded-2xl object-cover" />}
            {c.description && (
              <div><h2 className="mb-4 text-2xl">About this course</h2><p className="prose-text">{c.description}</p></div>
            )}
            {c.technologies?.length > 0 && (
              <div>
                <h2 className="mb-4 text-2xl">Technologies you will learn</h2>
                <div className="flex flex-wrap gap-2">{c.technologies.map((t) => <span key={t} className="chip px-4 py-2 text-sm">{t}</span>)}</div>
              </div>
            )}
            {c.syllabus?.length > 0 && (
              <div><h2 className="mb-4 text-2xl">Course curriculum</h2><Syllabus modules={c.syllabus} /></div>
            )}
          </div>
          <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            {c.highlights?.length > 0 && (
              <div className="card p-6">
                <h3 className="mb-4 text-lg">Course highlights</h3>
                <ul className="space-y-3">
                  {c.highlights.map((h) => <li key={h} className="flex items-start gap-2 text-sm"><FaCheckCircle className="mt-0.5 shrink-0 text-emerald-500" />{h}</li>)}
                </ul>
              </div>
            )}
            <EnquiryForm compact interest={c.title} title="Book a free demo class" />
            <Link to="/courses" className="block text-center text-sm font-semibold text-brand-600 hover:underline">← Back to all courses</Link>
          </aside>
        </div>
      </section>
    </>
  );
}
