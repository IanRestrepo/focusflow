import { useEffect, useState } from 'react';
import { playStreakDay } from '@/lib/sounds';

interface StreakOverlayProps {}

interface StreakEvent {
  streakDays: number;
}

// One particle spark
function Spark({ delay, angle, distance }: { delay: number; angle: number; distance: number }) {
  const rad = (angle * Math.PI) / 180;
  const tx = Math.cos(rad) * distance;
  const ty = Math.sin(rad) * distance;

  return (
    <div style={{
      position: 'absolute',
      left: '50%',
      top: '50%',
      width: 8,
      height: 8,
      borderRadius: '50%',
      background: `hsl(${30 + Math.random() * 40}, 100%, ${60 + Math.random() * 20}%)`,
      animation: `spark-fly 0.9s ease-out ${delay}s both`,
      // @ts-ignore
      '--tx': `${tx}px`,
      '--ty': `${ty}px`,
    }} />
  );
}

export default function StreakOverlay(_props: StreakOverlayProps) {
  const [visible, setVisible] = useState(false);
  const [streakDays, setStreakDays] = useState(1);
  const [phase, setPhase] = useState<'in' | 'show' | 'out'>('in');

  useEffect(() => {
    function onStreak(e: Event) {
      const { streakDays: days } = (e as CustomEvent<StreakEvent>).detail;
      setStreakDays(days);
      setPhase('in');
      setVisible(true);
      playStreakDay();

      // Hold for 2.6s then fade out
      setTimeout(() => setPhase('show'), 50);
      setTimeout(() => setPhase('out'), 2600);
      setTimeout(() => setVisible(false), 3200);
    }

    window.addEventListener('focusflow:streak-day', onStreak);
    return () => window.removeEventListener('focusflow:streak-day', onStreak);
  }, []);

  if (!visible) return null;

  const sparks = Array.from({ length: 28 }, (_, i) => ({
    angle: (360 / 28) * i + Math.random() * 10,
    distance: 80 + Math.random() * 120,
    delay: Math.random() * 0.3,
  }));

  const messages: Record<number, string> = {
    1: '¡Primera llama!',
    2: '¡Vas con todo!',
    3: '¡Tres días seguidos!',
    7: '¡Una semana de fuego!',
    14: '¡Dos semanas! 🤯',
    30: '¡Un mes imparable!',
  };
  const msg = messages[streakDays] ?? (streakDays >= 7 ? '¡Eres una máquina! 🔥' : '¡Sigue así!');

  return (
    <>
      <style>{`
        @keyframes spark-fly {
          0%   { transform: translate(-50%, -50%) translate(0, 0) scale(1); opacity: 1; }
          100% { transform: translate(-50%, -50%) translate(var(--tx), var(--ty)) scale(0); opacity: 0; }
        }
        @keyframes streak-overlay-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes streak-overlay-out {
          from { opacity: 1; }
          to   { opacity: 0; }
        }
        @keyframes streak-flame-bounce {
          0%   { transform: scale(0.3) rotate(-8deg); opacity: 0; }
          50%  { transform: scale(1.25) rotate(4deg); opacity: 1; }
          70%  { transform: scale(0.95) rotate(-2deg); }
          85%  { transform: scale(1.08) rotate(1deg); }
          100% { transform: scale(1) rotate(0deg); }
        }
        @keyframes streak-number-pop {
          0%   { transform: scale(0); opacity: 0; }
          60%  { transform: scale(1.3); opacity: 1; }
          80%  { transform: scale(0.9); }
          100% { transform: scale(1); }
        }
        @keyframes streak-msg-fade {
          0%   { opacity: 0; transform: translateY(16px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes streak-pulse-ring {
          0%   { transform: scale(0.8); opacity: 0.8; }
          100% { transform: scale(2.2); opacity: 0; }
        }
      `}</style>

      {/* Backdrop */}
      <div
        onClick={() => { setPhase('out'); setTimeout(() => setVisible(false), 600); }}
        style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'radial-gradient(ellipse at center, rgba(251,146,60,0.22) 0%, rgba(0,0,0,0.82) 70%)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          animation: phase === 'out'
            ? 'streak-overlay-out 0.6s ease forwards'
            : 'streak-overlay-in 0.3s ease forwards',
          cursor: 'pointer',
        }}
      >
        {/* Pulse rings */}
        {[0, 0.3, 0.6].map((delay, i) => (
          <div key={i} style={{
            position: 'absolute',
            width: 180, height: 180,
            borderRadius: '50%',
            border: '3px solid rgba(251,146,60,0.5)',
            animation: `streak-pulse-ring 1.4s ease-out ${delay}s infinite`,
          }} />
        ))}

        {/* Sparks container */}
        <div style={{ position: 'absolute', width: 0, height: 0 }}>
          {sparks.map((s, i) => (
            <Spark key={i} angle={s.angle} distance={s.distance} delay={s.delay} />
          ))}
        </div>

        {/* Main flame */}
        <div style={{
          fontSize: 120,
          lineHeight: 1,
          animation: 'streak-flame-bounce 0.7s cubic-bezier(0.34,1.56,0.64,1) 0.1s both',
          filter: 'drop-shadow(0 0 40px rgba(251,146,60,0.9)) drop-shadow(0 0 80px rgba(239,68,68,0.6))',
          userSelect: 'none',
        }}>
          🔥
        </div>

        {/* Streak number */}
        <div style={{
          display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 16,
          animation: 'streak-number-pop 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.5s both',
        }}>
          <span style={{
            fontSize: 96, fontWeight: 900, lineHeight: 1,
            color: '#fb923c',
            fontVariantNumeric: 'tabular-nums',
            textShadow: '0 0 40px rgba(251,146,60,0.8), 0 0 80px rgba(239,68,68,0.4)',
          }}>
            {streakDays}
          </span>
          <span style={{ fontSize: 28, fontWeight: 700, color: 'rgba(255,255,255,0.7)', paddingBottom: 8 }}>
            {streakDays === 1 ? 'día' : 'días'}
          </span>
        </div>

        {/* Label */}
        <div style={{
          fontSize: 15, fontWeight: 600, color: 'rgba(255,255,255,0.5)',
          letterSpacing: '0.18em', textTransform: 'uppercase',
          marginTop: 4,
          animation: 'streak-msg-fade 0.4s ease 0.7s both',
        }}>
          de racha
        </div>

        {/* Message */}
        <div style={{
          marginTop: 24,
          fontSize: 22, fontWeight: 700,
          color: '#fff',
          textAlign: 'center',
          textShadow: '0 2px 16px rgba(0,0,0,0.5)',
          animation: 'streak-msg-fade 0.4s ease 0.9s both',
        }}>
          {msg}
        </div>

        {/* Tap to dismiss */}
        <div style={{
          marginTop: 32, fontSize: 12,
          color: 'rgba(255,255,255,0.3)',
          animation: 'streak-msg-fade 0.4s ease 1.6s both',
        }}>
          Toca para continuar
        </div>
      </div>
    </>
  );
}
