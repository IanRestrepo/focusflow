import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import TaskCard from './TaskCard';
import CreateTaskModal from './CreateTaskModal';
import EmptyDayState from './EmptyDayState';
import PointsAnimationLayer from '@/components/shared/PointsAnimation';
import LevelUpOverlay from '@/components/shared/LevelUpOverlay';
import StreakOverlay from '@/components/shared/StreakOverlay';
import BadgeUnlockOverlay from '@/components/shared/BadgeUnlockOverlay';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed';
  points_value: number;
  category: string;
  date: string;
  subtasks: any[];
}

interface DayTaskListProps {
  initialTasks: Task[];
  date: string;
}

export default function DayTaskList({ initialTasks, date }: DayTaskListProps) {
  const [tasks, setTasks] = useState(initialTasks);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Notify StatsBar whenever task count changes
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('focusflow:tasks-update', {
      detail: { total: tasks.length },
    }));
  }, [tasks.length]);

  async function refreshTasks() {
    try {
      const res = await fetch(`/api/tasks?date=${date}`);
      const data = await res.json();
      setTasks(data);
    } catch {}
  }

  return (
    <>
      {/* Tasks list */}
      {tasks.length === 0 ? (
        <EmptyDayState onCreateTask={() => setShowCreateModal(true)} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {tasks
            .sort((a, b) => (a.status === 'completed' ? 1 : 0) - (b.status === 'completed' ? 1 : 0))
            .map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onTaskUpdate={refreshTasks}
              />
            ))}
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => setShowCreateModal(true)}
        style={{
          position: 'fixed',
          bottom: 32,
          right: 32,
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: 'var(--accent-primary)',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 24px var(--accent-primary-glow)',
          transition: 'transform 0.15s, box-shadow 0.15s',
          zIndex: 30,
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.transform = 'scale(1.08)';
          (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 32px var(--accent-primary-glow)';
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
          (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 24px var(--accent-primary-glow)';
        }}
        aria-label="Crear nueva tarea"
      >
        <Plus size={24} style={{ color: '#000' }} strokeWidth={2.5} />
      </button>

      {/* Create modal */}
      {showCreateModal && (
        <CreateTaskModal
          defaultDate={date}
          onClose={() => setShowCreateModal(false)}
          onCreated={refreshTasks}
        />
      )}

      {/* Global animations */}
      <PointsAnimationLayer />
      <LevelUpOverlay />
      <StreakOverlay />
      <BadgeUnlockOverlay />
    </>
  );
}
