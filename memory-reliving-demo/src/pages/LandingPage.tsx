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
  min-height: 80vh;
  position: relative;
  overflow: hidden;
`;

const HeroTitle = styled(motion.h1)`
  font-size: 4rem;
  font-weight: 700;
  margin-bottom: 2rem;
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  line-height: 1.2;
`;

const HeroSubtitle = styled(motion.p)`
  font-size: 1.25rem;
  color: var(--text-secondary);
  margin-bottom: 3rem;
  max-width: 600px;
`;

const BackgroundAnimation = styled(motion.div)`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(circle at 50% 50%, var(--accent-primary) 0%, transparent 50%);
  opacity: 0.1;
  filter: blur(100px);
  z-index: 0;
`;

const Content = styled.div`
  position: relative;
  z-index: 1;
`;

const titleVariants = {
  initial: { opacity: 0, y: 20 },
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
      delay: 0.2,
      ease: [0.6, -0.05, 0.01, 0.99]
    }
  }
};

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <PageContainer
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageTransition}
    >
      <Container>
        <HeroSection>
          <BackgroundAnimation
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 180, 360]
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear"
            }}
          />
          <Content>
            <HeroTitle variants={titleVariants}>
              Relive Your Memories in 2.5D
            </HeroTitle>
            <HeroSubtitle variants={subtitleVariants}>
              Transform your photos into immersive 3D experiences. Upload, convert, and explore your memories like never before.
            </HeroSubtitle>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Button
                onClick={() => navigate('/3d-demo')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Get Started
              </Button>
            </motion.div>
          </Content>
        </HeroSection>
      </Container>
    </PageContainer>
  );
};

export default LandingPage; 