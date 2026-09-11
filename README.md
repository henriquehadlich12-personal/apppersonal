# Agenda do Personal

App estático (HTML/CSS/JS puro) + Supabase, sem build step. Pronto para
subir num repositório do GitHub.

## 1. Baixar as bibliotecas localmente

Como CDN pode ser bloqueado em rede corporativa, o app carrega essas
bibliotecas de arquivos locais em vez de links externos.

**Supabase:**
1. Acesse: https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js
2. Salve o conteúdo como `vendor/supabase.js`.

**jsPDF** (usado para gerar o PDF do treino):
1. Acesse: https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js
2. Salve o conteúdo como `vendor/jspdf.umd.min.js`.

Em ambos os casos: clique com o botão direito na página que abrir e
escolha "Salvar como...", ajustando o tipo do arquivo para "Todos os
arquivos" antes de salvar (assim evita que o navegador embrulhe o
conteúdo em HTML).

## 2. Configurar as credenciais

Abra `config.js` e preencha com os dados do seu projeto Supabase
(Project Settings > API):

```js
const SUPABASE_URL = "https://SEU-PROJETO.supabase.co";
const SUPABASE_ANON_KEY = "sua-anon-key-aqui";
```

## 3. Testar localmente

Como o navegador bloqueia `fetch` em arquivos abertos via `file://`,
rode um servidor local simples dentro da pasta do projeto:

```bash
python -m http.server 8000
```

E acesse `http://localhost:8000`.

## 4. Publicar no GitHub Pages

1. Crie um repositório no GitHub e suba estes arquivos (`index.html`,
   `style.css`, `app.js`, `config.js`, `vendor/supabase.js`).
2. Vá em **Settings > Pages** do repositório.
3. Em "Source", selecione a branch principal (`main`) e a pasta raiz (`/`).
4. Salve — o GitHub gera uma URL pública em alguns minutos
   (algo como `https://seu-usuario.github.io/nome-do-repo/`).

## Estrutura de dados

- **alunos**: nome, telefone, data de nascimento, peso e altura —
  usado tanto para marcar horários quanto para montar treinos.
- **agendamentos**: cada linha é um horário do dia. `tipo` pode ser
  `personal`, `avaliacao` ou `bloqueio`. Horários fixos criados em
  série compartilham um `serie_id`, o que permite excluir todos os
  futuros de uma vez.
- **treinos**: uma ficha de treino montada para um aluno, com título
  opcional e (futuramente) o link do PDF no Google Drive.
- **treino_itens**: cada equipamento dentro de um treino, com séries,
  repetições, carga e observações. O catálogo de equipamentos (nomes
  e croquis) fica no arquivo `equipamentos.js`, não no banco.

## O que já funciona nesta versão

- Mapa do dia em blocos de 1 hora (06h–21h), colorido por tipo —
  inclusive horários que ocupam várias horas seguidas (ex: um
  bloqueio das 13h às 17h preenche as 4 linhas corretamente.
- Criar horário avulso (personal, avaliação ou bloqueio) e personal
  em série (repete semanalmente por N semanas).
- Excluir um horário específico ou a série inteira a partir da data atual.
- Botão "Contatar aluno" abrindo o WhatsApp (wa.me) direto do horário.
- Cadastro de alunos com dados físicos (nascimento, peso, altura),
  edição e exclusão (bloqueada se o aluno tiver horários pendentes).
- Aba **Treinos**: seleciona o aluno, mostra idade/peso/altura no
  topo, monta o treino escolhendo equipamentos de um catálogo com
  croquis, define séries/repetições/carga/observações por item, e
  salva a ficha. Histórico de treinos por aluno.
- Geração de **PDF** da ficha de treino, com o nome do personal
  (Henrique Mateus Hadlich), dados do aluno e a lista de exercícios —
  baixa direto no dispositivo.

## Próximo passo: Google Drive + envio automático por WhatsApp

**Status: implementado.** Ao clicar em "Gerar PDF", o app agora:
1. Monta o PDF (com o croqui de cada equipamento embutido).
2. Baixa o arquivo no dispositivo do personal.
3. Sobe automaticamente para o Google Drive do personal (pasta raiz).
4. Libera o link para "qualquer pessoa com o link pode visualizar"
   (necessário para o aluno abrir pelo WhatsApp sem precisar de conta
   Google com permissão).
5. Salva esse link em `treinos.pdf_url` e libera o botão de WhatsApp.

**Uma exceção à regra de "nada de CDN"**: o script de login do Google
(`accounts.google.com/gsi/client`) precisa ser carregado direto do
domínio do Google — não dá pra baixar e hospedar local, porque ele
está ligado à sessão de login ativa do navegador. Esse é o único
script do projeto carregado assim; todo o resto continua local.

### Configuração necessária no Google Cloud

1. Acesse https://console.cloud.google.com e crie (ou reaproveite) um projeto.
2. Em "APIs e Serviços > Biblioteca", ative a **Google Drive API**.
3. Em "APIs e Serviços > Tela de consentimento OAuth", configure como
   "Externo", adicione seu e-mail como usuário de teste (não precisa
   publicar o app, já que é uso pessoal).
4. Em "APIs e Serviços > Credenciais", crie uma credencial do tipo
   **OAuth Client ID**, tipo de aplicativo **Web application**.
5. Em "Authorized JavaScript origins", adicione exatamente a URL do
   seu site publicado no GitHub Pages (ex:
   `https://seu-usuario.github.io`, sem barra no final).
6. Copie o Client ID gerado (termina em `.apps.googleusercontent.com`)
   e cole em `config.js`, na constante `GOOGLE_CLIENT_ID`.

Na primeira vez que clicar em "Gerar PDF", o navegador vai abrir uma
tela de login/consentimento do Google — é normal, é o personal
autorizando o app a criar arquivos no próprio Drive dele.

**Sobre privacidade**: o link gerado fica acessível a qualquer pessoa
que o receba (não é indexado, mas não exige login). Isso é necessário
para o aluno conseguir abrir o PDF pelo WhatsApp sem ter conta
autorizada no Drive do personal.

## Outras ideias para o futuro

- Editar um horário existente (hoje só dá para excluir e recriar).
- Slots com granularidade menor que 1 hora, se necessário.
- Reordenar os exercícios dentro do treino antes de salvar.
