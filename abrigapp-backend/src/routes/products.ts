import { Router, Response } from 'express';
import { db } from '../db';
import { products, businesses } from '../db/schema';
import { authenticate, AuthRequest } from '../middlewares/auth';
import { eq, and } from 'drizzle-orm';

export const productsRouter = Router();

productsRouter.use(authenticate);

// Helper to get user's business
const getUserBusiness = async (userId: string) => {
  const [business] = await db.select().from(businesses).where(eq(businesses.userId, userId));
  return business;
};

productsRouter.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const business = await getUserBusiness(req.user!.userId);
    if (!business) {
      res.status(404).json({ error: 'Business not found' });
      return;
    }

    const result = await db.select().from(products).where(eq(products.businessId, business.id));
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

productsRouter.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const business = await getUserBusiness(req.user!.userId);
    if (!business) {
      res.status(404).json({ error: 'Business not found' });
      return;
    }

    const { title, description, price, imageUrl, isAvailable } = req.body;

    const [newProduct] = await db.insert(products).values({
      businessId: business.id,
      title,
      description,
      price,
      imageUrl,
      isAvailable
    }).returning();

    res.json(newProduct);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

productsRouter.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const business = await getUserBusiness(req.user!.userId);
    if (!business) {
      res.status(404).json({ error: 'Business not found' });
      return;
    }

    const { title, description, price, imageUrl, isAvailable } = req.body;

    const [updated] = await db.update(products).set({
      title,
      description,
      price,
      imageUrl,
      isAvailable,
      updatedAt: new Date()
    })
      .where(and(eq(products.id, req.params.id as string), eq(products.businessId, business.id)))
    .returning();

    if (!updated) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

productsRouter.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const business = await getUserBusiness(req.user!.userId);
    if (!business) {
      res.status(404).json({ error: 'Business not found' });
      return;
    }

    const [deleted] = await db.delete(products)
        .where(and(eq(products.id, req.params.id as string), eq(products.businessId, business.id)))
      .returning();

    if (!deleted) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    res.json({ message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});
