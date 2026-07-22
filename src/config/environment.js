const PRODUCTION_BACKEND_ORIGIN = 'https://swd-capstone.onrender.com';

const getDefaultBackendOrigin = () => {
  if (typeof window !== 'undefined' && ['localhost', '127.0.0.1'].includes(window.location.hostname)) {
    return 'http://localhost:5122';
  }

  return PRODUCTION_BACKEND_ORIGIN;
};

const DEFAULT_BACKEND_ORIGIN = getDefaultBackendOrigin();

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

export const REVIEW_PROGRESS_HUB_URL = removeTrailingSlashes(
  import.meta.env.VITE_REVIEW_PROGRESS_HUB_URL || `${API_ORIGIN}/hubs/review-progress`
);

export const getBackendUrl = (path = '') => {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  return `${API_ORIGIN}/${String(path).replace(/^\/+/, '')}`;
};
