# Agenda do Personal

App estático (HTML/CSS/JS puro) + Supabase, sem build step. Pronto para
subir num repositório do GitHub.

## 1. Baixar o supabase-js localmente

Como CDN pode ser bloqueado em rede corporativa, o app carrega o
supabase-js de um arquivo local em vez de um link externo.

1. Acesse: https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js
2. Salve o conteúdo como `vendor/supabase.js` dentro deste projeto
   (substituindo o placeholder, se houver).

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

- **alunos**: nome + telefone, usado para preencher o seletor de aluno
  sem precisar digitar.
- **agendamentos**: cada linha é um horário do dia. `tipo` pode ser
  `personal`, `avaliacao` ou `bloqueio`. Horários fixos criados em
  série compartilham um `serie_id`, o que permite excluir todos os
  futuros de uma vez.

## O que já funciona nesta primeira versão

- Mapa do dia em blocos de 1 hora (06h–21h), colorido por tipo.
- Criar horário avulso (personal, avaliação ou bloqueio).
- Criar personal em série (repete semanalmente por N semanas).
- Excluir um horário específico ou a série inteira a partir da data atual.
- Botão "Contatar aluno" abrindo o WhatsApp (wa.me) direto do horário.
- Cadastro de alunos (criar, editar, excluir com proteção contra
  exclusão de aluno com horários pendentes).

## Ideias para próximos passos

- Editar um horário existente (hoje só dá para excluir e recriar).
- Slots com granularidade menor que 1 hora, se necessário.
- Indicador visual na aba "Hoje" quando não é o dia atual.
