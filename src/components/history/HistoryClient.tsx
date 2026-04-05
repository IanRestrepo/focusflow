import { useMemo, useState } from 'react';
import { Trophy, Star, Flame, CheckSquare, Award } from 'lucide-react';

interface Task {
  id: string;
  date: string;
  status: string;
  title: string;
  points_value: number;
  completed_at?: string;
  category?: string;
}
interface Subtask { id: string; points_value: number; completed_at?: string }

interface HistoryClientProps {
  tasks: Task[];
  subtasks: Subtask[];
  claimsCount: number;
  totalPoints: number;
  streakDays: number;
  level: number;
}

interface Badge {
  id: string; icon: string; title: string; description: string; unlocked: boolean; category: string;
}

// ─────────────────────────────────────────────────────────────────────────────
function buildBadges(
  tasks: Task[], subtasks: Subtask[], totalPoints: number,
  streakDays: number, level: number, claimsCount: number
): Badge[] {
  const tc  = tasks.length;
  const stc = subtasks.length;

  // Perfect days: days where ALL tasks are completed
  const byDate: Record<string, Task[]> = {};
  tasks.forEach(t => { const d = t.date?.split('T')[0]; if (d) { byDate[d] = byDate[d] ?? []; byDate[d].push(t); } });
  // We consider a day "perfect" if it appears in completed tasks (all were completed)
  const perfectDays = Object.keys(byDate).length; // completed tasks only are fetched

  // Category counts
  const catWork     = tasks.filter(t => t.category === 'work').length;
  const catHealth   = tasks.filter(t => t.category === 'health').length;
  const catLearn    = tasks.filter(t => t.category === 'learning').length;
  const catPersonal = tasks.filter(t => t.category === 'personal').length;
  const allCats     = catWork > 0 && catHealth > 0 && catLearn > 0 && catPersonal > 0;

  const B = (id: string, icon: string, title: string, description: string, unlocked: boolean, cat: string): Badge =>
    ({ id, icon, title, description, unlocked, category: cat });

  return [
    // ── 🔥 RACHA ──────────────────────────────────────────────────────────
    B('streak-1',   '🌅', 'Primer día',        'Activo por primera vez',                         streakDays >= 1,   'racha'),
    B('streak-2',   '✌️',  'Dos en fila',       '2 días consecutivos activo',                     streakDays >= 2,   'racha'),
    B('streak-3',   '🔗', 'Racha de 3',        '3 días seguidos — el hábito empieza aquí',       streakDays >= 3,   'racha'),
    B('streak-5',   '⚡', 'Cinco días',        '5 días sin parar',                               streakDays >= 5,   'racha'),
    B('streak-7',   '🗓️', 'Semana perfecta',   '7 días consecutivos activo',                     streakDays >= 7,   'racha'),
    B('streak-10',  '🔟', 'Diez días',         '10 días de racha',                               streakDays >= 10,  'racha'),
    B('streak-14',  '💪', 'Dos semanas',        '14 días seguidos — ya es costumbre',             streakDays >= 14,  'racha'),
    B('streak-21',  '🧠', 'Tres semanas',       '21 días — los neurocientíficos dicen que aquí nace el hábito', streakDays >= 21, 'racha'),
    B('streak-30',  '🏆', 'Mes imparable',      '30 días consecutivos — increíble constancia',   streakDays >= 30,  'racha'),
    B('streak-45',  '🌊', 'Ola de 45',         '45 días sin parar',                              streakDays >= 45,  'racha'),
    B('streak-60',  '🦅', 'Dos meses',         '60 días de racha — eres una máquina',            streakDays >= 60,  'racha'),
    B('streak-90',  '🌟', 'Tres meses',        '90 días consecutivos — élite',                   streakDays >= 90,  'racha'),
    B('streak-100', '💯', 'Cien días',         '100 días de racha — legendario',                 streakDays >= 100, 'racha'),
    B('streak-180', '🌙', 'Medio año',         '180 días consecutivos — impresionante',          streakDays >= 180, 'racha'),
    B('streak-365', '🏅', 'Un año entero',     '365 días de racha — eres invencible',            streakDays >= 365, 'racha'),

    // ── ✅ TAREAS COMPLETADAS ─────────────────────────────────────────────
    B('tasks-1',    '🌱', 'Primer paso',       'Completaste tu primera tarea',                   tc >= 1,    'tareas'),
    B('tasks-3',    '🚀', 'Despegando',        '3 tareas completadas',                           tc >= 3,    'tareas'),
    B('tasks-5',    '⭐', 'Cinco tareas',      '5 tareas terminadas',                            tc >= 5,    'tareas'),
    B('tasks-10',   '🔥', 'Momentum',          '10 tareas — el impulso ya está',                 tc >= 10,   'tareas'),
    B('tasks-20',   '📦', 'Veinte tareas',     '20 tareas completadas',                          tc >= 20,   'tareas'),
    B('tasks-25',   '🎯', 'Cuarto de cien',    '25 tareas — un cuarto del camino',               tc >= 25,   'tareas'),
    B('tasks-50',   '🔥', 'En llamas',         '50 tareas — ¡estás ardiendo!',                   tc >= 50,   'tareas'),
    B('tasks-75',   '💎', 'Tres cuartos',      '75 tareas completadas',                          tc >= 75,   'tareas'),
    B('tasks-100',  '💯', 'Centenario',        '100 tareas completadas — milestone épico',       tc >= 100,  'tareas'),
    B('tasks-200',  '🌪️', 'Torbellino',       '200 tareas — eres una fuerza de la naturaleza', tc >= 200,  'tareas'),
    B('tasks-500',  '🦁', 'Quinientas',        '500 tareas — disciplina de élite',               tc >= 500,  'tareas'),
    B('tasks-1000', '🌌', 'Mil tareas',        '1000 tareas — cifra de leyenda',                 tc >= 1000, 'tareas'),

    // ── 📝 SUBTAREAS (PASOS) ─────────────────────────────────────────────
    B('sub-1',    '👶', 'Primer paso',        'Completaste tu primer paso',                     stc >= 1,    'pasos'),
    B('sub-10',   '🔨', 'Diez pasos',         '10 pasos completados',                           stc >= 10,   'pasos'),
    B('sub-25',   '⚙️',  'Veinticinco pasos', '25 pasos — engranaje en marcha',                 stc >= 25,   'pasos'),
    B('sub-50',   '🌿', 'Cincuenta pasos',    '50 pasos — raíces profundas',                    stc >= 50,   'pasos'),
    B('sub-100',  '💫', 'Cien pasos',         '100 pasos completados',                          stc >= 100,  'pasos'),
    B('sub-250',  '🐝', 'Doscientos cincuenta','250 pasos — hormiga productiva',                stc >= 250,  'pasos'),
    B('sub-500',  '🦾', 'Quinientos pasos',   '500 pasos — fuerza imparable',                   stc >= 500,  'pasos'),
    B('sub-1000', '🤖', 'Mil pasos',          '1000 pasos — eres una máquina',                  stc >= 1000, 'pasos'),
    B('sub-2000', '⚡', 'Dos mil pasos',      '2000 pasos — electrizante',                      stc >= 2000, 'pasos'),
    B('sub-5000', '🌌', 'Cinco mil pasos',    '5000 pasos — cifra cósmica',                     stc >= 5000, 'pasos'),

    // ── ⭐ PUNTOS GANADOS ─────────────────────────────────────────────────
    B('pts-50',     '✨', 'Primeros puntos',    'Ganaste tus primeros 50 puntos',                 totalPoints >= 50,    'puntos'),
    B('pts-100',    '💰', 'Cien puntos',        '100 puntos acumulados',                          totalPoints >= 100,   'puntos'),
    B('pts-250',    '🪙', 'Coleccionista',      '250 puntos — empezando a acumular',              totalPoints >= 250,   'puntos'),
    B('pts-500',    '🏅', 'Quinientos',         '500 puntos — recompensas medianas al alcance',   totalPoints >= 500,   'puntos'),
    B('pts-1000',   '💎', 'Mil puntos',         '1000 puntos — hito importante',                  totalPoints >= 1000,  'puntos'),
    B('pts-2500',   '🔮', 'Dos mil quinientos', '2500 puntos acumulados',                         totalPoints >= 2500,  'puntos'),
    B('pts-5000',   '🌟', 'Cinco mil',          '5000 puntos — alto rendimiento',                 totalPoints >= 5000,  'puntos'),
    B('pts-10000',  '💫', 'Diez mil',           '10,000 puntos — élite total',                    totalPoints >= 10000, 'puntos'),
    B('pts-25000',  '🚀', 'Veinticinco mil',    '25,000 puntos — estratosférico',                 totalPoints >= 25000, 'puntos'),
    B('pts-50000',  '🌌', 'Cincuenta mil',      '50,000 puntos — leyenda viva',                   totalPoints >= 50000, 'puntos'),
    B('pts-100000', '👑', 'Cien mil',           '100,000 puntos — el máximo absoluto',            totalPoints >= 100000,'puntos'),

    // ── 🚀 NIVEL ─────────────────────────────────────────────────────────
    B('lvl-2',  '🌱', 'Nivel 2',     'Alcanzaste el nivel 2',              level >= 2,  'nivel'),
    B('lvl-3',  '🌿', 'Nivel 3',     'Nivel 3 desbloqueado',               level >= 3,  'nivel'),
    B('lvl-4',  '🍀', 'Nivel 4',     'Nivel 4 — bien encaminado',          level >= 4,  'nivel'),
    B('lvl-5',  '⚡', 'Nivel 5',     'Nivel 5 — energía en aumento',       level >= 5,  'nivel'),
    B('lvl-6',  '🔥', 'Nivel 6',     'Nivel 6 desbloqueado',               level >= 6,  'nivel'),
    B('lvl-7',  '💫', 'Nivel 7',     'Nivel 7 — suerte de campeones',      level >= 7,  'nivel'),
    B('lvl-8',  '🎯', 'Nivel 8',     'Nivel 8 — precisión total',          level >= 8,  'nivel'),
    B('lvl-9',  '🌟', 'Nivel 9',     'Nivel 9 — casi en la cima',          level >= 9,  'nivel'),
    B('lvl-10', '👑', 'Nivel 10',    'Nivel 10 — ¡leyenda!',               level >= 10, 'nivel'),
    B('lvl-12', '💎', 'Nivel 12',    'Nivel 12 — diamante',                level >= 12, 'nivel'),
    B('lvl-15', '🏆', 'Nivel 15',    'Nivel 15 — campeón reconocido',      level >= 15, 'nivel'),
    B('lvl-20', '🚀', 'Nivel 20',    'Nivel 20 — élite absoluta',          level >= 20, 'nivel'),
    B('lvl-25', '🌌', 'Nivel 25',    'Nivel 25 — más allá de las nubes',   level >= 25, 'nivel'),
    B('lvl-30', '☀️', 'Nivel 30',   'Nivel 30 — luz propia',              level >= 30, 'nivel'),
    B('lvl-50', '🌠', 'Nivel 50',    'Nivel 50 — eres una supernova',      level >= 50, 'nivel'),

    // ── 🏷️ CATEGORÍAS ────────────────────────────────────────────────────
    B('cat-work-1',   '💼', 'Primer trabajo',       'Primera tarea de trabajo completada',         catWork >= 1,   'categorías'),
    B('cat-work-10',  '📊', 'Analista',             '10 tareas de trabajo completadas',            catWork >= 10,  'categorías'),
    B('cat-work-25',  '👔', 'Profesional',          '25 tareas de trabajo completadas',            catWork >= 25,  'categorías'),
    B('cat-work-100', '🏢', 'Ejecutivo',            '100 tareas de trabajo — jefe de sí mismo',    catWork >= 100, 'categorías'),
    B('cat-health-1',   '🏃', 'Primer paso fit',    'Primera tarea de salud completada',           catHealth >= 1,   'categorías'),
    B('cat-health-10',  '💪', 'Activo',             '10 tareas de salud completadas',              catHealth >= 10,  'categorías'),
    B('cat-health-25',  '🧘', 'Atleta mental',      '25 tareas de salud — mente y cuerpo fuertes', catHealth >= 25, 'categorías'),
    B('cat-health-100', '🥇', 'Guerrero fit',       '100 tareas de salud — leyenda del bienestar', catHealth >= 100,'categorías'),
    B('cat-learn-1',   '📖', 'Curioso',             'Primera tarea de aprendizaje',                catLearn >= 1,   'categorías'),
    B('cat-learn-10',  '🎓', 'Estudioso',           '10 tareas de aprendizaje completadas',        catLearn >= 10,  'categorías'),
    B('cat-learn-25',  '🔬', 'Investigador',        '25 tareas de aprendizaje — mente afilada',    catLearn >= 25,  'categorías'),
    B('cat-learn-100', '🦉', 'Erudito',             '100 tareas de aprendizaje — sabio total',     catLearn >= 100, 'categorías'),
    B('cat-personal-1',  '🙋', 'Autocuidado',       'Primera tarea personal completada',           catPersonal >= 1,   'categorías'),
    B('cat-personal-10', '🌸', 'Equilibrado',       '10 tareas personales completadas',            catPersonal >= 10,  'categorías'),
    B('cat-personal-25', '🦋', 'Crecimiento',       '25 tareas personales — evolución constante',  catPersonal >= 25,  'categorías'),
    B('cat-all',         '🌈', 'Polivalente',        'Tareas completadas en las 4 categorías principales', allCats, 'categorías'),

    // ── 🎁 RECOMPENSAS ────────────────────────────────────────────────────
    B('claim-1',   '🎁', 'Primera recompensa',    'Canjeaste tu primera recompensa — lo merecías', claimsCount >= 1,   'recompensas'),
    B('claim-5',   '🛍️', 'Cinco canjes',          '5 recompensas canjeadas',                       claimsCount >= 5,   'recompensas'),
    B('claim-10',  '🎊', 'Diez canjes',           '10 recompensas — sabes premiarte bien',         claimsCount >= 10,  'recompensas'),
    B('claim-25',  '🎉', 'Veinticinco canjes',    '25 recompensas canjeadas',                      claimsCount >= 25,  'recompensas'),
    B('claim-50',  '🥳', 'Cincuenta canjes',      '50 recompensas — maestro del auto-premio',      claimsCount >= 50,  'recompensas'),
    B('claim-100', '🏅', 'Centenario de canjes',  '100 recompensas canjeadas — récord absoluto',   claimsCount >= 100, 'recompensas'),

    // ── 🌟 ESPECIALES ─────────────────────────────────────────────────────
    B('perfect-1',  '⭐', 'Día perfecto',          'Primer día con todas las tareas completadas',   perfectDays >= 1,  'especiales'),
    B('perfect-3',  '🌟', 'Tres perfectos',        '3 días perfectos en tu historial',              perfectDays >= 3,  'especiales'),
    B('perfect-5',  '✨', 'Cinco perfectos',       '5 días perfectos — constancia real',            perfectDays >= 5,  'especiales'),
    B('perfect-10', '💫', 'Diez perfectos',        '10 días perfectos — nivel experto',             perfectDays >= 10, 'especiales'),
    B('perfect-20', '🌠', 'Veinte perfectos',      '20 días perfectos — máquina de productividad', perfectDays >= 20, 'especiales'),
    B('perfect-30', '🏆', 'Treinta perfectos',     '30 días perfectos — absoluta élite',            perfectDays >= 30, 'especiales'),
    B('big-pts-single', '💥', 'Gran jornada',      'Más de 200 pts ganados en un solo día', (() => {
      const ptsByDate: Record<string, number> = {};
      tasks.forEach(t => { const d = t.date?.split('T')[0]; if (d) ptsByDate[d] = (ptsByDate[d] ?? 0) + (t.points_value ?? 0); });
      return Object.values(ptsByDate).some(v => v >= 200);
    })(), 'especiales'),
    B('week-active', '🗓️', 'Semana completa',     'Activo los 7 días de la semana en algún momento', (() => {
      const days = new Set(tasks.map(t => new Date(t.date + 'T12:00:00').getDay()));
      return days.size >= 7;
    })(), 'especiales'),
    B('multi-cat-day', '🎨', 'Día multifacético', 'Tareas de 3+ categorías distintas en un día', (() => {
      const catsByDate: Record<string, Set<string>> = {};
      tasks.forEach(t => {
        const d = t.date?.split('T')[0];
        if (d && t.category) { catsByDate[d] = catsByDate[d] ?? new Set(); catsByDate[d].add(t.category); }
      });
      return Object.values(catsByDate).some(s => s.size >= 3);
    })(), 'especiales'),
    B('comeback', '🔄', 'Comeback',              'Regresaste después de una pausa — eso toma valentía', tc >= 1 && streakDays >= 1, 'especiales'),
    B('early-bird', '🌄', 'Madrugador',           'Completaste una tarea antes de las 9 AM', (() => {
      return tasks.some(t => { if (!t.completed_at) return false; const h = new Date(t.completed_at).getHours(); return h < 9; });
    })(), 'especiales'),
    B('night-owl', '🦉', 'Noctámbulo',           'Completaste una tarea después de las 10 PM', (() => {
      return tasks.some(t => { if (!t.completed_at) return false; const h = new Date(t.completed_at).getHours(); return h >= 22; });
    })(), 'especiales'),
    B('weekend-warrior', '🏄', 'Guerrero del fin de semana', 'Completaste tareas sábado Y domingo', (() => {
      const days = new Set(tasks.map(t => new Date(t.date + 'T12:00:00').getDay()));
      return days.has(0) && days.has(6);
    })(), 'especiales'),
    B('speed-5',   '⚡', 'Velocista',            '5+ subtareas completadas en un mismo día', (() => {
      if (!subtasks.length) return false;
      const stByDate: Record<string, number> = {};
      subtasks.forEach(s => {
        if (!s.completed_at) return;
        const d = s.completed_at.split('T')[0];
        stByDate[d] = (stByDate[d] ?? 0) + 1;
      });
      return Object.values(stByDate).some(v => v >= 5);
    })(), 'especiales'),
    B('marathon', '🏃', 'Maratón diario',        '10+ pasos completados en un día', (() => {
      if (!subtasks.length) return false;
      const stByDate: Record<string, number> = {};
      subtasks.forEach(s => {
        if (!s.completed_at) return;
        const d = s.completed_at.split('T')[0];
        stByDate[d] = (stByDate[d] ?? 0) + 1;
      });
      return Object.values(stByDate).some(v => v >= 10);
    })(), 'especiales'),
    B('consistency-king', '♟️', 'Rey constante',  'Tareas completadas en 3+ semanas distintas', (() => {
      const weeks = new Set(tasks.map(t => {
        const d = new Date(t.date + 'T12:00:00');
        const start = new Date(d); start.setDate(d.getDate() - d.getDay());
        return start.toISOString().split('T')[0];
      }));
      return weeks.size >= 3;
    })(), 'especiales'),
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
const CATEGORIES = ['todas', 'racha', 'tareas', 'pasos', 'puntos', 'nivel', 'categorías', 'recompensas', 'especiales'];
const CAT_LABELS: Record<string, string> = {
  todas: 'Todas', racha: '🔥 Racha', tareas: '✅ Tareas', pasos: '📝 Pasos',
  puntos: '⭐ Puntos', nivel: '🚀 Nivel', categorías: '🏷️ Categorías',
  recompensas: '🎁 Recompensas', especiales: '🌟 Especiales',
};

export default function HistoryClient({ tasks, subtasks, claimsCount, totalPoints, streakDays, level }: HistoryClientProps) {
  const [filter, setFilter] = useState<'todas' | 'unlocked' | string>('todas');
  const [catFilter, setCatFilter] = useState('todas');

  const badges = useMemo(
    () => buildBadges(tasks, subtasks, totalPoints, streakDays, level, claimsCount),
    [tasks, subtasks, totalPoints, streakDays, level, claimsCount]
  );

  const unlockedCount = badges.filter(b => b.unlocked).length;

  const displayed = badges.filter(b => {
    const catOk = catFilter === 'todas' || b.category === catFilter;
    const stateOk = filter === 'todas' || (filter === 'unlocked' ? b.unlocked : !b.unlocked);
    return catOk && stateOk;
  });

  // Group tasks by date for timeline
  const tasksByDate = useMemo(() => {
    const groups: Record<string, Task[]> = {};
    tasks.forEach(t => { const d = t.date?.split('T')[0] ?? 'unknown'; groups[d] = groups[d] ?? []; groups[d].push(t); });
    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a)).slice(0, 30);
  }, [tasks]);

  return (
    <div>
      {/* Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 32 }}>
        {[
          { icon: <CheckSquare size={18} style={{ color: 'var(--accent-success)' }} />, value: tasks.length, label: 'Tareas completadas' },
          { icon: <Star size={18} style={{ color: 'var(--accent-primary)' }} />, value: totalPoints.toLocaleString('es-ES'), label: 'Puntos totales', mono: true },
          { icon: <Flame size={18} style={{ color: '#f97316' }} />, value: streakDays, label: 'Racha actual' },
          { icon: <Award size={18} style={{ color: 'var(--accent-primary)' }} />, value: `${unlockedCount}/${badges.length}`, label: 'Badges' },
        ].map(({ icon, value, label, mono }, i) => (
          <div key={i} className="card" style={{ padding: '16px 20px' }}>
            <div style={{ marginBottom: 8 }}>{icon}</div>
            <div style={{ fontSize: 24, fontWeight: 700, fontFamily: mono ? 'JetBrains Mono, monospace' : 'inherit', color: 'var(--text-primary)' }}>
              {value}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Badge section */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>
          Badges — <span style={{ color: 'var(--accent-primary)' }}>{unlockedCount}</span>
          <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>/{badges.length}</span>
        </h2>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['todas', 'unlocked', 'locked'] as const).map(f => (
            <button
              key={f}
              className={`btn${filter === f ? ' btn-primary' : ' btn-secondary'}`}
              style={{ fontSize: 12, padding: '5px 12px' }}
              onClick={() => setFilter(f)}
            >
              {f === 'todas' ? 'Todas' : f === 'unlocked' ? '✅ Ganados' : '🔒 Pendientes'}
            </button>
          ))}
        </div>
      </div>

      {/* Category filter */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
        {CATEGORIES.map(c => (
          <button
            key={c}
            className={`btn${catFilter === c ? ' btn-primary' : ' btn-ghost'}`}
            style={{ fontSize: 12, padding: '4px 12px', border: '1px solid var(--border-subtle)' }}
            onClick={() => setCatFilter(c)}
          >
            {CAT_LABELS[c]}
          </button>
        ))}
      </div>

      {/* Badge grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10, marginBottom: 40 }}>
        {displayed.map(badge => (
          <div
            key={badge.id}
            className="card"
            style={{
              textAlign: 'center',
              padding: '18px 12px',
              opacity: badge.unlocked ? 1 : 0.32,
              filter: badge.unlocked ? 'none' : 'grayscale(1)',
              border: badge.unlocked ? '1px solid var(--border-accent)' : '1px solid var(--border-subtle)',
              transition: 'all 0.2s',
              position: 'relative',
            }}
          >
            {badge.unlocked && (
              <div style={{
                position: 'absolute', top: 6, right: 6,
                width: 8, height: 8, borderRadius: '50%',
                background: 'var(--accent-success)',
              }} />
            )}
            <div style={{ fontSize: 28, marginBottom: 6 }}>{badge.icon}</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 3, lineHeight: 1.3 }}>
              {badge.title}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.4 }}>
              {badge.description}
            </div>
          </div>
        ))}
        {displayed.length === 0 && (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
            No hay badges en este filtro.
          </div>
        )}
      </div>

      {/* Activity timeline */}
      <h2 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 16px' }}>Historial de actividad</h2>

      {tasksByDate.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 32px', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
          <p>Aún no has completado ninguna tarea. ¡Empieza hoy!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {tasksByDate.map(([date, dayTasks]) => {
            const pts = dayTasks.reduce((s, t) => s + (t.points_value ?? 0), 0);
            const d = new Date(date + 'T12:00:00');
            const dateLabel = d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });

            return (
              <div key={date} className="card" style={{ padding: '16px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <h3 style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', textTransform: 'capitalize' }}>
                    {dateLabel}
                  </h3>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <span style={{ fontSize: 12, color: 'var(--accent-success)', fontWeight: 600 }}>{dayTasks.length} tareas</span>
                    <span style={{ fontSize: 12, fontFamily: 'JetBrains Mono, monospace', color: 'var(--accent-primary)', fontWeight: 600 }}>+{pts} pts</span>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {dayTasks.map(task => (
                    <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--accent-success)', flexShrink: 0 }} />
                      <span style={{ fontSize: 13, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {task.title}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
