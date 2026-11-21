-- StreamBox Database Schema for PostgreSQL

CREATE TABLE IF NOT EXISTS plans (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  price VARCHAR(50) NOT NULL,
  period VARCHAR(50) NOT NULL,
  duration VARCHAR(100),
  screens VARCHAR(150),
  quality VARCHAR(150),
  downloads VARCHAR(100),
  recommended BOOLEAN DEFAULT false,
  description TEXT
);

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(100),
  phone VARCHAR(10) UNIQUE NOT NULL CHECK (phone ~ '^[0-9]{10}$'),
  role VARCHAR(20) DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Ensure existing database column is updated to 10 characters and name exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'phone' AND character_maximum_length != 10
  ) THEN
    ALTER TABLE users ALTER COLUMN phone TYPE VARCHAR(10);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'name'
  ) THEN
    ALTER TABLE users ADD COLUMN name VARCHAR(100);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS movies (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  year INT,
  duration VARCHAR(50),
  rating VARCHAR(20),
  plan_required VARCHAR(50) DEFAULT 'mobile',
  genres TEXT[] DEFAULT '{}',
  description TEXT,
  cast_members TEXT[] DEFAULT '{}',
  poster TEXT,
  backdrop TEXT,
  hls_path TEXT,
  stream_url TEXT,
  status VARCHAR(50) DEFAULT 'ready',
  progress INT DEFAULT 0,
  last_position INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  plan_id VARCHAR(50) REFERENCES plans(id) ON DELETE SET NULL,
  plan_name VARCHAR(100),
  status VARCHAR(50) DEFAULT 'active',
  started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS watch_progress (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  movie_id VARCHAR(64) REFERENCES movies(id) ON DELETE CASCADE,
  position INT DEFAULT 0,
  duration INT DEFAULT 0,
  percent INT DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_user_movie UNIQUE (user_id, movie_id)
);

CREATE INDEX IF NOT EXISTS idx_movies_status ON movies(status);
CREATE INDEX IF NOT EXISTS idx_movies_plan ON movies(plan_required);
CREATE INDEX IF NOT EXISTS idx_watch_progress_user ON watch_progress(user_id);
