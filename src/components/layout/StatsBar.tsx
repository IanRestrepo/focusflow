import { useEffect, useRef, useState } from 'react';
import { Flame, Star, CheckSquare, TrendingUp } from 'lucide-react';
import { calcLevelProgress, pointsToNextLevel } from '@/lib/utils';

interface StatsBarProps {
  streakDays: number;
  pointsToday: number;
  tasksCompleted: number;
  tasksTotal: number;
  totalPoints: number;
  level: number;
}

/** Dispatched by TaskCard after every subtask/task completion */
export interface StatsDeltaEvent {
  earnedPoints: number;   // subtask pts + bonus
  taskCompleted: boolean; // did the parent task also finish?
  newLevel?: number;      // if level-up occurred
}

export default function StatsBar(props: StatsBarProps) {
  const [streakDays, setStreakDays]           = useState(props.streakDays);
  const [pointsToday, setPointsToday]         = useState(props.pointsToday);
  const [tasksCompleted, setTasksCompleted]   = useState(props.tasksCompleted);
  const [tasksTotal, setTasksTotal]           = useState(props.tasksTotal);
  const [totalPoints, setTotalPoints]         = useState(props.totalPoints);
  const [level, setLevel]                     = useState(props.level);
  const [pulsePts, setPulsePts]               = useState(false);
  const [pulseStreak, setPulseStreak]         = useState(false);
  const ptsRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Listen for subtask/task completions ───────────────────────────────────
  useEffect(() => {
    function onStatsDelta(e: Event) {
      const { earnedPoints, taskCompleted, newLevel } = (e as CustomEvent<StatsDeltaEvent>).detail;

      setPointsToday(p => p + earnedPoints);
      setTotalPoints(p => p + earnedPoints);
      if (taskCompleted) setTasksCompleted(n => n + 1);
      if (newLevel) setLevel(newLevel);

      // pulse the points card
      setPulsePts(true);
      if (ptsRef.current) clearTimeout(ptsRef.current);
      ptsRef.current = setTimeout(() => setPulsePts(false), 600);
    }

    // DayTaskList dispatches this when a new task is created
    function onTasksUpdate(e: Event) {
      const { total } = (e as CustomEvent<{ total: number }>).detail;
      setTasksTotal(total);
    }

    // Sidebar streak update (after updateStreak API response)
    function onStreakUpdate(e: Event) {
      const { streakDays: s } = (e as CustomEvent<{ streakDays: number }>).detail;
      setStreakDays(s);
      setPulseStreak(true);
      setTimeout(() => setPulseStreak(false), 500);
    }

    window.addEventListener('focusflow:stats-delta', onStatsDelta);
    window.addEventListener('focusflow:tasks-update', onTasksUpdate);
    window.addEventListener('focusflow:streak-update', onStreakUpdate);
    return () => {
      window.removeEventListener('focusflow:stats-delta', onStatsDelta);
      window.removeEventListener('focusflow:tasks-update', onTasksUpdate);
      window.removeEventListener('focusflow:streak-update', onStreakUpdate);
    };
  }, []);

  const lvlProgress = calcLevelProgress(totalPoints);
  const allDone = tasksTotal > 0 && tasksCompleted >= tasksTotal;

  const stats = [
    {
      id: 'streak',
      icon: <Flame size={20} style={{ color: streakDays > 0 ? '#f97316' : 'var(--text-muted)' }} />,
      label: 'Racha',
      value: `${streakDays} días`,
      sub: streakDays > 0 ? `+${Math.round(streakDays * 5)}% bonus` : 'Sin racha',
      color: streakDays > 0 ? '#f97316' : 'var(--text-muted)',
      pulse: pulseStreak,
    },
    {
      id: 'points',
      icon: <Star size={20} style={{ color: 'var(--accent-primary)' }} />,
      label: 'Puntos hoy',
      value: pointsToday.toString(),
      sub: 'ganados',
      color: 'var(--accent-primary)',
      mono: true,
      pulse: pulsePts,
    },
    {
      id: 'tasks',
      icon: <CheckSquare size={20} style={{ color: 'var(--accent-success)' }} />,
      label: 'Tareas',
      value: `${tasksCompleted}/${tasksTotal}`,
      sub: tasksTotal === 0 ? 'Sin tareas' : allDone ? '¡Día perfecto! 🎉' : 'completadas',
      color: allDone ? 'var(--accent-success)' : 'var(--text-primary)',
    },
    {
      id: 'level',
      icon: <TrendingUp size={20} style={{ color: 'var(--accent-progress)' }} />,
      label: `Nivel ${level}`,
      value: `${Math.round(lvlProgress * 100)}%`,
      sub: `${pointsToNextLevel(totalPoints)} pts para nivel ${level + 1}`,
      color: 'var(--accent-progress)',
      showBar: true,
      progress: lvlProgress,
    },
  ];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: 16,
      marginBottom: 32,
    }}>
      {stats.map(stat => (
        <div
          key={stat.id}
          className={`card${stat.pulse ? ' animate-pulse-glow' : ''}`}
          style={{
            padding: '16px 20px',
            transition: 'box-shadow 0.3s',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'var(--bg-accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {stat.icon}
            </div>
          </div>

          <div style={{
            fontSize: 22,
            fontWeight: 700,
            color: stat.color,
            fontFamily: stat.mono ? 'JetBrains Mono, monospace' : 'inherit',
            lineHeight: 1.2,
            marginBottom: 2,
            transition: 'color 0.3s',
          }}>
            {stat.value}
          </div>

          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: stat.showBar ? 8 : 0 }}>
            {stat.sub}
          </div>

          {stat.showBar && (
            <div className="progress-bar">
              <div className="progress-bar-fill" style={{ width: `${(stat.progress ?? 0) * 100}%` }} />
            </div>
          )}

          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {stat.label}
          </div>
        </div>
      ))}
    </div>
  );
}
