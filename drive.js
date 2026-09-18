// ============================================================
// Google Drive — upload do PDF do treino
// Usa o escopo drive.file: o app só enxerga e gerencia os
// arquivos que ele mesmo cria, nunca o resto do Drive do personal.
// ============================================================

const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.file";

let driveTokenClient = null;
let driveAccessToken = null;
let driveTokenExpiraEm = 0;

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

function obterAccessTokenDrive() {
  return new Promise((resolve, reject) => {
    const agora = Date.now();
    if (driveAccessToken && agora < driveTokenExpiraEm) {
      resolve(driveAccessToken);
      return;
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
