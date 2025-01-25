import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import LandingPage from './pages/LandingPage';
import ThreeDemo from './pages/ThreeDemo';
import Navbar from './components/Navbar';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Navbar />
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/three-demo" element={<ThreeDemo />} />
        </Routes>
      </AnimatePresence>
    </BrowserRouter>
  );
};

export default App; 