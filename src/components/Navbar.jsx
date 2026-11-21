import React, { useState, useRef, useEffect } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { Search, User, Menu, X, Shield, Sparkles, LogOut, Film, ChevronDown, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Button from './Button';

const Navbar = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isAdmin, subscription, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setProfileDropdownOpen(false);
    await logout();
    navigate('/login');
  };

  const navLinkClasses = ({ isActive }) =>
    `text-sm font-medium transition-colors duration-200 py-1 border-b-2 ${
      isActive
        ? 'text-blue-prime border-blue-prime'
        : 'text-text-muted hover:text-text-primary border-transparent'
    }`;

  const hasActivePlan = subscription && subscription.status === 'active';

  return (
    <nav className="sticky top-0 z-40 w-full bg-bg-surface border-b border-text-muted/20 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Main Nav */}
          <div className="flex items-center gap-8">
            <Link
              to="/"
              className="flex items-center gap-2 font-extrabold text-xl tracking-wider text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-prime rounded"
            >
              <div className="w-8 h-8 rounded bg-blue-prime flex items-center justify-center text-text-primary shadow-sm">
                <Film className="w-5 h-5 fill-current" />
              </div>
              <span className="flex items-center">
                STREAM<span className="text-blue-prime">BOX</span>
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-6">
              <NavLink to="/" className={navLinkClasses} end>
                Home
              </NavLink>
              <NavLink to="/movies" className={navLinkClasses}>
                Movies
              </NavLink>
              <NavLink to="/search" className={navLinkClasses}>
                Search
              </NavLink>
              <NavLink to="/plans" className={navLinkClasses}>
                Plans
              </NavLink>
              {isAdmin && (
                <NavLink to="/admin" className={navLinkClasses}>
                  Admin
                </NavLink>
              )}
            </div>
          </div>

          {/* Right Action Icons & Profile */}
          <div className="hidden md:flex items-center gap-4">
            {/* Search Icon Quick Link */}
            <Link
              to="/search"
              aria-label="Search"
              className="p-2 text-text-muted hover:text-blue-prime transition-colors rounded-lg hover:bg-bg-base/60 focus-visible:ring-2 focus-visible:ring-blue-prime"
            >
              <Search className="w-5 h-5" />
            </Link>

            {/* Subscribe CTA Button if no active plan */}
            {!hasActivePlan && (
              <Button
                variant="primary"
                size="sm"
                icon={Sparkles}
                onClick={() => navigate('/plans')}
              >
                Subscribe
              </Button>
            )}

            {/* User Profile / Login */}
            {isAuthenticated ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  aria-expanded={profileDropdownOpen}
                  aria-haspopup="true"
                  aria-label="User menu"
                  className="flex items-center gap-2 p-1.5 rounded-lg text-text-primary hover:bg-bg-base/60 transition-colors border border-text-muted/20 focus-visible:ring-2 focus-visible:ring-blue-prime"
                >
                  <div className="w-7 h-7 rounded-full bg-blue-dodger flex items-center justify-center text-xs font-bold text-text-primary">
                    <User className="w-4 h-4" />
                  </div>
                  <ChevronDown className="w-4 h-4 text-text-muted" />
                </button>

                {/* Dropdown Menu */}
                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-bg-surface border border-text-muted/20 rounded-lg shadow-2xl py-2 z-50 animate-fade-in">
                    <div className="px-4 py-2 border-b border-text-muted/20">
                      <p className="text-xs text-text-muted font-medium">Signed in as</p>
                      <p className="text-sm font-semibold text-text-primary truncate">
                        {user.name || user.phone}
                      </p>
                      {user.name && user.phone && (
                        <p className="text-xs text-text-muted font-mono">{user.phone}</p>
                      )}
                      {hasActivePlan ? (
                        <div className="mt-1 flex items-center gap-1.5 text-xs text-success font-medium">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Plan: {subscription.planName}</span>
                        </div>
                      ) : (
                        <div className="mt-1 text-xs text-text-muted">No active plan</div>
                      )}
                    </div>

                    <Link
                      to="/profile"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-text-muted hover:text-text-primary hover:bg-bg-base/60 transition-colors"
                    >
                      <User className="w-4 h-4" />
                      Account & History
                    </Link>

                    <Link
                      to="/plans"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-text-muted hover:text-text-primary hover:bg-bg-base/60 transition-colors"
                    >
                      <Sparkles className="w-4 h-4 text-blue-prime" />
                      Manage Subscription
                    </Link>

                    {isAdmin && (
                      <Link
                        to="/admin"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-text-muted hover:text-text-primary hover:bg-bg-base/60 transition-colors"
                      >
                        <Shield className="w-4 h-4 text-blue-dodger" />
                        Admin Dashboard
                      </Link>
                    )}

                    <div className="my-1 border-t border-text-muted/20" />

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-error hover:bg-bg-base/60 transition-colors text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigate('/login')}
              >
                Sign In
              </Button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center gap-2">
            {!hasActivePlan && (
              <button
                onClick={() => navigate('/plans')}
                className="bg-blue-prime text-text-primary text-xs font-semibold px-2.5 py-1.5 rounded-lg"
              >
                Subscribe
              </button>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-base/60 focus-visible:ring-2 focus-visible:ring-blue-prime"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-bg-surface border-t border-text-muted/20 px-4 pt-2 pb-5 space-y-3 animate-fade-in">
          <div className="flex flex-col space-y-2">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-sm font-medium text-text-primary hover:bg-bg-base/60"
            >
              Home
            </Link>
            <Link
              to="/movies"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-sm font-medium text-text-primary hover:bg-bg-base/60"
            >
              Movies
            </Link>
            <Link
              to="/search"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-sm font-medium text-text-primary hover:bg-bg-base/60"
            >
              Search
            </Link>
            <Link
              to="/plans"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-sm font-medium text-text-primary hover:bg-bg-base/60"
            >
              Plans
            </Link>
            {isAdmin && (
              <Link
                to="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg text-sm font-medium text-text-primary hover:bg-bg-base/60"
              >
                Admin
              </Link>
            )}
          </div>

          <div className="pt-2 border-t border-text-muted/20">
            {isAuthenticated ? (
              <div className="space-y-2">
                <div className="px-3 py-1">
                  <p className="text-xs text-text-muted">Signed in as</p>
                  <p className="text-sm font-medium text-text-primary">{user.phone}</p>
                </div>
                <Link
                  to="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-lg text-sm text-text-muted hover:text-text-primary hover:bg-bg-base/60"
                >
                  Account & Watch History
                </Link>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm text-error hover:bg-bg-base/60"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <Button
                variant="primary"
                size="md"
                className="w-full"
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate('/login');
                }}
              >
                Sign In with Phone
              </Button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
