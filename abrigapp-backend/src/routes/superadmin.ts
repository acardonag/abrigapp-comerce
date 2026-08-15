import { Router, Request, Response } from 'express';
import { db } from '../db';
import { businesses, products } from '../db/schema';
import { eq } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import { authenticateAdmin } from '../middlewares/auth';

export const superadminRouter = Router();

// Login
superadminRouter.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (email === 'augusto.cardona@hotmail.com' && password === 'Manizales1989') {
    const token = jwt.sign({ role: 'superadmin' }, process.env.JWT_SECRET || 'secret', { expiresIn: '12h' });
    res.json({ token });
  } else {
    res.status(401).json({ error: 'Credenciales inválidas' });
  }
});

superadminRouter.use(authenticateAdmin);

// List all businesses
superadminRouter.get('/businesses', async (req: Request, res: Response) => {
  try {
    const allBusinesses = await db.select().from(businesses);
    res.json(allBusinesses);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching businesses' });
  }
});

// Delete a business (and its products by cascade or manually)
superadminRouter.delete('/business/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    // First delete products of this business
    await db.delete(products).where(eq(products.businessId, id as string));
    // Then delete business
    const [deleted] = await db.delete(businesses).where(eq(businesses.id, id as string)).returning();
    if (!deleted) {
      res.status(404).json({ error: 'Business not found' });
      return;
    }
    res.json({ message: 'Business deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting business' });
  }
});

// List all products
superadminRouter.get('/products', async (req: Request, res: Response) => {
  try {
    const allProducts = await db.select().from(products);
    res.json(allProducts);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching products' });
  }
});

// Delete a product
superadminRouter.delete('/product/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const [deleted] = await db.delete(products).where(eq(products.id, id as string)).returning();
    if (!deleted) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting product' });
  }
});
