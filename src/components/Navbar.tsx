import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Leaf, Menu, X } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary glow-primary">
            <Leaf className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-display text-xl font-bold tracking-tight">
            Pangan<span className="text-primary">Link</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-6">
          <Link to="/match">
            <Button variant="outline" size="sm">Marketplace</Button>
          </Link>
          <Link to="/dashboard">
            <Button variant="outline" size="sm">Market</Button>
          </Link>
          <Link to="/insights">
            <Button variant="outline" size="sm">Insights</Button>
          </Link>
          <Link to="/food-map">
            <Button variant="outline" size="sm">Food Map</Button>
          </Link>
          <Link to="/logistics">
            <Button size="sm">Logistics</Button>
          </Link>
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
            <div className="container flex flex-col gap-4 py-6">
              <Link to="/match" onClick={() => setMobileOpen(false)}>
                <Button variant="outline" className="w-full" size="sm">Marketplace</Button>
              </Link>
              <Link to="/dashboard" onClick={() => setMobileOpen(false)}>
                <Button variant="outline" className="w-full" size="sm">Market</Button>
              </Link>
              <Link to="/insights" onClick={() => setMobileOpen(false)}>
                <Button variant="outline" className="w-full" size="sm">Insights</Button>
              </Link>
              <Link to="/food-map" onClick={() => setMobileOpen(false)}>
                <Button variant="outline" className="w-full" size="sm">Food Map</Button>
              </Link>
              <Link to="/logistics" onClick={() => setMobileOpen(false)}>
                <Button className="w-full" size="sm">Logistics</Button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
