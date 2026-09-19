// ============================================================
// Avaliação de saúde / anamnese do aluno
// ============================================================

const PERGUNTAS_AVALIACAO = [
  {
    grupo: "Saúde e histórico",
    campos: [
      { chave: "cardiacos_familia", label: "Existem problemas cardíacos na família? Quem?" },
      { chave: "pressao_arterial", label: "Sua pressão arterial é alta, baixa ou normal (12x8)?" },
      { chave: "dores_peito", label: "Já sentiu ou sente dores no peito?" },
      { chave: "dores_peito_atividade", label: "Sente dores no peito ao realizar alguma atividade física?" },
      { chave: "dores_coluna", label: "Sentiu ou sente dores na coluna constantes? Em qual região?" },
      { chave: "ja_desmaiou", label: "Já desmaiou alguma vez?" },
      { chave: "fumante", label: "É fumante? Há quantos anos?" },
      { chave: "esteroide_anabolico", label: "Toma algum tipo de esteroide anabólico?" },
      { chave: "trauma_lesao", label: "Possui algum trauma ou lesão?" },
      { chave: "obs_parq", label: "Observações" },
    ],
  },
  {
    grupo: "Anamnese",
    campos: [
      { chave: "objetivos_atividade", label: "Quais são seus objetivos com relação a atividade física?" },
      { chave: "pratica_atividade_atual", label: "Pratica atividade física atualmente? Quais e há quanto tempo?" },
      { chave: "acompanhamento_nutricionista", label: "Realiza acompanhamento com nutricionista ou nutricionista esportivo?" },
      { chave: "horas_sono", label: "Qual seria sua média de horas de sono diário?" },
      { chave: "medicamento_continuo", label: "Utiliza algum tipo de medicamento de uso contínuo? Qual?" },
      { chave: "cirurgia_recente", label: "Já passou por algum tipo de cirurgia nos últimos 6 meses? Qual?" },
      { chave: "restricao_medica", label: "Possui alguma recomendação ou restrição médica para prática de exercícios?" },
      { chave: "diabetes_outra_doenca", label: "Possui diabetes ou alguma outra doença?" },
      { chave: "alteracao_cardiaca", label: "Possui alguma alteração cardíaca? Qual?" },
    ],
  },
];

let avaliacaoAlunoAtual = null;

function renderFormularioAvaliacao(dadosExistentes) {
  const container = document.getElementById("avaliacao-form-container");
  container.innerHTML = "";
  const dados = dadosExistentes || {};

  PERGUNTAS_AVALIACAO.forEach((secao) => {
    const titulo = document.createElement("h3");
    titulo.className = "subsection-title";
    titulo.textContent = secao.grupo;
    container.appendChild(titulo);

    secao.campos.forEach((campo) => {
      const wrap = document.createElement("div");
      wrap.className = "field";
      wrap.innerHTML = `
        <label class="field-label" for="aval-${campo.chave}">${campo.label}</label>
        <textarea id="aval-${campo.chave}" class="field-input" rows="2"></textarea>`;
      wrap.querySelector("textarea").value = dados[campo.chave] || "";
      container.appendChild(wrap);
    });
  });
}

async function abrirSheetAvaliacaoSaude(aluno) {
  avaliacaoAlunoAtual = aluno;
  document.getElementById("avaliacao-titulo").textContent = `Avaliação de saúde — ${aluno.nome}`;
  renderFormularioAvaliacao(null);
  document.getElementById("sheet-avaliacao").classList.remove("is-hidden");

  const { data, error } = await sb
    .from("aluno_avaliacao_saude")
    .select("*")
    .eq("aluno_id", aluno.id)
    .maybeSingle();

  if (error) {
    toast("Erro ao carregar avaliação");
    console.error(error);
    return;
  }
  if (data) renderFormularioAvaliacao(data);
}

document.getElementById("btn-cancelar-avaliacao").addEventListener("click", () => {
  document.getElementById("sheet-avaliacao").classList.add("is-hidden");
});

document.getElementById("form-avaliacao").addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!avaliacaoAlunoAtual) return;

  const payload = { aluno_id: avaliacaoAlunoAtual.id };
  PERGUNTAS_AVALIACAO.forEach((secao) => {
    secao.campos.forEach((campo) => {
      const valor = document.getElementById(`aval-${campo.chave}`).value.trim();
      payload[campo.chave] = valor || null;
    });
  });

  const { error } = await sb.from("aluno_avaliacao_saude").upsert(payload);
  if (error) {
    toast("Erro ao salvar avaliação");
    console.error(error);
    return;
  }
  toast("Avaliação salva");
  document.getElementById("sheet-avaliacao").classList.add("is-hidden");
});
