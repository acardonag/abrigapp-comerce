import { Router } from 'express';
import { db } from '../db';
import { businesses, categories, products } from '../db/schema';
import { eq, ilike, and, count } from 'drizzle-orm';
import { sendReportEmail } from '../services/email';

export const publicRouter = Router();

// Get global count of active businesses
publicRouter.get('/businesses/count', async (req, res) => {
  try {
    const result = await db.select({ value: count() })
      .from(businesses)
      .where(eq(businesses.isActive, true));
    res.json({ count: result[0]?.value || 0 });
  } catch (error) {
    console.error('Error counting businesses:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get public directory of businesses
publicRouter.get('/businesses', async (req, res) => {
  try {
    const { search, category, city, limit, offset } = req.query;

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
      instagramUrl: businesses.instagramUrl,
      tiktokUrl: businesses.tiktokUrl,
      websiteUrl: businesses.websiteUrl,
      category: categories.name,
    })
    .from(businesses)
    .leftJoin(categories, eq(businesses.categoryId, categories.id))
    .where(whereClause)
    .limit(limit ? parseInt(limit as string) : 50)
    .offset(offset ? parseInt(offset as string) : 0);

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
    res.status(500).json({ error: 'Internal server error' });
  }
});

publicRouter.post('/report', async (req, res) => {
  const { type, targetId, reason } = req.body;
  if (!type || !targetId || !reason) {
    res.status(400).json({ error: 'Faltan parámetros de reporte' });
    return;
  }

  try {
    let targetName = 'Desconocido';
    
    if (type === 'business') {
      const [business] = await db.select().from(businesses).where(eq(businesses.id, targetId));
      if (business) targetName = business.name;
    } else if (type === 'product') {
      const [product] = await db.select().from(products).where(eq(products.id, targetId));
      if (product) targetName = product.title;
    }

    await sendReportEmail(type, targetName, reason, targetId);
    res.json({ success: true, message: 'Reporte enviado' });
  } catch (error) {
    console.error('Report error:', error);
    res.status(500).json({ error: 'Error enviando reporte' });
  }
});
