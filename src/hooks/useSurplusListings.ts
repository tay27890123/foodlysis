import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SurplusListing {
  id: string;
  supplier_id: string;
  product_name: string;
  category: string;
  quantity_kg: number;
  original_price: number;
  discounted_price: number;
  urgency_level: "Low" | "Medium" | "High";
  status: string;
  created_at: string;
  profiles: {
    business_name: string;
    location_state: string;
  } | null;
}

export const useSurplusListings = () => {
  return useQuery({
    queryKey: ["surplus_listings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("surplus_listings")
        .select("*, profiles(business_name, location_state)")
        .eq("status", "Active")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as SurplusListing[];
    },
  });
};
