import React, { useState } from 'react';
import styled from '@emotion/styled';
import { motion } from 'framer-motion';
import { Button, SecondaryButton } from '../components/Button';
import { Container, PageContainer, pageTransition } from '../components/Container';

const Card = styled(motion.div)`
  background: var(--bg-secondary);
  border-radius: 12px;
  padding: 2rem;
  max-width: 600px;
  width: 100%;
  margin: 0 auto;
`;

const Title = styled.h2`
  font-size: 2rem;
  margin-bottom: 2rem;
  text-align: center;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-weight: 500;
  color: var(--text-secondary);
`;

const Input = styled.input`
  background: var(--bg-primary);
  border: 1px solid var(--text-secondary);
  border-radius: 6px;
  padding: 0.75rem;
  color: var(--text-primary);
  width: 100%;
  
  &:focus {
    outline: none;
    border-color: var(--accent-primary);
  }
  
  &[type="file"] {
    &::file-selector-button {
      background: var(--bg-secondary);
      border: 1px solid var(--accent-primary);
      color: var(--text-primary);
      padding: 0.5rem 1rem;
      border-radius: 4px;
      cursor: pointer;
      margin-right: 1rem;
      
      &:hover {
        background: var(--accent-primary);
      }
    }
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
`;

const ResultsArea = styled.div`
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid var(--bg-primary);
`;

const ResultText = styled.pre`
  background: var(--bg-primary);
  padding: 1rem;
  border-radius: 6px;
  overflow-x: auto;
  font-size: 0.875rem;
  color: var(--text-secondary);
`;

const TestEndpoints: React.FC = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [objFile, setObjFile] = useState<File | null>(null);
  const [endpoints, setEndpoints] = useState({
    uploadImage: '/api/upload-image',
    uploadObj: '/api/upload-obj',
    downloadObj: '/api/download-obj'
  });
  const [result, setResult] = useState<string>('');

  const handleImageUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageFile) return;
    
    setResult('Uploading image...');
    // Simulated API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setResult(`Successfully uploaded image: ${imageFile.name}`);
  };

  const handleObjUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!objFile) return;
    
    setResult('Uploading OBJ file...');
    // Simulated API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setResult(`Successfully uploaded OBJ: ${objFile.name}`);
  };

  const handleDownloadObj = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setResult('Downloading OBJ file...');
    // Simulated API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setResult('Successfully downloaded OBJ file');
  };

  return (
    <PageContainer
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageTransition}
    >
      <Container>
        <Card
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Title>Test Endpoints</Title>
          <Form onSubmit={e => e.preventDefault()}>
            <InputGroup>
              <Label>Image Upload Endpoint</Label>
              <Input
                type="text"
                value={endpoints.uploadImage}
                onChange={e => setEndpoints({ ...endpoints, uploadImage: e.target.value })}
              />
            </InputGroup>
            
            <InputGroup>
              <Label>Select Image</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={e => setImageFile(e.target.files?.[0] || null)}
              />
            </InputGroup>
            
            <InputGroup>
              <Label>OBJ Upload Endpoint</Label>
              <Input
                type="text"
                value={endpoints.uploadObj}
                onChange={e => setEndpoints({ ...endpoints, uploadObj: e.target.value })}
              />
            </InputGroup>
            
            <InputGroup>
              <Label>Select OBJ File</Label>
              <Input
                type="file"
                accept=".obj"
                onChange={e => setObjFile(e.target.files?.[0] || null)}
              />
            </InputGroup>
            
            <InputGroup>
              <Label>OBJ Download Endpoint</Label>
              <Input
                type="text"
                value={endpoints.downloadObj}
                onChange={e => setEndpoints({ ...endpoints, downloadObj: e.target.value })}
              />
            </InputGroup>
            
            <ButtonGroup>
              <Button onClick={handleImageUpload} disabled={!imageFile}>
                Upload Image
              </Button>
              <SecondaryButton onClick={handleObjUpload} disabled={!objFile}>
                Upload OBJ
              </SecondaryButton>
              <SecondaryButton onClick={handleDownloadObj}>
                Download OBJ
              </SecondaryButton>
            </ButtonGroup>
          </Form>
          
          {result && (
            <ResultsArea>
              <Label>Results</Label>
              <ResultText>{result}</ResultText>
            </ResultsArea>
          )}
        </Card>
      </Container>
    </PageContainer>
  );
};

export default TestEndpoints; 