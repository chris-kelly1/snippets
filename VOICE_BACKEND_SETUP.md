# Voice & AI Backend Setup

Your app now uses the backend API for all voice/AI operations instead of handling uploads directly in React Native.

## New API Endpoints Added

### 1. Upload Voice Sample
**Endpoint**: `POST /upload-voice-sample`

**Purpose**: Upload user voice sample and create ElevenLabs voice clone

**Usage**: 
- Used in Profile screen when user records voice sample
- Handles file upload, Supabase storage, and ElevenLabs voice cloning

**Parameters**:
- `user_id`: User ID (form field)
- `user_name`: Display name for voice clone (form field)  
- `file`: Audio file (multipart upload)

**Response**:
```json
{
  "success": true,
  "voice_sample_url": "https://supabase.co/storage/voice-samples/...",
  "voice_model_id": "voice_clone_12345_1234567890"
}
```

### 2. Generate AI Voice
**Endpoint**: `POST /generate-ai-voice`

**Purpose**: Generate AI speech using ElevenLabs TTS

**Usage**:
- Used in Search screen when user sends message with AI voice enabled
- Converts lyrics text to speech using user's voice clone

**Request Body**:
```json
{
  "text": "Lyric text to convert to speech",
  "voice_model_id": "voice_clone_12345_1234567890",
  "voice_settings": {
    "stability": 0.75,
    "similarity_boost": 0.8,
    "style": 0.0,
    "use_speaker_boost": true
  }
}
```

**Response**:
```json
{
  "success": true,
  "audio_url": "https://supabase.co/storage/ai-messages/..."
}
```

## TODO: Backend Implementation

You need to implement these functions in your backend:

### In `upload-voice-sample` endpoint:
1. **Upload to Supabase**: Replace placeholder with actual Supabase voice-samples bucket upload
2. **ElevenLabs Voice Clone**: Replace placeholder with actual ElevenLabs voice cloning API call

### In `generate-ai-voice` endpoint:
1. **ElevenLabs TTS**: Replace placeholder with actual ElevenLabs text-to-speech API call
2. **Upload AI Audio**: Replace placeholder with actual Supabase ai-messages bucket upload

## Benefits of Backend Approach

✅ **Reliable File Uploads**: No more React Native upload issues
✅ **Better Error Handling**: Centralized error management
✅ **Consistent API**: Same pattern as existing song/lyrics endpoints
✅ **Server-side Processing**: Better control over audio processing
✅ **Easier Debugging**: Backend logs show exactly what's happening

## Frontend Changes Made

- **Profile Screen**: Now calls `/upload-voice-sample` API
- **Search Screen**: Now calls `/generate-ai-voice` API  
- **Removed**: Direct ElevenLabs SDK usage from frontend
- **Removed**: Direct Supabase upload logic from frontend

## Testing

1. Start your backend: `cd snippets_backend && python api.py`
2. Record voice sample in Profile → Enable AI Voice
3. Check backend logs for upload progress
4. Try sending message with AI voice toggle enabled
5. Check backend logs for TTS generation

The frontend will show placeholder URLs until you implement the actual backend functions.