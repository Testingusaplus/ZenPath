import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { User, SystemLog, SystemConfig, ApiKey } from '../../types';
import { LayoutDashboard, Users, Settings, Activity, LogOut, Shield, Key, Search, Ban, CheckCircle, Trash2, Smartphone, VolumeX, Mail } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface Props {
  onLogout: () => void;
}

const AdminDashboard: React.FC<Props> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'USERS' | 'SETTINGS' | 'LOGS'>('OVERVIEW');
  
  // Data States
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [config, setConfig] = useState<SystemConfig | null>(null);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [downloads, setDownloads] = useState<any[]>([]);

  // Search filter
  const [searchTerm, setSearchTerm] = useState('');

  // Settings & key rotation state
  const [newGeminiKey, setNewGeminiKey] = useState('');
  const [isEditingKey, setIsEditingKey] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  // API key generator state
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyPerms, setNewKeyPerms] = useState('read');
  const [newKeyRate, setNewKeyRate] = useState(60);

  // Notifications form state
  const [notifTarget, setNotifTarget] = useState('all');
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');

  useEffect(() => {
    loadAllAdminData();
  }, []);

  const loadAllAdminData = async () => {
    try {
      const statsData = await api.admin.getStats();
      setStats(statsData);

      const usersData = await api.admin.getUsers();
      setUsers(usersData);

      const logsData = await api.admin.getLogs();
      setLogs(logsData);

      const configData = await api.admin.getConfig();
      setConfig(configData);
      setMaintenanceMode(configData.maintenanceMode);

      const keysData = await api.admin.getApiKeys();
      setApiKeys(keysData);

      const downData = await api.admin.getDownloads();
      setDownloads(downData);
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleBan = async (userId: string, currentStatus?: string) => {
    const targetStatus = currentStatus === 'banned' ? 'active' : 'banned';
    if (confirm(`Are you sure you want to change this user status to ${targetStatus}?`)) {
      try {
        await api.admin.updateUserStatus(userId, targetStatus);
        loadAllAdminData();
      } catch (err) {
        alert("Action failed.");
      }
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (confirm("Are you sure you want to permanently delete this user profile and all associated logs/data? This action is irreversible.")) {
      try {
        await api.admin.deleteUser(userId);
        loadAllAdminData();
      } catch (err) {
        alert("Deletion failed.");
      }
    }
  };

  const handleUpdateConfig = async () => {
    try {
      await api.admin.updateConfig({
        maintenanceMode,
        ...(newGeminiKey ? { geminiApiKey: newGeminiKey } : {})
      });
      setNewGeminiKey('');
      setIsEditingKey(false);
      alert("System configurations successfully saved.");
      loadAllAdminData();
    } catch (err) {
      alert("Settings update failed.");
    }
  };

  const handleCreateApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;

    try {
      await api.admin.createApiKey({
        name: newKeyName,
        permissions: newKeyPerms,
        rateLimit: newKeyRate
      });
      setNewKeyName('');
      loadAllAdminData();
    } catch (err) {
      alert("API Key creation failed.");
    }
  };

  const handleRevokeApiKey = async (keyId: string) => {
    if (confirm("Are you sure you want to revoke this developer API key? Services using this key will be blocked.")) {
      try {
        await api.admin.deleteApiKey(keyId);
        loadAllAdminData();
      } catch (err) {
        alert("Revocation failed.");
      }
    }
  };

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifTitle.trim() || !notifMessage.trim()) return;

    try {
      await api.admin.sendNotification({
        targetGroup: notifTarget,
        title: notifTitle,
        message: notifMessage
      });
      setNotifTitle('');
      setNotifMessage('');
      alert("Notification broadcast request sent.");
      loadAllAdminData();
    } catch (err) {
      alert("Broadcast request failed.");
    }
  };

  const exportUsersCSV = () => {
    const headers = ['ID', 'Name', 'Email', 'Mobile', 'Role', 'Status', 'Plan', 'Country', 'Registered'];
    const rows = users.map(u => [
      u.id, u.name, u.email, u.mobile || 'N/A', u.role, u.status || 'active', u.isPremium ? 'Premium' : 'Free', u.country || 'USA', u.registeredAt || 'N/A'
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.map(cell => `"${cell}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `zenpath_users_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.mobile && u.mobile.includes(searchTerm)) ||
    u.id.includes(searchTerm)
  );

  // Prepare chart arrays
  const revenueChartData = stats?.monthlyRevenue?.map((rev: number, idx: number) => ({
    name: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'][idx] || 'Month',
    revenue: rev
  })) || [];

  const growthChartData = stats?.userGrowth?.map((gr: number, idx: number) => ({
    name: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'][idx] || 'Month',
    users: gr
  })) || [];

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100 overflow-hidden font-sans">
      
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col shrink-0">
        <div className="p-6 flex items-center gap-3 border-b border-gray-700">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">Z</div>
          <div>
            <h2 className="font-bold text-sm leading-none font-outfit text-white">ZenPath Portal</h2>
            <span className="text-[9px] text-gray-400 uppercase tracking-wider font-semibold">Super Admin Access</span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1.5">
          <button 
            onClick={() => setActiveTab('OVERVIEW')}
            className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-2xl text-xs font-bold font-outfit transition-all ${
              activeTab === 'OVERVIEW' ? 'bg-indigo-650 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-700 hover:text-white'
            }`}
          >
            <LayoutDashboard size={16} /> Overview
          </button>
          
          <button 
            onClick={() => setActiveTab('USERS')}
            className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-2xl text-xs font-bold font-outfit transition-all ${
              activeTab === 'USERS' ? 'bg-indigo-650 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-700 hover:text-white'
            }`}
          >
            <Users size={16} /> User Management
          </button>

          <button 
            onClick={() => setActiveTab('SETTINGS')}
            className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-2xl text-xs font-bold font-outfit transition-all ${
              activeTab === 'SETTINGS' ? 'bg-indigo-650 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-700 hover:text-white'
            }`}
          >
            <Settings size={16} /> System Control
          </button>

          <button 
            onClick={() => setActiveTab('LOGS')}
            className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-2xl text-xs font-bold font-outfit transition-all ${
              activeTab === 'LOGS' ? 'bg-indigo-650 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-700 hover:text-white'
            }`}
          >
            <Activity size={16} /> System Activity Logs
          </button>
        </nav>

        <div className="p-4 border-t border-gray-700">
          <button 
            onClick={() => { localStorage.removeItem('zp_token'); onLogout(); }}
            className="w-full flex items-center justify-center gap-2 text-red-405 hover:bg-red-950/20 py-2.5 rounded-xl text-xs font-bold border border-red-900/30 transition-colors"
          >
            <LogOut size={14} /> Exit Portal
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto bg-gray-900">
        
        <header className="bg-gray-800 border-b border-gray-700 px-6 py-4 flex justify-between items-center sticky top-0 z-20">
          <h1 className="text-base font-bold font-outfit">
            {activeTab === 'OVERVIEW' && 'Dashboard Overview'}
            {activeTab === 'USERS' && 'User Directory'}
            {activeTab === 'SETTINGS' && 'App Settings & Quotas'}
            {activeTab === 'LOGS' && 'System Error & Event Logs'}
          </h1>
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-[10px] uppercase font-bold text-gray-400">Secure Admin Session</span>
          </div>
        </header>

        <div className="p-6 space-y-6">
          
          {/* ==================== 1. OVERVIEW TAB ==================== */}
          {activeTab === 'OVERVIEW' && stats && (
            <div className="space-y-6">
              
              {/* Metrics Row */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gray-800 p-4 border border-gray-700 rounded-2xl">
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wide">Downloads</span>
                  <h3 className="text-xl font-bold font-outfit mt-1 text-white">{stats.totalDownloads}</h3>
                </div>
                <div className="bg-gray-800 p-4 border border-gray-700 rounded-2xl">
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wide">Total Users</span>
                  <h3 className="text-xl font-bold font-outfit mt-1 text-white">{stats.totalUsers}</h3>
                </div>
                <div className="bg-gray-800 p-4 border border-gray-700 rounded-2xl">
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wide">Premium Active</span>
                  <h3 className="text-xl font-bold font-outfit mt-1 text-indigo-400">{stats.premiumUsers}</h3>
                </div>
                <div className="bg-gray-800 p-4 border border-gray-700 rounded-2xl">
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wide">Simulated Sales</span>
                  <h3 className="text-xl font-bold font-outfit mt-1 text-green-400">${stats.totalRevenue}</h3>
                </div>
              </div>

              {/* Recharts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Revenue Growth line chart */}
                <div className="bg-gray-800 border border-gray-700 p-5 rounded-2xl space-y-4">
                  <h3 className="text-xs font-bold text-gray-300">Monthly Revenue Growth</h3>
                  <div className="h-60 w-full text-[10px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={revenueChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="name" stroke="#9ca3af" />
                        <YAxis stroke="#9ca3af" />
                        <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }} />
                        <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* User Growth bar chart */}
                <div className="bg-gray-800 border border-gray-700 p-5 rounded-2xl space-y-4">
                  <h3 className="text-xs font-bold text-gray-300">Active Users Acquisition</h3>
                  <div className="h-60 w-full text-[10px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={growthChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="name" stroke="#9ca3af" />
                        <YAxis stroke="#9ca3af" />
                        <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }} />
                        <Bar dataKey="users" fill="#6366f1" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

              </div>

              {/* Downloads Telemetry Logs */}
              <div className="bg-gray-800 border border-gray-700 rounded-2xl p-5 space-y-3">
                <h3 className="text-xs font-bold text-gray-300">Live Download Metrics</h3>
                <div className="overflow-x-auto text-[10px]">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-gray-700 text-gray-400 font-bold uppercase">
                        <th className="pb-2">Device Info</th>
                        <th className="pb-2">Location</th>
                        <th className="pb-2">IP Address</th>
                        <th className="pb-2">Channel</th>
                        <th className="pb-2">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-750">
                      {downloads.map(item => (
                        <tr key={item.id} className="text-gray-300">
                          <td className="py-2.5 flex items-center gap-1.5"><Smartphone size={12} /> {item.device}</td>
                          <td>{item.country} ({item.city})</td>
                          <td className="font-mono">{item.ip}</td>
                          <td>{item.source}</td>
                          <td>{new Date(item.time).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* ==================== 2. USERS TAB ==================== */}
          {activeTab === 'USERS' && (
            <div className="space-y-4">
              
              {/* Search and export controls */}
              <div className="flex justify-between items-center gap-4 bg-gray-800 p-4 rounded-2xl border border-gray-700 flex-col sm:flex-row">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-3 text-gray-500" size={16} />
                  <input
                    type="text"
                    placeholder="Search users by name, email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 focus:border-indigo-500 rounded-xl pl-9 pr-4 py-2 outline-none text-xs text-white"
                  />
                </div>
                <button 
                  onClick={exportUsersCSV}
                  className="bg-indigo-650 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold active:scale-95 shadow-sm whitespace-nowrap"
                >
                  Export Users CSV
                </button>
              </div>

              {/* Users Table */}
              <div className="bg-gray-800 border border-gray-700 rounded-2xl overflow-hidden text-[10px]">
                <table className="w-full text-left">
                  <thead className="bg-gray-750 text-gray-400 uppercase font-bold">
                    <tr>
                      <th className="p-4">User</th>
                      <th className="p-4">Email</th>
                      <th className="p-4">Role</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Plan</th>
                      <th className="p-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700 text-gray-300">
                    {filteredUsers.map(userItem => (
                      <tr key={userItem.id} className="hover:bg-gray-750/30">
                        <td className="p-4 font-bold text-white flex items-center gap-2">
                          <img src={userItem.avatar} alt="" className="w-6 h-6 rounded-full border border-gray-700" />
                          <span>{userItem.name}</span>
                        </td>
                        <td className="p-4 font-mono">{userItem.email}</td>
                        <td className="p-4 capitalize">{userItem.role}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-full font-bold uppercase ${
                            userItem.status === 'banned' ? 'bg-red-900/50 text-red-400' : 'bg-green-900/50 text-green-400'
                          }`}>
                            {userItem.status || 'active'}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={userItem.isPremium ? 'text-indigo-400 font-bold' : 'text-gray-500'}>
                            {userItem.isPremium ? 'Premium' : 'Free'}
                          </span>
                        </td>
                        <td className="p-4 flex gap-2 justify-center">
                          <button 
                            onClick={() => handleToggleBan(userItem.id, userItem.status)}
                            className={`p-1.5 rounded-lg border border-transparent transition-all ${
                              userItem.status === 'banned'
                                ? 'bg-green-900/30 text-green-400 border-green-800/30 hover:bg-green-900/50'
                                : 'bg-red-900/30 text-red-400 border-red-800/30 hover:bg-red-900/50'
                            }`}
                            title={userItem.status === 'banned' ? 'Unban User' : 'Ban User'}
                          >
                            {userItem.status === 'banned' ? <CheckCircle size={12} /> : <Ban size={12} />}
                          </button>
                          <button 
                            onClick={() => handleDeleteUser(userItem.id)}
                            className="p-1.5 bg-gray-700/50 text-red-400 border border-gray-600/30 rounded-lg hover:bg-red-950/20"
                            title="Delete Account"
                          >
                            <Trash2 size={12} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>
          )}

          {/* ==================== 3. SETTINGS TAB ==================== */}
          {activeTab === 'SETTINGS' && config && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Gemini Quota and config */}
              <div className="bg-gray-800 border border-gray-700 p-5 rounded-2xl space-y-4 h-max">
                <div className="flex items-center gap-2 border-b border-gray-750 pb-3">
                  <Key className="text-violet-500" size={18} />
                  <h3 className="font-outfit font-bold text-xs">Gemini Key Rotation</h3>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Active Google Gemini API Key</label>
                    <input 
                      type="text" 
                      value={isEditingKey ? newGeminiKey : (config.geminiApiKey || 'NOT CONFIGURED (Falls back to local mock replies)')}
                      onChange={(e) => setNewGeminiKey(e.target.value)}
                      disabled={!isEditingKey}
                      className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3.5 py-3 outline-none text-xs text-white font-mono"
                      placeholder="AIzaSy..."
                    />
                  </div>

                  <div className="flex gap-2">
                    {isEditingKey ? (
                      <>
                        <button 
                          onClick={handleUpdateConfig}
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-xs font-bold"
                        >
                          Save Key
                        </button>
                        <button 
                          onClick={() => { setIsEditingKey(false); setNewGeminiKey(''); }}
                          className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-xl text-xs font-bold"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button 
                        onClick={() => setIsEditingKey(true)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold"
                      >
                        Rotate / Update Key
                      </button>
                    )}
                  </div>
                </div>

                {/* Maintenance Mode Toggle */}
                <div className="border-t border-gray-750 pt-4 flex justify-between items-center">
                  <div>
                    <h4 className="text-xs font-bold text-white">Maintenance Mode</h4>
                    <p className="text-[10px] text-gray-400">Lock non-admin users from accessing app resources.</p>
                  </div>
                  <button
                    onClick={() => {
                      setMaintenanceMode(!maintenanceMode);
                      api.admin.updateConfig({ maintenanceMode: !maintenanceMode }).then(() => {
                        alert(`Maintenance mode turned ${!maintenanceMode ? 'ON' : 'OFF'}`);
                        loadAllAdminData();
                      });
                    }}
                    className={`w-12 h-6 rounded-full p-1 transition-all ${
                      maintenanceMode ? 'bg-red-500' : 'bg-gray-700'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white transition-all transform ${
                      maintenanceMode ? 'translate-x-6' : 'translate-x-0'
                    }`}></div>
                  </button>
                </div>
              </div>

              {/* Notification Center */}
              <div className="bg-gray-800 border border-gray-700 p-5 rounded-2xl space-y-4">
                <div className="flex items-center gap-2 border-b border-gray-750 pb-3">
                  <Mail className="text-indigo-500" size={18} />
                  <h3 className="font-outfit font-bold text-xs">Broadcast Notifications</h3>
                </div>

                <form onSubmit={handleSendNotification} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Target Group</label>
                    <select
                      value={notifTarget}
                      onChange={(e) => setNotifTarget(e.target.value)}
                      className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2.5 text-white outline-none"
                    >
                      <option value="all">📢 All Registered Users</option>
                      <option value="premium">💎 Paid Premium Users Only</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Notification Title</label>
                    <input 
                      type="text" 
                      value={notifTitle}
                      onChange={(e) => setNotifTitle(e.target.value)}
                      placeholder="e.g. Schedule Maintenance Notice"
                      className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3.5 py-2.5 text-white outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Notification Message</label>
                    <textarea 
                      value={notifMessage}
                      onChange={(e) => setNotifMessage(e.target.value)}
                      placeholder="Type details to broadcast..."
                      className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3.5 py-2.5 text-white outline-none h-20 resize-none"
                      required
                    />
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-3 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl font-bold font-outfit text-xs active:scale-98 transition-all"
                  >
                    Broadcast System Announcement
                  </button>
                </form>
              </div>

              {/* Developer API Key Generation */}
              <div className="bg-gray-800 border border-gray-700 p-5 rounded-2xl space-y-4 lg:col-span-2">
                <div className="flex items-center gap-2 border-b border-gray-750 pb-3">
                  <Shield className="text-emerald-500" size={18} />
                  <h3 className="font-outfit font-bold text-xs">Developer SDK Access Keys</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* Create New Key Form */}
                  <form onSubmit={handleCreateApiKey} className="space-y-3 text-xs md:col-span-1 border-r border-gray-750 pr-4">
                    <h4 className="font-bold text-white mb-2">Issue New Token</h4>
                    <div>
                      <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Key Descriptor Name</label>
                      <input 
                        type="text" 
                        value={newKeyName}
                        onChange={(e) => setNewKeyName(e.target.value)}
                        placeholder="e.g. Web-iOS-Bridge"
                        className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-white outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Permissions</label>
                      <select
                        value={newKeyPerms}
                        onChange={(e) => setNewKeyPerms(e.target.value)}
                        className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-white outline-none"
                      >
                        <option value="read">Read Only</option>
                        <option value="write">Read & Write</option>
                        <option value="admin">Admin Level</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Rate Limit (req/min)</label>
                      <input 
                        type="number" 
                        value={newKeyRate}
                        onChange={(e) => setNewKeyRate(parseInt(e.target.value) || 60)}
                        className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-white outline-none"
                      />
                    </div>
                    <button 
                      type="submit"
                      className="w-full bg-emerald-650 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl active:scale-95"
                    >
                      Generate API Key
                    </button>
                  </form>

                  {/* Active Keys Table */}
                  <div className="md:col-span-2 overflow-x-auto text-[10px]">
                    <h4 className="font-bold text-white mb-2.5">Active Client Keys</h4>
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-gray-700 text-gray-400 font-bold">
                          <th className="pb-1.5">Descriptor</th>
                          <th className="pb-1.5">API Client Token</th>
                          <th className="pb-1.5">Scope</th>
                          <th className="pb-1.5">Limit</th>
                          <th className="pb-1.5 text-center">Revoke</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-750 text-gray-300">
                        {apiKeys.map(key => (
                          <tr key={key.id}>
                            <td className="py-2 font-bold">{key.name}</td>
                            <td className="font-mono text-indigo-305">{key.apiKey}</td>
                            <td className="capitalize">{key.permissions}</td>
                            <td>{key.rateLimit} rpm</td>
                            <td className="text-center">
                              <button 
                                onClick={() => handleRevokeApiKey(key.id)}
                                className="text-red-400 hover:text-red-500 font-bold hover:underline"
                              >
                                Revoke
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                </div>
              </div>

            </div>
          )}

          {/* ==================== 4. LOGS TAB ==================== */}
          {activeTab === 'LOGS' && (
            <div className="bg-gray-800 border border-gray-700 rounded-2xl overflow-hidden text-[9px] font-mono">
              <table className="w-full text-left">
                <thead className="bg-gray-750 text-gray-400 uppercase font-bold">
                  <tr>
                    <th className="p-4">Timestamp</th>
                    <th className="p-4">Action</th>
                    <th className="p-4">Origin Admin</th>
                    <th className="p-4">Details</th>
                    <th className="p-4">Severity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-750 text-gray-300">
                  {logs.map(log => (
                    <tr key={log.id} className="hover:bg-gray-750/30">
                      <td className="p-4 text-gray-500 whitespace-nowrap">{new Date(log.timestamp).toLocaleString()}</td>
                      <td className="p-4 font-bold text-white">{log.action}</td>
                      <td className="p-4">{log.admin}</td>
                      <td className="p-4 text-gray-400 leading-normal max-w-[280px] break-words">{log.details}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-[8px] uppercase font-bold ${
                          log.type === 'error' ? 'bg-red-900/50 text-red-400' :
                          log.type === 'warning' ? 'bg-orange-900/50 text-orange-400' :
                          log.type === 'security' ? 'bg-purple-900/50 text-purple-400' :
                          'bg-blue-900/50 text-blue-400'
                        }`}>
                          {log.type}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {logs.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-gray-500">No logs found on the backend.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

        </div>
      </main>

    </div>
  );
};

export default AdminDashboard;
