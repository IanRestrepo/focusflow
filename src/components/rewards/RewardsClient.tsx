import { useState, useEffect, useCallback } from 'react';
import { Plus, Clock, Zap } from 'lucide-react';
import RewardCard from './RewardCard';
import CreateRewardModal from './CreateRewardModal';
import { playRewardClaim } from '@/lib/sounds';
import type { PhaseConfig } from '@/lib/rewards';

interface Reward {
  id: string; title: string; description?: string;
  cost: number; icon: string; is_active: boolean;
}
interface Claim {
  id: string; reward: string; points_spent: number; claimed_at: string;
  expand?: { reward?: { title: string; icon: string } };
}
interface RewardsClientProps {
  initialRewards: Reward[];
  initialCurrentPoints: number;
  initialClaims: Claim[];
  phase: 1 | 2 | 3;
  phaseConfig: PhaseConfig;
  initialNextClaimAt: string | null;
  initialClaimsToday: number;
  premiumBonusAvailable: boolean;
  premiumBonusNextAt: string | null;
}

// ── Countdown hook ────────────────────────────────────────────────────────────
function useCountdown(targetISO: string | null) {
  const [display, setDisplay] = useState('');

  useEffect(() => {
    if (!targetISO) { setDisplay(''); return; }
    function tick() {
      const ms = new Date(targetISO!).getTime() - Date.now();
      if (ms <= 0) { setDisplay(''); return; }
      const h  = Math.floor(ms / 3600000);
      const m  = Math.floor((ms % 3600000) / 60000);
      const s  = Math.floor((ms % 60000) / 1000);
      setDisplay(h > 0 ? `${h}h ${m}m` : m > 0 ? `${m}m ${s}s` : `${s}s`);
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetISO]);

  return display;
}

// ── Phase banner ──────────────────────────────────────────────────────────────
const PHASE_COLORS: Record<number, string> = { 1: '#22c55e', 2: '#3b82f6', 3: '#f59e0b' };
const PHASE_BG:    Record<number, string> = {
  1: 'rgba(34,197,94,0.08)', 2: 'rgba(59,130,246,0.08)', 3: 'rgba(245,158,11,0.08)'
};

function PhaseBanner({
  phase, config, canClaim, nextClaimAt, claimsToday,
  premiumBonusAvailable, premiumBonusNextAt,
}: {
  phase: 1 | 2 | 3; config: PhaseConfig;
  canClaim: boolean; nextClaimAt: string | null; claimsToday: number;
  premiumBonusAvailable: boolean; premiumBonusNextAt: string | null;
}) {
  const countdown      = useCountdown(canClaim ? null : nextClaimAt);
  const bonusCountdown = useCountdown(premiumBonusAvailable ? null : premiumBonusNextAt);
  const color = PHASE_COLORS[phase];
  const bg    = PHASE_BG[phase];

  return (
    <div style={{
      background: bg, border: `1px solid ${color}30`,
      borderRadius: 16, padding: '18px 20px', marginBottom: 24,
      display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center',
    }}>
      {/* Phase badge */}
      <div style={{
        background: `${color}18`, border: `1px solid ${color}40`,
        borderRadius: 12, padding: '6px 14px',
        display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
      }}>
        <span style={{ fontSize: 18 }}>{config.emoji}</span>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Fase {phase}
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
            {config.label}
          </div>
        </div>
      </div>

      {/* Description */}
      <div style={{ fontSize: 13, color: 'var(--text-secondary)', flex: 1, minWidth: 160 }}>
        {config.description}
      </div>

      {/* Slot counter */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {Array.from({ length: config.maxPerDay }).map((_, i) => (
          <div key={i} style={{
            width: 10, height: 10, borderRadius: '50%',
            background: i < claimsToday ? `${color}40` : color,
            border: `1.5px solid ${color}`,
            transition: 'background 0.3s',
          }} />
        ))}
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          {claimsToday}/{config.maxPerDay} hoy
        </span>
      </div>

      {/* Cooldown / ready */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        background: canClaim ? 'rgba(34,197,94,0.12)' : 'var(--bg-accent)',
        border: `1px solid ${canClaim ? 'rgba(34,197,94,0.3)' : 'var(--border-subtle)'}`,
        borderRadius: 10, padding: '6px 12px',
        fontSize: 13, fontWeight: 600,
        color: canClaim ? '#22c55e' : 'var(--text-secondary)',
        flexShrink: 0,
      }}>
        {canClaim ? (
          <><Zap size={13} style={{ color: '#22c55e' }} /> Listo para canjear</>
        ) : (
          <><Clock size={13} /> Próximo en {countdown}</>
        )}
      </div>

      {/* Phase 3 bonus */}
      {phase === 3 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: premiumBonusAvailable ? 'rgba(245,158,11,0.12)' : 'var(--bg-accent)',
          border: `1px solid ${premiumBonusAvailable ? 'rgba(245,158,11,0.35)' : 'var(--border-subtle)'}`,
          borderRadius: 10, padding: '6px 12px',
          fontSize: 12, fontWeight: 600,
          color: premiumBonusAvailable ? '#f59e0b' : 'var(--text-muted)',
          flexShrink: 0,
        }}>
          {premiumBonusAvailable
            ? '✨ Bonus premium disponible'
            : `✨ Bonus en ${bonusCountdown}`
          }
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function RewardsClient({
  initialRewards, initialCurrentPoints, initialClaims,
  phase, phaseConfig, initialNextClaimAt, initialClaimsToday,
  premiumBonusAvailable: initBonus, premiumBonusNextAt: initBonusNext,
}: RewardsClientProps) {
  const [rewards, setRewards]           = useState(initialRewards);
  const [currentPoints, setCurrentPoints] = useState(initialCurrentPoints);
  const [claims, setClaims]             = useState(initialClaims);
  const [showCreate, setShowCreate]     = useState(false);
  const [showHistory, setShowHistory]   = useState(false);
  const [nextClaimAt, setNextClaimAt]   = useState(initialNextClaimAt);
  const [claimsToday, setClaimsToday]   = useState(initialClaimsToday);
  const [bonusAvailable, setBonusAvailable] = useState(initBonus);
  const [bonusNextAt, setBonusNextAt]   = useState(initBonusNext);

  const canClaim = !nextClaimAt || new Date(nextClaimAt) <= new Date();

  // Escuchar evento de Flow (chat) para refrescar recompensas
  useEffect(() => {
    const handler = () => refreshRewards();
    window.addEventListener('focusflow:rewards-refresh', handler);
    return () => window.removeEventListener('focusflow:rewards-refresh', handler);
  }, []);

  // Migrar recompensas viejas (< 1,000 pts) al montar el componente
  useEffect(() => {
    fetch('/api/rewards/migrate', { method: 'POST' })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.deleted > 0 || data?.defaultsCreated) {
          // Recargar lista tras la migración
          refreshRewards();
        }
      })
      .catch(() => {});
  }, []);

  async function refreshRewards() {
    const res = await fetch('/api/rewards');
    if (res.ok) setRewards(await res.json());
  }

  async function refreshStatus() {
    const res = await fetch('/api/rewards/status');
    if (!res.ok) return;
    const data = await res.json();
    setNextClaimAt(data.nextClaimAt);
    setClaimsToday(data.claimsToday);
    setBonusAvailable(data.premiumBonusAvailable);
    setBonusNextAt(data.premiumBonusNextAt);
  }

  async function handleClaim(rewardId: string, cost: number) {
    const res = await fetch('/api/rewards/claim', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rewardId, cost }),
    });
    const data = await res.json();

    if (!res.ok) {
      const isCooldown = (data as any).cooldown;
      (window as any).showToast?.(isCooldown ? `⏳ ${data.error}` : `❌ ${data.error}`, 'warning');
      // Refresh status so countdown updates
      await refreshStatus();
      return false;
    }

    setCurrentPoints(data.currentPoints);
    setNextClaimAt(data.nextClaimAt);
    setClaimsToday(data.claimsToday);
    playRewardClaim();
    (window as any).showToast?.('🎁 ¡Recompensa canjeada! Disfrútala.', 'success');
    window.dispatchEvent(new CustomEvent('focusflow:reward-claimed', { detail: { cost } }));

    const claimsRes = await fetch('/api/rewards/claims');
    if (claimsRes.ok) setClaims(await claimsRes.json());
    await refreshStatus();
    return true;
  }

  return (
    <>
      {/* ── Points + actions ── */}
      <div className="card" style={{ marginBottom: 20, padding: '24px 28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <p style={{ margin: '0 0 2px', fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Puntos disponibles
            </p>
            <div style={{
              fontSize: 48, fontWeight: 700,
              fontFamily: 'JetBrains Mono, monospace',
              color: 'var(--accent-primary)', lineHeight: 1,
              transition: 'all 0.4s cubic-bezier(0.34,1.56,0.64,1)',
            }}>
              {currentPoints.toLocaleString('es-ES')}
            </div>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>pts para gastar</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-secondary" style={{ gap: 8 }} onClick={() => setShowHistory(h => !h)}>
              <Clock size={15} /> {showHistory ? 'Ocultar historial' : 'Ver historial'}
            </button>
            <button className="btn btn-primary" style={{ gap: 8 }} onClick={() => setShowCreate(true)}>
              <Plus size={15} /> Nueva recompensa
            </button>
          </div>
        </div>
      </div>

      {/* ── Phase banner ── */}
      <PhaseBanner
        phase={phase}
        config={phaseConfig}
        canClaim={canClaim}
        nextClaimAt={nextClaimAt}
        claimsToday={claimsToday}
        premiumBonusAvailable={bonusAvailable}
        premiumBonusNextAt={bonusNextAt}
      />

      {/* ── Claim History ── */}
      {showHistory && (
        <div className="card" style={{ marginBottom: 28 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600 }}>Historial de canjes</h3>
          {claims.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: 0 }}>Aún no has canjeado ninguna recompensa.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {claims.map(claim => (
                <div key={claim.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 0', borderBottom: '1px solid var(--border-subtle)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 20 }}>{claim.expand?.reward?.icon ?? '🎁'}</span>
                    <div>
                      <div style={{ fontSize: 14, color: 'var(--text-primary)' }}>
                        {claim.expand?.reward?.title ?? 'Recompensa eliminada'}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {new Date(claim.claimed_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 14, color: 'var(--accent-danger)', fontWeight: 600 }}>
                    -{claim.points_spent} pts
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Rewards grid ── */}
      <h2 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 16px', color: 'var(--text-primary)' }}>
        Disponibles
      </h2>

      {rewards.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 32px', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🎁</div>
          <p style={{ fontSize: 15 }}>No hay recompensas. ¡Crea la primera!</p>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowCreate(true)}>
            Crear recompensa
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
          {rewards.map(reward => (
            <RewardCard
              key={reward.id}
              reward={reward}
              currentPoints={currentPoints}
              canClaim={canClaim}
              nextClaimAt={nextClaimAt}
              isPremiumPhase={phase === 3}
              onClaim={handleClaim}
            />
          ))}
        </div>
      )}

      {showCreate && (
        <CreateRewardModal onClose={() => setShowCreate(false)} onCreated={refreshRewards} />
      )}
    </>
  );
}
