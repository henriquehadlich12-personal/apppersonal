// ============================================================
// Logotipo — Henrique Hadlich Personal Trainer
// SVG vetorial original, então fica nítido em qualquer tamanho
// (app pequeno, splash grande, PDF impresso).
// ============================================================

const LOGO_MARK_SVG = `<svg viewBox="0 0 64 64">
  <defs>
    <linearGradient id="logoGradMark" gradientUnits="userSpaceOnUse" x1="4" y1="60" x2="60" y2="4">
      <stop offset="0" stop-color="#2F6FEA"/>
      <stop offset="1" stop-color="#FF3D82"/>
    </linearGradient>
  </defs>
  <rect x="7" y="5" width="13" height="54" rx="3" fill="url(#logoGradMark)"/>
  <rect x="44" y="5" width="13" height="54" rx="3" fill="url(#logoGradMark)"/>
  <path d="M7 41 L20 41 L57 23 L44 23 Z" fill="url(#logoGradMark)"/>
</svg>`;

// currentColor no texto: fica claro em fundo escuro (topo do app,
// splash) e escuro quando convertido pra imagem no PDF (fundo branco).
const LOGO_WORDMARK_SVG = `<svg viewBox="0 0 220 46">
  <text x="0" y="20" font-family="system-ui, -apple-system, Segoe UI, sans-serif" font-weight="800" font-size="19" letter-spacing="0.3" fill="currentColor">HENRIQUE HADLICH</text>
  <text x="0" y="38" font-family="system-ui, -apple-system, Segoe UI, sans-serif" font-weight="600" font-size="11" letter-spacing="2.5" fill="#8A8F9C">PERSONAL TRAINER</text>
</svg>`;
