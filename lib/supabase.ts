import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://anxmuumodltiuzrbkjog.supabase.co";
const supabaseServiceKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFueG11dW1vZGx0aXV6cmJram9nIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODQ3MjEyMCwiZXhwIjoyMDY0MDQ4MTIwfQ.zf__8_PalpiStC74oHq8qIYWt1nbFX2vxYMcwxXCCzE";

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Helper function to handle user profile updates
export const updateUserProfile = async (
  userId: string,
  updates: {
    display_name?: string;
    profile_image?: string;
  }
) => {
  try {
    const { data, error } = await supabase
      .from("users")
      .upsert({
        id: userId,
        ...updates,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error updating user profile:", error);
    throw error;
  }
};

// Helper function to upload profile image to Supabase Storage
export const uploadProfileImage = async (
  userId: string,
  imageUri: string
): Promise<string> => {
  try {
    // Validate input
    if (!imageUri) {
      throw new Error("Image URI is required");
    }

    console.log("Starting image upload process for URI:", imageUri);

    // For Expo, we need to handle the file:// URI differently
    const formData = new FormData();
    formData.append("file", {
      uri: imageUri,
      type: "image/jpeg",
      name: "profile.jpg",
    } as any);

    // Convert image URI to blob with better error handling
    let response;
    try {
      response = await fetch(imageUri);
      if (!response.ok) {
        throw new Error(
          `Failed to fetch image: ${response.status} ${response.statusText}`
        );
      }
    } catch (error) {
      const fetchError = error as Error;
      console.error("Error fetching image:", fetchError);
      throw new Error(`Failed to fetch image: ${fetchError.message}`);
    }

    let blob;
    try {
      blob = await response.blob();
      console.log("Image blob created:", {
        type: blob.type,
        size: blob.size,
      });
    } catch (error) {
      const blobError = error as Error;
      console.error("Error creating blob:", blobError);
      throw new Error(`Failed to create image blob: ${blobError.message}`);
    }

    if (!blob || blob.size === 0) {
      throw new Error("Invalid image data: blob is empty or undefined");
    }

    // Create a unique file name
    const fileExt = imageUri.split(".").pop() || "jpg";
    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    const filePath = `profile_photos/${fileName}`;

    console.log("Attempting to upload image to Supabase Storage...", {
      filePath,
      blobSize: blob.size,
      blobType: blob.type,
    });

    // Upload the image using FormData
    const { data, error } = await supabase.storage
      .from("users")
      .upload(filePath, formData, {
        contentType: "image/jpeg",
        upsert: true,
      });

    if (error) {
      console.error("Supabase Storage upload error:", error);
      throw error;
    }

    // Get the public URL for the uploaded image
    const {
      data: { publicUrl },
    } = supabase.storage.from("users").getPublicUrl(filePath);

    console.log("Image uploaded successfully. Public URL:", publicUrl);

    // Update the user's profile_image in the users table
    const { error: updateError } = await supabase
      .from("users")
      .update({ profile_image: publicUrl })
      .eq("id", userId);

    if (updateError) {
      console.error("Error updating user profile image:", updateError);
      throw updateError;
    }

    return publicUrl;
  } catch (error) {
    console.error("Error in uploadProfileImage:", error);
    throw error;
  }
};

// Helper function to decode base64
function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}
