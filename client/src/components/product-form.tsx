
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { categories } from "@/lib/constants";

export default function ProductForm({ onSubmit }: { onSubmit: (data: any) => void }) {
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    purchasePrice: "",
    price: "",
    stock: "",
    tax: "",
    unit: "",
    barcode: "",
    description: "",
    imageUrl: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      purchasePrice: parseInt(formData.purchasePrice) * 100,
      price: parseInt(formData.price) * 100,
      stock: parseInt(formData.stock),
      tax: formData.tax ? parseInt(formData.tax) : 0
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Product Name</Label>
        <Input
          required
          value={formData.name}
          onChange={e => setFormData({...formData, name: e.target.value})}
        />
      </div>

      <div>
        <Label>Category</Label>
        <Select required value={formData.category} onValueChange={value => setFormData({...formData, category: value})}>
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {categories.filter(c => c !== "All").map(category => (
              <SelectItem key={category} value={category}>{category}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Purchase Price (₹)</Label>
          <Input
            required
            type="number"
            min="0"
            value={formData.purchasePrice}
            onChange={e => setFormData({...formData, purchasePrice: e.target.value})}
          />
        </div>
        <div>
          <Label>Selling Price (₹)</Label>
          <Input
            required
            type="number"
            min="0"
            value={formData.price}
            onChange={e => setFormData({...formData, price: e.target.value})}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Stock Quantity</Label>
          <Input
            required
            type="number"
            min="0"
            value={formData.stock}
            onChange={e => setFormData({...formData, stock: e.target.value})}
          />
        </div>
        <div>
          <Label>Tax & GST (%)</Label>
          <Input
            type="number"
            min="0"
            max="100"
            value={formData.tax}
            onChange={e => setFormData({...formData, tax: e.target.value})}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Unit</Label>
          <Input
            placeholder="e.g., Kg, Piece, Litre"
            value={formData.unit}
            onChange={e => setFormData({...formData, unit: e.target.value})}
          />
        </div>
        <div>
          <Label>Barcode</Label>
          <Input
            value={formData.barcode}
            onChange={e => setFormData({...formData, barcode: e.target.value})}
          />
        </div>
      </div>

      <div>
        <Label>Image URL</Label>
        <Input
          required
          type="url"
          value={formData.imageUrl}
          onChange={e => setFormData({...formData, imageUrl: e.target.value})}
        />
      </div>

      <div>
        <Label>Description</Label>
        <Textarea
          value={formData.description}
          onChange={e => setFormData({...formData, description: e.target.value})}
        />
      </div>

      <Button type="submit" className="w-full">Add Product</Button>
    </form>
  );
}
