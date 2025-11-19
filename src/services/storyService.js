import { supabase } from '../lib/supabaseClient';

/**
 * Save a story to Supabase
 * @param {Object} storyData - Story data to save
 * @param {string} storyData.storyId - Unique story ID
 * @param {string} storyData.userId - User ID (null for anonymous)
 * @param {string} storyData.setting - Story setting
 * @param {string} storyData.imgUrl - Current image URL
 * @param {Array} storyData.storyImages - Array of image URLs
 * @param {Array} storyData.messageHistory - Message history
 * @param {Array} storyData.messages - Chat messages
 * @param {Array} storyData.possibleActions - Available actions
 * @param {boolean} storyData.isAnonymous - Whether story is anonymous
 */
export async function saveStory(storyData) {
  try {
    const { data, error } = await supabase
      .from('stories')
      .upsert({
        story_id: storyData.storyId,
        user_id: storyData.userId,
        setting: storyData.setting,
        img_url: storyData.imgUrl,
        story_images: storyData.storyImages,
        message_history: storyData.messageHistory,
        messages: storyData.messages,
        possible_actions: storyData.possibleActions,
        is_anonymous: storyData.isAnonymous,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'story_id'
      })
      .select();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error saving story:', error);
    return { data: null, error };
  }
}

/**
 * Load a story from Supabase by story ID
 * @param {string} storyId - Story ID to load
 */
export async function loadStory(storyId) {
  try {
    const { data, error } = await supabase
      .from('stories')
      .select('*')
      .eq('story_id', storyId)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error loading story:', error);
    return { data: null, error };
  }
}

/**
 * Get all stories for a user
 * @param {string} userId - User ID
 */
export async function getUserStories(userId) {
  try {
    const { data, error } = await supabase
      .from('stories')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error loading user stories:', error);
    return { data: null, error };
  }
}

/**
 * Delete a story
 * @param {string} storyId - Story ID to delete
 */
export async function deleteStory(storyId) {
  try {
    const { error } = await supabase
      .from('stories')
      .delete()
      .eq('story_id', storyId);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error deleting story:', error);
    return { error };
  }
}

/**
 * Upload an image to Supabase Storage via serverless function
 * @param {string} imageUrl - OpenAI image URL to download and upload
 * @param {string} storyId - Story ID
 * @param {number} imageIndex - Image index
 */
export async function uploadImage(imageUrl, storyId, imageIndex) {
  try {
    console.log('🖼️ Starting image upload to Supabase...');
    console.log('Image URL:', imageUrl);
    console.log('Story ID:', storyId);
    console.log('Image Index:', imageIndex);

    // Call the serverless function to handle the upload
    // This avoids CORS issues since the fetch happens server-side
    console.log('Calling serverless function to upload image...');

    const response = await fetch('/api/upload-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageUrl,
        storyId,
        imageIndex
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Server error: ${response.status}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Upload failed');
    }

    console.log('✅ Image uploaded successfully via serverless function');
    console.log('✅ Public URL:', result.publicUrl);

    return { data: result.publicUrl, error: null };
  } catch (error) {
    console.error('❌ Error uploading image to Supabase:', error);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      stack: error.stack
    });
    return { data: null, error };
  }
}

/**
 * Claim an anonymous story for a user
 * @param {string} storyId - Story ID to claim
 * @param {string} userId - User ID to assign
 */
export async function claimAnonymousStory(storyId, userId) {
  try {
    const { data, error } = await supabase
      .from('stories')
      .update({
        user_id: userId,
        is_anonymous: false,
        updated_at: new Date().toISOString(),
      })
      .eq('story_id', storyId)
      .eq('is_anonymous', true)
      .select();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error claiming story:', error);
    return { data: null, error };
  }
}
