const SUPABASE_URL = process.env.SUPABASE_URL || 'https://jckpzseuiyaqwswlcsjs.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'sb_publishable_GlfluG1K9ftIrRjI-gil-A_hZr20CAz';

/**
 * Syncs a user record to the Supabase backend.
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
      role: user.role || 'user',
      avatar: user.avatar || '',
      country: user.country || '',
      state: user.state || '',
      zip_code: user.zipCode || '',
      gender: user.gender || 'Prefer not to say',
      registered_at: user.registeredAt || new Date().toISOString(),
      last_login: user.lastLogin || new Date().toISOString()
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
 * Appends a new login history entry for a user in the Supabase backend.
 * 
 * @param {object} user - The user object logging in.
 */
export const addLoginHistoryToSupabase = async (user) => {
  try {
    const url = `${SUPABASE_URL}/rest/v1/login_history`;
    const body = {
      user_id: user.id,
      email: user.email,
      login_time: new Date().toISOString(),
      country: user.country || '',
      state: user.state || '',
      zip_code: user.zipCode || ''
    };

    console.log(`[Supabase Sync] Logging login history for ${user.email} to Supabase...`);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Supabase Sync Error] Failed to log login history: ${response.status} - ${errorText}`);
      return false;
    }

    console.log(`[Supabase Sync Success] Login history logged for ${user.email}.`);
    return true;
  } catch (error) {
    console.error(`[Supabase Sync Error] Exception during login history logging:`, error);
    return false;
  }
};
