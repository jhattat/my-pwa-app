CREATE TABLE test_errors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  test_name TEXT NOT NULL,
  error_message TEXT NOT NULL,
  fingerprint TEXT NOT NULL,
  is_known BOOLEAN DEFAULT FALSE,
  occurrences INTEGER DEFAULT 1,
  first_seen_at TIMESTAMPTZ DEFAULT now(),
  last_seen_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_fingerprint ON test_errors (fingerprint);
