import type { APIRoute } from 'astro';
import Anthropic from '@anthropic-ai/sdk';
import { getPBFromRequest } from '@/lib/pocketbase';
import { today } from '@/lib/utils';
import { TASK_COMPLETE_BONUS_PCT, syncLevel } from '@/lib/points';
import { readFileSync } from 'fs';
import { resolve } from 'path';

function getApiKey(): string {
  const fromVite = import.meta.env.ANTHROPIC_API_KEY;
  if (fromVite) return fromVite;
  const fromProcess = process.env.ANTHROPIC_API_KEY;
  if (fromProcess) return fromProcess;
  try {
    const lines = readFileSync(resolve(process.cwd(), '.env'), 'utf-8').split('\n');
    for (const line of lines) {
      const [k, ...rest] = line.split('=');
      if (k?.trim() === 'ANTHROPIC_API_KEY') return rest.join('=').trim();
    }
  } catch {}
  return '';
}

// ── Tool definitions ───────────────────────────────────────────────────────
const TOOLS: Anthropic.Tool[] = [
  {
    name: 'create_task',
    description: 'Crea una tarea puntual SOLO para una fecha específica y única. ÚSALA ÚNICAMENTE cuando el usuario mencione explícitamente "hoy", "mañana", "el lunes", una fecha concreta, o diga claramente que es algo de una sola vez. Si hay cualquier duda sobre si la tarea podría repetirse, usa create_recurring_task.',
    input_schema: {
      type: 'object' as const,
      properties: {
        title: { type: 'string', description: 'Título corto de la tarea (máx 60 chars)' },
        description: { type: 'string', description: 'Descripción opcional' },
        category: { type: 'string', enum: ['work', 'personal', 'health', 'learning', 'other'], description: 'Categoría de la tarea' },
        date: { type: 'string', description: 'Fecha en formato YYYY-MM-DD. Si no se especifica, usar hoy.' },
        subtasks: {
          type: 'array',
          description: 'Lista de subtareas/pasos',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              points_value: { type: 'number', description: 'Puntos entre 5 y 100. Proporcional al esfuerzo.' },
            },
            required: ['title', 'points_value'],
          },
        },
      },
      required: ['title', 'category', 'date', 'subtasks'],
    },
  },
  {
    name: 'list_tasks',
    description: 'Lista las tareas del usuario para una fecha concreta.',
    input_schema: {
      type: 'object' as const,
      properties: {
        date: { type: 'string', description: 'Fecha en formato YYYY-MM-DD' },
      },
      required: ['date'],
    },
  },
  {
    name: 'get_stats',
    description: 'Obtiene las estadísticas actuales del usuario: puntos, nivel, racha.',
    input_schema: { type: 'object' as const, properties: {} },
  },
  {
    name: 'delete_task',
    description: 'Elimina una tarea del usuario. Úsala cuando el usuario pida borrar, eliminar o quitar una tarea. Primero usa list_tasks para obtener las tareas y sus IDs.',
    input_schema: {
      type: 'object' as const,
      properties: {
        task_id: { type: 'string', description: 'ID de la tarea a eliminar' },
      },
      required: ['task_id'],
    },
  },
  {
    name: 'create_reward',
    description: 'Crea una nueva recompensa personalizada para el usuario. Úsala cuando el usuario pida añadir, crear o agregar una recompensa, premio o capricho a su lista. El costo mínimo es 1,000 puntos.',
    input_schema: {
      type: 'object' as const,
      properties: {
        title:       { type: 'string',  description: 'Nombre corto de la recompensa (máx 60 chars)' },
        description: { type: 'string',  description: 'Descripción breve y motivadora (opcional)' },
        cost:        { type: 'number',  description: 'Costo en puntos. Mínimo 1,000. Guía: Mediana=1,000-2,000 | Grande=2,500-4,000 | Premium=5,000-8,000 | Épica=10,000+' },
        icon:        { type: 'string',  description: 'Un emoji representativo (ej: 🎮 🍕 ☕ 🎬 🏖️)' },
      },
      required: ['title', 'cost', 'icon'],
    },
  },
  {
    name: 'list_rewards',
    description: 'Lista las recompensas activas del usuario. Úsala cuando el usuario pregunte qué recompensas tiene, cuánto cuestan, o antes de crear una para evitar duplicados.',
    input_schema: { type: 'object' as const, properties: {} },
  },
  {
    name: 'create_recurring_task',
    description: 'Crea una plantilla de tarea repetitiva que se genera automáticamente cada día programado. ESTA ES LA HERRAMIENTA POR DEFECTO para crear tareas. Úsala en todos estos casos: (1) el usuario dice "todos los días", "cada día", "diario", "siempre", "rutina", "hábito", "repetitiva"; (2) la actividad es claramente un hábito o rutina por naturaleza: cepillarse los dientes, hacer la cama, meditar, ejercicio, gym, tomar agua, leer, estudiar idiomas, dormir temprano, desayunar, etc.; (3) el usuario pide "añade X a mi rutina"; (4) cualquier duda — si no sabes si es puntual o repetitiva, usa ESTA herramienta.',
    input_schema: {
      type: 'object' as const,
      properties: {
        title: { type: 'string' },
        category: { type: 'string', enum: ['work', 'personal', 'health', 'learning', 'other'] },
        subtasks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              points_value: { type: 'number' },
            },
            required: ['title', 'points_value'],
          },
        },
        days: {
          type: 'string',
          description: 'Días de la semana separados por coma (0=Dom,1=Lun,...,6=Sáb). "0,1,2,3,4,5,6" para todos los días, "1,2,3,4,5" para lunes a viernes.',
        },
      },
      required: ['title', 'category', 'subtasks', 'days'],
    },
  },
];

// ── Execute a tool call ────────────────────────────────────────────────────
async function executeTool(name: string, input: any, pb: any, userId: string, todayStr: string) {
  if (name === 'create_task') {
    const { title, description, category, date, subtasks = [] } = input;
    const existing = await pb.collection('tasks').getFullList({
      filter: `user = "${userId}" && date = "${date}"`,
    });
    const task = await pb.collection('tasks').create({
      user: userId, title, description: description ?? '', category,
      date, points_value: subtasks.reduce((s: number, st: any) => s + (st.points_value ?? 10), 0) || 10,
      status: 'pending', order: existing.length,
    });
    for (let i = 0; i < subtasks.length; i++) {
      await pb.collection('subtasks').create({
        task: task.id, title: subtasks[i].title,
        points_value: subtasks[i].points_value, status: 'pending', order: i,
      });
    }
    return { success: true, taskId: task.id, title, date, subtasksCreated: subtasks.length, totalPoints: subtasks.reduce((s: number, st: any) => s + (st.points_value ?? 10), 0) };
  }

  if (name === 'list_tasks') {
    const { date } = input;
    const tasks = await pb.collection('tasks').getFullList({
      filter: `user = "${userId}" && date = "${date}"`,
      sort: '+order',
    });
    const result = await Promise.all(tasks.map(async (t: any) => {
      const subs = await pb.collection('subtasks').getFullList({ filter: `task = "${t.id}"`, sort: '+order' });
      return { title: t.title, status: t.status, category: t.category, subtasks: subs.map((s: any) => ({ title: s.title, status: s.status })) };
    }));
    return { date, tasks: result, total: result.length };
  }

  if (name === 'get_stats') {
    const user = await pb.collection('users').getOne(userId);
    return {
      username: user.username, level: user.level, totalPoints: user.total_points,
      currentPoints: user.current_points, streakDays: user.streak_days,
    };
  }

  if (name === 'delete_task') {
    const { task_id } = input;
    const task = await pb.collection('tasks').getOne(task_id);
    const subtasks = await pb.collection('subtasks').getFullList({ filter: `task = "${task_id}"` });

    // Calculate points to deduct for completed subtasks
    const completedSubtasks = subtasks.filter((s: any) => s.status === 'completed');
    const completedSubtaskPoints = completedSubtasks.reduce(
      (sum: number, s: any) => sum + (s.points_value ?? 0), 0
    );
    const taskBonus = task.status === 'completed'
      ? Math.round(completedSubtaskPoints * TASK_COMPLETE_BONUS_PCT)
      : 0;
    const totalDeduction = completedSubtaskPoints + taskBonus;

    if (totalDeduction > 0) {
      const user = await pb.collection('users').getOne(userId);
      const newTotalPoints = Math.max(0, (user.total_points ?? 0) - totalDeduction);
      const newCurrentPoints = Math.max(0, (user.current_points ?? 0) - totalDeduction);
      await pb.collection('users').update(userId, {
        total_points: newTotalPoints,
        current_points: newCurrentPoints,
      });
      await syncLevel(pb, userId, newTotalPoints, user.level);
    }

    await Promise.all(subtasks.map((s: any) => pb.collection('subtasks').delete(s.id)));
    await pb.collection('tasks').delete(task_id);
    return { success: true, title: task.title, pointsDeducted: totalDeduction };
  }

  if (name === 'create_reward') {
    const MIN_COST = 1_000;
    const { title, description, icon } = input;
    const cost = Math.max(MIN_COST, Math.round((input.cost ?? MIN_COST) / 50) * 50);

    if (!title?.trim()) return { error: 'El título es obligatorio.' };

    const reward = await pb.collection('rewards').create({
      user: userId,
      title: title.trim(),
      description: description?.trim() ?? '',
      cost,
      icon: icon ?? '🎁',
      is_active: true,
    });
    return { success: true, rewardId: reward.id, title: title.trim(), cost, icon: icon ?? '🎁' };
  }

  if (name === 'list_rewards') {
    const rewards = await pb.collection('rewards').getFullList({
      filter: `user = "${userId}" && is_active = true`,
      sort: 'cost',
    });
    return {
      rewards: rewards.map((r: any) => ({
        id: r.id, title: r.title, cost: r.cost, icon: r.icon, description: r.description,
      })),
      total: rewards.length,
    };
  }

  if (name === 'create_recurring_task') {
    const { title, category, subtasks = [], days } = input;
    const pts = subtasks.reduce((s: number, st: any) => s + (st.points_value ?? 10), 0) || 10;
    const tpl = await pb.collection('recurring_templates').create({
      user: userId, title, description: '', category,
      subtask_templates: JSON.stringify(subtasks),
      days: days ?? '0,1,2,3,4,5,6',
      is_active: true, points_value: pts, last_generated_date: '',
    });
    return { success: true, templateId: tpl.id, title, days, subtasksCreated: subtasks.length, totalPoints: pts };
  }

  return { error: 'Tool not found' };
}

// ── Main handler ───────────────────────────────────────────────────────────
export const POST: APIRoute = async ({ request }) => {
  const pb = getPBFromRequest(request);
  if (!pb.authStore.isValid) return new Response('Unauthorized', { status: 401 });

  const userId = pb.authStore.record!.id;
  const todayStr = today();

  let messages: Anthropic.MessageParam[];
  try {
    const body = await request.json();
    messages = body.messages ?? [];
  } catch {
    return new Response(JSON.stringify({ error: 'Body inválido' }), { status: 400 });
  }

  // Build context-aware system prompt
  const user = await pb.collection('users').getOne(userId);
  const todayTasks = await pb.collection('tasks').getFullList({
    filter: `user = "${userId}" && date = "${todayStr}"`,
    sort: '+order',
  });
  const completedToday = todayTasks.filter((t: any) => t.status === 'completed').length;

  const systemPrompt = `Eres el asistente personal de productividad de FocusFlow, diseñado específicamente para personas con TDAH.
Tu nombre es Flow. Eres cercano, motivador y directo — nunca condescendiente.

CONTEXTO DEL USUARIO (actualizado):
- Nombre: ${user.username}
- Nivel: ${user.level}
- Puntos totales: ${user.total_points.toLocaleString('es-ES')}
- Puntos disponibles: ${user.current_points}
- Racha actual: ${user.streak_days} días
- Hoy (${todayStr}): ${todayTasks.length} tareas (${completedToday} completadas)

CAPACIDADES (herramientas disponibles):
- create_task: Tareas puntuales para UNA fecha concreta (hoy, mañana, etc.)
- create_recurring_task: Tareas repetitivas (rutinas, hábitos, "todos los días", "lunes a viernes", etc.)
- list_tasks: Ver tareas de una fecha (úsala primero antes de eliminar)
- delete_task: Eliminar una tarea (descuenta puntos si estaba completada)
- get_stats: Ver estadísticas del usuario
- create_reward: Crea una recompensa nueva (mínimo 1,000 pts). Úsala cuando el usuario quiera añadir premios, caprichos o recompensas personalizadas.
- list_rewards: Lista las recompensas activas del usuario.

REGLA DE ORO — HERRAMIENTA POR DEFECTO:
🔁 create_recurring_task ES la herramienta por defecto. Úsala siempre que:
   - La actividad sea un hábito, rutina o se pueda repetir (cepillarse, gym, meditar, estudiar, leer, etc.)
   - El usuario no especifique una fecha concreta
   - Haya cualquier duda

📅 create_task SOLO cuando el usuario diga explícitamente "hoy", "mañana", "el [día]", una fecha específica, o "una sola vez".

❌ PROHIBIDO: usar create_task para actividades que por naturaleza son hábitos o rutinas, aunque el usuario no diga "todos los días".

SISTEMA DE PUNTOS:
- Subtarea fácil: 5-20 pts | Moderada: 25-45 pts | Difícil: 45-100 pts
- Un día productivo completo ≈ 2,000-8,000 pts (con el nuevo sistema de cálculo)
- Recompensas — mínimo 1,000 pts:
  • Mediana (1,000-2,000): snack, redes 30 min, café
  • Grande (2,500-4,000): gaming 1h, salida, pedir comida
  • Premium (5,000-8,000): día libre, compra mediana, experiencia
  • Épica (10,000+): compra grande, fin de semana libre

PERSONALIDAD:
- Sé breve y concreto (personas con TDAH no necesitan textos largos)
- Usa emojis con moderación para dar energía
- Celebra los logros con entusiasmo real
- Si el usuario pide crear algo, hazlo directamente sin pedir más confirmación a menos que falte info esencial
- Habla siempre en español

Fecha de hoy: ${todayStr}`;

  try {
    const client = new Anthropic({ apiKey: getApiKey() });

    // Agentic loop: Claude may call multiple tools before final response
    let currentMessages = [...messages];
    let finalText = '';
    const createdTasks: any[]   = [];
    const createdRewards: any[] = [];

    for (let step = 0; step < 5; step++) {
      const response = await client.messages.create({
        model: 'claude-haiku-4-5',
        max_tokens: 1024,
        system: systemPrompt,
        tools: TOOLS,
        messages: currentMessages,
      });

      // Collect text from this response
      const textBlocks = response.content.filter(b => b.type === 'text');
      if (textBlocks.length > 0) {
        finalText = textBlocks.map((b: any) => b.text).join('');
      }

      // If no tool calls, we're done
      if (response.stop_reason === 'end_turn') break;

      // Process tool calls
      const toolUseBlocks = response.content.filter(b => b.type === 'tool_use');
      if (!toolUseBlocks.length) break;

      // Add assistant message with tool calls
      currentMessages.push({ role: 'assistant', content: response.content });

      // Execute each tool and collect results
      const toolResults: Anthropic.ToolResultBlockParam[] = [];
      for (const block of toolUseBlocks) {
        if (block.type !== 'tool_use') continue;
        const result = await executeTool(block.name, block.input, pb, userId, todayStr);
        toolResults.push({
          type: 'tool_result',
          tool_use_id: block.id,
          content: JSON.stringify(result),
        });
        if (block.name === 'create_task' && (result as any).success) {
          createdTasks.push(result);
        }
        if (block.name === 'create_recurring_task' && (result as any).success) {
          createdTasks.push({ ...result, recurring: true });
        }
        if (block.name === 'create_reward' && (result as any).success) {
          createdRewards.push(result);
        }
      }

      // Add tool results
      currentMessages.push({ role: 'user', content: toolResults });
    }

    return new Response(JSON.stringify({ text: finalText, createdTasks, createdRewards }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    console.error('[Chat error]', e?.message);
    return new Response(JSON.stringify({ error: 'Error de IA. Intenta de nuevo.' }), { status: 500 });
  }
};
