import React, { useState, useRef, useCallback, useEffect } from 'react';
import styled from '@emotion/styled';
import { motion } from 'framer-motion';
import { SecondaryButton } from '../components/Button';
import { Container, pageTransition } from '../components/Container';
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

const CanvasContainer = styled.div`
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  background: var(--bg-secondary);
  display: flex;
  justify-content: center;
  min-height: 600px;
  
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

const LoadingBar = styled.div<{ progress: number }>`
  position: absolute;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  width: 200px;
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  overflow: hidden;
  opacity: ${props => props.progress < 100 ? 1 : 0};
  transition: opacity 0.3s ease;

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: ${props => props.progress}%;
    background: linear-gradient(
      90deg,
      var(--accent-primary),
      var(--accent-secondary)
    );
    transition: width 0.3s ease;
  }
`;

const StyledPageContainer = styled(motion.div)`
  min-height: 100vh;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
`;

const ThreeDemo: React.FC = () => {
  const [status, setStatus] = useState('');
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [renderMode, setRenderMode] = useState<'processed' | 'raw'>('processed');
  const containerRef = useRef<HTMLDivElement>(null);
  const statusTimeoutRef = useRef<number>();

  const clearStatusTimeout = () => {
    if (statusTimeoutRef.current) {
      window.clearTimeout(statusTimeoutRef.current);
      statusTimeoutRef.current = undefined;
    }
  };

  const setStatusWithTimeout = (message: string, duration = 3000) => {
    clearStatusTimeout();
    setStatus(message);
    if (duration > 0) {
      statusTimeoutRef.current = window.setTimeout(() => {
        setStatus('');
        statusTimeoutRef.current = undefined;
      }, duration);
    }
  };

  const handleLoadProgress = useCallback((progress: number) => {
    if (!isLoading) return;
    setLoadingProgress(progress);
    setStatusWithTimeout(`Loading: ${Math.round(progress)}%`, 0);
  }, [isLoading]);

  const handleLoadError = useCallback((error: string) => {
    setIsLoading(false);
    setStatusWithTimeout(`Error: ${error}`);
  }, []);

  const handleLoadComplete = useCallback(() => {
    setIsLoading(false);
    setLoadingProgress(100);
    setStatusWithTimeout('Model loaded successfully');
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearStatusTimeout();
    };
  }, []);

  return (
    <StyledPageContainer
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageTransition}
    >
      <Container>
        <DemoContainer>
          <Controls>
            <SecondaryButton onClick={toggleFullscreen}>
              Toggle Fullscreen
            </SecondaryButton>
            <SecondaryButton onClick={() => setRenderMode(mode => mode === 'processed' ? 'raw' : 'processed')}>
              Switch to {renderMode === 'processed' ? 'Raw' : 'Processed'} OBJ
            </SecondaryButton>
          </Controls>
          
          <CanvasContainer ref={containerRef}>
            <ThreeScene 
              objUrl={renderMode === 'processed' ? "/models/denauny_panorama.obj" : undefined}
              localObjPath={renderMode === 'raw' ? "/models/panorama_mesh.obj" : undefined}
              onLoadProgress={handleLoadProgress}
              onLoadError={handleLoadError}
              onLoadComplete={handleLoadComplete}
            />
            <StatusText className={status ? 'visible' : ''}>
              {status}
            </StatusText>
            <LoadingBar progress={loadingProgress} />
          </CanvasContainer>
        </DemoContainer>
      </Container>
    </StyledPageContainer>
  );
};

export default ThreeDemo; 