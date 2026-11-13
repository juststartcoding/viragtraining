import { useMemo, useState } from 'react';
import { FaPhoneAlt, FaEnvelope, FaMapMarkerAlt, FaClock, FaBullseye, FaEye, FaWhatsapp } from 'react-icons/fa';
import { useApi } from '../lib/api';
import { useSettings } from '../context/SettingsContext';
import { Seo, PageHeader, SkeletonGrid, Empty, FilterTabs, SectionHeading } from '../components/ui';
import { ServiceCard, PortfolioCard, TestimonialCard } from '../components/Cards';
import EnquiryForm from '../components/EnquiryForm';

export function Services() {
  const { data, loading } = useApi('/services', []);
  return (
    <>
      <Seo title="Software Services" description="Custom software development, major & minor academic projects, website development and ready-made software." />
      <PageHeader title="Software Solutions & Services" subtitle="Custom software, academic projects and websites, built by experienced developers." crumbs={[{ label: 'Services' }]} />
      <section className="section">
        <div className="container-x">
          {loading ? <SkeletonGrid count={4} /> : data.length ? (
            <div className="grid gap-6 md:grid-cols-2">
              {data.map((s, i) => <ServiceCard key={s._id} service={s} index={i} />)}
            </div>
          ) : <Empty />}
        </div>
      </section>
      <section className="section bg-slate-50">
        <div className="container-x grid items-start gap-10 lg:grid-cols-2">
          <div>
            <SectionHeading center={false} eyebrow="How we work" title="A simple, transparent process" />
            <ol className="space-y-6">
              {['Requirement discussion', 'Proposal & timeline', 'Design & development', 'Testing & delivery', 'Training & support'].map((s, i) => (
                <li key={s} className="flex items-center gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-600 font-bold text-white">{i + 1}</span>
                  <span className="text-lg font-semibold text-slate-800">{s}</span>
                </li>
              ))}
            </ol>
          </div>
          <EnquiryForm title="Discuss your project" source="services" />
        </div>
      </section>
    </>
  );
}

export function PortfolioPage() {
  const { data, loading } = useApi('/portfolio', []);
  const [cat, setCat] = useState('All');
  const cats = useMemo(() => [...new Set(data.map((c) => c.category).filter(Boolean))], [data]);
  const list = data.filter((p) => cat === 'All' || p.category === cat);
  return (
    <>
      <Seo title="Portfolio" description="Projects delivered by Virag Training Solutions." />
      <PageHeader title="Our Portfolio" subtitle="Software and websites we have delivered for our clients." crumbs={[{ label: 'Portfolio' }]} />
      <section className="section">
        <div className="container-x">
          {cats.length > 1 && <FilterTabs options={cats} value={cat} onChange={setCat} />}
          {loading ? <SkeletonGrid /> : list.length ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{list.map((p, i) => <PortfolioCard key={p._id} item={p} index={i} />)}</div>
          ) : <Empty text="Portfolio coming soon." />}
        </div>
      </section>
    </>
  );
}

export function Testimonials() {
  const { data, loading } = useApi('/testimonials', []);
  const [type, setType] = useState('All');
  const list = data.filter((t) => type === 'All' || t.type === type);
  return (
    <>
      <Seo title="Testimonials" />
      <PageHeader title="Testimonials" subtitle="Hear from our students and clients." crumbs={[{ label: 'Testimonials' }]} />
      <section className="section">
        <div className="container-x">
          <FilterTabs options={['Student', 'Client']} value={type} onChange={setType} />
          {loading ? <SkeletonGrid /> : list.length ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{list.map((t) => <TestimonialCard key={t._id} t={t} />)}</div>
          ) : <Empty />}
        </div>
      </section>
    </>
  );
}

export function About() {
  const { settings: s } = useSettings();
  return (
    <>
      <Seo title="About Us" description={s.mission} />
      <PageHeader title="About Us" subtitle={s.tagline} crumbs={[{ label: 'About' }]} />
      <section className="section">
        <div className="container-x grid items-center gap-12 lg:grid-cols-2">
          <div>
            <span className="eyebrow">Who we are</span>
            <h2 className="mt-4 text-3xl md:text-4xl">{s.aboutTitle || s.siteName}</h2>
            <p className="prose-text mt-6 text-lg">{s.aboutText}</p>
          </div>
          {s.stats?.length > 0 && (
            <div className="grid grid-cols-2 gap-5">
              {s.stats.map((st, i) => (
                <div key={st.label} className={`rounded-3xl p-8 ${i % 3 === 0 ? 'bg-brand-600 text-white' : 'bg-slate-50'}`}>
                  <div className={`text-4xl font-extrabold ${i % 3 === 0 ? 'text-white' : 'text-brand-700'}`}>{st.value}</div>
                  <div className={`mt-2 text-sm ${i % 3 === 0 ? 'text-brand-100' : 'text-slate-500'}`}>{st.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
      {(s.mission || s.vision) && (
        <section className="section bg-slate-50">
          <div className="container-x grid gap-6 md:grid-cols-2">
            {[[FaBullseye, 'Our Mission', s.mission], [FaEye, 'Our Vision', s.vision]].filter((x) => x[2]).map(([I, t, txt]) => (
              <div key={t} className="card p-8">
                <I className="text-3xl text-accent-500" />
                <h3 className="mt-4 text-xl">{t}</h3>
                <p className="mt-3 text-slate-600">{txt}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}

export function Contact() {
  const { settings: s } = useSettings();
  const wa = (s.whatsapp || '').replace(/\D/g, '');
  const items = [
    s.phone && { icon: FaPhoneAlt, label: 'Call us', value: s.phone, href: `tel:${s.phone}` },
    wa && { icon: FaWhatsapp, label: 'WhatsApp', value: `+${wa}`, href: `https://wa.me/${wa}` },
    s.email && { icon: FaEnvelope, label: 'Email', value: s.email, href: `mailto:${s.email}` },
    s.address && { icon: FaMapMarkerAlt, label: 'Visit us', value: s.address },
    s.workingHours && { icon: FaClock, label: 'Working hours', value: s.workingHours },
  ].filter(Boolean);

  return (
    <>
      <Seo title="Contact Us" description="Contact Virag Training Solutions for course admissions and software requirements." />
      <PageHeader title="Contact Us" subtitle="Have a question about a course or a software requirement? We would love to hear from you." crumbs={[{ label: 'Contact' }]} />
      <section className="section">
        <div className="container-x grid gap-10 lg:grid-cols-5">
          <div className="space-y-4 lg:col-span-2">
            {items.map(({ icon: I, label, value, href }) => {
              const body = (
                <div className="card card-hover flex items-start gap-4 p-5">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-xl text-brand-600"><I /></span>
                  <div><div className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</div><div className="mt-0.5 break-words font-semibold text-slate-900">{value}</div></div>
                </div>
              );
              return href ? <a key={label} href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noreferrer" className="block">{body}</a> : <div key={label}>{body}</div>;
            })}
          </div>
          <div className="lg:col-span-3"><EnquiryForm source="contact" /></div>
        </div>
        {s.mapEmbedUrl && /^https:\/\/(www\.)?google\.com\/maps\/embed/.test(s.mapEmbedUrl) && (
          <div className="container-x mt-12">
            <iframe title="Location map" src={s.mapEmbedUrl} className="h-96 w-full rounded-2xl border-0" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
          </div>
        )}
      </section>
    </>
  );
}
