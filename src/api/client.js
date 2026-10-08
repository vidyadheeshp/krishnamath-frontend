import axios from 'axios';

import { startRequest, endRequest } from './loadingBus';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

const MUTATING_METHODS = ['post', 'put', 'patch', 'delete'];

const LABEL_BY_METHOD = {
  post: 'common.saving',
  put: 'common.updating',
  patch: 'common.updating',
  delete: 'common.deleting',
};

const isMutating = (config) => MUTATING_METHODS.includes((config?.method || 'get').toLowerCase());

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('temple-token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Track the request for the global loading indicator unless a caller opts out
  // by passing `showLoader: false` on the request config.
  if (config.showLoader !== false) {
    const method = (config.method || 'get').toLowerCase();
    config.loaderTracked = true;
    startRequest(isMutating(config), config.loaderLabel || LABEL_BY_METHOD[method] || 'common.loading');
  }

  return config;
});

const stopTracking = (config) => {
  if (config?.loaderTracked) {
    endRequest(isMutating(config));
    config.loaderTracked = false;
  }
};

api.interceptors.response.use(
  (response) => {
    stopTracking(response.config);
    return response;
  },
  (error) => {
    stopTracking(error.config);

    // A 401 on any call except the login attempt itself means the session is no longer valid.
    if (error.response?.status === 401 && !error.config?.url?.includes('/auth/login')) {
      window.dispatchEvent(new Event('auth:expired'));
    }

    return Promise.reject(error);
  },
);

export default api;
