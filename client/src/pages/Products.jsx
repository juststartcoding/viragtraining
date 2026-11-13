import { useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FaCheckCircle, FaExternalLinkAlt } from 'react-icons/fa';
import { useApi, assetUrl } from '../lib/api';
import { Seo, PageHeader, SkeletonGrid, Empty, FilterTabs, Loader } from '../components/ui';
import { ProductCard } from '../components/Cards';
import EnquiryForm from '../components/EnquiryForm';
import Icon from '../components/Icon';
import NotFound from './NotFound';

export function Products() {
  const { data, loading } = useApi('/products', []);
  const [cat, setCat] = useState('All');
  const cats = useMemo(() => [...new Set(data.map((c) => c.category).filter(Boolean))], [data]);
  const list = data.filter((p) => cat === 'All' || p.category === cat);

  return (
    <>
      <Seo title="Ready-made Software" description="Ready-to-deploy software for schools, hospitals, retail, coaching institutes and businesses." />
      <PageHeader title="Ready-made Software Products" subtitle="Proven software solutions, customised with your branding and deployed quickly." crumbs={[{ label: 'Software' }]} />
      <section className="section">
        <div className="container-x">
          {cats.length > 1 && <FilterTabs options={cats} value={cat} onChange={setCat} />}
          {loading ? <SkeletonGrid count={6} /> : list.length ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((p, i) => <ProductCard key={p._id} product={p} index={i} />)}
            </div>
          ) : <Empty text="No products found." />}
        </div>
      </section>
    </>
  );
}

export function ProductDetail() {
  const { slug } = useParams();
  const { data: p, loading, error } = useApi(`/products/${slug}`);
  if (loading) return <div className="pt-32"><Loader /></div>;
  if (error || !p) return <NotFound />;

  return (
    <>
      <Seo title={p.title} description={p.shortDescription} />
      <PageHeader title={p.title} subtitle={p.shortDescription} crumbs={[{ label: 'Software', to: '/software' }, { label: p.title }]} />
      <section className="section">
        <div className="container-x grid gap-10 lg:grid-cols-3">
          <div className="space-y-10 lg:col-span-2">
            {p.image ? (
              <img src={assetUrl(p.image)} alt={p.title} className="w-full rounded-2xl border border-slate-200 object-cover" />
            ) : (
              <div className="flex h-64 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-brand-900"><Icon name={p.icon} className="text-8xl text-white/90" /></div>
            )}
            <div className="flex flex-wrap items-center gap-4">
              <span className="chip">{p.category}</span>
              <span className="text-2xl font-extrabold text-slate-900">{p.price || 'Price on request'}</span>
              {p.demoUrl && (
                <a href={p.demoUrl} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm">Live demo <FaExternalLinkAlt /></a>
              )}
            </div>
            {p.description && <div><h2 className="mb-4 text-2xl">Overview</h2><p className="prose-text">{p.description}</p></div>}
            {p.features?.length > 0 && (
              <div>
                <h2 className="mb-4 text-2xl">Key features</h2>
                <ul className="grid gap-3 sm:grid-cols-2">
                  {p.features.map((f) => <li key={f} className="card flex items-start gap-3 p-4 text-sm"><FaCheckCircle className="mt-0.5 shrink-0 text-emerald-500" />{f}</li>)}
                </ul>
              </div>
            )}
            {p.technologies?.length > 0 && (
              <div><h2 className="mb-4 text-2xl">Built with</h2><div className="flex flex-wrap gap-2">{p.technologies.map((t) => <span key={t} className="chip px-4 py-2 text-sm">{t}</span>)}</div></div>
            )}
          </div>
          <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            <EnquiryForm compact interest={p.title} title="Request a free demo" />
            <Link to="/software" className="block text-center text-sm font-semibold text-brand-600 hover:underline">← Back to all software</Link>
          </aside>
        </div>
      </section>
    </>
  );
}
