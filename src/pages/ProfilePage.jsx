import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useMovies } from '../context/MovieContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Button from '../components/Button';
import {
  User,
  Phone,
  ShieldCheck,
  Clock,
  Play,
  LogOut,
  Sparkles,
  Film,
  Calendar
} from 'lucide-react';

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, subscription, logout } = useAuth();
  const { movies } = useMovies();

  // Watch history list (items with progress or recent watches)
  const watchHistory = movies.filter((m) => m.progress && m.progress > 0);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const expiryFormatted = subscription?.expiresAt
    ? new Date(subscription.expiresAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : null;

  return (
    <div className="min-h-screen bg-bg-base flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-10 space-y-10">
        {/* Page Title */}
        <div className="border-b border-text-muted/20 pb-4">
          <h1 className="text-3xl font-extrabold text-text-primary tracking-tight">
            Account & Settings
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Manage your personal profile, active subscription, and playback history.
          </p>
        </div>

        {/* User Profile Card (#232F3E) */}
        <div className="bg-bg-surface border border-text-muted/20 rounded-lg p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-blue-dodger flex items-center justify-center text-text-primary shadow-lg">
                <User className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-text-primary">{user?.name || 'Primary Profile'}</h2>
                <div className="flex items-center gap-1.5 text-xs text-text-muted mt-1">
                  <Phone className="w-3.5 h-3.5 text-blue-prime" />
                  <span>{user?.phone || 'Guest User'}</span>
                </div>
              </div>
            </div>

            <Button
              variant="secondary"
              icon={LogOut}
              onClick={handleLogout}
              className="text-error hover:bg-error/10 hover:border-error/30"
            >
              Sign Out
            </Button>
          </div>

          <div className="my-4 border-t border-text-muted/20" />

          {/* Subscription Section */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-bg-base/70 rounded-lg p-4 border border-text-muted/20">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-blue-prime/20 text-blue-prime flex items-center justify-center flex-shrink-0 mt-0.5">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-text-primary">
                  {subscription ? `${subscription.planName} Plan` : 'No Active Membership'}
                </h4>
                {subscription ? (
                  <p className="text-xs text-text-muted mt-0.5">
                    Valid until <span className="text-text-primary font-medium">{expiryFormatted}</span>
                  </p>
                ) : (
                  <p className="text-xs text-text-muted mt-0.5">
                    Subscribe to access Full HD and 4K Ultra HD catalog
                  </p>
                )}
              </div>
            </div>

            <Button
              variant="primary"
              size="sm"
              icon={Sparkles}
              onClick={() => navigate('/plans')}
            >
              {subscription ? 'Change Plan' : 'Choose a Plan'}
            </Button>
          </div>
        </div>

        {/* Watch History List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-prime" />
              <h3 className="text-xl font-bold text-text-primary">Watch History</h3>
            </div>
            <span className="text-xs text-text-muted">{watchHistory.length} Titles in Progress</span>
          </div>

          {watchHistory.length > 0 ? (
            <div className="space-y-3">
              {watchHistory.map((item) => (
                <div
                  key={item.id}
                  className="bg-bg-surface border border-text-muted/20 hover:border-blue-royal rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all duration-200"
                >
                  <div className="flex items-center gap-4 w-full sm:w-auto">
                    <img
                      src={item.poster}
                      alt={item.title}
                      className="w-14 h-20 object-cover rounded-lg flex-shrink-0"
                    />
                    <div className="space-y-1 flex-1 min-w-0">
                      <h4 className="text-sm sm:text-base font-bold text-text-primary truncate">
                        {item.title}
                      </h4>
                      <p className="text-xs text-text-muted">
                        {item.genres?.join(', ')} • {item.duration}
                      </p>

                      {/* Progress bar: #00A8E1 */}
                      <div className="w-48 sm:w-64 max-w-full pt-1.5">
                        <div className="h-1.5 w-full bg-text-muted/20 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-prime rounded-full"
                            style={{ width: `${item.progress}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-blue-prime font-semibold mt-1 inline-block">
                          {item.progress}% watched (resume at {Math.floor(item.lastPosition / 60)}m)
                        </span>
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="primary"
                    size="sm"
                    icon={Play}
                    onClick={() => navigate(`/watch/${item.id}`)}
                    className="self-end sm:self-auto"
                  >
                    Resume
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-bg-surface border border-text-muted/20 rounded-lg p-10 text-center space-y-3">
              <Film className="w-10 h-10 text-text-muted mx-auto" />
              <p className="text-sm font-semibold text-text-primary">No watch history yet</p>
              <p className="text-xs text-text-muted">
                Titles you begin watching will automatically show up here with saved bookmarks.
              </p>
              <Button variant="secondary" size="sm" onClick={() => navigate('/')}>
                Discover Movies
              </Button>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ProfilePage;
