import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Leaf, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

const states = [
  "Johor", "Kedah", "Kelantan", "Melaka", "Negeri Sembilan",
  "Pahang", "Penang", "Perak", "Perlis", "Sabah", "Sarawak",
  "Selangor", "Terengganu", "Kuala Lumpur", "Putrajaya", "Labuan",
];

const Auth = () => {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [role, setRole] = useState<"supplier" | "buyer">("supplier");
  const [locationState, setLocationState] = useState("Kuala Lumpur");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              business_name: businessName,
              role,
              location_state: locationState,
            },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        toast.success("Check your email to confirm your account!");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back!");
        navigate("/dashboard");
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-6">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </Link>
        </div>

        <div className="glass-card p-8">
          <div className="flex items-center gap-2 mb-6">
            <Leaf className="h-6 w-6 text-primary" />
            <span className="font-display text-xl font-bold">Foodlysis</span>
          </div>

          <h1 className="font-display text-2xl font-bold mb-1">
            {isSignUp ? "Create Account" : "Welcome Back"}
          </h1>
          <p className="text-sm text-muted-foreground mb-6">
            {isSignUp ? "Join the B2B food surplus marketplace" : "Sign in to your account"}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Email</label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@company.com" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Password</label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" minLength={6} />
            </div>

            {isSignUp && (
              <>
                <div>
                  <label className="text-sm font-medium mb-1 block">Business Name</label>
                  <Input value={businessName} onChange={(e) => setBusinessName(e.target.value)} required placeholder="e.g. Cameron Highlands Farms" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">I am a</label>
                  <div className="flex gap-2">
                    <Button type="button" variant={role === "supplier" ? "default" : "outline"} size="sm" className="flex-1" onClick={() => setRole("supplier")}>
                      Supplier
                    </Button>
                    <Button type="button" variant={role === "buyer" ? "default" : "outline"} size="sm" className="flex-1" onClick={() => setRole("buyer")}>
                      Buyer
                    </Button>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">State</label>
                  <select
                    value={locationState}
                    onChange={(e) => setLocationState(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {states.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Please wait..." : isSignUp ? "Create Account" : "Sign In"}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-primary hover:underline"
            >
              {isSignUp ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
