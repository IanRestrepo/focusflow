/**
 * Default rewards created for every new user (and restored after reset).
 *
 * Nueva economía — mínimo 1,000 pts por recompensa.
 * Un día productivo completo ≈ 2,000–8,000 pts con el nuevo sistema de cálculo.
 *
 * Tier guide:
 *   Mediana  (1,000–2,000 pts) – 1 día productivo
 *   Grande   (2,500–4,000 pts) – 2-3 días productivos
 *   Premium  (5,000–8,000 pts) – 1 semana consistente
 *   Épica    (10,000+ pts)     – logro especial
 */
export const DEFAULT_REWARDS = [
  // ── Mediana (1,000–2,000 pts) ─────────────────────────────────────────────
  {
    title: 'Redes sociales 30 min',
    cost: 1_000,
    icon: '📱',
    description: 'Scroll merecido y sin culpa — te lo ganaste.',
  },
  {
    title: 'Café o snack favorito',
    cost: 1_000,
    icon: '☕',
    description: 'Prepárate algo rico para recargar energía.',
  },
  {
    title: 'YouTube o podcast 1h',
    cost: 1_500,
    icon: '▶️',
    description: 'Una hora de contenido que te encanta, sin interrupciones.',
  },
  {
    title: 'Episodio de serie',
    cost: 1_500,
    icon: '📺',
    description: '~45 min de entretenimiento bien ganado.',
  },
  {
    title: 'Gaming 1 hora',
    cost: 2_000,
    icon: '🎮',
    description: 'Una hora de videojuego puro y sin culpa.',
  },

  // ── Grande (2,500–4,000 pts) ──────────────────────────────────────────────
  {
    title: 'Tarde libre',
    cost: 2_500,
    icon: '🌅',
    description: 'Una tarde entera para ti — cero obligaciones.',
  },
  {
    title: 'Pedir comida a domicilio',
    cost: 2_500,
    icon: '🛵',
    description: 'Pide lo que te antoje hoy, sin cocinar.',
  },
  {
    title: 'Salida / plan social',
    cost: 3_000,
    icon: '🎉',
    description: 'Café con amigos, cine, o lo que te apetezca.',
  },
  {
    title: 'Compra pequeña',
    cost: 4_000,
    icon: '🛍️',
    description: 'Ese capricho de hasta $20 que llevas posponiendo.',
  },

  // ── Premium (5,000–8,000 pts) ─────────────────────────────────────────────
  {
    title: 'Día libre completo',
    cost: 5_000,
    icon: '🏖️',
    description: 'Un día entero para ti — sin tareas, sin presión.',
  },
  {
    title: 'Compra mediana',
    cost: 6_000,
    icon: '🎁',
    description: 'Algo que quieras hasta $50 — lo mereces.',
  },
  {
    title: 'Experiencia especial',
    cost: 8_000,
    icon: '🎬',
    description: 'Cine, concierto, spa, o lo que más disfrutes.',
  },

  // ── Épica (10,000+ pts) ───────────────────────────────────────────────────
  {
    title: 'Compra grande',
    cost: 10_000,
    icon: '💎',
    description: 'Una compra importante que llevas tiempo deseando.',
  },
  {
    title: 'Fin de semana libre',
    cost: 12_000,
    icon: '🏆',
    description: 'Dos días sin tareas. La recompensa máxima — úsala bien.',
  },
];
