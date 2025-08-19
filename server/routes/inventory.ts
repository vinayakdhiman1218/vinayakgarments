import { Request, Response, Router } from 'express';
import { storage } from '../storage';
import { isAuthenticated } from '../auth';
import { InsertInventoryLog } from '@shared/schema';

const router = Router();

// Get inventory logs with optional product filtering
router.get('/logs', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const productId = req.query.productId ? Number(req.query.productId) : undefined;
    const logs = await storage.getInventoryLogs(productId);
    res.json({ logs });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new inventory log
router.post('/logs', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const logData: InsertInventoryLog = {
      productId: Number(req.body.productId),
      quantity: Number(req.body.quantity),
      type: req.body.type,
      note: req.body.note || null
    };

    const newLog = await storage.createInventoryLog(logData);
    res.status(201).json({ log: newLog });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update product stock
router.put('/stock/:productId', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const productId = Number(req.params.productId);
    const { quantity } = req.body;
    
    if (isNaN(quantity)) {
      return res.status(400).json({ error: 'Quantity must be a number' });
    }

    const updatedProduct = await storage.updateProductStock(productId, Number(quantity));
    res.json({ product: updatedProduct });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get low stock products
router.get('/low-stock', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const threshold = req.query.threshold ? Number(req.query.threshold) : undefined;
    const products = await storage.getLowStockProducts(threshold);
    res.json({ products });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;