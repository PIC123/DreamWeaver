import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Story.css';
import {OpenAI as OAI} from "openai";
import { useAuth } from './contexts/AuthContext';
import * as storyService from './services/storyService';

export default function Story() {
  const systemTemplate = "Act as a terminal for a zork clone text based dungeon adventure game based in {setting}. Respond ONLY with descriptions of the environment and react to basic commands like moving in a direction or picking up items. Begin the story in a randomly generated space and describe what the player sees. Only return json objects as responses. The objects should have the parameters \"story-text\", which is just a string of the generated description, \"possible-actions\", which is a list of possible actions that the user can take (use natural language with proper spacing, NOT underscores or snake_case), \"location\" which is an x,y pair that denotes the Euclidian distance from the starting location in steps with north and east being the positive directions. Also include the parameter \"dall-e-prompt\" which contains a generated prompt for the generative art ai dall-e to produce an artistic storybook illustration of the current description. The dall-e-prompt should always specify: 'Watercolor storybook illustration in a whimsical hand-painted style, warm lighting, soft edges, children's book aesthetic, detailed and charming,' followed by the scene description with rich visual details. Keep track of the user's actions in a parameter called \"action-history\" that is a list of the actions that the user has take so far, with the corresponding location that the action happened.";

  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const setting = location.state.setting;  // Getting the setting entered by the user
  const storyIdLoaded = location.state.storyId;

  const [messages, setMessages] = useState([]);
  const [messageHistory, setMessageHistory] = useState([["system", systemTemplate]]);
  const [input, setInput] = useState('');
  const [imgSrc, setImgSrc] = useState('https://raw.githubusercontent.com/PIC123/DreamWeaver/main/src/loading.png');
  const [backgroundImage, setBackgroundImage] = useState('');
  const [possibleActions, setPossibleActions] = useState(['Action 1', 'Action 2', 'Action 3']);
  const [isImageModalOpen, setImageModalOpen] = useState(false); // State variable for image modal
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef(null);
  const [storyImages, setStoryImages] = useState([]);
  const [selectedImg, setSelectedImg] = useState(''); // State variable for selected image
  const [audioUrl, setAudioUrl] = useState(''); // State to store the audio URL
  const audioRef = useRef(null);
  const [storyId, setStoryId] = useState();
  const [currentPrompt, setCurrentPrompt] = useState();
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [isStoryLoading, setIsStoryLoading] = useState(false);
  const [isImageSectionCollapsed, setIsImageSectionCollapsed] = useState(false);

  const oai = new OAI({
    apiKey: process.env.REACT_APP_OPENAI_API_KEY,
    dangerouslyAllowBrowser: true,
  });

  const messagesEndRef = useRef(null); // Create a ref
  const imgsEndRef = useRef(null); // Create a ref
  const scrollToBottom = () => {
    try {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
      console.log(error);
    }
  };
  const scrollToEnd = () => {
    try {
      imgsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
      console.log(error);
    }
  };

  // Helper function to convert message history to OpenAI format
  const convertMessagesToOpenAIFormat = (messageHistory) => {
    return messageHistory.map(([role, content]) => {
      const openAIRole = role === 'system' ? 'system' : role === 'human' ? 'user' : 'assistant';
      return { role: openAIRole, content: content };
    });
  };

  // Helper function to format action text (remove underscores, capitalize properly)
  const formatActionText = (text) => {
    return text
      .replace(/_/g, ' ')           // Replace underscores with spaces
      .replace(/\s+/g, ' ')         // Replace multiple spaces with single space
      .trim()                        // Remove leading/trailing whitespace
      .split(' ')                    // Split into words
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) // Capitalize each word
      .join(' ');                    // Join back together
  };

  async function loadStory() {
    setStoryId(storyIdLoaded);

    try {
      const { data, error } = await storyService.loadStory(storyIdLoaded);

      if (error) {
        console.error("Error loading story:", error);
        return;
      }

      if (!data) {
        console.error("Story not found");
        return;
      }

      console.log("Loaded Story:", data);

      setImgSrc(data.img_url);
      setBackgroundImage(data.img_url);
      setStoryImages(data.story_images || []);
      setMessageHistory(data.message_history || [["system", systemTemplate]]);
      setMessages(data.messages || []);
      setPossibleActions(data.possible_actions || []);
    } catch (error) {
      console.error("Error loading story:", error);
    }
  }

  async function saveStory(storyID) {
    console.log("Saving Story to Supabase");

    try {
      const { data, error } = await storyService.saveStory({
        storyId: storyID,
        userId: user?.id || null,
        setting: setting,
        imgUrl: imgSrc,
        storyImages: storyImages,
        messageHistory: messageHistory,
        messages: messages,
        possibleActions: possibleActions,
        isAnonymous: !user
      });

      if (error) {
        console.error("Error saving story:", error);
        return { error };
      }

      console.log("Story saved successfully:", data);
      return { data, error: null };
    } catch (error) {
      console.error("Error saving story:", error);
      return { error };
    }
  }

  async function getImage(prompt, storyID) {
    setIsImageLoading(true);
    setCurrentPrompt(prompt);

    try {
      // Generate the image with DALL-E
      const response = await oai.images.generate({
        model: "dall-e-3",
        prompt: prompt
      });

      const openAIImageUrl = response.data[0].url;
      const imageIndex = storyImages.length;

      // Display the OpenAI image immediately for fast user experience
      setImgSrc(openAIImageUrl);
      setBackgroundImage(openAIImageUrl);
      setStoryImages([...storyImages, openAIImageUrl]);
      setIsImageLoading(false);

      // Upload to Supabase Storage in the background
      storyService.uploadImage(openAIImageUrl, storyID, imageIndex)
        .then(({ data: supabaseUrl, error }) => {
          if (error) {
            console.error('Error uploading image to Supabase:', error);
            return;
          }

          // Update to Supabase Storage URL after successful upload
          setImgSrc(supabaseUrl);
          setBackgroundImage(supabaseUrl);
          setStoryImages(prevImages => {
            const updatedImages = [...prevImages];
            updatedImages[imageIndex] = supabaseUrl;
            return updatedImages;
          });
        })
        .catch(error => {
          console.error('Error uploading image to Supabase:', error);
          // Keep using OpenAI URL if Supabase upload fails
        });
    } catch (error) {
      console.error('Error generating image:', error);
      setIsImageLoading(false);
    }
  }

  useEffect(() => {
    async function fetchData() {
        const new_story_id = Math.random().toString(36).substr(2, 9);
        setStoryId(new_story_id);
        console.log("Generating new story with id:" + new_story_id);

        // Create the initial system message with setting
        const systemMessage = systemTemplate.replace('{setting}', setting);
        const messages = [{ role: 'system', content: systemMessage }];

        // Call OpenAI API directly
        const result = await oai.chat.completions.create({
          model: "gpt-4",
          messages: messages,
        });

        const parsed = JSON.parse(result.choices[0].message.content)

        // Update UI immediately
        setMessages([{ text: parsed["story-text"], sender: 'system' }]);
        setMessageHistory([["system", systemMessage], ["assistant", parsed["story-text"]]]);
        setPossibleActions(parsed["possible-actions"]);
        scrollToBottom();

        // Load image (non-blocking)
        getImage(parsed["dall-e-prompt"], new_story_id);

        // Save initial story to Supabase
        saveStory(new_story_id);
    }
    console.log("storyIdLoaded: " + storyIdLoaded);
    console.log(storyIdLoaded === '');
    if (storyIdLoaded !== '') {
      console.log("Loading story with id:" + storyIdLoaded);
      loadStory();
    } else {
      fetchData();
    }
    if ('webkitSpeechRecognition' in window) {
      const recognition = new window.webkitSpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onresult = (event) => {
          for (let i = event.resultIndex; i < event.results.length; ++i) {
              if (event.results[i].isFinal) {
                  setInput(input + event.results[i][0].transcript);
              }
          }
      };

      recognitionRef.current = recognition;
  }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    scrollToBottom(); // Scroll to bottom when messages state changes
  }, [messages]);

  useEffect(() => {
    scrollToEnd(); // Scroll to bottom when messages state changes
    saveStory(storyId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storyImages]);
  
  // Handler for possible action buttons
  const handleActionClick = async (action) => {
    setIsStoryLoading(true);

    // Convert message history to OpenAI format and add the user action
    const openAIMessages = convertMessagesToOpenAIFormat(messageHistory);
    openAIMessages.push({ role: 'user', content: action + " and respond ONLY with the JSON defined above" });

    await setMessages([...messages, { text: action, sender: 'human' }, { text: "✨ Weaving your tale...", sender: 'system' }]);
    console.log(openAIMessages);

    try {
      // Call OpenAI API directly
      const result = await oai.chat.completions.create({
        model: "gpt-4",
        messages: openAIMessages,
      });

      const parsed = JSON.parse(result.choices[0].message.content)
      setInput('');

      // Update UI immediately
      setMessages([...messages, { text: action, sender: 'human' }, { text: parsed["story-text"], sender: 'system' }]);
      messageHistory.push(["human", action]);
      messageHistory.push(["assistant", parsed["story-text"]]);
      setPossibleActions(parsed["possible-actions"]);
      setIsStoryLoading(false);

      // Load image (non-blocking)
      getImage(parsed["dall-e-prompt"], storyId);
    } catch (error) {
      console.error('Error in handleActionClick:', error);
      setMessages([...messages, { text: action, sender: 'human' }, { text: 'An error occurred. Please try again.', sender: 'system' }]);
      setIsStoryLoading(false);
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
        handleSubmit();
    }
  };

  const handleInput = (e) => {
    setInput(e.target.value);
  };

  const handleSubmit = async () => {
    if (!input.trim()) return;

    setIsStoryLoading(true);
    const userInput = input; // Store input before clearing
    setInput('');

    // Convert message history to OpenAI format and add the user input
    const openAIMessages = convertMessagesToOpenAIFormat(messageHistory);
    openAIMessages.push({ role: 'user', content: userInput + " and respond ONLY with the JSON defined above" });

    await setMessages([...messages, { text: userInput, sender: 'human' }, { text: "✨ Weaving your tale...", sender: 'system' }]);

    try {
      // Call OpenAI API directly
      const result = await oai.chat.completions.create({
        model: "gpt-4",
        messages: openAIMessages,
      });

      const parsed = JSON.parse(result.choices[0].message.content)

      // Update UI immediately
      setMessages([...messages, { text: userInput, sender: 'human' }, { text: parsed["story-text"], sender: 'system' }]);
      messageHistory.push(["human", userInput]);
      messageHistory.push(["assistant", parsed["story-text"]]);
      setPossibleActions(parsed["possible-actions"]);
      setIsStoryLoading(false);

      // Load image (non-blocking)
      getImage(parsed["dall-e-prompt"], storyId);
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      setMessages([...messages, { text: userInput, sender: 'human' }, { text: 'An error occurred. Please try again.', sender: 'system' }]);
      setIsStoryLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/');
  };

  const startRecording = () => {
    if (recognitionRef.current && !isRecording) {
        recognitionRef.current.start();
        setIsRecording(true);
    }
};

const stopRecording = () => {
    if (recognitionRef.current && isRecording) {
        recognitionRef.current.stop();
        setIsRecording(false);
    }
};

const handleSpeech = async (text) => {
  const apiKey = process.env.REACT_APP_ELEVEN_LABS_API_KEY;
  const apiUrl = 'https://api.elevenlabs.io/v1/text-to-speech/ThT5KcBeYPX3keUQqHPh';

  // String test_json = JSON.stringify('{"model_id":"eleven_turbo_v2","text":"This is a sample text that I want to test the AI with and see if this is a suitable tool for what I want",voice_settings:{"similarity_boost":0.75,"stability":0.75}}');
  // console.log(test_json);
  // console.log(test_json)

  try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json'
        },
        body: '{"model_id":"eleven_turbo_v2","text":"'+text+'","voice_settings":{"similarity_boost":0.75,"stability":0.75}}'
      });

      if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      setAudioUrl(audioUrl); // Set the audio URL state
  } catch (error) {
      console.error('Error fetching text-to-speech from ElevenLabs:', error);
  }
};

console.log(handleSpeech);
console.log(currentPrompt);

useEffect(() => {
  if (audioUrl && audioRef.current) {
      audioRef.current.play(); // Play the audio as soon as the URL is set
  }
}, [audioUrl]);

  const toggleImageModal = (selectedImg) => {
    setSelectedImg(selectedImg);
    setImageModalOpen(!isImageModalOpen);
  };


  return (
    <div className="story-container">
      <div className="overlay" style={{
        backgroundImage: backgroundImage ? `url(${backgroundImage})` : 'none'
      }}></div>

      {/* Header */}
      <div className="story-header">
        <h2 className="story-intro">Welcome to {setting}</h2>
        <h4 className="story-id">ID: {storyId}</h4>
      </div>

      {/* Main Content Area - Split Layout */}
      <div className="main-content">
        {/* Left Panel - Image Section */}
        <div className="image-section">
          <div className="image-container">
            {imgSrc ? (
              <img
                src={imgSrc}
                alt="Story Scene"
                className="story-image"
                onClick={() => toggleImageModal(imgSrc)}
              />
            ) : (
              <div className="image-placeholder">
                <div className="loading-text">Awaiting your first scene...</div>
              </div>
            )}
            {/* Loading indicator overlay - doesn't replace image */}
            {isImageLoading && (
              <div className="image-loading-overlay">
                <div className="spinner"></div>
                <div className="loading-text">Painting your scene...</div>
              </div>
            )}
          </div>

          {/* Image Gallery */}
          {storyImages.length > 0 && (
            <>
              <div className="image-section-header">
                <h3>Story Gallery</h3>
                <button
                  className="collapse-toggle"
                  onClick={() => setIsImageSectionCollapsed(!isImageSectionCollapsed)}
                  aria-label={isImageSectionCollapsed ? "Expand gallery" : "Collapse gallery"}
                >
                  {isImageSectionCollapsed ? '▼' : '▲'}
                </button>
              </div>
              <div className={`image-gallery ${isImageSectionCollapsed ? 'collapsed' : ''}`}>
                {storyImages.map((image, index) => (
                  <img
                    key={index}
                    src={image}
                    alt={`Scene ${index + 1}`}
                    onClick={() => toggleImageModal(image)}
                    className="gallery-story-image"
                  />
                ))}
                <div ref={imgsEndRef}></div>
              </div>
            </>
          )}
        </div>

        {/* Right Panel - Chat Section */}
        <div className="chat-section">
          {/* Message Container */}
          <div className="message-container">
            {messages.map((message, index) => (
              <div key={index} className={message.sender === 'human' ? 'user-message' : 'system-message'}>
                {message.text}
              </div>
            ))}
            <div ref={messagesEndRef}></div>
          </div>

          {/* Actions */}
          <div className="actions-container">
            {possibleActions.map((action, index) => (
              <button
                key={index}
                onClick={() => handleActionClick(action)}
                disabled={isStoryLoading}
              >
                {formatActionText(action)}
              </button>
            ))}
          </div>

          {/* Input Controls */}
          <div className="input-controls">
            <input
              type="text"
              value={input}
              onChange={handleInput}
              onKeyPress={handleKeyPress}
              className="message-input"
              placeholder="Describe your action..."
              disabled={isStoryLoading}
            />
            <button
              onClick={handleSubmit}
              className="submit-button"
              disabled={isStoryLoading}
            >
              {isStoryLoading ? '✨' : 'Send'}
            </button>
          </div>

          {/* Bottom Controls */}
          <div className="bottom-controls">
            <button onClick={handleBack} className="back-button">← Back to Menu</button>
            {isRecording ? (
              <button style={{backgroundColor:'#e74c3c'}} onClick={stopRecording}>⏹ Stop Recording</button>
            ) : (
              <button style={{backgroundColor:'#2ecc71'}} onClick={startRecording}>🎤 Start Recording</button>
            )}
          </div>

          {/* Audio Player */}
          {audioUrl && (
            <audio ref={audioRef} controls src={audioUrl}>
              Your browser does not support the audio element.
            </audio>
          )}
        </div>
      </div>

      {/* Image Modal */}
      {isImageModalOpen && (
        <div className="image-modal" onClick={() => toggleImageModal('')}>
          <img src={selectedImg} alt="Enlarged Scene" className="enlarged-image" />
        </div>
      )}
    </div>
  );
}
