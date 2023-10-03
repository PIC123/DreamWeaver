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

  console.log("apiKey", process.env.REACT_APP_OPENAI_API_KEY);

  const oai = new OAI({
    apiKey: process.env.REACT_APP_OPENAI_API_KEY,
    dangerouslyAllowBrowser: true,
    // apiKey: "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", dangerouslyAllowBrowser: true,
  });

  const model = new ChatOpenAI({
    // openAIApiKey: "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",
    openAIApiKey: process.env.REACT_APP_OPENAI_API_KEY,
    modelName: "gpt-4",
    // openAIApiKey: process.env.OPENAI_API_KEY,
  });

  const messagesEndRef = useRef(null); // Create a ref
  const scrollToBottom = () => {
    messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
  };

//   const messageHistory = [["system", systemTemplate]];

// const model = new OpenAI({openAIApiKey: "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",});

//   const pastMessages = [
//     new SystemMessage(`Act as a terminal for a zork clone text based dungeon adventure game based in ${setting}. Respond only with descriptions of the environment and react to basic commands like moving in a direction or picking up items. Begin the story in a randomly generated space and describe what the player sees. Only return json objects as responses. The objects should have the parameters \"story-text\", which is just a string of the generated description, \"possible-actions\", which is a list of possible actions that the user can take, \"location\" which is an x,y pair that denotes the Euclidian distance from the starting location in steps with north and east being the positive directions. Also include the parameter \"dall-e-prompt\" which contains a generated prompt for the generative art ai dall-e to produce a digital painting of the current description with lots of details in a hand-drawn style. Keep track of the user's actions in a parameter called \"action-history\" that is a list of the actions that the user has take so far, with the corresponding location that the action happened.`),
//   ];

//   const memory = new BufferMemory({
//     chatHistory: new ChatMessageHistory(pastMessages),
//   });

//   const memory = new BufferMemory({
//     chatHistory: new ChatMessageHistory(),
//   });

//   const chain = new ConversationChain({ llm: model, memory: memory,})

  const chatPrompt = ChatPromptTemplate.fromMessages(messageHistory);

  async function getImage(prompt) {
    const response = await oai.images.generate({
        prompt: prompt,
        n: 1,
        size: "512x512",
    });
    console.log("response", response);
    setImgSrc(response.data[0].url);
  }

  useEffect(() => {
    console.log('The story page has loaded for the first time.');
    async function fetchData() {
        console.log("promptMessages", chatPrompt.promptMessages);
        const formatMessages = await chatPrompt.formatMessages({setting: setting});
        const result = await model.predictMessages(formatMessages);
        console.log("result", result);
        const parsed = JSON.parse(result.content)
        await setMessages([{ text: parsed["story-text"], sender: 'system' }]);
        await setMessageHistory([...messageHistory, ["ai",parsed["story-text"]]]);
        // messageHistory.push(["ai",result.content])
        await getImage(parsed["dall-e-prompt"]);
        await setPossibleActions(parsed["possible-actions"]);
        console.log("messageHistory1: ", messageHistory);
        scrollToBottom(); // Scroll to bottom when component mounts
        // setImgSrc(image_url);
    }
    fetchData();
    // const result = await chain.invoke({input: input});
    
    // const result = await model.predictMessages(starterChatPrompt);
    // console.log("result", result);
    // const parsed = JSON.parse(result.content)
    // setMessages([...messages, { text: parsed["story-text"], sender: 'system' }]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    scrollToBottom(); // Scroll to bottom when messages state changes
  }, [messages]);
  
  const humanTemplate = "{action}";


//   const chatPrompt = ChatPromptTemplate.fromMessages([
//     ["human", humanTemplate],
//   ]);

//   const chain = chatPrompt.pipe(model);

  // Handler for possible action buttons
  const handleActionClick = async (action) => {
    console.log('Action clicked:', action);
    console.log("setting", setting);
    console.log("messageHistory2:", messageHistory);
    const chatPrompt = ChatPromptTemplate.fromMessages([...messageHistory,
            ["human", humanTemplate],
          ]);
    // const result = await chain.invoke({
    //     setting: setting,
    //     action: input,
    //   });
    const formattedChatPrompt = await chatPrompt.formatMessages({
        setting: setting,
        action: action + "and respond ONLY with the JSON defined above",
        });
    console.log("formattedChatPrompt", formattedChatPrompt);
    await setMessages([...messages, { text: action, sender: 'human' }, { text: "Loading...", sender: 'system' }]);
    console.log("messageHistory3:", messageHistory);
    const result = await model.predictMessages(formattedChatPrompt);
    // const result = await chain.invoke({input: input});
    console.log("result", result);
    const parsed = JSON.parse(result.content)
    setInput('');
    await setMessages([...messages, { text: action, sender: 'human' }, { text: parsed["story-text"], sender: 'system' }]);
    // await setMessageHistory([...messageHistory, ["human", input], ["ai",parsed["story-text"]]]);
    messageHistory.push(["human", action]);
    messageHistory.push(["ai",parsed["story-text"]])
    await getImage(parsed["dall-e-prompt"]);
    await setPossibleActions(parsed["possible-actions"]);
    console.log("messageHistory: ", messageHistory);
    // You can add functionality here to handle action button clicks
  };

  const handleInput = (e) => {
    setInput(e.target.value);
  };

  const handleSubmit = async () => {
    // setMessages([...messages, { text: input, sender: 'user' }]);
    // const chatModelResult = await chatModel.predict(text);
    console.log("input", input);
    console.log("setting", setting);
    console.log("messageHistory2:", messageHistory);
    const chatPrompt = ChatPromptTemplate.fromMessages([...messageHistory,
            ["human", humanTemplate],
          ]);
    // const result = await chain.invoke({
    //     setting: setting,
    //     action: input,
    //   });
    const formattedChatPrompt = await chatPrompt.formatMessages({
        setting: setting,
        action: input + "and respond ONLY with the JSON defined above",
        });
    console.log("formattedChatPrompt", formattedChatPrompt);
    await setMessages([...messages, { text: input, sender: 'human' }, { text: "Loading...", sender: 'system' }]);
    console.log("messageHistory3:", messageHistory);
    const result = await model.predictMessages(formattedChatPrompt);
    // const result = await chain.invoke({input: input});
    console.log("result", result);
    const parsed = JSON.parse(result.content)
    setInput('');
    await setMessages([...messages, { text: input, sender: 'human' }, { text: parsed["story-text"], sender: 'system' }]);
    // await setMessageHistory([...messageHistory, ["human", input], ["ai",parsed["story-text"]]]);
    messageHistory.push(["human", input]);
    messageHistory.push(["ai",parsed["story-text"]])
    await getImage(parsed["dall-e-prompt"]);
    await setPossibleActions(parsed["possible-actions"]);
    console.log("messageHistory: ", messageHistory);
    // setImgSrc(image_url);
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
