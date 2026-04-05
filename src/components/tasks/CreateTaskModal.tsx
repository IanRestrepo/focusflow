import { useState, useRef, useEffect, useMemo, type ReactNode } from 'react';
import { X, Plus, Trash2, Sparkles, Pencil, RotateCcw, Loader, Clock, Link2 } from 'lucide-react';
import { playSubtaskDing } from '@/lib/sounds';
import {
  calculatePoints, breakdownText, effortToPreset,
  DIFFICULTY_PRESETS,
  type EffortLevel, type DifficultyPreset,
} from '@/lib/pointsCalc';

interface CreateTaskModalProps {
  onClose:     () => void;
  onCreated:   () => void;
  defaultDate: string;
}

interface SubtaskDraft {
  id:    string;
  title: string;
}

interface AIResult {
  title:            string;
  category:         string;
  estimatedMinutes: number;
  effortLevel:      EffortLevel;
  subtasks:         { title: string }[];
}

const CATEGORIES = [
  { value: 'work',     label: '💼 Trabajo' },
  { value: 'personal', label: '🙋 Personal' },
  { value: 'health',   label: '🏃 Salud' },
  { value: 'learning', label: '📚 Aprendizaje' },
  { value: 'other',    label: '✨ Otro' },
];

const DIFFICULTY_LIST: { key: DifficultyPreset }[] = [
  { key: 'very_easy' }, { key: 'easy' }, { key: 'normal' }, { key: 'hard' },
];

type Step = 'input' | 'loading' | 'review' | 'manual';

// ── Detect urgency from task date ─────────────────────────────────────────────
function urgencyFromDate(dateStr: string): { isUrgent: boolean; isCritical: boolean } {
  const base = new Date();
  base.setHours(0, 0, 0, 0);
  const task = new Date(dateStr + 'T00:00:00');
  const days = Math.round((task.getTime() - base.getTime()) / 86400000);
  return { isCritical: days <= 0, isUrgent: days === 1 };
}

// ── Points breakdown card ─────────────────────────────────────────────────────
function BreakdownCard({
  durationMin, effort, category, numSubtasks, hasDependencies, isUrgent, isCritical,
}: {
  durationMin: number; effort: EffortLevel; category: string;
  numSubtasks: number; hasDependencies: boolean; isUrgent: boolean; isCritical: boolean;
}) {
  const bd = useMemo(() => calculatePoints({
    durationMin, effort, category, numSubtasks, hasDependencies, isUrgent, isCritical,
  }), [durationMin, effort, category, numSubtasks, hasDependencies, isUrgent, isCritical]);

  const urgencyLabel = isCritical ? '🔴 Crítico' : isUrgent ? '🟡 Urgente' : null;

  return (
    <div style={{
      background: 'var(--accent-primary-soft)',
      border: '1px solid var(--border-accent)',
      borderRadius: 14, padding: '14px 16px',
      display: 'flex', alignItems: 'center', gap: 16,
    }}>
      {/* Points number */}
      <div style={{ flexShrink: 0 }}>
        <div style={{
          fontSize: 36, fontWeight: 800, lineHeight: 1,
          fontFamily: 'JetBrains Mono, monospace',
          color: 'var(--accent-primary)',
          transition: 'all 0.25s',
        }}>
          {bd.total.toLocaleString('es-ES')}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>puntos</div>
      </div>

      {/* Divider */}
      <div style={{ width: 1, alignSelf: 'stretch', background: 'var(--border-accent)', flexShrink: 0 }} />

      {/* Breakdown text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.6,
          fontFamily: 'JetBrains Mono, monospace',
          wordBreak: 'break-word',
        }}>
          {breakdownText(bd)}
        </div>
        {(bd.bonusLabels.length > 0 || urgencyLabel) && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
            {bd.bonusLabels.map(l => (
              <span key={l} style={{
                fontSize: 10, fontWeight: 600,
                background: 'var(--bg-accent)', border: '1px solid var(--border-subtle)',
                borderRadius: 6, padding: '2px 7px', color: 'var(--accent-primary)',
              }}>{l}</span>
            ))}
            {urgencyLabel && (
              <span style={{
                fontSize: 10, fontWeight: 600,
                background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)',
                borderRadius: 6, padding: '2px 7px', color: '#f59e0b',
              }}>{urgencyLabel}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Difficulty selector ───────────────────────────────────────────────────────
function DifficultySelector({
  selected, onSelect, durationMin, onDurationChange,
}: {
  selected: DifficultyPreset;
  onSelect: (key: DifficultyPreset) => void;
  durationMin: number;
  onDurationChange: (v: number) => void;
}) {
  return (
    <div>
      <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>
        Dificultad
      </label>

      {/* Preset buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 10 }}>
        {DIFFICULTY_LIST.map(({ key }) => {
          const p = DIFFICULTY_PRESETS[key];
          const active = selected === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelect(key)}
              style={{
                padding: '8px 4px',
                borderRadius: 10,
                border: `1.5px solid ${active ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                background: active ? 'var(--accent-primary-soft)' : 'var(--bg-tertiary)',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.15s',
              }}
            >
              <div style={{ fontSize: 16 }}>{p.emoji}</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: active ? 'var(--accent-primary)' : 'var(--text-primary)', marginTop: 3 }}>
                {p.label}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.3, marginTop: 2 }}>
                {p.description}
              </div>
            </button>
          );
        })}
      </div>

      {/* Duration override */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Clock size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Duración estimada:</span>
        <input
          className="input"
          type="number"
          value={durationMin}
          onChange={e => onDurationChange(Math.max(5, Math.min(1440, parseInt(e.target.value) || 5)))}
          min={5} max={1440} step={5}
          style={{ width: 64, padding: '4px 8px', fontSize: 13, fontFamily: 'JetBrains Mono, monospace', textAlign: 'center' }}
        />
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>min</span>
      </div>
    </div>
  );
}

// ── Subtask list ──────────────────────────────────────────────────────────────
function SubtaskList({
  subtasks, onAdd, onRemove, onUpdate,
}: {
  subtasks: SubtaskDraft[];
  onAdd: () => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, title: string) => void;
}) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>
          Pasos ({subtasks.length})
        </label>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          +{Math.min(subtasks.filter(s => s.title.trim()).length, 10) * 100} pts bonus
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {subtasks.map((st, idx) => (
          <div key={st.id} style={{
            display: 'flex', gap: 8, alignItems: 'center',
            background: 'var(--bg-tertiary)', borderRadius: 8,
            padding: '6px 10px 6px 12px',
            border: '1px solid var(--border-subtle)',
          }}>
            <span style={{
              width: 18, height: 18, borderRadius: 5,
              border: '2px solid var(--border-default)',
              flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 9, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace',
            }}>
              {idx + 1}
            </span>
            <input
              className="input"
              value={st.title}
              onChange={e => onUpdate(st.id, e.target.value)}
              placeholder={`Paso ${idx + 1}`}
              style={{
                flex: 1, fontSize: 13, padding: '5px 8px',
                background: 'transparent', border: 'none', boxShadow: 'none',
              }}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); onAdd(); } }}
            />
            {subtasks.length > 1 && (
              <button
                type="button"
                className="btn btn-ghost"
                style={{ padding: '4px', color: 'var(--text-muted)', flexShrink: 0 }}
                onClick={() => onRemove(st.id)}
              >
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
        onClick={onAdd}
      >
        <Plus size={14} /> Agregar paso
      </button>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═════════════════════════════════════════════════════════════════════════════
export default function CreateTaskModal({ onClose, onCreated, defaultDate }: CreateTaskModalProps) {
  // ── AI flow ────────────────────────────────────────────────────────────────
  const [step, setStep]     = useState<Step>('input');
  const [prompt, setPrompt] = useState('');
  const [aiError, setAiError] = useState('');
  const [dots, setDots]     = useState('.');

  // ── Task fields ────────────────────────────────────────────────────────────
  const [title, setTitle]       = useState('');
  const [category, setCategory] = useState('personal');
  const [date, setDate]         = useState(defaultDate);
  const [subtasks, setSubtasks] = useState<SubtaskDraft[]>([
    { id: '1', title: '' },
  ]);

  // ── Scoring params ─────────────────────────────────────────────────────────
  const [selectedPreset, setSelectedPreset] = useState<DifficultyPreset>('easy');
  const [durationMin, setDurationMin]       = useState(25);
  const [effort, setEffort]                 = useState<EffortLevel>('moderate');
  const [hasDependencies, setHasDependencies] = useState(false);

  // ── Submit ─────────────────────────────────────────────────────────────────
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError]     = useState('');

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Derived urgency from date
  const { isUrgent, isCritical } = useMemo(() => urgencyFromDate(date), [date]);

  // Live breakdown
  const validSubtasks = subtasks.filter(s => s.title.trim());
  const breakdown = useMemo(() => calculatePoints({
    durationMin, effort, category,
    numSubtasks: validSubtasks.length,
    hasDependencies, isUrgent, isCritical,
  }), [durationMin, effort, category, validSubtasks.length, hasDependencies, isUrgent, isCritical]);

  // Animated dots while loading
  useEffect(() => {
    if (step !== 'loading') return;
    const iv = setInterval(() => setDots(d => d.length >= 3 ? '.' : d + '.'), 450);
    return () => clearInterval(iv);
  }, [step]);

  useEffect(() => {
    if (step === 'input') textareaRef.current?.focus();
  }, [step]);

  // When preset is clicked, update both effort + duration
  function selectPreset(key: DifficultyPreset) {
    const p = DIFFICULTY_PRESETS[key];
    setSelectedPreset(key);
    setEffort(p.effort);
    setDurationMin(p.durationMin);
  }

  // When duration changes manually, find the closest preset to highlight
  function handleDurationChange(val: number) {
    setDurationMin(val);
    // Keep preset highlight on whatever was selected — user just overriding duration
  }

  // ── AI call ────────────────────────────────────────────────────────────────
  async function handleAIBreakdown() {
    if (!prompt.trim() || prompt.trim().length < 5) {
      setAiError('Escribe al menos 5 caracteres describiendo qué debes hacer.');
      return;
    }
    setAiError('');
    setStep('loading');

    try {
      const res = await fetch('/api/ai/breakdown', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: prompt }),
      });
      const data: AIResult | { error: string } = await res.json();

      if (!res.ok || 'error' in data) {
        setAiError(('error' in data ? data.error : null) ?? 'Error de IA. Intenta de nuevo.');
        setStep('input');
        return;
      }

      // Populate fields from AI result
      setTitle(data.title);
      setCategory(data.category);
      setSubtasks(data.subtasks.map((st, i) => ({ id: String(i + 1), title: st.title })));

      // Apply AI-detected difficulty
      const preset = effortToPreset(data.effortLevel);
      setSelectedPreset(preset);
      setEffort(data.effortLevel);
      setDurationMin(data.estimatedMinutes);

      playSubtaskDing();
      setStep('review');
    } catch {
      setAiError('No se pudo conectar con la IA. Intenta de nuevo.');
      setStep('input');
    }
  }

  // ── Subtask helpers ────────────────────────────────────────────────────────
  function addSubtask() {
    setSubtasks(p => [...p, { id: Date.now().toString(), title: '' }]);
  }
  function removeSubtask(id: string) {
    setSubtasks(p => p.filter(s => s.id !== id));
  }
  function updateSubtask(id: string, title: string) {
    setSubtasks(p => p.map(s => s.id === id ? { ...s, title } : s));
  }

  // ── Submit ─────────────────────────────────────────────────────────────────
  async function handleSubmit() {
    if (!title.trim()) { setSubmitError('El título es obligatorio.'); return; }
    setSubmitLoading(true);
    setSubmitError('');

    try {
      const valid = subtasks.filter(s => s.title.trim());
      const totalPts   = breakdown.total;
      const perSubtask = valid.length > 0
        ? Math.max(10, Math.round(totalPts / valid.length))
        : totalPts;

      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title:        title.trim(),
          description:  prompt.trim(),
          category,
          date,
          points_value: totalPts,
          subtasks: valid.map((s, i) => ({
            title:        s.title.trim(),
            points_value: perSubtask,
            order:        i,
          })),
        }),
      });

      if (!res.ok) throw new Error('Error al crear la tarea');
      onCreated();
      onClose();
    } catch (e: any) {
      setSubmitError(e.message ?? 'Error desconocido');
    } finally {
      setSubmitLoading(false);
    }
  }

  // ── Shared header ──────────────────────────────────────────────────────────
  const Header = ({ label, icon }: { label: string; icon: ReactNode }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: 'var(--accent-primary-soft)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {icon}
        </div>
        <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>{label}</h2>
      </div>
      <button className="btn btn-ghost" style={{ padding: '6px' }} onClick={onClose}>
        <X size={18} />
      </button>
    </div>
  );

  // ── Shared scoring section JSX (called as a function, not a component) ───────
  function renderScoringSection() {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <DifficultySelector
          selected={selectedPreset}
          onSelect={selectPreset}
          durationMin={durationMin}
          onDurationChange={handleDurationChange}
        />

        {/* Dependencies toggle */}
        <label style={{
          display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
          fontSize: 13, color: 'var(--text-secondary)',
        }}>
          <input
            type="checkbox"
            checked={hasDependencies}
            onChange={e => setHasDependencies(e.target.checked)}
            style={{ width: 14, height: 14, accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
          />
          <Link2 size={13} style={{ color: 'var(--text-muted)' }} />
          Tiene dependencias previas <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>+15%</span>
        </label>

        {/* Live breakdown */}
        <BreakdownCard
          durationMin={durationMin}
          effort={effort}
          category={category}
          numSubtasks={validSubtasks.length}
          hasDependencies={hasDependencies}
          isUrgent={isUrgent}
          isCritical={isCritical}
        />
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP: input
  // ═══════════════════════════════════════════════════════════════════════════
  if (step === 'input') {
    return (
      <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="modal-content" style={{ maxWidth: 480 }}>
          <Header label="Nueva tarea con IA" icon={<Sparkles size={16} style={{ color: 'var(--accent-primary)' }} />} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>
                ¿Qué necesitas hacer hoy?
              </label>
              <textarea
                ref={textareaRef}
                className="input"
                value={prompt}
                onChange={e => { setPrompt(e.target.value); setAiError(''); }}
                placeholder={`Ejemplos:\n• "Preparar presentación de ventas para el cliente de mañana"\n• "Ir al gym: piernas y cardio"\n• "Estudiar el capítulo 3 de React"`}
                rows={5}
                style={{ resize: 'none', lineHeight: 1.6 }}
                onKeyDown={e => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleAIBreakdown();
                }}
              />
              {aiError && (
                <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--accent-danger)' }}>{aiError}</p>
              )}
              <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
                ⌘ Enter para analizar
              </p>
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                Fecha
              </label>
              <input
                className="input"
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                style={{ colorScheme: 'dark' }}
              />
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ fontSize: 13, gap: 6 }}
                onClick={() => {
                  setStep('manual');
                  setTitle('');
                  setSubtasks([{ id: '1', title: '' }]);
                }}
              >
                <Pencil size={14} /> Manual
              </button>
              <button
                type="button"
                className="btn btn-primary"
                style={{ flex: 1, gap: 8, fontSize: 14 }}
                onClick={handleAIBreakdown}
                disabled={!prompt.trim()}
              >
                <Sparkles size={15} />
                Analizar con IA
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP: loading
  // ═══════════════════════════════════════════════════════════════════════════
  if (step === 'loading') {
    return (
      <div className="modal-overlay">
        <div className="modal-content" style={{ maxWidth: 380, textAlign: 'center' }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: 'var(--accent-primary-soft)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px',
            animation: 'pulse-glow 1.5s ease-in-out infinite',
          }}>
            <Sparkles size={26} style={{ color: 'var(--accent-primary)' }} />
          </div>
          <h3 style={{ margin: '0 0 8px', fontSize: 17, fontWeight: 700 }}>
            Analizando tu tarea{dots}
          </h3>
          <p style={{ margin: 0, fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6 }}>
            La IA está dividiendo tu tarea en pasos concretos y calculando los puntos que ganarás.
          </p>
          <div style={{ marginTop: 24, display: 'flex', justifyContent: 'center', gap: 6 }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{
                width: 8, height: 8, borderRadius: '50%',
                background: 'var(--accent-primary)', opacity: 0.3,
                animation: `bounce-check 0.8s ease-in-out ${i * 0.2}s infinite`,
              }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP: review
  // ═══════════════════════════════════════════════════════════════════════════
  if (step === 'review') {
    return (
      <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="modal-content" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
          <Header label="Revisa tu plan" icon={<Sparkles size={16} style={{ color: 'var(--accent-primary)' }} />} />

          {/* AI badge */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'var(--accent-primary-soft)', border: '1px solid var(--border-accent)',
            borderRadius: 10, padding: '8px 14px', marginBottom: 20, fontSize: 13,
          }}>
            <Sparkles size={14} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
            <span style={{ color: 'var(--text-secondary)' }}>
              Generado por IA · Puedes editar cualquier campo antes de crear.
            </span>
          </div>

          {submitError && (
            <div style={{ background: 'var(--accent-danger-soft)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 14, color: 'var(--accent-danger)' }}>
              {submitError}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Title */}
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                Título
              </label>
              <input className="input" value={title} onChange={e => setTitle(e.target.value)} style={{ fontWeight: 600 }} />
            </div>

            {/* Category + Date */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                  Categoría
                </label>
                <select className="input" value={category} onChange={e => setCategory(e.target.value)} style={{ cursor: 'pointer' }}>
                  {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                  Fecha
                </label>
                <input className="input" type="date" value={date} onChange={e => setDate(e.target.value)} style={{ colorScheme: 'dark' }} />
              </div>
            </div>

            {/* Scoring */}
            {renderScoringSection()}

            {/* Subtasks */}
            <SubtaskList
              subtasks={subtasks}
              onAdd={addSubtask}
              onRemove={removeSubtask}
              onUpdate={updateSubtask}
            />

            {/* Footer */}
            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 16, display: 'flex', gap: 10 }}>
              <button
                type="button" className="btn btn-ghost" style={{ gap: 6, fontSize: 13 }}
                onClick={() => { setStep('input'); setAiError(''); }} disabled={submitLoading}
              >
                <RotateCcw size={14} /> Reintentar
              </button>
              <div style={{ flex: 1 }} />
              <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitLoading}>
                Cancelar
              </button>
              <button type="button" className="btn btn-primary" onClick={handleSubmit} disabled={submitLoading} style={{ gap: 8 }}>
                {submitLoading
                  ? <><Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> Creando...</>
                  : '✓ Crear tarea'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP: manual
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'var(--bg-accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Pencil size={16} style={{ color: 'var(--text-secondary)' }} />
            </div>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>Nueva tarea manual</h2>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="btn btn-ghost"
              style={{ gap: 6, fontSize: 13, padding: '6px 10px' }}
              onClick={() => setStep('input')}
            >
              <Sparkles size={14} style={{ color: 'var(--accent-primary)' }} /> Usar IA
            </button>
            <button className="btn btn-ghost" style={{ padding: '6px' }} onClick={onClose}>
              <X size={18} />
            </button>
          </div>
        </div>

        {submitError && (
          <div style={{ background: 'var(--accent-danger-soft)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 14, color: 'var(--accent-danger)' }}>
            {submitError}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Title */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
              Título <span style={{ color: 'var(--accent-danger)' }}>*</span>
            </label>
            <input
              className="input" value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="¿Qué necesitas hacer?"
              autoFocus
            />
          </div>

          {/* Category + Date */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                Categoría
              </label>
              <select className="input" value={category} onChange={e => setCategory(e.target.value)} style={{ cursor: 'pointer' }}>
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                Fecha
              </label>
              <input className="input" type="date" value={date} onChange={e => setDate(e.target.value)} style={{ colorScheme: 'dark' }} />
            </div>
          </div>

          {/* Scoring */}
          <ScoringSection />

          {/* Subtasks */}
          <SubtaskList
            subtasks={subtasks}
            onAdd={addSubtask}
            onRemove={removeSubtask}
            onUpdate={updateSubtask}
          />

          {/* Footer */}
          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 16, display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitLoading}>
              Cancelar
            </button>
            <button type="button" className="btn btn-primary" onClick={handleSubmit} disabled={submitLoading} style={{ gap: 8 }}>
              {submitLoading
                ? <><Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> Creando...</>
                : '✓ Crear tarea'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
