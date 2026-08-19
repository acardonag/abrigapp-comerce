import { Router, Request, Response } from 'express';
import { db } from '../db';
import { volunteers, supportCases } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import jwt from 'jsonwebtoken';

export const volunteerRouter = Router();

// Middleware to authenticate volunteer
export const authenticateVolunteer = (req: Request, res: Response, next: Function) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, (process.env.JWT_SECRET as string) || 'secret');
    (req as any).user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// Login
volunteerRouter.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  
  try {
    const result = await db.select().from(volunteers).where(eq(volunteers.email, email as string));
    if (result.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    
    const volunteer = result[0];
    if (!volunteer || !volunteer.isActive) {
      return res.status(401).json({ error: 'Cuenta inactiva' });
    }
    
    if (volunteer.passwordHash !== password) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    
    const token = jwt.sign({ id: volunteer.id, role: 'volunteer' }, process.env.JWT_SECRET || 'secret', { expiresIn: '12h' });
    res.json({ token, volunteer: { name: volunteer.name, email: volunteer.email } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

volunteerRouter.use(authenticateVolunteer);

// List cases (Aplicado, En revision, Aprobado, Rechazado, Expirado)
volunteerRouter.get('/cases', async (req: Request, res: Response) => {
  try {
    const cases = await db.select().from(supportCases);
    res.json(cases);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching cases' });
  }
});

// Update a case
volunteerRouter.put('/case/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, supportType, youtubeUrl, imageUrls, donationAccount } = req.body;
    
    // Check limit of 20 active cases if we are approving
    if (status === 'Aprobado') {
      const activeCases = await db.select().from(supportCases).where(eq(supportCases.status, 'Aprobado'));
      const currentCase = await db.select().from(supportCases).where(eq(supportCases.id, id as string));
      
      // If it's not already approved, check limit
      if (currentCase[0] && currentCase[0].status !== 'Aprobado' && activeCases.length >= 20) {
        return res.status(400).json({ error: 'Límite máximo de 20 casos activos alcanzado. No puedes aprobar más.' });
      }
    }

    const updateData: any = {
      status,
      supportType,
      youtubeUrl,
      imageUrls: imageUrls ? JSON.stringify(imageUrls) : null,
      donationAccount,
      updatedAt: new Date()
    };

    if (status === 'Aprobado') {
      const currentCase = await db.select().from(supportCases).where(eq(supportCases.id, id as string));
      if (currentCase[0] && currentCase[0].status !== 'Aprobado') {
        updateData.publishedAt = new Date(); // Stamp the publishing time
      }
    }

    await db.update(supportCases).set(updateData).where(eq(supportCases.id, id as string));
    
    res.json({ message: 'Caso actualizado' });
  } catch (error) {
    console.error('Error updating case:', error);
    res.status(500).json({ error: 'Error updating case' });
  }
});
