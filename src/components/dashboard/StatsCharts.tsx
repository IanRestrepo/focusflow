import { useState, useEffect } from 'react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { Flame, CheckSquare, Repeat, TrendingUp } from 'lucide-react';

interface DayActivity   { date: string; label: string; pts: number; active: boolean }
interface DayCompletion { date: string; label: string; pct: number; done: number; total: number }
interface DayHabits     { date: string; label: string; count: number }

interface Summary {
  consistencyPct: number;
  avgCompletion: number;
  activeHabits: number;
  activeDays: number;
  days: number;
}

interface ChartData {
  activity: DayActivity[];
  completion: DayCompletion[];
  habits: DayHabits[];
  summary: Summary;
}

const RANGE_OPTIONS = [
  { label: '7d',  value: 7 },
  { label: '14d', value: 14 },
  { label: '30d', value: 30 },
  { label: '90d', value: 90 },
];

// ── Custom tooltip ────────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label, unit }: any) {
  if (!active || !payload?.length) return null;
  const val = payload[0]?.value;
  return (
    <div style={{
      background: 'var(--bg-tertiary)',
      border: '1px solid var(--border-default)',
      borderRadius: 8, padding: '8px 12px',
      fontSize: 12, color: 'var(--text-primary)',
      boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
    }}>
      <div style={{ color: 'var(--text-muted)', marginBottom: 3 }}>{label}</div>
      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: payload[0]?.color }}>
        {val}{unit}
      </div>
      {payload[1] && (
        <div style={{ fontFamily: 'JetBrains Mono, monospace', color: payload[1].color }}>
          {payload[1].value}{unit}
        </div>
      )}
    </div>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatPill({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      background: 'var(--bg-tertiary)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 10, padding: '10px 14px', flex: 1,
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 8, flexShrink: 0,
        background: `${color}18`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>{icon}</div>
      <div>
        <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color }}>{value}</div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{label}</div>
      </div>
    </div>
  );
}

// ── Chart card wrapper ────────────────────────────────────────────────────────
function ChartCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{title}</h3>
        <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

// ── Skeleton loader ────────────────────────────────────────────────────────────
function ChartSkeleton() {
  return (
    <div style={{
      height: 140, borderRadius: 8,
      background: 'linear-gradient(90deg, var(--bg-tertiary) 25%, var(--bg-accent) 50%, var(--bg-tertiary) 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer-gold 1.5s infinite',
    }} />
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function StatsCharts() {
  const [data, setData]     = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays]     = useState(30);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/stats/charts?days=${days}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [days]);

  // Use CSS variables values for recharts (which can't read CSS vars directly)
  const accentColor   = 'var(--accent-primary)';
  const successColor  = '#22c55e';
  const progressColor = '#3b82f6';
  const dangerColor   = '#f43f5e';

  // Tick style
  const tickStyle = { fontSize: 10, fill: 'var(--text-muted)' } as const;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Section header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <TrendingUp size={16} style={{ color: 'var(--accent-primary)' }} />
            Tu progreso
          </h2>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
            Estadísticas de los últimos {days} días
          </p>
        </div>

        {/* Range selector */}
        <div style={{ display: 'flex', gap: 4, background: 'var(--bg-tertiary)', borderRadius: 8, padding: 4, border: '1px solid var(--border-subtle)' }}>
          {RANGE_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setDays(opt.value)}
              style={{
                padding: '4px 10px', borderRadius: 6, border: 'none', cursor: 'pointer',
                fontSize: 12, fontWeight: 600, fontFamily: 'JetBrains Mono, monospace',
                background: days === opt.value ? 'var(--accent-primary)' : 'transparent',
                color: days === opt.value ? '#000' : 'var(--text-muted)',
                transition: 'all 0.15s',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary pills */}
      {data && (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <StatPill
            icon={<Flame size={15} style={{ color: accentColor }} />}
            label={`Días activos / ${data.summary.days}`}
            value={`${data.summary.consistencyPct}%`}
            color="var(--accent-primary)"
          />
          <StatPill
            icon={<CheckSquare size={15} style={{ color: successColor }} />}
            label="Tareas completadas promedio"
            value={`${data.summary.avgCompletion}%`}
            color={successColor}
          />
          <StatPill
            icon={<Repeat size={15} style={{ color: progressColor }} />}
            label="Rutinas activas"
            value={String(data.summary.activeHabits)}
            color={progressColor}
          />
        </div>
      )}

      {/* Charts grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        {/* 1. Consistency — points per day */}
        <ChartCard
          title="Constancia"
          subtitle="Puntos ganados por día — mide tu actividad diaria"
        >
          {loading ? <ChartSkeleton /> : (
            <ResponsiveContainer width="100%" height={150}>
              <AreaChart data={data?.activity ?? []} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradActivity" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="var(--accent-primary)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--accent-primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                <XAxis dataKey="label" tick={tickStyle} interval={Math.floor((days - 1) / 6)} />
                <YAxis tick={tickStyle} />
                <Tooltip content={<ChartTooltip unit=" pts" />} />
                <Area
                  type="monotone" dataKey="pts"
                  stroke="var(--accent-primary)" strokeWidth={2}
                  fill="url(#gradActivity)"
                  dot={false} activeDot={{ r: 4, fill: 'var(--accent-primary)' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* 2. Task completion % */}
        <ChartCard
          title="% Tareas finalizadas"
          subtitle="Porcentaje de tareas completadas cada día"
        >
          {loading ? <ChartSkeleton /> : (
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={data?.completion ?? []} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradCompletion" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"  stopColor={successColor} stopOpacity={0.9} />
                    <stop offset="100%" stopColor={successColor} stopOpacity={0.5} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                <XAxis dataKey="label" tick={tickStyle} interval={Math.floor((days - 1) / 6)} />
                <YAxis tick={tickStyle} domain={[0, 100]} tickFormatter={v => `${v}%`} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0]?.payload;
                    return (
                      <div style={{
                        background: 'var(--bg-tertiary)', border: '1px solid var(--border-default)',
                        borderRadius: 8, padding: '8px 12px', fontSize: 12,
                        boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
                      }}>
                        <div style={{ color: 'var(--text-muted)', marginBottom: 3 }}>{label}</div>
                        {d.total === 0 ? (
                          <div style={{ color: 'var(--text-muted)' }}>Sin tareas</div>
                        ) : (
                          <>
                            <div style={{ fontWeight: 700, color: successColor, fontFamily: 'JetBrains Mono, monospace' }}>{d.pct}%</div>
                            <div style={{ color: 'var(--text-muted)' }}>{d.done}/{d.total} tareas</div>
                          </>
                        )}
                      </div>
                    );
                  }}
                />
                <Bar dataKey="pct" fill="url(#gradCompletion)" radius={[4, 4, 0, 0]} maxBarSize={20} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* 3. Habit growth — full width */}
        <div style={{ gridColumn: '1 / -1' }}>
          <ChartCard
            title="Crecimiento de hábitos"
            subtitle="Acumulado de rutinas creadas a lo largo del tiempo"
          >
            {loading ? <ChartSkeleton /> : (
              <ResponsiveContainer width="100%" height={150}>
                <LineChart data={data?.habits ?? []} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradHabits" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"  stopColor={progressColor} stopOpacity={0.15} />
                      <stop offset="100%" stopColor={progressColor} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                  <XAxis dataKey="label" tick={tickStyle} interval={Math.floor((days - 1) / 6)} />
                  <YAxis tick={tickStyle} allowDecimals={false} />
                  <Tooltip content={<ChartTooltip unit=" rutinas" />} />
                  <Line
                    type="stepAfter" dataKey="count"
                    stroke={progressColor} strokeWidth={2.5}
                    dot={{ r: 3, fill: progressColor, strokeWidth: 0 }}
                    activeDot={{ r: 5, fill: progressColor }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>

      </div>
    </div>
  );
}
