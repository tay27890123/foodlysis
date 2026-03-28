
-- Profiles table
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name text NOT NULL,
  role text NOT NULL CHECK (role IN ('supplier', 'buyer')),
  location_state text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view profiles"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Surplus listings table
CREATE TABLE public.surplus_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_name text NOT NULL,
  category text NOT NULL CHECK (category IN ('Vegetables', 'Fruits', 'Grains', 'Seafood', 'Poultry', 'Dairy', 'Other')),
  quantity_kg numeric NOT NULL,
  original_price numeric NOT NULL,
  discounted_price numeric NOT NULL,
  urgency_level text NOT NULL DEFAULT 'Low' CHECK (urgency_level IN ('Low', 'Medium', 'High')),
  status text NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Sold', 'Expired')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.surplus_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active listings"
  ON public.surplus_listings FOR SELECT
  USING (status = 'Active');

CREATE POLICY "Suppliers can insert own listings"
  ON public.surplus_listings FOR INSERT
  TO authenticated
  WITH CHECK (
    supplier_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'supplier'
    )
  );

CREATE POLICY "Suppliers can update own listings"
  ON public.surplus_listings FOR UPDATE
  TO authenticated
  USING (supplier_id = auth.uid())
  WITH CHECK (supplier_id = auth.uid());

-- Auto-create profile trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, business_name, role, location_state)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'business_name', 'My Business'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'buyer'),
    COALESCE(NEW.raw_user_meta_data->>'location_state', 'Kuala Lumpur')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
