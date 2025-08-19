import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { type Product, type InventoryLog } from "@shared/schema";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertCircle, Plus, Minus, Search, FileEdit, Package } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/queryClient";

export default function Inventory() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State for stock dialog
  const [stockDialogOpen, setStockDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [stockAmount, setStockAmount] = useState<number>(0);
  const [stockNote, setStockNote] = useState<string>("");
  
  // State for search
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filteredProducts, setFilteredProducts] = useState<Product[] | null>(null);

  // Check if user is logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/check");
        const data = await response.json();
        if (!data.user) {
          navigate("/");
          toast({
            title: "Access Denied",
            description: "Please log in to access inventory management.",
            variant: "destructive",
          });
        }
      } catch (error) {
        navigate("/");
      }
    };
    checkAuth();
  }, [navigate, toast]);

  // Fetch products with their stock information
  const { data: products, isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  // Fetch low stock products
  const { data: lowStockProducts, isLoading: lowStockLoading } = useQuery<Product[]>({
    queryKey: ["/api/inventory/low-stock"],
  });

  // Fetch recent inventory logs
  const { data: inventoryLogsData, isLoading: logsLoading } = useQuery<{ logs: InventoryLog[] }>({
    queryKey: ["/api/inventory/logs"],
  });
  const inventoryLogs = inventoryLogsData?.logs;
  
  // Filter products when search term changes
  useEffect(() => {
    if (products && searchTerm) {
      const filtered = products.filter((product) => {
        return (
          product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.category.toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
      setFilteredProducts(filtered);
    } else {
      setFilteredProducts(null);
    }
  }, [searchTerm, products]);
  
  // Stock update mutation
  const stockUpdateMutation = useMutation({
    mutationFn: async ({
      productId,
      quantity,
      note
    }: {
      productId: number;
      quantity: number;
      note: string;
    }) => {
      return await apiRequest("PUT", `/api/inventory/stock/${productId}`, { quantity, note });
    },
    onSuccess: () => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/low-stock"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/logs"] });
      
      toast({
        title: "Success",
        description: "Stock updated successfully",
      });
      
      // Reset and close dialog
      setStockDialogOpen(false);
      setSelectedProduct(null);
      setStockAmount(0);
      setStockNote("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update stock",
        variant: "destructive",
      });
    },
  });

  // Quick stock update for +1/-1 buttons
  const handleStockUpdate = async (productId: number, quantity: number) => {
    try {
      const response = await fetch(`/api/inventory/stock/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          quantity,
          note: quantity > 0 ? "Quick stock addition" : "Quick stock reduction" 
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update stock");
      }

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/low-stock"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/logs"] });

      toast({
        title: "Success",
        description: "Stock updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update stock",
        variant: "destructive",
      });
    }
  };

  if (productsLoading || lowStockLoading || logsLoading) {
    return <div className="p-8">Loading...</div>;
  }

  // Handle opening the stock dialog for a product
  const openStockDialog = (product: Product) => {
    setSelectedProduct(product);
    setStockAmount(0);
    setStockNote("");
    setStockDialogOpen(true);
  };
  
  // Submit stock adjustment
  const submitStockAdjustment = () => {
    if (!selectedProduct || stockAmount === 0) return;
    
    stockUpdateMutation.mutate({
      productId: selectedProduct.id,
      quantity: stockAmount,
      note: stockNote
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Inventory Management</h1>
      
      {/* Search bar */}
      <div className="mb-8 flex gap-2">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            type="search"
            placeholder="Search products..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" onClick={() => setSearchTerm("")}>
          Clear
        </Button>
      </div>

      {/* Low Stock Alerts */}
      {lowStockProducts && lowStockProducts.length > 0 && (
        <Card className="mb-8 border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-700">
              <AlertCircle className="h-5 w-5" />
              Low Stock Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {lowStockProducts.map((product) => (
                <div key={product.id} className="flex items-center justify-between">
                  <span>{product.name}: {product.stock} units left</span>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleStockUpdate(product.id, 10)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Restock
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Inventory */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Current Inventory</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Current Stock</TableHead>
                <TableHead>Min. Stock</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(filteredProducts || products)?.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>{product.name}</TableCell>
                  <TableCell>{product.category}</TableCell>
                  <TableCell>{product.stock}</TableCell>
                  <TableCell>{product.minStock}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleStockUpdate(product.id, -1)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleStockUpdate(product.id, 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openStockDialog(product)}
                        className="ml-2"
                      >
                        <Package className="h-4 w-4 mr-1" />
                        Adjust
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Inventory Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Note</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inventoryLogs?.map((log) => {
                const product = products?.find(p => p.id === log.productId);
                return (
                  <TableRow key={log.id}>
                    <TableCell>
                      {new Date(log.timestamp!).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{product?.name || `Product #${log.productId}`}</TableCell>
                    <TableCell className="capitalize">{log.type}</TableCell>
                    <TableCell>{log.quantity}</TableCell>
                    <TableCell>{log.note}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* Stock Adjustment Dialog */}
      <Dialog open={stockDialogOpen} onOpenChange={setStockDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Stock</DialogTitle>
          </DialogHeader>
          
          {selectedProduct && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-4">
                <p className="font-medium">Product:</p>
                <p>{selectedProduct.name}</p>
              </div>
              
              <div className="flex items-center gap-4">
                <p className="font-medium">Current Stock:</p>
                <p>{selectedProduct.stock} units</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="stockAmount">Adjustment Amount</Label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setStockAmount((prev) => prev - 1)}
                    disabled={stockAmount <= -100}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Input
                    id="stockAmount"
                    type="number"
                    value={stockAmount}
                    onChange={(e) => setStockAmount(parseInt(e.target.value) || 0)}
                    className="w-20 text-center"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setStockAmount((prev) => prev + 1)}
                    disabled={stockAmount >= 1000}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  {stockAmount > 0
                    ? `Adding ${stockAmount} units to stock`
                    : stockAmount < 0
                    ? `Removing ${Math.abs(stockAmount)} units from stock`
                    : 'No change'}
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="stockNote">Note</Label>
                <Input
                  id="stockNote"
                  placeholder="Reason for adjustment"
                  value={stockNote}
                  onChange={(e) => setStockNote(e.target.value)}
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setStockDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={submitStockAdjustment}
              disabled={stockAmount === 0 || stockUpdateMutation.isPending}
            >
              {stockUpdateMutation.isPending ? "Updating..." : "Update Stock"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}