import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import ThreeDemo from './pages/ThreeDemo';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Navbar />
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/3d-demo" element={<ThreeDemo />} />
        </Routes>
      </AnimatePresence>
    </BrowserRouter>
  );
};

export default App; 