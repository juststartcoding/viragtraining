import { Component, createElement, useEffect, useRef, useState } from 'react';

const canHover = () => typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** 3D tilt-on-hover wrapper with a moving glare highlight. `as` lets it render a Link. */
export function Tilt({ as = 'div', max = 9, className = '', children, ...props }) {
  const ref = useRef(null);
  const enabled = useRef(false);
  useEffect(() => {
    enabled.current = canHover() && !reducedMotion();
  }, []);

  const onMove = (e) => {
    const el = ref.current;
    if (!enabled.current || !el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    el.style.transition = 'transform 0.08s linear';
    el.style.transform = `perspective(1000px) rotateX(${(0.5 - y) * max}deg) rotateY(${(x - 0.5) * max}deg) scale3d(1.02,1.02,1.02)`;
    el.style.setProperty('--gx', `${x * 100}%`);
    el.style.setProperty('--gy', `${y * 100}%`);
  };
  const onLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.transition = 'transform 0.6s cubic-bezier(.2,.8,.2,1)';
    el.style.transform = '';
  };

  return createElement(
    as,
    { ref, onMouseMove: onMove, onMouseLeave: onLeave, className: `tilt ${className}`, ...props },
    children,
    <span className="tilt-glare" aria-hidden="true" />
  );
}

/** Fade/slide in when scrolled into view */
export function Reveal({ as = 'div', delay = 0, className = '', children, ...props }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reducedMotion() || !('IntersectionObserver' in window)) {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return createElement(
    as,
    { ref, className: `reveal ${shown ? 'reveal-in' : ''} ${className}`, style: { transitionDelay: `${delay}ms` }, ...props },
    children
  );
}

/** Animates "1000+" style values from 0 when visible */
export function Counter({ value = '' }) {
  const match = String(value).match(/^(\D*)([\d,.]+)(.*)$/);
  const target = match ? parseFloat(match[2].replace(/,/g, '')) : NaN;
  const ref = useRef(null);
  const [n, setN] = useState(isNaN(target) || reducedMotion() ? target : 0);

  useEffect(() => {
    if (isNaN(target) || reducedMotion()) return;
    const el = ref.current;
    let raf;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const start = performance.now();
      const tick = (t) => {
        const p = Math.min((t - start) / 1600, 1);
        setN(Math.round(target * (1 - Math.pow(1 - p, 3))));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [target]);

  if (!match) return <span>{value}</span>;
  return (
    <span ref={ref}>
      {match[1]}
      {Number(n).toLocaleString('en-IN')}
      {match[3]}
    </span>
  );
}

/** Renders `fallback` if WebGL / the 3D chunk fails */
export class SafeBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

export function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch {
    return false;
  }
}

/** Pure-CSS 3D rotating cube (used in page headers) */
export function Cube({ size = 120, className = '' }) {
  const faces = ['front', 'back', 'right', 'left', 'top', 'bottom'];
  return (
    <div className={`cube-scene ${className}`} style={{ '--s': `${size}px` }} aria-hidden="true">
      <div className="cube">
        {faces.map((f) => (
          <span key={f} className={`cube-face cube-${f}`} />
        ))}
      </div>
    </div>
  );
}
