-- Drop the existing supplier-only insert policy
DROP POLICY "Suppliers can insert own listings" ON public.surplus_listings;

-- Allow anyone (including anonymous) to insert listings
CREATE POLICY "Anyone can insert listings"
ON public.surplus_listings
FOR INSERT
TO public
WITH CHECK (true);