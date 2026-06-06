const getHeaders = () => {
  const token = localStorage.getItem('zp_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

const handleResponse = async (res: Response) => {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || `API request failed with status ${res.status}`);
  }
  return data;
};

export const api = {
  // --- AUTH ENDPOINTS ---
  auth: {
    register: async (payload: any) => {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return handleResponse(res);
    },
    login: async (payload: any) => {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return handleResponse(res);
    },
    adminLogin: async (payload: any) => {
      const res = await fetch('/api/auth/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return handleResponse(res);
    },
    verify2FA: async (payload: any) => {
      const res = await fetch('/api/auth/admin/verify-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return handleResponse(res);
    }
  },

  // --- USER PROFILE & ENTRIES ---
  users: {
    getProfile: async () => {
      const res = await fetch('/api/users/profile', {
        headers: getHeaders()
      });
      return handleResponse(res);
    },
    updateProfile: async (payload: any) => {
      const res = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(payload)
      });
      return handleResponse(res);
    },
    getEntries: async () => {
      const res = await fetch('/api/users/entries', {
        headers: getHeaders()
      });
      return handleResponse(res);
    },
    saveEntry: async (payload: any) => {
      const res = await fetch('/api/users/entries', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload)
      });
      return handleResponse(res);
    },
    upgradePremium: async (plan: string) => {
      const res = await fetch('/api/users/upgrade', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ plan })
      });
      return handleResponse(res);
    }
  },

  // --- SOCIAL HUB ---
  social: {
    getPosts: async () => {
      const res = await fetch('/api/social/posts', {
        headers: getHeaders()
      });
      return handleResponse(res);
    },
    createPost: async (content: string) => {
      const res = await fetch('/api/social/posts', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ content })
      });
      return handleResponse(res);
    },
    likePost: async (postId: string) => {
      const res = await fetch(`/api/social/posts/${postId}/like`, {
        method: 'POST',
        headers: getHeaders()
      });
      return handleResponse(res);
    },
    addComment: async (postId: string, content: string) => {
      const res = await fetch(`/api/social/posts/${postId}/comments`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ content })
      });
      return handleResponse(res);
    },
    getFriends: async () => {
      const res = await fetch('/api/social/friends', {
        headers: getHeaders()
      });
      return handleResponse(res);
    },
    sendFriendRequest: async (receiverId: string) => {
      const res = await fetch('/api/social/friends/request', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ receiverId })
      });
      return handleResponse(res);
    },
    acceptFriendRequest: async (friendshipId: string) => {
      const res = await fetch('/api/social/friends/accept', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ friendshipId })
      });
      return handleResponse(res);
    },
    rejectFriendRequest: async (friendshipId: string) => {
      const res = await fetch('/api/social/friends/reject', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ friendshipId })
      });
      return handleResponse(res);
    },
    getChatMessages: async (friendId: string) => {
      const res = await fetch(`/api/social/chat/${friendId}`, {
        headers: getHeaders()
      });
      return handleResponse(res);
    },
    sendChatMessage: async (friendId: string, payload: { content?: string, image?: string, emoji?: string }) => {
      const res = await fetch(`/api/social/chat/${friendId}`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload)
      });
      return handleResponse(res);
    }
  },

  // --- GEMINI AI wellness COACH ---
  ai: {
    sendMessage: async (message: string) => {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ message })
      });
      return handleResponse(res);
    }
  },

  // --- SUPER ADMIN PORTAL ---
  admin: {
    getStats: async () => {
      const res = await fetch('/api/admin/stats', {
        headers: getHeaders()
      });
      return handleResponse(res);
    },
    getUsers: async () => {
      const res = await fetch('/api/admin/users', {
        headers: getHeaders()
      });
      return handleResponse(res);
    },
    updateUserStatus: async (userId: string, status: 'active' | 'banned') => {
      const res = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ status })
      });
      return handleResponse(res);
    },
    updateUserAttributes: async (userId: string, payload: { role?: string, isPremium?: boolean }) => {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(payload)
      });
      return handleResponse(res);
    },
    deleteUser: async (userId: string) => {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      return handleResponse(res);
    },
    getConfig: async () => {
      const res = await fetch('/api/admin/config', {
        headers: getHeaders()
      });
      return handleResponse(res);
    },
    updateConfig: async (payload: { maintenanceMode?: boolean, geminiApiKey?: string }) => {
      const res = await fetch('/api/admin/config', {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(payload)
      });
      return handleResponse(res);
    },
    getLogs: async () => {
      const res = await fetch('/api/admin/logs', {
        headers: getHeaders()
      });
      return handleResponse(res);
    },
    getApiKeys: async () => {
      const res = await fetch('/api/admin/api-keys', {
        headers: getHeaders()
      });
      return handleResponse(res);
    },
    createApiKey: async (payload: { name: string, permissions: string, rateLimit: number }) => {
      const res = await fetch('/api/admin/api-keys', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload)
      });
      return handleResponse(res);
    },
    deleteApiKey: async (keyId: string) => {
      const res = await fetch(`/api/admin/api-keys/${keyId}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      return handleResponse(res);
    },
    sendNotification: async (payload: { targetGroup: string, title: string, message: string }) => {
      const res = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload)
      });
      return handleResponse(res);
    },
    getDownloads: async () => {
      const res = await fetch('/api/admin/downloads', {
        headers: getHeaders()
      });
      return handleResponse(res);
    }
  }
};
