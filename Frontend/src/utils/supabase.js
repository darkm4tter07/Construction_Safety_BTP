import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase env variables are missing');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

export const uploadProfilePhotoToStorage = async (file, userId) => {
  if (!file || !file.type.startsWith('image/')) {
    throw new Error('Only image files are allowed');
  }

  const filePath = `${userId}/profile.jpg`;

  // Remove old file (safe)
  const { error: removeError } = await supabase.storage
    .from('worker-profiles')
    .remove([filePath]);

  if (removeError && !removeError.message.includes('not found')) {
    console.warn('Remove error:', removeError.message);
  }

  // Upload new file
  const { error: uploadError } = await supabase.storage
    .from('worker-profiles')
    .upload(filePath, file, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) throw uploadError;

  // Get public URL
  const { data } = supabase.storage
    .from('worker-profiles')
    .getPublicUrl(filePath);

  return `${data.publicUrl}?t=${Date.now()}`;
};