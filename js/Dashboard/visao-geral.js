/* ==========================================================================
   VESTIDA PARA ADORAR — PAINEL ADMINISTRATIVO
   Página: Visão Geral — JavaScript
   Depende de: Supa.js, common.js (carregados antes deste arquivo)
   ========================================================================== */

'use strict';

// Evita que a animação de contagem do micro.js "fotografe" o placeholder
// R$ 0,00 do HTML antes dos dados reais do Supabase chegarem, e depois
// sobrescreva o valor correto no final da animação. Ao marcar o elemento
// como já contado, o micro.js simplesmente não mexe mais nele.
(function impedirAnimacaoPrematura() {
  const totalStockEl = document.getElementById('totalStockValue');
  if (totalStockEl) totalStockEl.dataset.counted = '1';
})();

const RECENT_LIMIT = 4;

let produtos = [];

const donutMeta = {
  normal:     { label: 'Estoque normal', color: 'var(--success)' },
  baixo:      { label: 'Estoque baixo',  color: 'var(--warning)' },
  semEstoque: { label: 'Sem estoque',    color: 'var(--danger)' },
  inativo:    { label: 'Inativos',       color: 'var(--ink-faint)' },
};

/* --------------------------------------------------------------------------
   1. SUPABASE — CARREGAR PRODUTOS (consulta única)
   -------------------------------------------------------------------------- */
async function carregarProdutos() {

    const { data, error } =
    await supabaseClient
        .from('Produtos')
        .select('*');

    if (error) {
        console.error(error);
        showToast('Erro ao carregar produtos.', 'danger');
        return;
    }

    produtos = data || [];

    // A partir daqui, tudo é calculado localmente em cima do mesmo resultado.
    renderOverviewStats();
    renderDonut();
    renderActivities();
    renderRecentProducts();
}

/* --------------------------------------------------------------------------
   2. CÁLCULOS DE ESTOQUE (locais, com os nomes reais das colunas)
   -------------------------------------------------------------------------- */
function getEstoqueState(produto) {
  if (produto.estoque === 0) return 'semEstoque';
  if (!produto.ativo) return 'inativo';
  if (produto.estoque <= APP_CONFIG.lowStockThreshold) return 'baixo';
  return 'normal';
}

function getEstoqueSummary(lista) {
  const summary = { normal: 0, baixo: 0, semEstoque: 0, inativo: 0 };
  lista.forEach((p) => { summary[getEstoqueState(p)]++; });
  return summary;
}

function getValorEstoque(lista) {
  return lista.reduce((soma, p) => soma + (p.preco * p.estoque), 0);
}

/* --------------------------------------------------------------------------
   3. CARTÕES DE ESTATÍSTICA
   -------------------------------------------------------------------------- */
function renderOverviewStats() {
  const summary = getEstoqueSummary(produtos);
  const ativos = produtos.filter((p) => p.ativo).length;
  const destaque = produtos.filter((p) => p.destaque).length;

  document.getElementById('statTotal').textContent = produtos.length;
  document.getElementById('statAtivos').textContent = ativos;
  document.getElementById('statBaixo').textContent = summary.baixo;
  document.getElementById('statSemEstoque').textContent = summary.semEstoque;
  document.getElementById('statDestaque').textContent = destaque;

  document.getElementById('totalStockValue').textContent = formatCurrency(getValorEstoque(produtos));
}

/* --------------------------------------------------------------------------
   4. GRÁFICO DE ROSCA (RESUMO DE ESTOQUE)
   -------------------------------------------------------------------------- */
function renderDonut() {
  const summary = getEstoqueSummary(produtos);
  const total = produtos.length || 1;
  const order = ['normal', 'baixo', 'semEstoque', 'inativo'];

  let cumulative = 0;
  const segments = order.map((key) => {
    const count = summary[key];
    const pct = (count / total) * 100;
    const segment = {
      key,
      count,
      pct,
      color: donutMeta[key].color,
      dasharray: `${pct} ${100 - pct}`,
      dashoffset: -cumulative,
    };
    cumulative += pct;
    return segment;
  });

  const circles = segments
    .filter((s) => s.count > 0)
    .map((s) => `
      <circle cx="60" cy="60" r="50" fill="none" stroke="${s.color}"
        stroke-width="16" pathLength="100"
        stroke-dasharray="${s.dasharray}" stroke-dashoffset="${s.dashoffset}"
        transform="rotate(-90 60 60)"></circle>
    `).join('');

  const svg = `
    <svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
      <circle cx="60" cy="60" r="50" fill="none" stroke="var(--linen-soft)" stroke-width="16"></circle>
      ${circles}
    </svg>
  `;

  const donutWrap = document.getElementById('donutWrap');
  donutWrap.innerHTML = svg;

  const center = document.createElement('div');
  center.className = 'donut-center';
  center.innerHTML = `
    <span class="donut-center__value">${produtos.length}</span>
    <span class="donut-center__label">Produtos</span>
  `;
  donutWrap.appendChild(center);

  const legend = document.getElementById('donutLegend');
  legend.innerHTML = segments.map((s) => `
    <div class="donut-legend__item">
      <span class="donut-legend__label">
        <span class="donut-legend__dot" style="background:${s.color};"></span>
        ${donutMeta[s.key].label}
      </span>
      <span class="donut-legend__value">${s.count} (${s.pct.toFixed(1)}%)</span>
    </div>
  `).join('');
}

/* --------------------------------------------------------------------------
   5. ATIVIDADES RECENTES
   (fora do escopo desta sprint — continua usando ACTIVITIES de common.js)
   -------------------------------------------------------------------------- */
const activityIcons = { create: '➕', update: '↻', inactive: '⏸' };

function renderActivities() {
  const feed = document.getElementById('activityFeed');
  feed.innerHTML = ACTIVITIES.map((a) => `
    <div class="activity-item">
      <div class="activity-item__icon activity-item__icon--${a.type}" aria-hidden="true">${activityIcons[a.type] || '•'}</div>
      <div>
        <p class="activity-item__title">${escapeHtml(a.title)}</p>
        <p class="activity-item__desc">${escapeHtml(a.desc)}</p>
        <p class="activity-item__time">${escapeHtml(a.time)}</p>
      </div>
    </div>
  `).join('');
}

/* --------------------------------------------------------------------------
   6. PRODUTOS RECENTES (tabela + cartões)
   -------------------------------------------------------------------------- */
function statusBadge(produto) {
  return produto.ativo
    ? '<span class="badge badge--success">Ativo</span>'
    : '<span class="badge badge--muted">Inativo</span>';
}

function stockLabel(estoque) {
  if (estoque === 0) return `<span class="stock-cell stock-cell--zero">${estoque}</span>`;
  if (estoque <= APP_CONFIG.lowStockThreshold) return `<span class="stock-cell stock-cell--low">${estoque}</span>`;
  return `<span class="stock-cell">${estoque}</span>`;
}

function productThumb(produto, cls) {
  if (produto.imagem) {
    return `<img src="${obterImagemProduto(produto.imagem)}" alt="${escapeHtml(produto.nome)}" class="${cls}">`;
  }
  const inicial = escapeHtml(produto.nome.charAt(0));
  return `<div class="${cls}" style="display:flex;align-items:center;justify-content:center;color:var(--rose-dark);font-family:var(--font-display);font-weight:600;background:var(--linen-soft);" aria-hidden="true">${inicial}</div>`;
}

function renderRecentProducts() {
  const recentes = [...produtos]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, RECENT_LIMIT);

  const tbody = document.getElementById('recentTableBody');
  tbody.innerHTML = '';

  recentes.forEach((p) => {
    tbody.innerHTML += `
      <tr>
        <td>${productThumb(p, 'product-cell__img')}</td>
        <td>
          <p class="product-cell__name">${escapeHtml(p.nome)}</p>
          <p class="product-cell__sku">${p.destaque ? '★ Destaque' : ''}</p>
        </td>
        <td>${escapeHtml(p.categoria)}</td>
        <td class="price-cell">${formatCurrency(p.preco)}</td>
        <td>${stockLabel(p.estoque)}</td>
        <td>${statusBadge(p)}</td>
        <td>
          <div class="row-actions">
            <a class="icon-btn" href="produtos.html" aria-label="Editar ${escapeHtml(p.nome)}">✏</a>
            <a class="icon-btn icon-btn--danger" href="produtos.html" aria-label="Excluir ${escapeHtml(p.nome)}">🗑</a>
          </div>
        </td>
      </tr>
    `;
  });

  const cards = document.getElementById('recentCardsList');
  cards.innerHTML = '';

  recentes.forEach((p) => {
    cards.innerHTML += `
      <article class="product-card">
        ${productThumb(p, 'product-card__img')}
        <div class="product-card__body">
          <div class="product-card__top">
            <div>
              <p class="product-card__name">${escapeHtml(p.nome)}</p>
              <p class="product-card__category">${escapeHtml(p.categoria)}</p>
            </div>
            ${statusBadge(p)}
          </div>
          <p class="product-card__price">${formatCurrency(p.preco)}</p>
          <div class="product-card__meta">
            <span class="panel__footer-text">Estoque: ${stockLabel(p.estoque)}</span>
            <div class="product-card__actions">
              <a class="icon-btn" href="produtos.html" aria-label="Editar ${escapeHtml(p.nome)}">✏</a>
              <a class="icon-btn icon-btn--danger" href="produtos.html" aria-label="Excluir ${escapeHtml(p.nome)}">🗑</a>
            </div>
          </div>
        </div>
      </article>
    `;
  });
}

/* --------------------------------------------------------------------------
   7. INICIALIZAÇÃO
   -------------------------------------------------------------------------- */
async function init() {
  bindMobileSidebar();
  await carregarProdutos();
}

document.addEventListener('DOMContentLoaded', async () => {

    const autorizado = await protegerPagina();

    if (!autorizado) return;

    await init();
});
