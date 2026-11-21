import React from 'react';
import { Link } from 'react-router-dom';
import { Film } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Footer = () => {
  const { isAdmin } = useAuth();
  return (
    <footer className="w-full bg-bg-deep border-t border-text-muted/20 py-10 px-4 sm:px-8 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
        {/* Logo and Tagline */}
        <div className="flex flex-col items-center md:items-start gap-2">
          <div className="flex items-center gap-2 font-extrabold text-lg tracking-wider text-text-primary">
            <div className="w-7 h-7 rounded bg-blue-prime flex items-center justify-center text-text-primary shadow-sm">
              <Film className="w-4 h-4 fill-current" />
            </div>
            <span>
              STREAM<span className="text-blue-prime">BOX</span>
            </span>
          </div>
          <p className="text-xs text-text-muted max-w-sm">
            Prime Video-grade personal streaming platform with high bitrate HLS video playback.
          </p>
        </div>

        {/* Links */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
          <Link to="/" className="text-blue-prime hover:text-blue-bright transition-colors">
            Home
          </Link>
          <Link to="/movies" className="text-blue-prime hover:text-blue-bright transition-colors">
            All Movies
          </Link>
          <Link to="/plans" className="text-blue-prime hover:text-blue-bright transition-colors">
            Subscription Plans
          </Link>
          {isAdmin && (
            <Link to="/admin" className="text-blue-prime hover:text-blue-bright transition-colors">
              Admin Console
            </Link>
          )}
        </div>

        {/* Copyright */}
        <div className="text-xs text-text-muted">
          <p>© {new Date().getFullYear()} StreamBox Inc. All rights reserved.</p>
          <p className="mt-1 text-[11px] text-text-muted/70">
            Encrypted with HLS signed session tokens
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
