import { useState, useEffect } from 'react';
import {
  LayoutDashboard, Calendar, Gift, Trophy,
  PanelLeftClose, PanelLeftOpen, Flame, Star,
  MessageCircle, Repeat, Users
} from 'lucide-react';
import { calcLevelProgress, pointsToNextLevel } from '@/lib/utils';

interface SidebarProps {
  username: string;
  totalPoints: number;
  currentPoints: number;
  level: number;
  streakDays: number;
  currentPath: string;
}

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/calendar', label: 'Calendario', icon: Calendar },
  { href: '/recurring', label: 'Repetitivas', icon: Repeat },
  { href: '/chat', label: 'Chat con Flow', icon: MessageCircle },
  { href: '/rewards', label: 'Recompensas', icon: Gift },
  { href: '/history', label: 'Logros', icon: Trophy },
  { href: '/community', label: 'Comunidad', icon: Users },
];

const COLLAPSED_KEY = 'ff_sidebar_collapsed';

export default function Sidebar(props: SidebarProps) {
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem(COLLAPSED_KEY) === 'true'; } catch { return false; }
  });
  const [currentPoints, setCurrentPts]  = useState(props.currentPoints);
  const [totalPoints, setTotalPoints]   = useState(props.totalPoints);
  const [level, setLevel]               = useState(props.level);
  const [streakDays, setStreakDays]     = useState(props.streakDays);
  const [streakPulse, setStreakPulse]   = useState(false);
  const [ptsPulse, setPtsPulse]         = useState(false);

  const lvlProgress = calcLevelProgress(totalPoints);
  const ptsToNext   = pointsToNextLevel(totalPoints);

  // Persist, notify, y quitar la clase pre-hydration — React ahora es dueño del sidebar
  useEffect(() => {
    document.documentElement.classList.remove('sidebar-pre-collapsed');
    try { localStorage.setItem(COLLAPSED_KEY, String(collapsed)); } catch {}
    window.dispatchEvent(new CustomEvent('sidebar-toggle', { detail: { collapsed } }));
  }, [collapsed]);

  // Listen for point/streak/level updates from TaskCard or RewardsClient
  useEffect(() => {
    function onStatsDelta(e: Event) {
      const { earnedPoints, newLevel } = (e as CustomEvent).detail;
      setCurrentPts(p => p + earnedPoints);
      setTotalPoints(p => p + earnedPoints);
      if (newLevel) setLevel(newLevel);
      setPtsPulse(true);
      setTimeout(() => setPtsPulse(false), 600);
    }

    function onStreakUpdate(e: Event) {
      const { streakDays: s } = (e as CustomEvent).detail;
      setStreakDays(s);
      setStreakPulse(true);
      setTimeout(() => setStreakPulse(false), 500);
    }

    // When a reward is claimed, subtract from currentPoints
    function onRewardClaim(e: Event) {
      const { cost } = (e as CustomEvent).detail;
      setCurrentPts(p => Math.max(0, p - cost));
    }

    window.addEventListener('focusflow:stats-delta', onStatsDelta);
    window.addEventListener('focusflow:streak-update', onStreakUpdate);
    window.addEventListener('focusflow:reward-claimed', onRewardClaim);
    return () => {
      window.removeEventListener('focusflow:stats-delta', onStatsDelta);
      window.removeEventListener('focusflow:streak-update', onStreakUpdate);
      window.removeEventListener('focusflow:reward-claimed', onRewardClaim);
    };
  }, []);

  return (
    <aside className={`sidebar${collapsed ? ' collapsed' : ''}`}>
      {/* Logo */}
      <div style={{
        padding: '20px 16px 16px',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
        minHeight: 64,
      }}>
        {!collapsed && (
          <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>
            <span style={{ color: 'var(--text-primary)' }}>Focus</span>
            <span style={{ color: 'var(--accent-primary)' }}>Flow</span>
          </span>
        )}
        <button
          onClick={() => setCollapsed(c => !c)}
          className="btn btn-ghost"
          style={{
            padding: '6px',
            borderRadius: 8,
            flexShrink: 0,
            marginLeft: collapsed ? 'auto' : 0,
            marginRight: collapsed ? 'auto' : 0,
            opacity: 0.6,
            transition: 'opacity 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '0.6')}
          aria-label={collapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
          title={collapsed ? 'Expandir' : 'Colapsar'}
        >
          {collapsed
            ? <PanelLeftOpen  size={17} style={{ color: 'var(--text-secondary)' }} />
            : <PanelLeftClose size={17} style={{ color: 'var(--text-secondary)' }} />
          }
        </button>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = props.currentPath === href || (href !== '/' && props.currentPath.startsWith(href));
          return (
            <a
              key={href}
              href={href}
              className={`nav-item${isActive ? ' active' : ''}`}
              title={collapsed ? label : undefined}
            >
              <Icon size={18} style={{ flexShrink: 0 }} />
              {!collapsed && <span>{label}</span>}
            </a>
          );
        })}
      </nav>

      {/* Bottom stats */}
      <div style={{
        padding: '12px 8px',
        borderTop: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}>
        {/* Streak */}
        <div
          className={`nav-item${streakPulse ? ' animate-streak-pulse' : ''}`}
          style={{ cursor: 'default', gap: 8 }}
          title={collapsed ? `Racha: ${streakDays} días` : undefined}
        >
          <Flame size={18} style={{ color: streakDays > 0 ? '#f97316' : 'var(--text-muted)', flexShrink: 0 }} />
          {!collapsed && (
            <span style={{ fontSize: 13, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
              Racha: <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{streakDays}</span> días
            </span>
          )}
        </div>

        {/* Points */}
        <div
          className={`nav-item${ptsPulse ? ' animate-streak-pulse' : ''}`}
          style={{ cursor: 'default', gap: 8 }}
          title={collapsed ? `${currentPoints} pts disponibles` : undefined}
        >
          <Star size={18} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
          {!collapsed && (
            <span style={{ fontSize: 13, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
              <span className="mono" style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>{currentPoints}</span> pts
            </span>
          )}
        </div>

        {/* Level + progress bar */}
        {!collapsed && (
          <div style={{ padding: '4px 8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                Nivel <strong style={{ color: 'var(--text-primary)' }}>{level}</strong>
              </span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
                {ptsToNext} pts
              </span>
            </div>
            <div className="progress-bar">
              <div className="progress-bar-fill" style={{ width: `${lvlProgress * 100}%` }} />
            </div>
          </div>
        )}

        {/* Username */}
        {!collapsed && (
          <div style={{ padding: '4px 8px' }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
              @{props.username}
            </span>
          </div>
        )}
      </div>
    </aside>
  );
}
