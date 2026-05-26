import { supabase, isSupabaseConfigured } from './supabase';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function uploadFile(
  file: File,
  folder: 'listings' | 'chat'
): Promise<string> {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('FILE_TOO_LARGE');
  }

  if (isSupabaseConfigured()) {
    const ext = file.name.split('.').pop() || 'bin';
    const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from('brasov-uploads').upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });
    if (error) throw error;
    const { data } = supabase.storage.from('brasov-uploads').getPublicUrl(path);
    return data.publicUrl;
  }

  return readFileAsDataUrl(file);
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function getAttachmentType(file: File): 'image' | 'file' {
  return file.type.startsWith('image/') ? 'image' : 'file';
}
