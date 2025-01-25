import React from 'react';
import { useNavigate } from 'react-router-dom';
import styled from '@emotion/styled';
import { motion } from 'framer-motion';
import { Button } from '../components/Button';
import { Container, PageContainer, pageTransition } from '../components/Container';

const HeroSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  height: 100vh;
  position: relative;
  overflow: hidden;
  padding: 2rem;
  margin: 0;
`;

const HeroTitle = styled(motion.h1)`
  font-size: clamp(2.5rem, 7vw, 4rem);
  font-weight: 800;
  margin-bottom: 1.5rem;
  line-height: 1.1;
  background: linear-gradient(
    135deg,
    var(--accent-primary) 0%,
    var(--accent-secondary) 50%,
    #ff6b6b 100%
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  filter: drop-shadow(0 0 20px rgba(95, 95, 255, 0.2));
  letter-spacing: -0.02em;
  position: relative;
  z-index: 1;
`;

const HeroSubtitle = styled(motion.p)`
  font-size: clamp(1rem, 2.5vw, 1.25rem);
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 2rem;
  max-width: 600px;
  line-height: 1.6;
  font-weight: 500;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  position: relative;
  z-index: 1;
`;

const WaveCanvas = styled.canvas`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  opacity: 0.4;
  z-index: 0;
`;

const Content = styled.div`
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
`;

const StyledButton = styled(motion(Button))`
  font-size: 1rem;
  padding: 0.75rem 2rem;
  background: linear-gradient(
    135deg,
    var(--accent-primary) 0%,
    var(--accent-secondary) 100%
  );
  border: none;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 200%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(255, 255, 255, 0.2) 50%,
      transparent 100%
    );
    transition: transform 0.6s ease;
  }
  
  &:hover::before {
    transform: translateX(50%);
  }
`;

const UploadSection = styled(motion.div)`
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
`;

const UploadInput = styled.input`
  display: none;
`;

const UploadLabel = styled.label`
  padding: 0.75rem 1.5rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px dashed rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9rem;
  color: var(--text-secondary);

  &:hover {
    background: rgba(255, 255, 255, 0.15);
    border-color: rgba(255, 255, 255, 0.4);
    color: var(--text-primary);
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

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [showUpload, setShowUpload] = React.useState(false);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const drawWaves = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, 'rgba(95, 95, 255, 0.2)');
      gradient.addColorStop(1, 'rgba(159, 111, 255, 0.2)');
      
      ctx.fillStyle = gradient;
      
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(0, canvas.height);
        
        for (let x = 0; x <= canvas.width; x += 10) {
          const y = Math.sin(x * 0.003 + time + i) * 50 + 
                   Math.sin(x * 0.007 + time + i) * 30 +
                   canvas.height * 0.7;
          ctx.lineTo(x, y);
        }
        
        ctx.lineTo(canvas.width, canvas.height);
        ctx.closePath();
        ctx.fill();
      }
      
      time += 0.005;
      animationFrameId = requestAnimationFrame(drawWaves);
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    drawWaves();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const formData = new FormData();
      formData.append('image', file);
      
      // Send to backend
      fetch('http://localhost:8000/api/upload', {
        method: 'POST',
        body: formData,
      })
      .then(response => response.json())
      .then(data => {
        // Store the response data (e.g., model URL) in state or context
        console.log('Upload successful:', data);
        navigate('/3d-demo', { state: { modelData: data } });
      })
      .catch(error => {
        console.error('Upload failed:', error);
        // Add error handling here
      });
    }
  };

  return (
    <PageContainer
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageTransition}
    >
      <WaveCanvas ref={canvasRef} />
      <Container>
        <HeroSection>
          <Content>
            <HeroTitle variants={titleVariants}>
              Relive Your Memories in 3D
            </HeroTitle>
            <HeroSubtitle variants={subtitleVariants}>
              Transform your cherished moments into immersive three-dimensional experiences. 
              Step into your photos and explore them like never before.
            </HeroSubtitle>
            {!showUpload ? (
              <StyledButton
                onClick={() => setShowUpload(true)}
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
              >
                Get Started
              </StyledButton>
            ) : (
              <UploadSection
                variants={uploadVariants}
                initial="initial"
                animate="animate"
              >
                <UploadLabel>
                  Choose an image to convert
                  <UploadInput 
                    type="file" 
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                </UploadLabel>
              </UploadSection>
            )}
          </Content>
        </HeroSection>
      </Container>
    </PageContainer>
  );
};

export default LandingPage; 