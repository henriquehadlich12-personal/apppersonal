// Seletor moderno de aluno: troca a lista nativa por botão + folha com busca.
// O <select> original continua existindo (escondido), então a lógica do app não muda.
(function () {
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
