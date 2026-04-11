"use client";

import React from 'react';
import logoPng from '@/assets/logo.png';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const Logo = ({ className = "", size = 'md' }: LogoProps) => {
  const sizes = {
    sm: "h-8",
    md: "h-12",
    lg: "h-16"
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img 
        src={logoPng} 
        alt="Rastrear Logo" 
        className={`${sizes[size]} w-auto object-contain`}
      />
    </div>
  );
};

export default Logo;