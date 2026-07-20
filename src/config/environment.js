const DEFAULT_BACKEND_ORIGIN = 'https://swd-capstone.onrender.com';

const removeTrailingSlashes = (value) => value.replace(/\/+$/, '');

export const API_ORIGIN = removeTrailingSlashes(
  import.meta.env.VITE_API_ORIGIN || DEFAULT_BACKEND_ORIGIN
);

export const API_BASE_URL = removeTrailingSlashes(
  import.meta.env.VITE_API_BASE_URL || `${API_ORIGIN}/api`
);

export const DEFENSE_HUB_URL = removeTrailingSlashes(
  import.meta.env.VITE_SIGNALR_HUB_URL || `${API_ORIGIN}/hubs/defense`
);

export const PRESENCE_HUB_URL = removeTrailingSlashes(
  import.meta.env.VITE_PRESENCE_HUB_URL || `${API_ORIGIN}/hubs/presence`
);

export const getBackendUrl = (path = '') => {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  return `${API_ORIGIN}/${String(path).replace(/^\/+/, '')}`;
};
