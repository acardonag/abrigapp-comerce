import { Router, Request, Response } from 'express';
import { db } from '../db';
import { supportCases } from '../db/schema';
import { eq, and, desc } from 'drizzle-orm';
import crypto from 'crypto';
import { sendSupportVerificationEmail } from '../services/email'; // We will create this

export const supportRouter = Router();

// Apply for support
supportRouter.post('/apply', async (req: Request, res: Response) => {
  try {
    const { name, email, phone, city, description } = req.body;
    
    if (!name || !email || !phone || !city || !description) {
      res.status(400).json({ error: 'Todos los campos son requeridos' });
      return;
    }

    const magicToken = crypto.randomBytes(32).toString('hex');

    await db.insert(supportCases).values({
      name,
      email,
      phone,
      city,
      description,
      status: 'Aplicado',
      magicToken,
      isEmailVerified: false
    });

    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-support.html?token=${magicToken}`;
    await sendSupportVerificationEmail(email, name, verificationUrl);

    res.json({ message: 'Aplicación recibida. Revisa tu correo para verificar.' });
  } catch (error) {
    console.error('Error applying support:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Verify email
supportRouter.get('/verify/:token', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    
    const cases = await db.select().from(supportCases).where(eq(supportCases.magicToken, token as string));
    
    if (cases.length === 0) {
      res.status(404).json({ error: 'Enlace inválido o expirado' });
      return;
    }

    const supportCase = cases[0];
    
    if (supportCase?.isEmailVerified) {
      res.json({ message: 'El correo ya fue verificado.' });
      return;
    }

    await db.update(supportCases)
      .set({ isEmailVerified: true, status: 'En revision', magicToken: null })
      .where(eq(supportCases.id, supportCase!.id));

    res.json({ message: 'Correo verificado con éxito' });
  } catch (error) {
    console.error('Error verifying support:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get public approved cases
supportRouter.get('/public-cases', async (req: Request, res: Response) => {
  try {
    const { limit, offset } = req.query;
    
    const result = await db.select()
      .from(supportCases)
      .where(eq(supportCases.status, 'Aprobado'))
      .orderBy(desc(supportCases.publishedAt))
      .limit(limit ? parseInt(limit as string) : 20)
      .offset(offset ? parseInt(offset as string) : 0);
      
    res.json(result);
  } catch (error) {
    console.error('Error fetching public cases:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
