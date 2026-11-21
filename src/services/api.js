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

export const DEFAULT_USERS_DB = [
  { id: 'usr_demo_1', name: 'Mobile Tester 1', phone: '9876500001', role: 'user', planId: 'mobile', planName: 'Mobile' },
  { id: 'usr_demo_2', name: 'Mobile Tester 2', phone: '9876500002', role: 'user', planId: 'mobile', planName: 'Mobile' },
  { id: 'usr_demo_3', name: 'Mobile Tester 3', phone: '9876500003', role: 'user', planId: 'mobile', planName: 'Mobile' },
  { id: 'usr_demo_4', name: 'Super Tester 1', phone: '9876500004', role: 'user', planId: 'super', planName: 'Super' },
  { id: 'usr_demo_5', name: 'Super Tester 2', phone: '9876500005', role: 'user', planId: 'super', planName: 'Super' },
  { id: 'usr_demo_6', name: 'Super Tester 3', phone: '9876500006', role: 'user', planId: 'super', planName: 'Super' },
  { id: 'usr_demo_7', name: 'Super Tester 4', phone: '9876500007', role: 'user', planId: 'super', planName: 'Super' },
  { id: 'usr_demo_8', name: 'Premium Tester 1', phone: '9876500008', role: 'user', planId: 'premium', planName: 'Premium 4K' },
  { id: 'usr_demo_9', name: 'Premium Tester 2', phone: '9876500009', role: 'user', planId: 'premium', planName: 'Premium 4K' },
  { id: 'usr_demo_10', name: 'StreamBox Admin', phone: '9876500010', role: 'admin', planId: 'premium', planName: 'Premium 4K' },
  { id: 'usr_admin', name: 'Mani Admin', phone: '8122850816', role: 'admin', planId: 'premium', planName: 'Admin Premium 4K' }
];

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
const USERS_DB_KEY = 'streambox_users_db';
const SUB_KEY = 'streambox_subscription';
const MEDIA_BASE_URL_KEY = 'streambox_media_base_url';

export const getRegisteredUsers = () => {
  try {
    const raw = localStorage.getItem(USERS_DB_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  localStorage.setItem(USERS_DB_KEY, JSON.stringify(DEFAULT_USERS_DB));
  return DEFAULT_USERS_DB;
};

export const saveRegisteredUsers = (users) => {
  localStorage.setItem(USERS_DB_KEY, JSON.stringify(users));
};

export const getCurrentUser = () => {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

// Initialize mock storage if empty or sanitize legacy dirty progress
const initStorage = () => {
  const existingMovies = localStorage.getItem(MOVIES_KEY);
  if (!existingMovies) {
    localStorage.setItem(MOVIES_KEY, JSON.stringify(MOCK_MOVIES));
  } else {
    try {
      const parsed = JSON.parse(existingMovies);
      // Clean off old hardcoded global progress from movie catalog
      const sanitized = parsed.map((m) => ({ ...m, progress: 0, lastPosition: 0 }));
      localStorage.setItem(MOVIES_KEY, JSON.stringify(sanitized));
    } catch {}
  }

  if (!localStorage.getItem(MEDIA_BASE_URL_KEY)) {
    localStorage.setItem(MEDIA_BASE_URL_KEY, 'https://test-streams.mux.dev');
  }

  getRegisteredUsers();
  // Clear any old shared progress key
  localStorage.removeItem('streambox_progress');
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
  withCredentials: true,
  timeout: 10000,
});

// Interceptor: attach current user headers for RBAC & isolated user space
apiClient.interceptors.request.use((config) => {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (raw) {
      const u = JSON.parse(raw);
      if (u?.id) config.headers['x-user-id'] = u.id;
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
  sendOtp: async (phone, mode = 'login') => {
    try {
      const res = await apiClient.post('/auth/send-otp', { phone, mode });
      return res.data;
    } catch (err) {
      if (USE_MOCK_FALLBACK) {
        await new Promise((r) => setTimeout(r, 400));
        const cleanPhone = (phone || '').toString().replace(/\D/g, '').slice(-10);
        const usersDb = getRegisteredUsers();
        const existing = usersDb.find((u) => u.phone === cleanPhone);

        if (mode === 'login' && !existing) {
          const error = new Error('This mobile number is not registered. Please create an account first.');
          error.notRegistered = true;
          throw error;
        }

        if (mode === 'register' && existing) {
          const error = new Error('This mobile number is already registered. Please sign in instead.');
          error.alreadyRegistered = true;
          throw error;
        }

        sessionStorage.setItem('pending_phone', cleanPhone);
        return {
          success: true,
          message: `OTP sent successfully to ${cleanPhone}`,
          debugOtp: '123456',
          userExists: !!existing
        };
      }
      throw err;
    }
  },

  register: async ({ name, phone, planId = 'super', otp = '123456' }) => {
    try {
      const res = await apiClient.post('/auth/register', { name, phone, planId, otp });
      if (res.data?.user) {
        localStorage.setItem(USER_KEY, JSON.stringify(res.data.user));
      }
      if (res.data?.subscription) {
        localStorage.setItem(SUB_KEY, JSON.stringify(res.data.subscription));
      }
      return res.data;
    } catch (err) {
      if (USE_MOCK_FALLBACK) {
        await new Promise((r) => setTimeout(r, 500));
        const cleanPhone = (phone || '').toString().replace(/\D/g, '').slice(-10);
        const cleanName = (name || '').trim();
        const usersDb = getRegisteredUsers();

        if (usersDb.some((u) => u.phone === cleanPhone)) {
          const error = new Error('This mobile number is already registered. Please sign in instead.');
          error.alreadyRegistered = true;
          throw error;
        }

        if (otp !== '123456') {
          throw new Error('Invalid verification code. Please enter 123456.');
        }

        const adminPhone = getAdminPhone();
        const role = cleanPhone === adminPhone ? 'admin' : 'user';
        const planNames = { mobile: 'Mobile', super: 'Super', premium: 'Premium 4K' };
        const selectedPlan = planNames[planId] ? planId : 'super';

        const newUser = {
          id: 'usr_' + Date.now(),
          name: cleanName || 'User',
          phone: cleanPhone,
          role,
          createdAt: new Date().toISOString()
        };

        const expiry = new Date();
        expiry.setMonth(expiry.getMonth() + 1);
        const newSub = {
          planId: selectedPlan,
          planName: planNames[selectedPlan],
          status: 'active',
          startedAt: new Date().toISOString(),
          expiresAt: expiry.toISOString()
        };

        usersDb.push({
          ...newUser,
          planId: selectedPlan,
          planName: planNames[selectedPlan],
          subscription: newSub
        });
        saveRegisteredUsers(usersDb);

        localStorage.setItem(USER_KEY, JSON.stringify(newUser));
        localStorage.setItem(SUB_KEY, JSON.stringify(newSub));

        return {
          success: true,
          message: 'Account created successfully! Welcome to StreamBox.',
          user: newUser,
          subscription: newSub,
          token: 'mock-jwt-token-' + Date.now()
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
        await new Promise((r) => setTimeout(r, 500));
        const rawPhone = phone || sessionStorage.getItem('pending_phone');
        const cleanPhone = (rawPhone || '').toString().replace(/\D/g, '').slice(-10);
        const usersDb = getRegisteredUsers();
        const userRecord = usersDb.find((u) => u.phone === cleanPhone);

        if (!userRecord) {
          const error = new Error('This mobile number is not registered. Please register first to start streaming.');
          error.notRegistered = true;
          throw error;
        }

        if (otp !== '123456') {
          throw new Error('Invalid verification code. Please check and try again.');
        }

        const adminPhone = getAdminPhone();
        const role = cleanPhone === adminPhone ? 'admin' : userRecord.role || 'user';
        const user = {
          id: userRecord.id,
          name: userRecord.name || 'User',
          phone: userRecord.phone,
          role,
          createdAt: userRecord.createdAt || new Date().toISOString()
        };

        const planNames = { mobile: 'Mobile', super: 'Super', premium: 'Premium 4K' };
        const subPlanId = userRecord.planId || 'super';
        const expiry = new Date();
        expiry.setMonth(expiry.getMonth() + 1);

        const sub = userRecord.subscription || DEMO_PHONE_PLANS[cleanPhone] || {
          planId: subPlanId,
          planName: planNames[subPlanId] || 'Super',
          status: 'active',
          startedAt: new Date().toISOString(),
          expiresAt: expiry.toISOString()
        };

        localStorage.setItem(USER_KEY, JSON.stringify(user));
        localStorage.setItem(SUB_KEY, JSON.stringify(sub));

        return {
          success: true,
          user,
          subscription: sub,
          token: 'mock-jwt-token-' + Date.now()
        };
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
        await new Promise((r) => setTimeout(r, 250));
        const baseMovies = getStoredMovies();
        const user = getCurrentUser();
        // Load user-specific watch progress space
        const userProgress = user?.id
          ? JSON.parse(localStorage.getItem(`streambox_progress_${user.id}`) || '{}')
          : {};

        return baseMovies.map((m) => {
          const item = userProgress[m.id];
          return {
            ...m,
            progress: item ? item.percent : 0,
            lastPosition: item ? item.position : 0
          };
        });
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
        await new Promise((r) => setTimeout(r, 200));
        const movies = getStoredMovies();
        const found = movies.find((m) => m.id === id);
        if (!found) throw new Error('Movie not found');
        const user = getCurrentUser();
        const userProgress = user?.id
          ? JSON.parse(localStorage.getItem(`streambox_progress_${user.id}`) || '{}')
          : {};
        const item = userProgress[id];
        return {
          ...found,
          progress: item ? item.percent : 0,
          lastPosition: item ? item.position : 0
        };
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
        await new Promise((r) => setTimeout(r, 200));
        const q = (query || '').toLowerCase().trim();
        const movies = getStoredMovies();
        const user = getCurrentUser();
        const userProgress = user?.id
          ? JSON.parse(localStorage.getItem(`streambox_progress_${user.id}`) || '{}')
          : {};

        const filtered = !q
          ? movies
          : movies.filter(
              (m) =>
                m.title.toLowerCase().includes(q) ||
                m.description?.toLowerCase().includes(q) ||
                m.genres?.some((g) => g.toLowerCase().includes(q)) ||
                m.cast?.some((c) => c.toLowerCase().includes(q))
            );

        return filtered.map((m) => {
          const item = userProgress[m.id];
          return {
            ...m,
            progress: item ? item.percent : 0,
            lastPosition: item ? item.position : 0
          };
        });
      }
      throw err;
    }
  },

  getStream: async (id) => {
    try {
      const res = await apiClient.get(`/movies/${id}/stream`);
      return res.data;
    } catch (err) {
      if (USE_MOCK_FALLBACK) {
        await new Promise((r) => setTimeout(r, 300));
        const movies = getStoredMovies();
        const movie = movies.find((m) => m.id === id);
        if (!movie) throw new Error('Movie not found');

        const mediaBaseUrl = localStorage.getItem(MEDIA_BASE_URL_KEY) || 'https://test-streams.mux.dev';
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
    const user = getCurrentUser();
    const userId = user?.id || null;

    try {
      await apiClient.post('/progress', { movieId, positionSeconds, durationSeconds, userId });
    } catch {
      // ignore network errors in mock fallback
    }

    // Save strictly to current user's space in local storage
    if (userId) {
      const userKey = `streambox_progress_${userId}`;
      const progressMap = JSON.parse(localStorage.getItem(userKey) || '{}');
      const percent = durationSeconds > 0 ? Math.round((positionSeconds / durationSeconds) * 100) : 0;
      progressMap[movieId] = {
        position: positionSeconds,
        duration: durationSeconds,
        percent,
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem(userKey, JSON.stringify(progressMap));
    }
  },

  getProgressMap: () => {
    try {
      const user = getCurrentUser();
      if (!user) return {};
      return JSON.parse(localStorage.getItem(`streambox_progress_${user.id}`) || '{}');
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
        await new Promise((r) => setTimeout(r, 400));
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

        // Also update in registered users database
        const user = getCurrentUser();
        if (user) {
          const usersDb = getRegisteredUsers();
          const idx = usersDb.findIndex((u) => u.id === user.id || u.phone === user.phone);
          if (idx !== -1) {
            usersDb[idx].planId = plan.id;
            usersDb[idx].planName = plan.name;
            usersDb[idx].subscription = sub;
            saveRegisteredUsers(usersDb);
          }
        }

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
      const user = getCurrentUser();
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
    const currentUser = getCurrentUser();
    if (!isUserAdmin(currentUser)) {
      throw new Error('Access denied: Administrator privileges required.');
    }
    try {
      if (onProgress) {
        for (let p = 10; p <= 90; p += 30) {
          await new Promise((r) => setTimeout(r, 60));
          onProgress(p);
        }
      }
      const res = await apiClient.post('/admin/movies', movieData);
      if (onProgress) onProgress(100);
      return res.data;
    } catch (err) {
      if (!USE_MOCK_FALLBACK) throw err;
      if (onProgress) {
        for (let p = 10; p <= 100; p += 20) {
          await new Promise((r) => setTimeout(r, 80));
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
        status: 'ready',
        progress: 0,
        lastPosition: 0
      };

      movies.unshift(newMovie);
      saveStoredMovies(movies);
      return newMovie;
    }
  },

  updateMovie: async (id, updates) => {
    const currentUser = getCurrentUser();
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
    const currentUser = getCurrentUser();
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