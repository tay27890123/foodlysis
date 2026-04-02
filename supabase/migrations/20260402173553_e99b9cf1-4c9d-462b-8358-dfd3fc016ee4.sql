-- Drop the foreign key constraint so anonymous posts work
ALTER TABLE public.surplus_listings 
  ALTER COLUMN supplier_id SET DEFAULT '00000000-0000-0000-0000-000000000000',
  ALTER COLUMN supplier_id DROP NOT NULL;

-- Drop the FK constraint
ALTER TABLE public.surplus_listings 
  DROP CONSTRAINT IF EXISTS surplus_listings_supplier_id_fkey;