import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../services/db.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'zenpath_wellness_secret_key_8842x_super_secure';

// Mock OTP storage
const activeOtps = new Map();

// Helper to log admin activity
const logAdminAction = (action, adminEmail, details, type = 'info') => {
  db.insert('system_logs', {
    timestamp: new Date().toISOString(),
    action,
    admin: adminEmail,
    details,
    type
  });
};

// USER REGISTRATION
router.post('/register', (req, res) => {
  const { name, email, password, mobile } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email, and password are required' });
  }

  // Validate existing user
  const existing = db.find('users', u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(400).json({ message: 'User with this email already exists' });
  }

  // Hash password
  const salt = bcrypt.genSaltSync(10);
  const hashedPassword = bcrypt.hashSync(password, salt);

  const newUser = {
    name,
    email: email.toLowerCase(),
    password: hashedPassword,
    mobile: mobile || '',
    status: 'active',
    isPremium: false,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
    country: 'USA',
    state: 'California',
    zipCode: '94016',
    registeredAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
    role: 'user'
  };

  const createdUser = db.insert('users', newUser);

  // Generate JWT token
  const token = jwt.sign(
    { userId: createdUser.id, role: createdUser.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  // Exclude password from response
  const { password: _, ...userWithoutPassword } = createdUser;

  res.status(201).json({
    token,
    user: userWithoutPassword
  });
});

// USER LOGIN
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  const user = db.find('users', u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    return res.status(400).json({ message: 'Invalid email or password' });
  }

  if (user.status === 'banned') {
    return res.status(403).json({ message: 'Your account has been banned' });
  }

  // Verify password
  const isMatch = bcrypt.compareSync(password, user.password);
  if (!isMatch) {
    return res.status(400).json({ message: 'Invalid email or password' });
  }

  // Update last login
  db.update('users', user.id, { lastLogin: new Date().toISOString() });

  // Generate JWT token
  const token = jwt.sign(
    { userId: user.id, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  const { password: _, ...userWithoutPassword } = user;

  res.json({
    token,
    user: userWithoutPassword
  });
});

// ADMIN LOGIN (STEP 1: Check credentials & send 2FA)
router.post('/admin/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  const user = db.find('users', u => u.email.toLowerCase() === email.toLowerCase());
  if (!user || user.role !== 'admin') {
    return res.status(401).json({ message: 'Access denied: Admin permissions required' });
  }

  const isMatch = bcrypt.compareSync(password, user.password);
  if (!isMatch) {
    return res.status(401).json({ message: 'Invalid admin credentials' });
  }

  // Generate a mock 6-digit OTP
  const otp = '884299'; // Secure fixed code for easy testing / demo
  activeOtps.set(user.email, {
    otp,
    expires: Date.now() + 5 * 60 * 1000 // 5 minutes
  });

  logAdminAction('Admin Login Attempt', user.email, 'Admin login credentials verified, sending 2FA OTP.', 'security');

  res.json({
    message: '2FA OTP sent to admin email (Simulated Code is: 884299)',
    require2FA: true,
    email: user.email
  });
});

// ADMIN LOGIN (STEP 2: Verify 2FA OTP)
router.post('/admin/verify-2fa', (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ message: 'Email and OTP are required' });
  }

  const otpData = activeOtps.get(email);
  if (!otpData) {
    return res.status(400).json({ message: 'No active login session found' });
  }

  if (Date.now() > otpData.expires) {
    activeOtps.delete(email);
    return res.status(400).json({ message: 'OTP has expired' });
  }

  if (otpData.otp !== otp) {
    return res.status(400).json({ message: 'Invalid OTP code' });
  }

  // Successful 2FA verification
  activeOtps.delete(email);
  const user = db.find('users', u => u.email === email);

  // Update last login
  db.update('users', user.id, { lastLogin: new Date().toISOString() });

  // Generate Admin JWT token
  const token = jwt.sign(
    { userId: user.id, role: user.role },
    JWT_SECRET,
    { expiresIn: '12h' } // Shorter session for admin
  );

  logAdminAction('Admin 2FA Success', user.email, 'Admin successfully completed 2FA, session generated.', 'security');

  const { password: _, ...userWithoutPassword } = user;

  res.json({
    token,
    user: userWithoutPassword
  });
});

export default router;
