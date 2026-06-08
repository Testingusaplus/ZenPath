import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { db } from '../services/db.js';
import { syncUserToSupabase } from '../services/supabase.js';

const router = express.Router();

// GET CURRENT USER PROFILE
router.get('/profile', requireAuth, (req, res) => {
  const { password: _, ...userWithoutPassword } = req.currentUser;
  res.json(userWithoutPassword);
});

// UPDATE PROFILE
router.put('/profile', requireAuth, (req, res) => {
  const { name, mobile, avatar, country, state, zipCode, gender } = req.body;

  const updates = {};
  if (name !== undefined) updates.name = name;
  if (mobile !== undefined) updates.mobile = mobile;
  if (avatar !== undefined) updates.avatar = avatar; // base64 representation
  if (country !== undefined) updates.country = country;
  if (state !== undefined) updates.state = state;
  if (gender !== undefined) updates.gender = gender;
  
  // Custom Validation rules for postal code based on selected country
  if (zipCode !== undefined) {
    if (country === 'USA') {
      const zipRegex = /^\d{5}$/;
      if (!zipRegex.test(zipCode)) {
        return res.status(400).json({ message: 'Invalid USA Zip Code format (must be 5 digits)' });
      }
    } else if (country === 'India') {
      const pinRegex = /^\d{6}$/;
      if (!pinRegex.test(zipCode)) {
        return res.status(400).json({ message: 'Invalid India Pin Code format (must be 6 digits)' });
      }
    } else {
      // Basic alphanumeric check for other countries
      const genericRegex = /^[A-Z0-9 -]{3,10}$/i;
      if (!genericRegex.test(zipCode)) {
        return res.status(400).json({ message: 'Invalid postal code format' });
      }
    }
    updates.zipCode = zipCode;
  }

  const updatedUser = db.update('users', req.user.userId, updates);

  // Trigger Supabase sync asynchronously
  syncUserToSupabase(updatedUser);

  const { password: _, ...userWithoutPassword } = updatedUser;
  res.json(userWithoutPassword);
});

// GET WELLNESS DAILY LOGS
router.get('/entries', requireAuth, (req, res) => {
  const entries = db.filter('wellness_entries', e => e.userId === req.user.userId);
  res.json(entries);
});

// ADD/UPDATE WELLNESS LOG
router.post('/entries', requireAuth, (req, res) => {
  const { date, mood, energy, gratitude, focus } = req.body;

  if (!date || mood === undefined || energy === undefined) {
    return res.status(400).json({ message: 'Date, mood, and energy ratings are required' });
  }

  const moodVal = parseInt(mood);
  const energyVal = parseInt(energy);

  if (isNaN(moodVal) || moodVal < 1 || moodVal > 10) {
    return res.status(400).json({ message: 'Mood must be an integer between 1 and 10' });
  }

  if (isNaN(energyVal) || energyVal < 1 || energyVal > 10) {
    return res.status(400).json({ message: 'Energy must be an integer between 1 and 10' });
  }

  // Check for existing entry on this date
  const existing = db.find('wellness_entries', e => e.userId === req.user.userId && e.date === date);

  let result;
  if (existing) {
    result = db.update('wellness_entries', existing.id, {
      mood: moodVal,
      energy: energyVal,
      gratitude: gratitude || '',
      focus: focus || ''
    });
  } else {
    result = db.insert('wellness_entries', {
      userId: req.user.userId,
      date,
      mood: moodVal,
      energy: energyVal,
      gratitude: gratitude || '',
      focus: focus || ''
    });

    // Check achievement unlock: Journal Streak (e.g. if they logged at least 3 entries in total)
    const totalEntries = db.filter('wellness_entries', e => e.userId === req.user.userId).length;
    if (totalEntries === 1) {
      db.insert('posts', {
        userId: req.user.userId,
        userName: req.currentUser.name,
        userAvatar: req.currentUser.avatar,
        content: `Unlocked Achievement: 🌱 First Steps! (Logged first wellness entry)`,
        likes: [],
        achievements: ['first_steps']
      });
    } else if (totalEntries === 5) {
      db.insert('posts', {
        userId: req.user.userId,
        userName: req.currentUser.name,
        userAvatar: req.currentUser.avatar,
        content: `Unlocked Achievement: 🔥 Consistent Wellness! (Logged 5 days)`,
        likes: [],
        achievements: ['wellness_streak']
      });
    }
  }

  res.json(result);
});

// SIMULATED UPGRADE
router.post('/upgrade', requireAuth, (req, res) => {
  const { plan } = req.body; // monthly, yearly

  const updatedUser = db.update('users', req.user.userId, { isPremium: true });

  // Log transaction simulation
  const amount = plan === 'yearly' ? 19.99 : 2.99;
  db.insert('system_logs', {
    timestamp: new Date().toISOString(),
    action: 'Premium Subscription Created',
    admin: req.currentUser.email,
    details: `User ${req.currentUser.name} upgraded via simulated payment of $${amount}.`,
    type: 'info'
  });

  const { password: _, ...userWithoutPassword } = updatedUser;
  res.json({
    message: 'Subscription successfully activated!',
    user: userWithoutPassword
  });
});

export default router;
