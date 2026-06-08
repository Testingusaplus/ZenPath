import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { User } from '../types';
import { Camera, X, ShieldAlert, CheckCircle } from 'lucide-react';

interface Props {
  user: User;
  onClose: () => void;
  onSave: (user: User) => void;
  initialEditMode?: boolean;
}

// Country-State mapping database
const countryStateMap: Record<string, string[]> = {
  'USA': ['California', 'New York', 'Texas', 'Florida', 'Illinois', 'Washington', 'Massachusetts'],
  'India': ['West Bengal', 'Delhi', 'Maharashtra', 'Karnataka', 'Tamil Nadu', 'Uttar Pradesh', 'Gujarat'],
  'UK': ['England', 'Scotland', 'Wales', 'Northern Ireland'],
  'Canada': ['Ontario', 'Quebec', 'British Columbia', 'Alberta', 'Manitoba'],
  'Australia': ['New South Wales', 'Victoria', 'Queensland', 'Western Australia', 'South Australia']
};

const ProfileModal: React.FC<Props> = ({ user, onClose, onSave, initialEditMode = false }) => {
  const [editMode, setEditMode] = useState(initialEditMode);
  
  // Form state
  const [name, setName] = useState(user.name);
  const [mobile, setMobile] = useState(user.mobile || '');
  const [avatar, setAvatar] = useState(user.avatar || '');
  const [country, setCountry] = useState(user.country || 'USA');
  const [state, setState] = useState(user.state || 'California');
  const [zipCode, setZipCode] = useState(user.zipCode || '');
  const [gender, setGender] = useState(user.gender || 'Prefer not to say');
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-adjust state when country changes
  useEffect(() => {
    const availableStates = countryStateMap[country] || [];
    if (availableStates.length > 0 && !availableStates.includes(state)) {
      setState(availableStates[0]);
    }
  }, [country]);

  // Load avatar base64 upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError("Image size exceeds limit. Max size is 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
        setError('');
      };
      reader.readAsDataURL(file);
    }
  };

  const getZipLabel = () => {
    if (country === 'India') return 'Pin Code';
    if (country === 'USA') return 'Zip Code';
    return 'Postal Code';
  };

  const validatePostalCode = () => {
    if (country === 'India') {
      return /^\d{6}$/.test(zipCode);
    }
    if (country === 'USA') {
      return /^\d{5}$/.test(zipCode);
    }
    return /^[A-Z0-9 -]{3,10}$/i.test(zipCode);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Field validations
    if (!name.trim()) {
      setError("Name cannot be empty.");
      return;
    }

    if (zipCode && !validatePostalCode()) {
      const type = getZipLabel();
      const lengthMsg = country === 'India' ? '6 digits' : country === 'USA' ? '5 digits' : 'valid postal format';
      setError(`Invalid ${type} format. Must be a ${lengthMsg}.`);
      return;
    }

    setLoading(true);
    try {
      const updatedUser = await api.users.updateProfile({
        name,
        mobile,
        avatar,
        country,
        state,
        zipCode,
        gender
      });
      onSave(updatedUser);
      setSuccess("Profile successfully updated!");
      setTimeout(() => onClose(), 800);
    } catch (err: any) {
      setError(err.message || "Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-3xl shadow-2xl relative overflow-hidden animate-fade-in">
        
        {/* Modal Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <h2 className="font-outfit font-bold text-base text-gray-800 dark:text-white">
            {editMode ? 'Edit Profile & Settings' : 'My Profile Info'}
          </h2>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-full text-gray-400 dark:text-gray-500"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto max-h-[80dvh] space-y-4">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/40 rounded-2xl flex items-center gap-2 text-xs">
              <ShieldAlert size={14} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="p-3 bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400 border border-green-100 dark:border-green-900/40 rounded-2xl flex items-center gap-2 text-xs">
              <CheckCircle size={14} className="shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-4">
            
            {/* Avatar block with circular camera icon overlay */}
            <div className="flex flex-col items-center gap-2 pb-2">
              <div className="relative w-24 h-24 rounded-full overflow-hidden border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 group">
                <img src={avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} alt="Profile Avatar" className="w-full h-full object-cover" />
                {editMode && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 bg-black/45 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white"
                  >
                    <Camera size={20} />
                  </button>
                )}
              </div>
              {editMode && (
                <span className="text-[10px] text-gray-400 font-semibold">Hover avatar to change photo</span>
              )}
              <input 
                type="file" 
                ref={fileInputRef}
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden" 
              />
            </div>

            {/* Read-Only Mode Views */}
            {!editMode ? (
              <div className="space-y-3.5 text-xs text-gray-700 dark:text-gray-300">
                <div className="grid grid-cols-2 gap-3.5">
                  <div className="bg-gray-50 dark:bg-gray-950 p-3 rounded-2xl border border-transparent">
                    <span className="text-[10px] text-gray-400 block mb-0.5">Full Name</span>
                    <span className="font-bold text-gray-855 dark:text-white">{user.name}</span>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-950 p-3 rounded-2xl border border-transparent">
                    <span className="text-[10px] text-gray-400 block mb-0.5">Mobile Number</span>
                    <span className="font-bold text-gray-855 dark:text-white">{user.mobile || 'N/A'}</span>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-950 p-3 rounded-2xl border border-transparent">
                    <span className="text-[10px] text-gray-400 block mb-0.5">Country</span>
                    <span className="font-bold text-gray-855 dark:text-white">{user.country || 'USA'}</span>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-950 p-3 rounded-2xl border border-transparent">
                    <span className="text-[10px] text-gray-400 block mb-0.5">State/Province</span>
                    <span className="font-bold text-gray-855 dark:text-white">{user.state || 'California'}</span>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-950 p-3 rounded-2xl border border-transparent">
                    <span className="text-[10px] text-gray-400 block mb-0.5">{getZipLabel()}</span>
                    <span className="font-bold text-gray-855 dark:text-white">{user.zipCode || 'N/A'}</span>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-950 p-3 rounded-2xl border border-transparent">
                    <span className="text-[10px] text-gray-400 block mb-0.5">Gender</span>
                    <span className="font-bold text-gray-855 dark:text-white">{user.gender || 'Prefer not to say'}</span>
                  </div>
                </div>
                
                <button
                  type="button"
                  onClick={() => setEditMode(true)}
                  className="w-full py-3 bg-teal-50 text-teal-600 dark:bg-teal-950/20 dark:text-teal-400 hover:bg-teal-100 rounded-2xl text-xs font-bold font-outfit"
                >
                  Edit Profile Fields
                </button>
              </div>
            ) : (
              // Edit Form Fields
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 focus:border-teal-500 rounded-2xl px-4 py-3 outline-none text-xs text-gray-800 dark:text-white"
                    placeholder="Arindam Roy"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Mobile Number</label>
                  <input
                    type="tel"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 focus:border-teal-500 rounded-2xl px-4 py-3 outline-none text-xs text-gray-800 dark:text-white"
                    placeholder="+1 (555) 012-3456"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 focus:border-teal-500 rounded-2xl px-4 py-3 outline-none text-xs text-gray-800 dark:text-white cursor-pointer"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Non-binary">Non-binary</option>
                    <option value="Other">Other</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>

                {/* Smart Address Section */}
                <div className="border-t border-gray-100 dark:border-gray-800 pt-3 space-y-3">
                  <h4 className="font-outfit font-bold text-xs text-teal-600 dark:text-teal-400">Smart Address Details</h4>
                  
                  <div className="grid grid-cols-2 gap-3">
                    {/* Country Dropdown */}
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Country</label>
                      <select
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 focus:border-teal-500 rounded-2xl px-3 py-3 outline-none text-xs text-gray-800 dark:text-white cursor-pointer"
                      >
                        {Object.keys(countryStateMap).map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>

                    {/* State/Province Dropdown */}
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">State / Province</label>
                      <select
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 focus:border-teal-500 rounded-2xl px-3 py-3 outline-none text-xs text-gray-800 dark:text-white cursor-pointer"
                      >
                        {(countryStateMap[country] || []).map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Postal code field with dynamic label */}
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">{getZipLabel()}</label>
                    <input
                      type="text"
                      value={zipCode}
                      onChange={(e) => setZipCode(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 focus:border-teal-500 rounded-2xl px-4 py-3 outline-none text-xs text-gray-800 dark:text-white"
                      placeholder={country === 'India' ? '700001 (6-digit)' : country === 'USA' ? '94016 (5-digit)' : 'Alphanumeric'}
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditMode(false)}
                    className="flex-1 py-3 bg-gray-50 dark:bg-gray-850 hover:bg-gray-100 text-gray-500 rounded-2xl font-bold font-outfit text-xs border dark:border-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-3 bg-teal-500 hover:bg-teal-600 text-white rounded-2xl font-bold font-outfit text-xs active:scale-95 shadow-md shadow-teal-500/10"
                  >
                    {loading ? 'Saving...' : 'Save Settings'}
                  </button>
                </div>
              </div>
            )}

          </form>
        </div>

      </div>
    </div>
  );
};

export default ProfileModal;
