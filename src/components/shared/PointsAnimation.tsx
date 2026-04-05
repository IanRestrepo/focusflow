import { useEffect, useState } from 'react';

interface FloatingPoint {
  id: number;
  x: number;
  y: number;
  value: number;
}

let _id = 0;

/** Call this from anywhere to trigger the +X pts floating animation */
export function triggerPointsAnimation(x: number, y: number, value: number) {
  window.dispatchEvent(new CustomEvent('points-animate', { detail: { x, y, value } }));
}

export default function PointsAnimationLayer() {
  const [floats, setFloats] = useState<FloatingPoint[]>([]);

  useEffect(() => {
    function onAnimate(e: any) {
      const { x, y, value } = e.detail;
      const id = ++_id;
      setFloats(prev => [...prev, { id, x, y, value }]);
      setTimeout(() => {
        setFloats(prev => prev.filter(f => f.id !== id));
      }, 550);
    }
    window.addEventListener('points-animate', onAnimate);
    return () => window.removeEventListener('points-animate', onAnimate);
  }, []);

  return (
    <>
      {floats.map(f => (
        <div
          key={f.id}
          className="points-float"
          style={{ left: f.x, top: f.y - 20 }}
        >
          +{f.value} pts
        </div>
      ))}
    </>
  );
}
