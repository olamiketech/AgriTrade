-- 001_add_finance_requests.sql
-- Note: This is an illustrative SQL based on the prompt. The application uses Prisma (ORM) which manages schema via prisma/schema.prisma.

-- Create Enum (if using Postgres, for SQLite it uses Check Constraints or String)
-- CREATE TYPE finance_request_status AS ENUM ('draft','submitted','under_review','referred','financed','declined','needs_info');

CREATE TABLE finance_requests (
  id TEXT PRIMARY KEY, -- uuid
  trade_id TEXT REFERENCES trade_deals(id) NOT NULL,
  exporter_id TEXT REFERENCES users(id) NOT NULL,
  amount_requested REAL,
  currency TEXT,
  purpose TEXT,
  supporting_docs TEXT, -- JSON string
  status TEXT NOT NULL DEFAULT 'SUBMITTED',
  admin_notes TEXT,
  partner_ref_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE finance_referrals_log (
  id TEXT PRIMARY KEY, -- uuid
  finance_request_id TEXT REFERENCES finance_requests(id) NOT NULL,
  action TEXT NOT NULL,
  payload TEXT, -- JSON string
  actor_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_finance_requests_trade_id ON finance_requests(trade_id);
CREATE INDEX idx_finance_requests_exporter_id ON finance_requests(exporter_id);
CREATE INDEX idx_finance_requests_status ON finance_requests(status);
