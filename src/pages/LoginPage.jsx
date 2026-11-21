import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Film, Phone, User as UserIcon, ArrowLeft, RefreshCw, Sparkles, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import Input from '../components/Input';
import OTPInput from '../components/OTPInput';

const PLANS = [
  {
    id: 'mobile',
    name: 'Mobile',
    price: '$2.99',
    period: '/mo',
    quality: '720p HD',
    screens: '1 Screen'
  },
  {
    id: 'super',
    name: 'Super',
    price: '$6.99',
    period: '/mo',
    quality: '1080p Full HD',
    screens: '2 Screens',
    popular: true
  },
  {
    id: 'premium',
    name: 'Premium 4K',
    price: '$11.99',
    period: '/mo',
    quality: '4K UHD + Atmos',
    screens: '4 Screens'
  }
];

const LoginPage = ({ initialMode = 'login' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, sendOtp, verifyOtp, registerUser, isAuthenticated, isLoading, logout } = useAuth();

  // Mode: 'login' or 'register'
  const [mode, setMode] = useState(() => {
    if (initialMode === 'register' || location.pathname === '/register' || location.search.includes('mode=register')) {
      return 'register';
    }
    return 'login';
  });

  const [step, setStep] = useState(1); // 1: form, 2: otp
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('super');
  const [otpValue, setOtpValue] = useState('');
  const [countdown, setCountdown] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [formError, setFormError] = useState('');
  const [notRegisteredError, setNotRegisteredError] = useState(false);
  const [demoHint, setDemoHint] = useState('');

  // Resend countdown timer
  useEffect(() => {
    let timer;
    if (step === 2 && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (countdown === 0) {
      setCanResend(true);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  const cleanDigits = phoneNumber.replace(/\D/g, '').slice(0, 10);

  const handleModeChange = (newMode) => {
    setMode(newMode);
    setStep(1);
    setFormError('');
    setNotRegisteredError(false);
    setDemoHint('');
    setOtpValue('');
  };

  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    setFormError('');
    setNotRegisteredError(false);

    if (mode === 'register') {
      if (!fullName.trim()) {
        setFormError('Please enter your full name');
        return;
      }
      if (cleanDigits.length !== 10) {
        setFormError('Please enter a valid 10-digit mobile number');
        return;
      }

      try {
        await registerUser({
          name: fullName.trim(),
          phone: cleanDigits,
          planId: selectedPlan,
          otp: '123456'
        });
        const from = location.state?.from?.pathname || '/';
        const target = from === '/login' || from === '/register' ? '/' : from;
        navigate(target, { replace: true });
      } catch (err) {
        setFormError(err.message || 'Registration failed. Please try again.');
      }
      return;
    }

    if (cleanDigits.length !== 10) {
      setFormError('Please enter a valid 10-digit mobile number');
      return;
    }

    try {
      const res = await sendOtp(cleanDigits, mode);
      setStep(2);
      setCountdown(30);
      setCanResend(false);
      setOtpValue('');
      if (res?.debugOtp) {
        setDemoHint(`Demo OTP: ${res.debugOtp}`);
      }
    } catch (err) {
      const msg = err.message || 'Operation failed';
      setFormError(msg);
      if (err.notRegistered) {
        setNotRegisteredError(true);
      }
    }
  };

  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    setFormError('');

    if (otpValue.length !== 6) {
      setFormError('Please enter the full 6-digit verification code');
      return;
    }

    try {
      if (mode === 'register') {
        await registerUser({
          name: fullName.trim(),
          phone: cleanDigits,
          planId: selectedPlan,
          otp: otpValue
        });
      } else {
        await verifyOtp(cleanDigits, otpValue);
      }
      const from = location.state?.from?.pathname || '/';
      const target = from === '/login' || from === '/register' ? '/' : from;
      navigate(target, { replace: true });
    } catch (err) {
      setFormError(err.message || 'Invalid OTP code. Please try again.');
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    setFormError('');
    try {
      await sendOtp(cleanDigits, mode);
      setCountdown(30);
      setCanResend(false);
      setOtpValue('');
    } catch (err) {
      setFormError(err.message || 'Failed to resend code.');
    }
  };

  return (
    <div className="min-h-screen bg-bg-base flex flex-col justify-center items-center px-4 sm:px-6 py-10">
      {/* Centered card #232F3E on #0F171E background */}
      <div className="w-full max-w-md bg-bg-surface border border-text-muted/20 rounded-xl shadow-2xl p-6 sm:p-8 space-y-6 animate-fade-in">
        {/* App Logo & Name */}
        <div className="flex flex-col items-center text-center">
          <Link to="/" className="inline-flex items-center gap-2 mb-2">
            <div className="w-11 h-11 rounded bg-blue-prime flex items-center justify-center text-text-primary shadow-lg">
              <Film className="w-6 h-6 fill-current" />
            </div>
          </Link>
          <h1 className="text-2xl font-extrabold tracking-wider text-text-primary">
            STREAM<span className="text-blue-prime">BOX</span>
          </h1>
          <p className="text-xs text-text-muted mt-1">
            {mode === 'login'
              ? 'Sign in to access your personal watch space'
              : 'Create an account to start streaming in HD & 4K'}
          </p>
        </div>

        {/* If Already Authenticated: Show Profile & Switch Account */}
        {isAuthenticated ? (
          <div className="space-y-6 text-center animate-fade-in py-2">
            <div className="w-16 h-16 rounded-full bg-blue-prime/20 text-blue-prime mx-auto flex items-center justify-center">
              <UserIcon className="w-8 h-8" />
            </div>
            <div>
              <p className="text-xs text-text-muted font-medium">Currently signed in as</p>
              <h3 className="text-xl font-bold text-text-primary mt-1">
                {user?.name || user?.phone}
              </h3>
              {user?.phone && (
                <p className="text-xs text-text-muted font-mono mt-0.5">{user.phone}</p>
              )}
            </div>

            <div className="space-y-3 pt-3">
              <Button
                variant="primary"
                size="lg"
                className="w-full font-bold shadow-lg"
                onClick={() => navigate('/')}
              >
                Continue Streaming
              </Button>
              <Button
                variant="secondary"
                size="lg"
                className="w-full text-error hover:bg-error/10 hover:border-error/30"
                onClick={async () => {
                  await logout();
                  setStep(1);
                  setPhoneNumber('');
                  setFullName('');
                  setFormError('');
                }}
              >
                Switch Account / Sign Out
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Tab Switcher: Sign In vs Register */}
            {step === 1 && (
              <div className="flex bg-bg-base rounded-lg p-1 border border-text-muted/20">
                <button
                  type="button"
                  onClick={() => handleModeChange('login')}
                  className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${
                    mode === 'login'
                      ? 'bg-blue-prime text-text-primary shadow-md'
                      : 'text-text-muted hover:text-text-primary'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => handleModeChange('register')}
                  className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${
                    mode === 'register'
                      ? 'bg-blue-prime text-text-primary shadow-md'
                      : 'text-text-muted hover:text-text-primary'
                  }`}
                >
                  Create Account
                </button>
              </div>
            )}

            {/* Form Error Banner */}
            {formError && (
              <div className="bg-error/15 border border-error/40 rounded-lg p-3 flex items-start gap-2.5 text-xs text-error animate-fade-in">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div className="flex-1 space-y-1.5">
                  <p className="font-medium leading-relaxed">{formError}</p>
                  {notRegisteredError && (
                    <button
                      type="button"
                      onClick={() => handleModeChange('register')}
                      className="font-bold underline text-blue-prime hover:text-blue-bright block"
                    >
                      Click here to register with {cleanDigits} →
                    </button>
                  )}
                </div>
              </div>
            )}

        {/* STEP 1: Phone / Registration Form */}
        {step === 1 && (
          <form onSubmit={handleSendOtp} className="space-y-5">
            {/* If Register Mode: Name Input */}
            {mode === 'register' && (
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted">
                  Full Name
                </label>
                <Input
                  type="text"
                  placeholder="Enter your full name"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    if (formError) setFormError('');
                  }}
                  icon={UserIcon}
                  required
                  autoFocus
                />
              </div>
            )}

            {/* Mobile Number Input with strict 10 digits validation */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted">
                  Mobile Number (10 Digits)
                </label>
                <span className={`text-[11px] font-mono ${cleanDigits.length === 10 ? 'text-success font-bold' : 'text-text-muted'}`}>
                  {cleanDigits.length}/10
                </span>
              </div>

              <Input
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={10}
                placeholder="10-digit mobile number (e.g. 9876500001)"
                value={phoneNumber}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (cleanDigits.length === 10) {
                      handleSendOtp(e);
                    }
                  }
                }}
                onPaste={(e) => {
                  e.preventDefault();
                  const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 10);
                  setPhoneNumber(pasted);
                  if (formError) setFormError('');
                }}
                onChange={(e) => {
                  const onlyNums = e.target.value.replace(/\D/g, '').slice(0, 10);
                  setPhoneNumber(onlyNums);
                  if (formError) setFormError('');
                }}
                icon={Phone}
                autoFocus={mode === 'login'}
              />
              <p className="text-[11px] text-text-muted">
                {mode === 'login'
                  ? 'Must be registered in database. Demo OTP is 123456.'
                  : 'You will use this 10-digit number to log in.'}
              </p>
            </div>

            {/* If Register Mode: Plan Selection Cards */}
            {mode === 'register' && (
              <div className="space-y-2 pt-1">
                <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted flex items-center justify-between">
                  <span>Choose Initial Plan</span>
                  <span className="text-blue-prime text-[11px] normal-case">1 Month Included</span>
                </label>

                <div className="grid grid-cols-3 gap-2">
                  {PLANS.map((plan) => {
                    const isSelected = selectedPlan === plan.id;
                    return (
                      <button
                        key={plan.id}
                        type="button"
                        onClick={() => setSelectedPlan(plan.id)}
                        className={`relative p-2.5 rounded-lg border text-left transition-all flex flex-col justify-between ${
                          isSelected
                            ? 'bg-blue-prime/15 border-blue-prime shadow-md ring-1 ring-blue-prime'
                            : 'bg-bg-base/70 border-text-muted/20 hover:border-text-muted/40'
                        }`}
                      >
                        {plan.popular && (
                          <span className="absolute -top-2 right-1.5 bg-blue-prime text-text-primary text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded shadow">
                            Best
                          </span>
                        )}
                        <div>
                          <p className="text-xs font-bold text-text-primary truncate">{plan.name}</p>
                          <p className="text-xs text-blue-prime font-bold mt-0.5">
                            {plan.price}<span className="text-[10px] text-text-muted">{plan.period}</span>
                          </p>
                        </div>
                        <div className="mt-2 text-[10px] text-text-muted leading-tight border-t border-text-muted/10 pt-1.5">
                          <p className="truncate text-text-primary/90 font-medium">{plan.quality}</p>
                          <p className="truncate">{plan.screens}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              className="w-full text-base font-bold shadow-lg"
              disabled={cleanDigits.length !== 10 || (mode === 'register' && !fullName.trim())}
            >
              {mode === 'login' ? 'Send OTP & Sign In' : 'Create Account & Start Watching'}
            </Button>
          </form>
        )}

        {/* STEP 2: OTP Verification Form */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <div className="flex items-center justify-between bg-bg-base/60 p-2.5 rounded-lg border border-text-muted/20">
              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setFormError('');
                  setDemoHint('');
                }}
                className="inline-flex items-center text-xs font-medium text-text-muted hover:text-blue-prime transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                Change details
              </button>
              <div className="text-right">
                <span className="text-xs text-text-primary font-mono font-bold block">{cleanDigits}</span>
                {mode === 'register' && (
                  <span className="text-[10px] text-blue-prime uppercase font-semibold">
                    Plan: {selectedPlan}
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted text-center">
                Enter 6-Digit Verification Code
              </label>

              <OTPInput
                value={otpValue}
                onChange={(val) => {
                  setOtpValue(val);
                  if (formError) setFormError('');
                  if (val.length === 6) {
                    setTimeout(() => {
                      if (mode === 'register') {
                        registerUser({
                          name: fullName.trim(),
                          phone: cleanDigits,
                          planId: selectedPlan,
                          otp: val
                        })
                          .then(() => {
                            navigate('/', { replace: true });
                          })
                          .catch((err) => {
                            setFormError(err.message || 'Registration failed');
                          });
                      } else {
                        verifyOtp(cleanDigits, val)
                          .then(() => {
                            const from = location.state?.from?.pathname || '/';
                            const target = from === '/login' || from === '/register' ? '/' : from;
                            navigate(target, { replace: true });
                          })
                          .catch((err) => {
                            setFormError(err.message || 'Invalid OTP code. Please try again.');
                          });
                      }
                    }, 100);
                  }
                }}
                error={formError}
                disabled={isLoading}
              />

              {demoHint && (
                <div className="bg-bg-base/80 border border-blue-prime/30 rounded-lg p-2.5 text-center text-xs text-blue-prime font-bold flex items-center justify-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  <span>{demoHint}</span>
                </div>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              disabled={otpValue.length !== 6}
              className="w-full text-base font-bold shadow-lg"
            >
              {mode === 'register' ? 'Complete Registration & Start Watching' : 'Verify & Enter Space'}
            </Button>

            {/* 30s resend countdown */}
            <div className="text-center">
              {canResend ? (
                <button
                  type="button"
                  onClick={handleResend}
                  className="text-xs font-semibold text-blue-prime hover:text-blue-bright transition-colors inline-flex items-center gap-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-prime rounded"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Resend OTP Code
                </button>
              ) : (
                <p className="text-xs text-text-muted">
                  Resend code in{' '}
                  <span className="text-text-primary font-semibold">{countdown}s</span>
                </p>
              )}
            </div>
          </form>
        )}

        {/* Footer info within card */}
        <div className="pt-3 border-t border-text-muted/20 text-center space-y-2">
          {mode === 'login' ? (
            <p className="text-xs text-text-muted">
              First time here?{' '}
              <button
                type="button"
                onClick={() => handleModeChange('register')}
                className="font-bold text-blue-prime hover:underline"
              >
                Create an account
              </button>
            </p>
          ) : (
            <p className="text-xs text-text-muted">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => handleModeChange('login')}
                className="font-bold text-blue-prime hover:underline"
              >
                Sign In
              </button>
            </p>
          )}

          <p className="text-[11px] text-text-muted/80">
            By continuing, you agree to StreamBox Terms of Service and Privacy Policy.
          </p>
        </div>
        </>
      )}
      </div>
    </div>
  );
};

export default LoginPage;