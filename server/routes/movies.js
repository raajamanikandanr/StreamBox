import { Router } from 'express';
import { query } from '../db.js';

const router = Router();

export const formatMovie = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    year: row.year,
    duration: row.duration,
    rating: row.rating,
    plan_required: row.plan_required,
    genres: row.genres || [],
    description: row.description,
    cast: row.cast_members || [],
    poster: row.poster,
    backdrop: row.backdrop,
    hls_path: row.hls_path,
    stream_url: row.stream_url,
    status: row.status || 'ready',
    progress: row.progress || 0,
    lastPosition: row.last_position || 0,
    createdAt: row.created_at
  };
};

export const requireAdmin = (req, res, next) => {
  const adminPhone = (process.env.ADMIN_PHONE || '8122850816').toString().replace(/\D/g, '').slice(-10);
  const userPhone = (req.headers['x-user-phone'] || '').toString().replace(/\D/g, '').slice(-10);
  const userRole = req.headers['x-user-role'];

  if (userRole === 'admin' || (userPhone && userPhone === adminPhone)) {
    return next();
  }
  return res.status(403).json({ error: 'Access denied: Administrator privileges required.' });
};

// GET /api/movies/search?q=...
router.get('/search', async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q) {
      const all = await query('SELECT * FROM movies ORDER BY created_at DESC');
      return res.json(all.rows.map(formatMovie));
    }
    const sql = `
      SELECT * FROM movies
      WHERE title ILIKE $1 
         OR description ILIKE $1 
         OR array_to_string(genres, ',') ILIKE $1
         OR array_to_string(cast_members, ',') ILIKE $1
      ORDER BY created_at DESC
    `;
    const result = await query(sql, [`%${q}%`]);
    res.json(result.rows.map(formatMovie));
  } catch (error) {
    console.error('Error searching movies:', error);
    res.status(500).json({ error: 'Failed to search movies' });
  }
});

// GET /api/movies
router.get('/', async (req, res) => {
  try {
    const result = await query('SELECT * FROM movies ORDER BY created_at DESC');
    res.json(result.rows.map(formatMovie));
  } catch (error) {
    console.error('Error fetching movies:', error);
    res.status(500).json({ error: 'Failed to fetch movies' });
  }
});

// GET /api/movies/:id
router.get('/:id', async (req, res) => {
  try {
    const result = await query('SELECT * FROM movies WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Movie not found' });
    }
    res.json(formatMovie(result.rows[0]));
  } catch (error) {
    console.error('Error fetching movie:', error);
    res.status(500).json({ error: 'Failed to fetch movie' });
  }
});

// GET /api/movies/:id/stream
router.get('/:id/stream', async (req, res) => {
  try {
    const result = await query('SELECT * FROM movies WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Movie not found' });
    }
    const movie = formatMovie(result.rows[0]);
    const mediaBaseUrl = process.env.MEDIA_BASE_URL || 'https://test-streams.mux.dev';
    const streamUrl = movie.stream_url || `${mediaBaseUrl}/media/${movie.hls_path}`;

    res.json({
      url: streamUrl,
      token: 'jwt-stream-token-' + Date.now(),
      mediaBaseUrl,
      title: movie.title
    });
  } catch (error) {
    console.error('Error fetching stream URL:', error);
    res.status(500).json({ error: 'Failed to generate stream ticket' });
  }
});

// POST /api/movies (Admin create movie)
router.post('/', requireAdmin, async (req, res) => {
  try {
    const {
      title,
      year,
      duration,
      rating,
      plan_required,
      genres,
      description,
      cast,
      poster,
      posterUrl,
      backdrop,
      stream_url
    } = req.body;

    const id = 'mov-' + Date.now();
    const posterFinal = poster || posterUrl || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80';
    const backdropFinal = backdrop || posterFinal;
    const genresArr = Array.isArray(genres) ? genres : (genres ? [genres] : ['Action']);
    const castArr = Array.isArray(cast) ? cast : (typeof cast === 'string' ? cast.split(',').map((c) => c.trim()) : ['Prime Cast']);
    const hlsPath = `uploads/${Date.now()}/master.m3u8`;
    const streamFinal = stream_url || 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8';

    const insertSql = `
      INSERT INTO movies (
        id, title, year, duration, rating, plan_required, genres, description,
        cast_members, poster, backdrop, hls_path, stream_url, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'ready')
      RETURNING *
    `;

    const result = await query(insertSql, [
      id,
      title,
      parseInt(year, 10) || new Date().getFullYear(),
      duration || '1h 45m',
      rating || '13+',
      plan_required || 'super',
      genresArr,
      description || '',
      castArr,
      posterFinal,
      backdropFinal,
      hlsPath,
      streamFinal
    ]);

    res.status(201).json(formatMovie(result.rows[0]));
  } catch (error) {
    console.error('Error creating movie:', error);
    res.status(500).json({ error: 'Failed to create movie' });
  }
});

// PUT /api/movies/:id
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const currentRes = await query('SELECT * FROM movies WHERE id = $1', [id]);
    if (currentRes.rows.length === 0) {
      return res.status(404).json({ error: 'Movie not found' });
    }

    const cur = currentRes.rows[0];
    const updated = {
      title: updates.title !== undefined ? updates.title : cur.title,
      year: updates.year !== undefined ? parseInt(updates.year, 10) : cur.year,
      duration: updates.duration !== undefined ? updates.duration : cur.duration,
      rating: updates.rating !== undefined ? updates.rating : cur.rating,
      plan_required: updates.plan_required !== undefined ? updates.plan_required : cur.plan_required,
      description: updates.description !== undefined ? updates.description : cur.description,
      status: updates.status !== undefined ? updates.status : cur.status,
      stream_url: updates.stream_url !== undefined ? updates.stream_url : cur.stream_url
    };

    const updateSql = `
      UPDATE movies
      SET title = $1, year = $2, duration = $3, rating = $4, plan_required = $5, description = $6, status = $7, stream_url = $8
      WHERE id = $9
      RETURNING *
    `;

    const result = await query(updateSql, [
      updated.title,
      updated.year,
      updated.duration,
      updated.rating,
      updated.plan_required,
      updated.description,
      updated.status,
      updated.stream_url,
      id
    ]);

    res.json(formatMovie(result.rows[0]));
  } catch (error) {
    console.error('Error updating movie:', error);
    res.status(500).json({ error: 'Failed to update movie' });
  }
});

// DELETE /api/movies/:id
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const result = await query('DELETE FROM movies WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Movie not found' });
    }
    res.json({ success: true, message: 'Movie deleted' });
  } catch (error) {
    console.error('Error deleting movie:', error);
    res.status(500).json({ error: 'Failed to delete movie' });
  }
});

export default router;
