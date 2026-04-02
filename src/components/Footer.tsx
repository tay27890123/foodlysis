import { Leaf } from "lucide-react";

const Footer = () => (
  <footer className="border-t border-border py-12 bg-muted/20">
    <div className="container flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        <Leaf className="h-5 w-5 text-primary" />
         <span className="font-display font-bold">Foodlysis</span>
       </div>
       <p className="text-sm text-muted-foreground">
         © 2026 Foodlysis Sdn Bhd. Reducing food waste across Malaysia.
      </p>
    </div>
  </footer>
);

export default Footer;
