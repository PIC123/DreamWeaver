import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import background from './background.png'; 
import './Landing.css'; 

export default function Landing() {
  const [setting, setSetting] = useState('');
  // const [storyId, setStoryId] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setSetting(e.target.value);
  };

  // const handleIdChange = (e) => {
  //   setStoryId(e.target.value);
  // };    

  const handleSubmit = () => {
    navigate('/story', { state: { setting } });
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
        handleSubmit();
    }
  };

  return (
    <div 
      className="landing-container"
      style={{
        backgroundImage: `url(${background})`,
        backgroundSize: 'cover',
        opacity: 0.5,
        height: '100vh'
      }}
    >
      <div className="input-container">
        <p>Enter a setting for a new story:</p>
        <input type="text" value={setting} onChange={handleChange} onKeyPress={handleKeyPress} placeholder="Enter a setting" />
        {/* <input type="text" value={storyId} onChange={handleIdChange} placeholder="Enter Story ID to Continue" /> */}
        <button onClick={handleSubmit}>Start</button>
      </div>
    </div>
  );
}
