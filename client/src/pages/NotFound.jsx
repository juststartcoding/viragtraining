import { Link } from 'react-router-dom';
import { Seo } from '../components/ui';

export default function NotFound() {
  return (
    <section className="flex min-h-[70vh] items-center justify-center pt-24 text-center">
      <Seo title="Page not found" />
      <div className="container-x">
        <div className="text-8xl font-extrabold text-brand-100">404</div>
        <h1 className="mt-4 text-3xl">Page not found</h1>
        <p className="mt-3 text-slate-500">The page you are looking for doesn’t exist or has been moved.</p>
        <Link to="/" className="btn btn-primary mt-8">Back to home</Link>
      </div>
    </section>
  );
}
