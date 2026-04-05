import { useState, useEffect, useRef } from 'react';
import { Settings, LogOut, Star, Flame, ChevronRight } from 'lucide-react';

interface UserMenuProps {
  username: string;
  level: number;
  currentPoints: number;
  streakDays: number;
  currentPath: string;
}


export default function UserMenu({ username, level, currentPoints, streakDays, currentPath }: UserMenuProps) {
  const [open, setOpen]           = useState(false);
  const [pts, setPts]             = useState(currentPoints);
  const [streak, setStreak]       = useState(streakDays);
  const [lvl, setLvl]             = useState(level);
  const containerRef              = useRef<HTMLDivElement>(null);

  const initial = (username[0] ?? '?').toUpperCase();

  // Live updates from events
  useEffect(() => {
    function onDelta(e: Event) {
      const { earnedPoints, newLevel } = (e as CustomEvent).detail;
      setPts(p => p + earnedPoints);
      if (newLevel) setLvl(newLevel);
    }
    function onStreak(e: Event) {
      const { streakDays: s } = (e as CustomEvent).detail;
      setStreak(s);
    }
    function onClaim(e: Event) {
      const { cost } = (e as CustomEvent).detail;
      setPts(p => Math.max(0, p - cost));
    }
    window.addEventListener('focusflow:stats-delta', onDelta);
    window.addEventListener('focusflow:streak-update', onStreak);
    window.addEventListener('focusflow:reward-claimed', onClaim);
    return () => {
      window.removeEventListener('focusflow:stats-delta', onDelta);
      window.removeEventListener('focusflow:streak-update', onStreak);
      window.removeEventListener('focusflow:reward-claimed', onClaim);
    };
  }, []);

  // Close on outside click
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  }

  const isSettings = currentPath === '/settings';

  return (
    <>
      <style>{`
        @keyframes usermenu-in {
          from { opacity: 0; transform: scale(0.92) translateY(-8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        .user-avatar-btn:hover { transform: scale(1.07) !important; }
        .user-avatar-btn:active { transform: scale(0.95) !important; }
        .usermenu-item:hover { background: var(--bg-accent) !important; }
      `}</style>

      <div
        ref={containerRef}
        style={{
          position: 'fixed',
          top: 16,
          right: 20,
          zIndex: 50,
        }}
      >
        {/* Avatar button */}
        <button
          className="user-avatar-btn"
          onClick={() => setOpen(o => !o)}
          aria-label="Menú de usuario"
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: 'var(--accent-primary-soft)',
            border: open
              ? '2px solid var(--accent-primary)'
              : '2px solid var(--border-accent)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 15,
            fontWeight: 800,
            color: 'var(--accent-primary)',
            letterSpacing: '-0.01em',
            boxShadow: open
              ? '0 0 0 4px var(--accent-primary-soft), 0 4px 16px rgba(0,0,0,0.3)'
              : '0 2px 10px rgba(0,0,0,0.25)',
            transition: 'border-color 0.2s, box-shadow 0.2s, transform 0.15s',
          }}
        >
          {initial}
        </button>

        {/* Dropdown */}
        {open && (
          <div style={{
            position: 'absolute',
            top: 'calc(100% + 10px)',
            right: 0,
            width: 240,
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-default)',
            borderRadius: 16,
            boxShadow: '0 16px 48px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)',
            overflow: 'hidden',
            animation: 'usermenu-in 0.2s cubic-bezier(0.34,1.4,0.64,1) forwards',
          }}>

            {/* Header — user info */}
            <div style={{
              padding: '16px',
              background: 'var(--bg-tertiary)',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}>
              <div style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: 'var(--accent-primary-soft)',
                border: '2px solid var(--border-accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
                fontWeight: 800,
                color: 'var(--accent-primary)',
                flexShrink: 0,
              }}>
                {initial}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {username}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>
                  Nivel {lvl}
                </div>
              </div>
            </div>

            {/* Stats */}
            <div style={{
              display: 'flex',
              borderBottom: '1px solid var(--border-subtle)',
            }}>
              <div style={{
                flex: 1,
                padding: '10px 16px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
                borderRight: '1px solid var(--border-subtle)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Star size={11} style={{ color: 'var(--accent-primary)' }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                    {pts.toLocaleString('es-ES')}
                  </span>
                </div>
                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>puntos</span>
              </div>
              <div style={{
                flex: 1,
                padding: '10px 16px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Flame size={11} style={{ color: '#f97316' }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                    {streak}
                  </span>
                </div>
                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>días racha</span>
              </div>
            </div>

            {/* Menu items */}
            <div style={{ padding: '6px' }}>
              <a
                href="/settings"
                className="usermenu-item"
                onClick={() => setOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '9px 10px',
                  borderRadius: 10,
                  textDecoration: 'none',
                  background: isSettings ? 'var(--accent-primary-soft)' : 'transparent',
                  transition: 'background 0.15s',
                }}
              >
                <div style={{
                  width: 30, height: 30, borderRadius: 8,
                  background: isSettings ? 'var(--accent-primary-soft)' : 'var(--bg-accent)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <Settings size={14} style={{ color: isSettings ? 'var(--accent-primary)' : 'var(--text-secondary)' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: isSettings ? 'var(--accent-primary)' : 'var(--text-primary)' }}>
                    Configuración
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Temas, sonidos, cuenta</div>
                </div>
                <ChevronRight size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              </a>
            </div>

            {/* Logout */}
            <div style={{ padding: '0 6px 6px' }}>
              <button
                onClick={handleLogout}
                className="usermenu-item"
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '9px 10px',
                  borderRadius: 10,
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
              >
                <div style={{
                  width: 30, height: 30, borderRadius: 8,
                  background: 'rgba(239,68,68,0.08)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <LogOut size={14} style={{ color: 'var(--accent-danger)' }} />
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent-danger)' }}>
                  Cerrar sesión
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
