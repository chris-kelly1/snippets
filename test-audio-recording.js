// Test script to validate audio recording and upload
// Run this in your Expo app console to debug

export const testAudioRecording = async () => {
  console.log('🧪 Testing Audio Recording Flow...\n');
  
  // Test 1: Check if expo-audio is properly imported
  try {
    const { useAudioRecorder, RecordingPresets, AudioModule } = require('expo-audio');
    console.log('✅ Expo Audio imported successfully');
    console.log('📋 Available presets:', Object.keys(RecordingPresets));
  } catch (error) {
    console.log('❌ Expo Audio import failed:', error.message);
    return;
  }
  
  // Test 2: Check recording permissions
  try {
    const { AudioModule } = require('expo-audio');
    const { status } = await AudioModule.requestRecordingPermissionsAsync();
    console.log('🎤 Recording permission status:', status);
    
    if (status !== 'granted') {
      console.log('⚠️ Recording permission not granted');
      return;
    }
  } catch (error) {
    console.log('❌ Permission check failed:', error.message);
  }
  
  // Test 3: Check Supabase connection
  try {
    const { supabase } = require('./lib/supabase');
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.log('❌ Supabase connection failed:', error.message);
    } else {
      console.log('✅ Supabase connected, buckets:', buckets.map(b => b.name));
      
      // Check voice-samples bucket specifically
      const voiceBucket = buckets.find(b => b.name === 'voice-samples');
      if (voiceBucket) {
        console.log('✅ voice-samples bucket exists');
      } else {
        console.log('❌ voice-samples bucket missing');
      }
    }
  } catch (error) {
    console.log('❌ Supabase test failed:', error.message);
  }
  
  console.log('\n🏁 Audio recording test complete');
};

// Usage: Call testAudioRecording() in your app to debug
// Example in your component:
// useEffect(() => {
//   testAudioRecording().catch(console.error);
// }, []);