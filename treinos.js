// ============================================================
// Treinos — montagem de fichas de treino e geração de PDF
// ============================================================

const NOME_PERSONAL = "Henrique Mateus Hadlich";

let treinosInicializado = false;
let alunoTreinoSelecionadoId = null;
let categoriaAtiva = "Todos";
let treinoDraftItems = []; // { equipamento_id, series, repeticoes, carga, observacoes, video_url }
let equipamentoEmEdicao = null;
let equipamentoFotosCache = {}; // { equipamento_id: foto_url }
let equipamentoUploadAtual = null;
let treinoEmEdicaoId = null;

function calcularIdade(dataNascimento) {
  if (!dataNascimento) return null;
  const hoje = new Date();
  const nasc = new Date(dataNascimento + "T00:00:00");
  let idade = hoje.getFullYear() - nasc.getFullYear();
  const aindaNaoFezAniversario =
    hoje.getMonth() < nasc.getMonth() ||
    (hoje.getMonth() === nasc.getMonth() && hoje.getDate() < nasc.getDate());
  if (aindaNaoFezAniversario) idade--;
  return idade;
}

async function carregarFotosEquipamento() {
  const { data, error } = await sb.from("equipamento_fotos").select("*");
  if (error) {
    console.error(error);
    return;
  }
  equipamentoFotosCache = Object.fromEntries(data.map((f) => [f.equipamento_id, f.foto_url]));
}

function inicializarTreinos() {
  popularSelectAlunoTreino();
  renderChipsCategoria();
  carregarFotosEquipamento().then(renderEquipGrid);
  renderEquipGrid();
  if (!treinosInicializado) {
    document.getElementById("select-aluno-treino").addEventListener("change", (e) => {
      alunoTreinoSelecionadoId = e.target.value || null;
      cancelarEdicaoTreino();
      atualizarConteudoTreino();
    });
    document.getElementById("btn-salvar-treino").addEventListener("click", salvarTreino);
    document.getElementById("btn-cancelar-item").addEventListener("click", () => {
      document.getElementById("sheet-item-treino").classList.add("is-hidden");
    });
    document.getElementById("form-item-treino").addEventListener("submit", confirmarItemTreino);
    document.getElementById("input-foto-equipamento").addEventListener("change", handleFotoEquipamentoSelecionada);
    document.getElementById("btn-excluir-todos-treinos").addEventListener("click", excluirTodosTreinos);
    document.getElementById("btn-cancelar-edicao-treino").addEventListener("click", cancelarEdicaoTreino);
    treinosInicializado = true;
  }
  atualizarConteudoTreino();
}

function popularSelectAlunoTreino() {
  const select = document.getElementById("select-aluno-treino");
  const valorAtual = select.value;
  select.innerHTML = '<option value="">Selecione um aluno...</option>';
  alunosCache.forEach((a) => {
    const opt = document.createElement("option");
    opt.value = a.id;
    opt.textContent = a.nome;
    select.appendChild(opt);
  });
  if (valorAtual) select.value = valorAtual;
}

function atualizarConteudoTreino() {
  const conteudo = document.getElementById("treino-conteudo");
  const vazio = document.getElementById("treino-aluno-vazio");
  if (!alunoTreinoSelecionadoId) {
    conteudo.classList.add("is-hidden");
    vazio.classList.remove("is-hidden");
    return;
  }
  vazio.classList.add("is-hidden");
  conteudo.classList.remove("is-hidden");
  renderAlunoHeaderCard();
  carregarHistoricoTreinos();
}

function renderAlunoHeaderCard() {
  const aluno = alunosCache.find((a) => a.id === alunoTreinoSelecionadoId);
  if (!aluno) return;
  const idade = calcularIdade(aluno.data_nascimento);
  const card = document.getElementById("aluno-header-card");
  card.innerHTML = `
    <div class="aluno-header-nome">${aluno.nome}</div>
    <div class="aluno-header-dados">
      ${idade !== null ? `<span>${idade} anos</span>` : ""}
      ${aluno.peso_kg ? `<span>${aluno.peso_kg} kg</span>` : ""}
      ${aluno.altura_m ? `<span>${aluno.altura_m} m</span>` : ""}
    </div>`;
}

// ------------------------------------------------------------
// Grade de equipamentos
// ------------------------------------------------------------

function renderChipsCategoria() {
  const container = document.getElementById("equip-categorias");
  container.innerHTML = "";
  ["Todos", ...CATEGORIAS_EQUIPAMENTO].forEach((cat) => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "chip" + (cat === categoriaAtiva ? " is-active" : "");
    chip.textContent = cat;
    chip.addEventListener("click", () => {
      categoriaAtiva = cat;
      renderChipsCategoria();
      renderEquipGrid();
    });
    container.appendChild(chip);
  });
}

function visualEquipamentoHtml(equip) {
  const foto = equipamentoFotosCache[equip.id];
  return foto
    ? `<img src="${foto}" class="equip-visual" alt="${equip.nome}" />`
    : equip.svg;
}

function renderEquipGrid() {
  const grid = document.getElementById("equip-grid");
  grid.innerHTML = "";
  const lista = categoriaAtiva === "Todos"
    ? EQUIPAMENTOS
    : EQUIPAMENTOS.filter((e) => e.categoria === categoriaAtiva);

  lista.forEach((equip) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "equip-card";
    card.innerHTML = `
      <button type="button" class="equip-card-photo-btn" aria-label="Adicionar foto real">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13.5" r="3.2"/></svg>
      </button>
      <div class="equip-icon">${visualEquipamentoHtml(equip)}</div>
      <div class="equip-nome">${equip.nome}</div>`;
    card.addEventListener("click", () => abrirSheetItemTreino(equip));
    card.querySelector(".equip-card-photo-btn").addEventListener("click", (e) => {
      e.stopPropagation();
      equipamentoUploadAtual = equip;
      document.getElementById("input-foto-equipamento").click();
    });
    grid.appendChild(card);
  });
}

async function handleFotoEquipamentoSelecionada(e) {
  const file = e.target.files[0];
  e.target.value = ""; // permite escolher o mesmo arquivo de novo depois
  if (!file || !equipamentoUploadAtual) return;

  toast("Enviando foto...");
  const extensao = file.name.split(".").pop().toLowerCase();
  const caminho = `${equipamentoUploadAtual.id}.${extensao}`;

  const { error: erroUpload } = await sb.storage
    .from("equipamentos")
    .upload(caminho, file, { upsert: true, contentType: file.type });

  if (erroUpload) {
    toast("Erro ao enviar foto — veja o README (bucket do Storage)");
    console.error(erroUpload);
    return;
  }

  const { data: urlData } = sb.storage.from("equipamentos").getPublicUrl(caminho);
  // Timestamp no final evita que o navegador mostre a foto antiga em cache
  // depois de trocar a imagem do mesmo equipamento.
  const fotoUrl = `${urlData.publicUrl}?v=${Date.now()}`;

  const { error: erroSalvar } = await sb
    .from("equipamento_fotos")
    .upsert({ equipamento_id: equipamentoUploadAtual.id, foto_url: fotoUrl });

  if (erroSalvar) {
    toast("Erro ao salvar referência da foto");
    console.error(erroSalvar);
    return;
  }

  equipamentoFotosCache[equipamentoUploadAtual.id] = fotoUrl;
  toast("Foto atualizada");
  renderEquipGrid();
}

// ------------------------------------------------------------
// Sheet para configurar séries/reps/carga/obs de um equipamento
// ------------------------------------------------------------

function abrirSheetItemTreino(equip) {
  equipamentoEmEdicao = equip;
  document.getElementById("sheet-item-titulo").textContent = equip.nome;
  document.getElementById("form-item-treino").reset();
  document.getElementById("input-item-series").value = 3;
  document.getElementById("sheet-item-treino").classList.remove("is-hidden");
}

function confirmarItemTreino(e) {
  e.preventDefault();
  treinoDraftItems.push({
    equipamento_id: equipamentoEmEdicao.id,
    series: parseInt(document.getElementById("input-item-series").value || "0", 10) || null,
    repeticoes: document.getElementById("input-item-reps").value || null,
    carga: document.getElementById("input-item-carga").value || null,
    observacoes: document.getElementById("input-item-obs").value || null,
    video_url: document.getElementById("input-item-video").value || null,
  });
  document.getElementById("sheet-item-treino").classList.add("is-hidden");
  renderTreinoDraftList();
}

function renderTreinoDraftList() {
  const container = document.getElementById("treino-draft-list");
  const vazio = document.getElementById("treino-draft-vazio");
  container.innerHTML = "";

  if (treinoDraftItems.length === 0) {
    vazio.classList.remove("is-hidden");
    return;
  }
  vazio.classList.add("is-hidden");

  treinoDraftItems.forEach((item, index) => {
    const equip = equipamentoPorId(item.equipamento_id);
    const row = document.createElement("div");
    row.className = "draft-item";
    row.innerHTML = `
      <div class="equip-icon equip-icon-sm">${visualEquipamentoHtml(equip)}</div>
      <div class="draft-item-info">
        <div class="draft-item-nome">${equip.nome}</div>
        <div class="draft-item-sub">
          ${item.series ? item.series + "x " : ""}${item.repeticoes || ""}${item.carga ? " · " + item.carga : ""}
        </div>
        ${item.observacoes ? `<div class="draft-item-obs">${item.observacoes}</div>` : ""}
        ${item.video_url ? `<a href="${item.video_url}" target="_blank" rel="noopener" class="draft-item-video">Link de apoio: ${item.video_url}</a>` : ""}
      </div>
      <button type="button" class="icon-action icon-action-danger" aria-label="Remover">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
      </button>`;
    row.querySelector("button").addEventListener("click", () => {
      treinoDraftItems.splice(index, 1);
      renderTreinoDraftList();
    });
    container.appendChild(row);
  });
}

// ------------------------------------------------------------
// Salvar treino no Supabase
// ------------------------------------------------------------

function editarTreino(treino) {
  treinoEmEdicaoId = treino.id;
  treinoDraftItems = [...treino.treino_itens]
    .sort((a, b) => a.ordem - b.ordem)
    .map((i) => ({
      equipamento_id: i.equipamento_id,
      series: i.series,
      repeticoes: i.repeticoes,
      carga: i.carga,
      observacoes: i.observacoes,
      video_url: i.video_url,
    }));
  document.getElementById("input-treino-titulo").value = treino.titulo || "";
  document.getElementById("btn-salvar-treino").textContent = "Salvar alterações";
  document.getElementById("btn-cancelar-edicao-treino").classList.remove("is-hidden");
  renderTreinoDraftList();
  toast("Editando treino — ajuste e salve");
  document.getElementById("treino-conteudo").scrollIntoView({ behavior: "smooth", block: "start" });
}

function cancelarEdicaoTreino() {
  treinoEmEdicaoId = null;
  treinoDraftItems = [];
  document.getElementById("input-treino-titulo").value = "";
  document.getElementById("btn-salvar-treino").textContent = "Salvar treino";
  document.getElementById("btn-cancelar-edicao-treino").classList.add("is-hidden");
  renderTreinoDraftList();
}

async function salvarTreino() {
  if (!alunoTreinoSelecionadoId) {
    toast("Selecione um aluno");
    return;
  }
  if (treinoDraftItems.length === 0) {
    toast("Adicione ao menos um equipamento");
    return;
  }

  const titulo = document.getElementById("input-treino-titulo").value || null;
  let treinoId;

  if (treinoEmEdicaoId) {
    // Ao editar, zera o pdf_url — o PDF/link antigo não reflete mais
    // o treino atualizado, então o botão de WhatsApp só volta quando
    // um novo PDF for gerado.
    const { error: erroUpdate } = await sb
      .from("treinos")
      .update({ titulo, pdf_url: null })
      .eq("id", treinoEmEdicaoId);
    if (erroUpdate) {
      toast("Erro ao salvar treino");
      console.error(erroUpdate);
      return;
    }
    const { error: erroDelItens } = await sb.from("treino_itens").delete().eq("treino_id", treinoEmEdicaoId);
    if (erroDelItens) {
      toast("Erro ao atualizar exercícios");
      console.error(erroDelItens);
      return;
    }
    treinoId = treinoEmEdicaoId;
  } else {
    const { data: treino, error: erroTreino } = await sb
      .from("treinos")
      .insert([{ aluno_id: alunoTreinoSelecionadoId, titulo }])
      .select()
      .single();
    if (erroTreino) {
      toast("Erro ao salvar treino");
      console.error(erroTreino);
      return;
    }
    treinoId = treino.id;
  }

  const itens = treinoDraftItems.map((item, index) => ({
    treino_id: treinoId,
    ordem: index,
    ...item,
  }));

  const { error: erroItens } = await sb.from("treino_itens").insert(itens);
  if (erroItens) {
    toast("Erro ao salvar exercícios do treino");
    console.error(erroItens);
    return;
  }

  toast(treinoEmEdicaoId ? "Treino atualizado" : "Treino salvo");
  treinoEmEdicaoId = null;
  document.getElementById("btn-salvar-treino").textContent = "Salvar treino";
  document.getElementById("btn-cancelar-edicao-treino").classList.add("is-hidden");
  treinoDraftItems = [];
  document.getElementById("input-treino-titulo").value = "";
  renderTreinoDraftList();
  carregarHistoricoTreinos();
}

// ------------------------------------------------------------
// Histórico de treinos do aluno
// ------------------------------------------------------------

async function carregarHistoricoTreinos() {
  const { data, error } = await sb
    .from("treinos")
    .select("*, treino_itens(*)")
    .eq("aluno_id", alunoTreinoSelecionadoId)
    .order("criado_em", { ascending: false });

  if (error) {
    toast("Erro ao carregar treinos");
    console.error(error);
    return;
  }
  renderHistoricoTreinos(data);
}

function renderHistoricoTreinos(treinos) {
  const container = document.getElementById("treinos-historico");
  container.innerHTML = "";

  if (treinos.length === 0) {
    container.innerHTML = `<p class="empty-hint">Nenhum treino salvo ainda para este aluno.</p>`;
    return;
  }

  treinos.forEach((treino) => {
    const dataFormatada = new Date(treino.criado_em).toLocaleDateString("pt-BR");
    const card = document.createElement("div");
    card.className = "historico-card";
    card.innerHTML = `
      <div class="historico-info">
        <div class="historico-titulo">${treino.titulo || "Treino sem nome"}</div>
        <div class="historico-sub">${dataFormatada} · ${treino.treino_itens.length} exercícios</div>
      </div>
      <div class="historico-actions">
        <button class="secondary-btn historico-btn" data-action="pdf">Gerar PDF</button>
        <a class="whatsapp-mini-btn ${treino.pdf_url ? "" : "is-disabled"}" data-action="whats" href="#">WhatsApp</a>
        <button class="historico-delete-btn" data-action="editar" aria-label="Editar treino">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
        </button>
        <button class="historico-delete-btn" data-action="excluir" aria-label="Excluir treino">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
        </button>
      </div>`;

    card.querySelector('[data-action="pdf"]').addEventListener("click", () => gerarPdfTreino(treino));
    card.querySelector('[data-action="editar"]').addEventListener("click", () => editarTreino(treino));

    const btnWhats = card.querySelector('[data-action="whats"]');
    btnWhats.addEventListener("click", (e) => {
      e.preventDefault();
      if (!treino.pdf_url) {
        toast("Gere o PDF primeiro para liberar o envio");
        return;
      }
      const aluno = alunosCache.find((a) => a.id === alunoTreinoSelecionadoId);
      const texto = encodeURIComponent(`Olá ${aluno.nome}! Segue seu treino: ${treino.pdf_url}`);
      window.open(`${buildWhatsappLink(aluno.telefone)}?text=${texto}`, "_blank");
    });

    card.querySelector('[data-action="excluir"]').addEventListener("click", () => excluirTreino(treino));

    container.appendChild(card);
  });
}

async function excluirTreino(treino) {
  if (!confirm(`Excluir o treino "${treino.titulo || "sem nome"}"?`)) return;
  const { error } = await sb.from("treinos").delete().eq("id", treino.id);
  if (error) {
    toast("Erro ao excluir treino");
    console.error(error);
    return;
  }
  toast("Treino excluído");
  carregarHistoricoTreinos();
}

async function excluirTodosTreinos() {
  if (!alunoTreinoSelecionadoId) return;
  const aluno = alunosCache.find((a) => a.id === alunoTreinoSelecionadoId);
  if (!confirm(`Excluir TODOS os treinos salvos de ${aluno ? aluno.nome : "este aluno"}? Essa ação não pode ser desfeita.`)) return;

  const { error } = await sb.from("treinos").delete().eq("aluno_id", alunoTreinoSelecionadoId);
  if (error) {
    toast("Erro ao excluir treinos");
    console.error(error);
    return;
  }
  toast("Treinos excluídos");
  carregarHistoricoTreinos();
}

// ------------------------------------------------------------
// Conversão de imagens (croqui/foto/logo) para uso no PDF
// ------------------------------------------------------------

function desenharFundoArredondado(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// Carrega qualquer imagem (foto real ou croqui) e devolve um PNG
// quadrado, sempre do mesmo tamanho — recorte "cover", então uma
// foto retrato, paisagem ou quadrada saem todas uniformes.
function carregarImagemQuadrada(src, tamanho, comCrossOrigin) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (comCrossOrigin) img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = tamanho;
      canvas.height = tamanho;
      const ctx = canvas.getContext("2d");
      desenharFundoArredondado(ctx, 1, 1, tamanho - 2, tamanho - 2, tamanho * 0.16);
      ctx.fillStyle = "#EEF2FF";
      ctx.fill();
      ctx.save();
      desenharFundoArredondado(ctx, 1, 1, tamanho - 2, tamanho - 2, tamanho * 0.16);
      ctx.clip();
      const escala = Math.max(tamanho / img.naturalWidth, tamanho / img.naturalHeight);
      const w = img.naturalWidth * escala;
      const h = img.naturalHeight * escala;
      ctx.drawImage(img, (tamanho - w) / 2, (tamanho - h) / 2, w, h);
      ctx.restore();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = "#5B8CFF";
      desenharFundoArredondado(ctx, 1, 1, tamanho - 2, tamanho - 2, tamanho * 0.16);
      ctx.stroke();
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = reject;
    img.src = src;
  });
}

function svgComNamespaceEtamanho(svgString, largura, altura) {
  const comNamespace = svgString.replace("<svg ", `<svg xmlns="http://www.w3.org/2000/svg" width="${largura}" height="${altura}" `);
  return "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(comNamespace)));
}

async function iconeOuFotoParaPng(equip, tamanho) {
  if (!equip) return null;
  const fotoUrl = equipamentoFotosCache[equip.id];
  if (fotoUrl) {
    try {
      return await carregarImagemQuadrada(fotoUrl, tamanho, true);
    } catch (e) {
      console.warn(`Falha ao carregar foto de "${equip.nome}" (${fotoUrl}) — usando croqui`, e);
    }
  }
  try {
    return await carregarImagemQuadrada(svgComNamespaceEtamanho(equip.svg, 48, 48), tamanho);
  } catch (e) {
    console.warn(`Falha ao carregar croqui de "${equip.nome}"`, e);
    return null;
  }
}

async function precarregarIconesPdf(itens) {
  const idsUnicos = [...new Set(itens.map((i) => i.equipamento_id))];
  const pares = await Promise.all(
    idsUnicos.map(async (id) => {
      try {
        return [id, await iconeOuFotoParaPng(equipamentoPorId(id), 220)];
      } catch (e) {
        console.warn(`Falha total ao preparar imagem do equipamento ${id}`, e);
        return [id, null];
      }
    })
  );
  return Object.fromEntries(pares);
}

function logoMarcaParaPng(tamanho) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = tamanho;
      canvas.height = tamanho;
      canvas.getContext("2d").drawImage(img, 0, 0, tamanho, tamanho);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = reject;
    img.src = svgComNamespaceEtamanho(LOGO_MARK_SVG, tamanho, tamanho);
  });
}

// ------------------------------------------------------------
// Geração do PDF (client-side, com jsPDF) + upload ao Drive
// ------------------------------------------------------------

async function gerarPdfTreino(treino) {
  if (typeof window.jspdf === "undefined") {
    toast("Biblioteca de PDF não carregada — veja o README");
    return;
  }
  const aluno = alunosCache.find((a) => a.id === alunoTreinoSelecionadoId);
  const itensOrdenados = [...treino.treino_itens].sort((a, b) => a.ordem - b.ordem);

  toast("Montando PDF...");
  let iconesPng = {};
  let logoPng = null;
  try {
    iconesPng = await precarregarIconesPdf(itensOrdenados);
  } catch (err) {
    console.warn("Falha ao preparar ícones do PDF — seguindo sem eles", err);
  }
  try {
    logoPng = await logoMarcaParaPng(96);
  } catch (err) {
    console.warn("Falha ao preparar o logo do PDF — seguindo sem ele", err);
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "pt", format: "a4" });

  const larguraPagina = doc.internal.pageSize.getWidth();
  const alturaPagina = doc.internal.pageSize.getHeight();
  const margem = 40;
  let y = 0;

  // ---------- Cabeçalho ----------
  const alturaHeader = 96;
  doc.setFillColor(18, 20, 26);
  doc.rect(0, 0, larguraPagina, alturaHeader, "F");
  doc.setFillColor(91, 140, 255);
  doc.rect(0, alturaHeader - 3, larguraPagina, 3, "F");

  if (logoPng) {
    doc.addImage(logoPng, "PNG", margem, 24, 40, 40);
  }
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("HENRIQUE HADLICH", margem + 52, 42);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(180, 186, 199);
  if (doc.setCharSpace) doc.setCharSpace(1.4);
  doc.text("PERSONAL TRAINER", margem + 52, 56);
  if (doc.setCharSpace) doc.setCharSpace(0);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text("Ficha de Treino", larguraPagina - margem, 48, { align: "right" });

  y = alturaHeader + 30;

  // ---------- Card do aluno ----------
  const alturaCardAluno = 74;
  doc.setDrawColor(230, 230, 230);
  doc.setFillColor(247, 247, 249);
  doc.roundedRect(margem, y, larguraPagina - margem * 2, alturaCardAluno, 10, 10, "FD");

  doc.setFillColor(91, 140, 255);
  doc.circle(margem + 32, y + 37, 20, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(aluno.nome.charAt(0).toUpperCase(), margem + 32, y + 42, { align: "center" });

  doc.setTextColor(20, 20, 20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(aluno.nome, margem + 64, y + 30);

  const idade = calcularIdade(aluno.data_nascimento);
  const pills = [];
  if (idade !== null) pills.push(`${idade} anos`);
  if (aluno.peso_kg) pills.push(`${aluno.peso_kg} kg`);
  if (aluno.altura_m) pills.push(`${aluno.altura_m} m`);

  let pillX = margem + 64;
  const pillY = y + 42;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  pills.forEach((texto) => {
    const largura = doc.getTextWidth(texto) + 16;
    doc.setFillColor(228, 235, 255);
    doc.roundedRect(pillX, pillY, largura, 18, 9, 9, "F");
    doc.setTextColor(60, 90, 200);
    doc.text(texto, pillX + largura / 2, pillY + 12.5, { align: "center" });
    pillX += largura + 8;
  });

  y += alturaCardAluno + 26;

  if (treino.titulo) {
    doc.setDrawColor(91, 140, 255);
    doc.setLineWidth(2.5);
    doc.line(margem, y, margem + 26, y);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(20, 20, 20);
    doc.text(treino.titulo, margem + 34, y + 4);
    y += 26;
  }

  // ---------- Lista de exercícios (zebra + ícone/foto + vídeo) ----------
  const iconeTamanho = 68;
  const larguraTexto = larguraPagina - margem - (margem + iconeTamanho + 22) - 14;

  itensOrdenados.forEach((item, index) => {
    const equip = equipamentoPorId(item.equipamento_id);
    const temVideo = !!item.video_url;
    const textoX = margem + iconeTamanho + 22;

    // Quebra cada trecho de texto no espaço disponível ANTES de saber
    // a altura do bloco — assim nada fica cortado ou vazando pra fora.
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    const linhasTitulo = doc.splitTextToSize(`${index + 1}. ${equip ? equip.nome : "Equipamento"}`, larguraTexto);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const detalhes = [
      item.series ? `${item.series} séries` : null,
      item.repeticoes ? `${item.repeticoes} repetições` : null,
      item.carga ? `Carga: ${item.carga}` : null,
    ].filter(Boolean).join("   ·   ");
    const linhasDetalhes = detalhes ? doc.splitTextToSize(detalhes, larguraTexto) : [];

    doc.setFont("helvetica", "italic");
    doc.setFontSize(9.5);
    const linhasObs = item.observacoes ? doc.splitTextToSize(item.observacoes, larguraTexto) : [];

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    const linhasVideo = temVideo ? doc.splitTextToSize(`Link de apoio: ${item.video_url}`, larguraTexto) : [];

    const alturaTexto =
      linhasTitulo.length * 15 +
      linhasDetalhes.length * 13 +
      linhasObs.length * 12 +
      linhasVideo.length * 12 +
      10;
    const alturaBloco = Math.max(iconeTamanho + 16, alturaTexto);

    if (y + alturaBloco > alturaPagina - 60) {
      doc.addPage();
      y = 50;
    }

    if (index % 2 === 0) {
      doc.setFillColor(248, 248, 250);
      doc.rect(margem, y, larguraPagina - margem * 2, alturaBloco, "F");
    }

    const png = iconesPng[item.equipamento_id];
    if (png) {
      doc.addImage(png, "PNG", margem + 6, y + (alturaBloco - iconeTamanho) / 2, iconeTamanho, iconeTamanho);
    }

    let linhaY = y + 18;

    doc.setTextColor(20, 20, 20);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(linhasTitulo, textoX, linhaY);
    linhaY += linhasTitulo.length * 15;

    if (linhasDetalhes.length) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(linhasDetalhes, textoX, linhaY);
      linhaY += linhasDetalhes.length * 13;
    }

    if (linhasObs.length) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(9.5);
      doc.setTextColor(140, 140, 140);
      doc.text(linhasObs, textoX, linhaY);
      linhaY += linhasObs.length * 12;
    }

    if (temVideo) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(91, 140, 255);
      linhasVideo.forEach((linha) => {
        doc.textWithLink(linha, textoX, linhaY, { url: item.video_url });
        linhaY += 12;
      });
    }

    y += alturaBloco + 8;
  });

  // ---------- Rodapé (com contagem total de páginas) ----------
  const totalPaginas = doc.internal.getNumberOfPages();
  for (let p = 1; p <= totalPaginas; p++) {
    doc.setPage(p);
    doc.setDrawColor(230, 230, 230);
    doc.setLineWidth(0.5);
    doc.line(margem, alturaPagina - 34, larguraPagina - margem, alturaPagina - 34);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(150, 150, 150);
    doc.text(`${NOME_PERSONAL} · Personal Trainer`, margem, alturaPagina - 20);
    doc.text(`Página ${p} de ${totalPaginas}`, larguraPagina - margem, alturaPagina - 20, { align: "right" });
  }

  const nomeArquivo = `treino-${aluno.nome.toLowerCase().replace(/\s+/g, "-")}-${isoDate(new Date())}.pdf`;
  doc.save(nomeArquivo);

  toast("Enviando PDF para o Google Drive...");
  try {
    const blob = doc.output("blob");
    const { link } = await uploadPdfParaDrive(blob, nomeArquivo);
    const { error } = await sb.from("treinos").update({ pdf_url: link }).eq("id", treino.id);
    if (error) throw error;
    toast("PDF salvo no Drive!");
    carregarHistoricoTreinos();
  } catch (err) {
    console.error(err);
    toast("PDF baixado, mas o envio ao Drive falhou");
  }
}
