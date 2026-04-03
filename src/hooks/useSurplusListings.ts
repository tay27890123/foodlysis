import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

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
  location_lat: number | null;
  location_lng: number | null;
  location_label: string | null;
  transportation_available: boolean;
  profiles: {
    business_name: string;
    location_state: string;
  } | null;
}

export const useSurplusListings = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel("surplus_listings_realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "surplus_listings" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["surplus_listings"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return useQuery({
    queryKey: ["surplus_listings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("surplus_listings")
        .select("*")
        .eq("status", "Active")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data ?? []).map((d) => ({ ...d, profiles: null })) as SurplusListing[];
    },
  });
};
