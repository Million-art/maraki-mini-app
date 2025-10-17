import React, { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';

interface ConfettiProps {
  show: boolean;
  onComplete?: () => void;
}

const Confetti: React.FC<ConfettiProps> = ({ show, onComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (show && canvasRef.current) {
      const canvas = canvasRef.current;
      const myConfetti = confetti.create(canvas, {
        resize: true,
        useWorker: true,
      });

      // Fire confetti animation
      const fireConfetti = () => {
        // Left side
        myConfetti({
          particleCount: 100,
          spread: 70,
          origin: { x: 0, y: 0.6 },
          colors: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3'],
        });

        // Right side
        myConfetti({
          particleCount: 100,
          spread: 70,
          origin: { x: 1, y: 0.6 },
          colors: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3'],
        });

        // Center burst
        setTimeout(() => {
          myConfetti({
            particleCount: 200,
            spread: 360,
            origin: { x: 0.5, y: 0.5 },
            colors: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3'],
          });
        }, 300);
      };

      fireConfetti();

      // Hide confetti after animation
      const timer = setTimeout(() => {
        onComplete?.();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  if (!show) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50"
      style={{ width: '100%', height: '100%' }}
    />
  );
};

export default Confetti;
