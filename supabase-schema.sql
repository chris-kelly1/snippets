-- Supabase schema for messaging functionality
-- Run this SQL in your Supabase dashboard to set up the database

-- Users table (for profile management)
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    display_name TEXT,
    profile_image TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Conversations table
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    participants TEXT[] NOT NULL,
    created_by TEXT NOT NULL,
    last_message_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages table (for music snippets)
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id TEXT NOT NULL,
    sender_email TEXT NOT NULL,
    sender_name TEXT NOT NULL,
    lyrics TEXT[] NOT NULL,
    song_title TEXT NOT NULL,
    artist TEXT NOT NULL,
    album_cover TEXT,
    audio_url TEXT,
    spotify_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key constraint for last_message_id
ALTER TABLE public.conversations 
ADD CONSTRAINT conversations_last_message_id_fkey 
FOREIGN KEY (last_message_id) REFERENCES public.messages(id) ON DELETE SET NULL;

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_conversations_participants ON public.conversations USING GIN (participants);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages (conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages (created_at);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON public.conversations (updated_at);

-- Disable Row Level Security for now to allow service role access
-- You can enable RLS later with proper policies if needed
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages DISABLE ROW LEVEL SECURITY;

-- If you want to enable RLS later, use these policies:
-- ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- CREATE POLICY "Users can view all users" ON public.users FOR SELECT USING (true);
-- CREATE POLICY "Users can insert users" ON public.users FOR INSERT WITH CHECK (true);
-- CREATE POLICY "Users can update users" ON public.users FOR UPDATE USING (true);

-- CREATE POLICY "Users can view all conversations" ON public.conversations FOR SELECT USING (true);
-- CREATE POLICY "Users can insert conversations" ON public.conversations FOR INSERT WITH CHECK (true);
-- CREATE POLICY "Users can update conversations" ON public.conversations FOR UPDATE USING (true);

-- CREATE POLICY "Users can view all messages" ON public.messages FOR SELECT USING (true);
-- CREATE POLICY "Users can insert messages" ON public.messages FOR INSERT WITH CHECK (true);

-- Function to update conversation timestamp when message is added
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.conversations 
    SET updated_at = NOW()
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update conversation timestamp
CREATE TRIGGER update_conversation_timestamp_trigger
    AFTER INSERT ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_timestamp();