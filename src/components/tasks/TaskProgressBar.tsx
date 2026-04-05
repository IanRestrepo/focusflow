interface TaskProgressBarProps {
  completed: number;
  total: number;
  earnedPoints: number;
  totalPoints: number;
}

export default function TaskProgressBar({ completed, total, earnedPoints, totalPoints }: TaskProgressBarProps) {
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100);

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          {pct}% completado
        </span>
        <span style={{ fontSize: 12, fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-secondary)' }}>
          <span style={{ color: pct === 100 ? 'var(--accent-success)' : 'var(--accent-progress)' }}>{earnedPoints}</span>
          /{totalPoints} pts
        </span>
      </div>
      <div className="progress-bar">
        <div
          className="progress-bar-fill"
          style={{
            width: `${pct}%`,
            background: pct === 100
              ? 'var(--accent-success)'
              : `linear-gradient(90deg, var(--accent-progress), ${pct > 50 ? 'var(--accent-success)' : 'var(--accent-progress)'})`,
          }}
        />
      </div>
    </div>
  );
}
