import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import ProductCard from "@/components/product-card";
import { Button } from "@/components/ui/button";
import { type Product } from "@shared/schema";

const categories = ["All", "Formal Wear", "Casual Wear", "Traditional Wear", "Accessories"];

export default function Products() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  
  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products", selectedCategory],
    queryFn: async () => {
      const endpoint = selectedCategory === "All" 
        ? "/api/products"
        : `/api/products/category/${encodeURIComponent(selectedCategory)}`;
      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error("Failed to fetch products");
      }
      return response.json();
    }
  });

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="relative mb-12">
        <img
          src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80"
          alt="Clothing Collection"
          className="w-full h-64 object-cover rounded-xl shadow-lg mb-6"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent rounded-xl flex items-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white ml-8">Our Products</h1>
        </div>
      </div>
      
      <div className="mb-8 flex flex-wrap gap-2">
        {categories.map((category) => (
          <Button
            key={category}
            variant={selectedCategory === category ? "default" : "outline"}
            onClick={() => setSelectedCategory(category)}
          >
            {category}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse bg-gray-200 aspect-square rounded-lg" />
          ))}
        </div>
      ) : !products?.length ? (
        <div className="text-center py-12">
          <p className="text-gray-600">No products found in this category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
