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
import path from 'path';

// Serve uploads statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/auth', authRouter);
app.use('/api/public', publicRouter);
app.use('/api/business', businessRouter);
app.use('/api/products', productsRouter);
app.use('/api/upload', uploadRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'AbrigApp Backend is running!' });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
