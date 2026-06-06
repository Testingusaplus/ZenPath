import jwt from 'jsonwebtoken';
import { db } from '../services/db.js';

export const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'zenpath_wellness_secret_key_8842x_super_secure');
    req.user = decoded;

    // Verify user exists and is active
    const user = db.find('users', u => u.id === req.user.userId);
    if (!user) {
      return res.status(401).json({ message: 'User does not exist' });
    }

    if (user.status === 'banned') {
      return res.status(403).json({ message: 'Your account has been banned' });
    }

    // Attach full user details to request
    req.currentUser = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

export const requireAdmin = (req, res, next) => {
  requireAuth(req, res, () => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied: Admin role required' });
    }
    next();
  });
};
