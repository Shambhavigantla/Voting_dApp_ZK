import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import VoterRegistration from './components/VoterRegistration';
import VotingBooth from './components/VotingBooth';
import { Web3Provider } from './contexts/Web3Context';
import './App.css'; // Optional: for basic styling

function App() {
  return (
    <Web3Provider>
      <Router>
        <div className="App">
          <nav>
            <Link to="/">Register Voter (Admin)</Link> | <Link to="/vote">Voting Booth</Link>
          </nav>
          <h1>Decentralized Voting Platform</h1>
          <Routes>
            <Route path="/" element={<VoterRegistration />} />
            <Route path="/vote" element={<VotingBooth />} />
          </Routes>
        </div>
      </Router>
    </Web3Provider>
  );
}

export default App;