import React, { useState, useRef, useCallback, useEffect } from "react";
import styled from "@emotion/styled";
import { motion, AnimatePresence } from "framer-motion";
import { SecondaryButton } from "../components/Button";
import { Container, pageTransition, PageContainer } from "../components/Container";
import ThreeScene from "../components/ThreeScene";
import { FiMaximize2, FiZoomIn, FiZoomOut, FiFolder, FiMenu, FiX, FiBarChart2, FiMove } from 'react-icons/fi';

// Add interfaces for styled components
interface ToggleSidebarButtonProps {
  isSidebarOpen: boolean;
}

interface ViewerContainerProps {
  isSidebarOpen: boolean;
}

interface LoadingContainerProps {
  isLoading: boolean;
}

const DemoLayout = styled.div`
  display: flex;
  width: 100%;
  height: 100vh;
  background: #000;
  position: relative;
`;

const Sidebar = styled(motion.div)`
  width: 280px;
  background: rgba(0, 0, 0, 0.8);
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  backdrop-filter: blur(10px);
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  z-index: 10;
`;

const ToggleSidebarButton = styled(motion.button)<ToggleSidebarButtonProps>`
  position: fixed;
  top: 1rem;
  left: ${props => props.isSidebarOpen ? '300px' : '1rem'};
  background: rgba(0, 0, 0, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  cursor: pointer;
  z-index: 100;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    transform: scale(1.1);
  }
`;

const ViewerContainer = styled.div<ViewerContainerProps>`
  flex: 1;
  height: 100%;
  position: relative;
  background: #000;
  margin-left: ${props => props.isSidebarOpen ? '280px' : '0'};
  transition: margin-left 0.3s ease;
  
  canvas {
    width: 100% !important;
    height: 100% !important;
  }
`;

const NavButton = styled(motion.button)`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 1rem;
  color: white;
  display: flex;
  align-items: center;
  gap: 1rem;
  width: 100%;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.9rem;

  svg {
    font-size: 1.2rem;
    opacity: 0.8;
  }

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.2);
    transform: translateX(5px);
  }
`;

const NavSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const SectionTitle = styled.h3`
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 0.5rem;
`;

const ZoomControls = styled(motion.div)`
  display: flex;
  gap: 0.5rem;
  
  button {
    flex: 1;
    padding: 0.75rem;
  }
`;

const buttonVariants = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  hover: { scale: 1.02 },
  tap: { scale: 0.98 }
};

const LoadingContainer = styled.div<LoadingContainerProps>`
  position: absolute;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  width: 300px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  opacity: ${props => props.isLoading ? 1 : 0};
  transition: opacity 0.5s ease;
`;

const LoadingBar = styled.div<{ progress: number }>`
  width: 100%;
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  overflow: hidden;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: ${props => props.progress}%;
    background: linear-gradient(
      90deg,
      #ff00ff,
      #00ffff
    );
    box-shadow: 0 0 10px rgba(255, 0, 255, 0.5);
    transition: width 0.3s ease;
  }

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.2),
      transparent
    );
    animation: shimmer 1.5s infinite;
  }

  @keyframes shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }
`;

const LoadingText = styled.div`
  color: white;
  font-size: 0.875rem;
  text-shadow: 0 0 10px rgba(255, 0, 255, 0.5);
`;

const ZoomSlider = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0 0.5rem;
  margin: 0 -0.5rem;
  max-width: calc(100% + 1rem);

  input[type="range"] {
    flex: 1;
    width: 100%;
    min-width: 0;
    -webkit-appearance: none;
    height: 4px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 2px;
    outline: none;

    &::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 16px;
      height: 16px;
      background: white;
      border-radius: 50%;
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: 0 0 10px rgba(255, 0, 255, 0.5);
    }

    &::-webkit-slider-thumb:hover {
      transform: scale(1.2);
    }
  }

  span {
    color: rgba(255, 255, 255, 0.6);
    font-size: 0.8rem;
    min-width: 2.5rem;
    text-align: center;
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
  color: white;
  font-size: 0.875rem;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.3s ease;

  &.visible {
    opacity: 1;
  }
`;

const UploadContainer = styled.div<{ isVisible: boolean }>`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.7);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: ${props => props.isVisible ? 'flex' : 'none'};
  flex-direction: column;
  gap: 1rem;
`;

const TextInput = styled.input`
  padding: 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  color: white;
  width: 100%;
`;

const FileUploadButton = styled.label`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 0.75rem 1rem;
  color: white;
  display: flex;
  align-items: center;
  gap: 1rem;
  width: 100%;
  cursor: pointer;
  transition: all 0.3s ease;

  input {
    display: none;
  }

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.2);
  }
`;

const SubmitButton = styled(motion.button)`
  padding: 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  color: white;
  width: 100%;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.2);
  }

  &:disabled {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.1);
    cursor: not-allowed;
  }
`;

const DashboardSection = styled.div`
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  margin-top: 1rem;
`;

const Stat = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  
  &:last-child {
    border-bottom: none;
  }
`;

const StatLabel = styled.span`
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.8rem;
`;

const StatValue = styled.span`
  color: white;
  font-weight: 500;
`;

const HistoryList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 200px;
  overflow-y: auto;
`;

const HistoryItem = styled(motion.div)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
  cursor: pointer;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(1);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isPanning, setIsPanning] = useState(false);
  const [recentModels] = useState([
    { name: 'Living Room Panorama', date: '2024-01-27' },
    { name: 'Kitchen View', date: '2024-01-26' },
    { name: 'Bedroom Scene', date: '2024-01-25' },
  ]);

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
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleZoomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newZoom = parseFloat(e.target.value);
    setCurrentZoom(newZoom);
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

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearStatusTimeout();
    };
  }, []);

  return (
    <PageContainer
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageTransition}
    >
      <DemoLayout>
        <ToggleSidebarButton
          onClick={toggleSidebar}
          isSidebarOpen={isSidebarOpen}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          {isSidebarOpen ? <FiX /> : <FiMenu />}
        </ToggleSidebarButton>

        <AnimatePresence>
          {isSidebarOpen && (
            <Sidebar
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ duration: 0.3 }}
            >
              <NavSection>
                <SectionTitle>View Controls</SectionTitle>
                <NavButton
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                  onClick={toggleFullscreen}
                >
                  <FiMaximize2 /> Toggle Fullscreen
                </NavButton>

                <NavButton 
                  variants={buttonVariants} 
                  whileHover="hover" 
                  whileTap="tap"
                  onClick={() => setIsPanning(!isPanning)}
                  style={{
                    background: isPanning ? 'rgba(255, 0, 255, 0.2)' : undefined,
                    borderColor: isPanning ? 'rgba(255, 0, 255, 0.4)' : undefined
                  }}
                >
                  <FiMove /> {isPanning ? 'Exit Pan Mode' : 'Enter Pan Mode'}
                </NavButton>
                
                <NavSection>
                  <SectionTitle>Zoom Level</SectionTitle>
                  <ZoomSlider>
                    <span>0.5x</span>
                    <input
                      type="range"
                      min="0.5"
                      max="2.5"
                      step="0.1"
                      value={currentZoom}
                      onChange={handleZoomChange}
                    />
                    <span>2.5x</span>
                  </ZoomSlider>
                </NavSection>
              </NavSection>

              <NavSection>
                <SectionTitle>Recent Models</SectionTitle>
                <HistoryList>
                  {recentModels.map((model, index) => (
                    <HistoryItem
                      key={index}
                      whileHover={{ x: 5 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <FiFolder />
                      <div>
                        <div style={{ fontSize: '0.9rem' }}>{model.name}</div>
                        <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)' }}>
                          {model.date}
                        </div>
                      </div>
                    </HistoryItem>
                  ))}
                </HistoryList>
              </NavSection>

              <DashboardSection>
                <SectionTitle>Statistics</SectionTitle>
                <Stat>
                  <StatLabel>Vertices</StatLabel>
                  <StatValue>124,532</StatValue>
                </Stat>
                <Stat>
                  <StatLabel>Faces</StatLabel>
                  <StatValue>248,964</StatValue>
                </Stat>
                <Stat>
                  <StatLabel>Resolution</StatLabel>
                  <StatValue>2048x1024</StatValue>
                </Stat>
                <Stat>
                  <StatLabel>File Size</StatLabel>
                  <StatValue>15.4 MB</StatValue>
                </Stat>
              </DashboardSection>
            </Sidebar>
          )}
        </AnimatePresence>

        <ViewerContainer isSidebarOpen={isSidebarOpen}>
          <ThreeScene 
            objUrl='\models\scene.obj' // place holder right now
            onLoadProgress={handleLoadProgress}
            onLoadError={handleLoadError}
            onLoadComplete={handleLoadComplete}
            zoom={currentZoom}
            isPanning={isPanning}
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
          <LoadingContainer isLoading={isLoading}>
            <LoadingBar progress={loadingProgress} />
            <LoadingText>Loading Model... {Math.round(loadingProgress)}%</LoadingText>
          </LoadingContainer>
        </ViewerContainer>
      </DemoLayout>
    </PageContainer>
  );
};

export default ThreeDemo;
