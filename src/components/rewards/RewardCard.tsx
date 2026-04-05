import { useState, useEffect } from 'react';
import { Lock, Zap, Clock } from 'lucide-react';

interface Reward {
  id: string;
  title: string;
  description?: string;
  cost: number;
  icon: string;
  is_active: boolean;
}

interface RewardCardProps {
  reward: Reward;
  currentPoints: number;
  canClaim: boolean;
  nextClaimAt: string | null;
  isPremiumPhase: boolean;
  onClaim: (rewardId: string, cost: number) => Promise<boolean>;
}

function useCardCountdown(targetISO: string | null, canClaim: boolean) {
  const [display, setDisplay] = useState('');

  useEffect(() => {
    if (canClaim || !targetISO) { setDisplay(''); return; }
    function tick() {
      const ms = new Date(targetISO!).getTime() - Date.now();
      if (ms <= 0) { setDisplay(''); return; }
      const h = Math.floor(ms / 3600000);
      const m = Math.floor((ms % 3600000) / 60000);
      const s = Math.floor((ms % 60000) / 1000);
      setDisplay(h > 0 ? `${h}h ${m}m` : m > 0 ? `${m}m ${s}s` : `${s}s`);
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetISO, canClaim]);

  return display;
}

export default function RewardCard({
  reward, currentPoints, canClaim, nextClaimAt, isPremiumPhase, onClaim,
}: RewardCardProps) {
  const [loading, setLoading]   = useState(false);
  const [claimed, setClaimed]   = useState(false);
  const countdown               = useCardCountdown(nextClaimAt, canClaim);

  const canAfford  = currentPoints >= reward.cost;
  const canDoIt    = canAfford && canClaim;
  const pct        = Math.min(100, Math.round((currentPoints / reward.cost) * 100));

  async function handleClaim() {
    if (!canDoIt || loading || claimed) return;
    setLoading(true);
    try {
      const ok = await onClaim(reward.id, reward.cost);
      if (ok) {
        setClaimed(true);
        setTimeout(() => setClaimed(false), 2500);
      }
    } finally {
      setLoading(false);
    }
  }

  // Border color logic
  const borderColor = claimed
    ? 'var(--border-accent)'
    : !canClaim
    ? 'var(--border-subtle)'
    : canAfford
    ? 'var(--border-default)'
    : 'var(--border-subtle)';

  return (
    <div
      className="card card-hover"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        border: `1px solid ${borderColor}`,
        transition: 'all 0.3s',
        position: 'relative',
        opacity: !canClaim ? 0.75 : 1,
        ...(claimed ? { boxShadow: '0 0 20px var(--accent-primary-glow)' } : {}),
      }}
    >
      {/* Premium badge */}
      {isPremiumPhase && (
        <div style={{
          position: 'absolute', top: 10, right: 10,
          fontSize: 11, fontWeight: 700,
          background: 'rgba(245,158,11,0.12)',
          border: '1px solid rgba(245,158,11,0.35)',
          color: '#f59e0b',
          borderRadius: 8, padding: '2px 7px',
          letterSpacing: '0.05em',
        }}>
          ⭐ Premium
        </div>
      )}

      {/* Icon */}
      <div style={{ fontSize: 36, lineHeight: 1 }}>{reward.icon}</div>

      {/* Info */}
      <div style={{ flex: 1 }}>
        <h3 style={{
          margin: '0 0 4px', fontSize: 15, fontWeight: 600,
          color: canDoIt ? 'var(--text-primary)' : 'var(--text-secondary)',
          paddingRight: isPremiumPhase ? 60 : 0,
        }}>
          {reward.title}
        </h3>
        {reward.description && (
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
            {reward.description}
          </p>
        )}
      </div>

      {/* Cost */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <Zap size={14} style={{ color: canDoIt ? 'var(--accent-primary)' : 'var(--text-muted)', flexShrink: 0 }} />
        <span style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 16, fontWeight: 700,
          color: canDoIt ? 'var(--accent-primary)' : 'var(--text-muted)',
        }}>
          {reward.cost}
        </span>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>pts</span>
      </div>

      {/* Cooldown indicator */}
      {!canClaim && countdown && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 5,
          background: 'var(--bg-accent)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 8, padding: '5px 10px',
          fontSize: 12, color: 'var(--text-muted)',
        }}>
          <Clock size={11} />
          <span>Disponible en <strong style={{ fontFamily: 'JetBrains Mono, monospace' }}>{countdown}</strong></span>
        </div>
      )}

      {/* Progress bar (when can't afford) */}
      {canClaim && !canAfford && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{pct}%</span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
              Faltan {reward.cost - currentPoints} pts
            </span>
          </div>
          <div className="progress-bar">
            <div className="progress-bar-fill" style={{ width: `${pct}%`, background: 'var(--accent-pending)' }} />
          </div>
        </div>
      )}

      {/* Claim button */}
      <button
        className={`btn${canDoIt ? ' btn-primary' : ' btn-secondary'}`}
        style={{
          width: '100%',
          fontSize: 14,
          opacity: canDoIt ? 1 : 0.55,
          cursor: canDoIt ? 'pointer' : 'not-allowed',
          ...(claimed ? { background: 'var(--accent-success)', color: '#000' } : {}),
        }}
        onClick={handleClaim}
        disabled={!canDoIt || loading}
      >
        {loading
          ? '...'
          : claimed
          ? '✓ ¡Canjeado!'
          : !canClaim
          ? <><Clock size={13} /> En espera</>
          : canAfford
          ? '🎁 Canjear'
          : <><Lock size={13} /> Sin fondos</>
        }
      </button>
    </div>
  );
}
