import { Router } from 'express';
import { db } from '../db';
import { businesses, categories, products } from '../db/schema';
import { eq, ilike, and } from 'drizzle-orm';

export const publicRouter = Router();

// Get public directory of businesses
publicRouter.get('/businesses', async (req, res) => {
  try {
    const { search, category, city } = req.query;

    let conditions = [];
    conditions.push(eq(businesses.isActive, true));

    if (search && typeof search === 'string') {
      conditions.push(ilike(businesses.name, `%${search}%`));
    }
    if (category && typeof category === 'string') {
      conditions.push(eq(businesses.categoryId, category));
    }
    if (city && typeof city === 'string') {
      conditions.push(ilike(businesses.city, `%${city}%`));
    }

    const whereClause = and(...conditions);

    const result = await db.select({
      id: businesses.id,
      name: businesses.name,
      slug: businesses.slug,
      city: businesses.city,
      logoUrl: businesses.logoUrl,
      whatsappNumber: businesses.whatsappNumber,
      category: categories.name,
    })
    .from(businesses)
    .leftJoin(categories, eq(businesses.categoryId, categories.id))
    .where(whereClause);

    res.json(result);
  } catch (error) {
    console.error('Error fetching businesses:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get public categories
publicRouter.get('/categories', async (req, res) => {
  try {
    const result = await db.select().from(categories);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get store by slug (including products)
publicRouter.get('/store/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const [business] = await db.select().from(businesses).where(eq(businesses.slug, slug));
    
    if (!business || !business.isActive) {
      res.status(404).json({ error: 'Tienda no encontrada' });
      return;
    }

    const businessProducts = await db.select().from(products)
      .where(and(eq(products.businessId, business.id), eq(products.isAvailable, true)));

    res.json({
      ...business,
      products: businessProducts
    });
  } catch (error) {
    console.error('Error fetching store:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
