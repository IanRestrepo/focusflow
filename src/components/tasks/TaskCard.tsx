import { useState } from 'react';
import { ChevronDown, ChevronRight, Plus, MoreHorizontal, ArrowRight, Trash2 } from 'lucide-react';
import SubtaskItem from './SubtaskItem';
import TaskProgressBar from './TaskProgressBar';
import { triggerPointsAnimation } from '@/components/shared/PointsAnimation';
import { categoryLabel } from '@/lib/utils';
import { playSubtaskDing, playTaskComplete, playLevelUp } from '@/lib/sounds';

interface Subtask {
  id: string;
  title: string;
  status: 'pending' | 'in_progress' | 'completed';
  points_value: number;
  order: number;
}

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed';
  points_value: number;
  category: string;
  date: string;
  subtasks: Subtask[];
}

interface TaskCardProps {
  task: Task;
  onTaskUpdate?: () => void;
}

const CATEGORY_CLASSES: Record<string, string> = {
  work: 'tag-work',
  personal: 'tag-personal',
  health: 'tag-health',
  learning: 'tag-learning',
  other: 'tag-other',
};

export default function TaskCard({ task: initialTask, onTaskUpdate }: TaskCardProps) {
  const [task, setTask] = useState(initialTask);
  const [expanded, setExpanded] = useState(true);
  const [newSubtask, setNewSubtask] = useState('');
  const [addingSubtask, setAddingSubtask] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [celebrating, setCelebrating] = useState(false);

  const completedSubtasks = task.subtasks.filter(s => s.status === 'completed');
  const totalSubtaskPts = task.subtasks.reduce((s, st) => s + st.points_value, 0);
  const earnedPts = completedSubtasks.reduce((s, st) => s + st.points_value, 0);
  const isTaskComplete = task.subtasks.length > 0 && completedSubtasks.length === task.subtasks.length;

  async function handleToggleSubtask(subtaskId: string, rect: DOMRect) {
    // Optimistic update
    const updatedSubtasks = task.subtasks.map(st =>
      st.id === subtaskId ? { ...st, status: 'completed' as const } : st
    );
    setTask(t => ({ ...t, subtasks: updatedSubtasks }));

    // Animate points
    const subtask = task.subtasks.find(s => s.id === subtaskId);
    if (subtask && rect) {
      triggerPointsAnimation(rect.left, rect.top, subtask.points_value);
    }

    // Sound: subtask ding
    playSubtaskDing();

    try {
      const res = await fetch(`/api/subtasks/${subtaskId}/complete`, { method: 'POST' });
      const data = await res.json();

      if (data.alreadyDone) return;

      // ── Update the global StatsBar ──────────────────────────────────────
      const totalEarned = (data.earned ?? 0) + (data.bonusPoints ?? 0);
      window.dispatchEvent(new CustomEvent('focusflow:stats-delta', {
        detail: {
          earnedPoints: totalEarned,
          taskCompleted: !!data.taskCompleted,
          newLevel: data.levelUp ? data.newLevel : undefined,
        },
      }));

      // Also update sidebar points counter
      window.dispatchEvent(new CustomEvent('focusflow:points-earned', {
        detail: { points: totalEarned },
      }));

      if (data.taskCompleted) {
        // Delay task-complete sound slightly after the subtask ding
        setTimeout(() => playTaskComplete(), 120);

        setCelebrating(true);
        setTimeout(() => {
          setCelebrating(false);
          (window as any).showToast?.(`¡Tarea completada! +${data.bonusPoints} pts extra 🎉`, 'success');
        }, 300);

        setTask(t => ({ ...t, status: 'completed' }));
      }

      if (data.levelUp) {
        setTimeout(() => playLevelUp(), 400);
        window.dispatchEvent(new CustomEvent('level-up', { detail: { newLevel: data.newLevel } }));
      }

      if (data.streakDays) {
        window.dispatchEvent(new CustomEvent('focusflow:streak-update', {
          detail: { streakDays: data.streakDays },
        }));
      }

      if (data.streakIncremented) {
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('focusflow:streak-day', {
            detail: { streakDays: data.streakDays },
          }));
        }, data.taskCompleted ? 800 : 400);
      }

      onTaskUpdate?.();
    } catch {
      // Revert on error
      setTask(t => ({ ...t, subtasks: initialTask.subtasks }));
    }
  }

  async function handleAddSubtask() {
    if (!newSubtask.trim()) return;

    try {
      const res = await fetch(`/api/tasks/${task.id}/subtasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newSubtask.trim(), points_value: 10 }),
      });
      const data = await res.json();

      setTask(t => ({
        ...t,
        subtasks: [...t.subtasks, { ...data, status: 'pending' }],
      }));
      setNewSubtask('');
      setAddingSubtask(false);
    } catch {}
  }

  async function handleDeleteSubtask(subtaskId: string) {
    await fetch(`/api/subtasks/${subtaskId}`, { method: 'DELETE' });
    setTask(t => ({ ...t, subtasks: t.subtasks.filter(s => s.id !== subtaskId) }));
  }

  async function handleDeleteTask() {
    await fetch(`/api/tasks/${task.id}`, { method: 'DELETE' });
    onTaskUpdate?.();
  }

  async function handleReschedule() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const date = tomorrow.toISOString().split('T')[0];
    await fetch(`/api/tasks/${task.id}/reschedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date }),
    });
    onTaskUpdate?.();
    setShowMenu(false);
  }

  return (
    <div
      className={`card card-hover${celebrating ? ' animate-pulse-glow' : ''}`}
      style={{
        border: isTaskComplete
          ? '1px solid rgba(34,197,94,0.3)'
          : celebrating
          ? '1px solid var(--border-accent)'
          : '1px solid var(--border-subtle)',
        transition: 'border-color 0.3s, box-shadow 0.3s',
        position: 'relative',
        overflow: 'visible',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
        onClick={() => setExpanded(e => !e)}>

        {/* Status icon */}
        <div style={{
          width: 22,
          height: 22,
          borderRadius: '50%',
          border: `2px solid ${isTaskComplete ? 'var(--accent-success)' : 'var(--border-default)'}`,
          background: isTaskComplete ? 'var(--accent-success-soft)' : 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          transition: 'all 0.3s',
        }}>
          {isTaskComplete && (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 6l3 3 5-5" stroke="var(--accent-success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>

        <span style={{
          flex: 1,
          fontSize: 15,
          fontWeight: 600,
          color: isTaskComplete ? 'var(--text-muted)' : 'var(--text-primary)',
          textDecoration: isTaskComplete ? 'line-through' : 'none',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          transition: 'color 0.2s',
        }}>
          {task.title}
        </span>

        {/* Category tag */}
        <span className={`tag ${CATEGORY_CLASSES[task.category] ?? 'tag-other'}`}>
          {categoryLabel(task.category)}
        </span>

        {/* Points */}
        <span style={{ fontSize: 12, fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-muted)', flexShrink: 0 }}>
          {task.points_value} pts
        </span>

        {/* Expand chevron */}
        <div style={{ color: 'var(--text-muted)', flexShrink: 0 }}>
          {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </div>

        {/* Menu */}
        <div style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
          <button
            className="btn btn-ghost"
            style={{ padding: '4px', borderRadius: 6 }}
            onClick={() => setShowMenu(m => !m)}
          >
            <MoreHorizontal size={16} style={{ color: 'var(--text-muted)' }} />
          </button>

          {showMenu && (
            <div style={{
              position: 'absolute',
              right: 0,
              top: '100%',
              marginTop: 4,
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-default)',
              borderRadius: 10,
              padding: 6,
              zIndex: 20,
              minWidth: 180,
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            }}>
              <button
                className="btn btn-ghost"
                style={{ width: '100%', justifyContent: 'flex-start', gap: 8, padding: '8px 10px', fontSize: 13 }}
                onClick={handleReschedule}
              >
                <ArrowRight size={14} /> Mover a mañana
              </button>
              <button
                className="btn btn-danger"
                style={{ width: '100%', justifyContent: 'flex-start', gap: 8, padding: '8px 10px', fontSize: 13, marginTop: 4 }}
                onClick={handleDeleteTask}
              >
                <Trash2 size={14} /> Eliminar tarea
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div style={{ marginTop: 16 }}>
          {/* Subtasks */}
          {task.subtasks.length === 0 ? (
            <div style={{
              background: 'var(--accent-primary-soft)',
              border: '1px dashed var(--border-accent)',
              borderRadius: 8,
              padding: '12px 16px',
              fontSize: 13,
              color: 'var(--text-secondary)',
              marginBottom: 12,
            }}>
              💡 Dividir esta tarea en pasos más pequeños puede ayudarte a avanzar.
            </div>
          ) : (
            <div style={{ paddingLeft: 4 }}>
              {task.subtasks
                .sort((a, b) => a.order - b.order)
                .map((subtask, idx) => (
                  <SubtaskItem
                    key={subtask.id}
                    subtask={subtask}
                    onToggle={handleToggleSubtask}
                    onDelete={handleDeleteSubtask}
                    isLast={idx === task.subtasks.length - 1}
                    lineFilledPct={subtask.status === 'completed' ? 100 : 0}
                  />
                ))}
            </div>
          )}

          {/* Add subtask */}
          {addingSubtask ? (
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <input
                className="input"
                value={newSubtask}
                onChange={e => setNewSubtask(e.target.value)}
                placeholder="Descripción del paso..."
                style={{ flex: 1, fontSize: 13, padding: '8px 12px' }}
                autoFocus
                onKeyDown={e => {
                  if (e.key === 'Enter') handleAddSubtask();
                  if (e.key === 'Escape') { setAddingSubtask(false); setNewSubtask(''); }
                }}
              />
              <button className="btn btn-primary" style={{ padding: '8px 14px', fontSize: 13 }} onClick={handleAddSubtask}>
                Agregar
              </button>
              <button className="btn btn-secondary" style={{ padding: '8px 12px', fontSize: 13 }}
                onClick={() => { setAddingSubtask(false); setNewSubtask(''); }}>
                ✕
              </button>
            </div>
          ) : (
            <button
              className="btn btn-ghost"
              style={{ marginTop: 8, fontSize: 13, color: 'var(--text-muted)', padding: '6px 8px', gap: 6 }}
              onClick={() => setAddingSubtask(true)}
            >
              <Plus size={14} /> Agregar paso
            </button>
          )}

          {/* Progress bar */}
          {task.subtasks.length > 0 && (
            <TaskProgressBar
              completed={completedSubtasks.length}
              total={task.subtasks.length}
              earnedPoints={earnedPts}
              totalPoints={totalSubtaskPts}
            />
          )}
        </div>
      )}
    </div>
  );
}
