-- DevPath Database Schema (PostgreSQL / Supabase)

CREATE TABLE IF NOT EXISTS users (
  id           SERIAL PRIMARY KEY,
  name         VARCHAR(100) NOT NULL,
  email        VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS roadmaps (
  id           SERIAL PRIMARY KEY,
  user_id      INT NOT NULL,
  title        VARCHAR(255) NOT NULL,
  technology   VARCHAR(255) NOT NULL,
  data         JSONB NOT NULL,
  share_token  VARCHAR(64) UNIQUE,
  is_public    BOOLEAN DEFAULT FALSE,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS progress (
  id         SERIAL PRIMARY KEY,
  roadmap_id INT NOT NULL,
  item_id    VARCHAR(100) NOT NULL,
  item_type  VARCHAR(10) NOT NULL CHECK (item_type IN ('step', 'project')),
  completed  BOOLEAN DEFAULT FALSE,
  notes      TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (roadmap_id, item_id),
  FOREIGN KEY (roadmap_id) REFERENCES roadmaps(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS quiz_results (
  id         SERIAL PRIMARY KEY,
  user_id    INT NOT NULL,
  roadmap_id INT NOT NULL,
  step_id    VARCHAR(100) NOT NULL,
  score      INT NOT NULL,
  total      INT NOT NULL DEFAULT 5,
  passed     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
  FOREIGN KEY (roadmap_id) REFERENCES roadmaps(id) ON DELETE CASCADE
);

-- Auto-update updated_at on roadmaps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER roadmaps_updated_at
  BEFORE UPDATE ON roadmaps
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER progress_updated_at
  BEFORE UPDATE ON progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();