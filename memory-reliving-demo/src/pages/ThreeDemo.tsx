import React, { useState, useRef } from 'react';
import styled from '@emotion/styled';
import { motion } from 'framer-motion';
import { Button, SecondaryButton } from '../components/Button';
import { Container, PageContainer, pageTransition } from '../components/Container';
import ThreeScene from '../components/ThreeScene';

const DemoContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
`;

const Controls = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
  justify-content: center;
`;

const Input = styled.input`
  background: var(--bg-secondary);
  border: 1px solid var(--text-secondary);
  border-radius: 6px;
  padding: 0.75rem;
  color: var(--text-primary);
  width: 300px;
  
  &:focus {
    outline: none;
    border-color: var(--accent-primary);
  }
`;

const CanvasContainer = styled.div`
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  background: var(--bg-secondary);
  display: flex;
  justify-content: center;
  
  &:fullscreen {
    padding: 0;
    width: 100vw;
    height: 100vh;
    border-radius: 0;
  }
`;

const StatusText = styled.div`
  position: absolute;
  top: 1rem;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.7);
  padding: 0.5rem 1rem;
  border-radius: 4px;
  color: var(--text-primary);
  font-size: 0.875rem;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.3s ease;
  
  &.visible {
    opacity: 1;
  }
`;

const ThreeDemo: React.FC = () => {
  const [objUrl, setObjUrl] = useState('');
  const [loadedUrl, setLoadedUrl] = useState('');
  const [status, setStatus] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const statusTimeoutRef = useRef<number>();

  const handleLoadObj = () => {
    if (!objUrl) return;
    
    setStatus('Loading model...');
    setLoadedUrl(objUrl);
    
    // Clear previous timeout if exists
    if (statusTimeoutRef.current) {
      window.clearTimeout(statusTimeoutRef.current);
    }
    
    // Clear status after 3 seconds
    statusTimeoutRef.current = window.setTimeout(() => {
      setStatus('');
    }, 3000);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <PageContainer
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageTransition}
    >
      <Container>
        <DemoContainer>
          <Controls>
            <Input
              type="text"
              placeholder="Enter OBJ URL"
              value={objUrl}
              onChange={e => setObjUrl(e.target.value)}
            />
            <Button onClick={handleLoadObj} disabled={!objUrl}>
              Load Model
            </Button>
            <SecondaryButton onClick={toggleFullscreen}>
              Toggle Fullscreen
            </SecondaryButton>
          </Controls>
          
          <CanvasContainer ref={containerRef}>
            <ThreeScene objUrl={loadedUrl} onLoadProgress={progress => {
              setStatus(`Loading: ${Math.round(progress)}%`);
            }} onLoadError={error => {
              setStatus(`Error: ${error}`);
              setTimeout(() => setStatus(''), 3000);
            }} onLoadComplete={() => {
              setStatus('Model loaded successfully');
              setTimeout(() => setStatus(''), 3000);
            }} />
            <StatusText className={status ? 'visible' : ''}>
              {status}
            </StatusText>
          </CanvasContainer>
        </DemoContainer>
      </Container>
    </PageContainer>
  );
};

export default ThreeDemo; 