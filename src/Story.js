import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Story.css';
import { ChatOpenAI } from "langchain/chat_models/openai"; 
import { ChatPromptTemplate } from "langchain/prompts";
import {OpenAI as OAI} from "openai";

export default function Story() {
  // const systemTemplate = "Act as a terminal for a zork clone text based alien date adventure game based in {setting}. Respond ONLY with descriptions of the environment and react to basic commands like moving in a direction or picking up items. Begin the story in a randomly generated space and describe what the player sees. Only return json objects as responses. The objects should have the parameters \"story-text\", which is just a string of the generated description, \"possible-actions\", which is a list of possible actions that the user can take, \"location\" which is an x,y pair that denotes the Euclidian distance from the starting location in steps with north and east being the positive directions. Also include the parameter \"dall-e-prompt\" which contains a generated prompt for the generative art ai dall-e to produce an artistic storybook illustration of the current description with lots of details in a hand-drawn style. Keep track of the user's actions in a parameter called \"action-history\" that is a list of the actions that the user has take so far, with the corresponding location that the action happened. Create an end to the story for the user after a random amount of messages, between 5-15 user messages.";
  const systemTemplate = "Act as a terminal for a zork clone text based dungeon adventure game based in {setting}. Respond ONLY with descriptions of the environment and react to basic commands like moving in a direction or picking up items. Begin the story in a randomly generated space and describe what the player sees. Only return json objects as responses. The objects should have the parameters \"story-text\", which is just a string of the generated description, \"possible-actions\", which is a list of possible actions that the user can take, \"location\" which is an x,y pair that denotes the Euclidian distance from the starting location in steps with north and east being the positive directions. Also include the parameter \"dall-e-prompt\" which contains a generated prompt for the generative art ai dall-e to produce an artistic storybook illustration of the current description with lots of details in a hand-drawn style. Keep track of the user's actions in a parameter called \"action-history\" that is a list of the actions that the user has take so far, with the corresponding location that the action happened.";
  const STORAGE_BASE_URL = 'https://dreamweaverdata.blob.core.windows.net/story-images/';


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

  const model = new ChatOpenAI({
    openAIApiKey: process.env.REACT_APP_OPENAI_API_KEY,
    // modelName: "gpt-3.5-turbo",
    modelName: "gpt-4",
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

  var chatPrompt= ChatPromptTemplate.fromMessages([["system", systemTemplate]]);

  async function loadStory() {
    const data = {
      "storyID": storyIdLoaded
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
    setImgSrc(resp_json.imgURL);
    setStoryImages(resp_json.storyImages);
    setMessageHistory(resp_json.messageHistory);
    setMessages(resp_json.messages);
    setPossibleActions(resp_json.possibleActions);
    chatPrompt = ChatPromptTemplate.fromMessages([...resp.messageHistory,]);

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

  async function saveStory() {
    const data = {
      "storyID": storyId,
      "imgURL": imgSrc,
      "storyImages": storyImages,
      "messageHistory": messageHistory,
      "messages": messages,
      "possibleActions": possibleActions
    }
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

  useEffect(() => {
    async function fetchData() {
        const new_story_id = Math.random().toString(36).substr(2, 9);
        setStoryId(new_story_id);
        console.log("Generating new story with id:" + new_story_id);
        const formatMessages = await chatPrompt.formatMessages({setting: setting});
        const result = await model.predictMessages(formatMessages);
        const parsed = JSON.parse(result.content)
        await savePrompt(parsed["dall-e-prompt"]);
        await setMessages([{ text: parsed["story-text"], sender: 'system' }]);
        await setMessageHistory([...messageHistory, ["ai",parsed["story-text"]]]);
        // await handleSpeech(parsed["story-text"]);
        await getImage(parsed["dall-e-prompt"], new_story_id);
        await setPossibleActions(parsed["possible-actions"]);
        scrollToBottom(); // Scroll to bottom when component mounts
        // await saveStory();
    }
    console.log(storyIdLoaded);
    fetchData();
    // if (storyIdLoaded !== undefined) {
    //   console.log("Loading story with id:" + storyIdLoaded);
    //   loadStory();
    // } else {
    //   setStoryId(Math.random().toString(36).substr(2, 9));
    //   console.log("Generating new story with id:" + storyId);
    //   fetchData();
    // }
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
  }, [storyImages]);
  
  const humanTemplate = "{action} and respond ONLY with the JSON defined above";

  // Handler for possible action buttons
  const handleActionClick = async (action) => {
    const chatPrompt = ChatPromptTemplate.fromMessages([...messageHistory,
            ["human", humanTemplate],
          ]);
    const formattedChatPrompt = await chatPrompt.formatMessages({
        setting: setting,
        action: action,
        });
    await setMessages([...messages, { text: action, sender: 'human' }, { text: "Loading...", sender: 'system' }]);
    console.log(formattedChatPrompt);
    const result = await model.predictMessages(formattedChatPrompt);
    const parsed = JSON.parse(result.content)
    setInput('');
    await savePrompt(parsed["dall-e-prompt"]);
    await setMessages([...messages, { text: action, sender: 'human' }, { text: parsed["story-text"], sender: 'system' }]);
    messageHistory.push(["human", action]);
    messageHistory.push(["ai",parsed["story-text"]])
    // await handleSpeech(parsed["story-text"]);
    await getImage(parsed["dall-e-prompt"], storyId);
    await setPossibleActions(parsed["possible-actions"]);
    // You can add functionality here to handle action button clicks
    // const resp = await saveStory();
    // console.log(resp);
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
    const chatPrompt = ChatPromptTemplate.fromMessages([...messageHistory,
            ["human", humanTemplate],
          ]);
    const formattedChatPrompt = await chatPrompt.formatMessages({
        setting: setting,
        action: input + "and respond ONLY with the JSON defined above",
        });
    await setMessages([...messages, { text: input, sender: 'human' }, { text: "Loading...", sender: 'system' }]);
    const result = await model.predictMessages(formattedChatPrompt);
    const parsed = JSON.parse(result.content)
    setInput('');
    await savePrompt(parsed["dall-e-prompt"]);
    await setMessages([...messages, { text: input, sender: 'human' }, { text: parsed["story-text"], sender: 'system' }]);
    messageHistory.push(["human", input]);
    messageHistory.push(["ai",parsed["story-text"]]);
    // await handleSpeech(parsed["story-text"]);
    await getImage(parsed["dall-e-prompt"], storyId);
    await setPossibleActions(parsed["possible-actions"]);
    console.log(messages);
    // const resp = await saveStory();
    // console.log(resp);
    // Here, you may want to implement a logic to add a system response
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
        backgroundImage: `url(${imgSrc})`
      }}></div>
      <h2 className="story-intro">Welcome to your new story set in {setting}. Let the adventure begin!</h2>
      <h4 className="story-id" style={{backgroundColor:'white'}}>Story ID: {storyId}</h4>
      {/* <img src={imgSrc} alt="Story" className="story-image" /> */}
      <img src={imgSrc} alt="Story" className="story-image" onClick={() => {toggleImageModal(imgSrc)}} />
      {isImageModalOpen && (
        <div className="image-modal" onClick={() => {toggleImageModal('')}}>
          <img src={selectedImg} alt="Enlarged Story" className="enlarged-image" />
        </div>
      )}
      <div className="image-gallery">
          {storyImages.map((image, index) => (
              <img key={index} src={image} alt={`Story part ${index + 1}`} onClick={() => {toggleImageModal(image)}} className="gallery-story-image" />
          ))}
          <div ref={imgsEndRef}></div>
      </div>
      {audioUrl && (
            <audio ref={audioRef} controls src={audioUrl}>
                Your browser does not support the audio element.
            </audio>
        )}
      <div className="message-container">
        {messages.map((message, index) => (
          <div key={index} className={message.sender === 'human' ? 'user-message' : 'system-message'}>
            {message.text}
          </div>
        ))}
        <div ref={messagesEndRef}></div>
      </div>
      <div className="actions-container">
        {possibleActions.map((action, index) => (
          <button key={index} onClick={() => handleActionClick(action)}>{action}</button>
        ))}
      </div>
      <input type="text" value={input} onChange={handleInput} onKeyPress={handleKeyPress} className="message-input" />
      <button onClick={handleSubmit} className="submit-button">Submit</button>
      <button onClick={handleBack} className="back-button">Back</button>
      <div className="recording-controls">
          {isRecording ? (
              <button style={{backgroundColor:'red'}} onClick={stopRecording}>Stop Recording</button>
          ) : (
              <button style={{backgroundColor:'green'}} onClick={startRecording}>Start Recording</button>
          )}
      </div>
    </div>
  );
}
