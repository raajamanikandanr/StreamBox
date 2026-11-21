import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi, plansApi, isUserAdmin, getAdminPhone } from '../services/api';

const AuthContext = createContext();

const PLAN_LEVELS = {
  free: 0,
  mobile: 1,
  super: 2,
  premium: 3
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('streambox_user');
      if (!stored) return null;
      const parsed = JSON.parse(stored);
      if (parsed) {
        const adminPhone = getAdminPhone();
        const userPhone = (parsed.phone || '').toString().replace(/\D/g, '').slice(-10);
        const shouldBeAdmin = userPhone === adminPhone;
        if (shouldBeAdmin && parsed.role !== 'admin') {
          parsed.role = 'admin';
          localStorage.setItem('streambox_user', JSON.stringify(parsed));
        } else if (!shouldBeAdmin && parsed.role === 'admin') {
          parsed.role = 'user';
          localStorage.setItem('streambox_user', JSON.stringify(parsed));
        }
      }
      return parsed;
    } catch {
      return null;
    }
  });

  const [subscription, setSubscription] = useState(() => {
    return plansApi.getCurrentSubscription();
  });

  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState(null);

  // Check current subscription
  useEffect(() => {
    const sub = plansApi.getCurrentSubscription();
    setSubscription(sub);
  }, [user]);

  const sendOtp = async (phone) => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const res = await authApi.sendOtp(phone);
      return res;
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to send OTP';
      setAuthError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOtp = async (phone, otp) => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const res = await authApi.verifyOtp(phone, otp);
      if (res.user) {
        const adminPhone = getAdminPhone();
        const userPhone = (res.user.phone || '').toString().replace(/\D/g, '').slice(-10);
        const role = userPhone === adminPhone ? 'admin' : 'user';
        const updatedUser = { ...res.user, role };
        setUser(updatedUser);
        localStorage.setItem('streambox_user', JSON.stringify(updatedUser));
        // Refresh subscription
        setSubscription(res.subscription || plansApi.getCurrentSubscription());
      }
      return res;
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Verification failed';
      setAuthError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    await authApi.logout();
    setUser(null);
    setSubscription(null);
  };

  const subscribe = async (planId) => {
    setIsLoading(true);
    try {
      const res = await plansApi.createSubscription(planId);
      setSubscription(res.subscription);
      return res.subscription;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Check if current user has access to a movie's required plan
   */
  const canWatch = (requiredPlan) => {
    if (!requiredPlan || requiredPlan === 'free') return true;
    if (!subscription || subscription.status !== 'active') return false;
    
    const userLevel = PLAN_LEVELS[subscription.planId?.toLowerCase()] || 0;
    const reqLevel = PLAN_LEVELS[requiredPlan.toLowerCase()] || 1;
    return userLevel >= reqLevel;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isAdmin: isUserAdmin(user),
        subscription,
        isLoading,
        authError,
        sendOtp,
        verifyOtp,
        logout,
        subscribe,
        canWatch,
        setAuthError
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
