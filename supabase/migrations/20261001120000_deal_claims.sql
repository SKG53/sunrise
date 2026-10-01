-- Deal-claim log (Spin & Save popup + ad popup). One row per claim; append-only
-- history that lives alongside the Klaviyo "Claimed Deal" event. Public-facing
-- capture: anyone can insert; nobody can read except via service role.
-- Temporary — removed when Supabase is retired (see brief "Out of scope").
CREATE TABLE public.deal_claims (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  deal_code TEXT,
  deals_offered TEXT,
  popup_type TEXT,
  capture_page TEXT,
  ad_variant TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_deal_claims_email ON public.deal_claims (lower(email));
CREATE INDEX idx_deal_claims_created_at ON public.deal_claims (created_at);

ALTER TABLE public.deal_claims ENABLE ROW LEVEL SECURITY;

-- Allow anonymous + authenticated visitors to log a claim (insert only).
CREATE POLICY "Anyone can log a deal claim"
  ON public.deal_claims
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- No SELECT/UPDATE/DELETE policies — only service role can read the log.
