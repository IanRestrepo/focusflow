import { useState } from 'react';
import { Shield, Trash2, AlertTriangle, Palette, Droplets, Eye, EyeOff } from 'lucide-react';

interface SettingsClientProps {
  username: string;
  userId: string;
  isPublic: boolean;
}

// ── Themes ────────────────────────────────────────────────────────────────────

const THEMES = [
  { id: 'obsidian', label: 'Obsidiana',    bg: '#0a0a0b', secondary: '#111113', text: '#f0f0f2', emoji: '🌑' },
  { id: 'midnight', label: 'Medianoche',   bg: '#070b12', secondary: '#0c1220', text: '#e8eaf6', emoji: '🌊' },
  { id: 'slate',    label: 'Pizarra',      bg: '#0b0c10', secondary: '#12141a', text: '#e4e6f0', emoji: '🪨' },
  { id: 'forest',   label: 'Bosque',       bg: '#070e09', secondary: '#0d160f', text: '#e2ede4', emoji: '🌿' },
  { id: 'dusk',     label: 'Crepúsculo',   bg: '#09070f', secondary: '#110e1c', text: '#ece8f8', emoji: '🌆' },
  { id: 'amoled',   label: 'AMOLED',       bg: '#000000', secondary: '#080808', text: '#f0f0f2', emoji: '⚫' },
  { id: 'light',    label: 'Claro',        bg: '#f0f2f5', secondary: '#ffffff', text: '#111113', emoji: '☀️' },
  { id: 'polar',    label: 'Polar',        bg: '#eef1f7', secondary: '#f8faff', text: '#0f1320', emoji: '❄️' },
];

// ── Accents ───────────────────────────────────────────────────────────────────

const ACCENTS = [
  { id: 'amber',  label: 'Ámbar',     color: '#f59e0b' },
  { id: 'orange', label: 'Naranja',   color: '#f97316' },
  { id: 'red',    label: 'Rojo',      color: '#f43f5e' },
  { id: 'rose',   label: 'Rosa',      color: '#fb7185' },
  { id: 'pink',   label: 'Fucsia',    color: '#ec4899' },
  { id: 'purple', label: 'Púrpura',   color: '#8b5cf6' },
  { id: 'blue',   label: 'Azul',      color: '#3b82f6' },
  { id: 'cyan',   label: 'Cian',      color: '#06b6d4' },
  { id: 'green',  label: 'Verde',     color: '#22c55e' },
];

function applyTheme(themeId: string) {
  const html = document.documentElement;
  if (themeId === 'obsidian') {
    html.removeAttribute('data-theme');
  } else {
    html.setAttribute('data-theme', themeId);
  }
  try { localStorage.setItem('ff_theme', themeId); } catch {}
}

function applyAccent(accentId: string) {
  const html = document.documentElement;
  if (accentId === 'amber') {
    html.removeAttribute('data-accent');
  } else {
    html.setAttribute('data-accent', accentId);
  }
  try { localStorage.setItem('ff_accent', accentId); } catch {}
}

export default function SettingsClient({ username, userId, isPublic: initialIsPublic }: SettingsClientProps) {
  const [soundEnabled, setSoundEnabled] = useState(() => {
    try { return localStorage.getItem('ff_sound') !== 'off'; } catch { return true; }
  });

  const [activeTheme, setActiveTheme] = useState(() => {
    try { return localStorage.getItem('ff_theme') ?? 'obsidian'; } catch { return 'obsidian'; }
  });

  const [activeAccent, setActiveAccent] = useState(() => {
    try { return localStorage.getItem('ff_accent') ?? 'amber'; } catch { return 'amber'; }
  });
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMsg, setPwMsg] = useState('');
  const [resetConfirm, setResetConfirm] = useState(false);

  function handleThemeChange(id: string) {
    setActiveTheme(id);
    applyTheme(id);
  }

  function handleAccentChange(id: string) {
    setActiveAccent(id);
    applyAccent(id);
  }

  function toggleSound() {
    const next = !soundEnabled;
    setSoundEnabled(next);
    try { localStorage.setItem('ff_sound', next ? 'on' : 'off'); } catch {}
    (window as any).showToast?.(next ? '🔊 Sonidos activados' : '🔇 Sonidos desactivados', 'info');
  }

  async function handleVisibilityToggle() {
    const next = !isPublic;
    setIsPublic(next);
    try {
      await fetch('/api/settings/visibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_public: next }),
      });
      (window as any).showToast?.(next ? '👁️ Perfil visible en la comunidad' : '🙈 Perfil oculto', 'info');
    } catch {
      setIsPublic(!next);
    }
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) { setPwMsg('Las contraseñas no coinciden.'); return; }
    if (newPassword.length < 8) { setPwMsg('Mínimo 8 caracteres.'); return; }
    setPwLoading(true);
    setPwMsg('');
    try {
      const res = await fetch('/api/settings/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword, passwordConfirm: confirmPassword }),
      });
      if (!res.ok) throw new Error('Error');
      setPwMsg('✓ Contraseña actualizada');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      setPwMsg('Error al actualizar contraseña.');
    } finally {
      setPwLoading(false);
    }
  }

  async function handleResetData() {
    if (!resetConfirm) { setResetConfirm(true); return; }
    await fetch('/api/settings/reset', { method: 'POST' });
    (window as any).showToast?.('Datos eliminados. Recargando...', 'info');
    setTimeout(() => window.location.reload(), 1500);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 600 }}>

      {/* ── Tema ── */}
      <div className="card">
        <h3 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Palette size={15} /> Tema
        </h3>
        <p style={{ margin: '0 0 20px', fontSize: 13, color: 'var(--text-muted)' }}>
          Elige el aspecto visual de la aplicación.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 10 }}>
          {THEMES.map(theme => {
            const isActive = activeTheme === theme.id;
            return (
              <button
                key={theme.id}
                onClick={() => handleThemeChange(theme.id)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  borderRadius: 12,
                  outline: isActive ? `2px solid var(--accent-primary)` : '2px solid transparent',
                  outlineOffset: 2,
                  transition: 'outline-color 0.15s, transform 0.1s',
                  transform: isActive ? 'scale(1.03)' : 'scale(1)',
                }}
              >
                {/* Preview card */}
                <div style={{
                  borderRadius: 10,
                  overflow: 'hidden',
                  border: `1px solid ${isActive ? 'var(--accent-primary)' : 'rgba(255,255,255,0.08)'}`,
                }}>
                  {/* Mini window */}
                  <div style={{ background: theme.bg, padding: '10px 10px 6px' }}>
                    {/* Fake sidebar strip */}
                    <div style={{ display: 'flex', gap: 6 }}>
                      <div style={{
                        width: 20, borderRadius: 4,
                        background: theme.secondary,
                        display: 'flex', flexDirection: 'column', gap: 3, padding: '4px 3px',
                      }}>
                        {[1,2,3].map(i => (
                          <div key={i} style={{ height: 3, borderRadius: 2, background: i === 1 ? 'var(--accent-primary)' : theme.text + '30' }} />
                        ))}
                      </div>
                      {/* Fake content */}
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <div style={{ height: 5, borderRadius: 2, background: theme.text + '50', width: '70%' }} />
                        <div style={{ height: 3, borderRadius: 2, background: theme.text + '25', width: '90%' }} />
                        <div style={{ height: 3, borderRadius: 2, background: theme.text + '25', width: '60%' }} />
                        <div style={{ height: 8, borderRadius: 4, background: theme.secondary, marginTop: 2 }} />
                      </div>
                    </div>
                  </div>
                  {/* Label */}
                  <div style={{
                    background: isActive ? 'var(--accent-primary-soft)' : 'var(--bg-tertiary)',
                    padding: '6px 8px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                  }}>
                    <span style={{ fontSize: 11 }}>{theme.emoji}</span>
                    <span style={{
                      fontSize: 11, fontWeight: 600,
                      color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    }}>
                      {theme.label}
                    </span>
                    {isActive && <span style={{ fontSize: 9, color: 'var(--accent-primary)' }}>✓</span>}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Acento ── */}
      <div className="card">
        <h3 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Droplets size={15} /> Color de acento
        </h3>
        <p style={{ margin: '0 0 20px', fontSize: 13, color: 'var(--text-muted)' }}>
          El color principal para botones, logros y elementos destacados.
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {ACCENTS.map(accent => {
            const isActive = activeAccent === accent.id;
            return (
              <button
                key={accent.id}
                onClick={() => handleAccentChange(accent.id)}
                title={accent.label}
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 5,
                }}
              >
                <div style={{
                  width: 38,
                  height: 38,
                  borderRadius: '50%',
                  background: accent.color,
                  boxShadow: isActive
                    ? `0 0 0 3px var(--bg-secondary), 0 0 0 5px ${accent.color}, 0 0 16px ${accent.color}80`
                    : `0 0 0 2px var(--bg-secondary), 0 0 0 3px ${accent.color}50`,
                  transition: 'box-shadow 0.2s, transform 0.15s',
                  transform: isActive ? 'scale(1.15)' : 'scale(1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {isActive && (
                    <span style={{ fontSize: 14, color: '#fff', fontWeight: 700, textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>✓</span>
                  )}
                </div>
                <span style={{
                  fontSize: 10, fontWeight: isActive ? 700 : 500,
                  color: isActive ? accent.color : 'var(--text-muted)',
                  transition: 'color 0.15s',
                }}>
                  {accent.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Sounds */}
      <div className="card">
        <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600 }}>Sonidos</h3>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ margin: 0, fontSize: 14, color: 'var(--text-primary)' }}>Efectos de sonido</p>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
              Sonidos al completar tareas, canjear premios y subir de nivel.
            </p>
          </div>
          <button
            onClick={toggleSound}
            style={{
              width: 48,
              height: 28,
              borderRadius: 14,
              background: soundEnabled ? 'var(--accent-primary)' : 'var(--bg-accent)',
              border: 'none',
              cursor: 'pointer',
              position: 'relative',
              transition: 'background 0.25s',
            }}
          >
            <div style={{
              position: 'absolute',
              top: 4,
              left: soundEnabled ? 24 : 4,
              width: 20,
              height: 20,
              borderRadius: '50%',
              background: '#fff',
              transition: 'left 0.25s',
            }} />
          </button>
        </div>
      </div>

      {/* Visibility */}
      <div className="card">
        <h3 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
          {isPublic ? <Eye size={15} /> : <EyeOff size={15} />}
          Visibilidad en comunidad
        </h3>
        <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--text-muted)' }}>
          Controla si apareces en el ranking y otros usuarios pueden ver tu progreso.
        </p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ margin: 0, fontSize: 14, color: 'var(--text-primary)' }}>
              {isPublic ? 'Perfil público' : 'Perfil oculto'}
            </p>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
              {isPublic
                ? 'Tu racha, nivel y logros son visibles para otros.'
                : 'No apareces en el ranking de la comunidad.'}
            </p>
          </div>
          <button
            onClick={handleVisibilityToggle}
            style={{
              width: 48, height: 28, borderRadius: 14, border: 'none', cursor: 'pointer',
              background: isPublic ? 'var(--accent-primary)' : 'var(--bg-accent)',
              position: 'relative', transition: 'background 0.25s', flexShrink: 0,
            }}
          >
            <div style={{
              position: 'absolute', top: 4, left: isPublic ? 24 : 4,
              width: 20, height: 20, borderRadius: '50%', background: '#fff',
              transition: 'left 0.25s',
            }} />
          </button>
        </div>
      </div>

      {/* Account */}
      <div className="card">
        <h3 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 600 }}>
          <Shield size={15} style={{ display: 'inline', marginRight: 6 }} />
          Cuenta
        </h3>
        <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--text-muted)' }}>@{username}</p>

        <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
              Nueva contraseña
            </label>
            <input
              className="input"
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
            />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
              Confirmar contraseña
            </label>
            <input
              className="input"
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
            />
          </div>

          {pwMsg && (
            <p style={{ margin: 0, fontSize: 13, color: pwMsg.startsWith('✓') ? 'var(--accent-success)' : 'var(--accent-danger)' }}>
              {pwMsg}
            </p>
          )}

          <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }} disabled={pwLoading}>
            {pwLoading ? 'Guardando...' : 'Cambiar contraseña'}
          </button>
        </form>
      </div>

      {/* Danger zone */}
      <div className="card" style={{ border: '1px solid rgba(239,68,68,0.2)' }}>
        <h3 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 600, color: 'var(--accent-danger)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <AlertTriangle size={15} /> Zona de peligro
        </h3>
        <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--text-muted)' }}>
          Elimina todas tus tareas, puntos y progreso. Esta acción es irreversible.
        </p>

        {resetConfirm ? (
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--accent-danger)', flex: 1 }}>
              ⚠️ ¿Estás seguro? Se eliminarán todos tus datos.
            </p>
            <button className="btn btn-danger" onClick={handleResetData}>
              <Trash2 size={14} /> Confirmar eliminación
            </button>
            <button className="btn btn-secondary" onClick={() => setResetConfirm(false)}>
              Cancelar
            </button>
          </div>
        ) : (
          <button className="btn btn-danger" style={{ gap: 8 }} onClick={handleResetData}>
            <Trash2 size={14} /> Resetear todos los datos
          </button>
        )}
      </div>

      {/* Info */}
      <div style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center' }}>
        FocusFlow — construido para mentes brillantes ✨
      </div>
    </div>
  );
}
