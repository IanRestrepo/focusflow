import { useEffect, useState } from 'react';

export function triggerLevelUp(newLevel: number) {
  window.dispatchEvent(new CustomEvent('level-up', { detail: { newLevel } }));
}

export default function LevelUpOverlay() {
  const [visible, setVisible] = useState(false);
  const [level, setLevel] = useState(1);

  useEffect(() => {
    function onLevelUp(e: any) {
      setLevel(e.detail.newLevel);
      setVisible(true);
      setTimeout(() => setVisible(false), 2200);
    }
    window.addEventListener('level-up', onLevelUp);
    return () => window.removeEventListener('level-up', onLevelUp);
  }, []);

  if (!visible) return null;

  return (
    <div className="level-up-overlay" onClick={() => setVisible(false)}>
      <div style={{ textAlign: 'center', animation: 'fade-in-up 0.4s ease-out' }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>⭐</div>
        <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Subiste de nivel
        </div>
        <div style={{
          fontSize: 72,
          fontWeight: 700,
          fontFamily: 'JetBrains Mono, monospace',
          background: 'linear-gradient(135deg, var(--accent-primary), #fbbf24)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          lineHeight: 1,
        }}>
          {level}
        </div>
        <div style={{ fontSize: 16, color: 'var(--text-secondary)', marginTop: 8 }}>
          ¡Increíble progreso!
        </div>
      </div>
    </div>
  );
}
