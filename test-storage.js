// Quick test to check Supabase Storage access
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://anxmuumodltiuzrbkjog.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFueG11dW1vZGx0aXV6cmJram9nIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODQ3MjEyMCwiZXhwIjoyMDY0MDQ4MTIwfQ.zf__8_PalpiStC74oHq8qIYWt1nbFX2vxYMcwxXCCzE";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testStorageBuckets() {
  console.log('🧪 Testing Supabase Storage Access...\n');
  
  const buckets = ['users', 'voice-samples', 'ai-messages', 'audio-snippets'];
  
  for (const bucket of buckets) {
    console.log(`📁 Testing bucket: ${bucket}`);
    
    try {
      // Test 1: List files in bucket
      const { data: files, error: listError } = await supabase.storage
        .from(bucket)
        .list('', { limit: 5 });
        
      if (listError) {
        console.log(`  ❌ List error: ${listError.message}`);
      } else {
        console.log(`  ✅ List success: ${files?.length || 0} files found`);
      }
      
      // Test 2: Try uploading a small test file
      const testFile = new Blob(['test content'], { type: 'text/plain' });
      const testPath = `test-${Date.now()}.txt`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(testPath, testFile, { 
          contentType: 'text/plain',
          upsert: true 
        });
        
      if (uploadError) {
        console.log(`  ❌ Upload error: ${uploadError.message}`);
      } else {
        console.log(`  ✅ Upload success: ${uploadData?.path}`);
        
        // Clean up test file
        await supabase.storage.from(bucket).remove([testPath]);
        console.log(`  🧹 Test file cleaned up`);
      }
      
    } catch (error) {
      console.log(`  💥 Unexpected error: ${error.message}`);
    }
    
    console.log('');
  }
}

testStorageBuckets().catch(console.error);