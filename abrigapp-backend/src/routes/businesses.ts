import { Router, Response } from 'express';
import { db } from '../db';
import { businesses } from '../db/schema';
import { authenticate, AuthRequest } from '../middlewares/auth';
import { eq } from 'drizzle-orm';

export const businessRouter = Router();

// Middleware to ensure user is authenticated
businessRouter.use(authenticate);

businessRouter.get('/my-business', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const [business] = await db.select().from(businesses).where(eq(businesses.userId, userId));
    
    if (!business) {
      res.status(404).json({ error: 'Business not found' });
      return;
    }
    
    res.json(business);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

businessRouter.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { name, description, city, categoryId, whatsappNumber, logoUrl, instagramUrl, tiktokUrl, websiteUrl } = req.body;
    
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    const [existing] = await db.select().from(businesses).where(eq(businesses.userId, userId));
    if (existing) {
      res.status(400).json({ error: 'User already has a business' });
      return;
    }

    const [newBusiness] = await db.insert(businesses).values({
      userId,
      name,
      slug,
      description,
      city,
      categoryId,
      whatsappNumber,
      logoUrl,
      instagramUrl,
      tiktokUrl,
      websiteUrl,
    }).returning();

    res.json(newBusiness);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

businessRouter.put('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { name, description, city, categoryId, whatsappNumber, logoUrl, instagramUrl, tiktokUrl, websiteUrl, isActive } = req.body;
    
    let slug;
    if (name) {
      slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    }

    const [updated] = await db.update(businesses).set({
      name,
      slug,
      description,
      city,
      categoryId,
      whatsappNumber,
      logoUrl,
      instagramUrl,
      tiktokUrl,
      websiteUrl,
      isActive,
      updatedAt: new Date()
    }).where(eq(businesses.userId, userId)).returning();

    if (!updated) {
      res.status(404).json({ error: 'Business not found' });
      return;
    }

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});
