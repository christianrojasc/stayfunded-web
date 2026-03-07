-- ============================================================
-- StayFunded Database Schema
-- Run this in your Supabase SQL Editor at:
--   https://supabase.com/dashboard → SQL Editor → New Query
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Profiles (extends Supabase Auth users) ───────────────────
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  timezone TEXT DEFAULT 'America/New_York',
  currency TEXT DEFAULT 'USD',
  default_contracts INTEGER DEFAULT 1,
  theme TEXT DEFAULT 'dark',
  sidebar_collapsed BOOLEAN DEFAULT false,
  auto_fees BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Fee schedules per user ───────────────────────────────────
CREATE TABLE fee_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  symbol TEXT NOT NULL,
  fee_per_side NUMERIC(10,2) DEFAULT 0,
  UNIQUE(user_id, symbol)
);

-- ── Prop accounts ────────────────────────────────────────────
CREATE TABLE prop_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  firm_name TEXT NOT NULL,
  nickname TEXT,
  account_number TEXT,
  starting_balance NUMERIC(12,2) NOT NULL,
  status TEXT DEFAULT 'evaluation' CHECK (status IN ('evaluation', 'funded')),
  daily_loss_limit NUMERIC(10,2),
  max_loss_limit NUMERIC(10,2) NOT NULL,
  drawdown_type TEXT DEFAULT 'static_eod' CHECK (drawdown_type IN ('static_eod', 'trailing', 'static_intraday', 'static')),
  profit_target NUMERIC(10,2),
  max_daily_trades INTEGER,
  min_trading_days INTEGER DEFAULT 0,
  consistency_rule TEXT,
  eval_cost NUMERIC(10,2),
  activation_fee NUMERIC(10,2),
  days_to_payout INTEGER,
  max_funded_accounts INTEGER,
  reset_fee NUMERIC(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Trades ───────────────────────────────────────────────────
CREATE TABLE trades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  account_id UUID REFERENCES prop_accounts(id) ON DELETE SET NULL,
  date TEXT NOT NULL,
  session_date TEXT NOT NULL,
  symbol TEXT NOT NULL,
  side TEXT NOT NULL CHECK (side IN ('Long', 'Short')),
  contracts INTEGER NOT NULL DEFAULT 1,
  entry_price NUMERIC(12,4) NOT NULL,
  exit_price NUMERIC(12,4) NOT NULL,
  pnl NUMERIC(12,2) NOT NULL DEFAULT 0,
  fees NUMERIC(10,2) NOT NULL DEFAULT 0,
  net_pnl NUMERIC(12,2) NOT NULL DEFAULT 0,
  setup TEXT,
  notes TEXT,
  tags TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'closed' CHECK (status IN ('open', 'closed')),
  entry_time TEXT,
  exit_time TEXT,
  stop_loss NUMERIC(12,4),
  take_profit NUMERIC(12,4),
  order_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Daily notes / journal ────────────────────────────────────
CREATE TABLE daily_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date TEXT NOT NULL,
  session_date TEXT NOT NULL,
  title TEXT,
  content TEXT,
  mood TEXT CHECK (mood IN ('great', 'good', 'neutral', 'bad', 'terrible')),
  market_bias TEXT CHECK (market_bias IN ('bullish', 'bearish', 'neutral')),
  pre_market TEXT,
  post_market TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Daily checklists ─────────────────────────────────────────
CREATE TABLE daily_checklists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  session_date TEXT NOT NULL,
  items JSONB NOT NULL DEFAULT '[]',
  readiness INTEGER DEFAULT 3,
  saved_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, session_date)
);

-- ── Indexes ──────────────────────────────────────────────────
CREATE INDEX idx_trades_user ON trades(user_id);
CREATE INDEX idx_trades_account ON trades(account_id);
CREATE INDEX idx_trades_session_date ON trades(user_id, session_date);
CREATE INDEX idx_trades_order_id ON trades(user_id, order_id);
CREATE INDEX idx_prop_accounts_user ON prop_accounts(user_id);
CREATE INDEX idx_daily_notes_user ON daily_notes(user_id, session_date);

-- ── Row Level Security ───────────────────────────────────────
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE prop_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_checklists ENABLE ROW LEVEL SECURITY;

-- ── RLS Policies (users can only access their own data) ──────
CREATE POLICY "Users can view own profile"   ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users manage own fees"       ON fee_schedules     FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own accounts"   ON prop_accounts     FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own trades"     ON trades            FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own notes"      ON daily_notes       FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own checklists" ON daily_checklists  FOR ALL USING (auth.uid() = user_id);

-- ── Auto-create profile on signup ────────────────────────────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
