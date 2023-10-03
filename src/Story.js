import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Story.css';
import { ChatOpenAI } from "langchain/chat_models/openai"; 
import { ChatPromptTemplate } from "langchain/prompts";
import {OpenAI as OAI} from "openai";

export default function Story() {
  const systemTemplate = "Act as a terminal for a zork clone text based dungeon adventure game based in {setting}. Respond ONLY with descriptions of the environment and react to basic commands like moving in a direction or picking up items. Begin the story in a randomly generated space and describe what the player sees. Only return json objects as responses. The objects should have the parameters \"story-text\", which is just a string of the generated description, \"possible-actions\", which is a list of possible actions that the user can take, \"location\" which is an x,y pair that denotes the Euclidian distance from the starting location in steps with north and east being the positive directions. Also include the parameter \"dall-e-prompt\" which contains a generated prompt for the generative art ai dall-e to produce an artistic storybook illustration of the current description with lots of details in a hand-drawn style. Keep track of the user's actions in a parameter called \"action-history\" that is a list of the actions that the user has take so far, with the corresponding location that the action happened.";

  const [messages, setMessages] = useState([]);
  const [messageHistory, setMessageHistory] = useState([["system", systemTemplate]]);
  const [input, setInput] = useState('');
  const [imgSrc, setImgSrc] = useState('https://drive.google.com/uc?export=download&id=1-pt5wSv9fbCwL9E07HdqPy7jaKNVnGui');
  const [possibleActions, setPossibleActions] = useState(['Action 1', 'Action 2', 'Action 3']);

  const navigate = useNavigate();
  const location = useLocation();
  const setting = location.state.setting;  // Getting the setting entered by the user

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
  const scrollToBottom = () => {
    messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
  };

  const chatPrompt = ChatPromptTemplate.fromMessages(messageHistory);

  async function getImage(prompt) {
    const response = await oai.images.generate({
        prompt: prompt,
        n: 1,
        size: "512x512",
    });
    setImgSrc(response.data[0].url);
  }

  useEffect(() => {
    async function fetchData() {
        const formatMessages = await chatPrompt.formatMessages({setting: setting});
        const result = await model.predictMessages(formatMessages);
        const parsed = JSON.parse(result.content)
        await setMessages([{ text: parsed["story-text"], sender: 'system' }]);
        await setMessageHistory([...messageHistory, ["ai",parsed["story-text"]]]);
        await getImage(parsed["dall-e-prompt"]);
        await setPossibleActions(parsed["possible-actions"]);
        scrollToBottom(); // Scroll to bottom when component mounts
    }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    scrollToBottom(); // Scroll to bottom when messages state changes
  }, [messages]);
  
  const humanTemplate = "{action}";

  // Handler for possible action buttons
  const handleActionClick = async (action) => {
    const chatPrompt = ChatPromptTemplate.fromMessages([...messageHistory,
            ["human", humanTemplate],
          ]);
    const formattedChatPrompt = await chatPrompt.formatMessages({
        setting: setting,
        action: action + "and respond ONLY with the JSON defined above",
        });
    await setMessages([...messages, { text: action, sender: 'human' }, { text: "Loading...", sender: 'system' }]);
    const result = await model.predictMessages(formattedChatPrompt);
    const parsed = JSON.parse(result.content)
    setInput('');
    await setMessages([...messages, { text: action, sender: 'human' }, { text: parsed["story-text"], sender: 'system' }]);
    messageHistory.push(["human", action]);
    messageHistory.push(["ai",parsed["story-text"]])
    await getImage(parsed["dall-e-prompt"]);
    await setPossibleActions(parsed["possible-actions"]);
    // You can add functionality here to handle action button clicks
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
    await setMessages([...messages, { text: input, sender: 'human' }, { text: parsed["story-text"], sender: 'system' }]);
    messageHistory.push(["human", input]);
    messageHistory.push(["ai",parsed["story-text"]])
    await getImage(parsed["dall-e-prompt"]);
    await setPossibleActions(parsed["possible-actions"]);
    // Here, you may want to implement a logic to add a system response
  };

  const handleBack = () => {
    navigate('/');
  };

  return (
    <div className="story-container">
      <div className="overlay" style={{
        backgroundImage: `url(${imgSrc})`
      }}></div>
      <h2 className="story-intro">Welcome to your new story set in {setting}. Let the adventure begin!</h2>
      <img src={imgSrc} alt="Story" className="story-image" />
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
      <input type="text" value={input} onChange={handleInput} className="message-input" />
      <button onClick={handleSubmit} className="submit-button">Submit</button>
      <button onClick={handleBack} className="back-button">Back</button>
    </div>
  );
}
