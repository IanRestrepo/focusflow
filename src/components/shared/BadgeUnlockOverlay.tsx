import { useEffect, useState, useRef, useCallback } from 'react';
import { playAchievement } from '@/lib/sounds';

// ── Types ────────────────────────────────────────────────────────────────────

interface BadgeStats {
  totalTasks: number;
  totalSubs: number;
  totalPoints: number;
  streakDays: number;
  level: number;
  claimsCount: number;
  catWork: number;
  catHealth: number;
  catLearn: number;
  catPersonal: number;
  perfectDays: number;
  maxDayPts: number;
  uniqueDays: number;
  multiCatDay: boolean;
  maxDaySubs: number;
  weeks: number;
  earlyBird: boolean;
  nightOwl: boolean;
  weekend: boolean;
  allCats: boolean;
}

interface BadgeInfo {
  id: string;
  icon: string;
  title: string;
  description: string;
  category: string;
}

// ── Badge catalogue ───────────────────────────────────────────────────────────

function buildUnlockedBadges(s: BadgeStats): BadgeInfo[] {
  const tc = s.totalTasks;
  const stc = s.totalSubs;

  type Row = BadgeInfo & { unlocked: boolean };
  const b = (
    id: string, icon: string, title: string, description: string,
    unlocked: boolean, category: string
  ): Row => ({ id, icon, title, description, unlocked, category });

  const all: Row[] = [
    // 🔥 Racha
    b('streak-1',   '🌅', 'Primer día',          'Activo por primera vez',                                         s.streakDays >= 1,   'racha'),
    b('streak-2',   '✌️',  'Dos en fila',         '2 días consecutivos activo',                                     s.streakDays >= 2,   'racha'),
    b('streak-3',   '🔗', 'Racha de 3',          '3 días seguidos — el hábito empieza aquí',                       s.streakDays >= 3,   'racha'),
    b('streak-5',   '⚡', 'Cinco días',          '5 días sin parar',                                               s.streakDays >= 5,   'racha'),
    b('streak-7',   '🗓️', 'Semana perfecta',     '7 días consecutivos activo',                                     s.streakDays >= 7,   'racha'),
    b('streak-10',  '🔟', 'Diez días',           '10 días de racha',                                               s.streakDays >= 10,  'racha'),
    b('streak-14',  '💪', 'Dos semanas',          '14 días seguidos — ya es costumbre',                             s.streakDays >= 14,  'racha'),
    b('streak-21',  '🧠', 'Tres semanas',         '21 días — los neurocientíficos dicen que aquí nace el hábito',  s.streakDays >= 21,  'racha'),
    b('streak-30',  '🏆', 'Mes imparable',        '30 días consecutivos — increíble constancia',                   s.streakDays >= 30,  'racha'),
    b('streak-45',  '🌊', 'Ola de 45',           '45 días sin parar',                                              s.streakDays >= 45,  'racha'),
    b('streak-60',  '🦅', 'Dos meses',           '60 días de racha — eres una máquina',                            s.streakDays >= 60,  'racha'),
    b('streak-90',  '🌟', 'Tres meses',          '90 días consecutivos — élite',                                   s.streakDays >= 90,  'racha'),
    b('streak-100', '💯', 'Cien días',           '100 días de racha — legendario',                                  s.streakDays >= 100, 'racha'),
    b('streak-180', '🌙', 'Medio año',           '180 días consecutivos — impresionante',                          s.streakDays >= 180, 'racha'),
    b('streak-365', '🏅', 'Un año entero',       '365 días de racha — eres invencible',                            s.streakDays >= 365, 'racha'),
    // ✅ Tareas
    b('tasks-1',    '🌱', 'Primer paso',          'Completaste tu primera tarea',                                   tc >= 1,    'tareas'),
    b('tasks-3',    '🚀', 'Despegando',           '3 tareas completadas',                                           tc >= 3,    'tareas'),
    b('tasks-5',    '⭐', 'Cinco tareas',         '5 tareas terminadas',                                            tc >= 5,    'tareas'),
    b('tasks-10',   '🔥', 'Momentum',             '10 tareas — el impulso ya está',                                 tc >= 10,   'tareas'),
    b('tasks-20',   '📦', 'Veinte tareas',        '20 tareas completadas',                                          tc >= 20,   'tareas'),
    b('tasks-25',   '🎯', 'Cuarto de cien',       '25 tareas — un cuarto del camino',                               tc >= 25,   'tareas'),
    b('tasks-50',   '🔥', 'En llamas',            '50 tareas — ¡estás ardiendo!',                                   tc >= 50,   'tareas'),
    b('tasks-75',   '💎', 'Tres cuartos',         '75 tareas completadas',                                          tc >= 75,   'tareas'),
    b('tasks-100',  '💯', 'Centenario',           '100 tareas completadas — milestone épico',                       tc >= 100,  'tareas'),
    b('tasks-200',  '🌪️', 'Torbellino',          '200 tareas — eres una fuerza de la naturaleza',                  tc >= 200,  'tareas'),
    b('tasks-500',  '🦁', 'Quinientas',           '500 tareas — disciplina de élite',                               tc >= 500,  'tareas'),
    b('tasks-1000', '🌌', 'Mil tareas',           '1000 tareas — cifra de leyenda',                                 tc >= 1000, 'tareas'),
    // 📝 Pasos
    b('sub-1',    '👶', 'Primer paso',            'Completaste tu primer paso',                                      stc >= 1,    'pasos'),
    b('sub-10',   '🔨', 'Diez pasos',             '10 pasos completados',                                           stc >= 10,   'pasos'),
    b('sub-25',   '⚙️',  'Veinticinco pasos',    '25 pasos — engranaje en marcha',                                  stc >= 25,   'pasos'),
    b('sub-50',   '🌿', 'Cincuenta pasos',        '50 pasos — raíces profundas',                                    stc >= 50,   'pasos'),
    b('sub-100',  '💫', 'Cien pasos',             '100 pasos completados',                                          stc >= 100,  'pasos'),
    b('sub-250',  '🐝', 'Doscientos cincuenta',   '250 pasos — hormiga productiva',                                 stc >= 250,  'pasos'),
    b('sub-500',  '🦾', 'Quinientos pasos',       '500 pasos — fuerza imparable',                                   stc >= 500,  'pasos'),
    b('sub-1000', '🤖', 'Mil pasos',              '1000 pasos — eres una máquina',                                  stc >= 1000, 'pasos'),
    b('sub-2000', '⚡', 'Dos mil pasos',          '2000 pasos — electrizante',                                      stc >= 2000, 'pasos'),
    b('sub-5000', '🌌', 'Cinco mil pasos',        '5000 pasos — cifra cósmica',                                     stc >= 5000, 'pasos'),
    // ⭐ Puntos
    b('pts-50',     '✨', 'Primeros puntos',       'Ganaste tus primeros 50 puntos',                                 s.totalPoints >= 50,    'puntos'),
    b('pts-100',    '💰', 'Cien puntos',           '100 puntos acumulados',                                          s.totalPoints >= 100,   'puntos'),
    b('pts-250',    '🪙', 'Coleccionista',         '250 puntos — empezando a acumular',                              s.totalPoints >= 250,   'puntos'),
    b('pts-500',    '🏅', 'Quinientos',            '500 puntos — recompensas medianas al alcance',                   s.totalPoints >= 500,   'puntos'),
    b('pts-1000',   '💎', 'Mil puntos',            '1000 puntos — hito importante',                                  s.totalPoints >= 1000,  'puntos'),
    b('pts-2500',   '🔮', 'Dos mil quinientos',    '2500 puntos acumulados',                                         s.totalPoints >= 2500,  'puntos'),
    b('pts-5000',   '🌟', 'Cinco mil',             '5000 puntos — alto rendimiento',                                 s.totalPoints >= 5000,  'puntos'),
    b('pts-10000',  '💫', 'Diez mil',              '10,000 puntos — élite total',                                    s.totalPoints >= 10000, 'puntos'),
    b('pts-25000',  '🚀', 'Veinticinco mil',       '25,000 puntos — estratosférico',                                 s.totalPoints >= 25000, 'puntos'),
    b('pts-50000',  '🌌', 'Cincuenta mil',         '50,000 puntos — leyenda viva',                                   s.totalPoints >= 50000, 'puntos'),
    b('pts-100000', '👑', 'Cien mil',              '100,000 puntos — el máximo absoluto',                            s.totalPoints >= 100000,'puntos'),
    // 🚀 Nivel
    b('lvl-2',  '🌱', 'Nivel 2',     'Alcanzaste el nivel 2',              s.level >= 2,  'nivel'),
    b('lvl-3',  '🌿', 'Nivel 3',     'Nivel 3 desbloqueado',               s.level >= 3,  'nivel'),
    b('lvl-4',  '🍀', 'Nivel 4',     'Nivel 4 — bien encaminado',          s.level >= 4,  'nivel'),
    b('lvl-5',  '⚡', 'Nivel 5',     'Nivel 5 — energía en aumento',       s.level >= 5,  'nivel'),
    b('lvl-6',  '🔥', 'Nivel 6',     'Nivel 6 desbloqueado',               s.level >= 6,  'nivel'),
    b('lvl-7',  '💫', 'Nivel 7',     'Nivel 7 — suerte de campeones',      s.level >= 7,  'nivel'),
    b('lvl-8',  '🎯', 'Nivel 8',     'Nivel 8 — precisión total',          s.level >= 8,  'nivel'),
    b('lvl-9',  '🌟', 'Nivel 9',     'Nivel 9 — casi en la cima',          s.level >= 9,  'nivel'),
    b('lvl-10', '👑', 'Nivel 10',    'Nivel 10 — ¡leyenda!',               s.level >= 10, 'nivel'),
    b('lvl-12', '💎', 'Nivel 12',    'Nivel 12 — diamante',                s.level >= 12, 'nivel'),
    b('lvl-15', '🏆', 'Nivel 15',    'Nivel 15 — campeón reconocido',      s.level >= 15, 'nivel'),
    b('lvl-20', '🚀', 'Nivel 20',    'Nivel 20 — élite absoluta',          s.level >= 20, 'nivel'),
    b('lvl-25', '🌌', 'Nivel 25',    'Nivel 25 — más allá de las nubes',   s.level >= 25, 'nivel'),
    b('lvl-30', '☀️', 'Nivel 30',   'Nivel 30 — luz propia',              s.level >= 30, 'nivel'),
    b('lvl-50', '🌠', 'Nivel 50',    'Nivel 50 — eres una supernova',      s.level >= 50, 'nivel'),
    // 🏷️ Categorías
    b('cat-work-1',      '💼', 'Primer trabajo',         'Primera tarea de trabajo completada',              s.catWork >= 1,   'categorías'),
    b('cat-work-10',     '📊', 'Analista',               '10 tareas de trabajo completadas',                s.catWork >= 10,  'categorías'),
    b('cat-work-25',     '👔', 'Profesional',            '25 tareas de trabajo completadas',                s.catWork >= 25,  'categorías'),
    b('cat-work-100',    '🏢', 'Ejecutivo',              '100 tareas de trabajo — jefe de sí mismo',        s.catWork >= 100, 'categorías'),
    b('cat-health-1',    '🏃', 'Primer paso fit',        'Primera tarea de salud completada',               s.catHealth >= 1,   'categorías'),
    b('cat-health-10',   '💪', 'Activo',                 '10 tareas de salud completadas',                  s.catHealth >= 10,  'categorías'),
    b('cat-health-25',   '🧘', 'Atleta mental',          '25 tareas de salud — mente y cuerpo fuertes',     s.catHealth >= 25,  'categorías'),
    b('cat-health-100',  '🥇', 'Guerrero fit',           '100 tareas de salud — leyenda del bienestar',     s.catHealth >= 100, 'categorías'),
    b('cat-learn-1',     '📖', 'Curioso',                'Primera tarea de aprendizaje',                    s.catLearn >= 1,   'categorías'),
    b('cat-learn-10',    '🎓', 'Estudioso',              '10 tareas de aprendizaje completadas',            s.catLearn >= 10,  'categorías'),
    b('cat-learn-25',    '🔬', 'Investigador',           '25 tareas de aprendizaje — mente afilada',        s.catLearn >= 25,  'categorías'),
    b('cat-learn-100',   '🦉', 'Erudito',                '100 tareas de aprendizaje — sabio total',         s.catLearn >= 100, 'categorías'),
    b('cat-personal-1',  '🙋', 'Autocuidado',            'Primera tarea personal completada',               s.catPersonal >= 1,   'categorías'),
    b('cat-personal-10', '🌸', 'Equilibrado',            '10 tareas personales completadas',                s.catPersonal >= 10,  'categorías'),
    b('cat-personal-25', '🦋', 'Crecimiento',            '25 tareas personales — evolución constante',      s.catPersonal >= 25,  'categorías'),
    b('cat-all',         '🌈', 'Polivalente',            'Tareas completadas en las 4 categorías',          s.allCats,            'categorías'),
    // 🎁 Recompensas
    b('claim-1',   '🎁', 'Primera recompensa',    'Canjeaste tu primera recompensa — lo merecías',       s.claimsCount >= 1,   'recompensas'),
    b('claim-5',   '🛍️', 'Cinco canjes',          '5 recompensas canjeadas',                             s.claimsCount >= 5,   'recompensas'),
    b('claim-10',  '🎊', 'Diez canjes',           '10 recompensas — sabes premiarte bien',               s.claimsCount >= 10,  'recompensas'),
    b('claim-25',  '🎉', 'Veinticinco canjes',    '25 recompensas canjeadas',                            s.claimsCount >= 25,  'recompensas'),
    b('claim-50',  '🥳', 'Cincuenta canjes',      '50 recompensas — maestro del auto-premio',            s.claimsCount >= 50,  'recompensas'),
    b('claim-100', '🏅', 'Centenario de canjes',  '100 recompensas canjeadas — récord absoluto',         s.claimsCount >= 100, 'recompensas'),
    // 🌟 Especiales
    b('perfect-1',       '⭐', 'Día perfecto',           'Primer día con todas las tareas completadas',        s.perfectDays >= 1,  'especiales'),
    b('perfect-3',       '🌟', 'Tres perfectos',         '3 días perfectos en tu historial',                   s.perfectDays >= 3,  'especiales'),
    b('perfect-5',       '✨', 'Cinco perfectos',        '5 días perfectos — constancia real',                 s.perfectDays >= 5,  'especiales'),
    b('perfect-10',      '💫', 'Diez perfectos',         '10 días perfectos — nivel experto',                  s.perfectDays >= 10, 'especiales'),
    b('perfect-20',      '🌠', 'Veinte perfectos',       '20 días perfectos — máquina de productividad',       s.perfectDays >= 20, 'especiales'),
    b('perfect-30',      '🏆', 'Treinta perfectos',      '30 días perfectos — absoluta élite',                 s.perfectDays >= 30, 'especiales'),
    b('big-pts-single',  '💥', 'Gran jornada',           'Más de 200 pts ganados en un solo día',              s.maxDayPts >= 200,  'especiales'),
    b('week-active',     '🗓️', 'Semana completa',        'Activo los 7 días de la semana',                     s.uniqueDays >= 7,   'especiales'),
    b('multi-cat-day',   '🎨', 'Día multifacético',      'Tareas de 3+ categorías distintas en un día',         s.multiCatDay,       'especiales'),
    b('comeback',        '🔄', 'Comeback',               'Regresaste después de una pausa — eso toma valentía', tc >= 1 && s.streakDays >= 1, 'especiales'),
    b('early-bird',      '🌄', 'Madrugador',             'Completaste una tarea antes de las 9 AM',             s.earlyBird,         'especiales'),
    b('night-owl',       '🦉', 'Noctámbulo',             'Completaste una tarea después de las 10 PM',          s.nightOwl,          'especiales'),
    b('weekend-warrior', '🏄', 'Guerrero del fin de semana', 'Completaste tareas sábado Y domingo',            s.weekend,           'especiales'),
    b('speed-5',         '⚡', 'Velocista',              '5+ subtareas completadas en un mismo día',            s.maxDaySubs >= 5,   'especiales'),
    b('marathon',        '🏃', 'Maratón diario',         '10+ pasos completados en un día',                     s.maxDaySubs >= 10,  'especiales'),
    b('consistency-king','♟️', 'Rey constante',          'Tareas completadas en 3+ semanas distintas',          s.weeks >= 3,        'especiales'),
  ];

  return all.filter(x => x.unlocked).map(({ unlocked: _u, ...rest }) => rest);
}

// ── localStorage helpers ──────────────────────────────────────────────────────

const SEEN_KEY         = 'ff_seen_badges';
const LAST_SHOWN_KEY   = 'ff_badge_last_shown';
const THROTTLE_MS      = 5 * 60 * 1000; // 5 minutes

function getSeenBadges(): Set<string> {
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch { return new Set(); }
}

function markBadgesSeen(ids: string[]) {
  try {
    const current = getSeenBadges();
    ids.forEach(id => current.add(id));
    localStorage.setItem(SEEN_KEY, JSON.stringify([...current]));
  } catch {}
}

function canShowAnimation(): boolean {
  try {
    const last = Number(localStorage.getItem(LAST_SHOWN_KEY) ?? '0');
    return Date.now() - last > THROTTLE_MS;
  } catch { return true; }
}

function recordShownTime() {
  try { localStorage.setItem(LAST_SHOWN_KEY, String(Date.now())); } catch {}
}

// ── Category colours ──────────────────────────────────────────────────────────

const CAT_COLORS: Record<string, string> = {
  racha:       '#fb923c',
  tareas:      '#60a5fa',
  pasos:       '#a78bfa',
  puntos:      '#fbbf24',
  nivel:       '#34d399',
  categorías:  '#f472b6',
  recompensas: '#f87171',
  especiales:  '#818cf8',
};

const CAT_LABELS: Record<string, string> = {
  racha: '🔥 Racha', tareas: '✅ Tareas', pasos: '📝 Pasos',
  puntos: '⭐ Puntos', nivel: '🚀 Nivel', categorías: '🏷️ Categorías',
  recompensas: '🎁 Recompensas', especiales: '🌟 Especiales',
};

// ── Confetti particle ─────────────────────────────────────────────────────────

function Confetti({ delay, angle, distance, color }: {
  delay: number; angle: number; distance: number; color: string;
}) {
  const rad = (angle * Math.PI) / 180;
  const tx  = Math.cos(rad) * distance;
  const ty  = Math.sin(rad) * distance;
  const sz  = 6 + Math.random() * 8;
  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      width: sz, height: sz,
      borderRadius: Math.random() > 0.5 ? '50%' : '2px',
      background: color,
      animation: `badge-confetti 1.1s ease-out ${delay}s both`,
      // @ts-ignore
      '--tx': `${tx}px`, '--ty': `${ty}px`,
      '--rot': `${Math.random() * 720 - 360}deg`,
    }} />
  );
}

// ── CSS ───────────────────────────────────────────────────────────────────────

const CSS = `
  @keyframes badge-confetti {
    0%   { transform: translate(-50%,-50%) translate(0,0) rotate(0deg) scale(1); opacity: 1; }
    100% { transform: translate(-50%,-50%) translate(var(--tx),var(--ty)) rotate(var(--rot)) scale(0.2); opacity: 0; }
  }
  @keyframes badge-overlay-in  { from { opacity: 0; } to { opacity: 1; } }
  @keyframes badge-overlay-out { from { opacity: 1; } to { opacity: 0; } }
  @keyframes badge-card-in {
    0%   { transform: scale(0.4) translateY(60px); opacity: 0; }
    65%  { transform: scale(1.06) translateY(-6px); opacity: 1; }
    80%  { transform: scale(0.97) translateY(2px); }
    90%  { transform: scale(1.02) translateY(-1px); }
    100% { transform: scale(1) translateY(0); }
  }
  @keyframes badge-icon-bounce {
    0%   { transform: scale(0) rotate(-20deg); }
    55%  { transform: scale(1.3) rotate(8deg); }
    75%  { transform: scale(0.92) rotate(-3deg); }
    88%  { transform: scale(1.07) rotate(2deg); }
    100% { transform: scale(1) rotate(0deg); }
  }
  @keyframes badge-shine {
    0%  { opacity: 0; transform: translateX(-100%) rotate(25deg); }
    30% { opacity: 0.6; }
    60% { opacity: 0; transform: translateX(200%) rotate(25deg); }
    100%{ opacity: 0; }
  }
  @keyframes badge-label-in { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes badge-pulse-ring { 0% { transform: scale(0.8); opacity: 0.7; } 100% { transform: scale(2.4); opacity: 0; } }

  @keyframes notif-slide-in  { from { transform: translateX(120%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
  @keyframes notif-slide-out { from { transform: translateX(0); opacity: 1; } to { transform: translateX(120%); opacity: 0; } }
  @keyframes notif-dot-pulse { 0%,100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.6); opacity: 0.7; } }
`;

// ── Notification toast ────────────────────────────────────────────────────────

function NotificationToast({
  count, onView, onDismiss, leaving,
}: {
  count: number;
  onView: () => void;
  onDismiss: () => void;
  leaving: boolean;
}) {
  return (
    <div style={{
      position: 'fixed',
      bottom: 96,
      right: 24,
      zIndex: 9998,
      animation: leaving ? 'notif-slide-out 0.35s ease forwards' : 'notif-slide-in 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards',
      maxWidth: 320,
    }}>
      <div style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-accent)',
        borderRadius: 16,
        padding: '14px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)',
      }}>
        {/* Animated dot */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div style={{
            width: 10, height: 10, borderRadius: '50%',
            background: '#818cf8',
            animation: 'notif-dot-pulse 1.4s ease-in-out infinite',
          }} />
        </div>

        {/* Text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>
            🏅 {count === 1 ? 'Nuevo logro desbloqueado' : `${count} nuevos logros desbloqueados`}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            ¡Sigue así, lo estás haciendo genial!
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
          <button
            onClick={onView}
            style={{
              background: 'var(--accent-primary)',
              border: 'none', borderRadius: 8,
              padding: '6px 12px',
              fontSize: 12, fontWeight: 700,
              color: '#000', cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            Ver logros
          </button>
          <button
            onClick={onDismiss}
            style={{
              background: 'transparent',
              border: '1px solid var(--border-subtle)',
              borderRadius: 8,
              padding: '5px 12px',
              fontSize: 11, fontWeight: 600,
              color: 'var(--text-muted)', cursor: 'pointer',
            }}
          >
            Ahora no
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function BadgeUnlockOverlay() {
  // Animation state
  const [current, setCurrent]       = useState<BadgeInfo | null>(null);
  const [phase, setPhase]           = useState<'in' | 'show' | 'out'>('in');

  // Notification state
  const [notifBadges, setNotifBadges] = useState<BadgeInfo[]>([]); // pending for "ver logros"
  const [notifVisible, setNotifVisible] = useState(false);
  const [notifLeaving, setNotifLeaving] = useState(false);

  // Refs
  const animQueueRef    = useRef<BadgeInfo[]>([]);   // badges actively animating
  const isShowingRef    = useRef(false);
  const fetchingRef     = useRef(false);

  // ── Animation engine ──

  const showFromQueue = useCallback(() => {
    if (animQueueRef.current.length === 0) {
      isShowingRef.current = false;
      return;
    }
    const badge = animQueueRef.current.shift()!;
    isShowingRef.current = true;
    recordShownTime();

    setCurrent(badge);
    setPhase('in');
    playAchievement();
    markBadgesSeen([badge.id]);

    setTimeout(() => setPhase('show'), 80);
    setTimeout(() => setPhase('out'), 3200);
    setTimeout(() => {
      setCurrent(null);
      showFromQueue();
    }, 3900);
  }, []);

  // ── Dismiss notification ──

  const dismissNotif = useCallback(() => {
    setNotifLeaving(true);
    setTimeout(() => {
      setNotifVisible(false);
      setNotifLeaving(false);
    }, 350);
  }, []);

  // ── "Ver logros" — flush all pending into animation queue ──

  const viewAllBadges = useCallback(() => {
    dismissNotif();
    setNotifBadges(pending => {
      if (pending.length === 0) return pending;
      animQueueRef.current.push(...pending);
      if (!isShowingRef.current) showFromQueue();
      return [];
    });
  }, [dismissNotif, showFromQueue]);

  // ── Stats-delta listener ──

  useEffect(() => {
    async function onStatsDelta() {
      if (fetchingRef.current) return;
      fetchingRef.current = true;

      try {
        const res = await fetch('/api/badge-check');
        if (!res.ok) return;
        const stats: BadgeStats = await res.json();

        const unlocked = buildUnlockedBadges(stats);
        const seen     = getSeenBadges();
        const newOnes  = unlocked.filter(b => !seen.has(b.id));
        if (newOnes.length === 0) return;

        if (!isShowingRef.current && canShowAnimation()) {
          // Show the first one immediately, rest → notification
          const [first, ...rest] = newOnes;
          animQueueRef.current.push(first);
          showFromQueue();

          if (rest.length > 0) {
            setNotifBadges(prev => {
              const combined = [...prev, ...rest];
              setNotifVisible(true);
              setNotifLeaving(false);
              return combined;
            });
          }
        } else {
          // Throttled or already animating → all go to notification
          setNotifBadges(prev => {
            const combined = [...prev, ...newOnes];
            setNotifVisible(true);
            setNotifLeaving(false);
            return combined;
          });
        }
      } catch {
        // ignore
      } finally {
        fetchingRef.current = false;
      }
    }

    window.addEventListener('focusflow:stats-delta', onStatsDelta);
    return () => window.removeEventListener('focusflow:stats-delta', onStatsDelta);
  }, [showFromQueue]);

  // ── Confetti data (stable while badge is shown) ──
  const confettiRef = useRef<Array<{ angle: number; distance: number; delay: number; color: string }>>([]);
  if (current && confettiRef.current.length === 0) {
    const COLORS = ['#fb923c','#fbbf24','#34d399','#60a5fa','#a78bfa','#f472b6','#fff'];
    confettiRef.current = Array.from({ length: 40 }, (_, i) => ({
      angle:    (360 / 40) * i + Math.random() * 9,
      distance: 100 + Math.random() * 160,
      delay:    Math.random() * 0.4,
      color:    COLORS[Math.floor(Math.random() * COLORS.length)],
    }));
  }
  if (!current) confettiRef.current = [];

  const catColor = current ? (CAT_COLORS[current.category] ?? '#818cf8') : '#818cf8';
  const catLabel = current ? (CAT_LABELS[current.category] ?? current.category) : '';

  return (
    <>
      <style>{CSS}</style>

      {/* ── Notification toast ── */}
      {notifVisible && (
        <NotificationToast
          count={notifBadges.length}
          onView={viewAllBadges}
          onDismiss={dismissNotif}
          leaving={notifLeaving}
        />
      )}

      {/* ── Full-screen badge animation ── */}
      {current && (
        <div
          onClick={() => setPhase('out')}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: `radial-gradient(ellipse at center, ${catColor}22 0%, rgba(0,0,0,0.9) 65%)`,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
            animation: phase === 'out'
              ? 'badge-overlay-out 0.7s ease forwards'
              : 'badge-overlay-in 0.3s ease forwards',
          }}
        >
          {/* Confetti */}
          <div style={{ position: 'absolute', width: 0, height: 0 }}>
            {confettiRef.current.map((c, i) => (
              <Confetti key={i} angle={c.angle} distance={c.distance} delay={c.delay} color={c.color} />
            ))}
          </div>

          {/* Pulse rings */}
          {[0, 0.35, 0.7].map((delay, i) => (
            <div key={i} style={{
              position: 'absolute', width: 200, height: 200, borderRadius: '50%',
              border: `3px solid ${catColor}70`,
              animation: `badge-pulse-ring 1.5s ease-out ${delay}s infinite`,
            }} />
          ))}

          {/* "Nuevo logro" label */}
          <div style={{
            fontSize: 12, fontWeight: 700, letterSpacing: '0.22em',
            textTransform: 'uppercase', color: catColor,
            textShadow: `0 0 20px ${catColor}`,
            marginBottom: 24,
            animation: 'badge-label-in 0.4s ease 0.15s both',
          }}>
            ✨ Nuevo logro desbloqueado
          </div>

          {/* Card */}
          <div style={{
            position: 'relative',
            background: 'linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%)',
            border: `2px solid ${catColor}`,
            borderRadius: 24,
            padding: '36px 48px',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            boxShadow: `0 0 60px ${catColor}40, 0 24px 48px rgba(0,0,0,0.6)`,
            animation: 'badge-card-in 0.65s cubic-bezier(0.34,1.56,0.64,1) 0.05s both',
            overflow: 'hidden',
            minWidth: 280, maxWidth: 340,
          }}>
            {/* Shine sweep */}
            <div style={{
              position: 'absolute', inset: 0, pointerEvents: 'none',
              background: 'linear-gradient(100deg, transparent 30%, rgba(255,255,255,0.12) 50%, transparent 70%)',
              animation: 'badge-shine 1.2s ease 0.4s both',
            }} />

            {/* Icon */}
            <div style={{
              fontSize: 80, lineHeight: 1, userSelect: 'none', marginBottom: 16,
              filter: `drop-shadow(0 0 24px ${catColor}) drop-shadow(0 0 48px ${catColor}80)`,
              animation: 'badge-icon-bounce 0.7s cubic-bezier(0.34,1.56,0.64,1) 0.15s both',
            }}>
              {current.icon}
            </div>

            {/* Category pill */}
            <div style={{
              background: `${catColor}22`, border: `1px solid ${catColor}55`,
              borderRadius: 20, padding: '3px 12px',
              fontSize: 11, fontWeight: 700, color: catColor,
              letterSpacing: '0.1em', textTransform: 'uppercase',
              marginBottom: 14,
              animation: 'badge-label-in 0.4s ease 0.55s both',
            }}>
              {catLabel}
            </div>

            {/* Title */}
            <div style={{
              fontSize: 22, fontWeight: 800, color: 'var(--text-primary)',
              textAlign: 'center', marginBottom: 8,
              animation: 'badge-label-in 0.4s ease 0.65s both',
            }}>
              {current.title}
            </div>

            {/* Description */}
            <div style={{
              fontSize: 14, fontWeight: 500, color: 'var(--text-secondary)',
              textAlign: 'center', lineHeight: 1.5,
              animation: 'badge-label-in 0.4s ease 0.75s both',
            }}>
              {current.description}
            </div>
          </div>

          {/* Dismiss hint */}
          <div style={{
            marginTop: 28, fontSize: 12, color: 'rgba(255,255,255,0.3)',
            animation: 'badge-label-in 0.4s ease 1.8s both',
          }}>
            Toca para continuar
          </div>
        </div>
      )}
    </>
  );
}
