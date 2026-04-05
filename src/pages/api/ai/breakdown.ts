import type { APIRoute } from 'astro';
import Anthropic from '@anthropic-ai/sdk';
import { getPBFromRequest } from '@/lib/pocketbase';
import { readFileSync } from 'fs';
import { resolve } from 'path';

/** Load ANTHROPIC_API_KEY — tries import.meta.env first (Vite),
 *  then process.env, then reads .env file directly as fallback. */
function getApiKey(): string {
  const fromVite = import.meta.env.ANTHROPIC_API_KEY;
  if (fromVite) return fromVite;

  const fromProcess = process.env.ANTHROPIC_API_KEY;
  if (fromProcess) return fromProcess;

  // Fallback: parse .env manually (dev only)
  try {
    const envPath = resolve(process.cwd(), '.env');
    const lines = readFileSync(envPath, 'utf-8').split('\n');
    for (const line of lines) {
      const [key, ...rest] = line.split('=');
      if (key?.trim() === 'ANTHROPIC_API_KEY') return rest.join('=').trim();
    }
  } catch {}

  return '';
}

const SYSTEM_PROMPT = `Eres un asistente de productividad para personas con TDAH.
Tu trabajo es analizar una descripción de tarea y devolver un plan de acción claro, concreto y motivador.

SISTEMA DE PUNTOS (el sistema calcula automáticamente los puntos con esta fórmula):
  Puntos = (Minutos/5) × Esfuerzo × CatMultiplicador + (Subtareas×100) + Bonificaciones

Valores de esfuerzo cognitivo:
  routine    = 25  → tareas mecánicas/rutinarias (beber agua, hacer cama, responder emails simples)
  moderate   = 50  → tareas moderadas (limpiar, leer, ejercicio ligero)
  creative   = 75  → tareas desafiantes (escribir, programar, estudiar activamente)
  analytical = 100 → tareas muy complejas y cognitivamente exigentes (análisis, presentaciones, proyectos grandes)

Multiplicadores de categoría: work=1.5, learning=1.3, health=1.2, personal=1.0, other=1.0

Escala resultante (para calibrar tu estimación de minutos y esfuerzo):
  MICRO (5-15 min, routine):     ~50-150 pts  — beber agua, hacer cama
  PEQUEÑA (15-45 min, moderate): ~200-500 pts — limpiar escritorio, leer 10 págs
  MEDIANA (45-120 min, creative): ~800-2,000 pts — estudiar 1h, proyecto de trabajo
  GRANDE (2+ horas, analytical): ~3,000-10,000 pts — presentación, reporte completo

REGLAS:
- Divide en 2-6 subtareas concretas con verbos de acción ("Redactar", "Revisar", "Llamar", "Preparar")
- Cada subtarea completable en menos de 40 minutos
- Estima minutos TOTALES realistas para la tarea completa (no por subtarea)
- Elige el nivel de esfuerzo cognitivo apropiado para la tarea
- Elige categoría: work, personal, health, learning, other
- Título máximo 60 caracteres, con verbo de acción
- Responde ÚNICAMENTE con JSON válido, sin texto adicional ni markdown

FORMATO (sin puntos por subtarea — el sistema los calcula automáticamente):
{
  "title": "Título corto con verbo",
  "category": "work|personal|health|learning|other",
  "estimatedMinutes": 60,
  "effortLevel": "routine|moderate|creative|analytical",
  "subtasks": [
    { "title": "Paso concreto 1" },
    { "title": "Paso concreto 2" }
  ]
}`;

export const POST: APIRoute = async ({ request }) => {
  const pb = getPBFromRequest(request);
  if (!pb.authStore.isValid) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
  }

  let description: string;
  try {
    const body = await request.json();
    description = (body.description ?? '').trim();
  } catch {
    return new Response(JSON.stringify({ error: 'Body inválido' }), { status: 400 });
  }

  if (!description || description.length < 5) {
    return new Response(JSON.stringify({ error: 'Describe qué necesitas hacer.' }), { status: 400 });
  }

  if (description.length > 1000) {
    return new Response(JSON.stringify({ error: 'Descripción demasiado larga (máx 1000 caracteres).' }), { status: 400 });
  }

  try {
    const apiKey = getApiKey();
    const client = new Anthropic({ apiKey });

    const message = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 800,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Tarea a planificar: ${description}`,
        },
      ],
    });

    const raw = message.content[0].type === 'text' ? message.content[0].text : '';

    // Strip any accidental markdown fences
    const clean = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(clean);

    // Validate shape
    if (!parsed.title || !Array.isArray(parsed.subtasks) || parsed.subtasks.length === 0) {
      throw new Error('Respuesta de IA con formato inesperado');
    }

    // Clamp / sanitise values
    parsed.subtasks = parsed.subtasks.slice(0, 6).map((st: any) => ({
      title: String(st.title).slice(0, 120),
    }));
    parsed.title = String(parsed.title).slice(0, 80);

    const validCats = ['work', 'personal', 'health', 'learning', 'other'];
    if (!validCats.includes(parsed.category)) parsed.category = 'other';

    const validEfforts = ['routine', 'moderate', 'creative', 'analytical'];
    if (!validEfforts.includes(parsed.effortLevel)) parsed.effortLevel = 'moderate';

    parsed.estimatedMinutes = Math.max(5, Math.min(1440, parseInt(parsed.estimatedMinutes) || 30));

    return new Response(JSON.stringify(parsed), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    console.error('[AI breakdown error]', e?.message ?? e);
    return new Response(
      JSON.stringify({ error: 'Error al contactar la IA. Intenta de nuevo.' }),
      { status: 500 }
    );
  }
};
