import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, Leaf, TrendingUp, Package, Users, Scale } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const stats = [
  { label: "Food Waste Prevented", value: "1,247", unit: "tonnes", icon: Scale, trend: "+12.3% this month" },
  { label: "Active Transactions", value: "89", unit: "deals", icon: Package, trend: "+8 this week" },
  { label: "Businesses Connected", value: "156", unit: "partners", icon: Users, trend: "+14 new" },
  { label: "CO₂ Saved", value: "3,118", unit: "tonnes", icon: Leaf, trend: "+9.7% this month" },
];

const transactions = [
  { id: "TXN-001", buyer: "AEON Big", supplier: "Cameron Agro Sdn Bhd", product: "Cherry Tomatoes", weight: "12.5 MT", value: "RM 43,750", status: "in-transit" },
  { id: "TXN-002", buyer: "Mydin Mohamed", supplier: "Kelantan Fresh Co", product: "Spinach", weight: "8.0 MT", value: "RM 16,000", status: "confirmed" },
  { id: "TXN-003", buyer: "99 Speedmart", supplier: "Sabah Harvest", product: "Pineapple", weight: "20.0 MT", value: "RM 70,000", status: "in-transit" },
  { id: "TXN-004", buyer: "Giant Hypermarket", supplier: "Perak Greens", product: "Kangkung", weight: "5.0 MT", value: "RM 7,500", status: "delivered" },
  { id: "TXN-005", buyer: "Lotus's", supplier: "Johor Agri Farm", product: "Durian (Musang King)", weight: "3.0 MT", value: "RM 180,000", status: "confirmed" },
  { id: "TXN-006", buyer: "AEON Big", supplier: "Pahang Valley Farms", product: "Sweet Corn", weight: "15.0 MT", value: "RM 37,500", status: "pending" },
  { id: "TXN-007", buyer: "Mydin Mohamed", supplier: "Cameron Agro Sdn Bhd", product: "Lettuce", weight: "6.0 MT", value: "RM 18,000", status: "delivered" },
  { id: "TXN-008", buyer: "Village Grocer", supplier: "Sabah Harvest", product: "Banana (Cavendish)", weight: "10.0 MT", value: "RM 25,000", status: "in-transit" },
];

const statusStyles: Record<string, string> = {
  "confirmed": "bg-primary/20 text-primary border-primary/30",
  "in-transit": "bg-secondary/20 text-secondary-foreground border-secondary/30",
  "delivered": "bg-accent text-accent-foreground border-border",
  "pending": "bg-muted text-muted-foreground border-border",
};

const Admin = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm">Back</span>
            </Link>
            <div className="h-6 w-px bg-border" />
            <h1 className="font-display text-lg font-bold">Admin Dashboard</h1>
          </div>
          <Badge variant="outline" className="border-primary/30 text-primary">
            <Leaf className="h-3 w-3 mr-1" /> Foodlysis Admin
          </Badge>
        </div>
      </header>

      <main className="container py-8 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <Card className="border-border/50 bg-card/80">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                      <p className="text-3xl font-display font-bold mt-1">
                        {stat.value}
                        <span className="text-sm font-normal text-muted-foreground ml-1">{stat.unit}</span>
                      </p>
                    </div>
                    <div className="p-2 rounded-lg bg-primary/10">
                      <stat.icon className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                  <p className="text-xs text-primary mt-2 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" /> {stat.trend}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Transactions Table */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <Card className="border-border/50 bg-card/80">
            <CardHeader>
              <CardTitle className="text-lg font-display">Active Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50">
                    <TableHead>ID</TableHead>
                    <TableHead>Buyer</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Weight</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((tx) => (
                    <TableRow key={tx.id} className="border-border/30">
                      <TableCell className="font-mono text-xs text-muted-foreground">{tx.id}</TableCell>
                      <TableCell className="font-medium">{tx.buyer}</TableCell>
                      <TableCell>{tx.supplier}</TableCell>
                      <TableCell>{tx.product}</TableCell>
                      <TableCell>{tx.weight}</TableCell>
                      <TableCell className="font-medium">{tx.value}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusStyles[tx.status]}>
                          {tx.status}
                        </Badge>
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
};

export default Admin;
