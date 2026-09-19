// ============================================================
// Agenda do Personal — lógica principal
// ============================================================

const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const START_HOUR = 6;   // primeira hora do dia
const END_HOUR = 20;    // última hora do dia (expediente vai até END_HOUR + 1)
const SLOT_MINUTOS = 30; // granularidade da agenda — marca de 30 em 30 min

const INICIO_MIN = START_HOUR * 60;
const FIM_MIN = (END_HOUR + 1) * 60;

function minutosParaHora(min) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0");
}

let currentDate = new Date();
let alunosCache = [];
let agendamentosDoDia = [];
let tipoSelecionado = "personal";
let editandoId = null;

// ------------------------------------------------------------
// Utilidades
// ------------------------------------------------------------

function isoDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function horaCurta(t) {
  // "07:00:00" -> "07:00"
  return t ? t.slice(0, 5) : "";
}

function timeToMin(t) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

const ICONS = {
  personal: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6.5 6.5v11M17.5 6.5v11M2 9.5h3M2 14.5h3M19 9.5h3M19 14.5h3M6.5 12h11"/></svg>',
  avaliacao: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l2.5 2.5L16 8"/><rect x="4" y="4" width="16" height="17" rx="2.5"/></svg>',
  bloqueio: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M9 9l6 6M15 9l-6 6"/></svg>',
};

function toast(msg) {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.classList.remove("is-hidden");
  setTimeout(() => el.classList.add("is-hidden"), 2400);
}

function buildWhatsappLink(telefone) {
  let digits = (telefone || "").replace(/\D/g, "");
  if (!digits.startsWith("55")) digits = "55" + digits;
  return `https://wa.me/${digits}`;
}

const WEEKDAYS = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
const MONTHS = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

// ------------------------------------------------------------
// Navegação entre views (Agenda / Alunos)
// ------------------------------------------------------------

document.querySelectorAll(".bottom-tab").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".bottom-tab").forEach((b) => b.classList.remove("is-active"));
    btn.classList.add("is-active");
    const view = btn.dataset.view;
    document.getElementById("view-agenda").classList.toggle("is-hidden", view !== "agenda");
    document.getElementById("view-alunos").classList.toggle("is-hidden", view !== "alunos");
    document.getElementById("view-treinos").classList.toggle("is-hidden", view !== "treinos");
    document.getElementById("btn-novo-aluno").classList.toggle("is-hidden", view !== "alunos");
    if (view === "alunos") carregarAlunos();
    if (view === "treinos" && typeof inicializarTreinos === "function") inicializarTreinos();
  });
});

// ------------------------------------------------------------
// Data / Agenda do dia
// ------------------------------------------------------------

document.getElementById("btn-prev-day").addEventListener("click", () => {
  currentDate = addDays(currentDate, -1);
  carregarAgendaDoDia();
});

document.getElementById("btn-next-day").addEventListener("click", () => {
  currentDate = addDays(currentDate, 1);
  carregarAgendaDoDia();
});

document.getElementById("btn-today").addEventListener("click", () => {
  currentDate = new Date();
  carregarAgendaDoDia();
});

function renderCabecalhoData() {
  document.getElementById("date-weekday").textContent = WEEKDAYS[currentDate.getDay()];
  document.getElementById("date-full").textContent =
    `${currentDate.getDate()} de ${MONTHS[currentDate.getMonth()]}`;
}

async function carregarAgendaDoDia() {
  renderCabecalhoData();
  const { data, error } = await sb
    .from("agendamentos")
    .select("*, alunos(nome, telefone)")
    .eq("data", isoDate(currentDate))
    .order("hora_inicio", { ascending: true });

  if (error) {
    toast("Erro ao carregar agenda");
    console.error(error);
    return;
  }
  agendamentosDoDia = data;
  renderAgendaList();
}

function renderAgendaList() {
  const container = document.getElementById("agenda-list");
  container.innerHTML = "";

  for (let slotStart = INICIO_MIN; slotStart < FIM_MIN; slotStart += SLOT_MINUTOS) {
    const horaStr = minutosParaHora(slotStart);
    const slotEnd = slotStart + SLOT_MINUTOS;

    // Um agendamento "ocupa" esta linha se o intervalo dele cruza
    // com o intervalo da hora, não só se começa exatamente aqui.
    // Isso é o que faz um bloqueio de 13h às 17h preencher as 4 linhas.
    const agendamento = agendamentosDoDia.find((a) => {
      const ini = timeToMin(a.hora_inicio);
      const fim = timeToMin(a.hora_fim);
      return ini < slotEnd && fim > slotStart;
    });

    const ehContinuacao = agendamento && timeToMin(agendamento.hora_inicio) < slotStart;

    const row = document.createElement("div");
    row.className = "slot-row " + (agendamento ? agendamento.tipo : "vago") + (ehContinuacao ? " is-continuacao" : "");

    const horaEl = document.createElement("div");
    horaEl.className = "slot-hora";
    horaEl.textContent = ehContinuacao ? "" : horaStr;
    row.appendChild(horaEl);

    const info = document.createElement("div");
    info.className = "slot-info";

    if (!agendamento) {
      info.innerHTML = `<div class="slot-titulo">Vago</div>`;
      row.addEventListener("click", () => abrirSheetNovo(horaStr));
    } else if (ehContinuacao) {
      info.innerHTML = `<div class="slot-continua"></div>`;
      row.addEventListener("click", () => abrirSheetDetalhe(agendamento));
    } else if (agendamento.tipo === "bloqueio") {
      info.innerHTML = `
        <div class="slot-titulo">${agendamento.observacoes || "Bloqueio"}</div>
        <div class="slot-sub">até ${horaCurta(agendamento.hora_fim)}</div>`;
      row.addEventListener("click", () => abrirSheetDetalhe(agendamento));
    } else {
      const nome = agendamento.alunos ? agendamento.alunos.nome : "Aluno removido";
      info.innerHTML = `
        <div class="slot-titulo">${nome}</div>
        <div class="slot-sub">até ${horaCurta(agendamento.hora_fim)}${agendamento.serie_id ? " · fixo" : ""}</div>`;
      row.addEventListener("click", () => abrirSheetDetalhe(agendamento));
    }
    row.appendChild(info);

    if (agendamento && agendamento.tipo !== "vago" && !ehContinuacao) {
      const badge = document.createElement("span");
      badge.className = "slot-badge";
      badge.innerHTML = `${ICONS[agendamento.tipo]}<span>${agendamento.tipo === "personal" ? "Personal" : agendamento.tipo === "avaliacao" ? "Avaliação" : "Bloqueio"}</span>`;
      row.appendChild(badge);
    }

    container.appendChild(row);
  }
}

// ------------------------------------------------------------
// Sheet de horário — criar / detalhe
// ------------------------------------------------------------

const sheetHorario = document.getElementById("sheet-horario");
const formHorario = document.getElementById("form-horario");

function selecionarTipo(tipo) {
  tipoSelecionado = tipo;
  document.querySelectorAll(".tipo-opt").forEach((b) => b.classList.toggle("is-active", b.dataset.tipo === tipo));
  document.getElementById("campo-aluno").classList.toggle("is-hidden", tipo === "bloqueio");
  document.getElementById("campo-serie").classList.toggle("is-hidden", tipo !== "personal");
}

document.querySelectorAll(".tipo-opt").forEach((btn) => {
  btn.addEventListener("click", () => selecionarTipo(btn.dataset.tipo));
});

document.getElementById("check-serie").addEventListener("change", (e) => {
  document.getElementById("campo-serie-semanas").classList.toggle("is-hidden", !e.target.checked);
});

function popularSelectAlunos(selecionadoId) {
  const select = document.getElementById("select-aluno");
  select.innerHTML = '<option value="">Selecione um aluno...</option>';
  alunosCache.forEach((a) => {
    const opt = document.createElement("option");
    opt.value = a.id;
    opt.textContent = a.nome;
    if (a.id === selecionadoId) opt.selected = true;
    select.appendChild(opt);
  });
}

function abrirSheetNovo(horaStr) {
  editandoId = null;
  document.getElementById("sheet-horario-titulo").textContent = "Novo horário";
  document.getElementById("sheet-horario-detalhe").classList.add("is-hidden");
  formHorario.classList.remove("is-hidden");
  document.getElementById("btn-salvar-horario").textContent = "Salvar";

  formHorario.reset();
  selecionarTipo("personal");
  popularSelectAlunos(null);
  document.getElementById("input-inicio").value = horaStr;
  const [h, m] = horaStr.split(":").map(Number);
  const fimMin = h * 60 + m + SLOT_MINUTOS;
  document.getElementById("input-fim").value = minutosParaHora(fimMin);
  document.getElementById("check-serie").checked = false;
  document.getElementById("campo-serie-semanas").classList.add("is-hidden");

  sheetHorario.classList.remove("is-hidden");
}

function abrirSheetDetalhe(agendamento) {
  editandoId = agendamento.id;
  document.getElementById("sheet-horario-titulo").textContent =
    agendamento.tipo === "bloqueio" ? "Bloqueio" : agendamento.tipo === "avaliacao" ? "Avaliação" : "Personal (fixo)";
  formHorario.classList.add("is-hidden");
  const detalhe = document.getElementById("sheet-horario-detalhe");
  detalhe.classList.remove("is-hidden");

  const nome = agendamento.alunos ? agendamento.alunos.nome : null;
  document.getElementById("detalhe-info").textContent =
    `${horaCurta(agendamento.hora_inicio)} às ${horaCurta(agendamento.hora_fim)}` +
    (nome ? ` · ${nome}` : "") +
    (agendamento.observacoes ? ` · ${agendamento.observacoes}` : "");

  const btnContatar = document.getElementById("btn-contatar");
  if (agendamento.alunos && agendamento.alunos.telefone) {
    btnContatar.href = buildWhatsappLink(agendamento.alunos.telefone);
    btnContatar.classList.remove("is-hidden");
  } else {
    btnContatar.classList.add("is-hidden");
  }

  document.getElementById("btn-editar-horario").onclick = () => abrirSheetParaEditar(agendamento);

  const excluirContainer = document.getElementById("detalhe-excluir-container");
  excluirContainer.innerHTML = "";
  if (agendamento.serie_id) {
    const btnUm = document.createElement("button");
    btnUm.className = "danger-btn";
    btnUm.textContent = "Excluir só este";
    btnUm.addEventListener("click", () => excluirHorario(agendamento, "um"));

    const btnSerie = document.createElement("button");
    btnSerie.className = "danger-btn";
    btnSerie.textContent = "Excluir série (futuros)";
    btnSerie.addEventListener("click", () => excluirHorario(agendamento, "serie"));

    excluirContainer.appendChild(btnUm);
    excluirContainer.appendChild(btnSerie);
  } else {
    const btnUm = document.createElement("button");
    btnUm.className = "danger-btn";
    btnUm.textContent = "Excluir";
    btnUm.addEventListener("click", () => excluirHorario(agendamento, "um"));
    excluirContainer.appendChild(btnUm);
  }

  sheetHorario.classList.remove("is-hidden");
}

// Edição altera sempre só esta ocorrência — mesmo se fizer parte de
// uma série, não recria nem mexe nas outras datas. Por isso a opção
// de "repetir semanalmente" fica escondida aqui, ela só faz sentido
// na criação.
function abrirSheetParaEditar(agendamento) {
  editandoId = agendamento.id;
  document.getElementById("sheet-horario-titulo").textContent = "Editar horário";
  document.getElementById("sheet-horario-detalhe").classList.add("is-hidden");
  formHorario.classList.remove("is-hidden");
  document.getElementById("btn-salvar-horario").textContent = "Salvar alterações";

  selecionarTipo(agendamento.tipo);
  popularSelectAlunos(agendamento.aluno_id);
  document.getElementById("input-inicio").value = horaCurta(agendamento.hora_inicio);
  document.getElementById("input-fim").value = horaCurta(agendamento.hora_fim);
  document.getElementById("input-obs").value = agendamento.observacoes || "";
  document.getElementById("check-serie").checked = false;
  document.getElementById("campo-serie-semanas").classList.add("is-hidden");
  document.getElementById("campo-serie").classList.add("is-hidden");
}

document.getElementById("btn-fechar-detalhe").addEventListener("click", () => {
  sheetHorario.classList.add("is-hidden");
});

document.getElementById("btn-cancelar-horario").addEventListener("click", () => {
  sheetHorario.classList.add("is-hidden");
});

async function excluirHorario(agendamento, escopo) {
  const confirmMsg = escopo === "serie"
    ? "Excluir este horário e todos os futuros da mesma série?"
    : "Excluir este horário?";
  if (!confirm(confirmMsg)) return;

  let error;
  if (escopo === "serie") {
    ({ error } = await sb
      .from("agendamentos")
      .delete()
      .eq("serie_id", agendamento.serie_id)
      .gte("data", agendamento.data));
  } else {
    ({ error } = await sb.from("agendamentos").delete().eq("id", agendamento.id));
  }

  if (error) {
    toast("Erro ao excluir");
    console.error(error);
    return;
  }
  toast("Excluído");
  sheetHorario.classList.add("is-hidden");
  carregarAgendaDoDia();
}

formHorario.addEventListener("submit", async (e) => {
  e.preventDefault();

  const inicio = document.getElementById("input-inicio").value;
  const fim = document.getElementById("input-fim").value;
  const obs = document.getElementById("input-obs").value || null;
  const alunoId = document.getElementById("select-aluno").value || null;
  const emSerie = document.getElementById("check-serie").checked;
  const semanas = parseInt(document.getElementById("input-semanas").value || "1", 10);

  if (tipoSelecionado !== "bloqueio" && !alunoId) {
    toast("Selecione um aluno");
    return;
  }

  if (editandoId) {
    const linha = {
      aluno_id: tipoSelecionado === "bloqueio" ? null : alunoId,
      tipo: tipoSelecionado,
      hora_inicio: inicio,
      hora_fim: fim,
      observacoes: obs,
    };
    const { error } = await sb.from("agendamentos").update(linha).eq("id", editandoId);
    if (error) {
      toast("Erro ao salvar alterações");
      console.error(error);
      return;
    }
    toast("Horário atualizado");
    editandoId = null;
    sheetHorario.classList.add("is-hidden");
    carregarAgendaDoDia();
    return;
  }

  if (tipoSelecionado === "personal" && emSerie) {
    const serieId = crypto.randomUUID();
    const linhas = [];
    for (let i = 0; i < semanas; i++) {
      const data = addDays(currentDate, i * 7);
      linhas.push({
        aluno_id: alunoId,
        tipo: "personal",
        data: isoDate(data),
        hora_inicio: inicio,
        hora_fim: fim,
        serie_id: serieId,
        observacoes: obs,
      });
    }
    const { error } = await sb.from("agendamentos").insert(linhas);
    if (error) {
      toast("Erro ao salvar série");
      console.error(error);
      return;
    }
    toast("Série criada");
  } else {
    const linha = {
      aluno_id: tipoSelecionado === "bloqueio" ? null : alunoId,
      tipo: tipoSelecionado,
      data: isoDate(currentDate),
      hora_inicio: inicio,
      hora_fim: fim,
      serie_id: null,
      observacoes: obs,
    };
    const { error } = await sb.from("agendamentos").insert([linha]);
    if (error) {
      toast("Erro ao salvar horário");
      console.error(error);
      return;
    }
    toast("Horário salvo");
  }

  sheetHorario.classList.add("is-hidden");
  carregarAgendaDoDia();
});

// ------------------------------------------------------------
// Alunos
// ------------------------------------------------------------

const sheetAluno = document.getElementById("sheet-aluno");
const formAluno = document.getElementById("form-aluno");
let editandoAlunoId = null;

async function carregarAlunos() {
  const { data, error } = await sb.from("alunos").select("*").order("nome", { ascending: true });
  if (error) {
    toast("Erro ao carregar alunos");
    console.error(error);
    return;
  }
  alunosCache = data;
  renderAlunosList();
  renderAniversariantesHoje();
}

function renderAlunosList() {
  const container = document.getElementById("alunos-list");
  container.innerHTML = "";

  if (alunosCache.length === 0) {
    container.innerHTML = `<p style="color: var(--text-muted); font-size: 14px;">Nenhum aluno cadastrado ainda.</p>`;
    return;
  }

  alunosCache.forEach((aluno) => {
    const row = document.createElement("div");
    row.className = "aluno-row";
    const inicial = aluno.nome.trim().charAt(0).toUpperCase();
    row.innerHTML = `
      <div class="aluno-avatar">${inicial}</div>
      <div class="aluno-info">
        <div class="aluno-nome">${aluno.nome}</div>
        <div class="aluno-telefone">${aluno.telefone}</div>
      </div>
      <div class="aluno-actions">
        <button data-action="avaliacao" aria-label="Avaliação de saúde" class="icon-action">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l2.5 2.5L16 8"/><rect x="4" y="4" width="16" height="17" rx="2.5"/></svg>
        </button>
        <button data-action="editar" aria-label="Editar" class="icon-action">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
        </button>
        <button data-action="excluir" aria-label="Excluir" class="icon-action icon-action-danger">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
        </button>
      </div>`;
    row.querySelector('[data-action="avaliacao"]').addEventListener("click", () => abrirSheetAvaliacaoSaude(aluno));
    row.querySelector('[data-action="editar"]').addEventListener("click", () => abrirSheetAluno(aluno));
    row.querySelector('[data-action="excluir"]').addEventListener("click", () => excluirAluno(aluno));
    container.appendChild(row);
  });
}

document.getElementById("btn-novo-aluno").addEventListener("click", () => abrirSheetAluno(null));

function abrirSheetAluno(aluno) {
  editandoAlunoId = aluno ? aluno.id : null;
  document.getElementById("sheet-aluno-titulo").textContent = aluno ? "Editar aluno" : "Novo aluno";
  formAluno.reset();
  if (aluno) {
    document.getElementById("input-aluno-nome").value = aluno.nome;
    document.getElementById("input-aluno-telefone").value = aluno.telefone;
    document.getElementById("input-aluno-nascimento").value = aluno.data_nascimento || "";
    document.getElementById("input-aluno-peso").value = aluno.peso_kg || "";
    document.getElementById("input-aluno-altura").value = aluno.altura_m || "";
  }
  sheetAluno.classList.remove("is-hidden");
}

document.getElementById("btn-cancelar-aluno").addEventListener("click", () => {
  sheetAluno.classList.add("is-hidden");
});

formAluno.addEventListener("submit", async (e) => {
  e.preventDefault();
  const nome = document.getElementById("input-aluno-nome").value.trim();
  const telefone = document.getElementById("input-aluno-telefone").value.trim();
  const dataNascimento = document.getElementById("input-aluno-nascimento").value || null;
  const peso = document.getElementById("input-aluno-peso").value || null;
  const altura = document.getElementById("input-aluno-altura").value || null;

  const payload = {
    nome,
    telefone,
    data_nascimento: dataNascimento,
    peso_kg: peso,
    altura_m: altura,
  };

  let error;
  if (editandoAlunoId) {
    ({ error } = await sb.from("alunos").update(payload).eq("id", editandoAlunoId));
  } else {
    ({ error } = await sb.from("alunos").insert([payload]));
  }

  if (error) {
    toast("Erro ao salvar aluno");
    console.error(error);
    return;
  }
  toast("Aluno salvo");
  sheetAluno.classList.add("is-hidden");
  carregarAlunos();
});

async function excluirAluno(aluno) {
  const { count, error: countError } = await sb
    .from("agendamentos")
    .select("id", { count: "exact", head: true })
    .eq("aluno_id", aluno.id);

  if (countError) {
    toast("Erro ao verificar horários do aluno");
    console.error(countError);
    return;
  }
  if (count > 0) {
    toast("Exclua os horários deste aluno antes de removê-lo");
    return;
  }
  if (!confirm(`Excluir ${aluno.nome}?`)) return;

  const { error } = await sb.from("alunos").delete().eq("id", aluno.id);
  if (error) {
    toast("Erro ao excluir aluno");
    console.error(error);
    return;
  }
  toast("Aluno excluído");
  carregarAlunos();
}

// ------------------------------------------------------------
// Inicialização
// ------------------------------------------------------------

function renderAniversariantesHoje() {
  const hoje = new Date();
  const mes = hoje.getMonth() + 1;
  const dia = hoje.getDate();

  const aniversariantes = alunosCache.filter((a) => {
    if (!a.data_nascimento) return false;
    const [, m, d] = a.data_nascimento.split("-").map(Number);
    return m === mes && d === dia;
  });

  const banner = document.getElementById("aniversariantes-banner");
  if (aniversariantes.length === 0) {
    banner.classList.add("is-hidden");
    banner.innerHTML = "";
    return;
  }

  banner.innerHTML = aniversariantes.map((a) => `
    <div class="aniversario-item">
      <span>🎂 <strong>${a.nome}</strong> faz aniversário hoje!</span>
      <a class="aniversario-btn" data-id="${a.id}" href="#">Desejar parabéns</a>
    </div>
  `).join("");

  aniversariantes.forEach((a) => {
    const btn = banner.querySelector(`[data-id="${a.id}"]`);
    const texto = encodeURIComponent(`Parabéns, ${a.nome}! 🎉 Desejo a você um dia repleto de alegrias. Conte comigo sempre!`);
    btn.href = `${buildWhatsappLink(a.telefone)}?text=${texto}`;
    btn.target = "_blank";
    btn.rel = "noopener";
  });

  banner.classList.remove("is-hidden");
}

async function iniciar() {
  // Cada injeção do logo usa um id de gradiente próprio, pra evitar
  // ids duplicados na página (o mesmo SVG é usado em dois lugares).
  document.getElementById("topbar-mark").innerHTML = LOGO_MARK_SVG.replaceAll("logoGradMark", "logoGradMarkTopbar");
  document.getElementById("splash-mark").innerHTML = LOGO_MARK_SVG.replaceAll("logoGradMark", "logoGradMarkSplash");

  // Se a página acabou de voltar do login do Google (redirecionamento
  // usado dentro do app instalado), pega o token da URL e o id do
  // treino que ficou pendente.
  const treinoIdPendente = typeof processarRetornoDriveRedirect === "function"
    ? processarRetornoDriveRedirect()
    : null;

  const inicioCarregamento = Date.now();
  const { data, error } = await sb.from("alunos").select("*").order("nome", { ascending: true });
  if (!error) alunosCache = data;
  renderAniversariantesHoje();
  await carregarAgendaDoDia();

  // Mantém o splash visível por pelo menos ~3s, mesmo se os dados
  // carregarem rápido, pra marca ter tempo de aparecer bem.
  const tempoDecorrido = Date.now() - inicioCarregamento;
  const espera = Math.max(0, 3000 - tempoDecorrido);
  setTimeout(() => {
    const splash = document.getElementById("splash-screen");
    splash.classList.add("is-hiding");
    setTimeout(() => splash.classList.add("is-hidden"), 450);
  }, espera);

  if (treinoIdPendente && typeof retomarGeracaoPdfAposLogin === "function") {
    await retomarGeracaoPdfAposLogin(treinoIdPendente);
  }
}

iniciar();
