import { createContext, useContext } from 'react';
import { useApi } from '../lib/api';

const defaults = {
  siteName: 'Virag Training Solutions',
  tagline: 'Learn. Build. Grow.',
  stats: [],
  socials: {},
};

const SettingsContext = createContext({ settings: defaults, reload: () => {} });

export function SettingsProvider({ children }) {
  const { data, reload } = useApi('/settings');
  return <SettingsContext.Provider value={{ settings: { ...defaults, ...(data || {}) }, reload }}>{children}</SettingsContext.Provider>;
}

export const useSettings = () => useContext(SettingsContext);
