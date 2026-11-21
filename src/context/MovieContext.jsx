import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { moviesApi, adminApi } from '../services/api';
import { useAuth } from './AuthContext';

const MovieContext = createContext();

export const MovieProvider = ({ children }) => {
  const { user } = useAuth();
  const [movies, setMovies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMovie, setSelectedMovie] = useState(null);

  const fetchMovies = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await moviesApi.getAll();
      setMovies(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load movies');
      setMovies([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Reload movies whenever user switches or logs in/out so their private space is loaded
  useEffect(() => {
    fetchMovies();
  }, [fetchMovies, user?.id]);

  const recordProgress = useCallback(async (movieId, positionSeconds, durationSeconds) => {
    await moviesApi.saveProgress(movieId, positionSeconds, durationSeconds);
    // Update local state smoothly
    const percent = durationSeconds > 0 ? Math.round((positionSeconds / durationSeconds) * 100) : 0;
    setMovies((prev) =>
      prev.map((m) =>
        m.id === movieId
          ? { ...m, progress: percent, lastPosition: positionSeconds }
          : m
      )
    );
  }, []);

  const addMovie = async (movieData, onProgress) => {
    const created = await adminApi.createMovie(movieData, onProgress);
    setMovies((prev) => [created, ...prev]);
    return created;
  };

  const updateMovie = async (id, updates) => {
    const updated = await adminApi.updateMovie(id, updates);
    setMovies((prev) => prev.map((m) => (m.id === id ? updated : m)));
    return updated;
  };

  const deleteMovie = async (id) => {
    await adminApi.deleteMovie(id);
    setMovies((prev) => prev.filter((m) => m.id !== id));
  };

  return (
    <MovieContext.Provider
      value={{
        movies,
        isLoading,
        error,
        selectedMovie,
        setSelectedMovie,
        fetchMovies,
        recordProgress,
        addMovie,
        updateMovie,
        deleteMovie
      }}
    >
      {children}
    </MovieContext.Provider>
  );
};

export const useMovies = () => {
  const context = useContext(MovieContext);
  if (!context) {
    throw new Error('useMovies must be used within a MovieProvider');
  }
  return context;
};
