// ============================================================
// Google Drive — upload do PDF do treino
// Usa o escopo drive.file: o app só enxerga e gerencia os
// arquivos que ele mesmo cria, nunca o resto do Drive do personal.
// ============================================================

const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.file";

let driveTokenClient = null;
let driveAccessToken = null;
let driveTokenExpiraEm = 0;
const DRIVE_REDIRECT_KEY = "drive_pending_treino_id";

function obterDriveTokenClient() {
  if (!driveTokenClient) {
    driveTokenClient = google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: DRIVE_SCOPE,
      callback: () => {}, // definido a cada chamada em obterAccessTokenDrive()
    });
  }
  return driveTokenClient;
}

// Apps instalados (ícone na área de trabalho / "adicionar à tela inicial")
// rodam numa janela sem abas — nesse contexto o pop-up de login do Google
// costuma ser bloqueado ou abrir escondido. Detectamos isso e usamos
// redirecionamento de página inteira nesse caso, que sempre funciona.
function estaRodandoComoAppInstalado() {
  return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
}

function iniciarLoginDriveViaRedirect(treinoId) {
  if (treinoId) sessionStorage.setItem(DRIVE_REDIRECT_KEY, treinoId);
  const redirectUri = window.location.origin + window.location.pathname;
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: "token",
    scope: DRIVE_SCOPE,
    include_granted_scopes: "true",
    prompt: "consent",
  });
  window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

// Chamar uma vez ao carregar a página: se a URL veio de volta do login do
// Google (redirecionamento), extrai o token da hash e devolve o id do
// treino que estava pendente, pra retomar a geração do PDF sozinho.
function processarRetornoDriveRedirect() {
  if (!window.location.hash.includes("access_token")) return null;
  const params = new URLSearchParams(window.location.hash.substring(1));
  const token = params.get("access_token");
  const expiresIn = parseInt(params.get("expires_in") || "3600", 10);
  if (token) {
    driveAccessToken = token;
    driveTokenExpiraEm = Date.now() + (expiresIn - 60) * 1000;
  }
  history.replaceState(null, "", window.location.pathname + window.location.search);
  const treinoIdPendente = sessionStorage.getItem(DRIVE_REDIRECT_KEY);
  sessionStorage.removeItem(DRIVE_REDIRECT_KEY);
  return treinoIdPendente;
}

function obterAccessTokenDrive(treinoIdParaRetomar) {
  return new Promise((resolve, reject) => {
    const agora = Date.now();
    if (driveAccessToken && agora < driveTokenExpiraEm) {
      resolve(driveAccessToken);
      return;
    }
    if (estaRodandoComoAppInstalado()) {
      iniciarLoginDriveViaRedirect(treinoIdParaRetomar);
      return; // a página vai navegar pro Google agora
    }
    const client = obterDriveTokenClient();
    client.callback = (resposta) => {
      if (resposta.error) {
        reject(resposta);
        return;
      }
      driveAccessToken = resposta.access_token;
      driveTokenExpiraEm = Date.now() + (resposta.expires_in - 60) * 1000;
      resolve(driveAccessToken);
    };
    // "" deixa o Google decidir se precisa mostrar a tela de login/consentimento
    // (primeira vez) ou reaproveitar a sessão já autorizada.
    client.requestAccessToken({ prompt: "" });
  });
}

async function uploadPdfParaDrive(blob, nomeArquivo, tokenPromise) {
  const token = await tokenPromise;

  const metadata = { name: nomeArquivo, mimeType: "application/pdf" };
  const form = new FormData();
  form.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
  form.append("file", blob);

  const uploadResp = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id",
    {
      method: "POST",
      headers: { Authorization: "Bearer " + token },
      body: form,
    }
  );
  if (!uploadResp.ok) {
    throw new Error("Falha no upload para o Drive: " + (await uploadResp.text()));
  }
  const { id: fileId } = await uploadResp.json();

  // Sem isso, o link do PDF não abre pra quem não tem acesso ao Drive do
  // personal — necessário pro aluno conseguir ver pelo WhatsApp.
  await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
    method: "POST",
    headers: {
      Authorization: "Bearer " + token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ role: "reader", type: "anyone" }),
  });

  return { fileId, link: `https://drive.google.com/file/d/${fileId}/view` };
}
