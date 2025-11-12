import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Story.css';
import {OpenAI as OAI} from "openai";

export default function Story() {
  // const systemTemplate = "Act as a terminal for a zork clone text based alien date adventure game based in {setting}. Respond ONLY with descriptions of the environment and react to basic commands like moving in a direction or picking up items. Begin the story in a randomly generated space and describe what the player sees. Only return json objects as responses. The objects should have the parameters \"story-text\", which is just a string of the generated description, \"possible-actions\", which is a list of possible actions that the user can take, \"location\" which is an x,y pair that denotes the Euclidian distance from the starting location in steps with north and east being the positive directions. Also include the parameter \"dall-e-prompt\" which contains a generated prompt for the generative art ai dall-e to produce an artistic storybook illustration of the current description with lots of details in a hand-drawn style. Keep track of the user's actions in a parameter called \"action-history\" that is a list of the actions that the user has take so far, with the corresponding location that the action happened. Create an end to the story for the user after a random amount of messages, between 5-15 user messages.";
  const systemTemplate = "Act as a terminal for a zork clone text based dungeon adventure game based in {setting}. Respond ONLY with descriptions of the environment and react to basic commands like moving in a direction or picking up items. Begin the story in a randomly generated space and describe what the player sees. Only return json objects as responses. The objects should have the parameters \"story-text\", which is just a string of the generated description, \"possible-actions\", which is a list of possible actions that the user can take, \"location\" which is an x,y pair that denotes the Euclidian distance from the starting location in steps with north and east being the positive directions. Also include the parameter \"dall-e-prompt\" which contains a generated prompt for the generative art ai dall-e to produce an artistic storybook illustration of the current description with lots of details in a hand-drawn style. Keep track of the user's actions in a parameter called \"action-history\" that is a list of the actions that the user has take so far, with the corresponding location that the action happened.";
  const STORAGE_BASE_URL = 'https://dreamweaverdata.blob.core.windows.net/story-images/';

  const PARTITION = "TestStories";


  const navigate = useNavigate();
  const location = useLocation();
  const setting = location.state.setting;  // Getting the setting entered by the user
  const storyIdLoaded = location.state.storyId;

  const [messages, setMessages] = useState([]);
  const [messageHistory, setMessageHistory] = useState([["system", systemTemplate]]);
  const [input, setInput] = useState('');
  const [imgSrc, setImgSrc] = useState('https://raw.githubusercontent.com/PIC123/DreamWeaver/main/src/loading.png');
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

  // const generateStoryId = () => {
  //   return Math.random().toString(36).substr(2, 9);
  // };
  const oai = new OAI({
    apiKey: process.env.REACT_APP_OPENAI_API_KEY,
    dangerouslyAllowBrowser: true,
  });

  const messagesEndRef = useRef(null); // Create a ref
  const imgsEndRef = useRef(null); // Create a ref
  const scrollToBottom = () => {
    try {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
      console.log(error);
    }
  };
  const scrollToEnd = () => {
    imgsEndRef.current.scrollIntoView({ behavior: 'smooth' });
  };

  // Helper function to generate story using OpenAI directly
  async function generateStoryWithOpenAI(messages) {
    const response = await oai.chat.completions.create({
      model: "gpt-4",
      messages: messages,
      temperature: 0.7,
    });
    return response.choices[0].message.content;
  }

  async function loadStory() {
    setStoryId(storyIdLoaded);
    const data = {
      "storyID": storyIdLoaded,
      "partition": PARTITION
    }
    const resp = await fetch('https://dreamweaver-api.azurewebsites.net/api/LoadStory', {
      method: 'POST', // or 'PUT'
      headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "DELETE, POST, GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
          'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    const resp_json = await resp.json()
    console.log("Loaded Story:");
    console.log(resp_json);

    // const loadedJson = JSON.parse(resp_json);
    // console.log(loadedJson);
    
    setImgSrc(resp_json.imgURL);
    setStoryImages(JSON.parse(resp_json.storyImages));
    const loadedHistory = JSON.parse(resp_json.messageHistory);
    setMessageHistory(loadedHistory);
    setMessages(JSON.parse(resp_json.messages));
    setPossibleActions(JSON.parse(resp_json.possibleActions));
    console.log(storyImages);
    console.log(messageHistory);
    console.log(messages);
    console.log(possibleActions);
  }

  async function savePrompt(prompt) {
    setCurrentPrompt(prompt);
    const data = {
      "prompt": prompt,
    }
    const resp = await fetch('https://dreamweaver-api.azurewebsites.net/api/SaveTDPrompt', {
      method: 'POST', // or 'PUT'
      headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "DELETE, POST, GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
          'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return resp
  }

  async function saveStory(storyID) {
    console.log("Saving Story");
    const data = {
      "storyID": storyID,
      "partition": PARTITION,
      "imgURL": imgSrc,
      "storyImages": storyImages,
      "messageHistory": messageHistory,
      "messages": messages,
      "possibleActions": possibleActions
    }
    console.log(data);
    const resp = await fetch('https://dreamweaver-api.azurewebsites.net/api/StoreData', {
      method: 'POST', // or 'PUT'
      headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "DELETE, POST, GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
          'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return resp
  }

  async function getImage(prompt, storyID) {
    // TODO: Add change storyID var to be less confusing
    const response = await oai.images.generate({ 
          model: "dall-e-3",
          prompt: prompt });
    await saveImage(response.data[0].url, storyID);
    setImgSrc(STORAGE_BASE_URL + storyID + "/" + storyImages.length + ".png");
    setStoryImages([...storyImages, STORAGE_BASE_URL + storyID + "/" + storyImages.length + ".png"]);
  }

  async function saveImage(imgUrl, storyID) {
    const data = {
      "imgURL": imgUrl,
      "storyID": storyID,
      "imgID": storyImages.length
    }
    const resp = await fetch('https://dreamweaver-api.azurewebsites.net/api/SaveImgToBlob', {
      method: 'POST', // or 'PUT'
      headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "DELETE, POST, GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
          'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    return resp
  }

  //await setMessages([{ text: parsed["story-text"], sender: 'system' }]);
  // await setMessageHistory([...messageHistory, ["ai",parsed["story-text"]]]);

  useEffect(() => {
    async function fetchData() {
        const new_story_id = Math.random().toString(36).substr(2, 9);
        setStoryId(new_story_id);
        console.log("Generating new story with id:" + new_story_id);

        // Build messages array for OpenAI
        const initialMessages = [
          {
            role: "system",
            content: systemTemplate.replace("{setting}", setting)
          }
        ];

        const resultContent = await generateStoryWithOpenAI(initialMessages);
        const parsed = JSON.parse(resultContent)

        savePrompt(parsed["dall-e-prompt"])
          .then(setMessages([{ text: parsed["story-text"], sender: 'system' }]))
          .then(setMessageHistory([
            {role: "system", content: systemTemplate.replace("{setting}", setting)},
            {role: "assistant", content: parsed["story-text"]}
          ]))
          .then(getImage(parsed["dall-e-prompt"], new_story_id))
          .then(setPossibleActions(parsed["possible-actions"]))
          .then(scrollToBottom());
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
    await setMessages([...messages, { text: action, sender: 'human' }, { text: "Loading...", sender: 'system' }]);

    // Build messages array for OpenAI with full conversation history
    const conversationMessages = [
      ...messageHistory,
      {
        role: "user",
        content: `${action} and respond ONLY with the JSON defined above`
      }
    ];

    const resultContent = await generateStoryWithOpenAI(conversationMessages);
    const parsed = JSON.parse(resultContent);

    setInput('');
    savePrompt(parsed["dall-e-prompt"])
    .then(setMessages([...messages, { text: action, sender: 'human' }, { text: parsed["story-text"], sender: 'system' }]))
    .then(() => {
      setMessageHistory([
        ...messageHistory,
        {role: "user", content: action},
        {role: "assistant", content: parsed["story-text"]}
      ]);
    }).then(getImage(parsed["dall-e-prompt"], storyId))
    .then(setPossibleActions(parsed["possible-actions"]));
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
    const userInput = input;
    await setMessages([...messages, { text: userInput, sender: 'human' }, { text: "Loading...", sender: 'system' }]);

    // Build messages array for OpenAI with full conversation history
    const conversationMessages = [
      ...messageHistory,
      {
        role: "user",
        content: `${userInput} and respond ONLY with the JSON defined above`
      }
    ];

    const resultContent = await generateStoryWithOpenAI(conversationMessages);
    const parsed = JSON.parse(resultContent);

    setInput('');
    savePrompt(parsed["dall-e-prompt"])
      .then(setMessages([...messages, { text: userInput, sender: 'human' }, { text: parsed["story-text"], sender: 'system' }]))
      .then(() => {
        setMessageHistory([
          ...messageHistory,
          {role: "user", content: userInput},
          {role: "assistant", content: parsed["story-text"]}
        ]);
      }).then(getImage(parsed["dall-e-prompt"], storyId))
      .then(setPossibleActions(parsed["possible-actions"]));
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
    <div className="book-wrapper">
      {/* Background overlay with current scene image */}
      <div className="book-background" style={{
        backgroundImage: `url(${imgSrc})`
      }}></div>

      {/* Main book container */}
      <div className="book-container">
        {/* Book spine and shadow effect */}
        <div className="book-spine"></div>

        {/* Left page - Story illustration */}
        <div className="book-page left-page">
          <div className="page-content">
            <div className="illustration-frame" onClick={() => {toggleImageModal(imgSrc)}}>
              <img src={imgSrc} alt="Story Scene" className="story-illustration" />
              <div className="illustration-caption">Chapter Scene</div>
            </div>

            {/* Image gallery as thumbnail previews */}
            <div className="chapter-thumbnails">
              {storyImages.map((image, index) => (
                <div key={index} className="thumbnail-wrapper" onClick={() => {toggleImageModal(image)}}>
                  <img src={image} alt={`Scene ${index + 1}`} className="thumbnail-image" />
                  <span className="thumbnail-number">{index + 1}</span>
                </div>
              ))}
              <div ref={imgsEndRef}></div>
            </div>

            {/* Story ID as book edition */}
            <div className="book-edition">Edition: {storyId}</div>
          </div>
        </div>

        {/* Right page - Story text and interactions */}
        <div className="book-page right-page">
          <div className="page-content">
            {/* Story title */}
            <h1 className="story-title">A Tale of {setting}</h1>

            {/* Story text in book format */}
            <div className="story-text-container">
              {messages.map((message, index) => (
                <div key={index} className={`story-paragraph ${message.sender === 'human' ? 'action-text' : 'narrative-text'}`}>
                  {message.sender === 'human' ? (
                    <span className="action-marker">➤ </span>
                  ) : null}
                  {message.text}
                </div>
              ))}
              <div ref={messagesEndRef}></div>
            </div>

            {/* Action choices styled as chapter options */}
            <div className="choice-container">
              <div className="choice-header">What will you do?</div>
              <div className="choices">
                {possibleActions.map((action, index) => (
                  <button key={index} className="choice-button" onClick={() => handleActionClick(action)}>
                    {action}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom action input */}
            <div className="custom-action">
              <input
                type="text"
                value={input}
                onChange={handleInput}
                onKeyPress={handleKeyPress}
                className="action-input"
                placeholder="Or describe your own action..."
              />
              <button onClick={handleSubmit} className="action-submit">Continue</button>
            </div>

            {/* Controls footer */}
            <div className="page-footer">
              <button onClick={handleBack} className="footer-button">← Close Book</button>
              {isRecording ? (
                <button className="footer-button recording" onClick={stopRecording}>⬤ Recording...</button>
              ) : (
                <button className="footer-button" onClick={startRecording}>🎤 Voice</button>
              )}
              {audioUrl && (
                <audio ref={audioRef} controls src={audioUrl} className="audio-player">
                  Your browser does not support the audio element.
                </audio>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Image modal for enlarged view */}
      {isImageModalOpen && (
        <div className="image-modal" onClick={() => {toggleImageModal('')}}>
          <div className="modal-content">
            <img src={selectedImg} alt="Enlarged Scene" className="modal-image" />
            <button className="modal-close" onClick={() => {toggleImageModal('')}}>✕</button>
          </div>
        </div>
      )}
    </div>
  );
}
