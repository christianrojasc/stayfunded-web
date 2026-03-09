-- Support messages table for in-app customer support
CREATE TABLE IF NOT EXISTS public.support_messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id uuid NOT NULL,
  user_id uuid REFERENCES auth.users(id),
  user_email text,
  user_name text,
  role text NOT NULL CHECK (role IN ('user', 'admin')),
  message text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Tickets table to track conversation threads
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  user_email text,
  user_name text,
  subject text DEFAULT 'Support Request',
  status text DEFAULT 'open' CHECK (status IN ('open', 'closed', 'pending')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS policies
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- Users can read their own messages
CREATE POLICY "Users read own messages" ON public.support_messages
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own messages
CREATE POLICY "Users insert own messages" ON public.support_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id AND role = 'user');

-- Users can read their own tickets
CREATE POLICY "Users read own tickets" ON public.support_tickets
  FOR SELECT USING (auth.uid() = user_id);

-- Users can create tickets
CREATE POLICY "Users create tickets" ON public.support_tickets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Service role can do everything (for admin replies)
CREATE POLICY "Service role full access messages" ON public.support_messages
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access tickets" ON public.support_tickets
  FOR ALL USING (auth.role() = 'service_role');

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_support_messages_ticket ON public.support_messages(ticket_id, created_at);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user ON public.support_tickets(user_id, created_at DESC);
