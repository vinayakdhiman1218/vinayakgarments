import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ProductForm from "@/components/product-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export default function Products() {
  const [, navigate] = useLocation();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const queryClient = useQueryClient();

  const createProduct = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error("Failed to create product");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setIsAddOpen(false);
    }
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Products</h1>
        <div className="space-x-4">
          <Button onClick={() => setIsAddOpen(true)} variant="default">
            Add Product
          </Button>
          <Button onClick={() => navigate("/admin/inventory")} variant="outline">
            Go to Inventory
          </Button>
        </div>
      </div>

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Product</DialogTitle>
          </DialogHeader>
          <ProductForm onSubmit={(data) => createProduct.mutate(data)} />
        </DialogContent>
      </Dialog>

      {/* Rest of your products page code */}
    </div>
  );
}