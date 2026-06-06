export type ViewState = 
  | 'LOGIN' 
  | 'DASHBOARD' 
  | 'CHECK_IN' 
  | 'CALENDAR' 
  | 'SOCIAL' 
  | 'RESOURCES' 
  | 'ADMIN_LOGIN' 
  | 'ADMIN_DASHBOARD';

export interface User {
  id: string;
  name: string;
  email: string;
  mobile?: string;
  status?: 'active' | 'banned';
  isPremium: boolean;
  avatar: string;
  country?: string;
  state?: string;
  zipCode?: string;
  registeredAt?: string;
  lastLogin?: string;
  role: 'user' | 'admin';
}

export interface WellnessEntry {
  id: string;
  userId: string;
  date: string;
  mood: number;
  energy: number;
  gratitude: string;
  focus: string;
  timestamp?: string;
}

export interface Friendship {
  friendshipId: string;
  id: string;
  name: string;
  email: string;
  avatar: string;
  status?: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  image?: string;
  emoji?: string;
  timestamp: string;
}

export interface Post {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  likes: string[];
  achievements: string[];
  timestamp: string;
  comments: Comment[];
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  timestamp: string;
}

export interface SystemLog {
  id: number;
  timestamp: string;
  action: string;
  admin: string;
  details: string;
  type: 'info' | 'warning' | 'error' | 'security';
}

export interface SystemConfig {
  maintenanceMode: boolean;
  geminiApiKey: string;
  hasApiKey: boolean;
}

export interface ApiKey {
  id: string;
  apiKey: string;
  name: string;
  permissions: 'read' | 'write' | 'admin';
  rateLimit: number;
  status: 'active' | 'revoked';
  usageCount: number;
  timestamp: string;
}
