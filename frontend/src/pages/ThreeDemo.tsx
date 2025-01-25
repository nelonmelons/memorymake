import React, { useState, useRef, useCallback, useEffect } from "react";
import styled from "@emotion/styled";
import { motion } from "framer-motion";
import { SecondaryButton } from "../components/Button";
import { Container, pageTransition } from "../components/Container";
import ThreeScene from "../components/ThreeScene";

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
  width: 100%;
  height: 600px;

  &:fullscreen {
    padding: 0;
    margin: 0;
    width: 100vw;
    height: 100vh;
    border-radius: 0;
    background: var(--bg-primary);
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

// Add interfaces for styled components
interface UploadContainerProps {
  isVisible: boolean;
}

const UploadContainer = styled.div<UploadContainerProps>`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.85);
  padding: 2rem;
  border-radius: 12px;
  border: 1px solid #ff00ff40;
  box-shadow: 0 0 20px #ff00ff20, inset 0 0 10px #ff00ff10;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  max-width: 400px;
  width: 90%;
  z-index: 10;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
  opacity: ${props => props.isVisible ? 1 : 0};
  pointer-events: ${props => props.isVisible ? 'auto' : 'none'};
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
    box-shadow: 0 0 10px #ff00ff40;
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
  
  &:hover {
    background: linear-gradient(45deg, #ff00ff60, #00ffff60);
    box-shadow: 0 0 15px #ff00ff30;
  }
  
  input {
    display: none;
  }
`;

const SubmitButton = styled(motion.button)`
  background: linear-gradient(45deg, #ff00ff, #00ffff);
  border: none;
  border-radius: 6px;
  padding: 0.75rem 1rem;
  color: #fff;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    box-shadow: 0 0 20px #ff00ff50;
    transform: translateY(-1px);
  }
`;

const ThreeDemo: React.FC = () => {
  const [status, setStatus] = useState('');
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showUpload, setShowUpload] = useState(true);
  const [imagination, setImagination] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
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
        setStatus("");
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

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) return;
    
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('imagination', imagination);
    
    try {
      setIsLoading(true);
      const response = await fetch('http://localhost:8000/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) throw new Error('Upload failed');
      
      setShowUpload(false);
      setStatusWithTimeout('Upload successful! Processing your image...');
    } catch (error) {
      setStatusWithTimeout('Upload failed. Please try again.');
    } finally {
      setIsLoading(false);
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
          </Controls>

          <CanvasContainer ref={containerRef}>
            <ThreeScene 
              objUrl="/models/denauny_panorama.obj"
              onLoadProgress={handleLoadProgress}
              onLoadError={handleLoadError}
              onLoadComplete={handleLoadComplete}
            />
            <UploadContainer isVisible={showUpload}>
              <TextInput
                type="text"
                placeholder="Give us your imagination..."
                value={imagination}
                onChange={(e) => setImagination(e.target.value)}
              />
              <FileUploadButton>
                {selectedFile ? selectedFile.name : 'Choose an image'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                />
              </FileUploadButton>
              <SubmitButton
                onClick={handleSubmit}
                disabled={!selectedFile || isLoading}
                whileTap={{ scale: 0.98 }}
              >
                {isLoading ? 'Uploading...' : 'Transform'}
              </SubmitButton>
            </UploadContainer>
            <StatusText className={status ? "visible" : ""}>
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
