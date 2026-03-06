import React, { useEffect, useRef, useState } from 'react';

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  threshold?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
}

const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  className = '',
  delay = 0,
  duration = 800,
  threshold = 0.1,
  direction = 'up'
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setIsVisible(true);
          setHasAnimated(true);
        }
      },
      {
        threshold,
        rootMargin: '0px 0px -50px 0px'
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [threshold, hasAnimated]);

  const getTransformValue = () => {
    switch (direction) {
      case 'up':
        return 'translateY(40px) scale(0.95)';
      case 'down':
        return 'translateY(-40px) scale(0.95)';
      case 'left':
        return 'translateX(40px) scale(0.95)';
      case 'right':
        return 'translateX(-40px) scale(0.95)';
      default:
        return 'scale(0.95)';
    }
  };

  const baseClasses = 'transition-all ease-out';
  const transformClasses = isVisible 
    ? 'opacity-100 transform translate-y-0 translate-x-0 scale-100' 
    : `opacity-0 transform ${getTransformValue()}`;

  return (
    <div
      ref={ref}
      className={`${baseClasses} ${transformClasses} ${className}`}
      style={{
        transitionDuration: `${duration}ms`,
        transitionDelay: `${delay}ms`,
        transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)'
      }}
    >
      {children}
    </div>
  );
};

export default ScrollReveal; 