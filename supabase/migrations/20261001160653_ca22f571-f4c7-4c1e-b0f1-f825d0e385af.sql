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

GRANT INSERT ON public.deal_claims TO anon, authenticated;
GRANT ALL ON public.deal_claims TO service_role;

ALTER TABLE public.deal_claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can log a deal claim"
  ON public.deal_claims
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);