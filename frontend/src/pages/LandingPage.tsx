import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from '@emotion/styled';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../components/Button';
import { Container, PageContainer, pageTransition } from '../components/Container';

const ShootingStarsBackground = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  overflow: hidden;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0.7));

  &::before,
  &::after,
  .star-1,
  .star-2,
  .star-3 {
    content: '';
    position: absolute;
    width: 3px;
    height: 3px;
    background: #fff;
    box-shadow: 
      0 0 15px #fff,
      0 0 30px #fff,
      0 0 40px #ff00ff,
      0 0 80px #ff00ff;
    border-radius: 50%;
    animation: shootingStars 4s linear infinite;
    opacity: 0;
  }

  &::before {
    top: 10%;
    left: 50%;
    animation-delay: 0s;
  }

  &::after {
    top: 30%;
    left: 20%;
    animation-delay: 2s;
  }

  .star-1 {
    top: 50%;
    left: 70%;
    animation-delay: 4s;
  }

  .star-2 {
    top: 70%;
    left: 40%;
    animation-delay: 6s;
  }

  .star-3 {
    top: 90%;
    left: 60%;
    animation-delay: 8s;
  }

  @keyframes shootingStars {
    0% {
      transform: rotate(45deg) translateX(0);
      opacity: 1;
    }
    15% {
      transform: rotate(45deg) translateX(900px);
      opacity: 1;
    }
    30%, 100% {
      transform: rotate(45deg) translateX(1800px);
      opacity: 0;
    }
  }
`;

const StarField = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  
  &::before {
    content: '';
    position: absolute;
    width: 100%;
    height: 100%;
    background-image: 
      radial-gradient(3px 3px at 20px 30px, #fff, rgba(0,0,0,0)),
      radial-gradient(3px 3px at 40px 70px, #fff, rgba(0,0,0,0)),
      radial-gradient(3px 3px at 50px 160px, #fff, rgba(0,0,0,0)),
      radial-gradient(2px 2px at 90px 40px, #fff, rgba(0,0,0,0)),
      radial-gradient(2px 2px at 130px 80px, #fff, rgba(0,0,0,0)),
      radial-gradient(3px 3px at 160px 120px, #fff, rgba(0,0,0,0)),
      radial-gradient(3px 3px at 200px 150px, #fff, rgba(0,0,0,0)),
      radial-gradient(3px 3px at 250px 220px, #fff, rgba(0,0,0,0)),
      radial-gradient(2px 2px at 300px 180px, #fff, rgba(0,0,0,0));
    background-repeat: repeat;
    background-size: 300px 300px;
    animation: twinkle 4s ease-in-out infinite;
    opacity: 0.8;
  }

  @keyframes twinkle {
    0%, 100% { opacity: 0.8; }
    50% { opacity: 1; }
  }
`;

const FloatingPhotos = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  pointer-events: none;
`;

const Photo = styled(motion.div)<{ $index: number }>`
  position: absolute;
  width: 70px;
  height: 70px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 0, 255, 0.2);
  border-radius: 6px;
  transform-style: preserve-3d;
  box-shadow: 
    0 0 15px rgba(255, 0, 255, 0.1),
    inset 0 0 15px rgba(0, 255, 255, 0.1);
  backdrop-filter: blur(3px);
  animation: float\${props => props.$index} 15s ease-in-out infinite;
  animation-delay: \${props => props.$index * -3}s;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      45deg,
      transparent,
      rgba(255, 255, 255, 0.1) 50%,
      transparent
    );
    animation: shine 2s linear infinite;
  }

  @keyframes float1 {
    0%, 100% { transform: translate3d(0, 0, 0) rotate(0deg); }
    25% { transform: translate3d(50px, -50px, 100px) rotate(5deg); }
    50% { transform: translate3d(100px, 0, 200px) rotate(-5deg); }
    75% { transform: translate3d(50px, 50px, 100px) rotate(5deg); }
  }

  @keyframes float2 {
    0%, 100% { transform: translate3d(0, 0, 0) rotate(0deg); }
    25% { transform: translate3d(-50px, 50px, 150px) rotate(-5deg); }
    50% { transform: translate3d(-100px, 0, 300px) rotate(5deg); }
    75% { transform: translate3d(-50px, -50px, 150px) rotate(-5deg); }
  }

  @keyframes float3 {
    0%, 100% { transform: translate3d(0, 0, 0) rotate(0deg); }
    25% { transform: translate3d(30px, 30px, 200px) rotate(5deg); }
    50% { transform: translate3d(60px, -30px, 400px) rotate(-5deg); }
    75% { transform: translate3d(30px, -30px, 200px) rotate(5deg); }
  }

  @keyframes shine {
    0% { transform: translateX(-100%) rotate(45deg); }
    100% { transform: translateX(100%) rotate(45deg); }
  }
`;

const GlowingOrbs = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  pointer-events: none;
`;

const Orb = styled.div<{ $size: number; $x: number; $y: number }>`
  position: absolute;
  width: \${props => props.$size * 0.7}px;
  height: \${props => props.$size * 0.7}px;
  left: \${props => props.$x}%;
  top: \${props => props.$y}%;
  background: radial-gradient(
    circle at center,
    rgba(255, 0, 255, 0.1) 0%,
    rgba(0, 255, 255, 0.1) 50%,
    transparent 70%
  );
  border-radius: 50%;
  filter: blur(15px);
  opacity: 0.5;
`;

const HeroSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  min-height: 90vh;
  position: relative;
  overflow: hidden;
  padding: 2rem;
  margin: 0;
`;

const HeroTitle = styled(motion.h1)`
  font-size: clamp(2rem, 5vw, 3.5rem);
  font-weight: 900;
  margin-bottom: 1rem;
  line-height: 1;
  background: linear-gradient(
    135deg,
    #ff99ff 0%,
    #ffffff 50%,
    #ff99ff 100%
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  filter: drop-shadow(0 0 2px rgba(255, 255, 255, 0.8))
         drop-shadow(0 0 25px rgba(255, 0, 255, 0.8));
  letter-spacing: -0.02em;
  position: relative;
  z-index: 2;
  text-align: center;
`;

const HeroSubtitle = styled(motion.p)`
  font-size: clamp(0.8rem, 1.5vw, 1rem);
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 1rem;
  max-width: 450px;
  line-height: 1.6;
  font-weight: 500;
  position: relative;
  z-index: 2;
  text-align: center;
  letter-spacing: 0.02em;
  background: linear-gradient(
    135deg,
    rgba(0, 0, 0, 0.4) 0%,
    rgba(83, 0, 83, 0.4) 100%
  );
  padding: 1.2rem;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(8px);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
`;

const Content = styled.div`
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
`;

const UploadSection = styled(motion.div)`
  margin-top: 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  background: rgba(0, 0, 0, 0.7);
  padding: 1.5rem;
  border-radius: 8px;
  border: 1px solid #ff00ff30;
  box-shadow: 
    0 0 20px #ff00ff20,
    0 0 40px #ff00ff10;
  backdrop-filter: blur(10px);
  max-width: 300px;
  width: 90%;
`;

const TextInput = styled.input`
  background: rgba(0, 0, 0, 0.5);
  border: 1px solid #ff00ff30;
  border-radius: 6px;
  padding: 0.75rem 1rem;
  color: #fff;
  font-size: 0.9rem;
  width: 100%;
  transition: all 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: #ff00ff;
    box-shadow: 0 0 15px #ff00ff40;
  }
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
`;

const FileUploadButton = styled.label`
  background: linear-gradient(45deg, #ff00ff40, #00ffff40);
  border: 1px solid #ff00ff60;
  border-radius: 6px;
  padding: 0.75rem 1rem;
  color: #fff;
  font-size: 0.9rem;
  cursor: pointer;
  text-align: center;
  transition: all 0.3s ease;
  width: 100%;
  
  &:hover {
    background: linear-gradient(45deg, #ff00ff60, #00ffff60);
    box-shadow: 0 0 20px #ff00ff30;
  }
  
  input {
    display: none;
  }
`;

const StyledButton = styled(motion(Button))`
  font-size: 0.9rem;
  padding: 0.75rem 2rem;
  background: linear-gradient(
    135deg,
    #ff00ff 0%,
    #00ffff 100%
  );
  border: none;
  position: relative;
  overflow: hidden;
  width: auto;
  border-radius: 8px;
  font-weight: 600;
  letter-spacing: 0.5px;
  
  &:hover {
    box-shadow: 
      0 0 30px #ff00ff40,
      0 0 60px #ff00ff20;
    transform: translateY(-2px);
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.2),
      transparent
    );
    animation: shine 3s infinite;
  }

  @keyframes shine {
    0% { left: -100%; }
    20% { left: 100%; }
    100% { left: 100%; }
  }
`;

const titleVariants = {
  initial: { opacity: 0, y: 30 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.6, -0.05, 0.01, 0.99]
    }
  }
};

const subtitleVariants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      delay: 0.1,
      ease: [0.6, -0.05, 0.01, 0.99]
    }
  }
};

const buttonVariants = {
  initial: { opacity: 0, y: 10 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      delay: 0.2,
      ease: [0.6, -0.05, 0.01, 0.99]
    }
  },
  hover: {
    scale: 1.03,
    transition: {
      duration: 0.2,
      ease: "easeInOut"
    }
  },
  tap: {
    scale: 0.98
  }
};

const uploadVariants = {
  initial: { opacity: 0, y: 10 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, delay: 0.3 }
  }
};

const DynamicLines = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  opacity: 0.15;
  
  &::before {
    content: '';
    position: absolute;
    width: 150%;
    height: 150%;
    background: repeating-linear-gradient(
      90deg,
      transparent,
      transparent 80px,
      rgba(255, 0, 255, 0.1) 80px,
      rgba(255, 0, 255, 0.1) 81px
    );
    transform: rotate(-45deg) translateY(-50%) translateX(-50%);
    animation: movingLines 30s linear infinite;
  }
`;

const SolarSystem = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  overflow: hidden;
  background: radial-gradient(circle at center, rgba(0, 0, 0, 0.8), #000000);
`;

const CyberGrid = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  perspective: 1000px;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    width: 200%;
    height: 200%;
    top: -50%;
    left: -50%;
    background: 
      linear-gradient(90deg, rgba(255, 0, 255, 0.1) 1px, transparent 1px) 0 0 / 50px 50px,
      linear-gradient(rgba(0, 255, 255, 0.1) 1px, transparent 1px) 0 0 / 50px 50px;
    transform: rotateX(45deg);
    animation: gridMove 20s linear infinite;
  }

  @keyframes gridMove {
    0% {
      transform: rotateX(45deg) translateY(0);
    }
    100% {
      transform: rotateX(45deg) translateY(50%);
    }
  }
`;

const Sun = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 60px;
  height: 60px;
  background: radial-gradient(circle at 30% 30%, #ffd700, #ff4500);
  border-radius: 50%;
  box-shadow: 
    0 0 40px rgba(255, 215, 0, 0.4),
    0 0 60px rgba(255, 69, 0, 0.3);
  z-index: 1;
  
  &::after {
    content: '';
    position: absolute;
    top: -15px;
    left: -15px;
    right: -15px;
    bottom: -15px;
    border-radius: 50%;
    background: radial-gradient(circle at center, rgba(255, 215, 0, 0.3), transparent 70%);
    animation: pulse 4s ease-in-out infinite;
  }
`;

const Planet = styled.div<{ $size: number; $orbitSize: number; $speed: number; $color: string }>`
  position: absolute;
  top: 50%;
  left: 50%;
  width: ${props => props.$size}px;
  height: ${props => props.$size}px;
  margin-top: -${props => props.$size / 2}px;
  margin-left: -${props => props.$size / 2}px;
  border-radius: 50%;
  background: radial-gradient(circle at 30% 30%, ${props => props.$color}, rgba(0, 0, 0, 0.8));
  box-shadow: 
    0 0 ${props => props.$size}px ${props => props.$color},
    0 0 ${props => props.$size * 2}px rgba(255, 255, 255, 0.4),
    inset 0 0 ${props => props.$size / 2}px rgba(255, 255, 255, 0.6);
  z-index: 2;

  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: ${props => props.$orbitSize}px;
    height: ${props => props.$orbitSize}px;
    transform: translate(-50%, -50%);
    border: 2px solid rgba(255, 255, 255, 0.2);
    border-radius: 50%;
    box-shadow: 0 0 20px rgba(255, 255, 255, 0.1);
  }

  animation: orbit${props => props.$orbitSize} ${props => props.$speed}s linear infinite;

  @keyframes orbit${props => props.$orbitSize} {
    from { transform: rotate(0deg) translateX(${props => props.$orbitSize / 2}px); }
    to { transform: rotate(360deg) translateX(${props => props.$orbitSize / 2}px); }
  }
`;

const StyleSelectionContainer = styled(motion.div)`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  width: 100%;
  max-width: 600px;
  margin-top: 1rem;
`;

const StyleButton = styled(motion.button)`
  background: rgba(0, 0, 0, 0.5);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 1.5rem;
  color: white;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;

  &::before {
    content: '';
    position: absolute;
    top: -2px;
    left: -2px;
    right: -2px;
    bottom: -2px;
    background: linear-gradient(45deg, #ff00ff, #00ffff);
    z-index: -1;
    opacity: 0;
    transition: opacity 0.3s ease;
    border-radius: 12px;
  }

  &:hover {
    transform: translateY(-2px);
    border-color: transparent;
    
    &::before {
      opacity: 1;
    }
  }

  .icon {
    font-size: 2rem;
    margin-bottom: 0.5rem;
  }

  .title {
    font-weight: 600;
    font-size: 1rem;
    margin-bottom: 0.25rem;
  }

  .description {
    font-size: 0.8rem;
    opacity: 0.7;
    text-align: center;
  }
`;

const getStageText = (showStyles: boolean, showUpload: boolean) => {
  if (showStyles) {
    return "Choose a theme for your 3D transformation. Each style offers a unique visual experience.";
  } else if (showUpload) {
    return "Upload your panoramic photo and add an optional description to enhance the transformation.";
  }
  return "Transform your cherished moments into immersive three-dimensional experiences. Step into your photos and explore them like never before.";
};

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [showUpload, setShowUpload] = useState(false);
  const [showStyles, setShowStyles] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [imagination, setImagination] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');

  const handleStyleSelect = (style: string) => {
    setSelectedStyle(style);
    setShowStyles(false);
    setShowUpload(true);
  };

  const handleGetStarted = () => {
    setShowStyles(true);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!selectedStyle) return;
    
    try {
      let response;
      
      if (selectedFile) {
        // Handle image upload case
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('style', selectedStyle);
        
        response = await fetch('http://localhost:8000/upload', {
          method: 'POST',
          body: formData,
        });
      } else if (prompt) {
        // Handle text prompt case
        response = await fetch('http://localhost:8000/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt,
            style: selectedStyle
          }),
        });
      } else {
        throw new Error('Either file or prompt is required');
      }

      if (!response.ok) throw new Error('Request failed');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setFileUrl(url);
      navigate('/three-demo', { state: { fileUrl: url } });
    } catch (error) {
      console.error('Request failed:', error);
    }
  };

  return (
    <PageContainer
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageTransition}
    >
      <StarField />
      <CyberGrid />
      <SolarSystem>
        <Sun />
        {/* Mercury */}
        <Planet $size={30} $orbitSize={300} $speed={15} $color="#A0522D" />
        {/* Venus */}
        <Planet $size={45} $orbitSize={400} $speed={20} $color="#DEB887" />
        {/* Earth */}
        <Planet $size={50} $orbitSize={500} $speed={25} $color="#4169E1" />
        {/* Mars */}
        <Planet $size={40} $orbitSize={600} $speed={30} $color="#CD5C5C" />
        {/* Jupiter */}
        <Planet $size={80} $orbitSize={750} $speed={35} $color="#DAA520" />
        {/* Saturn */}
        <Planet $size={70} $orbitSize={900} $speed={40} $color="#F4A460" />
        {/* Uranus */}
        <Planet $size={55} $orbitSize={1050} $speed={45} $color="#87CEEB" />
        {/* Neptune */}
        <Planet $size={55} $orbitSize={1200} $speed={50} $color="#1E90FF" />
      </SolarSystem>
      <DynamicLines />
      <GlowingOrbs>
        {Array.from({ length: 3 }).map((_, i) => (
          <Orb
            key={i}
            $size={60 + Math.random() * 100}
            $x={Math.random() * 100}
            $y={Math.random() * 100}
          />
        ))}
      </GlowingOrbs>
      <FloatingPhotos>
        {Array.from({ length: 3 }).map((_, i) => (
          <Photo
            key={i}
            $index={i + 1}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 0.8, scale: 1 }}
            transition={{ delay: i * 0.2, duration: 0.5 }}
          />
        ))}
      </FloatingPhotos>
      <Container>
        <HeroSection>
          <Content>
            <HeroTitle>
              Relive your memories in 3D
            </HeroTitle>
            <HeroSubtitle 
              key={showStyles ? 'styles' : showUpload ? 'upload' : 'initial'}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              {getStageText(showStyles, showUpload)}
            </HeroSubtitle>
            <AnimatePresence mode="wait">
              {!showStyles && !showUpload ? (
                <StyledButton
                  key="get-started"
                  onClick={handleGetStarted}
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                >
                  Get Started
                </StyledButton>
              ) : showStyles ? (
                <StyleSelectionContainer
                  key="style-selection"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <StyleButton
                    onClick={() => handleStyleSelect('photorealistic')}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span className="icon">📸</span>
                    <span className="title">Photorealistic</span>
                    <span className="description">Ultra-realistic 3D conversion</span>
                  </StyleButton>
                  <StyleButton
                    onClick={() => handleStyleSelect('painting')}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span className="icon">🎨</span>
                    <span className="title">Oil Canvas</span>
                    <span className="description">Artistic painting style</span>
                  </StyleButton>
                  <StyleButton
                    onClick={() => handleStyleSelect('cyberpunk')}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span className="icon">🌆</span>
                    <span className="title">Cyberpunk</span>
                    <span className="description">Futuristic neon aesthetic</span>
                  </StyleButton>
                </StyleSelectionContainer>
              ) : (
                <UploadSection
                  key="upload-section"
                  variants={uploadVariants}
                  initial="initial"
                  animate="animate"
                  exit={{ opacity: 0, y: 20 }}
                >
                  <TextInput
                    type="text"
                    placeholder="Enter a prompt or upload an image..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                  />
                  <FileUploadButton>
                    {selectedFile ? selectedFile.name : 'Or choose an image'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                  </FileUploadButton>
                  <StyledButton
                    onClick={handleSubmit}
                    variants={buttonVariants}
                    whileHover="hover"
                    whileTap="tap"
                    disabled={!selectedStyle || (!selectedFile && !prompt)}
                  >
                    Transform
                  </StyledButton>
                </UploadSection>
              )}
            </AnimatePresence>
          </Content>
        </HeroSection>
      </Container>
    </PageContainer>
  );
};

export default LandingPage; 