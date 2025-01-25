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

const NavLink = styled(Link)<{ $active?: boolean }>`
  color: ${props => props.$active ? 'var(--accent-primary)' : 'var(--text-secondary)'};
  font-weight: 500;
  transition: color 0.2s ease-in-out;
  
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
          Memory 2.5D
        </motion.span>
      </Brand>
      <NavLinks>
        <NavLink to="/test-endpoints" $active={location.pathname === '/test-endpoints'}>
          Test Endpoints
        </NavLink>
        <NavLink to="/3d-demo" $active={location.pathname === '/3d-demo'}>
          3D Demo
        </NavLink>
      </NavLinks>
    </Nav>
  );
};

export default Navbar; 