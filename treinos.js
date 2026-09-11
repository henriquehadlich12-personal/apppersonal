// ============================================================
// Treinos — montagem de fichas de treino e geração de PDF
// ============================================================

const NOME_PERSONAL = "Henrique Mateus Hadlich";

let treinosInicializado = false;
let alunoTreinoSelecionadoId = null;
let categoriaAtiva = "Todos";
let treinoDraftItems = []; // { equipamento_id, series, repeticoes, carga, observacoes }
let equipamentoEmEdicao = null;

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

function inicializarTreinos() {
  popularSelectAlunoTreino();
  renderChipsCategoria();
  renderEquipGrid();
  if (!treinosInicializado) {
    document.getElementById("select-aluno-treino").addEventListener("change", (e) => {
      alunoTreinoSelecionadoId = e.target.value || null;
      treinoDraftItems = [];
      renderTreinoDraftList();
      atualizarConteudoTreino();
    });
    document.getElementById("btn-salvar-treino").addEventListener("click", salvarTreino);
    document.getElementById("btn-cancelar-item").addEventListener("click", () => {
      document.getElementById("sheet-item-treino").classList.add("is-hidden");
    });
    document.getElementById("form-item-treino").addEventListener("submit", confirmarItemTreino);
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
      ${aluno.altura_cm ? `<span>${aluno.altura_cm} cm</span>` : ""}
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
    card.innerHTML = `<div class="equip-icon">${equip.svg}</div><div class="equip-nome">${equip.nome}</div>`;
    card.addEventListener("click", () => abrirSheetItemTreino(equip));
    grid.appendChild(card);
  });
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
      <div class="equip-icon equip-icon-sm">${equip.svg}</div>
      <div class="draft-item-info">
        <div class="draft-item-nome">${equip.nome}</div>
        <div class="draft-item-sub">
          ${item.series ? item.series + "x " : ""}${item.repeticoes || ""}${item.carga ? " · " + item.carga : ""}
        </div>
        ${item.observacoes ? `<div class="draft-item-obs">${item.observacoes}</div>` : ""}
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

  const itens = treinoDraftItems.map((item, index) => ({
    treino_id: treino.id,
    ordem: index,
    ...item,
  }));

  const { error: erroItens } = await sb.from("treino_itens").insert(itens);
  if (erroItens) {
    toast("Erro ao salvar exercícios do treino");
    console.error(erroItens);
    return;
  }

  toast("Treino salvo");
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
      </div>`;

    card.querySelector('[data-action="pdf"]').addEventListener("click", () => gerarPdfTreino(treino));

    const btnWhats = card.querySelector('[data-action="whats"]');
    btnWhats.addEventListener("click", (e) => {
      e.preventDefault();
      if (!treino.pdf_url) {
        toast("Gere o PDF e configure o Google Drive primeiro");
        return;
      }
      const aluno = alunosCache.find((a) => a.id === alunoTreinoSelecionadoId);
      const texto = encodeURIComponent(`Olá ${aluno.nome}! Segue seu treino: ${treino.pdf_url}`);
      window.open(`${buildWhatsappLink(aluno.telefone)}?text=${texto}`, "_blank");
    });

    container.appendChild(card);
  });
}

// ------------------------------------------------------------
// Ícone do equipamento como imagem (usado dentro do PDF)
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

function svgParaPng(svgString, tamanho) {
  return new Promise((resolve, reject) => {
    const svgComNamespace = svgString.replace("<svg ", '<svg xmlns="http://www.w3.org/2000/svg" ');
    const svg64 = btoa(unescape(encodeURIComponent(svgComNamespace)));
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = tamanho;
      canvas.height = tamanho;
      const ctx = canvas.getContext("2d");
      // selo colorido atrás do croqui — deixa o ícone com cara de
      // "acabado" em vez de rascunho solto no papel
      desenharFundoArredondado(ctx, 1, 1, tamanho - 2, tamanho - 2, tamanho * 0.18);
      ctx.fillStyle = "#EEF2FF";
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = "#5B8CFF";
      ctx.stroke();
      const pad = tamanho * 0.18;
      ctx.drawImage(img, pad, pad, tamanho - pad * 2, tamanho - pad * 2);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = reject;
    img.src = "data:image/svg+xml;base64," + svg64;
  });
}

async function precarregarIconesPdf(itens) {
  const idsUnicos = [...new Set(itens.map((i) => i.equipamento_id))];
  const pares = await Promise.all(
    idsUnicos.map(async (id) => {
      const equip = equipamentoPorId(id);
      if (!equip) return [id, null];
      const png = await svgParaPng(equip.svg, 120);
      return [id, png];
    })
  );
  return Object.fromEntries(pares);
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
  const iconesPng = await precarregarIconesPdf(itensOrdenados);

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "pt", format: "a4" });

  const larguraPagina = doc.internal.pageSize.getWidth();
  const margem = 40;
  let y = 0;

  // Cabeçalho
  doc.setFillColor(18, 20, 26);
  doc.rect(0, 0, larguraPagina, 90, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("Ficha de Treino", margem, 42);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(200, 205, 215);
  doc.text(`Personal Trainer: ${NOME_PERSONAL}`, margem, 64);

  y = 120;

  // Card do aluno
  doc.setDrawColor(230, 230, 230);
  doc.setFillColor(247, 247, 249);
  doc.roundedRect(margem, y, larguraPagina - margem * 2, 70, 8, 8, "FD");
  doc.setTextColor(20, 20, 20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(aluno.nome, margem + 16, y + 28);

  const idade = calcularIdade(aluno.data_nascimento);
  const infoPartes = [];
  if (idade !== null) infoPartes.push(`${idade} anos`);
  if (aluno.peso_kg) infoPartes.push(`${aluno.peso_kg} kg`);
  if (aluno.altura_cm) infoPartes.push(`${aluno.altura_cm} cm`);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(90, 90, 90);
  doc.text(infoPartes.join("   ·   "), margem + 16, y + 48);

  y += 100;

  if (treino.titulo) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(20, 20, 20);
    doc.text(treino.titulo, margem, y);
    y += 24;
  }

  const iconeTamanho = 40;

  itensOrdenados.forEach((item, index) => {
    const equip = equipamentoPorId(item.equipamento_id);
    const alturaBloco = item.observacoes ? 62 : 50;

    if (y + alturaBloco > doc.internal.pageSize.getHeight() - 50) {
      doc.addPage();
      y = 50;
    }

    doc.setDrawColor(225, 225, 225);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(margem, y, larguraPagina - margem * 2, alturaBloco, 6, 6, "FD");

    const png = iconesPng[item.equipamento_id];
    if (png) {
      doc.addImage(png, "PNG", margem + 8, y + (alturaBloco - iconeTamanho) / 2, iconeTamanho, iconeTamanho);
    }

    const textoX = margem + iconeTamanho + 20;

    doc.setTextColor(20, 20, 20);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(`${index + 1}. ${equip ? equip.nome : "Equipamento"}`, textoX, y + 22);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    const detalhes = [
      item.series ? `${item.series} séries` : null,
      item.repeticoes ? `${item.repeticoes} repetições` : null,
      item.carga ? `Carga: ${item.carga}` : null,
    ].filter(Boolean).join("   ·   ");
    doc.text(detalhes, textoX, y + 38);

    if (item.observacoes) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(9.5);
      doc.setTextColor(140, 140, 140);
      doc.text(item.observacoes, textoX, y + 53);
    }

    y += alturaBloco + 10;
  });

  const dataGeracao = new Date().toLocaleDateString("pt-BR");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(160, 160, 160);
  doc.text(`Gerado em ${dataGeracao}`, margem, doc.internal.pageSize.getHeight() - 24);

  const nomeArquivo = `treino-${aluno.nome.toLowerCase().replace(/\s+/g, "-")}-${isoDate(new Date())}.pdf`;
  doc.save(nomeArquivo);

  if (typeof GOOGLE_CLIENT_ID === "undefined" || GOOGLE_CLIENT_ID.includes("COLE_AQUI")) {
    toast("PDF baixado. Configure o Google Drive no config.js para envio automático.");
    return;
  }

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
