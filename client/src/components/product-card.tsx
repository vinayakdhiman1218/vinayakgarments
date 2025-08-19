import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { type Product } from "@shared/schema";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  return (
    <Card className="overflow-hidden">
      <div className="aspect-square relative">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="object-cover w-full h-full"
        />
      </div>
      <CardContent className="p-4">
        <h3 className="text-lg font-semibold">{product.name}</h3>
        <p className="text-gray-600 mt-2">{product.description}</p>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex items-center justify-between">
        <span className="text-lg font-bold">
          ₹{(product.price / 100).toFixed(2)}
        </span>
        <button className="bg-primary text-white px-4 py-2 rounded hover:bg-primary/90">
          View Details
        </button>
      </CardFooter>
    </Card>
  );
}
