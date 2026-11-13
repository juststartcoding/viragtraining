import { Link } from 'react-router-dom';
import { FaArrowRight, FaClock, FaCheckCircle, FaQuoteLeft, FaExternalLinkAlt } from 'react-icons/fa';
import Icon from './Icon';
import { Stars } from './ui';
import { Tilt } from './Effects';
import { assetUrl } from '../lib/api';

const gradients = [
  'from-brand-600 to-brand-900',
  'from-indigo-500 to-purple-700',
  'from-sky-500 to-blue-700',
  'from-emerald-500 to-teal-700',
  'from-orange-500 to-rose-600',
  'from-fuchsia-500 to-pink-700',
];
const grad = (i = 0) => gradients[Math.abs(i) % gradients.length];

/** Image if uploaded, otherwise a branded gradient with an icon */
function Cover({ image, icon, title, index, className = 'h-44' }) {
  if (image) return <img src={assetUrl(image)} alt={title} loading="lazy" className={`${className} w-full object-cover`} />;
  return (
    <div className={`${className} relative flex items-center justify-center overflow-hidden bg-gradient-to-br ${grad(index)}`}>
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
      <div className="absolute -bottom-10 -left-6 h-28 w-28 rounded-full bg-white/10" />
      <div className="grid-lines absolute inset-0 opacity-40" />
      <div className="icon-3d relative h-20 w-20 rotate-[-8deg] border border-white/30 bg-white/15 text-5xl backdrop-blur transition duration-500 group-hover:rotate-0 group-hover:scale-110">
        <Icon name={icon} className="drop-shadow-lg" />
      </div>
    </div>
  );
}

export function CourseCard({ course, index }) {
  return (
    <Tilt as={Link} to={`/courses/${course.slug}`} className="card group flex h-full flex-col overflow-hidden hover:shadow-2xl hover:shadow-brand-900/15">
      <Cover image={course.image} icon={course.icon} title={course.title} index={index} />
      <div className="flex flex-1 flex-col p-6">
        <div className="mb-3 flex items-center justify-between text-xs">
          <span className="chip">{course.category}</span>
          {course.duration && (
            <span className="flex items-center gap-1 text-slate-500">
              <FaClock /> {course.duration}
            </span>
          )}
        </div>
        <h3 className="text-lg group-hover:text-brand-700">{course.title}</h3>
        <p className="mt-2 line-clamp-3 flex-1 text-sm text-slate-500">{course.shortDescription}</p>
        <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
          {course.fee ? <span className="font-bold text-slate-900">{course.fee}</span> : <span className="text-sm font-medium text-slate-500">Get fee details</span>}
          <span className="flex items-center gap-1 text-sm font-semibold text-brand-600">
            Details <FaArrowRight className="transition group-hover:translate-x-1" />
          </span>
        </div>
      </div>
    </Tilt>
  );
}

export function ProductCard({ product, index }) {
  return (
    <Tilt as={Link} to={`/software/${product.slug}`} className="card group flex h-full flex-col overflow-hidden hover:shadow-2xl hover:shadow-brand-900/15">
      <Cover image={product.image} icon={product.icon} title={product.title} index={index + 2} />
      <div className="flex flex-1 flex-col p-6">
        <span className="chip mb-3 self-start">{product.category}</span>
        <h3 className="text-lg group-hover:text-brand-700">{product.title}</h3>
        <p className="mt-2 line-clamp-2 text-sm text-slate-500">{product.shortDescription}</p>
        <ul className="mt-4 flex-1 space-y-1.5">
          {product.features?.slice(0, 3).map((f) => (
            <li key={f} className="flex items-start gap-2 text-sm text-slate-600">
              <FaCheckCircle className="mt-0.5 shrink-0 text-emerald-500" /> {f}
            </li>
          ))}
        </ul>
        <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
          <span className="font-bold text-slate-900">{product.price || 'Price on request'}</span>
          <span className="flex items-center gap-1 text-sm font-semibold text-brand-600">
            View <FaArrowRight className="transition group-hover:translate-x-1" />
          </span>
        </div>
      </div>
    </Tilt>
  );
}

export function ServiceCard({ service, index }) {
  return (
    <Tilt className="card group h-full overflow-hidden p-7 hover:shadow-2xl hover:shadow-brand-900/15">
      <div className={`absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br ${grad(index)} opacity-10 transition duration-500 group-hover:scale-150`} />
      <div className={`icon-3d relative mb-6 h-16 w-16 bg-gradient-to-br ${grad(index)} text-2xl transition duration-500 group-hover:-rotate-6 group-hover:scale-110`}>
        <Icon name={service.icon} />
      </div>
      <h3 className="text-xl">{service.title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-slate-500">{service.shortDescription}</p>
      {service.features?.length > 0 && (
        <ul className="mt-5 space-y-2">
          {service.features.map((f) => (
            <li key={f} className="flex items-start gap-2 text-sm text-slate-600">
              <FaCheckCircle className="mt-0.5 shrink-0 text-brand-500" /> {f}
            </li>
          ))}
        </ul>
      )}
    </Tilt>
  );
}

export function PortfolioCard({ item, index }) {
  return (
    <Tilt max={6} className="card group h-full overflow-hidden hover:shadow-2xl hover:shadow-brand-900/15">
      <div className="relative overflow-hidden">
        <Cover image={item.image} icon="software" title={item.title} index={index + 1} className="h-52 transition duration-500 group-hover:scale-105" />
        <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-800 backdrop-blur">{item.category}</span>
      </div>
      <div className="p-6">
        <h3 className="text-lg">{item.title}</h3>
        {item.client && <p className="mt-1 text-sm font-medium text-brand-600">{item.client}</p>}
        <p className="mt-2 line-clamp-3 text-sm text-slate-500">{item.description}</p>
        {item.technologies?.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {item.technologies.map((t) => (
              <span key={t} className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{t}</span>
            ))}
          </div>
        )}
        {item.projectUrl && (
          <a href={item.projectUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:underline">
            Visit project <FaExternalLinkAlt className="text-xs" />
          </a>
        )}
      </div>
    </Tilt>
  );
}

export function TestimonialCard({ t }) {
  const initials = t.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  return (
    <figure className="card relative flex h-full flex-col p-7 transition duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-brand-900/10">
      <span className="icon-3d h-12 w-12 bg-gradient-to-br from-brand-500 to-brand-800 text-lg"><FaQuoteLeft /></span>
      <blockquote className="mt-4 flex-1 leading-relaxed text-slate-600">“{t.message}”</blockquote>
      <figcaption className="mt-6 flex items-center gap-4 border-t border-slate-100 pt-5">
        {t.photo ? (
          <img src={assetUrl(t.photo)} alt={t.name} className="h-12 w-12 rounded-full object-cover" />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-800 font-bold text-white">{initials}</div>
        )}
        <div className="flex-1">
          <div className="font-semibold text-slate-900">{t.name}</div>
          <div className="text-xs text-slate-500">{[t.designation, t.company].filter(Boolean).join(', ')}</div>
        </div>
        <Stars value={t.rating} />
      </figcaption>
    </figure>
  );
}
