import { useState } from 'react';
import { X, Zap } from 'lucide-react';

interface CreateRewardModalProps {
  onClose: () => void;
  onCreated: () => void;
}

const EMOJI_OPTIONS = ['🎮', '🍕', '🍔', '🍦', '☕', '📺', '📱', '🎵', '🎬', '💆', '🏖️', '🛍️', '🍪', '🎁', '🌟', '💤', '🎲', '📚', '🎨', '🏃'];

const MIN_COST = 1_000;

// Tier presets — all ≥ 1,000 pts
const TIERS = [
  {
    label: 'Mediana',
    emoji: '🔥',
    description: 'Snack, TikTok 30 min, Café',
    cost: 1_000,
    color: '#3b82f6',
    bg: 'rgba(59,130,246,0.08)',
    border: 'rgba(59,130,246,0.25)',
  },
  {
    label: 'Grande',
    emoji: '⭐',
    description: 'Gaming 1h, Salida, Compra pequeña',
    cost: 2_500,
    color: '#8b5cf6',
    bg: 'rgba(139,92,246,0.08)',
    border: 'rgba(139,92,246,0.25)',
  },
  {
    label: 'Premium',
    emoji: '👑',
    description: 'Día libre, Compra mayor, Experiencia',
    cost: 5_000,
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.08)',
    border: 'rgba(245,158,11,0.25)',
  },
  {
    label: 'Épica',
    emoji: '💎',
    description: 'Gran experiencia, Viaje, Lujo',
    cost: 10_000,
    color: '#ec4899',
    bg: 'rgba(236,72,153,0.08)',
    border: 'rgba(236,72,153,0.25)',
  },
];

function getTier(cost: number) {
  if (cost >= 10_000) return TIERS[3];
  if (cost >= 5_000)  return TIERS[2];
  if (cost >= 2_500)  return TIERS[1];
  return TIERS[0];
}

export default function CreateRewardModal({ onClose, onCreated }: CreateRewardModalProps) {
  const [title, setTitle]           = useState('');
  const [description, setDescription] = useState('');
  const [cost, setCost]             = useState(1_000);
  const [icon, setIcon]             = useState('🎁');
  const [customIcon, setCustomIcon] = useState('');
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');

  const tier = getTier(cost);

  function handleCostChange(raw: string) {
    const n = parseInt(raw) || MIN_COST;
    setCost(Math.max(MIN_COST, n));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError('El título es obligatorio.'); return; }
    if (cost < MIN_COST) { setError(`El costo mínimo es ${MIN_COST.toLocaleString('es-ES')} puntos.`); return; }
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/rewards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          cost,
          icon: customIcon.trim() || icon,
        }),
      });
      if (!res.ok) throw new Error('Error al crear recompensa');
      onCreated();
      onClose();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Nueva recompensa</h2>
          <button className="btn btn-ghost" style={{ padding: '6px' }} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {error && (
          <div style={{ background: 'var(--accent-danger-soft)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 14, color: 'var(--accent-danger)' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Title */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
              Título <span style={{ color: 'var(--accent-danger)' }}>*</span>
            </label>
            <input className="input" value={title} onChange={e => setTitle(e.target.value)} placeholder="Nombre de la recompensa" autoFocus />
          </div>

          {/* Description */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
              Descripción <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(opcional)</span>
            </label>
            <input className="input" value={description} onChange={e => setDescription(e.target.value)} placeholder="Detalles..." />
          </div>

          {/* Cost — tier presets + custom */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 10 }}>
              Costo en puntos <span style={{ color: 'var(--accent-danger)' }}>*</span>
            </label>

            {/* Tier buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 12 }}>
              {TIERS.map(t => {
                const active = cost === t.cost;
                return (
                  <button
                    key={t.label}
                    type="button"
                    onClick={() => setCost(t.cost)}
                    style={{
                      padding: '10px 6px',
                      borderRadius: 10,
                      border: `1.5px solid ${active ? t.color : 'var(--border-subtle)'}`,
                      background: active ? t.bg : 'var(--bg-tertiary)',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.15s',
                    }}
                  >
                    <div style={{ fontSize: 16 }}>{t.emoji}</div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: active ? t.color : 'var(--text-primary)', marginTop: 3 }}>
                      {t.label}
                    </div>
                    <div style={{
                      fontSize: 11, fontFamily: 'JetBrains Mono, monospace',
                      color: active ? t.color : 'var(--text-muted)', fontWeight: 600, marginTop: 2,
                    }}>
                      {t.cost.toLocaleString('es-ES')}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Custom amount input */}
            <div style={{ position: 'relative' }}>
              <input
                className="input"
                type="number"
                value={cost}
                onChange={e => handleCostChange(e.target.value)}
                min={MIN_COST}
                step={50}
                style={{ fontFamily: 'JetBrains Mono, monospace', paddingRight: 40 }}
              />
              <span style={{
                position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                fontSize: 12, color: 'var(--text-muted)',
              }}>pts</span>
            </div>

            {/* Live tier badge */}
            <div style={{
              marginTop: 8,
              display: 'flex', alignItems: 'center', gap: 6,
              background: tier.bg,
              border: `1px solid ${tier.border}`,
              borderRadius: 8, padding: '6px 12px',
              fontSize: 12, fontWeight: 600, color: tier.color,
            }}>
              <span>{tier.emoji}</span>
              <span>Tier {tier.label} · {tier.description}</span>
            </div>

            {/* Min notice */}
            <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
              Mínimo {MIN_COST.toLocaleString('es-ES')} pts · Puedes escribir cualquier cantidad
            </p>
          </div>

          {/* Icon */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 10 }}>
              Ícono
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
              {EMOJI_OPTIONS.map(emoji => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => { setIcon(emoji); setCustomIcon(''); }}
                  style={{
                    width: 40, height: 40, borderRadius: 8, fontSize: 20,
                    background: icon === emoji && !customIcon ? 'var(--accent-primary-soft)' : 'var(--bg-tertiary)',
                    border: icon === emoji && !customIcon ? '2px solid var(--accent-primary)' : '1px solid var(--border-default)',
                    cursor: 'pointer',
                  }}
                >
                  {emoji}
                </button>
              ))}
            </div>
            <input
              className="input"
              value={customIcon}
              onChange={e => setCustomIcon(e.target.value)}
              placeholder="O escribe un emoji personalizado..."
              style={{ fontSize: 18 }}
            />
          </div>

          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 16, display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ gap: 8 }}>
              <Zap size={14} />
              {loading ? 'Creando...' : `Crear · ${cost.toLocaleString('es-ES')} pts`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
