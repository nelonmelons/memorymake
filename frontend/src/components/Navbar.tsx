import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import styled from '@emotion/styled';
import { motion } from 'framer-motion';

const Nav = styled.nav`
  background: var(--bg-secondary);
  padding: 1rem 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const Brand = styled(Link)`
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const NavLinks = styled.div`
  display: flex;
  gap: 2rem;
`;

const StyledNavLink = styled(Link)`
  color: var(--text-secondary);
  font-weight: 500;
  transition: color 0.2s ease-in-out;
  
  &[data-active="true"] {
    color: var(--accent-primary);
  }
  
  &:hover {
    color: var(--accent-primary);
  }
`;

const Navbar: React.FC = () => {
  const location = useLocation();
  
  return (
    <Nav>
      <Brand to="/">
        <motion.span
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          Memory 3D
        </motion.span>
      </Brand>
      <NavLinks>
        <StyledNavLink 
          to="/3d-demo" 
          data-active={(location.pathname === '/3d-demo').toString()}
        >
          3D Demo
        </StyledNavLink>
      </NavLinks>
    </Nav>
  );
};

export default Navbar; 