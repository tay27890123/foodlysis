import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, Leaf, TrendingUp, Package, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const stats = [
  { label: "Food Waste Prevented", value: "1,247", unit: "tonnes", icon: Leaf, trend: "+12.3%" },
  { label: "Active Transactions", value: "86", unit: "deals", icon: Package, trend: "+8.1%" },
  { label: "Connected Businesses", value: "214", unit: "partners", icon: Users, trend: "+5.7%" },
];

const transactions = [
  { id: "TX-0041", supplier: "Cameron Agro Sdn Bhd", buyer: "AEON Big", product: "Tomatoes", weight: "12.5 MT", value: "RM 31,250", status: "In Transit" },
  { id: "TX-0040", supplier: "FreshKL Farm", buyer: "Mydin Wholesale", product: "Spinach", weight: "8.0 MT", value: "RM 16,000", status: "Confirmed" },
  { id: "TX-0039", supplier: "Sabah Harvest Co", buyer: "99 Speedmart", product: "Bananas", weight: "20.0 MT", value: "RM 44,000", status: "In Transit" },
  { id: "TX-0038", supplier: "Perak Greens", buyer: "Lotus's", product: "Cabbage", weight: "15.0 MT", value: "RM 22,500", status: "Pending" },
  { id: "TX-0037", supplier: "Johor Spice Ltd", buyer: "AEON Big", product: "Chillies", weight: "5.5 MT", value: "RM 27,500", status: "Confirmed" },
  { id: "TX-0036", supplier: "Cameron Agro Sdn Bhd", buyer: "Giant", product: "Lettuce", weight: "9.0 MT", value: "RM 18,000", status: "Delivered" },
  { id: "TX-0035", supplier: "KL Urban Farm", buyer: "Village Grocer", product: "Herbs Mix", weight: "2.0 MT", value: "RM 12,000", status: "Confirmed" },
];

const statusColor: Record<string, string> = {
  "In Transit": "bg-secondary/20 text-secondary border-secondary/30",
  Confirmed: "bg-primary/20 text-primary border-primary/30",
  Pending: "bg-muted text-muted-foreground border-border",
  Delivered: "bg-accent text-accent-foreground border-accent-foreground/20",
};

const Admin = () => (
  <div className="min-h-screen bg-background">
    <header className="border-b border-border/50 bg-background/80 backdrop-blur-xl sticky top-0 z-40">
      <div className="container flex h-14 items-center gap-4">
        <Link to="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="font-display text-lg font-semibold">Admin Dashboard</h1>
      </div>
    </header>

    <main className="container py-8 space-y-8">
      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card className="glass-card border-border/30">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
                <s.icon className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold font-display">{s.value} <span className="text-base font-normal text-muted-foreground">{s.unit}</span></div>
                <p className="mt-1 flex items-center gap-1 text-xs text-primary">
                  <TrendingUp className="h-3 w-3" /> {s.trend} this month
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Transactions Table */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
        <Card className="glass-card border-border/30">
          <CardHeader>
            <CardTitle className="text-lg font-display">Active Transactions</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-border/30 hover:bg-transparent">
                  <TableHead>ID</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Buyer</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Weight</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx) => (
                  <TableRow key={tx.id} className="border-border/20">
                    <TableCell className="font-mono text-xs text-muted-foreground">{tx.id}</TableCell>
                    <TableCell>{tx.supplier}</TableCell>
                    <TableCell>{tx.buyer}</TableCell>
                    <TableCell>{tx.product}</TableCell>
                    <TableCell className="text-right">{tx.weight}</TableCell>
                    <TableCell className="text-right font-medium">{tx.value}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusColor[tx.status]}>{tx.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>
    </main>
  </div>
);

export default Admin;
