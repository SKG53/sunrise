-- Newsletter signup capture (footer "Stay in the Know" form).
-- Public-facing capture: anyone can insert their email; nobody can read
-- the list except via service role (admin tooling).
CREATE TABLE public.newsletter_subscribers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  source TEXT NOT NULL DEFAULT 'footer',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_newsletter_subscribers_email ON public.newsletter_subscribers (lower(email));

ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Allow anonymous + authenticated visitors to subscribe (insert only).
CREATE POLICY "Anyone can subscribe to newsletter"
  ON public.newsletter_subscribers
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- No SELECT/UPDATE/DELETE policies — only service role can read the list.
