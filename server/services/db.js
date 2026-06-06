import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, '../data/db.json');

// Ensure data folder exists
const dir = path.dirname(DB_FILE);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

// Initial DB state
const initialData = {
  users: [
    // Pre-populate an admin user for direct login
    {
      id: "admin-1",
      name: "Super Admin",
      email: "admin@zenpath.com",
      password: "$2a$10$n.9Dq57Rw2g0oiaEYtKkK.ayAMklnU28ZeShhx7pwSffhry7HKWIu", // bcrypt hash for 'admin123'
      mobile: "+1 (555) 019-2834",
      status: "active",
      isPremium: true,
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Admin",
      country: "USA",
      state: "California",
      zipCode: "94016",
      registeredAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      role: "admin"
    }
  ],
  wellness_entries: [],
  friendships: [],
  posts: [],
  comments: [],
  chat_messages: [],
  system_logs: [],
  api_keys: [
    {
      id: "key-1",
      apiKey: "zp_live_8842x9973k",
      name: "Production Web SDK",
      permissions: "read",
      rateLimit: 120,
      status: "active",
      usageCount: 0,
      timestamp: new Date().toISOString()
    }
  ],
  system_config: {
    maintenanceMode: false,
    geminiApiKey: ""
  }
};

function readDB() {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2));
    return initialData;
  }
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    return initialData;
  }
}

function writeDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

export const db = {
  get: (table) => {
    const data = readDB();
    return data[table] || [];
  },
  find: (table, filterFn) => {
    const data = readDB();
    const rows = data[table] || [];
    return rows.find(filterFn);
  },
  filter: (table, filterFn) => {
    const data = readDB();
    const rows = data[table] || [];
    return rows.filter(filterFn);
  },
  insert: (table, record) => {
    const data = readDB();
    if (!data[table]) data[table] = [];
    
    // Add ID if not present
    if (!record.id) {
      record.id = Math.random().toString(36).substring(2, 11);
    }
    // Add timestamp if not present
    if (!record.timestamp && !record.createdAt) {
      record.timestamp = new Date().toISOString();
    }
    
    data[table].push(record);
    writeDB(data);
    return record;
  },
  update: (table, id, updates) => {
    const data = readDB();
    if (!data[table]) return null;
    const index = data[table].findIndex(item => item.id === id);
    if (index === -1) return null;
    data[table][index] = { ...data[table][index], ...updates };
    writeDB(data);
    return data[table][index];
  },
  delete: (table, id) => {
    const data = readDB();
    if (!data[table]) return false;
    const initialLen = data[table].length;
    data[table] = data[table].filter(item => item.id !== id);
    writeDB(data);
    return data[table].length < initialLen;
  },
  getConfig: () => {
    const data = readDB();
    return data.system_config || initialData.system_config;
  },
  updateConfig: (updates) => {
    const data = readDB();
    data.system_config = { ...data.system_config, ...updates };
    writeDB(data);
    return data.system_config;
  }
};
