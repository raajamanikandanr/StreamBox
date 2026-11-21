import { pool, query } from './db.js';
import { runMigrations } from './migrate.js';

const INITIAL_PLANS = [
  {
    id: 'mobile',
    name: 'Mobile',
    price: '$2.99',
    period: '/month',
    duration: '1 Month',
    screens: '1 Screen (Mobile/Tablet only)',
    quality: 'HD (720p)',
    downloads: 'Supported',
    recommended: false,
    description: 'Perfect for watching your favorite blockbusters on the go.'
  },
  {
    id: 'super',
    name: 'Super',
    price: '$6.99',
    period: '/month',
    duration: '1 Month',
    screens: '2 Screens simultaneously',
    quality: 'Full HD (1080p)',
    downloads: 'Supported',
    recommended: true,
    description: 'All content in Full HD on phone, laptop, or living room TV.'
  },
  {
    id: 'premium',
    name: 'Premium 4K',
    price: '$11.99',
    period: '/month',
    duration: '1 Month',
    screens: '4 Screens simultaneously',
    quality: 'Ultra HD (4K + HDR) & Dolby Atmos',
    downloads: 'Unlimited downloads',
    recommended: false,
    description: 'The ultimate cinematic experience with immersive audio and picture.'
  }
];

const INITIAL_MOVIES = [
  {
    id: 'mov-1',
    title: 'The Rings of Power: Citadel',
    year: 2024,
    duration: '2h 18m',
    rating: '16+',
    plan_required: 'super',
    genres: ['Action', 'Fantasy', 'Adventure'],
    description: 'In an age of renewed strife, legendary heroes unite across mystical realms to forge an alliance against an ancient shadowy empire threatening all kingdoms.',
    cast: ['Morfydd Clark', 'Charlie Vickers', 'Robert Aramayo', 'Markella Kavenagh'],
    poster: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80',
    backdrop: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1600&q=80',
    hls_path: 'citadel/master.m3u8',
    stream_url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    status: 'ready',
    progress: 42,
    lastPosition: 3500
  },
  {
    id: 'mov-2',
    title: 'Cyberpunk Syndicate',
    year: 2025,
    duration: '1h 54m',
    rating: '18+',
    plan_required: 'premium',
    genres: ['Sci-Fi', 'Action', 'Thriller'],
    description: 'Deep in the neon-drenched subterranean levels of Neo-Tokyo, a rogue neuro-hacker discovers a neural virus designed to enslave humanity.',
    cast: ['Keanu Reeves', 'Hiroyuki Sanada', 'Ana de Armas'],
    poster: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=600&q=80',
    backdrop: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1600&q=80',
    hls_path: 'cyberpunk/master.m3u8',
    stream_url: 'https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8',
    status: 'ready',
    progress: 78,
    lastPosition: 5300
  },
  {
    id: 'mov-3',
    title: 'Deep Horizon Odyssey',
    year: 2024,
    duration: '2h 35m',
    rating: '13+',
    plan_required: 'mobile',
    genres: ['Sci-Fi', 'Drama', 'Adventure'],
    description: 'A team of oceanographers and aerospace navigators journey to a submerged anomaly near the Mariana Trench that emits deep space coordinates.',
    cast: ['Matthew McConaughey', 'Jessica Chastain', 'Michael Caine'],
    poster: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80',
    backdrop: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1600&q=80',
    hls_path: 'horizon/master.m3u8',
    stream_url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    status: 'ready',
    progress: 15,
    lastPosition: 1200
  },
  {
    id: 'mov-4',
    title: 'Shadow Protocol: Tokyo',
    year: 2024,
    duration: '2h 05m',
    rating: '16+',
    plan_required: 'super',
    genres: ['Action', 'Thriller', 'Crime'],
    description: 'When an elite intelligence operative is framed for an international cyber theft, he must navigate Tokyo underground syndicates to clear his name.',
    cast: ['Dev Patel', 'Karen Fukuhara', 'Ken Watanabe'],
    poster: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=600&q=80',
    backdrop: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=1600&q=80',
    hls_path: 'shadow/master.m3u8',
    stream_url: 'https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8',
    status: 'ready',
    progress: 0,
    lastPosition: 0
  },
  {
    id: 'mov-5',
    title: 'The Enigma of Kepler',
    year: 2025,
    duration: '1h 48m',
    rating: '13+',
    plan_required: 'mobile',
    genres: ['Mystery', 'Sci-Fi'],
    description: 'Astronomers detect non-random microwave harmonics from Kepler-186f, triggering an international race to decipher the message before it goes dark.',
    cast: ['Amy Adams', 'Jeremy Renner', 'Forest Whitaker'],
    poster: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80',
    backdrop: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1600&q=80',
    hls_path: 'kepler/master.m3u8',
    stream_url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    status: 'ready',
    progress: 0,
    lastPosition: 0
  },
  {
    id: 'mov-6',
    title: 'Vanguard: Zero Hour',
    year: 2024,
    duration: '2h 12m',
    rating: '18+',
    plan_required: 'premium',
    genres: ['Action', 'War', 'Thriller'],
    description: 'A stranded multinational special ops unit must defend an isolated radar sanctuary against overwhelming hostile private militia forces.',
    cast: ['Pedro Pascal', 'Karl Urban', 'Gina Carano'],
    poster: 'https://images.unsplash.com/photo-1533613220915-609f661a6fe1?auto=format&fit=crop&w=600&q=80',
    backdrop: 'https://images.unsplash.com/photo-1533613220915-609f661a6fe1?auto=format&fit=crop&w=1600&q=80',
    hls_path: 'vanguard/master.m3u8',
    stream_url: 'https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8',
    status: 'ready',
    progress: 60,
    lastPosition: 4500
  },
  {
    id: 'mov-7',
    title: 'Echoes of the Silk Road',
    year: 2023,
    duration: '1h 42m',
    rating: 'All',
    plan_required: 'mobile',
    genres: ['Documentary', 'Adventure', 'History'],
    description: 'Follow archaeologists and historians as they uncover lost oasis cities hidden beneath shifting sands along the historic merchant routes of Eurasia.',
    cast: ['David Attenborough (Narrator)', 'Dr. Elena Rostova'],
    poster: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=600&q=80',
    backdrop: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1600&q=80',
    hls_path: 'silkroad/master.m3u8',
    stream_url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    status: 'ready',
    progress: 0,
    lastPosition: 0
  },
  {
    id: 'mov-8',
    title: 'Velocity: Apex Racing',
    year: 2024,
    duration: '1h 58m',
    rating: '13+',
    plan_required: 'super',
    genres: ['Action', 'Drama', 'Sports'],
    description: 'A prodigy street racer gets one shot to qualify for the world endurance championship, pitting raw intuition against corporate telemetry.',
    cast: ['Archie Madekwe', 'David Harbour', 'Orlando Bloom'],
    poster: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=600&q=80',
    backdrop: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=1600&q=80',
    hls_path: 'velocity/master.m3u8',
    stream_url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    status: 'processing',
    progress: 0,
    lastPosition: 0
  }
];

const adminPhone = (process.env.ADMIN_PHONE || '8122850816').replace(/\D/g, '').slice(-10);

const INITIAL_USERS = [
  { id: 'usr-101', phone: '9876500001', role: 'user', planId: 'mobile', planName: 'Mobile' },
  { id: 'usr-102', phone: '9876500002', role: 'user', planId: 'mobile', planName: 'Mobile' },
  { id: 'usr-103', phone: '9876500003', role: 'user', planId: 'mobile', planName: 'Mobile' },
  { id: 'usr-104', phone: '9876500004', role: 'user', planId: 'super', planName: 'Super' },
  { id: 'usr-105', phone: '9876500005', role: 'user', planId: 'super', planName: 'Super' },
  { id: 'usr-106', phone: '9876500006', role: 'user', planId: 'super', planName: 'Super' },
  { id: 'usr-107', phone: '9876500007', role: 'user', planId: 'super', planName: 'Super' },
  { id: 'usr-108', phone: '9876500008', role: 'user', planId: 'premium', planName: 'Premium 4K' },
  { id: 'usr-109', phone: '9876500009', role: 'user', planId: 'premium', planName: 'Premium 4K' },
  { id: 'usr-110', phone: '9876500010', role: 'user', planId: 'premium', planName: 'Premium 4K' },
  { id: 'usr-admin', phone: adminPhone, role: 'admin', planId: 'premium', planName: 'Admin Premium 4K' }
];

export const seedDatabase = async () => {
  const migrated = await runMigrations();
  if (!migrated) return;

  try {
    console.log('[Seed] Checking existing plans...');
    const plansRes = await query('SELECT COUNT(*) FROM plans');
    if (parseInt(plansRes.rows[0].count, 10) === 0) {
      console.log('[Seed] Seeding subscription plans...');
      for (const p of INITIAL_PLANS) {
        await query(
          `INSERT INTO plans (id, name, price, period, duration, screens, quality, downloads, recommended, description)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           ON CONFLICT (id) DO NOTHING`,
          [p.id, p.name, p.price, p.period, p.duration, p.screens, p.quality, p.downloads, p.recommended, p.description]
        );
      }
      console.log(`[Seed] Seeded ${INITIAL_PLANS.length} plans.`);
    }

    console.log('[Seed] Checking existing movies...');
    const moviesRes = await query('SELECT COUNT(*) FROM movies');
    if (parseInt(moviesRes.rows[0].count, 10) === 0) {
      console.log('[Seed] Seeding initial movies...');
      for (const m of INITIAL_MOVIES) {
        await query(
          `INSERT INTO movies (id, title, year, duration, rating, plan_required, genres, description, cast_members, poster, backdrop, hls_path, stream_url, status, progress, last_position)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
           ON CONFLICT (id) DO NOTHING`,
          [
            m.id,
            m.title,
            m.year,
            m.duration,
            m.rating,
            m.plan_required,
            m.genres,
            m.description,
            m.cast,
            m.poster,
            m.backdrop,
            m.hls_path,
            m.stream_url,
            m.status,
            m.progress,
            m.lastPosition
          ]
        );
      }
      console.log(`[Seed] Seeded ${INITIAL_MOVIES.length} movies.`);
    }

    console.log('[Seed] Seeding 10 demo users with separate plans...');
    const now = new Date();
    const expiry = new Date();
    expiry.setFullYear(expiry.getFullYear() + 1); // 1-year valid subscription

    for (const u of INITIAL_USERS) {
      // Upsert user
      await query(
        `INSERT INTO users (id, phone, role)
         VALUES ($1, $2, $3)
         ON CONFLICT (phone) DO UPDATE SET role = $3`,
        [u.id, u.phone, u.role]
      );

      // Check if user already has an active subscription
      const curSub = await query(
        `SELECT id FROM subscriptions WHERE user_id = $1 AND status = 'active'`,
        [u.id]
      );
      if (curSub.rows.length === 0) {
        await query(
          `INSERT INTO subscriptions (user_id, plan_id, plan_name, status, started_at, expires_at)
           VALUES ($1, $2, $3, 'active', $4, $5)`,
          [u.id, u.planId, u.planName, now, expiry]
        );
      }
    }
    console.log(`[Seed] Seeded ${INITIAL_USERS.length} demo users with assigned plans.`);

    console.log('[Seed] Database initialization complete!');
  } catch (error) {
    console.error('[Seed] Error seeding database:', error);
  }
};

if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  seedDatabase().then(() => pool.end());
}
