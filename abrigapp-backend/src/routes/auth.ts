import { Router } from 'express';
import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import { sendOtpEmail } from '../services/email';

export const authRouter = Router();

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

authRouter.post('/login', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    res.status(400).json({ error: 'El email es requerido' });
    return;
  }

  try {
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Check if user exists
    const [existingUser] = await db.select().from(users).where(eq(users.email, email));

    if (existingUser) {
      await db.update(users).set({ otpCode: otp, otpExpiresAt: expiresAt }).where(eq(users.id, existingUser.id));
    } else {
      await db.insert(users).values({ email, otpCode: otp, otpExpiresAt: expiresAt });
    }

    // Send email
    await sendOtpEmail(email, otp);

    res.json({ message: 'Código OTP enviado al correo' });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Error al procesar el login' });
  }
});

authRouter.post('/verify', async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    res.status(400).json({ error: 'Email y código OTP requeridos' });
    return;
  }

  try {
    const [user] = await db.select().from(users).where(eq(users.email, email));

    if (!user || user.otpCode !== otp) {
      res.status(401).json({ error: 'Código inválido o expirado' });
      return;
    }

    if (user.otpExpiresAt && new Date() > user.otpExpiresAt) {
      res.status(401).json({ error: 'El código ha expirado' });
      return;
    }

    // Clear OTP
    await db.update(users).set({ otpCode: null, otpExpiresAt: null }).where(eq(users.id, user.id));

    // Generate JWT
    const token = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET || 'secret', {
      expiresIn: '7d',
    });

    res.json({ message: 'Verificación exitosa', token });
  } catch (error) {
    console.error('Verify error:', error);
    res.status(500).json({ error: 'Error al verificar OTP' });
  }
});
