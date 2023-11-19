import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import background from './background.png'; 
import './Landing.css'; 

export default function Landing() {
  const [setting, setSetting] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setSetting(e.target.value);
  };

  const handleSubmit = () => {
    navigate('/story', { state: { setting } });
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
        <p>Enter a setting for a new adventure:</p>
        <input type="text" value={setting} onChange={handleChange} placeholder="Enter a setting" />
        <button onClick={handleSubmit}>Start</button>
      </div>
    </div>
  );
}
