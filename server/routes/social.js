import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { db } from '../services/db.js';

const router = express.Router();

// ==================== POST FEED ====================

// GET POST FEED
router.get('/posts', requireAuth, (req, res) => {
  const posts = db.get('posts');
  
  // Sort descending
  const sorted = [...posts].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
  // Map comments into posts
  const result = sorted.map(post => {
    const comments = db.filter('comments', c => c.postId === post.id);
    // Sort comments ascending
    const sortedComments = [...comments].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    return {
      ...post,
      comments: sortedComments
    };
  });
  
  res.json(result);
});

// CREATE TIMELINE POST
router.post('/posts', requireAuth, (req, res) => {
  const { content } = req.body;

  if (!content) {
    return res.status(400).json({ message: 'Post content is required' });
  }

  const newPost = {
    userId: req.user.userId,
    userName: req.currentUser.name,
    userAvatar: req.currentUser.avatar,
    content,
    likes: [],
    achievements: []
  };

  const created = db.insert('posts', newPost);
  created.comments = [];

  res.status(201).json(created);
});

// LIKE/UNLIKE POST
router.post('/posts/:id/like', requireAuth, (req, res) => {
  const post = db.find('posts', p => p.id === req.params.id);
  if (!post) {
    return res.status(404).json({ message: 'Post not found' });
  }

  const userId = req.user.userId;
  let likes = post.likes || [];

  if (likes.includes(userId)) {
    // Unlike
    likes = likes.filter(id => id !== userId);
  } else {
    // Like
    likes.push(userId);
  }

  const updated = db.update('posts', post.id, { likes });
  res.json(updated);
});

// ADD COMMENT TO POST
router.post('/posts/:id/comments', requireAuth, (req, res) => {
  const { content } = req.body;
  if (!content) {
    return res.status(400).json({ message: 'Comment content is required' });
  }

  const post = db.find('posts', p => p.id === req.params.id);
  if (!post) {
    return res.status(404).json({ message: 'Post not found' });
  }

  const newComment = {
    postId: post.id,
    userId: req.user.userId,
    userName: req.currentUser.name,
    userAvatar: req.currentUser.avatar,
    content
  };

  const created = db.insert('comments', newComment);
  res.status(201).json(created);
});

// ==================== FRIENDSHIPS ====================

// GET FRIENDS AND REQUESTS
router.get('/friends', requireAuth, (req, res) => {
  const currentUserId = req.user.userId;
  
  // Find all friendships involving user
  const allFriendships = db.filter('friendships', f => 
    f.userSenderId === currentUserId || f.userReceiverId === currentUserId
  );

  const friends = [];
  const pendingSent = [];
  const pendingReceived = [];

  allFriendships.forEach(f => {
    const isSender = f.userSenderId === currentUserId;
    const peerId = isSender ? f.userReceiverId : f.userSenderId;
    const peer = db.find('users', u => u.id === peerId);
    
    if (!peer) return;
    
    const { password: _, ...peerProfile } = peer;
    
    if (f.status === 'accepted') {
      friends.push({ friendshipId: f.id, ...peerProfile });
    } else if (f.status === 'pending') {
      if (isSender) {
        pendingSent.push({ friendshipId: f.id, ...peerProfile });
      } else {
        pendingReceived.push({ friendshipId: f.id, ...peerProfile });
      }
    }
  });

  // Also offer suggestion list (all active users except self/friends/pending)
  const allUsers = db.get('users');
  const nonSuggestions = new Set([
    currentUserId,
    ...friends.map(fr => fr.id),
    ...pendingSent.map(fr => fr.id),
    ...pendingReceived.map(fr => fr.id)
  ]);
  
  const suggestions = allUsers
    .filter(u => u.status !== 'banned' && u.role !== 'admin' && !nonSuggestions.has(u.id))
    .map(({ password: _, ...p }) => p);

  res.json({
    friends,
    pendingSent,
    pendingReceived,
    suggestions
  });
});

// SEND FRIEND REQUEST
router.post('/friends/request', requireAuth, (req, res) => {
  const { receiverId } = req.body;
  const senderId = req.user.userId;

  if (!receiverId) {
    return res.status(400).json({ message: 'Receiver ID is required' });
  }

  if (senderId === receiverId) {
    return res.status(400).json({ message: 'You cannot add yourself' });
  }

  // Check existing friendships
  const existing = db.find('friendships', f => 
    (f.userSenderId === senderId && f.userReceiverId === receiverId) ||
    (f.userSenderId === receiverId && f.userReceiverId === senderId)
  );

  if (existing) {
    return res.status(400).json({ message: 'Friend request relationship already exists' });
  }

  const request = db.insert('friendships', {
    userSenderId: senderId,
    userReceiverId: receiverId,
    status: 'pending'
  });

  res.status(201).json(request);
});

// ACCEPT FRIEND REQUEST
router.post('/friends/accept', requireAuth, (req, res) => {
  const { friendshipId } = req.body;
  const currentUserId = req.user.userId;

  const f = db.find('friendships', r => r.id === friendshipId);
  if (!f) {
    return res.status(404).json({ message: 'Friend request not found' });
  }

  if (f.userReceiverId !== currentUserId) {
    return res.status(403).json({ message: 'You can only accept requests sent to you' });
  }

  const updated = db.update('friendships', friendshipId, { status: 'accepted' });
  res.json(updated);
});

// REJECT / CANCEL FRIEND REQUEST
router.post('/friends/reject', requireAuth, (req, res) => {
  const { friendshipId } = req.body;
  const currentUserId = req.user.userId;

  const f = db.find('friendships', r => r.id === friendshipId);
  if (!f) {
    return res.status(404).json({ message: 'Friend request not found' });
  }

  if (f.userSenderId !== currentUserId && f.userReceiverId !== currentUserId) {
    return res.status(403).json({ message: 'Access denied' });
  }

  db.delete('friendships', friendshipId);
  res.json({ message: 'Relationship removed' });
});

// ==================== CHAT MESSAGES ====================

// GET CHAT HISTORY WITH A FRIEND
router.get('/chat/:friendId', requireAuth, (req, res) => {
  const currentUserId = req.user.userId;
  const friendId = req.params.friendId;

  // Confirm friendship exists
  const isFriend = db.find('friendships', f => 
    f.status === 'accepted' && 
    ((f.userSenderId === currentUserId && f.userReceiverId === friendId) ||
     (f.userSenderId === friendId && f.userReceiverId === currentUserId))
  );

  if (!isFriend) {
    return res.status(403).json({ message: 'You are not friends with this user' });
  }

  const messages = db.filter('chat_messages', m => 
    (m.senderId === currentUserId && m.receiverId === friendId) ||
    (m.senderId === friendId && m.receiverId === currentUserId)
  );

  // Sort by timestamp asc
  const sorted = [...messages].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  res.json(sorted);
});

// SEND CHAT MESSAGE
router.post('/chat/:friendId', requireAuth, (req, res) => {
  const currentUserId = req.user.userId;
  const friendId = req.params.friendId;
  const { content, image, emoji } = req.body;

  // Confirm friendship exists
  const isFriend = db.find('friendships', f => 
    f.status === 'accepted' && 
    ((f.userSenderId === currentUserId && f.userReceiverId === friendId) ||
     (f.userSenderId === friendId && f.userReceiverId === currentUserId))
  );

  if (!isFriend) {
    return res.status(403).json({ message: 'You are not friends with this user' });
  }

  if (!content && !image && !emoji) {
    return res.status(400).json({ message: 'Message payload is empty' });
  }

  const newMessage = {
    senderId: currentUserId,
    receiverId: friendId,
    content: content || '',
    image: image || null, // base64
    emoji: emoji || null
  };

  const created = db.insert('chat_messages', newMessage);
  res.status(201).json(created);
});

export default router;
