import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Story from './Story';
import Landing from './Landing';
import Dashboard from './Dashboard';
import { AuthProvider } from './contexts/AuthContext';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/story" element={<Story />} />
            <Route path="/dashboard" element={<Dashboard />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
