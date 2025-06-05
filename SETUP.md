# Messaging Setup Guide

## Architecture

This app now uses **Expo Router API routes** (similar to Next.js) for all database operations instead of direct client-side Supabase calls. This provides better security and reliability.

### API Endpoints
- `GET /api/users` - Get all users
- `POST /api/users` - Create/update user  
- `GET /api/conversations?userEmail=...` - Get user's conversations
- `POST /api/conversations` - Create new conversation
- `GET /api/messages?conversationId=...` - Get conversation messages
- `POST /api/messages` - Send new message
- `GET /api/test` - Test database connection

## Database Setup

1. **Update your Supabase keys** in `/spotify/env.ts`:
   - Make sure `SUPABASE_ANON_KEY` is your actual anon key (not service role)
   - Add `SUPABASE_SERVICE_KEY` for server-side operations

2. **Go to your Supabase dashboard** (https://app.supabase.com)

3. **Run the SQL schema** - Copy and paste the content from `supabase-schema.sql` into the SQL editor in your Supabase dashboard and execute it. This will create all the necessary tables:
   - `users` - Store user profiles
   - `conversations` - Store conversation metadata  
   - `messages` - Store music snippet messages

4. **Test the database connection** - In the app, tap the blue "Test DB" button to verify the connection works.

## How the New Messaging Flow Works

### 1. Starting a Chat
- Tap the "+" button on the home screen
- See all users in the database with their names and profile pictures
- Use the search bar to filter users by name or email
- Tap on a user to start a 1:1 chat

### 2. Sending Snippets  
- In any conversation, tap "Add Snippet" 
- Search for lyrics (e.g., "where have you been")
- Tap the blue "Send" button next to any search result
- The snippet appears as a beautiful card with lyrics, song info, and album art

### 3. Real-time Updates
- New messages appear instantly in conversations
- Conversation list updates with latest message info
- All data persists in Supabase database

## Testing the App

1. **Create test users** - The app automatically creates a user record when you sign in with Spotify
2. **Test database** - Use the "Test DB" button to verify connectivity
3. **Clear cache** - Use the "Clear" button to reset local conversation cache
4. **Check console** - Look for detailed logs about database operations

## Troubleshooting

### "Network request failed" errors
- Check your Supabase URL and service key in `/lib/supabase.ts`
- Verify the SQL schema has been applied to your database
- Make sure your Supabase project is not paused

### No users showing up
- Make sure you've run the database schema
- Check that other users have signed into the app (each Spotify login creates a user)
- Try the "Test DB" button to verify connection

### Messages not sending
- Verify you can see the conversation in the database
- Check console for detailed error messages
- Make sure both users exist in the `users` table

## Current Limitations
- Only music snippet messages (no text-only messages)
- 1:1 conversations only (no group chats yet)  
- Requires Spotify authentication for user management

The messaging system is now fully functional with real database persistence!