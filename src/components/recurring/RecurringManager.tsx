import { useState, useEffect } from 'react';
import { Plus, Trash2, ToggleLeft, ToggleRight, Repeat, Pencil } from 'lucide-react';
import { playSubtaskDing } from '@/lib/sounds';

interface SubtaskTemplate { title: string; points_value: number }

interface Template {
  id: string;
  title: string;
  description?: string;
  category: string;
  subtask_templates: string;
  days: string;
  is_active: boolean;
  points_value: number;
}

const DAYS_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const CAT_COLORS: Record<string, string> = {
  work: 'var(--accent-progress)', personal: '#c084fc',
  health: 'var(--accent-success)', learning: 'var(--accent-primary)', other: 'var(--text-muted)',
};
const CAT_LABELS: Record<string, string> = {
  work: '💼 Trabajo', personal: '🙋 Personal',
  health: '🏃 Salud', learning: '📚 Aprendizaje', other: '✨ Otro',
};

function parseDays(days: string): number[] {
  return days.split(',').map(d => parseInt(d.trim())).filter(d => !isNaN(d));
}

function DayPill({ day, active, onClick }: { day: number; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: 36, height: 36, borderRadius: '50%', border: 'none', cursor: 'pointer',
        background: active ? 'var(--accent-primary)' : 'var(--bg-accent)',
        color: active ? '#000' : 'var(--text-muted)',
        fontSize: 11, fontWeight: 700,
        transition: 'background 0.15s, color 0.15s',
      }}
    >
      {DAYS_LABELS[day].slice(0, 2)}
    </button>
  );
}

// ── Create/Edit Modal ────────────────────────────────────────────────────────
function CreateModal({ onClose, onCreated, editing }: {
  onClose: () => void;
  onCreated: () => void;
  editing?: Template;
}) {
  const [title, setTitle] = useState(editing?.title ?? '');
  const [category, setCategory] = useState(editing?.category ?? 'other');
  const [selectedDays, setSelectedDays] = useState<number[]>(
    editing ? parseDays(editing.days) : [0, 1, 2, 3, 4, 5, 6]
  );
  const [subtasks, setSubtasks] = useState<SubtaskTemplate[]>(
    editing ? (() => { try { return JSON.parse(editing.subtask_templates); } catch { return []; } })()
    : [{ title: '', points_value: 10 }]
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const PRESETS = [
    { label: 'Cada día', days: [0,1,2,3,4,5,6] },
    { label: 'Lun–Vie', days: [1,2,3,4,5] },
    { label: 'Fin de semana', days: [0,6] },
    { label: 'Lun, Mié, Vie', days: [1,3,5] },
  ];

  function toggleDay(d: number) {
    setSelectedDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d].sort());
  }

  async function handleSave() {
    if (!title.trim()) { setError('El título es obligatorio.'); return; }
    if (selectedDays.length === 0) { setError('Selecciona al menos un día.'); return; }
    setLoading(true); setError('');

    const validSubs = subtasks.filter(s => s.title.trim());
    const pts = validSubs.reduce((s, st) => s + st.points_value, 0) || 10;
    const payload = {
      title: title.trim(), category,
      subtask_templates: validSubs,
      days: selectedDays.join(','),
      points_value: pts,
    };

    try {
      if (editing) {
        await fetch(`/api/recurring/${editing.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...payload,
            subtask_templates: JSON.stringify(validSubs),
          }),
        });
      } else {
        await fetch('/api/recurring', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }
      playSubtaskDing();
      onCreated();
      onClose();
    } catch { setError('Error al guardar. Intenta de nuevo.'); }
    finally { setLoading(false); }
  }

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--accent-primary-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Repeat size={16} style={{ color: 'var(--accent-primary)' }} />
            </div>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>
              {editing ? 'Editar tarea repetitiva' : 'Nueva tarea repetitiva'}
            </h2>
          </div>
          <button className="btn btn-ghost" style={{ padding: '6px' }} onClick={onClose}>✕</button>
        </div>

        {error && (
          <div style={{ background: 'var(--accent-danger-soft)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 14, color: 'var(--accent-danger)' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Title */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
              Nombre de la tarea <span style={{ color: 'var(--accent-danger)' }}>*</span>
            </label>
            <input
              className="input"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="ej: Cepillarse los dientes, Hacer la cama..."
              autoFocus
            />
          </div>

          {/* Category */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Categoría</label>
            <select className="input" value={category} onChange={e => setCategory(e.target.value)} style={{ cursor: 'pointer' }}>
              {Object.entries(CAT_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>

          {/* Days */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 10 }}>
              Repetir los días
            </label>
            {/* Presets */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
              {PRESETS.map(p => (
                <button
                  key={p.label}
                  type="button"
                  className="btn btn-secondary"
                  style={{ fontSize: 12, padding: '4px 12px' }}
                  onClick={() => setSelectedDays(p.days)}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {[0,1,2,3,4,5,6].map(d => (
                <DayPill key={d} day={d} active={selectedDays.includes(d)} onClick={() => toggleDay(d)} />
              ))}
            </div>
            <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
              {selectedDays.length === 0 ? '⚠️ Selecciona al menos un día'
                : selectedDays.length === 7 ? 'Todos los días'
                : selectedDays.map(d => DAYS_LABELS[d]).join(', ')}
            </p>
          </div>

          {/* Subtasks */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 10 }}>
              Pasos (opcional)
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {subtasks.map((st, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    className="input"
                    value={st.title}
                    onChange={e => setSubtasks(prev => prev.map((s, j) => j === i ? { ...s, title: e.target.value } : s))}
                    placeholder={`Paso ${i + 1}`}
                    style={{ flex: 1, fontSize: 13, padding: '8px 12px' }}
                  />
                  <input
                    className="input"
                    type="number"
                    value={st.points_value}
                    onChange={e => setSubtasks(prev => prev.map((s, j) => j === i ? { ...s, points_value: parseInt(e.target.value) || 10 } : s))}
                    min={1} max={100}
                    style={{ width: 64, fontSize: 13, padding: '8px 8px', fontFamily: 'JetBrains Mono, monospace', textAlign: 'center', color: 'var(--accent-primary)' }}
                  />
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>pts</span>
                  {subtasks.length > 1 && (
                    <button type="button" className="btn btn-ghost" style={{ padding: '6px' }} onClick={() => setSubtasks(prev => prev.filter((_, j) => j !== i))}>
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              className="btn btn-ghost"
              style={{ marginTop: 8, fontSize: 13, color: 'var(--accent-primary)', padding: '6px 8px', gap: 6 }}
              onClick={() => setSubtasks(prev => [...prev, { title: '', points_value: 10 }])}
            >
              <Plus size={14} /> Agregar paso
            </button>
          </div>

          {/* Footer */}
          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 16, display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>Cancelar</button>
            <button type="button" className="btn btn-primary" onClick={handleSave} disabled={loading || !title.trim()}>
              {loading ? 'Guardando...' : editing ? '✓ Guardar cambios' : '✓ Crear tarea repetitiva'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function RecurringManager() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<Template | undefined>();
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/recurring');
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setTemplates(data);
      } else {
        console.error('[RecurringManager]', data?.error ?? 'Error desconocido');
      }
    } catch (e) {
      console.error('[RecurringManager fetch]', e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // Reload when user navigates back to this tab/page
    const onVisible = () => { if (document.visibilityState === 'visible') load(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, []);

  async function handleToggle(tpl: Template) {
    await fetch(`/api/recurring/${tpl.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !tpl.is_active }),
    });
    setTemplates(prev => prev.map(t => t.id === tpl.id ? { ...t, is_active: !t.is_active } : t));
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar esta tarea repetitiva?')) return;
    await fetch(`/api/recurring/${id}`, { method: 'DELETE' });
    setTemplates(prev => prev.filter(t => t.id !== id));
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: '0 0 6px', letterSpacing: '-0.02em' }}>
            🔁 Tareas repetitivas
          </h1>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: 14 }}>
            Se generan automáticamente cada día que las tengas programadas.
          </p>
        </div>
        <button
          className="btn btn-primary"
          style={{ gap: 8 }}
          onClick={() => { setEditing(undefined); setShowCreate(true); }}
        >
          <Plus size={15} /> Nueva tarea repetitiva
        </button>
      </div>

      {/* Info card */}
      <div style={{
        background: 'var(--accent-primary-soft)', border: '1px solid var(--border-accent)',
        borderRadius: 12, padding: '14px 18px', marginBottom: 28,
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <Repeat size={18} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
        <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          Cada vez que abras el dashboard, las tareas repetitivas de hoy se crean automáticamente.
          Perfectas para rutinas: cepillarse los dientes, hacer la cama, meditar, etc.
        </p>
      </div>

      {/* Templates list */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>Cargando...</div>
      ) : templates.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 32px' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔁</div>
          <h3 style={{ margin: '0 0 8px', fontSize: 18, color: 'var(--text-primary)' }}>Sin tareas repetitivas</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: 24, fontSize: 14 }}>
            Crea tu primera rutina diaria — cepillarse los dientes, hacer la cama, meditar…
          </p>
          <button className="btn btn-primary" style={{ gap: 8 }} onClick={() => setShowCreate(true)}>
            <Plus size={15} /> Crear primera rutina
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {templates.map(tpl => {
            const subtasks: SubtaskTemplate[] = (() => { try { return JSON.parse(tpl.subtask_templates); } catch { return []; } })();
            const days = parseDays(tpl.days);
            const totalPts = subtasks.reduce((s, st) => s + st.points_value, 0) || tpl.points_value;

            return (
              <div
                key={tpl.id}
                className="card"
                style={{
                  opacity: tpl.is_active ? 1 : 0.55,
                  border: tpl.is_active ? '1px solid var(--border-default)' : '1px solid var(--border-subtle)',
                  transition: 'opacity 0.2s, border-color 0.2s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {/* Category dot */}
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: CAT_COLORS[tpl.category] ?? 'var(--text-muted)', flexShrink: 0 }} />

                  {/* Title + meta */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 4 }}>
                      {tpl.title}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      {/* Day pills */}
                      <div style={{ display: 'flex', gap: 3 }}>
                        {[0,1,2,3,4,5,6].map(d => (
                          <div key={d} style={{
                            width: 22, height: 22, borderRadius: '50%', fontSize: 9, fontWeight: 700,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: days.includes(d) ? 'var(--accent-primary)' : 'var(--bg-accent)',
                            color: days.includes(d) ? '#000' : 'var(--text-muted)',
                          }}>
                            {DAYS_LABELS[d].slice(0,1)}
                          </div>
                        ))}
                      </div>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {subtasks.length > 0 ? `${subtasks.length} pasos` : 'Sin pasos'}
                      </span>
                      <span style={{ fontSize: 12, fontFamily: 'JetBrains Mono, monospace', color: 'var(--accent-primary)', fontWeight: 600 }}>
                        +{totalPts} pts/día
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                    <button
                      className="btn btn-ghost"
                      style={{ padding: '6px' }}
                      onClick={() => { setEditing(tpl); setShowCreate(true); }}
                      title="Editar"
                    >
                      <Pencil size={14} style={{ color: 'var(--text-muted)' }} />
                    </button>
                    <button
                      className="btn btn-ghost"
                      style={{ padding: '6px' }}
                      onClick={() => handleToggle(tpl)}
                      title={tpl.is_active ? 'Pausar' : 'Activar'}
                    >
                      {tpl.is_active
                        ? <ToggleRight size={20} style={{ color: 'var(--accent-primary)' }} />
                        : <ToggleLeft size={20} style={{ color: 'var(--text-muted)' }} />
                      }
                    </button>
                    <button
                      className="btn btn-ghost"
                      style={{ padding: '6px' }}
                      onClick={() => handleDelete(tpl.id)}
                      title="Eliminar"
                    >
                      <Trash2 size={14} style={{ color: 'var(--accent-danger)' }} />
                    </button>
                  </div>
                </div>

                {/* Subtasks preview */}
                {subtasks.length > 0 && (
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border-subtle)', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {subtasks.map((st, i) => (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        background: 'var(--bg-tertiary)', borderRadius: 6,
                        padding: '3px 10px', fontSize: 12, color: 'var(--text-secondary)',
                      }}>
                        <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--border-default)', flexShrink: 0 }} />
                        {st.title}
                        <span style={{ color: 'var(--accent-primary)', fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>
                          +{st.points_value}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showCreate && (
        <CreateModal
          editing={editing}
          onClose={() => { setShowCreate(false); setEditing(undefined); }}
          onCreated={load}
        />
      )}
    </div>
  );
}
