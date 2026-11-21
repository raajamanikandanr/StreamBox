import axios from 'axios';
import { MOCK_MOVIES, MOCK_PLANS } from './mockData';

export const getAdminPhone = () => {
  const envPhone = (import.meta.env.VITE_ADMIN_PHONE || '8122850816').toString();
  return envPhone.replace(/\D/g, '').slice(-10);
};

export const isUserAdmin = (user) => {
  if (!user) return false;
  const adminPhone = getAdminPhone();
  const userPhone = (user.phone || '').toString().replace(/\D/g, '').slice(-10);
  return user.role === 'admin' || userPhone === adminPhone;
};

export const DEMO_PHONE_PLANS = {
  '9876500001': { planId: 'mobile', planName: 'Mobile', status: 'active' },
  '9876500002': { planId: 'mobile', planName: 'Mobile', status: 'active' },
  '9876500003': { planId: 'mobile', planName: 'Mobile', status: 'active' },
  '9876500004': { planId: 'super', planName: 'Super', status: 'active' },
  '9876500005': { planId: 'super', planName: 'Super', status: 'active' },
  '9876500006': { planId: 'super', planName: 'Super', status: 'active' },
  '9876500007': { planId: 'super', planName: 'Super', status: 'active' },
  '9876500008': { planId: 'premium', planName: 'Premium 4K', status: 'active' },
  '9876500009': { planId: 'premium', planName: 'Premium 4K', status: 'active' },
  '9876500010': { planId: 'premium', planName: 'Premium 4K', status: 'active' },
  '8122850816': { planId: 'premium', planName: 'Admin Premium 4K', status: 'active' }
};

// Storage keys
const MOVIES_KEY = 'streambox_movies';
const USER_KEY = 'streambox_user';
const PROGRESS_KEY = 'streambox_progress';
const SUB_KEY = 'streambox_subscription';
const MEDIA_BASE_URL_KEY = 'streambox_media_base_url';

// Initialize mock storage if empty
const initStorage = () => {
  if (!localStorage.getItem(MOVIES_KEY)) {
    localStorage.setItem(MOVIES_KEY, JSON.stringify(MOCK_MOVIES));
  }
  if (!localStorage.getItem(MEDIA_BASE_URL_KEY)) {
    // Default simulated media base url (can be overridden by backend or admin settings)
    localStorage.setItem(MEDIA_BASE_URL_KEY, 'https://test-streams.mux.dev');
  }
};
initStorage();

export const getStoredMovies = () => {
  try {
    return JSON.parse(localStorage.getItem(MOVIES_KEY)) || MOCK_MOVIES;
  } catch {
    return MOCK_MOVIES;
  }
};

export const saveStoredMovies = (movies) => {
  localStorage.setItem(MOVIES_KEY, JSON.stringify(movies));
};

// Create Axios client
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  withCredentials: true, // For httpOnly cookies
  timeout: 10000,
});

// Interceptor: attach current user headers for RBAC
apiClient.interceptors.request.use((config) => {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (raw) {
      const u = JSON.parse(raw);
      if (u?.phone) config.headers['x-user-phone'] = u.phone;
      if (u?.role) config.headers['x-user-role'] = u.role;
    }
  } catch {
    // ignore
  }
  return config;
});

// Interceptor: reject HTML SPA fallback responses when backend endpoints are offline
apiClient.interceptors.response.use((response) => {
  if (
    typeof response.data === 'string' &&
    (response.data.includes('<!doctype html>') ||
     response.data.includes('<!DOCTYPE html>') ||
     response.data.includes('<html'))
  ) {
    const error = new Error('API returned HTML SPA fallback (endpoint not found)');
    error.response = response;
    return Promise.reject(error);
  }
  return response;
});

// Flag to use mock fallback when backend is offline
const USE_MOCK_FALLBACK = true;

/**
 * Auth API
 */
export const authApi = {
  sendOtp: async (phone) => {
    try {
      const res = await apiClient.post('/auth/send-otp', { phone });
      return res.data;
    } catch (err) {
      if (USE_MOCK_FALLBACK) {
        // Mock success response
        await new Promise((r) => setTimeout(r, 600));
        // Save pending phone
        sessionStorage.setItem('pending_phone', phone);
        return {
          success: true,
          message: 'OTP sent successfully to ' + phone,
          // Provide fixed demo OTP for instant testing convenience
          debugOtp: '123456'
        };
      }
      throw err;
    }
  },

  verifyOtp: async (phone, otp) => {
    try {
      const res = await apiClient.post('/auth/verify-otp', { phone, otp });
      if (res.data?.user) {
        localStorage.setItem(USER_KEY, JSON.stringify(res.data.user));
      }
      if (res.data?.subscription) {
        localStorage.setItem(SUB_KEY, JSON.stringify(res.data.subscription));
      }
      return res.data;
    } catch (err) {
      if (USE_MOCK_FALLBACK) {
        await new Promise((r) => setTimeout(r, 700));
        if (otp && otp.length === 6) {
          const rawPhone = phone || sessionStorage.getItem('pending_phone') || '9876500008';
          const cleanPhone = (rawPhone || '').toString().replace(/\D/g, '').slice(-10);
          const adminPhone = getAdminPhone();
          const user = {
            id: 'usr_' + Date.now(),
            phone: cleanPhone,
            role: cleanPhone === adminPhone ? 'admin' : 'user',
            createdAt: new Date().toISOString()
          };
          localStorage.setItem(USER_KEY, JSON.stringify(user));
          const sub = DEMO_PHONE_PLANS[cleanPhone] || null;
          if (sub) {
            localStorage.setItem(SUB_KEY, JSON.stringify(sub));
          }
          return {
            success: true,
            user,
            subscription: sub,
            token: 'mock-jwt-token-' + Date.now()
          };
        }
        throw new Error('Invalid verification code. Please check and try again.');
      }
      throw err;
    }
  },

  logout: async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // ignore
    } finally {
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(SUB_KEY);
    }
  }
};

/**
 * Movies API
 */
export const moviesApi = {
  getAll: async () => {
    try {
      const res = await apiClient.get('/movies');
      return res.data;
    } catch (err) {
      if (USE_MOCK_FALLBACK) {
        await new Promise((r) => setTimeout(r, 400));
        return getStoredMovies();
      }
      throw err;
    }
  },

  getById: async (id) => {
    try {
      const res = await apiClient.get(`/movies/${id}`);
      return res.data;
    } catch (err) {
      if (USE_MOCK_FALLBACK) {
        await new Promise((r) => setTimeout(r, 300));
        const movies = getStoredMovies();
        const found = movies.find((m) => m.id === id);
        if (!found) throw new Error('Movie not found');
        return found;
      }
      throw err;
    }
  },

  search: async (query) => {
    try {
      const res = await apiClient.get(`/movies/search?q=${encodeURIComponent(query)}`);
      return res.data;
    } catch (err) {
      if (USE_MOCK_FALLBACK) {
        await new Promise((r) => setTimeout(r, 250));
        const q = (query || '').toLowerCase().trim();
        const movies = getStoredMovies();
        if (!q) return movies;
        return movies.filter(
          (m) =>
            m.title.toLowerCase().includes(q) ||
            m.description?.toLowerCase().includes(q) ||
            m.genres?.some((g) => g.toLowerCase().includes(q)) ||
            m.cast?.some((c) => c.toLowerCase().includes(q))
        );
      }
      throw err;
    }
  },

  /**
   * Returns { url, token }
   * Where url = MEDIA_BASE_URL + "/media/" + hls_path
   */
  getStream: async (id) => {
    try {
      const res = await apiClient.get(`/movies/${id}/stream`);
      return res.data;
    } catch (err) {
      if (USE_MOCK_FALLBACK) {
        await new Promise((r) => setTimeout(r, 400));
        const movies = getStoredMovies();
        const movie = movies.find((m) => m.id === id);
        if (!movie) throw new Error('Movie not found');

        // Dynamically get media base url (from backend response or configured tunnel)
        const mediaBaseUrl = localStorage.getItem(MEDIA_BASE_URL_KEY) || 'https://test-streams.mux.dev';

        // If mock stream_url is directly available for testing, use it or construct the exact contract
        const streamUrl = movie.stream_url || `${mediaBaseUrl}/media/${movie.hls_path}`;

        return {
          url: streamUrl,
          token: 'signed-hls-token-' + Date.now(),
          mediaBaseUrl,
          title: movie.title
        };
      }
      throw err;
    }
  },

  saveProgress: async (movieId, positionSeconds, durationSeconds) => {
    try {
      await apiClient.post('/progress', { movieId, positionSeconds, durationSeconds });
    } catch (err) {
      if (USE_MOCK_FALLBACK) {
        // Save to local storage watch progress map
        const progressMap = JSON.parse(localStorage.getItem(PROGRESS_KEY) || '{}');
        const percent = durationSeconds > 0 ? Math.round((positionSeconds / durationSeconds) * 100) : 0;
        progressMap[movieId] = {
          position: positionSeconds,
          duration: durationSeconds,
          percent,
          updatedAt: new Date().toISOString()
        };
        localStorage.setItem(PROGRESS_KEY, JSON.stringify(progressMap));

        // Also update movie's in-memory progress
        const movies = getStoredMovies();
        const updated = movies.map((m) => (m.id === movieId ? { ...m, progress: percent, lastPosition: positionSeconds } : m));
        saveStoredMovies(updated);
      }
    }
  },

  getProgressMap: () => {
    try {
      return JSON.parse(localStorage.getItem(PROGRESS_KEY) || '{}');
    } catch {
      return {};
    }
  }
};

/**
 * Plans & Subscriptions API
 */
export const plansApi = {
  getPlans: async () => {
    try {
      const res = await apiClient.get('/plans');
      return res.data;
    } catch (err) {
      if (USE_MOCK_FALLBACK) {
        return MOCK_PLANS;
      }
      throw err;
    }
  },

  createSubscription: async (planId) => {
    try {
      const res = await apiClient.post('/subscriptions', { planId });
      return res.data;
    } catch (err) {
      if (USE_MOCK_FALLBACK) {
        await new Promise((r) => setTimeout(r, 600));
        const plan = MOCK_PLANS.find((p) => p.id === planId) || MOCK_PLANS[1];
        const expiry = new Date();
        expiry.setMonth(expiry.getMonth() + 1);

        const sub = {
          planId: plan.id,
          planName: plan.name,
          status: 'active',
          startedAt: new Date().toISOString(),
          expiresAt: expiry.toISOString()
        };
        localStorage.setItem(SUB_KEY, JSON.stringify(sub));
        return { success: true, subscription: sub };
      }
      throw err;
    }
  },

  getCurrentSubscription: () => {
    try {
      const stored = localStorage.getItem(SUB_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.status === 'active') return parsed;
      }
      const user = JSON.parse(localStorage.getItem(USER_KEY) || '{}');
      const cleanPhone = (user?.phone || '').replace(/\D/g, '').slice(-10);
      if (cleanPhone && DEMO_PHONE_PLANS[cleanPhone]) {
        const sub = DEMO_PHONE_PLANS[cleanPhone];
        localStorage.setItem(SUB_KEY, JSON.stringify(sub));
        return sub;
      }
      return null;
    } catch {
      return null;
    }
  }
};

/**
 * Admin API
 */
export const adminApi = {
  createMovie: async (movieData, onProgress) => {
    const raw = localStorage.getItem(USER_KEY);
    const currentUser = raw ? JSON.parse(raw) : null;
    if (!isUserAdmin(currentUser)) {
      throw new Error('Access denied: Administrator privileges required.');
    }
    try {
      if (onProgress) {
        for (let p = 10; p <= 90; p += 30) {
          await new Promise((r) => setTimeout(r, 80));
          onProgress(p);
        }
      }
      const res = await apiClient.post('/admin/movies', movieData);
      if (onProgress) onProgress(100);
      return res.data;
    } catch (err) {
      if (!USE_MOCK_FALLBACK) throw err;
      // Simulate upload progress
      if (onProgress) {
        for (let p = 10; p <= 100; p += 20) {
          await new Promise((r) => setTimeout(r, 120));
          onProgress(p);
        }
      }

      const movies = getStoredMovies();
      const newMovie = {
        id: 'mov-' + Date.now(),
        title: movieData.title,
        year: parseInt(movieData.year) || new Date().getFullYear(),
        duration: movieData.duration || '1h 45m',
        rating: movieData.rating || '13+',
        plan_required: movieData.plan_required || 'super',
        genres: Array.isArray(movieData.genres) ? movieData.genres : [movieData.genre || 'Action'],
        description: movieData.description,
        cast: movieData.cast ? movieData.cast.split(',').map((c) => c.trim()) : ['Prime Cast'],
        poster: movieData.posterUrl || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80',
        backdrop: movieData.posterUrl || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1600&q=80',
        hls_path: `uploads/${Date.now()}/master.m3u8`,
        stream_url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
        status: 'processing', // starts in processing state
        progress: 0,
        lastPosition: 0
      };

      movies.unshift(newMovie);
      saveStoredMovies(movies);

      // Auto update status to 'ready' after 15 seconds to demonstrate real-time processing
      setTimeout(() => {
        const cur = getStoredMovies();
        const updated = cur.map((m) => (m.id === newMovie.id ? { ...m, status: 'ready' } : m));
        saveStoredMovies(updated);
      }, 15000);

      return newMovie;
    }
  },

  updateMovie: async (id, updates) => {
    const raw = localStorage.getItem(USER_KEY);
    const currentUser = raw ? JSON.parse(raw) : null;
    if (!isUserAdmin(currentUser)) {
      throw new Error('Access denied: Administrator privileges required.');
    }
    try {
      const res = await apiClient.put(`/admin/movies/${id}`, updates);
      return res.data;
    } catch (err) {
      if (!USE_MOCK_FALLBACK) throw err;
      const movies = getStoredMovies();
      const updated = movies.map((m) => (m.id === id ? { ...m, ...updates } : m));
      saveStoredMovies(updated);
      return updated.find((m) => m.id === id);
    }
  },

  deleteMovie: async (id) => {
    const raw = localStorage.getItem(USER_KEY);
    const currentUser = raw ? JSON.parse(raw) : null;
    if (!isUserAdmin(currentUser)) {
      throw new Error('Access denied: Administrator privileges required.');
    }
    try {
      const res = await apiClient.delete(`/admin/movies/${id}`);
      return res.data;
    } catch (err) {
      if (!USE_MOCK_FALLBACK) throw err;
      const movies = getStoredMovies();
      const filtered = movies.filter((m) => m.id !== id);
      saveStoredMovies(filtered);
      return { success: true };
    }
  }
};

export default apiClient;
