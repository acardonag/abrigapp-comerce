import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

import { authRouter } from './routes/auth';
import { publicRouter } from './routes/public';
import { businessRouter } from './routes/businesses';
import { productsRouter } from './routes/products';
import { uploadRouter } from './routes/upload';
import { superadminRouter } from './routes/superadmin';
import { supportRouter } from './routes/support';
import { volunteerRouter } from './routes/volunteer';
import path from 'path';
import cron from 'node-cron';
import { db } from './db';
import { supportCases } from './db/schema';
import { eq, and, lt } from 'drizzle-orm';

// Serve uploads statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/auth', authRouter);
app.use('/api/public', publicRouter);
app.use('/api/business', businessRouter);
app.use('/api/products', productsRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/superadmin', superadminRouter);
app.use('/api/support', supportRouter);
app.use('/api/volunteer', volunteerRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'AbrigApp Backend is running!' });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  
  // Set up cron job (runs every day at 1:00 AM)
  cron.schedule('0 1 * * *', async () => {
    try {
      console.log('Running daily cron job: Expiring old support cases');
      const tenDaysAgo = new Date();
      tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
      
      const result = await db.update(supportCases)
        .set({ status: 'Expirado', updatedAt: new Date() })
        .where(
          and(
            eq(supportCases.status, 'Aprobado'),
            lt(supportCases.publishedAt, tenDaysAgo)
          )
        );
        
      console.log(`Cron job completed.`);
    } catch (error) {
      console.error('Error running cron job:', error);
    }
  });
});
