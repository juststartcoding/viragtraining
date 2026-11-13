export const inr = (n) => (Number(n) > 0 ? `₹${Number(n).toLocaleString('en-IN')}` : 'Free');

export const discount = (price, mrp) => (mrp > price && price > 0 ? Math.round(((mrp - price) / mrp) * 100) : 0);

export const fmtDate = (d, opts = {}) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', ...opts }) : '';

export const fmtDateTime = (d) =>
  d ? new Date(d).toLocaleString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : '';

export const fmtTime = (d) => (d ? new Date(d).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }) : '');

export const fmtMins = (m = 0) => (m >= 60 ? `${Math.floor(m / 60)}h ${m % 60 ? `${m % 60}m` : ''}`.trim() : `${m}m`);

/** ISO → value for <input type="datetime-local"> in local time */
export const toLocalInput = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d)) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/** Converts a YouTube / Vimeo / Google Drive / mp4 / embed URL into something playable */
export function videoEmbed(url = '') {
  if (!url) return null;
  let m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/);
  if (m) return { type: 'iframe', src: `https://www.youtube-nocookie.com/embed/${m[1]}?rel=0&modestbranding=1` };
  m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (m) return { type: 'iframe', src: `https://player.vimeo.com/video/${m[1]}` };
  m = url.match(/drive\.google\.com\/file\/d\/([\w-]+)/);
  if (m) return { type: 'iframe', src: `https://drive.google.com/file/d/${m[1]}/preview` };
  if (/\.(mp4|webm|ogg)(\?|$)/i.test(url)) return { type: 'video', src: url };
  if (/^https:\/\//.test(url)) return { type: 'iframe', src: url };
  return null;
}

/** "Add to Google Calendar" link */
export function googleCalendarUrl({ title, startsAt, durationMins = 60, details = '' }) {
  const f = (d) => new Date(d).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const end = new Date(new Date(startsAt).getTime() + durationMins * 60000);
  const p = new URLSearchParams({ action: 'TEMPLATE', text: title, dates: `${f(startsAt)}/${f(end)}`, details });
  return `https://calendar.google.com/calendar/render?${p}`;
}
