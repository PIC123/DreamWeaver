const { createClient } = require('@supabase/supabase-js');

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Initialize Supabase client (inside handler to ensure fresh credentials)
    const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
    const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Missing Supabase credentials');
      return res.status(500).json({
        success: false,
        error: 'Server configuration error: Missing Supabase credentials'
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { imageBase64, storyId, imageIndex } = req.body;

    if (!imageBase64 || !storyId || imageIndex === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters'
      });
    }

    console.log('🖼️ Serverless function: Starting image upload...');
    console.log('Story ID:', storyId);
    console.log('Image Index:', imageIndex);
    console.log('Base64 length:', imageBase64.length);

    // Convert base64 to buffer
    const buffer = Buffer.from(imageBase64, 'base64');
    console.log('✅ Buffer created, size:', buffer.length, 'bytes');

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
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to upload to Supabase'
      });
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
      error: error.message || 'Internal server error'
    });
  }
}
