"use client";

import React from 'react';
import logoSvg from '@/assets/logo.svg';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const Logo = ({ className = "", size = 'md' }: LogoProps) => {
  const sizes = {
    sm: "h-8",
    md: "h-10",
    lg: "h-12"
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img 
        src={logoSvg} 
        alt="TrackPro Logo" 
        className={`${sizes[size]} w-auto object-contain`}
      />
    </div>
  );
};

export default Logo;