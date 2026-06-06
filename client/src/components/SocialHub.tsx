import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { User, Post, Friendship, ChatMessage } from '../types';
import { Send, Image, Smile, MessageCircle, Heart, UserPlus, Check, X, Award, Users, MessageSquare } from 'lucide-react';

interface Props {
  user: User;
}

const SocialHub: React.FC<Props> = ({ user }) => {
  const [activeSubTab, setActiveSubTab] = useState<'feed' | 'friends' | 'chat'>('feed');
  
  // --- Feed State ---
  const [posts, setPosts] = useState<Post[]>([]);
  const [postContent, setPostContent] = useState('');
  const [activeCommentsDrawer, setActiveCommentsDrawer] = useState<string | null>(null);
  const [commentContent, setCommentContent] = useState('');

  // --- Friends State ---
  const [friends, setFriends] = useState<Friendship[]>([]);
  const [pendingSent, setPendingSent] = useState<Friendship[]>([]);
  const [pendingReceived, setPendingReceived] = useState<Friendship[]>([]);
  const [suggestions, setSuggestions] = useState<User[]>([]);

  // --- Chat State ---
  const [activeChatFriend, setActiveChatFriend] = useState<Friendship | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [chatImageBase64, setChatImageBase64] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Emojis list
  const emojis = ['😊', '🙏', '❤️', '🔥', '💪', '🌿', '✨', '🌱', '☀️', '🌸', '🎉', '💡'];

  useEffect(() => {
    loadFeed();
    loadFriendsData();
  }, []);

  useEffect(() => {
    if (activeSubTab === 'chat' && activeChatFriend) {
      loadChatHistory(activeChatFriend.id);
      // Set polling or interval for chat
      const timer = setInterval(() => {
        loadChatHistory(activeChatFriend.id);
      }, 3000);
      return () => clearInterval(timer);
    }
  }, [activeSubTab, activeChatFriend]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // --- API HANDLERS ---

  const loadFeed = async () => {
    try {
      const data = await api.social.getPosts();
      setPosts(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postContent.trim()) return;
    try {
      await api.social.createPost(postContent);
      setPostContent('');
      loadFeed();
    } catch (err) {
      console.error(err);
    }
  };

  const handleLikePost = async (postId: string) => {
    try {
      await api.social.likePost(postId);
      loadFeed();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddComment = async (postId: string) => {
    if (!commentContent.trim()) return;
    try {
      await api.social.addComment(postId, commentContent);
      setCommentContent('');
      loadFeed();
    } catch (err) {
      console.error(err);
    }
  };

  const loadFriendsData = async () => {
    try {
      const data = await api.social.getFriends();
      setFriends(data.friends);
      setPendingSent(data.pendingSent);
      setPendingReceived(data.pendingReceived);
      setSuggestions(data.suggestions);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendFriendRequest = async (peerId: string) => {
    try {
      await api.social.sendFriendRequest(peerId);
      loadFriendsData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAcceptRequest = async (friendshipId: string) => {
    try {
      await api.social.acceptFriendRequest(friendshipId);
      loadFriendsData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRejectRequest = async (friendshipId: string) => {
    try {
      await api.social.rejectFriendRequest(friendshipId);
      loadFriendsData();
    } catch (err) {
      console.error(err);
    }
  };

  const loadChatHistory = async (friendId: string) => {
    try {
      const msgs = await api.social.getChatMessages(friendId);
      setChatMessages(msgs);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChatFriend) return;
    if (!messageInput.trim() && !chatImageBase64) return;

    try {
      await api.social.sendChatMessage(activeChatFriend.id, {
        content: messageInput,
        image: chatImageBase64 || undefined
      });
      setMessageInput('');
      setChatImageBase64(null);
      setShowEmojiPicker(false);
      loadChatHistory(activeChatFriend.id);
    } catch (err) {
      console.error(err);
    }
  };

  // Chat image handling
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setChatImageBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const insertEmoji = (emoji: string) => {
    setMessageInput(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden bg-gray-50 dark:bg-gray-950 pb-20">
      
      {/* Social Sub Navigation */}
      <div className="shrink-0 flex border-b border-gray-100 dark:border-gray-900 bg-white dark:bg-gray-900 sticky top-0 z-10 px-4 py-2 gap-2">
        <button 
          onClick={() => setActiveSubTab('feed')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold font-outfit border transition-all ${
            activeSubTab === 'feed'
              ? 'bg-teal-500 text-white border-transparent shadow-sm'
              : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 text-gray-500 hover:text-gray-700'
          }`}
        >
          <MessageSquare size={16} />
          <span>Timeline</span>
        </button>
        <button 
          onClick={() => { setActiveSubTab('friends'); loadFriendsData(); }}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold font-outfit border transition-all ${
            activeSubTab === 'friends'
              ? 'bg-teal-500 text-white border-transparent shadow-sm'
              : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 text-gray-500 hover:text-gray-700'
          }`}
        >
          <Users size={16} />
          <span>Friends</span>
        </button>
        <button 
          onClick={() => { setActiveSubTab('chat'); loadFriendsData(); }}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold font-outfit border transition-all ${
            activeSubTab === 'chat'
              ? 'bg-teal-500 text-white border-transparent shadow-sm'
              : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 text-gray-500 hover:text-gray-700'
          }`}
        >
          <MessageCircle size={16} />
          <span>Direct Chat</span>
        </button>
      </div>

      <div className="flex-1 overflow-hidden">
        
        {/* ==================== 1. POST FEED VIEW ==================== */}
        {activeSubTab === 'feed' && (
          <div className="h-full overflow-y-auto p-4 space-y-4">
            
            {/* Create Post Form */}
            <form onSubmit={handleCreatePost} className="bg-white dark:bg-gray-900 p-4 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-3">
              <textarea
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                placeholder="Share a thought, positive quote, or wellness milestone..."
                className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-100 dark:border-gray-800 rounded-2xl p-3 outline-none text-xs text-gray-800 dark:text-white resize-none h-20"
              />
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-gray-400">Posts are shared with ZenPath community.</span>
                <button 
                  type="submit"
                  className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm active:scale-95 transition-all flex items-center gap-1"
                >
                  <Send size={12} /> Post
                </button>
              </div>
            </form>

            {/* Posts Feed list */}
            <div className="space-y-4">
              {posts.map(post => (
                <div key={post.id} className="bg-white dark:bg-gray-900 p-4 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-3">
                  {/* Author detail */}
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-100 bg-gray-100 dark:border-gray-800">
                        <img src={post.userAvatar} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-gray-800 dark:text-white flex items-center gap-1.5">
                          {post.userName}
                          {post.achievements && post.achievements.length > 0 && (
                            <span className="bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 p-0.5 rounded-full" title="Achievement Unlocked">
                              <Award size={12} />
                            </span>
                          )}
                        </h4>
                        <span className="text-[10px] text-gray-400 font-semibold">
                          {new Date(post.timestamp).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Post Content */}
                  <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                    {post.content}
                  </p>

                  {/* Like/Comment Buttons */}
                  <div className="flex gap-4 pt-1 text-[11px] font-bold text-gray-500 border-t border-gray-50 dark:border-gray-800">
                    <button 
                      onClick={() => handleLikePost(post.id)}
                      className={`flex items-center gap-1.5 ${post.likes.includes(user.id) ? 'text-red-500' : 'hover:text-red-500'}`}
                    >
                      <Heart size={14} className={post.likes.includes(user.id) ? 'fill-current' : ''} />
                      <span>{post.likes.length} Likes</span>
                    </button>
                    <button 
                      onClick={() => setActiveCommentsDrawer(activeCommentsDrawer === post.id ? null : post.id)}
                      className="flex items-center gap-1.5 hover:text-teal-500"
                    >
                      <MessageSquare size={14} />
                      <span>{post.comments ? post.comments.length : 0} Comments</span>
                    </button>
                  </div>

                  {/* Comments Section (Drawer layout style under the post) */}
                  {activeCommentsDrawer === post.id && (
                    <div className="pt-3 border-t border-gray-50 dark:border-gray-800 space-y-3">
                      {/* Comments List */}
                      <div className="space-y-2.5 max-h-36 overflow-y-auto pr-1">
                        {post.comments && post.comments.map(comment => (
                          <div key={comment.id} className="bg-gray-50 dark:bg-gray-950 p-2.5 rounded-2xl flex items-start gap-2 text-[11px]">
                            <div className="w-6 h-6 rounded-full overflow-hidden border border-gray-100 bg-gray-100 dark:border-gray-800 shrink-0">
                              <img src={comment.userAvatar} alt="" className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 space-y-0.5">
                              <div className="flex justify-between">
                                <span className="font-bold text-gray-800 dark:text-white">{comment.userName}</span>
                                <span className="text-[9px] text-gray-400">{new Date(comment.timestamp).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                              <p className="text-gray-655 dark:text-gray-300 leading-relaxed">{comment.content}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Comment input form */}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={commentContent}
                          onChange={(e) => setCommentContent(e.target.value)}
                          placeholder="Write a comment..."
                          className="flex-1 bg-gray-50 dark:bg-gray-950 border border-gray-100 dark:border-gray-800 rounded-xl px-3 py-2 outline-none text-[11px] text-gray-800 dark:text-white"
                        />
                        <button 
                          onClick={() => handleAddComment(post.id)}
                          className="bg-teal-500 hover:bg-teal-600 text-white px-3.5 rounded-xl text-[11px] font-bold"
                        >
                          Send
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              ))}
            </div>

          </div>
        )}

        {/* ==================== 2. FRIENDS VIEW ==================== */}
        {activeSubTab === 'friends' && (
          <div className="h-full overflow-y-auto p-4 space-y-6">
            
            {/* Pending Requests Received */}
            {pendingReceived.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Friend Requests ({pendingReceived.length})</h3>
                <div className="space-y-2">
                  {pendingReceived.map(req => (
                    <div key={req.friendshipId} className="bg-white dark:bg-gray-900 p-3 rounded-2xl border border-gray-100 dark:border-gray-855 flex items-center justify-between shadow-sm">
                      <div className="flex items-center gap-2.5">
                        <img src={req.avatar} alt="" className="w-8 h-8 rounded-full border bg-gray-100" />
                        <div>
                          <h4 className="text-xs font-bold text-gray-800 dark:text-white">{req.name}</h4>
                          <span className="text-[9px] text-gray-400 truncate max-w-[120px] block">{req.email}</span>
                        </div>
                      </div>
                      <div className="flex gap-1.5">
                        <button 
                          onClick={() => handleAcceptRequest(req.friendshipId)}
                          className="bg-teal-500 text-white p-2 rounded-xl active:scale-95 shadow-sm"
                        >
                          <Check size={14} />
                        </button>
                        <button 
                          onClick={() => handleRejectRequest(req.friendshipId)}
                          className="bg-red-50 text-red-500 p-2 rounded-xl active:scale-95 border border-red-100"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Friend Suggestions / User Directory */}
            {suggestions.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Find Friends</h3>
                <div className="space-y-2">
                  {suggestions.map(peer => (
                    <div key={peer.id} className="bg-white dark:bg-gray-900 p-3 rounded-2xl border border-gray-100 dark:border-gray-855 flex items-center justify-between shadow-sm">
                      <div className="flex items-center gap-2.5">
                        <img src={peer.avatar} alt="" className="w-8 h-8 rounded-full border bg-gray-100" />
                        <div>
                          <h4 className="text-xs font-bold text-gray-800 dark:text-white">{peer.name}</h4>
                          <span className="text-[9px] text-gray-400 truncate max-w-[120px] block">{peer.email}</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleSendFriendRequest(peer.id)}
                        className="bg-teal-50 text-teal-600 dark:bg-teal-950/20 dark:text-teal-400 border border-teal-100 dark:border-teal-900 text-xs font-bold px-3 py-1.5 rounded-xl active:scale-95 transition-all flex items-center gap-1"
                      >
                        <UserPlus size={12} /> Add
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Friends list */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">My Friends ({friends.length})</h3>
              {friends.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">No friends added yet. Send requests from the suggestions directory!</p>
              ) : (
                <div className="space-y-2">
                  {friends.map(friend => (
                    <div key={friend.friendshipId} className="bg-white dark:bg-gray-900 p-3 rounded-2xl border border-gray-100 dark:border-gray-855 flex items-center justify-between shadow-sm">
                      <div className="flex items-center gap-2.5">
                        <img src={friend.avatar} alt="" className="w-8 h-8 rounded-full border bg-gray-100" />
                        <div>
                          <h4 className="text-xs font-bold text-gray-800 dark:text-white">{friend.name}</h4>
                          <span className="text-[9px] text-gray-400 truncate max-w-[120px] block">{friend.email}</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => { setActiveChatFriend(friend); setActiveSubTab('chat'); }}
                        className="bg-teal-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold active:scale-95 shadow-sm"
                      >
                        Chat
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {/* ==================== 3. CHAT VIEW ==================== */}
        {activeSubTab === 'chat' && (
          <div className="h-full flex flex-col overflow-hidden">
            
            {/* If no chat friend active, show contact list */}
            {!activeChatFriend ? (
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Select Friend to Chat</h3>
                {friends.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-6">You must add a friend before starting a chat.</p>
                ) : (
                  friends.map(friend => (
                    <button
                      key={friend.friendshipId}
                      onClick={() => setActiveChatFriend(friend)}
                      className="w-full bg-white dark:bg-gray-900 p-3.5 rounded-2xl border border-gray-100 dark:border-gray-800 flex items-center gap-3 shadow-sm hover:border-teal-200 transition-colors"
                    >
                      <img src={friend.avatar} alt="" className="w-10 h-10 rounded-full border bg-gray-100" />
                      <div className="text-left flex-1">
                        <h4 className="text-xs font-bold text-gray-800 dark:text-white">{friend.name}</h4>
                        <p className="text-[10px] text-gray-400 truncate">Tap to open secure wellness chat</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            ) : (
              // Chat Thread view
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Chat Top bar */}
                <div className="shrink-0 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-4 py-3 flex items-center gap-3">
                  <button 
                    onClick={() => setActiveChatFriend(null)}
                    className="text-xs text-gray-400 hover:text-gray-600 font-bold"
                  >
                    &larr; Contacts
                  </button>
                  <div className="flex items-center gap-2">
                    <img src={activeChatFriend.avatar} alt="" className="w-8 h-8 rounded-full border" />
                    <div>
                      <h4 className="text-xs font-bold text-gray-800 dark:text-white leading-none">{activeChatFriend.name}</h4>
                      <span className="text-[8px] text-green-500 font-bold">Secure Session</span>
                    </div>
                  </div>
                </div>

                {/* Messages Box */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {chatMessages.map(msg => {
                    const isMe = msg.senderId === user.id;
                    return (
                      <div 
                        key={msg.id} 
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        <div 
                          className={`max-w-[75%] p-3 rounded-2xl text-xs space-y-1.5 ${
                            isMe 
                              ? 'bg-teal-500 text-white rounded-tr-none' 
                              : 'bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 text-gray-800 dark:text-gray-200 rounded-tl-none'
                          }`}
                        >
                          {/* Chat Image */}
                          {msg.image && (
                            <div className="rounded-xl overflow-hidden mb-1 border dark:border-gray-800">
                              <img src={msg.image} alt="Sent file" className="w-full max-h-40 object-cover" />
                            </div>
                          )}
                          {/* Chat Text */}
                          {msg.content && <p className="leading-relaxed">{msg.content}</p>}
                        </div>
                        <span className="text-[8px] text-gray-400 mt-0.5 px-1 font-semibold">
                          {new Date(msg.timestamp).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    );
                  })}
                  <div ref={chatEndRef} />
                </div>

                {/* Image upload preview */}
                {chatImageBase64 && (
                  <div className="shrink-0 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 p-2.5 flex items-center gap-3 relative">
                    <div className="w-16 h-16 rounded-xl overflow-hidden border border-gray-100 bg-gray-100">
                      <img src={chatImageBase64} alt="Upload preview" className="w-full h-full object-cover" />
                    </div>
                    <span className="text-[10px] text-gray-400">Selected image attachment</span>
                    <button 
                      onClick={() => setChatImageBase64(null)}
                      className="absolute top-2 right-2 bg-red-100 text-red-600 hover:bg-red-200 p-1 rounded-full"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}

                {/* Emojis selector box */}
                {showEmojiPicker && (
                  <div className="shrink-0 bg-white dark:bg-gray-900 border-t border-gray-150 p-3 grid grid-cols-6 gap-2">
                    {emojis.map(emoji => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => insertEmoji(emoji)}
                        className="text-lg hover:bg-gray-50 dark:hover:bg-gray-850 p-1.5 rounded-lg active:scale-95 transition-all"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}

                {/* Message send form */}
                <form onSubmit={handleSendChatMessage} className="shrink-0 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 p-3 flex gap-2 items-center">
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden" 
                  />
                  <button
                    type="button"
                    onClick={triggerFileInput}
                    className="p-2.5 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-400 dark:text-gray-500 rounded-xl"
                  >
                    <Image size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="p-2.5 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-400 dark:text-gray-500 rounded-xl"
                  >
                    <Smile size={18} />
                  </button>
                  
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 bg-gray-50 dark:bg-gray-950 border border-gray-100 dark:border-gray-800 rounded-2xl px-4 py-2.5 outline-none text-xs text-gray-800 dark:text-white"
                  />
                  
                  <button
                    type="submit"
                    className="bg-teal-500 hover:bg-teal-600 text-white p-2.5 rounded-xl shadow-sm shadow-teal-500/10 active:scale-95"
                  >
                    <Send size={16} />
                  </button>
                </form>
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
};

export default SocialHub;
