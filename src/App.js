import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './HomePage';
import FPLData from './FPLData';
import './HomePage.css';
import './index.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/fpl-data" element={<FPLData />} />
      </Routes>
    </Router>
  );
}

export default App; 