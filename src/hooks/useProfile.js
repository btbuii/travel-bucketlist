import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export function useProfileByUsername(username) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProfile = useCallback(async () => {
    if (!username || !isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    try {
      setError(null);
      setLoading(true);
      const { data, error: err } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .single();
      if (err) throw err;
      setProfile(data);
    } catch (err) {
      setError(err.message);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [username]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const updateProfile = useCallback(async (fields) => {
    if (!profile || !isSupabaseConfigured) return;
    setProfile((prev) => ({ ...prev, ...fields }));
    try {
      const { error: err } = await supabase
        .from('profiles')
        .update(fields)
        .eq('id', profile.id);
      if (err) throw err;
    } catch (err) {
      console.error('updateProfile failed, reverting:', err);
      await fetchProfile();
      throw err;
    }
  }, [profile, fetchProfile]);

  return { profile, loading, error, updateProfile, refetch: fetchProfile };
}

export async function fetchAllProfiles() {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at');
  if (error) throw error;
  return data || [];
}

export async function createProfile(userId, username, displayName) {
  if (!isSupabaseConfigured) return;
  const slug = username.toLowerCase().replace(/[^a-z0-9-]/g, '');
  const { error } = await supabase.from('profiles').insert({
    id: userId,
    username: slug,
    display_name: displayName || '',
  });
  if (error) throw error;
  return slug;
}
