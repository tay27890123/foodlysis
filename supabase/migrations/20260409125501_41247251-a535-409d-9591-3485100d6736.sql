
ALTER TABLE public.surplus_listings
  ADD COLUMN IF NOT EXISTS image_url text,
  ADD COLUMN IF NOT EXISTS expiry_date date;
