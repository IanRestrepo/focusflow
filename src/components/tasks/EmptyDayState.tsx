interface EmptyDayStateProps {
  onCreateTask: () => void;
}

export default function EmptyDayState({ onCreateTask }: EmptyDayStateProps) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '64px 32px',
      textAlign: 'center',
    }}>
      {/* SVG Illustration */}
      <svg width="96" height="96" viewBox="0 0 96 96" fill="none" style={{ marginBottom: 24, opacity: 0.7 }}>
        <circle cx="48" cy="48" r="40" stroke="var(--border-default)" strokeWidth="2" />
        <path d="M32 48l10 10 22-22" stroke="var(--accent-primary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="68" cy="28" r="5" fill="var(--accent-primary)" opacity="0.5" />
        <circle cx="75" cy="42" r="3" fill="var(--accent-primary)" opacity="0.3" />
        <circle cx="62" cy="20" r="2" fill="var(--accent-primary)" opacity="0.4" />
      </svg>

      <h3 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 10px' }}>
        Tu día está limpio.
      </h3>
      <p style={{ fontSize: 15, color: 'var(--text-secondary)', margin: '0 0 28px', maxWidth: 340, lineHeight: 1.6 }}>
        ¿Listo para conquistar algo? Crea tu primera tarea y empieza a ganar puntos.
      </p>

      <button className="btn btn-primary" style={{ fontSize: 15, padding: '12px 24px' }} onClick={onCreateTask}>
        ✨ Crear primera tarea
      </button>
    </div>
  );
}
