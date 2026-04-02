import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Leaf, Menu, X, ShoppingBag, Database, ChevronDown, ArrowLeft } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface DropdownItem {
  label: string;
  to: string;
}

const marketItems: DropdownItem[] = [
  { label: "Marketplace", to: "/match" },
  { label: "Market", to: "/dashboard" },
];

const dataItems: DropdownItem[] = [
  { label: "Food Map", to: "/food-map" },
  { label: "Smart Route", to: "/logistics" },
  { label: "Insights", to: "/insights" },
];

const NavDropdown = ({ label, icon: Icon, items }: { label: string; icon: React.ElementType; items: DropdownItem[] }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <Button
        variant="outline"
        size="sm"
        className="gap-2"
        onClick={() => setOpen(!open)}
      >
        <Icon className="h-4 w-4" />
        {label}
        <ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </Button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full right-0 mt-2 w-48 rounded-lg border border-border/50 bg-background/95 backdrop-blur-xl shadow-lg overflow-hidden z-50"
          >
            {items.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="block px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const isLanding = location.pathname === "/";

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-3">
          {!isLanding && (
            <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
          )}
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary glow-primary">
              <Leaf className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-bold tracking-tight">
              Food<span className="text-primary">lysis</span>
            </span>
          </Link>
        </div>

        <div className="hidden md:flex items-center gap-3">
          <NavDropdown label="Global Market" icon={ShoppingBag} items={marketItems} />
          <NavDropdown label="Data Center" icon={Database} items={dataItems} />
        </div>

        <button className="md:hidden text-foreground" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-border bg-background/95 backdrop-blur-xl"
          >
            <div className="container flex flex-col gap-1 py-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest px-3 py-2">Global Market</p>
              {marketItems.map((item) => (
                <Link key={item.to} to={item.to} onClick={() => setMobileOpen(false)}
                  className="px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors">
                  {item.label}
                </Link>
              ))}
              <div className="border-t border-border/50 my-2" />
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest px-3 py-2">Data Center</p>
              {dataItems.map((item) => (
                <Link key={item.to} to={item.to} onClick={() => setMobileOpen(false)}
                  className="px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors">
                  {item.label}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
