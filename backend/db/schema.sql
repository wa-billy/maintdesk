DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'technician', 'reporter');
EXCEPTION WHEN duplicate_object THEN null; END $$;
