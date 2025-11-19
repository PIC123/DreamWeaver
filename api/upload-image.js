import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { imageUrl, storyId, imageIndex } = req.body;

    if (!imageUrl || !storyId || imageIndex === undefined) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    console.log('🖼️ Serverless function: Starting image upload...');
    console.log('Image URL:', imageUrl);
    console.log('Story ID:', storyId);
    console.log('Image Index:', imageIndex);

    // Fetch the image from OpenAI (server-side, no CORS issues)
    console.log('Fetching image from OpenAI...');
    const response = await fetch(imageUrl);

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
    }

    // Convert to buffer
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    console.log('✅ Image fetched successfully, size:', buffer.length, 'bytes');

    // Upload to Supabase Storage
    const fileName = `${storyId}/${imageIndex}.png`;
    console.log('Uploading to Supabase Storage as:', fileName);

    const { data, error } = await supabase.storage
      .from('story-images')
      .upload(fileName, buffer, {
        contentType: 'image/png',
        upsert: true
      });

    if (error) {
      console.error('❌ Supabase upload error:', error);
      throw error;
    }

    console.log('✅ Upload successful, data:', data);

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from('story-images')
      .getPublicUrl(fileName);

    console.log('✅ Public URL generated:', urlData.publicUrl);

    return res.status(200).json({
      success: true,
      publicUrl: urlData.publicUrl
    });
  } catch (error) {
    console.error('❌ Error in upload-image function:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
