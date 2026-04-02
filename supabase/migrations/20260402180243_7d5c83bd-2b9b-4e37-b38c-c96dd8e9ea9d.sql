-- Allow anyone to delete listings (anonymous marketplace)
CREATE POLICY "Anyone can delete listings"
ON public.surplus_listings
FOR DELETE
TO public
USING (true);

-- Update the existing update policy to allow anyone (not just authenticated)
DROP POLICY IF EXISTS "Suppliers can update own listings" ON public.surplus_listings;
CREATE POLICY "Anyone can update listings"
ON public.surplus_listings
FOR UPDATE
TO public
USING (true)
WITH CHECK (true);