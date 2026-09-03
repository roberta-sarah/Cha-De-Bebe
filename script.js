/* ======================================================
   Chá de bebê da Ayla — funcionalidades em JavaScript
   ====================================================== */

// Chave usada só para lembrar que o anfitrião já entrou nesta aba
const CHAVE_SESSAO_ANFITRIAO = "chaAylaAnfitriaoLogado";

// Senha simples para entrar na área do anfitrião.
// Troque aqui pela senha que preferir.
const SENHA_ANFITRIAO = "ayla2026";

/* ---------- Firebase (banco de dados compartilhado) ---------- */
// Configuração do projeto "cha-da-ayla" no Firebase.
const firebaseConfig = {
  apiKey: "AIzaSyAQipmyyhVb5S4YFxo7A4JAAE38eyEtoaM",
  authDomain: "cha-da-ayla-83c01.firebaseapp.com",
  projectId: "cha-da-ayla-83c01",
  storageBucket: "cha-da-ayla-83c01.firebasestorage.app",
  messagingSenderId: "273989531649",
  appId: "1:273989531649:web:0d75d981c72cb07f6dac00",
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const colecaoPresentes = db.collection("presentes");
const colecaoRecados = db.collection("recados");

// Cópias locais dos dados, atualizadas automaticamente pelo Firestore
let presentesCache = [];
let recadosCache = [];

/* ---------- Funções auxiliares de dados ---------- */

function lerPresentes() {
  return presentesCache;
}

function lerRecados() {
  return recadosCache;
}

function gerarId() {
  return "id-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function formatarMoeda(valor) {
  const numero = Number(valor) || 0;
  return numero.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function iconePorCategoria(categoria = "") {
  const texto = categoria.toLowerCase();
  if (texto.includes("roupa")) return "👕";
  if (texto.includes("higien")) return "🧴";
  if (texto.includes("quarto") || texto.includes("móve")) return "🛏️";
  if (texto.includes("aliment") || texto.includes("mamad")) return "🍼";
  if (texto.includes("brinq")) return "🧸";
  if (texto.includes("passeio") || texto.includes("carrinho")) return "🚼";
  return "🎁";
}

/* ---------- Notificação (aviso) ---------- */

let temporizadorAviso = null;

function mostrarAviso(texto) {
  const aviso = document.getElementById("aviso");
  if (!aviso) return;
  aviso.textContent = texto;
  aviso.classList.add("mostrar");
  clearTimeout(temporizadorAviso);
  temporizadorAviso = setTimeout(() => aviso.classList.remove("mostrar"), 2800);
}

/* ---------- Modal ---------- */

function abrirModal(htmlConteudo) {
  const modal = document.getElementById("modal");
  const conteudo = document.getElementById("conteudo-modal");
  conteudo.innerHTML = htmlConteudo;
  modal.classList.remove("oculto");
}

function fecharModal() {
  const modal = document.getElementById("modal");
  modal.classList.add("oculto");
  document.getElementById("conteudo-modal").innerHTML = "";
}

/* ---------- Área pública: presentes ---------- */

function renderizarPresentesPublico() {
  const lista = document.getElementById("lista-presentes");
  const contador = document.getElementById("contador-presentes");
  const presentes = lerPresentes();

  if (!lista) return;

  if (presentes.length === 0) {
    lista.innerHTML = `<p class="sem-presentes">a lista está sendo preparada ✦</p>`;
  } else {
    lista.innerHTML = presentes
      .map(
        (p) => `
        <div class="linha-presente ${p.reservado ? "reservado" : ""}" data-id="${p.id}">
          <div class="icone-presente">${iconePorCategoria(p.categoria)}</div>
          <div class="informacoes-presente">
            <strong>${escaparHtml(p.nome)}</strong>
            <span>${escaparHtml(p.categoria || "presente")}<i>•</i>${formatarMoeda(p.valor)}</span>
          </div>
          <button class="botao botao-pequeno" data-action="alternar-reservado" data-id="${p.id}">
            ${p.reservado ? "desmarcar" : "já vou levar"}
          </button>
        </div>`
      )
      .join("");
  }

  if (contador) {
    const reservados = presentes.filter((p) => p.reservado).length;
    contador.textContent =
      presentes.length === 0 ? "" : `${reservados} de ${presentes.length} já foram escolhidos`;
  }
}

/* ---------- Área do anfitrião: presentes ---------- */

function renderizarPresentesAnfitriao() {
  const lista = document.getElementById("lista-presentes-anfitriao");
  if (!lista) return;
  const presentes = lerPresentes();

  if (presentes.length === 0) {
    lista.innerHTML = `<p class="vazio-anfitriao">Nenhum presente cadastrado ainda. Clique em "adicionar presente" para começar.</p>`;
  } else {
    lista.innerHTML = presentes
      .map(
        (p) => `
        <div class="linha-tabela-anfitriao" data-id="${p.id}">
          <span>${escaparHtml(p.nome)}</span>
          <span>${escaparHtml(p.categoria || "—")}</span>
          <span>${formatarMoeda(p.valor)}</span>
          <span>${p.reservado ? "Escolhido" : "Disponível"}</span>
          <div class="acoes-presente">
            <button data-action="editar-presente" data-id="${p.id}">editar</button>
            <button data-action="remover-presente" data-id="${p.id}">remover</button>
          </div>
        </div>`
      )
      .join("");
  }

  const badge = document.getElementById("quantidade-presentes-anfitriao");
  if (badge) badge.textContent = presentes.length ? presentes.length : "";
}


function presentesAtualizados() {
  renderizarPresentesPublico();
  renderizarPresentesAnfitriao();
}

/* ---------- Modal: adicionar / editar presente ---------- */

function abrirModalPresente(id) {
  const presentes = lerPresentes();
  const presente = id ? presentes.find((p) => p.id === id) : null;

  abrirModal(`
    <h2>${presente ? "Editar presente" : "Adicionar presente"}</h2>
    <p>Cadastre o item e o valor estimado.</p>
    <form id="formulario-presente">
      <input type="hidden" name="presenteId" value="${presente ? presente.id : ""}">
      <label>
        <span>nome do presente</span>
        <input name="nome" required placeholder="Ex: fraldas RN" value="${presente ? escaparHtml(presente.nome) : ""}">
      </label>
      <label>
        <span>categoria (opcional)</span>
        <input name="categoria" placeholder="Ex: higiene, quarto, roupinha" value="${presente ? escaparHtml(presente.categoria || "") : ""}">
      </label>
      <label>
        <span>valor estimado (R$)</span>
        <input name="valor" type="number" min="0" step="0.01" required placeholder="0,00" value="${presente ? presente.valor : ""}">
      </label>
      <button class="botao botao-principal" type="submit">
        ${presente ? "Salvar alterações" : "Adicionar presente"}
      </button>
    </form>
  `);
}

async function salvarPresenteDoFormulario(form) {
  const dados = new FormData(form);
  const id = dados.get("presenteId");
  const nome = dados.get("nome").trim();
  const categoria = dados.get("categoria").trim();
  const valor = parseFloat(dados.get("valor"));

  if (!nome || isNaN(valor)) return;

  try {
    if (id) {
      await colecaoPresentes.doc(id).update({ nome, categoria, valor });
    } else {
      await colecaoPresentes.add({
        nome,
        categoria,
        valor,
        reservado: false,
        criadoEm: firebase.firestore.FieldValue.serverTimestamp(),
      });
    }
    fecharModal();
    mostrarAviso(id ? "Presente atualizado ✦" : "Presente adicionado à lista ✦");
  } catch (erro) {
    console.error(erro);
    mostrarAviso("Não foi possível salvar. Verifique sua conexão e tente novamente.");
  }
}

async function removerPresente(id) {
  try {
    await colecaoPresentes.doc(id).delete();
    mostrarAviso("Presente removido");
  } catch (erro) {
    console.error(erro);
    mostrarAviso("Não foi possível remover. Tente novamente.");
  }
}

async function alternarReservado(id) {
  const presente = lerPresentes().find((p) => p.id === id);
  if (!presente) return;
  try {
    await colecaoPresentes.doc(id).update({ reservado: !presente.reservado });
    mostrarAviso(
      !presente.reservado ? "Presente marcado como escolhido, obrigada! ✦" : "Presente liberado novamente"
    );
  } catch (erro) {
    console.error(erro);
    mostrarAviso("Não foi possível atualizar. Tente novamente.");
  }
}

/* ---------- Recadinhos (mural de mensagens) ---------- */

function renderizarRecados() {
  const grade = document.getElementById("lista-recados");
  if (!grade) return;
  const recados = lerRecados();

  if (recados.length === 0) {
    grade.innerHTML = `<p class="sem-recados">Nenhum recadinho ainda. Seja a primeira pessoa a deixar um carinho ✦</p>`;
    return;
  }

  grade.innerHTML = recados
    .slice()
    .reverse()
    .map((r) => {
      const iniciais = obterIniciais(r.nome);
      const mensagem = r.mensagem ? escaparHtml(r.mensagem) : "Deixou um carinho para a Ayla ✦";
      return `
        <div class="cartao-recado">
          <span class="aspas">&ldquo;</span>
          <p class="mensagem-recado">${mensagem}</p>
          <div class="autor-recado">
            <div class="avatar-recado">${iniciais}</div>
            <div>
              <strong>${escaparHtml(r.nome)}</strong>
              <span>convidado(a)</span>
            </div>
          </div>
        </div>`;
    })
    .join("");
}

function obterIniciais(nome = "") {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "?";
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

async function adicionarRecado(nome, mensagem) {
  try {
    await colecaoRecados.add({
      nome: nome.trim(),
      mensagem: mensagem.trim(),
      criadoEm: firebase.firestore.FieldValue.serverTimestamp(),
    });
    return true;
  } catch (erro) {
    console.error(erro);
    mostrarAviso("Não foi possível enviar o recadinho. Tente novamente.");
    return false;
  }
}

/* ---------- Login / área do anfitrião ---------- */

function estaLogadoComoAnfitriao() {
  return sessionStorage.getItem(CHAVE_SESSAO_ANFITRIAO) === "sim";
}

function abrirModalLogin() {
  abrirModal(`
    <h2>Área do anfitrião</h2>
    <p>Digite a senha para acessar o painel de organização do chá de bebê.</p>
    <form id="formulario-login">
      <label>
        <span>senha</span>
        <input type="password" name="senha" required autofocus>
      </label>
      <button class="botao botao-principal" type="submit">Entrar</button>
    </form>
  `);
}

function mostrarAnfitriao() {
  document.getElementById("visualizacao").classList.add("oculto");
  document.getElementById("visualizacao-anfitriao").classList.remove("oculto");
  presentesAtualizados();
  window.scrollTo(0, 0);
}

function mostrarPublico() {
  document.getElementById("visualizacao-anfitriao").classList.add("oculto");
  document.getElementById("visualizacao").classList.remove("oculto");
  presentesAtualizados();
  renderizarRecados();
  window.scrollTo(0, 0);
}

/* ---------- Utilidades ---------- */

function escaparHtml(texto = "") {
  const div = document.createElement("div");
  div.textContent = texto;
  return div.innerHTML;
}

async function copiarTexto(texto, mensagemSucesso) {
  try {
    await navigator.clipboard.writeText(texto);
    mostrarAviso(mensagemSucesso);
  } catch {
    // alternativa para navegadores sem suporte à Clipboard API
    const campo = document.createElement("textarea");
    campo.value = texto;
    document.body.appendChild(campo);
    campo.select();
    document.execCommand("copy");
    document.body.removeChild(campo);
    mostrarAviso(mensagemSucesso);
  }
}

/* ---------- Eventos ---------- */

document.addEventListener("DOMContentLoaded", () => {
  // Ouve o Firestore em tempo real: qualquer mudança feita por qualquer
  // pessoa (em qualquer computador) atualiza a tela automaticamente.
  colecaoPresentes.orderBy("criadoEm", "asc").onSnapshot(
    (snapshot) => {
      presentesCache = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      presentesAtualizados();
    },
    (erro) => {
      console.error(erro);
      mostrarAviso("Não foi possível conectar ao banco de dados. Confira a configuração do Firebase.");
    }
  );

  colecaoRecados.orderBy("criadoEm", "asc").onSnapshot(
    (snapshot) => {
      recadosCache = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      renderizarRecados();
    },
    (erro) => console.error(erro)
  );

  // Clique em qualquer botão com data-action
  document.addEventListener("click", (evento) => {
    const alvo = evento.target.closest("[data-action]");
    if (alvo) {
      const acao = alvo.dataset.action;
      const id = alvo.dataset.id;

      switch (acao) {
        case "abrir-login":
          if (estaLogadoComoAnfitriao()) {
            mostrarAnfitriao();
          } else {
            abrirModalLogin();
          }
          break;

        case "publico":
          mostrarPublico();
          break;

        case "adicionar-presente":
          abrirModalPresente();
          break;

        case "editar-presente":
          abrirModalPresente(id);
          break;

        case "remover-presente":
          if (confirm("Remover este presente da lista?")) removerPresente(id);
          break;

        case "alternar-reservado":
          alternarReservado(id);
          break;

        case "fechar-modal":
          fecharModal();
          break;

        case "copiar-link":
          copiarTexto(window.location.href, "Link do convite copiado ✦");
          break;
      }
      return;
    }

    // Clique fora da caixa do modal (no fundo escurecido) fecha o modal
    if (evento.target.id === "modal") fecharModal();
  });

  // Fecha o modal com a tecla ESC
  document.addEventListener("keydown", (evento) => {
    if (evento.key === "Escape") fecharModal();
  });

  // Botão de copiar chave PIX
  const botaoPix = document.getElementById("botao-copiar-pix");
  if (botaoPix) {
    botaoPix.addEventListener("click", () => {
      copiarTexto(document.getElementById("chave-pix").textContent.trim(), "Chave PIX copiada ✦");
    });
  }

  // Envio do formulário de recadinho/contribuição
  const formularioContribuicao = document.getElementById("formulario-contribuicao");
  if (formularioContribuicao) {
    formularioContribuicao.addEventListener("submit", async (evento) => {
      evento.preventDefault();
      const dados = new FormData(formularioContribuicao);
      const nome = (dados.get("name") || "").trim();
      const mensagem = (dados.get("message") || "").trim();
      if (!nome) return;
      const sucesso = await adicionarRecado(nome, mensagem);
      if (sucesso) {
        formularioContribuicao.reset();
        mostrarAviso("Recadinho enviado, obrigada por fazer parte desse momento ✦");
      }
    });
  }

  // Envio dos formulários criados dentro do modal (login / presente)
  document.addEventListener("submit", (evento) => {
    const idFormulario = evento.target.getAttribute("id");

    if (idFormulario === "formulario-login") {
      evento.preventDefault();
      const senha = new FormData(evento.target).get("senha");
      if (senha === SENHA_ANFITRIAO) {
        sessionStorage.setItem(CHAVE_SESSAO_ANFITRIAO, "sim");
        fecharModal();
        mostrarAnfitriao();
        mostrarAviso("Bem-vindo(a) de volta ✦");
      } else {
        mostrarAviso("Senha incorreta, tente novamente");
      }
    }

    if (idFormulario === "formulario-presente") {
      evento.preventDefault();
      salvarPresenteDoFormulario(evento.target);
    }
  });
});