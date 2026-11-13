import axios from 'axios';
import { useEffect, useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || '/api';
// Origin where /uploads is served (empty = same origin / dev proxy)
const ASSET_URL = import.meta.env.VITE_ASSET_URL || '';

export const TOKEN_KEY = 'virag_admin_token';
export const STUDENT_TOKEN_KEY = 'virag_student_token';
const isStudentUrl = (url = '') => url.startsWith('/student');

export const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  // Student endpoints use the student token; everything else uses the admin token (if any)
  const token = localStorage.getItem(isStudentUrl(config.url) ? STUDENT_TOKEN_KEY : TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const url = err.config?.url || '';
    if (err.response?.status === 401 && isStudentUrl(url)) {
      if (!/\/student\/(login|register)$/.test(url)) {
        localStorage.removeItem(STUDENT_TOKEN_KEY);
        if (/^\/(dashboard|learn\/[^/]+\/watch)/.test(location.pathname)) location.href = `/login?next=${encodeURIComponent(location.pathname)}`;
      }
      return Promise.reject(err);
    }
    if (err.response?.status === 401 && location.pathname.startsWith('/admin') && location.pathname !== '/admin/login') {
      localStorage.removeItem(TOKEN_KEY);
      location.href = '/admin/login';
    }
    return Promise.reject(err);
  }
);

export const errMsg = (e) => e?.response?.data?.message || e?.message || 'Something went wrong';

export const assetUrl = (p) => (!p ? '' : /^(https?:|data:)/.test(p) ? p : `${ASSET_URL}${p}`);

/** Small data-fetching hook: const { data, loading, error, reload } = useApi('/courses') */
export function useApi(url, initial = null) {
  const [state, setState] = useState({ data: initial, loading: true, error: null });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!url) return;
    let alive = true;
    setState((s) => ({ ...s, loading: true, error: null }));
    api
      .get(url)
      .then((r) => alive && setState({ data: r.data, loading: false, error: null }))
      .catch((e) => alive && setState({ data: initial, loading: false, error: errMsg(e) }));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, tick]);

  return { ...state, reload: () => setTick((t) => t + 1) };
}
