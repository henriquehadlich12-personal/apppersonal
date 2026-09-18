// ============================================================
// Logotipo — Henrique Hadlich Personal Trainer
// SVG vetorial original, então fica nítido em qualquer tamanho
// (app pequeno, splash grande, PDF impresso).
// ============================================================

const LOGO_MARK_SVG = `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="logoGradMark" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#5B8CFF"/>
      <stop offset="1" stop-color="#B98CFF"/>
    </linearGradient>
  </defs>
  <rect x="2" y="2" width="60" height="60" rx="16" fill="url(#logoGradMark)"/>
  <text x="32" y="39" font-family="system-ui, -apple-system, Segoe UI, sans-serif" font-weight="800" font-size="25" fill="#12141A" text-anchor="middle">HH</text>
  <path d="M13 49h38M19.5 45v8M44.5 45v8" stroke="#12141A" stroke-width="2.6" stroke-linecap="round" opacity="0.55"/>
</svg>`;

// currentColor no texto: fica claro em fundo escuro (topo do app,
// splash) e escuro quando convertido pra imagem no PDF (fundo branco).
const LOGO_WORDMARK_SVG = `<svg viewBox="0 0 220 46" xmlns="http://www.w3.org/2000/svg">
  <text x="0" y="20" font-family="system-ui, -apple-system, Segoe UI, sans-serif" font-weight="800" font-size="19" letter-spacing="0.3" fill="currentColor">HENRIQUE HADLICH</text>
  <text x="0" y="38" font-family="system-ui, -apple-system, Segoe UI, sans-serif" font-weight="600" font-size="11" letter-spacing="2.5" fill="#8A8F9C">PERSONAL TRAINER</text>
</svg>`;
