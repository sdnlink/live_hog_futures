import React, { useRef, useEffect } from 'react';

interface AutoScrollFeedProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

const AutoScrollFeed: React.FC<AutoScrollFeedProps> = ({ children, className, style }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let isHovered = false;
    const handleMouseEnter = () => { isHovered = true; };
    const handleMouseLeave = () => { isHovered = false; };

    container.addEventListener('mouseenter', handleMouseEnter);
    container.addEventListener('mouseleave', handleMouseLeave);

    let animationFrameId: number;
    let lastTime = performance.now();
    let scrollAccumulator = 0;

    const scrollStep = (time: number) => {
      const delta = time - lastTime;
      lastTime = time;

      if (container.scrollHeight > container.clientHeight) {
        if (isHovered) {
          // Keep checking
        } else {
          // Speed: 22 pixels per second
          const pixelsPerMs = 22 / 1000;
          scrollAccumulator += delta * pixelsPerMs;

          if (scrollAccumulator >= 1) {
            const scrollAmt = Math.floor(scrollAccumulator);
            scrollAccumulator -= scrollAmt;

            const isAtBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 1;
            if (isAtBottom) {
              // Smoothly transition back to top
              container.scrollTo({ top: 0, behavior: 'smooth' });
              // Pause scrolling for 1.8s to let the smooth animation finish and rest at the top
              scrollAccumulator = -1800 * pixelsPerMs;
            } else {
              container.scrollTop += scrollAmt;
            }
          }
        }
      }

      animationFrameId = requestAnimationFrame(scrollStep);
    };

    animationFrameId = requestAnimationFrame(scrollStep);

    return () => {
      container.removeEventListener('mouseenter', handleMouseEnter);
      container.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className={className} 
      style={{ 
        ...style, 
        overflowY: 'auto', 
        scrollbarWidth: 'none', /* Firefox */
      }}
    >
      {children}
    </div>
  );
};

export default AutoScrollFeed;
