import { useState, useEffect } from 'react';
import { Flame, Star, Trophy, Search, Eye, EyeOff, Crown, Medal, Award } from 'lucide-react';

interface CommunityUser {
  id: string;
  username: string;
  level: number;
  streak_days: number;
  total_points: number;
}

interface Props {
  currentUserId: string;
  currentUserIsPublic: boolean;
}

type SortKey = 'streak' | 'level' | 'points';

// ── Badge computation (from stats alone) ─────────────────────────────────────
function getHighlights(user: CommunityUser): { emoji: string; label: string }[] {
  const badges: { emoji: string; label: string }[] = [];

  // Streak milestones
  if (user.streak_days >= 365) badges.push({ emoji: '🏆', label: '1 año' });
  else if (user.streak_days >= 100) badges.push({ emoji: '💎', label: '100 días' });
  else if (user.streak_days >= 30) badges.push({ emoji: '🌟', label: '30 días' });
  else if (user.streak_days >= 7) badges.push({ emoji: '🔥', label: '7 días' });

  // Level milestones
  if (user.level >= 50) badges.push({ emoji: '👑', label: 'Lv 50' });
  else if (user.level >= 20) badges.push({ emoji: '💫', label: 'Lv 20' });
  else if (user.level >= 10) badges.push({ emoji: '⭐', label: 'Lv 10' });
  else if (user.level >= 5) badges.push({ emoji: '✨', label: 'Lv 5' });

  // Points milestones
  if (user.total_points >= 50000) badges.push({ emoji: '🎯', label: '50k pts' });
  else if (user.total_points >= 10000) badges.push({ emoji: '🎖️', label: '10k pts' });
  else if (user.total_points >= 1000) badges.push({ emoji: '🏅', label: '1k pts' });

  return badges.slice(0, 3);
}

function getRankIcon(rank: number) {
  if (rank === 1) return <Crown size={16} style={{ color: '#f59e0b' }} />;
  if (rank === 2) return <Medal size={16} style={{ color: '#9ca3af' }} />;
  if (rank === 3) return <Award size={16} style={{ color: '#b45309' }} />;
  return <span style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', minWidth: 16, textAlign: 'center' }}>{rank}</span>;
}

function getInitials(username: string) {
  return username.slice(0, 2).toUpperCase();
}

function avatarColor(username: string) {
  const colors = ['#f59e0b', '#3b82f6', '#22c55e', '#8b5cf6', '#f43f5e', '#06b6d4', '#ec4899', '#f97316'];
  let hash = 0;
  for (let i = 0; i < username.length; i++) hash = username.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

// ── Toggle switch ─────────────────────────────────────────────────────────────
function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      style={{
        width: 48, height: 28, borderRadius: 14, border: 'none', cursor: 'pointer',
        background: value ? 'var(--accent-primary)' : 'var(--bg-accent)',
        position: 'relative', transition: 'background 0.25s', flexShrink: 0,
      }}
    >
      <div style={{
        position: 'absolute', top: 4, left: value ? 24 : 4,
        width: 20, height: 20, borderRadius: '50%', background: '#fff',
        transition: 'left 0.25s',
      }} />
    </button>
  );
}

// ── User card ─────────────────────────────────────────────────────────────────
function UserCard({ user, rank, isMe }: { user: CommunityUser; rank: number; isMe: boolean }) {
  const color = avatarColor(user.username);
  const highlights = getHighlights(user);

  return (
    <div
      className="card"
      style={{
        display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px',
        border: isMe ? '1px solid var(--accent-primary)' : undefined,
        background: isMe ? 'var(--accent-primary-soft)' : undefined,
      }}
    >
      {/* Rank */}
      <div style={{ width: 24, display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
        {getRankIcon(rank)}
      </div>

      {/* Avatar */}
      <div style={{
        width: 44, height: 44, borderRadius: '50%', background: color + '22',
        border: `2px solid ${color}66`, display: 'flex', alignItems: 'center',
        justifyContent: 'center', flexShrink: 0,
      }}>
        <span style={{ fontSize: 15, fontWeight: 700, color }}>{getInitials(user.username)}</span>
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{
            fontSize: 15, fontWeight: 600, color: 'var(--text-primary)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            @{user.username}
          </span>
          {isMe && (
            <span style={{
              fontSize: 10, fontWeight: 700, color: 'var(--accent-primary)',
              background: 'var(--accent-primary-soft)', border: '1px solid var(--accent-primary)',
              borderRadius: 4, padding: '1px 5px',
            }}>TÚ</span>
          )}
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Flame size={12} style={{ color: user.streak_days > 0 ? '#f97316' : 'var(--text-muted)' }} />
            <span style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-primary)', fontWeight: 600 }}>{user.streak_days}</span> días
          </span>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Trophy size={12} style={{ color: '#8b5cf6' }} />
            Nv <span style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-primary)', fontWeight: 600 }}>{user.level}</span>
          </span>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Star size={12} style={{ color: 'var(--accent-primary)' }} />
            <span style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-primary)', fontWeight: 600 }}>{user.total_points.toLocaleString()}</span> pts
          </span>
        </div>
      </div>

      {/* Highlights */}
      {highlights.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          {highlights.map((h, i) => (
            <div
              key={i}
              title={h.label}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)',
                borderRadius: 8, padding: '4px 8px',
              }}
            >
              <span style={{ fontSize: 16 }}>{h.emoji}</span>
              <span style={{ fontSize: 9, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{h.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function CommunityClient({ currentUserId, currentUserIsPublic }: Props) {
  const [users, setUsers] = useState<CommunityUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('streak');
  const [isPublic, setIsPublic] = useState(currentUserIsPublic);
  const [visLoading, setVisLoading] = useState(false);

  useEffect(() => {
    fetch('/api/community')
      .then(r => r.ok ? r.json() : [])
      .then(d => { setUsers(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  async function toggleVisibility(val: boolean) {
    setIsPublic(val);
    setVisLoading(true);
    try {
      await fetch('/api/settings/visibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_public: val }),
      });
      (window as any).showToast?.(val ? '👁️ Ahora eres visible en la comunidad' : '🙈 Tu perfil está oculto', 'info');
    } catch {
      setIsPublic(!val); // revert
    } finally {
      setVisLoading(false);
    }
  }

  const sorted = [...users].sort((a, b) => {
    if (sortBy === 'streak') return b.streak_days - a.streak_days || b.level - a.level;
    if (sortBy === 'level')  return b.level - a.level || b.total_points - a.total_points;
    return b.total_points - a.total_points || b.level - a.level;
  });

  const filtered = sorted.filter(u =>
    u.username.toLowerCase().includes(search.toLowerCase())
  );

  const SORT_OPTIONS: { key: SortKey; label: string; icon: React.ReactNode }[] = [
    { key: 'streak', label: 'Racha',   icon: <Flame size={13} /> },
    { key: 'level',  label: 'Nivel',   icon: <Trophy size={13} /> },
    { key: 'points', label: 'Puntos',  icon: <Star size={13} /> },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 720, margin: '0 auto' }}>

      {/* Visibility card */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {isPublic
            ? <Eye size={18} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
            : <EyeOff size={18} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          }
          <div>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
              {isPublic ? 'Tu perfil es visible' : 'Tu perfil está oculto'}
            </p>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
              {isPublic
                ? 'Otros usuarios pueden ver tu racha, nivel y logros.'
                : 'No apareces en el ranking de la comunidad.'}
            </p>
          </div>
        </div>
        <Toggle value={isPublic} onChange={toggleVisibility} />
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
          <Search size={14} style={{
            position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
            color: 'var(--text-muted)', pointerEvents: 'none',
          }} />
          <input
            className="input"
            placeholder="Buscar usuario..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: 34 }}
          />
        </div>

        {/* Sort */}
        <div style={{
          display: 'flex', gap: 4, background: 'var(--bg-tertiary)',
          borderRadius: 8, padding: 4, border: '1px solid var(--border-subtle)',
        }}>
          {SORT_OPTIONS.map(opt => (
            <button
              key={opt.key}
              onClick={() => setSortBy(opt.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '4px 10px', borderRadius: 6, border: 'none', cursor: 'pointer',
                fontSize: 12, fontWeight: 600,
                background: sortBy === opt.key ? 'var(--accent-primary)' : 'transparent',
                color: sortBy === opt.key ? '#000' : 'var(--text-muted)',
                transition: 'all 0.15s',
              }}
            >
              {opt.icon} {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Count */}
      {!loading && (
        <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>
          {filtered.length} {filtered.length === 1 ? 'usuario' : 'usuarios'} en la comunidad
        </p>
      )}

      {/* List */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1,2,3].map(i => (
            <div key={i} style={{
              height: 80, borderRadius: 12,
              background: 'linear-gradient(90deg, var(--bg-tertiary) 25%, var(--bg-accent) 50%, var(--bg-tertiary) 75%)',
              backgroundSize: '200% 100%', animation: 'shimmer-gold 1.5s infinite',
            }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '48px 24px',
          color: 'var(--text-muted)', fontSize: 14,
        }}>
          {search ? 'No se encontró ningún usuario.' : 'Aún no hay usuarios en la comunidad.'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map((user, i) => {
            const rank = sorted.indexOf(user) + 1;
            return (
              <UserCard
                key={user.id}
                user={user}
                rank={rank}
                isMe={user.id === currentUserId}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
