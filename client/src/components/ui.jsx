import { Link } from 'react-router-dom';
import { FaStar, FaChevronRight } from 'react-icons/fa';
import { Reveal, Cube } from './Effects';
import { assetUrl } from '../lib/api';

/**
 * Shows the whole image without cropping (object-contain). Any empty space
 * around a differently-shaped image is filled with a blurred copy of it,
 * so cards stay uniform without white bars. Size it with className, e.g. "aspect-video".
 */
export function FitImage({ src, alt = '', className = '', imgClassName = '', lazy = true }) {
  const url = assetUrl(src);
  return (
    <div className={`relative overflow-hidden bg-slate-100 ${className}`}>
      <img src={url} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full scale-110 object-cover opacity-70 blur-2xl" />
      <img src={url} alt={alt} loading={lazy ? 'lazy' : undefined} className={`relative h-full w-full object-contain ${imgClassName}`} />
    </div>
  );
}

export function Seo({ title, description }) {
  const full = title ? `${title} | Virag Training Solutions` : 'Virag Training Solutions – IT Training & Software Solutions';
  return (
    <>
      <title>{full}</title>
      {description && <meta name="description" content={description} />}
    </>
  );
}

export function SectionHeading({ eyebrow, title, subtitle, center = true }) {
  return (
    <Reveal className={`mb-12 max-w-2xl ${center ? 'mx-auto text-center' : ''}`}>
      {eyebrow && <span className="eyebrow">{eyebrow}</span>}
      <h2 className="mt-4 text-3xl md:text-[2.6rem] md:leading-tight">{title}</h2>
      {subtitle && <p className="mt-4 text-lg text-slate-500">{subtitle}</p>}
    </Reveal>
  );
}

export function PageHeader({ title, subtitle, crumbs = [] }) {
  return (
    <section className="hero-grid relative overflow-hidden bg-brand-950 pt-32 pb-16 text-white md:pt-40 md:pb-24">
      <div className="orb -left-20 top-10 h-72 w-72 bg-brand-500/40" />
      <div className="orb right-10 -bottom-24 h-80 w-80 bg-accent-500/25" style={{ animationDelay: '-6s' }} />
      <div className="absolute right-[12%] top-1/2 hidden -translate-y-1/3 lg:block">
        <Cube size={130} />
      </div>
      <div className="absolute right-[30%] top-28 hidden lg:block">
        <Cube size={48} className="opacity-70" />
      </div>
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-brand-400/50 to-transparent" />
      <div className="container-x relative">
        <nav className="mb-4 flex flex-wrap items-center gap-1.5 text-sm text-brand-200">
          <Link to="/" className="hover:text-white">Home</Link>
          {crumbs.map((c) => (
            <span key={c.label} className="flex items-center gap-1.5">
              <FaChevronRight className="text-[10px]" />
              {c.to ? <Link to={c.to} className="hover:text-white">{c.label}</Link> : <span className="text-white">{c.label}</span>}
            </span>
          ))}
        </nav>
        <h1 className="max-w-3xl text-3xl text-white md:text-[3.4rem] md:leading-[1.1]">{title}</h1>
        {subtitle && <p className="mt-4 max-w-2xl text-lg text-brand-100/90">{subtitle}</p>}
      </div>
    </section>
  );
}

export function Loader({ className = 'py-24' }) {
  return (
    <div className={`flex justify-center ${className}`}>
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-100 border-t-brand-600" />
    </div>
  );
}

export function SkeletonGrid({ count = 3 }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-80 animate-pulse rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200" />
      ))}
    </div>
  );
}

export function Empty({ text = 'Nothing to show yet.' }) {
  return <p className="rounded-2xl border border-dashed border-slate-300 py-16 text-center text-slate-500">{text}</p>;
}

export function Stars({ value = 5 }) {
  return (
    <div className="flex gap-0.5 text-amber-400">
      {Array.from({ length: 5 }).map((_, i) => (
        <FaStar key={i} className={i < value ? '' : 'text-slate-200'} />
      ))}
    </div>
  );
}

export function FilterTabs({ options, value, onChange }) {
  return (
    <div className="mb-10 flex flex-wrap justify-center gap-2">
      {['All', ...options].map((o) => (
        <button
          key={o}
          onClick={() => onChange(o)}
          className={`rounded-full px-5 py-2 text-sm font-medium transition ${
            value === o ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:ring-brand-300'
          }`}
        >
          {o}
        </button>
      ))}
    </div>
  );
}
