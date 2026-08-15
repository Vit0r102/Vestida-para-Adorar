/* ==========================================================================
   VESTIDA PARA ADORAR — PAINEL ADMINISTRATIVO
   common.js — dados e utilitários compartilhados entre todas as páginas
   Deve ser carregado ANTES de qualquer script específico de página.
   ========================================================================== */

'use strict';

/* --------------------------------------------------------------------------
   1. CONFIGURAÇÃO GLOBAL
   -------------------------------------------------------------------------- */
const APP_CONFIG = {
  lowStockThreshold: 3,
};

/* --------------------------------------------------------------------------
   2. DADOS MOCK COMPARTILHADOS
   (em produção, viriam de uma API/backend)
   -------------------------------------------------------------------------- */
const PRODUCTS = [
  { id: 1, name: 'Saia Midi Godê Estampada',  category: 'Saias',     price: 149.90, stock: 15, active: true,  featured: true,  img: null },
  { id: 2, name: 'Blusa Manga Bufante Off',    category: 'Blusas',    price: 119.90, stock: 0,  active: false, featured: false, img: null },
  { id: 3, name: 'Vestido Evasê com Babados',  category: 'Vestidos',  price: 169.90, stock: 2,  active: true,  featured: false, img: null },
  { id: 4, name: 'Conjunto Saia e Blusa Bege', category: 'Conjuntos', price: 199.90, stock: 5,  active: true,  featured: false, img: null },
  { id: 5, name: 'Blusa Ombro a Ombro Rosé',   category: 'Blusas',    price: 129.90, stock: 8,  active: true,  featured: false, img: null },
  { id: 6, name: 'Vestido Longo Dourado',      category: 'Vestidos',  price: 219.90, stock: 6,  active: true,  featured: true,  img: null },
];

let nextProductId = PRODUCTS.length + 1;

const ACTIVITIES = [
  { id: 1, type: 'create',   title: 'Novo produto cadastrado', desc: 'Conjunto Saia e Blusa Bege',  time: 'Hoje, 10:23' },
  { id: 2, type: 'update',   title: 'Estoque atualizado',      desc: 'Vestido Evasê com Babados',   time: 'Hoje, 09:15' },
  { id: 3, type: 'inactive', title: 'Produto inativado',       desc: 'Blusa Manga Bufante Off',     time: 'Ontem, 16:42' },
];

const MOVEMENTS = [
  { id: 1, type: 'entrada', product: 'Conjunto Saia e Blusa Bege', qty: 5,  time: 'Hoje, 10:23' },
  { id: 2, type: 'ajuste',  product: 'Vestido Evasê com Babados',  qty: -3, time: 'Hoje, 09:15' },
  { id: 3, type: 'saida',   product: 'Blusa Manga Bufante Off',    qty: -4, time: 'Ontem, 16:42' },
];

/* --------------------------------------------------------------------------
   3. UTILITÁRIOS DE FORMATAÇÃO
   -------------------------------------------------------------------------- */
function formatCurrency(value) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function debounce(fn, delay = 200) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/* --------------------------------------------------------------------------
   4. CÁLCULOS DE ESTOQUE (usados por Visão Geral, Produtos e Estoque)
   -------------------------------------------------------------------------- */
function getStockState(product) {
  if (product.stock === 0) return 'semEstoque';
  if (!product.active) return 'inativo';
  if (product.stock <= APP_CONFIG.lowStockThreshold) return 'baixo';
  return 'normal';
}

function getStockSummary(products = PRODUCTS) {
  const summary = { normal: 0, baixo: 0, semEstoque: 0, inativo: 0 };
  products.forEach((p) => { summary[getStockState(p)]++; });
  return summary;
}

function getInventoryValue(products = PRODUCTS) {
  return products.reduce((sum, p) => sum + p.price * p.stock, 0);
}

/* --------------------------------------------------------------------------
   5. TOASTS (feedback visual)
   -------------------------------------------------------------------------- */
function showToast(message, type = 'success') {
  const stack = document.getElementById('toastStack');
  if (!stack) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type === 'danger' ? 'toast--danger' : ''}`;
  toast.innerHTML = `
    <span class="toast__icon" aria-hidden="true">${type === 'danger' ? '⚠' : '✓'}</span>
    <span>${escapeHtml(message)}</span>
  `;
  stack.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('is-visible'));

  setTimeout(() => {
    toast.classList.remove('is-visible');
    setTimeout(() => toast.remove(), 250);
  }, 3200);
}

/* --------------------------------------------------------------------------
   6. SIDEBAR MOBILE (OFFCANVAS) — compartilhada por todas as páginas
   -------------------------------------------------------------------------- */
function bindMobileSidebar() {
  const menuToggle = document.getElementById('menuToggle');
  const sidebar = document.getElementById('sidebar');
  const backdrop = document.getElementById('sidebarBackdrop');
  if (!menuToggle || !sidebar || !backdrop) return;

  const openSidebar = () => {
    sidebar.classList.add('is-open');
    backdrop.classList.add('is-open');
    menuToggle.setAttribute('aria-expanded', 'true');
  };
  const closeSidebar = () => {
    sidebar.classList.remove('is-open');
    backdrop.classList.remove('is-open');
    menuToggle.setAttribute('aria-expanded', 'false');
  };

  menuToggle.addEventListener('click', openSidebar);
  backdrop.addEventListener('click', closeSidebar);
}

/* --------------------------------------------------------------------------
   7. FECHAR MODAIS COM A TECLA ESC (genérico)
   -------------------------------------------------------------------------- */
function bindEscToClose(overlaySelectors, onClose) {
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    overlaySelectors.forEach((sel) => {
      const el = document.querySelector(sel);
      if (el && el.classList.contains('is-open')) onClose(el);
    });
  });
}
/* --------------------------------------------------------------------------
   8. AUTENTICAÇÃO E CONTROLE DE SESSÃO (SUPABASE AUTH)
   -------------------------------------------------------------------------- */

/**
 * Verifica se existe uma sessão ativa no Supabase Auth.
 * Retorna a sessão se o usuário estiver autenticado, ou null caso contrário.
 */
async function verificarLogin() {
  if (typeof supabaseClient === 'undefined') {
    console.error('supabaseClient não está definido. Certifique-se de carregar Supa.js antes de common.js.');
    return null;
  }
  try {
    const { data: { session }, error } = await supabaseClient.auth.getSession();
    if (error || !session) return null;
    return session;
  } catch (err) {
    console.error('Erro ao verificar sessão:', err);
    return null; 

  }
}

/**
 * Protege páginas privadas do Dashboard.
 * Se o usuário NÃO estiver logado, redireciona imediatamente para login.html.
 */
async function protegerPagina() {

    const session = await verificarLogin();

    if (!session) {
        window.location.replace("login.html");
        return false;
    }

    const { data: admin, error } =
        await supabaseClient
            .from("Admin")
            .select("*")
            .eq("id", session.user.id)
            .single();

    if (error || !admin) {

        console.error(error);

        await supabaseClient.auth.signOut();

        window.location.replace("login.html");

        return false;
    }

    atualizarInterfaceUsuario(session.user);

    return true;

}
/**
 * Realiza o logout no Supabase Auth e redireciona para login.html.
 */
async function logout(event) {
  if (event && typeof event.preventDefault === 'function') {
    event.preventDefault();
  }
  if (typeof supabaseClient !== 'undefined') {
    try {
      await supabaseClient.auth.signOut();
    } catch (err) {
      console.error('Erro ao encerrar sessão:', err);
    }
  }
  window.location.replace("login.html");
}

/**
 * Retorna os dados do usuário atualmente logado (ou null se deslogado).
 */
async function usuarioAtual() {
  const session = await verificarLogin();
  return session ? session.user : null;
}

/**
 * Atualiza o nome/email do usuário logado na interface (sidebar).
 */
function atualizarInterfaceUsuario(user) {
  if (!user) return;
  const elementoNome = document.querySelector('.sidebar__user-name');
  if (elementoNome) {
    elementoNome.textContent = user.email || 'Administrador';
  }
}
function obterImagemProduto(nomeArquivo) {

    if (!nomeArquivo) return "";

    if (nomeArquivo.startsWith("http")) {
        return nomeArquivo;
    }

    return supabaseClient
        .storage
        .from("produtos")
        .getPublicUrl(nomeArquivo)
        .data.publicUrl;
}
async function logout() {
    const { error } = await supabaseClient.auth.signOut();

    if (error) {
        console.error("Erro ao sair:", error);
        return;
    }

    window.location.href = "login.html";
}