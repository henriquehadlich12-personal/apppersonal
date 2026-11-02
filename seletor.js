// Seletor moderno de aluno: troca a lista nativa por botão + folha com busca.
// O <select> original continua existindo (escondido), então a lógica do app não muda.
(function () {
  const STYLE_SELETOR = `
.seletor-btn { width: 100%; display: flex; align-items: center; gap: 12px; padding: 10px 14px 10px 10px; background: #fff; border: 1px solid var(--border); border-radius: 18px; box-shadow: var(--sombra); font: inherit; color: var(--text); text-align: left; cursor: pointer; }
.seletor-btn:active { transform: scale(0.99); }
.seletor-btn .aluno-avatar { width: 38px; height: 38px; flex: none; }
.seletor-nome { flex: 1; font-weight: 700; font-size: 16px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.seletor-ph { color: var(--text-muted); font-weight: 500; }
.seletor-seta { color: #2563EB; font-size: 16px; }
.seletor-vazio { background: linear-gradient(135deg, #2563EB, #06B6D4) !important; color: #fff !important; font-size: 20px; }
#sheet-seletor { z-index: 70; }
#sheet-seletor .sheet { max-height: 80vh; display: flex; flex-direction: column; }
.seletor-busca { margin-bottom: 10px; }
.seletor-lista { overflow-y: auto; display: flex; flex-direction: column; gap: 6px; padding-bottom: 8px; -webkit-overflow-scrolling: touch; }
.seletor-item { display: flex; align-items: center; gap: 12px; padding: 10px 12px; background: #fff; border: 1px solid var(--border); border-radius: 16px; font: inherit; color: var(--text); text-align: left; cursor: pointer; }
.seletor-item .aluno-avatar { width: 38px; height: 38px; flex: none; }
.seletor-item .seletor-check { visibility: hidden; color: #fff; background: linear-gradient(135deg, #2563EB, #06B6D4); width: 22px; height: 22px; border-radius: 50%; display: grid; place-items: center; font-size: 13px; }
.seletor-item.is-sel { border-color: #2563EB; background: #EEF4FF; }
.seletor-item.is-sel .seletor-check { visibility: visible; }

.seletor-btn, .seletor-item { -webkit-appearance: none; appearance: none; box-sizing: border-box; margin: 0; }
.seletor-btn { min-height: 56px; }
.seletor-item { width: 100%; }
.seletor-lista { flex: 1 1 auto; min-height: 0; }
.seletor-busca { width: 100%; box-sizing: border-box; }
.seletor-seta { font-size: 14px; }
.seletor-item .seletor-nome { font-size: 16px; }
`;
  const st = document.createElement('style'); st.textContent = STYLE_SELETOR; document.head.appendChild(st);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const ini = (n) => (n || "?").trim().charAt(0).toUpperCase();
  let overlay;

  function getOverlay() {
    if (overlay) return overlay;
    overlay = document.createElement("div");
    overlay.className = "sheet-overlay is-hidden";
    overlay.id = "sheet-seletor";
    overlay.innerHTML = `<div class="sheet"><div class="sheet-handle"></div>
      <h2>Escolher aluno</h2>
      <input type="search" class="field-input seletor-busca" placeholder="Buscar aluno..." autocomplete="off">
      <div class="seletor-lista"></div></div>`;
    document.body.appendChild(overlay);
    overlay.addEventListener("click", (e) => { if (e.target === overlay) overlay.classList.add("is-hidden"); });
    return overlay;
  }

  function abrir(select) {
    const ov = getOverlay();
    const lista = ov.querySelector(".seletor-lista");
    const busca = ov.querySelector(".seletor-busca");
    const opcoes = [...select.options].filter((o) => o.value);
    function render() {
      const q = busca.value.trim().toLowerCase();
      const itens = opcoes.filter((o) => o.textContent.toLowerCase().includes(q));
      lista.innerHTML = itens.length ? itens.map((o) => `
        <button type="button" class="seletor-item${o.value === select.value ? " is-sel" : ""}" data-v="${esc(o.value)}">
          <span class="aluno-avatar">${esc(ini(o.textContent))}</span>
          <span class="seletor-nome">${esc(o.textContent)}</span>
          <span class="seletor-check">✓</span>
        </button>`).join("") : '<p class="empty-hint">Nenhum aluno encontrado.</p>';
    }
    busca.value = "";
    render();
    busca.oninput = render;
    lista.onclick = (e) => {
      const b = e.target.closest(".seletor-item");
      if (!b) return;
      select.value = b.dataset.v;
      select.dispatchEvent(new Event("change", { bubbles: true }));
      ov.classList.add("is-hidden");
    };
    ov.classList.remove("is-hidden");
  }

  function modernizar(id) {
    const select = document.getElementById(id);
    if (!select || select.dataset.seletor) return;
    select.dataset.seletor = "1";
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "seletor-btn";
    select.insertAdjacentElement("afterend", btn);
    select.classList.add("is-hidden");
    function atualizar() {
      const o = select.options[select.selectedIndex];
      const tem = o && o.value;
      btn.innerHTML = tem
        ? `<span class="aluno-avatar">${esc(ini(o.textContent))}</span><span class="seletor-nome">${esc(o.textContent)}</span><span class="seletor-seta">▾</span>`
        : `<span class="aluno-avatar seletor-vazio">+</span><span class="seletor-nome seletor-ph">Selecione um aluno...</span><span class="seletor-seta">▾</span>`;
    }
    // atualiza também quando o código muda select.value / as opções
    const desc = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value");
    Object.defineProperty(select, "value", { get() { return desc.get.call(this); }, set(v) { desc.set.call(this, v); atualizar(); }, configurable: true });
    new MutationObserver(atualizar).observe(select, { childList: true });
    select.addEventListener("change", atualizar);
    btn.addEventListener("click", () => abrir(select));
    atualizar();
  }

  function iniciar() { modernizar("select-aluno-treino"); modernizar("select-aluno"); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar); else iniciar();
})();
