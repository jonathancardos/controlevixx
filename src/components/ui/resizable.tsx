"use client";

import React, { useState, useRef, useEffect } from 'react';

interface ResizablePanelProps {
  children: React.ReactNode;
  initialSize?: number;
  minSize?: number;
  maxSize?: number;
  direction?: 'horizontal' | 'vertical';
}

const ResizablePanel = ({
  children,
  initialSize = 50,
  minSize = 10,
  maxSize = 90,
  direction = 'horizontal',
}: ResizablePanelProps) => {
  const [size, setSize] = useState(initialSize);
  const panelRef = useRef<HTMLDivElement>(null);
  const isHorizontal = direction === 'horizontal';

  useEffect(() => {
    const handleResize = () => {
      if (panelRef.current) {
        const panelSize = isHorizontal ? panelRef.current.offsetWidth : panelRef.current.offsetHeight;
        const percentage = (panelSize / (isHorizontal ? window.innerWidth : window.innerHeight)) * 100;
        setSize(percentage);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial size

    return () => window.removeEventListener('resize', handleResize);
  }, [isHorizontal]);

  const style: React.CSSProperties = {
    flex: `1`,
    width: isHorizontal ? `${size}vw` : '100%',
    height: isHorizontal ? '100%' : `${size}vh`,
    minWidth: isHorizontal ? `${minSize}vw` : undefined,
    minHeight: isHorizontal ? undefined : `${minSize}vh`,
    maxWidth: isHorizontal ? `${maxSize}vw` : undefined,
    maxHeight: isHorizontal ? undefined : `${maxSize}vh`,
    overflow: 'auto',
  };

  return (
    <div ref={panelRef} style={style}>
      {children}
    </div>
  );
};

export { ResizablePanel };