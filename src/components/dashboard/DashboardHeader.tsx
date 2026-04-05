import { useState, useEffect } from 'react';

interface Props {
  username: string;
}

function getLocalGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Buenos días';
  if (hour < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

function getLocalDateLabel(): string {
  return new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function DashboardHeader({ username }: Props) {
  const [greeting, setGreeting]   = useState('');
  const [dateLabel, setDateLabel] = useState('');

  useEffect(() => {
    setGreeting(getLocalGreeting());
    setDateLabel(getLocalDateLabel());

    // Update greeting every minute in case user leaves the page open around midnight
    const timer = setInterval(() => {
      setGreeting(getLocalGreeting());
      setDateLabel(getLocalDateLabel());
    }, 60_000);

    return () => clearInterval(timer);
  }, []);

  if (!greeting) return null; // avoid SSR mismatch flash

  return (
    <div style={{ marginBottom: 28 }}>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 4px', textTransform: 'capitalize' }}>
        {dateLabel}
      </p>
      <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
        {greeting}, <span style={{ color: 'var(--accent-primary)' }}>{username}</span> 👋
      </h1>
    </div>
  );
}
