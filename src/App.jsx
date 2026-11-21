import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { MovieProvider } from './context/MovieContext';

// Pages
import HomePage from './pages/HomePage';
import MoviesPage from './pages/MoviesPage';
import MovieDetailsPage from './pages/MovieDetailsPage';
import WatchPage from './pages/WatchPage';
import SearchPage from './pages/SearchPage';
import PlansPage from './pages/PlansPage';
import ProfilePage from './pages/ProfilePage';
import AdminPage from './pages/AdminPage';
import LoginPage from './pages/LoginPage';
import AdminRoute from './components/AdminRoute';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <MovieProvider>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/movies" element={<MoviesPage />} />
            <Route path="/movie/:id" element={<MovieDetailsPage />} />
            <Route path="/watch/:id" element={<WatchPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/plans" element={<PlansPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminPage />
                </AdminRoute>
              }
            />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<LoginPage initialMode="register" />} />
            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </MovieProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
