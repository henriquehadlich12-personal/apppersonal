// ============================================================
// Catálogo de equipamentos
// Cada item tem um croqui (SVG) próprio, feito para este app —
// não são fotos reais, então servem de referência visual simples
// pro aluno saber qual máquina procurar na academia.
// Fica no código (não no banco) porque é conteúdo fixo/compartilhado.
// ============================================================

const EQUIPAMENTOS = [
  {
    id: "leg_press",
    nome: "Leg Press",
    categoria: "Pernas",
    svg: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M8 38 L30 38 L40 14"/>
      <rect x="30" y="6" width="12" height="12" rx="1.5"/>
      <circle cx="10" cy="40" r="2.5"/>
      <circle cx="28" cy="40" r="2.5"/>
      <path d="M8 30 L26 30"/>
    </svg>`,
  },
  {
    id: "extensora",
    nome: "Cadeira Extensora",
    categoria: "Pernas",
    svg: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M10 8 L10 30 L20 30"/>
      <rect x="6" y="30" width="16" height="4" rx="1"/>
      <circle cx="34" cy="16" r="3"/>
      <path d="M22 19 L34 19"/>
      <path d="M22 19 L22 34"/>
      <rect x="30" y="30" width="8" height="4" rx="1.5"/>
    </svg>`,
  },
  {
    id: "flexora",
    nome: "Cadeira Flexora",
    categoria: "Pernas",
    svg: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="8" y="10" width="18" height="8" rx="1.5"/>
      <path d="M12 18 L12 30"/>
      <path d="M12 30 L30 30"/>
      <path d="M30 30 L30 20"/>
      <circle cx="34" cy="20" r="3"/>
    </svg>`,
  },
  {
    id: "adutora",
    nome: "Cadeira Adutora",
    categoria: "Pernas",
    svg: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="16" y="8" width="16" height="10" rx="1.5"/>
      <path d="M18 18 L18 34 M30 18 L30 34"/>
      <path d="M14 26 L18 24 M34 26 L30 24"/>
      <path d="M12 40 L36 40"/>
    </svg>`,
  },
  {
    id: "abdutora",
    nome: "Cadeira Abdutora",
    categoria: "Pernas",
    svg: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="16" y="8" width="16" height="10" rx="1.5"/>
      <path d="M20 18 L20 34 M28 18 L28 34"/>
      <path d="M20 26 L14 24 M28 26 L34 24"/>
      <path d="M12 40 L36 40"/>
    </svg>`,
  },
  {
    id: "panturrilha",
    nome: "Panturrilha (Gêmeos)",
    categoria: "Pernas",
    svg: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 8 L12 20"/>
      <rect x="6" y="6" width="12" height="6" rx="1.5"/>
      <rect x="10" y="34" width="8" height="4" rx="1"/>
      <path d="M14 20 L14 34"/>
      <path d="M6 38 L26 38"/>
    </svg>`,
  },
  {
    id: "supino",
    nome: "Supino Reto",
    categoria: "Peito",
    svg: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="10" y="26" width="24" height="6" rx="1.5"/>
      <path d="M14 32 L14 40 M30 32 L30 40"/>
      <path d="M8 16 L40 16"/>
      <circle cx="12" cy="16" r="4"/>
      <circle cx="36" cy="16" r="4"/>
    </svg>`,
  },
  {
    id: "supino_inclinado",
    nome: "Supino Inclinado",
    categoria: "Peito",
    svg: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M10 36 L18 20 L28 20"/>
      <path d="M14 22 L38 14"/>
      <circle cx="14" cy="22" r="4"/>
      <circle cx="38" cy="14" r="4"/>
    </svg>`,
  },
  {
    id: "crucifixo",
    nome: "Voador (Peck Deck)",
    categoria: "Peito",
    svg: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="20" y="10" width="8" height="24" rx="2"/>
      <path d="M20 16 L8 12 M20 26 L8 30"/>
      <path d="M28 16 L40 12 M28 26 L40 30"/>
      <rect x="6" y="9" width="4" height="6" rx="1"/>
      <rect x="38" y="27" width="4" height="6" rx="1"/>
    </svg>`,
  },
  {
    id: "puxador",
    nome: "Puxador Alto (Pulldown)",
    categoria: "Costas",
    svg: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M10 8 L38 8"/>
      <path d="M24 8 L24 16"/>
      <path d="M14 16 L34 16"/>
      <path d="M24 16 L24 24"/>
      <path d="M18 30 L30 30"/>
      <path d="M18 30 L18 38 M30 30 L30 38"/>
    </svg>`,
  },
  {
    id: "remada_baixa",
    nome: "Remada Baixa (Sentado)",
    categoria: "Costas",
    svg: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="8" y="24" width="10" height="4" rx="1"/>
      <path d="M13 28 L13 36"/>
      <path d="M18 26 L34 26"/>
      <path d="M34 26 L34 18"/>
      <circle cx="34" cy="14" r="4"/>
    </svg>`,
  },
  {
    id: "remada_curvada",
    nome: "Remada Curvada (Barra)",
    categoria: "Costas",
    svg: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M10 36 L20 18"/>
      <path d="M14 26 L34 20"/>
      <circle cx="14" cy="26" r="4"/>
      <circle cx="34" cy="20" r="4"/>
    </svg>`,
  },
  {
    id: "desenvolvimento",
    nome: "Desenvolvimento (Ombro)",
    categoria: "Ombros",
    svg: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="18" y="26" width="12" height="14" rx="2"/>
      <path d="M18 30 L10 12 M30 30 L38 12"/>
      <circle cx="10" cy="10" r="3"/>
      <circle cx="38" cy="10" r="3"/>
    </svg>`,
  },
  {
    id: "elevacao_lateral",
    nome: "Elevação Lateral (Halteres)",
    categoria: "Ombros",
    svg: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 30 L12 16 M36 30 L36 16"/>
      <rect x="8" y="14" width="8" height="6" rx="1.5"/>
      <rect x="32" y="14" width="8" height="6" rx="1.5"/>
      <path d="M18 40 Q24 30 30 40"/>
    </svg>`,
  },
  {
    id: "rosca_direta",
    nome: "Rosca Direta (Barra W)",
    categoria: "Braços",
    svg: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M10 20 L16 20 L20 26 L28 26 L32 20 L38 20"/>
      <circle cx="8" cy="20" r="3.5"/>
      <circle cx="40" cy="20" r="3.5"/>
    </svg>`,
  },
  {
    id: "triceps_pulley",
    nome: "Tríceps Pulley",
    categoria: "Braços",
    svg: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="24" cy="10" r="4"/>
      <path d="M24 14 L24 26"/>
      <path d="M18 26 L24 32 L30 26"/>
      <path d="M18 26 L18 34 M30 26 L30 34"/>
    </svg>`,
  },
  {
    id: "esteira",
    nome: "Esteira",
    categoria: "Cardio",
    svg: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="6" y="30" width="26" height="6" rx="3"/>
      <path d="M28 30 L38 14"/>
      <path d="M30 16 L40 16"/>
    </svg>`,
  },
  {
    id: "bike",
    nome: "Bicicleta Ergométrica",
    categoria: "Cardio",
    svg: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="14" cy="32" r="8"/>
      <path d="M14 32 L24 18 L34 18"/>
      <path d="M24 18 L18 32"/>
      <rect x="20" y="10" width="8" height="4" rx="1.5"/>
      <path d="M24 14 L24 18"/>
    </svg>`,
  },
  {
    id: "abdominal",
    nome: "Banco Abdominal",
    categoria: "Abdômen",
    svg: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M8 34 L26 34 L38 16"/>
      <path d="M6 26 L20 26"/>
      <circle cx="10" cy="34" r="2.5"/>
      <circle cx="24" cy="34" r="2.5"/>
    </svg>`,
  },
];

function equipamentoPorId(id) {
  return EQUIPAMENTOS.find((e) => e.id === id);
}

const CATEGORIAS_EQUIPAMENTO = [...new Set(EQUIPAMENTOS.map((e) => e.categoria))];
