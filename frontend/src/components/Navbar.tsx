import React from 'react';
import { Link } from 'react-router-dom';
import styled from '@emotion/styled';

const NavbarContainer = styled.nav`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
  z-index: 100;
`;

const Logo = styled(Link)`
  color: #fff;
  font-size: 1.2rem;
  font-weight: 700;
  text-decoration: none;
  background: linear-gradient(135deg, #ff00ff, #00ffff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  filter: drop-shadow(0 0 10px rgba(255, 0, 255, 0.3));
`;

const NavLinks = styled.div`
  display: flex;
  gap: 2rem;
`;

const NavLink = styled(Link)`
  color: #fff;
  text-decoration: none;
  font-weight: 500;
  transition: all 0.3s ease;
  position: relative;
  padding: 0.5rem 1rem;
  
  &::before {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 2px;
    background: linear-gradient(90deg, #ff00ff, #00ffff);
    transform: scaleX(0);
    transform-origin: right;
    transition: transform 0.3s ease;
  }
  
  &:hover {
    text-shadow: 0 0 10px rgba(255, 0, 255, 0.5);
    &::before {
      transform: scaleX(1);
      transform-origin: left;
    }
  }
`;

const Navbar: React.FC = () => {
  return (
    <NavbarContainer>
      <Logo to="/">Memory 3D</Logo>
      <NavLinks>
        <NavLink to="/three-demo">3D Demo</NavLink>
      </NavLinks>
    </NavbarContainer>
  );
};

export default Navbar; 