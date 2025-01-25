import styled from '@emotion/styled';
import { motion } from 'framer-motion';

export const Button = styled(motion.button)`
  background: var(--accent-primary);
  color: var(--text-primary);
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 1rem;
  transition: all 0.2s ease-in-out;
  
  &:hover {
    background: var(--accent-secondary);
    transform: translateY(-1px);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    &:hover {
      transform: none;
    }
  }
`;

export const SecondaryButton = styled(Button)`
  background: var(--bg-secondary);
  border: 1px solid var(--accent-primary);
  
  &:hover {
    background: var(--bg-secondary);
    border-color: var(--accent-secondary);
  }
`; 