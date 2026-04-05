import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, LayoutGrid, List, X, CheckCircle2, Circle, Loader, Repeat } from 'lucide-react';

interface Task { id: string; date: string; status: string; title: string }
interface RecurringTemplate {
  id: string; title: string; category: string;
  days: string; points_value: number; subtask_templates: string;
}
interface Subtask { id: string; title: string; status: string; points_value: number }
interface TaskDetail { id: string; title: string; status: string; category: string; points_value: number; subtasks: Subtask[] }

interface CalendarClientProps {
  tasks: Task[];
  recurringTemplates: RecurringTemplate[];
  today: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function parseDays(days: string): number[] {
  return days.split(',').map(d => parseInt(d.trim())).filter(d => !isNaN(d));
}

/** Returns recurring templates active on a given date */
function getRecurringForDay(date: Date, templates: RecurringTemplate[]): RecurringTemplate[] {
  const dow = date.getDay(); // 0=Sun, 1=Mon, ... 6=Sat
  return templates.filter(t => parseDays(t.days).includes(dow));
}

function getWeekDays(date: Date): Date[] {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  return Array.from({ length: 7 }, (_, i) => {
    const dd = new Date(monday); dd.setDate(monday.getDate() + i); return dd;
  });
}

function getMonthDays(year: number, month: number): (Date | null)[] {
  const firstDay = new Date(year, month, 1);
  const lastDay  = new Date(year, month + 1, 0);
  const startOffset = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
  const days: (Date | null)[] = Array(startOffset).fill(null);
  for (let i = 1; i <= lastDay.getDate(); i++) days.push(new Date(year, month, i));
  return days;
}

function toYMD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function getDayStatus(
  dayStr: string,
  tasks: Task[],
  recurring: RecurringTemplate[],
  date: Date,
): 'none' | 'complete' | 'partial' | 'incomplete' | 'recurring' {
  const dayTasks    = tasks.filter(t => t.date.startsWith(dayStr));
  const hasRecurring = getRecurringForDay(date, recurring).length > 0;

  if (!dayTasks.length && !hasRecurring) return 'none';
  if (!dayTasks.length && hasRecurring) return 'recurring';

  const done = dayTasks.filter(t => t.status === 'completed').length;
  if (done === dayTasks.length) return 'complete';
  if (done === 0) return 'incomplete';
  return 'partial';
}

const STATUS_COLORS: Record<string, string> = {
  none:      'transparent',
  complete:  'var(--accent-success)',
  partial:   'var(--accent-primary)',
  incomplete:'var(--accent-danger)',
  recurring: 'var(--accent-progress)',
};
const STATUS_BG: Record<string, string> = {
  none:      'transparent',
  complete:  'rgba(34,197,94,0.08)',
  partial:   'rgba(245,158,11,0.08)',
  incomplete:'rgba(239,68,68,0.06)',
  recurring: 'rgba(59,130,246,0.06)',
};

const CAT_EMOJI: Record<string, string> = {
  work: '💼', personal: '🙋', health: '🏃', learning: '📚', other: '✨',
};

const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const MONTHS   = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

// ── Day Detail Panel ──────────────────────────────────────────────────────────
function DayPanel({
  dateStr, today, recurringTemplates, onClose,
}: {
  dateStr: string;
  today: string;
  recurringTemplates: RecurringTemplate[];
  onClose: () => void;
}) {
  const [tasks, setTasks]     = useState<TaskDetail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/tasks?date=${dateStr}`)
      .then(r => r.ok ? r.json() : [])
      .then(data => { setTasks(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [dateStr]);

  const date        = new Date(dateStr + 'T12:00:00');
  const isToday     = dateStr === today;
  const isPast      = dateStr < today;
  const recurring   = getRecurringForDay(date, recurringTemplates);
  const completed   = tasks.filter(t => t.status === 'completed').length;
  const allDone     = tasks.length > 0 && completed === tasks.length;
  const totalItems  = tasks.length + recurring.length;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 40,
          background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(2px)',
        }}
      />

      {/* Panel */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: 400, zIndex: 41,
        background: 'var(--bg-secondary)',
        borderLeft: '1px solid var(--border-default)',
        display: 'flex', flexDirection: 'column',
        boxShadow: '-8px 0 40px rgba(0,0,0,0.4)',
        animation: 'slide-in-panel 0.22s cubic-bezier(0.4,0,0.2,1)',
      }}>
        {/* Header */}
        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid var(--border-subtle)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 4 }}>
                {isToday ? '📍 Hoy' : isPast ? '📁 Pasado' : '📅 Próximo'}
              </div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', textTransform: 'capitalize' }}>
                {formatDateLabel(dateStr)}
              </h3>
            </div>
            <button className="btn btn-ghost" style={{ padding: '6px', flexShrink: 0 }} onClick={onClose}>
              <X size={18} />
            </button>
          </div>

          {/* Summary */}
          {!loading && totalItems > 0 && (
            <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
              {tasks.length > 0 && (
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  background: allDone ? 'rgba(34,197,94,0.1)' : 'var(--bg-accent)',
                  border: `1px solid ${allDone ? 'rgba(34,197,94,0.3)' : 'var(--border-subtle)'}`,
                  borderRadius: 8, padding: '5px 10px',
                  fontSize: 12, fontWeight: 600,
                  color: allDone ? 'var(--accent-success)' : 'var(--text-secondary)',
                }}>
                  {allDone ? '✅' : '🎯'} {completed}/{tasks.length} tareas
                </div>
              )}
              {recurring.length > 0 && (
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  background: 'rgba(59,130,246,0.08)',
                  border: '1px solid rgba(59,130,246,0.25)',
                  borderRadius: 8, padding: '5px 10px',
                  fontSize: 12, fontWeight: 600,
                  color: 'var(--accent-progress)',
                }}>
                  <Repeat size={11} /> {recurring.length} rutina{recurring.length > 1 ? 's' : ''}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 40 }}>
              <Loader size={22} style={{ color: 'var(--text-muted)', animation: 'spin 1s linear infinite' }} />
            </div>
          ) : totalItems === 0 ? (
            <div style={{ textAlign: 'center', paddingTop: 48, color: 'var(--text-muted)' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>📭</div>
              <p style={{ margin: 0, fontSize: 14 }}>Sin tareas para este día</p>
              {!isPast && (
                <a href={`/?date=${dateStr}`} style={{
                  display: 'inline-block', marginTop: 16,
                  fontSize: 13, fontWeight: 600, color: 'var(--accent-primary)',
                  textDecoration: 'none', padding: '7px 16px', borderRadius: 8,
                  border: '1px solid var(--border-accent)', background: 'var(--accent-primary-soft)',
                }}>
                  + Añadir tarea
                </a>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

              {/* One-time tasks */}
              {tasks.length > 0 && (
                <>
                  {tasks.length > 0 && recurring.length > 0 && (
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 2 }}>
                      Tareas del día
                    </div>
                  )}
                  {tasks.map(task => {
                    const taskDone = task.status === 'completed';
                    const subDone  = task.subtasks.filter(s => s.status === 'completed').length;
                    const pts      = task.subtasks.reduce((s, st) => s + (st.points_value ?? 0), 0) || task.points_value;

                    return (
                      <div key={task.id} style={{
                        background: taskDone ? 'var(--accent-success-soft)' : 'var(--bg-tertiary)',
                        border: `1px solid ${taskDone ? 'rgba(34,197,94,0.2)' : 'var(--border-subtle)'}`,
                        borderRadius: 12, padding: '12px 14px',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: task.subtasks.length ? 10 : 0 }}>
                          {taskDone
                            ? <CheckCircle2 size={15} style={{ color: 'var(--accent-success)', flexShrink: 0, marginTop: 1 }} />
                            : <Circle size={15} style={{ color: 'var(--border-default)', flexShrink: 0, marginTop: 1 }} />
                          }
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                              fontSize: 13, fontWeight: 600,
                              color: taskDone ? 'var(--text-muted)' : 'var(--text-primary)',
                              textDecoration: taskDone ? 'line-through' : 'none',
                              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            }}>
                              {CAT_EMOJI[task.category] ?? '✨'} {task.title}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, fontFamily: 'JetBrains Mono, monospace' }}>
                              {task.subtasks.length > 0
                                ? `${subDone}/${task.subtasks.length} pasos · ${pts} pts`
                                : `${pts} pts`
                              }
                            </div>
                          </div>
                        </div>
                        {task.subtasks.length > 0 && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, paddingLeft: 23 }}>
                            {task.subtasks.map(sub => (
                              <div key={sub.id} style={{
                                display: 'flex', alignItems: 'center', gap: 6, fontSize: 12,
                                color: sub.status === 'completed' ? 'var(--text-muted)' : 'var(--text-secondary)',
                              }}>
                                <div style={{
                                  width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                                  background: sub.status === 'completed' ? 'var(--accent-success)' : 'var(--border-default)',
                                }} />
                                <span style={{
                                  textDecoration: sub.status === 'completed' ? 'line-through' : 'none',
                                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                }}>
                                  {sub.title}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </>
              )}

              {/* Recurring tasks */}
              {recurring.length > 0 && (
                <>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--accent-progress)', marginTop: tasks.length ? 6 : 0, marginBottom: 2, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Repeat size={11} /> Rutinas
                  </div>
                  {recurring.map(tpl => {
                    let subtasks: { title: string; points_value: number }[] = [];
                    try { subtasks = JSON.parse(tpl.subtask_templates || '[]'); } catch {}

                    return (
                      <div key={tpl.id} style={{
                        background: 'rgba(59,130,246,0.06)',
                        border: '1px solid rgba(59,130,246,0.18)',
                        borderRadius: 12, padding: '12px 14px',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: subtasks.length ? 10 : 0 }}>
                          <Repeat size={14} style={{ color: 'var(--accent-progress)', flexShrink: 0, marginTop: 1 }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {CAT_EMOJI[tpl.category] ?? '✨'} {tpl.title}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, fontFamily: 'JetBrains Mono, monospace' }}>
                              {subtasks.length > 0
                                ? `${subtasks.length} pasos · ${tpl.points_value} pts`
                                : `${tpl.points_value} pts`
                              } · repetitiva
                            </div>
                          </div>
                        </div>
                        {subtasks.length > 0 && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, paddingLeft: 22 }}>
                            {subtasks.map((sub, i) => (
                              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-secondary)' }}>
                                <div style={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0, background: 'rgba(59,130,246,0.4)' }} />
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sub.title}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </>
              )}

              {/* Footer link */}
              <a
                href={`/?date=${dateStr}`}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  gap: 6, marginTop: 4,
                  fontSize: 13, fontWeight: 600, color: 'var(--accent-primary)',
                  textDecoration: 'none', padding: '9px 0', borderRadius: 8,
                  border: '1px solid var(--border-accent)', background: 'var(--accent-primary-soft)',
                  transition: 'background 0.15s',
                }}
              >
                Abrir en el dashboard →
              </a>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function CalendarClient({ tasks, recurringTemplates, today }: CalendarClientProps) {
  const [viewMode, setViewMode]       = useState<'week' | 'month'>('month');
  const [currentDate, setCurrentDate] = useState(new Date(today + 'T12:00:00'));
  const [hoveredDay, setHoveredDay]   = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  function navigate(dir: -1 | 1) {
    setCurrentDate(d => {
      const nd = new Date(d);
      if (viewMode === 'week') nd.setDate(nd.getDate() + dir * 7);
      else nd.setMonth(nd.getMonth() + dir);
      return nd;
    });
  }

  function selectDay(dayStr: string, date: Date) {
    const hasContent = tasks.filter(t => t.date.startsWith(dayStr)).length > 0
      || getRecurringForDay(date, recurringTemplates).length > 0;
    if (!hasContent && dayStr < today) return; // past empty days — nothing to show
    setSelectedDay(prev => prev === dayStr ? null : dayStr);
  }

  const weekDays  = getWeekDays(currentDate);
  const monthDays = getMonthDays(currentDate.getFullYear(), currentDate.getMonth());

  return (
    <>
      <div>
        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button className="btn btn-ghost" style={{ padding: '8px' }} onClick={() => navigate(-1)}>
              <ChevronLeft size={18} />
            </button>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, minWidth: 200, textAlign: 'center' }}>
              {viewMode === 'week'
                ? `${MONTHS[weekDays[0].getMonth()]} ${weekDays[0].getFullYear()}`
                : `${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`}
            </h2>
            <button className="btn btn-ghost" style={{ padding: '8px' }} onClick={() => navigate(1)}>
              <ChevronRight size={18} />
            </button>
            <button className="btn btn-secondary" style={{ fontSize: 13, padding: '6px 12px' }} onClick={() => setCurrentDate(new Date(today + 'T12:00:00'))}>
              Hoy
            </button>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className={`btn${viewMode === 'week' ? ' btn-primary' : ' btn-secondary'}`} style={{ padding: '8px 14px', fontSize: 13, gap: 6 }} onClick={() => setViewMode('week')}>
              <List size={14} /> Semana
            </button>
            <button className={`btn${viewMode === 'month' ? ' btn-primary' : ' btn-secondary'}`} style={{ padding: '8px 14px', fontSize: 13, gap: 6 }} onClick={() => setViewMode('month')}>
              <LayoutGrid size={14} /> Mes
            </button>
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: 20, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
          {[
            { color: 'var(--accent-success)',  label: 'Día perfecto' },
            { color: 'var(--accent-primary)',  label: 'En progreso' },
            { color: 'var(--accent-danger)',   label: 'Incompleto' },
            { color: 'var(--accent-progress)', label: 'Solo rutinas' },
            { color: 'var(--bg-accent)',       label: 'Sin tareas' },
          ].map(({ color, label }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: 3, background: color }} />
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{label}</span>
            </div>
          ))}
          <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 'auto' }}>
            Click en un día para ver sus tareas
          </span>
        </div>

        {/* ── WEEK VIEW ──────────────────────────────────────────────────────── */}
        {viewMode === 'week' ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
            {WEEKDAYS.map(d => (
              <div key={d} style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-muted)', padding: '6px 0', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {d}
              </div>
            ))}
            {weekDays.map(date => {
              const dayStr    = toYMD(date);
              const dayTasks  = tasks.filter(t => t.date.startsWith(dayStr));
              const recurring = getRecurringForDay(date, recurringTemplates);
              const status    = getDayStatus(dayStr, tasks, recurringTemplates, date);
              const isToday   = dayStr === today;
              const isSelected = selectedDay === dayStr;
              const done      = dayTasks.filter(t => t.status === 'completed').length;

              return (
                <div
                  key={dayStr}
                  className="card card-hover"
                  style={{
                    cursor: 'pointer', textAlign: 'center', padding: '16px 8px',
                    border: isSelected ? '2px solid var(--accent-primary)' : isToday ? '2px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                    minHeight: 120,
                    background: isSelected || isToday ? 'var(--accent-primary-soft)' : STATUS_BG[status] || 'var(--bg-secondary)',
                    boxShadow: isSelected ? '0 0 0 3px var(--accent-primary-glow)' : 'none',
                    transition: 'all 0.15s',
                  }}
                  onClick={() => selectDay(dayStr, date)}
                >
                  <div style={{ fontSize: 22, fontWeight: 700, color: isToday ? 'var(--accent-primary)' : 'var(--text-primary)', marginBottom: 6 }}>
                    {date.getDate()}
                  </div>
                  {dayTasks.length > 0 && (
                    <div style={{ fontSize: 12, fontFamily: 'JetBrains Mono, monospace', color: STATUS_COLORS[status], fontWeight: 600, marginBottom: 4 }}>
                      {done}/{dayTasks.length}
                    </div>
                  )}
                  {recurring.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, fontSize: 11, color: 'var(--accent-progress)' }}>
                      <Repeat size={10} /> {recurring.length}
                    </div>
                  )}
                  {dayTasks.length === 0 && recurring.length === 0 && (
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>vacío</div>
                  )}
                </div>
              );
            })}
          </div>

        ) : (
          /* ── MONTH VIEW ────────────────────────────────────────────────── */
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 4 }}>
              {WEEKDAYS.map(d => (
                <div key={d} style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-muted)', padding: '8px 0', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {d}
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
              {monthDays.map((date, i) => {
                if (!date) return <div key={`e-${i}`} style={{ minHeight: 90 }} />;

                const dayStr      = toYMD(date);
                const dayTasks    = tasks.filter(t => t.date.startsWith(dayStr));
                const recurring   = getRecurringForDay(date, recurringTemplates);
                const status      = getDayStatus(dayStr, tasks, recurringTemplates, date);
                const isToday     = dayStr === today;
                const isSelected  = selectedDay === dayStr;
                const isHover     = hoveredDay === dayStr;
                const done        = dayTasks.filter(t => t.status === 'completed').length;
                const statusColor = STATUS_COLORS[status];
                const hasContent  = dayTasks.length > 0 || recurring.length > 0;

                return (
                  <div
                    key={dayStr}
                    style={{
                      borderRadius: 10,
                      cursor: hasContent ? 'pointer' : 'default',
                      background: isSelected
                        ? 'var(--accent-primary-soft)'
                        : isToday
                        ? 'var(--accent-primary-soft)'
                        : isHover && hasContent
                        ? 'var(--bg-tertiary)'
                        : STATUS_BG[status] || 'var(--bg-secondary)',
                      border: isSelected
                        ? '2px solid var(--accent-primary)'
                        : isToday
                        ? '2px solid var(--border-accent)'
                        : status !== 'none'
                        ? `1px solid ${statusColor}40`
                        : '1px solid var(--border-subtle)',
                      boxShadow: isSelected ? '0 0 0 3px var(--accent-primary-glow)' : 'none',
                      minHeight: 90, padding: '10px 8px',
                      transition: 'background 0.15s, border-color 0.15s, box-shadow 0.15s',
                      display: 'flex', flexDirection: 'column', gap: 3,
                    }}
                    onClick={() => hasContent && selectDay(dayStr, date)}
                    onMouseEnter={() => setHoveredDay(dayStr)}
                    onMouseLeave={() => setHoveredDay(null)}
                  >
                    {/* Day number + status dot */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 14, fontWeight: isToday ? 800 : 500, color: isToday ? 'var(--accent-primary)' : 'var(--text-primary)' }}>
                        {date.getDate()}
                      </span>
                      {status !== 'none' && (
                        <div style={{ width: 8, height: 8, borderRadius: 2, background: statusColor, flexShrink: 0 }} />
                      )}
                    </div>

                    {/* Task count */}
                    {dayTasks.length > 0 && (
                      <div style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: statusColor, fontWeight: 600 }}>
                        {done}/{dayTasks.length}
                      </div>
                    )}

                    {/* Task title previews */}
                    {dayTasks.slice(0, 2).map(t => (
                      <div key={t.id} style={{
                        fontSize: 10,
                        color: t.status === 'completed' ? 'var(--text-muted)' : 'var(--text-secondary)',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        textDecoration: t.status === 'completed' ? 'line-through' : 'none',
                        lineHeight: 1.3,
                      }}>
                        {t.title}
                      </div>
                    ))}
                    {dayTasks.length > 2 && (
                      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>+{dayTasks.length - 2} más</div>
                    )}

                    {/* Recurring indicator */}
                    {recurring.length > 0 && (
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 3,
                        fontSize: 10, color: 'var(--accent-progress)',
                        marginTop: dayTasks.length ? 2 : 0,
                      }}>
                        <Repeat size={9} />
                        <span>{recurring.length} rutina{recurring.length > 1 ? 's' : ''}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Day detail panel */}
      {selectedDay && (
        <DayPanel
          dateStr={selectedDay}
          today={today}
          recurringTemplates={recurringTemplates}
          onClose={() => setSelectedDay(null)}
        />
      )}
    </>
  );
}
