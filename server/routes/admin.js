import express from 'express';
import { requireAdmin } from '../middleware/auth.js';
import { db } from '../services/db.js';

const router = express.Router();

// Helper to log admin activity
const logAdminAction = (action, adminName, details, type = 'info') => {
  db.insert('system_logs', {
    timestamp: new Date().toISOString(),
    action,
    admin: adminName,
    details,
    type
  });
};

// 1. GET DASHBOARD OVERVIEW STATS
router.get('/stats', requireAdmin, (req, res) => {
  const users = db.get('users');
  const logs = db.get('system_logs');
  
  const totalUsers = users.length;
  const premiumUsers = users.filter(u => u.isPremium).length;
  const freeUsers = totalUsers - premiumUsers;
  const activeUsers = users.filter(u => u.status === 'active').length;
  const bannedUsers = totalUsers - activeUsers;

  // Mock download tracker calculations
  const totalDownloads = totalUsers * 5.4 + 1204;

  // Mock transaction data based on premium log counts
  const premiumLogs = logs.filter(l => l.action === 'Premium Subscription Created');
  const baseRevenue = premiumLogs.length * 9.99;
  const totalRevenue = baseRevenue + 2450.00; // base revenue + historical template revenue

  // Graph Data (6-month arrays)
  const monthlyRevenue = [320, 450, 710, 890, 1200, totalRevenue];
  const userGrowth = [120, 240, 480, 720, 1100, totalUsers];

  res.json({
    totalDownloads: Math.floor(totalDownloads),
    totalUsers,
    activeUsers,
    bannedUsers,
    premiumUsers,
    freeUsers,
    totalRevenue: parseFloat(totalRevenue.toFixed(2)),
    todayRevenue: premiumLogs.length ? 19.99 : 0.00,
    monthlyRevenue,
    userGrowth
  });
});

// 2. USER MANAGEMENT: VIEW ALL
router.get('/users', requireAdmin, (req, res) => {
  const users = db.get('users');
  // Exclude passwords for security
  const sanitized = users.map(({ password: _, ...u }) => u);
  res.json(sanitized);
});

// 3. USER MANAGEMENT: TOGGLE BAN STATUS
router.put('/users/:id/status', requireAdmin, (req, res) => {
  const { status } = req.body; // active, banned
  const targetUser = db.find('users', u => u.id === req.params.id);

  if (!targetUser) {
    return res.status(404).json({ message: 'User not found' });
  }

  if (targetUser.role === 'admin') {
    return res.status(400).json({ message: 'Cannot ban another admin user' });
  }

  db.update('users', req.params.id, { status });

  logAdminAction(
    status === 'banned' ? 'User Banned' : 'User Unbanned',
    req.currentUser.email,
    `Status of user ${targetUser.name} (${targetUser.email}) changed to ${status}.`,
    'security'
  );

  res.json({ message: `User status changed to ${status}` });
});

// 4. USER MANAGEMENT: DELETE USER
router.delete('/users/:id', requireAdmin, (req, res) => {
  const targetUser = db.find('users', u => u.id === req.params.id);

  if (!targetUser) {
    return res.status(404).json({ message: 'User not found' });
  }

  if (targetUser.role === 'admin') {
    return res.status(400).json({ message: 'Cannot delete admin users' });
  }

  // Delete all related records
  db.delete('users', req.params.id);
  
  // Clean up wellness entries
  const entries = db.filter('wellness_entries', e => e.userId === req.params.id);
  entries.forEach(e => db.delete('wellness_entries', e.id));

  // Clean up posts
  const posts = db.filter('posts', p => p.userId === req.params.id);
  posts.forEach(p => db.delete('posts', p.id));

  // Clean up friendships
  const friendships = db.filter('friendships', f => 
    f.userSenderId === req.params.id || f.userReceiverId === req.params.id
  );
  friendships.forEach(f => db.delete('friendships', f.id));

  logAdminAction(
    'User Profile Deleted',
    req.currentUser.email,
    `Purged account and data of user ${targetUser.name} (${targetUser.email}).`,
    'warning'
  );

  res.json({ message: 'User and all related records successfully deleted' });
});

// 5. USER MANAGEMENT: CHANGE ROLE OR PREMIUM PLAN
router.put('/users/:id/role', requireAdmin, (req, res) => {
  const { role, isPremium } = req.body;
  const targetUser = db.find('users', u => u.id === req.params.id);

  if (!targetUser) {
    return res.status(404).json({ message: 'User not found' });
  }

  const updates = {};
  if (role !== undefined) updates.role = role;
  if (isPremium !== undefined) updates.isPremium = isPremium;

  db.update('users', req.params.id, updates);

  logAdminAction(
    'User Account Modified',
    req.currentUser.email,
    `Modified attributes for ${targetUser.name}: role=${role}, isPremium=${isPremium}`,
    'info'
  );

  res.json({ message: 'User attributes updated' });
});

// 6. SYSTEM CONFIG MANAGEMENT
router.get('/config', requireAdmin, (req, res) => {
  const config = db.getConfig();
  // Return config with Gemini API key masked for security
  const maskedKey = config.geminiApiKey 
    ? `${config.geminiApiKey.substring(0, 7)}...${config.geminiApiKey.substring(config.geminiApiKey.length - 4)}` 
    : '';

  res.json({
    maintenanceMode: config.maintenanceMode || false,
    geminiApiKey: maskedKey,
    hasApiKey: !!config.geminiApiKey
  });
});

router.put('/config', requireAdmin, (req, res) => {
  const { maintenanceMode, geminiApiKey } = req.body;
  const config = db.getConfig();

  const updates = {};
  if (maintenanceMode !== undefined) {
    updates.maintenanceMode = maintenanceMode;
    logAdminAction(
      'System State Shift',
      req.currentUser.email,
      `Maintenance mode set to ${maintenanceMode}.`,
      'security'
    );
  }

  // Update key if a new one is sent (not just the masked one)
  if (geminiApiKey !== undefined && !geminiApiKey.includes('...')) {
    updates.geminiApiKey = geminiApiKey;
    logAdminAction(
      'Gemini API Key Rotated',
      req.currentUser.email,
      `Super admin rotated the active Gemini AI coach API key.`,
      'security'
    );
  }

  const newConfig = db.updateConfig(updates);
  
  res.json({
    message: 'System settings successfully updated',
    maintenanceMode: newConfig.maintenanceMode,
    hasApiKey: !!newConfig.geminiApiKey
  });
});

// 7. DEVELOPER API KEY MANAGEMENT
router.get('/api-keys', requireAdmin, (req, res) => {
  const keys = db.get('api_keys');
  res.json(keys);
});

router.post('/api-keys', requireAdmin, (req, res) => {
  const { name, permissions, rateLimit } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'API key descriptor name is required' });
  }

  // Generate a mock secure key
  const randomHex = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  const newKey = `zp_live_${randomHex.substring(0, 16)}`;

  const created = db.insert('api_keys', {
    apiKey: newKey,
    name,
    permissions: permissions || 'read',
    rateLimit: rateLimit ? parseInt(rateLimit) : 60,
    status: 'active',
    usageCount: 0
  });

  logAdminAction(
    'Developer API Key Created',
    req.currentUser.email,
    `Issued new API key "${name}" with role ${permissions}.`,
    'security'
  );

  res.status(201).json(created);
});

router.delete('/api-keys/:id', requireAdmin, (req, res) => {
  const key = db.find('api_keys', k => k.id === req.params.id);
  if (!key) {
    return res.status(404).json({ message: 'API key not found' });
  }

  db.delete('api_keys', req.params.id);

  logAdminAction(
    'Developer API Key Revoked',
    req.currentUser.email,
    `Revoked key API key: "${key.name}" (${key.apiKey.substring(0, 10)}...)`,
    'security'
  );

  res.json({ message: 'API key revoked successfully' });
});

// 8. NOTIFICATION LAUNCH SYSTEM
router.post('/notifications', requireAdmin, (req, res) => {
  const { targetGroup, title, message } = req.body; // targetGroup: 'all', 'premium', 'selected'
  
  if (!title || !message) {
    return res.status(400).json({ message: 'Title and message details are required' });
  }

  // Log action
  logAdminAction(
    'Global Notification Dispatched',
    req.currentUser.email,
    `Dispatched notification matching group "${targetGroup}": [${title}] ${message}`,
    'info'
  );

  // In-App Notification: inject as system post on social timeline so all users can see it
  const systemUser = db.find('users', u => u.role === 'admin') || { name: 'ZenPath Wellness', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin' };
  
  db.insert('posts', {
    userId: 'system',
    userName: '📢 ' + systemUser.name,
    userAvatar: systemUser.avatar,
    content: `[ALERT: ${title}] - ${message}`,
    likes: [],
    achievements: ['announcement']
  });

  res.json({ message: `Notification broadcast sent successfully to: ${targetGroup}` });
});

// 9. SYSTEM ACTIVITY LOGS
router.get('/logs', requireAdmin, (req, res) => {
  const logs = db.get('system_logs');
  // Sort descending by time
  const sorted = [...logs].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  res.json(sorted);
});

// 10. APP DOWNLOADS MOCK LIST
router.get('/downloads', requireAdmin, (req, res) => {
  // Return sample telemetry of downloads
  res.json([
    { id: 1, device: 'Android 14 (Pixel 8)', country: 'USA', city: 'San Francisco', ip: '192.168.1.45', source: 'Play Store', time: new Date().toISOString() },
    { id: 2, device: 'iOS 17.2 (iPhone 15)', country: 'India', city: 'Kolkata', ip: '103.45.67.12', source: 'Direct Search', time: new Date(Date.now() - 3600000).toISOString() },
    { id: 3, device: 'Android 13 (Samsung S23)', country: 'UK', city: 'London', ip: '82.4.156.90', source: 'Google Ads', time: new Date(Date.now() - 7200000).toISOString() }
  ]);
});

export default router;
