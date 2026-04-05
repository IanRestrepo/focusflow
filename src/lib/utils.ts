/** Merge class names, filtering falsy values */
export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}

/** Format date as readable string in Spanish */
export function formatDateEs(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/** Format date as YYYY-MM-DD using LOCAL timezone (not UTC) */
export function toYMD(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Get today's YYYY-MM-DD string */
export function today(): string {
  return toYMD(new Date());
}

/** Get yesterday's YYYY-MM-DD string */
export function yesterday(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return toYMD(d);
}

/** Greeting based on hour */
export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Buenos días';
  if (hour < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

/** Format number with commas */
export function formatNumber(n: number): string {
  return n.toLocaleString('es-ES');
}

/** Clamp a number between min and max */
export function clamp(n: number, min: number, max: number): number {
  return Math.min(Math.max(n, min), max);
}

/** Calculate level from total points */
export function calcLevel(totalPoints: number): number {
  return Math.floor(totalPoints / 500) + 1;
}

/** Calculate progress towards next level (0–1) */
export function calcLevelProgress(totalPoints: number): number {
  return (totalPoints % 500) / 500;
}

/** Points needed for next level */
export function pointsToNextLevel(totalPoints: number): number {
  return 500 - (totalPoints % 500);
}

/** Category label in Spanish */
export function categoryLabel(cat: string): string {
  const map: Record<string, string> = {
    work: 'Trabajo',
    personal: 'Personal',
    health: 'Salud',
    learning: 'Aprendizaje',
    other: 'Otro',
  };
  return map[cat] ?? 'Otro';
}

/** Truncate string */
export function truncate(str: string, len: number): string {
  return str.length > len ? str.slice(0, len - 1) + '…' : str;
}
