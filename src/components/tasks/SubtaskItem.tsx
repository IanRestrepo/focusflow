import { useState, useRef } from 'react';
import { Check, Trash2 } from 'lucide-react';

interface SubtaskItemProps {
  subtask: {
    id: string;
    title: string;
    status: 'pending' | 'in_progress' | 'completed';
    points_value: number;
    order: number;
  };
  onToggle: (subtaskId: string, rect: DOMRect) => Promise<void>;
  onDelete?: (subtaskId: string) => void;
  isLast: boolean;
  lineFilledPct: number; // 0-100, how much of the line below this is filled
}

export default function SubtaskItem({ subtask, onToggle, onDelete, isLast, lineFilledPct }: SubtaskItemProps) {
  const [optimistic, setOptimistic] = useState(subtask.status === 'completed');
  const [loading, setLoading] = useState(false);
  const checkRef = useRef<HTMLDivElement>(null);

  const isCompleted = optimistic;

  async function handleToggle() {
    if (loading || isCompleted) return;
    setLoading(true);
    setOptimistic(true);

    const rect = checkRef.current?.getBoundingClientRect() ?? new DOMRect(0, 0, 0, 0);
    try {
      await onToggle(subtask.id, rect);
    } catch {
      setOptimistic(subtask.status === 'completed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: 'flex', gap: 12, position: 'relative' }}>
      {/* Timeline column */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 20, flexShrink: 0 }}>
        {/* Node */}
        <div
          ref={checkRef}
          className={`checkbox-custom${isCompleted ? ' checked' : ''}`}
          onClick={handleToggle}
          style={{
            cursor: isCompleted ? 'default' : 'pointer',
            width: 20,
            height: 20,
            borderRadius: 6,
            transition: 'all 0.2s',
            ...(isCompleted
              ? { background: 'var(--accent-success)', borderColor: 'var(--accent-success)' }
              : subtask.status === 'in_progress'
              ? { borderColor: 'var(--accent-progress)', boxShadow: '0 0 0 3px var(--accent-progress-soft)' }
              : {}),
          }}
          role="checkbox"
          aria-checked={isCompleted}
          tabIndex={0}
          onKeyDown={e => e.key === 'Enter' || e.key === ' ' ? handleToggle() : undefined}
        >
          {isCompleted && (
            <Check size={12} strokeWidth={3} style={{ color: '#000', animation: 'bounce-check 0.25s ease-out' }} />
          )}
        </div>

        {/* Line below */}
        {!isLast && (
          <div className="timeline-line" style={{ flex: 1, minHeight: 20, marginTop: 2 }}>
            <div
              className="timeline-line-fill"
              style={{ height: isCompleted ? '100%' : '0%' }}
            />
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{
        flex: 1,
        paddingBottom: isLast ? 0 : 16,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 8,
        minWidth: 0,
      }}>
        <span style={{
          fontSize: 14,
          color: isCompleted ? 'var(--text-muted)' : 'var(--text-primary)',
          textDecoration: isCompleted ? 'line-through' : 'none',
          transition: 'color 0.2s, text-decoration 0.3s',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {subtask.title}
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <span style={{
            fontSize: 12,
            fontFamily: 'JetBrains Mono, monospace',
            color: isCompleted ? 'var(--accent-success)' : 'var(--text-muted)',
            fontWeight: 600,
            transition: 'color 0.2s',
          }}>
            +{subtask.points_value}
          </span>

          {onDelete && !isCompleted && (
            <button
              onClick={() => onDelete(subtask.id)}
              className="btn btn-ghost"
              style={{ padding: '2px 4px', opacity: 0.5 }}
              title="Eliminar subtask"
            >
              <Trash2 size={12} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
