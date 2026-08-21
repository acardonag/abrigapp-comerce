import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { AuthRequest } from '../middlewares/auth';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

export const uploadRouter = Router();

uploadRouter.use((req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        res.status(401).json({ error: 'No token' });
        return;
    }
    const token = authHeader.split(' ')[1];
    if (!token) {
        res.status(401).json({ error: 'No token provided' });
        return;
    }
    try {
        const secret: string = process.env.JWT_SECRET ? process.env.JWT_SECRET : 'secret';
        const decoded = jwt.verify(token, secret) as any;
        if (decoded.userId || decoded.role === 'superadmin') {
            next();
        } else {
            res.status(403).json({ error: 'Forbidden' });
        }
    } catch(e) {
        res.status(401).json({ error: 'Invalid token' });
    }
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const id = crypto.randomUUID();
    cb(null, `${id}${ext}`);
  }
});

const upload = multer({ storage: storage });

uploadRouter.post('/', upload.single('file'), (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }
    // Return the public URL for the file
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ url: fileUrl });
  } catch (error) {
    res.status(500).json({ error: 'Server error during upload' });
  }
});
