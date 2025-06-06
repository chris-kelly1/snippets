import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

export type User = {
  id: string;
  email: string;
  display_name: string;
  profile_image?: string;
  ai_voice_enabled?: boolean;
  voice_sample_url?: string;
  voice_model_id?: string;
  created_at: string;
  updated_at: string;
};

// Get or create current user in database directly via Supabase
export const ensureCurrentUserExists = async (): Promise<User | null> => {
  try {
    // Get current Spotify user
    const spotifyUserData = await AsyncStorage.getItem('@spotify_user');
    if (!spotifyUserData) {
      console.log('No Spotify user found');
      return null;
    }

    const spotifyUser = JSON.parse(spotifyUserData);
    console.log('Current Spotify user:', spotifyUser);

    // Check if user exists
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('email', spotifyUser.email)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error checking existing user:', fetchError);
      throw fetchError;
    }

    let user;
    if (existingUser) {
      // Update existing user
      const { data, error } = await supabase
        .from('users')
        .update({
          display_name: spotifyUser.display_name || spotifyUser.email.split('@')[0],
          profile_image: spotifyUser.profile_image,
        })
        .eq('email', spotifyUser.email)
        .select()
        .single();

      if (error) {
        console.error('Error updating user:', error);
        throw error;
      }
      user = data;
    } else {
      // Create new user
      const { data, error } = await supabase
        .from('users')
        .insert({
          id: spotifyUser.id,
          email: spotifyUser.email,
          display_name: spotifyUser.display_name || spotifyUser.email.split('@')[0],
          profile_image: spotifyUser.profile_image,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating user:', error);
        throw error;
      }
      user = data;
    }

    console.log('User created/updated successfully:', user);
    return user;

  } catch (error) {
    console.error('Error in ensureCurrentUserExists:', error);
    return null;
  }
};

// Get all users for conversation creation directly via Supabase
export const getAllUsers = async (): Promise<User[]> => {
  try {
    console.log('Fetching all users via Supabase...');
    
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .not('email', 'is', null)
      .not('display_name', 'is', null)
      .order('display_name');

    if (error) {
      console.error('Error fetching users:', error);
      throw error;
    }

    // Filter out users with invalid data
    const validUsers = (users || []).filter(user => 
      user.email && 
      user.email.trim() !== '' && 
      user.display_name && 
      user.display_name.trim() !== ''
    );

    console.log('Fetched valid users:', validUsers.length);
    return validUsers;
  } catch (error) {
    console.error('Error in getAllUsers:', error);
    return [];
  }
};

// Search users by name or email
export const searchUsers = async (query: string): Promise<User[]> => {
  try {
    if (!query.trim()) {
      return getAllUsers();
    }

    console.log('Searching users with query:', query);

    // For now, get all users and filter client-side
    // TODO: Add search endpoint to API
    const allUsers = await getAllUsers();
    const filteredUsers = allUsers.filter(user => 
      user.display_name.toLowerCase().includes(query.toLowerCase()) ||
      user.email.toLowerCase().includes(query.toLowerCase())
    );

    console.log('Filtered search results:', filteredUsers.length);
    return filteredUsers;
  } catch (error) {
    console.error('Error in searchUsers:', error);
    return [];
  }
};

// Update user profile with AI voice settings
export const updateUserProfile = async (
  userId: string,
  updates: Partial<Pick<User, 'display_name' | 'profile_image' | 'ai_voice_enabled' | 'voice_sample_url' | 'voice_model_id'>>
): Promise<User | null> => {
  try {
    console.log('Updating user profile:', userId, updates);
    
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }

    console.log('User profile updated successfully:', data);
    return data;
  } catch (error) {
    console.error('Error in updateUserProfile:', error);
    return null;
  }
};

// Test database connection via Supabase
export const testDatabaseConnection = async (): Promise<boolean> => {
  try {
    console.log('Testing database connection via Supabase...');
    
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('Supabase test failed:', error);
      return false;
    }

    console.log('✅ Supabase connection successful');
    return true;
  } catch (error) {
    console.error('❌ Supabase test error:', error);
    return false;
  }
};