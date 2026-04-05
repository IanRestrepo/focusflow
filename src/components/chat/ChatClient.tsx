import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Sparkles, Repeat, CheckCircle, Trash2, ArrowUp } from 'lucide-react';
import { playSubtaskDing, playTaskComplete } from '@/lib/sounds';

const STORAGE_KEY = (userId: string) => `ff_chat_history_${userId}`;
const MAX_STORED_MESSAGES = 60; // keep last 60 messages to avoid storage bloat

interface Message {
  role: 'user' | 'assistant';
  content: string;
  createdTasks?: CreatedTask[];
  createdRewards?: CreatedReward[];
  timestamp: number;
}

interface CreatedReward {
  success: boolean;
  rewardId: string;
  title: string;
  cost: number;
  icon: string;
}

interface CreatedTask {
  success: boolean;
  taskId?: string;
  title: string;
  date: string;
  subtasksCreated: number;
  totalPoints: number;
  recurring?: boolean;
  templateId?: string;
}

interface ChatClientProps {
  userId: string;
  username: string;
  currentPoints: number;
  level: number;
  streakDays: number;
}

const SUGGESTIONS = [
  { icon: '📝', text: 'Crea una tarea para estudiar inglés hoy' },
  { icon: '🔁', text: 'Añade "Ir al gym" como rutina diaria' },
  { icon: '📅', text: 'Planifica mi semana de trabajo y salud' },
  { icon: '🎯', text: 'Crea una rutina matutina completa' },
  { icon: '🎁', text: 'Crea una recompensa: Netflix 1h por 1500 pts' },
  { icon: '🏆', text: '¿Qué recompensas tengo disponibles?' },
];

const CAT_LABELS: Record<string, string> = {
  work: '💼', personal: '🙋', health: '🏃', learning: '📚', other: '✨',
};

const WELCOME_MESSAGE = (username: string): Message => ({
  role: 'assistant',
  content: `¡Hola, ${username}! 👋 Soy **Flow**, tu asistente de productividad.\n\nPuedo ayudarte a:\n• 📝 Crear tareas y planificar tu día\n• 🔁 Configurar tareas repetitivas (cepillarse dientes, gym, etc.)\n• 📅 Organizar tu semana\n• 💬 Dar consejos sobre productividad con TDAH\n\n¿Por dónde empezamos?`,
  timestamp: Date.now(),
});

function loadHistory(userId: string, username: string): Message[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY(userId));
    if (!raw) return [WELCOME_MESSAGE(username)];
    const parsed: Message[] = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return [WELCOME_MESSAGE(username)];
    return parsed;
  } catch {
    return [WELCOME_MESSAGE(username)];
  }
}

function saveHistory(userId: string, messages: Message[]) {
  try {
    const toSave = messages.slice(-MAX_STORED_MESSAGES);
    localStorage.setItem(STORAGE_KEY(userId), JSON.stringify(toSave));
  } catch {}
}

// 'empty' = landing, 'leaving' = animating out, 'chat' = full chat
type ChatPhase = 'empty' | 'leaving' | 'chat';

export default function ChatClient({ userId, username, currentPoints, level, streakDays }: ChatClientProps) {
  const [messages, setMessages] = useState<Message[]>(() => loadHistory(userId, username));
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState<ChatPhase>(() =>
    loadHistory(userId, username).length > 1 ? 'chat' : 'empty'
  );
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Persist history whenever messages change (keyed by userId)
  useEffect(() => {
    saveHistory(userId, messages);
  }, [messages, userId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const clearHistory = useCallback(() => {
    const fresh = [WELCOME_MESSAGE(username)];
    setMessages(fresh);
    saveHistory(fresh);
    setPhase('empty');
  }, [username]);

  // Build message history for API (without our metadata)
  function buildHistory(): { role: 'user' | 'assistant'; content: string }[] {
    return messages.map(m => ({ role: m.role, content: m.content }));
  }

  async function send(text: string) {
    if (!text.trim() || loading) return;

    // Trigger leave animation if coming from empty state
    if (phase === 'empty') {
      setPhase('leaving');
      setTimeout(() => setPhase('chat'), 380);
    }

    const userMsg: Message = { role: 'user', content: text.trim(), timestamp: Date.now() };
    const history = [...buildHistory(), { role: 'user' as const, content: text.trim() }];
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error ?? 'Error de conexión');

      const assistantMsg: Message = {
        role: 'assistant',
        content: data.text || '...',
        createdTasks: data.createdTasks ?? [],
        createdRewards: data.createdRewards ?? [],
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, assistantMsg]);

      // Sounds & events
      if (data.createdTasks?.length > 0) {
        playTaskComplete();
        window.dispatchEvent(new CustomEvent('focusflow:tasks-refresh'));
      } else if (data.createdRewards?.length > 0) {
        playSubtaskDing();
        // Notify rewards page to refresh if open
        window.dispatchEvent(new CustomEvent('focusflow:rewards-refresh'));
      } else {
        playSubtaskDing();
      }
    } catch (e: any) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `❌ ${e.message ?? 'Algo salió mal. Intenta de nuevo.'}`,
        timestamp: Date.now(),
      }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  }

  /** Render markdown-lite: bold, line breaks */
  function renderText(text: string) {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      }
      return part.split('\n').map((line, j) => (
        <span key={`${i}-${j}`}>{line}{j < part.split('\n').length - 1 && <br />}</span>
      ));
    });
  }

  // ── INPUT BOX shared between both layouts ──
  const inputBox = (large = false) => (
    <div style={{
      background: 'var(--bg-secondary)',
      border: '1px solid var(--border-default)',
      borderRadius: large ? 18 : 14,
      padding: large ? '16px 16px 12px' : '10px 12px',
      display: 'flex', flexDirection: large ? 'column' : 'row',
      gap: large ? 12 : 10,
      alignItems: large ? 'stretch' : 'flex-end',
      boxShadow: large ? '0 4px 32px rgba(0,0,0,0.25)' : 'none',
      transition: 'border-color 0.2s, box-shadow 0.2s',
      width: '100%',
    }}>
      <textarea
        ref={inputRef}
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={large ? `¿En qué te puedo ayudar, ${username}?` : 'Escribe un mensaje… (Enter para enviar)'}
        rows={large ? 3 : 1}
        style={{
          flex: 1, background: 'transparent', border: 'none', outline: 'none',
          color: 'var(--text-primary)', fontSize: large ? 15 : 14, fontFamily: 'inherit',
          resize: 'none', lineHeight: 1.6,
          maxHeight: large ? 160 : 120, overflowY: 'auto',
          padding: '2px 0',
        }}
        onInput={e => {
          if (!large) {
            const el = e.currentTarget;
            el.style.height = 'auto';
            el.style.height = Math.min(el.scrollHeight, 120) + 'px';
          }
        }}
        disabled={loading}
      />
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8 }}>
        {large && (
          <span style={{ fontSize: 12, color: 'var(--text-muted)', flex: 1 }}>
            Enter para enviar · Shift+Enter nueva línea
          </span>
        )}
        <button
          onClick={() => send(input)}
          disabled={!input.trim() || loading}
          style={{
            width: large ? 40 : 36, height: large ? 40 : 36,
            borderRadius: large ? 12 : 10,
            border: 'none', cursor: 'pointer',
            background: input.trim() && !loading ? 'var(--accent-primary)' : 'var(--bg-accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, transition: 'background 0.15s, transform 0.1s',
          }}
          onMouseDown={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(0.92)'; }}
          onMouseUp={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
        >
          {large
            ? <ArrowUp size={17} style={{ color: input.trim() && !loading ? '#000' : 'var(--text-muted)' }} />
            : <Send   size={15} style={{ color: input.trim() && !loading ? '#000' : 'var(--text-muted)' }} />
          }
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, padding: '16px 24px 0', maxWidth: 900, width: '100%', margin: '0 auto' }}>
      <style>{`
        @keyframes chat-empty-out {
          0%   { opacity: 1; transform: translateY(0) scale(1); }
          100% { opacity: 0; transform: translateY(-32px) scale(0.97); }
        }
        @keyframes chat-in {
          0%   { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes chat-msg-in {
          0%   { opacity: 0; transform: translateY(16px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* ═══════════════════════════════════════════════════
          EMPTY STATE — bolt.new style
      ═══════════════════════════════════════════════════ */}
      {phase !== 'chat' ? (
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '0 0 40px',
          gap: 0,
          animation: phase === 'leaving'
            ? 'chat-empty-out 0.35s cubic-bezier(0.4,0,1,1) forwards'
            : 'none',
          pointerEvents: phase === 'leaving' ? 'none' : 'auto',
        }}>
          {/* Icon */}
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'var(--accent-primary-soft)',
            border: '1.5px solid var(--border-accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 24,
            boxShadow: '0 0 40px var(--accent-primary-glow)',
          }}>
            <Sparkles size={28} style={{ color: 'var(--accent-primary)' }} />
          </div>

          {/* Heading */}
          <h1 style={{
            margin: '0 0 8px', fontSize: 32, fontWeight: 800,
            color: 'var(--text-primary)', letterSpacing: '-0.03em',
            textAlign: 'center', lineHeight: 1.15,
          }}>
            ¿En qué te puedo ayudar?
          </h1>
          <p style={{
            margin: '0 0 36px', fontSize: 15,
            color: 'var(--text-muted)', textAlign: 'center',
          }}>
            Crea tareas, planifica tu semana o configura rutinas
          </p>

          {/* Big input */}
          <div style={{ width: '100%', maxWidth: 640, marginBottom: 20 }}>
            {inputBox(true)}
          </div>

          {/* Suggestion chips */}
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: 8,
            justifyContent: 'center', maxWidth: 640,
          }}>
            {SUGGESTIONS.map((s, i) => (
              <button
                key={i}
                onClick={() => send(s.text)}
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 20, padding: '7px 14px',
                  fontSize: 13, fontWeight: 500,
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6,
                  transition: 'border-color 0.15s, color 0.15s, background 0.15s',
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.borderColor = 'var(--border-accent)';
                  el.style.color = 'var(--accent-primary)';
                  el.style.background = 'var(--accent-primary-soft)';
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.borderColor = 'var(--border-default)';
                  el.style.color = 'var(--text-secondary)';
                  el.style.background = 'var(--bg-secondary)';
                }}
              >
                <span>{s.icon}</span> {s.text}
              </button>
            ))}
          </div>
        </div>
      ) : (
      /* ═══════════════════════════════════════════════════
         ACTIVE CHAT
      ═══════════════════════════════════════════════════ */
      <>
        {/* Top bar with clear button */}
        <div style={{
          display: 'flex', justifyContent: 'flex-end', marginBottom: 8, flexShrink: 0,
          animation: 'chat-in 0.4s ease both',
        }}>
          <button
            onClick={clearHistory}
            className="btn btn-ghost"
            style={{ fontSize: 12, color: 'var(--text-muted)', gap: 4, padding: '4px 8px', display: 'flex', alignItems: 'center' }}
            title="Nueva conversación"
          >
            <Trash2 size={12} /> Nueva conversación
          </button>
        </div>

        {/* Messages area */}
        <div style={{
          flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16,
          paddingRight: 4, marginBottom: 12,
          animation: 'chat-in 0.45s ease both',
        }}>
          {messages.map((msg, i) => (
          <div key={i} style={{
            animation: `chat-msg-in 0.3s ease ${Math.min(i * 0.05, 0.2)}s both`,
            display: 'flex',
            flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
            gap: 10, alignItems: 'flex-start',
          }}>
            {/* Avatar */}
            <div style={{
              width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: msg.role === 'assistant' ? 'var(--accent-primary-soft)' : 'var(--bg-accent)',
              border: `1px solid ${msg.role === 'assistant' ? 'var(--border-accent)' : 'var(--border-subtle)'}`,
            }}>
              {msg.role === 'assistant'
                ? <Sparkles size={14} style={{ color: 'var(--accent-primary)' }} />
                : <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)' }}>{username[0].toUpperCase()}</span>
              }
            </div>

            {/* Bubble */}
            <div style={{ maxWidth: '78%', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{
                background: msg.role === 'user' ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                color: msg.role === 'user' ? '#000' : 'var(--text-primary)',
                border: msg.role === 'assistant' ? '1px solid var(--border-subtle)' : 'none',
                borderRadius: msg.role === 'user' ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                padding: '10px 14px',
                fontSize: 14, lineHeight: 1.6,
              }}>
                {renderText(msg.content)}
              </div>

              {/* Created tasks cards */}
              {msg.createdTasks && msg.createdTasks.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {msg.createdTasks.map((task, ti) => (
                    <div key={ti} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      background: 'var(--accent-success-soft)',
                      border: '1px solid rgba(34,197,94,0.3)',
                      borderRadius: 10, padding: '8px 12px',
                    }}>
                      {task.recurring
                        ? <Repeat size={14} style={{ color: 'var(--accent-success)', flexShrink: 0 }} />
                        : <CheckCircle size={14} style={{ color: 'var(--accent-success)', flexShrink: 0 }} />
                      }
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {task.recurring ? '🔁 ' : '✅ '}{task.title}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          {task.recurring
                            ? `Tarea repetitiva · ${task.subtasksCreated} pasos`
                            : `${task.date} · ${task.subtasksCreated} pasos · +${task.totalPoints} pts`
                          }
                        </div>
                      </div>
                      {task.recurring && (
                        <a
                          href="/recurring"
                          style={{
                            fontSize: 11, fontWeight: 600, color: 'var(--accent-primary)',
                            textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0,
                            padding: '3px 8px', borderRadius: 6,
                            border: '1px solid var(--border-accent)',
                            background: 'var(--accent-primary-soft)',
                          }}
                        >
                          Ver →
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Created rewards cards */}
              {msg.createdRewards && msg.createdRewards.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {msg.createdRewards.map((reward, ri) => (
                    <div key={ri} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      background: 'var(--accent-primary-soft)',
                      border: '1px solid var(--border-accent)',
                      borderRadius: 10, padding: '8px 12px',
                    }}>
                      <span style={{ fontSize: 18, flexShrink: 0 }}>{reward.icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          🎁 {reward.title}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
                          {reward.cost.toLocaleString('es-ES')} pts
                        </div>
                      </div>
                      <a
                        href="/rewards"
                        style={{
                          fontSize: 11, fontWeight: 600, color: 'var(--accent-primary)',
                          textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0,
                          padding: '3px 8px', borderRadius: 6,
                          border: '1px solid var(--border-accent)',
                          background: 'var(--accent-primary-soft)',
                        }}
                      >
                        Ver →
                      </a>
                    </div>
                  ))}
                </div>
              )}

              <span style={{ fontSize: 10, color: 'var(--text-muted)', alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                {new Date(msg.timestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {loading && (
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'var(--accent-primary-soft)', border: '1px solid var(--border-accent)',
              animation: 'pulse-glow 1.2s ease-in-out infinite',
            }}>
              <Sparkles size={14} style={{ color: 'var(--accent-primary)' }} />
            </div>
            <div style={{
              background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)',
              borderRadius: '4px 16px 16px 16px', padding: '12px 16px',
              display: 'flex', gap: 5, alignItems: 'center',
            }}>
              {[0,1,2].map(i => (
                <div key={i} style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: 'var(--accent-primary)', opacity: 0.6,
                  animation: `bounce-check 0.9s ease-in-out ${i * 0.2}s infinite`,
                }} />
              ))}
            </div>
          </div>
        )}
          <div ref={bottomRef} />
        </div>

        {/* Input compacto para chat activo */}
        <div style={{ animation: 'chat-in 0.5s ease both', flexShrink: 0 }}>
          {inputBox(false)}
          <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-muted)', margin: '8px 0 12px' }}>
            Flow puede cometer errores. Revisa las tareas creadas.
          </p>
        </div>
      </>
      )}
    </div>
  );
}
