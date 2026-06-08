const SUPABASE_URL = process.env.SUPABASE_URL || 'https://jckpzseuiyaqwswlcsjs.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'sb_publishable_GlfluG1K9ftIrRjI-gil-A_hZr20CAz';

/**
 * Syncs a user record to the Supabase backend 'users' table.
 * Uses PostgREST upsert (Prefer: resolution=merge-dupes) to insert or update the record.
 * 
 * @param {object} user - The user object from the database.
 * @param {string} [plaintextPassword] - The optional plaintext password if available.
 */
export const syncUserToSupabase = async (user, plaintextPassword = null) => {
  try {
    const url = `${SUPABASE_URL}/rest/v1/users`;

    const body = {
      id: user.id,
      email: user.email,
      name: user.name,
      mobile: user.mobile || '',
      password: plaintextPassword || user.password || '',
      user_type: user.role || 'user',
      profile_photo: user.avatar || '',
      login_history: user.loginHistory || [user.lastLogin || new Date().toISOString()],
      last_login: user.lastLogin || new Date().toISOString(),
      country: user.country || '',
      state: user.state || '',
      zip_code: user.zipCode || '',
      gender: user.gender || 'Prefer not to say'
    };

    console.log(`[Supabase Sync] Upserting user ${user.email} to Supabase...`);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-dupes'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Supabase Sync Error] Failed to sync user: ${response.status} - ${errorText}`);
      return false;
    }

    console.log(`[Supabase Sync Success] User ${user.email} successfully synced.`);
    return true;
  } catch (error) {
    console.error(`[Supabase Sync Error] Exception during user sync:`, error);
    return false;
  }
};

/**
 * Fetches a user record from the Supabase backend by email.
 * 
 * @param {string} email - The email to search for.
 * @returns {Promise<object|null>} - The user object or null if not found.
 */
export const getUserByEmail = async (email) => {
  try {
    const url = `${SUPABASE_URL}/rest/v1/users?email=eq.${encodeURIComponent(email.toLowerCase())}&select=*`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    if (Array.isArray(data) && data.length > 0) {
      return data[0];
    }
    return null;
  } catch (error) {
    console.error(`[Supabase Get User Error] Exception:`, error);
    return null;
  }
};
