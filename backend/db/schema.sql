CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT uuidv7(),
  username varchar(50) NOT NULL UNIQUE,
  password_hash varchar(100) NOT NULL,
  full_name varchar(100) NOT NULL,
  role varchar(20) NOT NULL CHECK (
      role IN (
          'admin',
          'technician',
          'reporter'
      )
  ),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT uuidv7(),
  name varchar(50) NOT NULL UNIQUE,
  image_path varchar(255)
);

CREATE TABLE IF NOT EXISTS tickets (
  id uuid PRIMARY KEY DEFAULT uuidv7(),
  title varchar(150) NOT NULL,
  description text NOT NULL,
  location varchar(100) NOT NULL,
  status varchar(20) NOT NULL DEFAULT 'new' CHECK (
    status IN (
        'new',
        'assigned',
        'in_progress',
        'done',
        'cancelled'
    )
  ),
  category_id uuid NOT NULL REFERENCES categories (id) ON DELETE RESTRICT,
  reporter_id uuid NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
  technician_id uuid REFERENCES users (id) ON DELETE RESTRICT,
  repair_cost numeric(10, 2) CHECK (repair_cost >= 0),
  report_attachment_path varchar(255),
  repair_image_path varchar(255),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

CREATE INDEX ON tickets (status);

CREATE INDEX ON tickets (reporter_id);

CREATE INDEX ON tickets (technician_id);

CREATE INDEX ON tickets (category_id);

CREATE TABLE IF NOT EXISTS ticket_logs (
  id uuid PRIMARY KEY DEFAULT uuidv7(),
  ticket_id uuid NOT NULL REFERENCES tickets (id) ON DELETE CASCADE,
  actor_id uuid NOT NULL REFERENCES users (id),
  from_status varchar(20),
  to_status varchar(20) NOT NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);