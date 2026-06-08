import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../services/db.js';
import { syncUserToSupabase, getUserByEmail } from '../services/supabase.js';

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
  const { name, email, password, mobile, gender } = req.body;

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

  const now = new Date().toISOString();
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
    gender: gender || 'Prefer not to say',
    registeredAt: now,
    lastLogin: now,
    loginHistory: [now],
    role: 'user'
  };

  const createdUser = db.insert('users', newUser);

  // Trigger Supabase sync asynchronously
  syncUserToSupabase(createdUser, password);

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
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  let user = db.find('users', u => u.email.toLowerCase() === email.toLowerCase());
  let isMatch = false;

  if (user) {
    isMatch = bcrypt.compareSync(password, user.password);
  }

  // If password does not match local hash or user does not exist locally, fallback to Supabase check
  if (!isMatch) {
    const supabaseUser = await getUserByEmail(email);
    if (supabaseUser) {
      // Supabase password could be plaintext or bcrypt hash
      const isBcrypt = supabaseUser.password.startsWith('$2a$') || supabaseUser.password.startsWith('$2b$');
      const passwordMatches = isBcrypt
        ? bcrypt.compareSync(password, supabaseUser.password)
        : (password === supabaseUser.password);

      if (passwordMatches) {
        isMatch = true;
        
        // Upgrade password to secure bcrypt hash locally if it was plaintext in Supabase
        const securePasswordHash = isBcrypt 
          ? supabaseUser.password 
          : bcrypt.hashSync(password, bcrypt.genSaltSync(10));

        if (user) {
          user = db.update('users', user.id, {
            password: securePasswordHash,
            name: supabaseUser.name || user.name,
            mobile: supabaseUser.mobile || user.mobile,
            avatar: supabaseUser.profile_photo || user.avatar,
            country: supabaseUser.country || user.country,
            state: supabaseUser.state || user.state,
            zipCode: supabaseUser.zip_code || user.zipCode,
            gender: supabaseUser.gender || user.gender,
            role: supabaseUser.user_type || user.role
          });
        } else {
          // Import the user from Supabase to local DB
          const localUser = {
            id: supabaseUser.id || Math.random().toString(36).substring(2, 11),
            name: supabaseUser.name || 'User',
            email: email.toLowerCase(),
            password: securePasswordHash,
            mobile: supabaseUser.mobile || '',
            status: 'active',
            isPremium: false,
            avatar: supabaseUser.profile_photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(supabaseUser.name || 'User')}`,
            country: supabaseUser.country || 'USA',
            state: supabaseUser.state || 'California',
            zipCode: supabaseUser.zip_code || '94016',
            gender: supabaseUser.gender || 'Prefer not to say',
            registeredAt: supabaseUser.registered_at || new Date().toISOString(),
            lastLogin: new Date().toISOString(),
            loginHistory: supabaseUser.login_history || [new Date().toISOString()],
            role: supabaseUser.user_type || 'user'
          };
          user = db.insert('users', localUser);
        }
      }
    }
  }

  if (!isMatch || !user) {
    return res.status(400).json({ message: 'Invalid email or password' });
  }

  if (user.status === 'banned') {
    return res.status(403).json({ message: 'Your account has been banned' });
  }

  // Update last login
  const now = new Date().toISOString();
  const currentHistory = user.loginHistory || [];
  const updatedUser = db.update('users', user.id, { 
    lastLogin: now,
    loginHistory: [...currentHistory, now]
  });

  // Trigger Supabase sync asynchronously (this will write the secure bcrypt hash back to Supabase if it was plaintext!)
  syncUserToSupabase(updatedUser, password);

  // Generate JWT token
  const token = jwt.sign(
    { userId: updatedUser.id, role: updatedUser.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  const { password: _, ...userWithoutPassword } = updatedUser;

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
  activeOtps.set(user.email.toLowerCase(), {
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

  const normalizedEmail = email.toLowerCase();
  const otpData = activeOtps.get(normalizedEmail);
  if (!otpData) {
    return res.status(400).json({ message: 'No active login session found' });
  }

  if (Date.now() > otpData.expires) {
    activeOtps.delete(normalizedEmail);
    return res.status(400).json({ message: 'OTP has expired' });
  }

  if (otpData.otp !== otp) {
    return res.status(400).json({ message: 'Invalid OTP code' });
  }

  // Successful 2FA verification
  activeOtps.delete(normalizedEmail);
  const user = db.find('users', u => u.email.toLowerCase() === normalizedEmail);

  // Update last login
  const now = new Date().toISOString();
  const currentHistory = user.loginHistory || [];
  const updatedUser = db.update('users', user.id, { 
    lastLogin: now,
    loginHistory: [...currentHistory, now]
  });

  // Trigger Supabase sync asynchronously
  syncUserToSupabase(updatedUser);

  // Generate Admin JWT token
  const token = jwt.sign(
    { userId: updatedUser.id, role: updatedUser.role },
    JWT_SECRET,
    { expiresIn: '12h' } // Shorter session for admin
  );

  logAdminAction('Admin 2FA Success', updatedUser.email, 'Admin successfully completed 2FA, session generated.', 'security');

  const { password: _, ...userWithoutPassword } = updatedUser;

  res.json({
    token,
    user: userWithoutPassword
  });
});

export default router;
