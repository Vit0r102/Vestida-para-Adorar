/* ==========================================================================
   VESTIDA PARA ADORAR — PAINEL ADMINISTRATIVO
   Página: Estoque — JavaScript
   Depende de: Supa.js, common.js, micro.js (carregados antes deste arquivo)
   ========================================================================== */

'use strict';

/* --------------------------------------------------------------------------
   1. ESTADO DA PÁGINA
   -------------------------------------------------------------------------- */
let produtos = [];

const state = {
  filters: { search: '', category: 'todas', status: 'todos' },
  page: 1,
  perPage: 5,
};

const situationMeta = {
  normal:     { label: 'Normal',      badge: 'badge--success' },
  baixo:      { label: 'Baixo',       badge: 'badge--warning' },
  semEstoque: { label: 'Sem estoque', badge: 'badge--danger' },
  inativo:    { label: 'Inativo',     badge: 'badge--muted' },
};

const movementIcons = { entrada: '↑', saida: '↓', ajuste: '⇄' };

/* --------------------------------------------------------------------------
   2. REFERÊNCIAS DO DOM (usando exatamente os IDs existentes no HTML)
   -------------------------------------------------------------------------- */
const dom = {
  tableBody: document.getElementById('tableBody'),
  cardsList: document.getElementById('cardsList'),
  emptyState: document.getElementById('emptyState'),
  tableWrap: document.querySelector('.table-wrap'),
  resultCount: document.getElementById('resultCount'),
  paginationInfo: document.getElementById('paginationInfo'),
  pagination: document.getElementById('pagination'),

  searchInput: document.getElementById('searchInput'),
  categoryFilter: document.getElementById('categoryFilter'),
  stockStatusFilter: document.getElementById('stockStatusFilter'),
  btnLimparFiltros: document.getElementById('btnLimparFiltros'),

  statValor: document.getElementById('statValor'),
  statNormal: document.getElementById('statNormal'),
  statBaixo: document.getElementById('statBaixo'),
  statSemEstoque: document.getElementById('statSemEstoque'),

  btnNovaMovimentacao: document.getElementById('btnNovaMovimentacao'),
  stockModalOverlay: document.getElementById('stockModalOverlay'),
  stockModalTitle: document.getElementById('stockModalTitle'),
  stockForm: document.getElementById('stockForm'),
  closeStockModal: document.getElementById('closeStockModal'),
  cancelStockModal: document.getElementById('cancelStockModal'),
  movementProduct: document.getElementById('movementProduct'),
  movementQty: document.getElementById('movementQty'),
  qtyMinus: document.getElementById('qtyMinus'),
  qtyPlus: document.getElementById('qtyPlus'),
  movementReason: document.getElementById('movementReason'),
  stockPreviewValue: document.getElementById('stockPreviewValue'),
  movementNote: document.getElementById('movementNote'),

  movementFeed: document.getElementById('movementFeed'),
};

/* --------------------------------------------------------------------------
   3. SUPABASE — CARREGAR PRODUTOS (consulta única)
   -------------------------------------------------------------------------- */
async function carregarProdutos() {

    const { data, error } =
    await supabaseClient
        .from('Produtos')
        .select('*')
        .order('nome', { ascending: true });

    if (error) {
        console.error(error);
        showToast('Erro ao carregar estoque.', 'danger');
        return [];
    }

    return data || [];
}

async function recarregarListaEstoque() {
  produtos = await carregarProdutos();
  preencherSelectProdutos();
  render();
}

/* --------------------------------------------------------------------------
   4. CÁLCULOS DE ESTOQUE (locais, com os nomes reais das colunas)
   -------------------------------------------------------------------------- */
function getEstoqueState(produto) {
  if (!produto.ativo) return 'inativo';
  if (produto.estoque === 0) return 'semEstoque';
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
   5. FILTRAGEM E PAGINAÇÃO
   -------------------------------------------------------------------------- */
function getFilteredStock() {
  const { search, category, status } = state.filters;

  return produtos.filter((p) => {
    const matchesSearch = p.nome.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === 'todas' || p.categoria === category;
    const matchesStatus = status === 'todos' || status === getEstoqueState(p);
    return matchesSearch && matchesCategory && matchesStatus;
  });
}

function getPageStock(list) {
  const start = (state.page - 1) * state.perPage;
  return list.slice(start, start + state.perPage);
}

/* --------------------------------------------------------------------------
   6. RENDERIZAÇÃO
   -------------------------------------------------------------------------- */
function renderTabela(lista) {
  dom.tableBody.innerHTML = '';

  lista.forEach((produto) => {
    const meta = situationMeta[getEstoqueState(produto)];

    dom.tableBody.innerHTML += `
      <tr>
        <td>
          <div class="product-cell">
            <div>
              <p class="product-cell__name">${escapeHtml(produto.nome)}</p>
            </div>
          </div>
        </td>
        <td>${escapeHtml(produto.categoria)}</td>
        <td style="text-align:center; font-weight:600;">${produto.estoque}</td>
        <td><span class="min-stock">${APP_CONFIG.lowStockThreshold}</span></td>
        <td><span class="badge ${meta.badge}">${meta.label}</span></td>
        <td>
          <div class="row-actions">
            <button type="button" class="btn btn--sm btn--secondary" onclick="abrirModalAjuste(${produto.id})">Ajustar</button>
          </div>
        </td>
      </tr>
    `;
  });
}

function renderCards(lista) {
  dom.cardsList.innerHTML = '';

  lista.forEach((produto) => {
    const meta = situationMeta[getEstoqueState(produto)];

    dom.cardsList.innerHTML += `
      <article class="product-card">
        <div class="product-card__body">
          <div class="product-card__top">
            <div>
              <p class="product-card__name">${escapeHtml(produto.nome)}</p>
              <p class="product-card__category">${escapeHtml(produto.categoria)}</p>
            </div>
            <span class="badge ${meta.badge}">${meta.label}</span>
          </div>
          <div class="product-card__meta">
            <span class="panel__footer-text">Estoque atual: <strong>${produto.estoque}</strong></span>
            <button type="button" class="btn btn--sm btn--secondary" onclick="abrirModalAjuste(${produto.id})">Ajustar</button>
          </div>
        </div>
      </article>
    `;
  });
}

function renderPaginacao(totalItems) {
  const totalPages = Math.max(1, Math.ceil(totalItems / state.perPage));
  if (state.page > totalPages) state.page = totalPages;

  dom.pagination.innerHTML = '';

  dom.pagination.innerHTML += `
    <button type="button" class="pagination__btn" ${state.page === 1 ? 'disabled' : ''} onclick="irParaPaginaEstoque(${state.page - 1})">‹</button>
  `;

  for (let i = 1; i <= totalPages; i++) {
    dom.pagination.innerHTML += `
      <button type="button" class="pagination__btn ${i === state.page ? 'is-active' : ''}" onclick="irParaPaginaEstoque(${i})">${i}</button>
    `;
  }

  dom.pagination.innerHTML += `
    <button type="button" class="pagination__btn" ${state.page === totalPages ? 'disabled' : ''} onclick="irParaPaginaEstoque(${state.page + 1})">›</button>
  `;
}

function irParaPaginaEstoque(pagina) {
  state.page = pagina;
  render();
}
window.irParaPaginaEstoque = irParaPaginaEstoque;

function renderStats() {
  const summary = getEstoqueSummary(produtos);
  dom.statValor.textContent = formatCurrency(getValorEstoque(produtos));
  dom.statNormal.textContent = summary.normal;
  dom.statBaixo.textContent = summary.baixo;
  dom.statSemEstoque.textContent = summary.semEstoque;
}

function render() {
  const filtered = getFilteredStock();
  const pageItems = getPageStock(filtered);

  renderTabela(pageItems);
  renderCards(pageItems);

  const isEmpty = filtered.length === 0;
  dom.emptyState.style.display = isEmpty ? 'flex' : 'none';
  dom.tableWrap.style.display = isEmpty ? 'none' : '';
  dom.cardsList.style.display = isEmpty ? 'none' : '';

  dom.resultCount.textContent = `${filtered.length} ite${filtered.length === 1 ? 'm' : 'ns'}`;

  const start = filtered.length === 0 ? 0 : (state.page - 1) * state.perPage + 1;
  const end = Math.min(state.page * state.perPage, filtered.length);
  dom.paginationInfo.textContent = `Mostrando ${filtered.length === 0 ? 0 : `${start}–${end}`} de ${filtered.length} itens`;

  renderPaginacao(filtered.length);
  renderStats();
}

/* --------------------------------------------------------------------------
   7. FILTROS — EVENTOS
   -------------------------------------------------------------------------- */
function bindFiltros() {
  dom.searchInput.addEventListener('input', debounce((e) => {
    state.filters.search = e.target.value.trim();
    state.page = 1;
    render();
  }));

  dom.categoryFilter.addEventListener('change', (e) => {
    state.filters.category = e.target.value;
    state.page = 1;
    render();
  });

  dom.stockStatusFilter.addEventListener('change', (e) => {
    state.filters.status = e.target.value;
    state.page = 1;
    render();
  });

  dom.btnLimparFiltros.addEventListener('click', () => {
    state.filters = { search: '', category: 'todas', status: 'todos' };
    dom.searchInput.value = '';
    dom.categoryFilter.value = 'todas';
    dom.stockStatusFilter.value = 'todos';
    state.page = 1;
    render();
  });
}

/* --------------------------------------------------------------------------
   8. MODAL — AJUSTAR ESTOQUE / NOVA MOVIMENTAÇÃO
   -------------------------------------------------------------------------- */
function preencherSelectProdutos() {
  dom.movementProduct.innerHTML = '<option value="">Selecione um produto</option>';

  produtos.forEach((produto) => {
    dom.movementProduct.innerHTML += `<option value="${produto.id}">${escapeHtml(produto.nome)}</option>`;
  });
}

function getProdutoSelecionado() {
  const id = dom.movementProduct.value;
  if (!id) return null;
  return produtos.find((p) => String(p.id) === String(id)) || null;
}

// id: quando vem de "Ajustar" (linha da tabela), pré-seleciona o produto.
// Quando vem de "Nova Movimentação" (botão do topo), abre sem produto definido.
function abrirModalAjuste(id) {
  dom.movementProduct.value = id ? String(id) : '';
  dom.stockModalTitle.textContent = id ? 'Ajustar Estoque' : 'Nova Movimentação';

  dom.movementQty.value = '1';
  dom.movementReason.value = '';
  dom.movementNote.value = '';

  const radioEntrada = document.querySelector('input[name="movementType"][value="entrada"]');
  if (radioEntrada) radioEntrada.checked = true;

  atualizarPreviewEstoque();
  dom.stockModalOverlay.classList.add('is-open');
  dom.movementProduct.focus();
}
window.abrirModalAjuste = abrirModalAjuste;

function fecharModalAjuste() {
  dom.stockModalOverlay.classList.remove('is-open');
}

function calcularNovoEstoque(estoqueAtual, tipo, quantidade) {
  if (tipo === 'entrada') return estoqueAtual + quantidade;
  if (tipo === 'saida') return Math.max(0, estoqueAtual - quantidade);
  // "ajuste" define diretamente o novo valor absoluto de estoque.
  return Math.max(0, quantidade);
}

function atualizarPreviewEstoque() {
  const produto = getProdutoSelecionado();

  if (!produto) {
    dom.stockPreviewValue.textContent = '—';
    return;
  }

  const quantidade = parseInt(dom.movementQty.value, 10) || 0;
  const tipo = document.querySelector('input[name="movementType"]:checked')?.value || 'entrada';
  const novoEstoque = calcularNovoEstoque(produto.estoque, tipo, quantidade);

  dom.stockPreviewValue.textContent = novoEstoque;
  dom.stockPreviewValue.classList.toggle('is-negative', novoEstoque === 0);
}

/* --------------------------------------------------------------------------
   9. SUPABASE — SALVAR AJUSTE (atualiza somente Produtos.estoque)
   -------------------------------------------------------------------------- */
async function salvarAjusteEstoque(e) {
  e.preventDefault();

  if (!dom.stockForm.checkValidity()) {
    dom.stockForm.reportValidity();
    return;
  }

  const produto = getProdutoSelecionado();
  if (!produto) return;

  const quantidade = parseInt(dom.movementQty.value, 10) || 0;
  const tipo = document.querySelector('input[name="movementType"]:checked')?.value || 'entrada';
  const motivo = dom.movementReason.value;
  const observacao = dom.movementNote.value.trim();

  const estoqueAnterior = produto.estoque;
  const estoqueNovo = calcularNovoEstoque(estoqueAnterior, tipo, quantidade);

  // 1. Primeiro atualiza Produtos.estoque.
  const { error: erroProduto } =
  await supabaseClient
      .from('Produtos')
      .update({ estoque: estoqueNovo })
      .eq('id', produto.id);

  if (erroProduto) {
      console.error(erroProduto);
      showToast('Erro ao atualizar estoque.', 'danger');
      return; // Se o UPDATE falhar, não grava a movimentação.
  }

  // 2. Só depois do UPDATE confirmado, grava o histórico em Movimentacoes.
  const usuario = await usuarioAtual();

  const { error: erroMovimentacao } =
  await supabaseClient
      .from('Movimentacoes')
      .insert({
          produto_id: produto.id,
          usuario_id: usuario ? usuario.id : null,
          tipo: tipo,
          quantidade: quantidade,
          estoque_anterior: estoqueAnterior,
          estoque_novo: estoqueNovo,
          motivo: motivo,
          observacao: observacao || null
      });

  if (erroMovimentacao) {
      console.error(erroMovimentacao);
      showToast('Estoque atualizado, mas houve erro ao registrar a movimentação.', 'danger');
  } else {
      showToast('Movimentação registrada com sucesso.');
  }

  fecharModalAjuste();

  await recarregarListaEstoque();
  await carregarMovimentacoesRecentes();
}

function bindModal() {
  dom.btnNovaMovimentacao.addEventListener('click', () => abrirModalAjuste());
  dom.closeStockModal.addEventListener('click', fecharModalAjuste);
  dom.cancelStockModal.addEventListener('click', fecharModalAjuste);
  dom.stockModalOverlay.addEventListener('click', (e) => {
    if (e.target === dom.stockModalOverlay) fecharModalAjuste();
  });
  dom.stockForm.addEventListener('submit', salvarAjusteEstoque);

  dom.movementProduct.addEventListener('change', atualizarPreviewEstoque);
  dom.movementQty.addEventListener('input', atualizarPreviewEstoque);
  document.querySelectorAll('input[name="movementType"]').forEach((el) => {
    el.addEventListener('change', atualizarPreviewEstoque);
  });

  dom.qtyMinus.addEventListener('click', () => {
    const atual = parseInt(dom.movementQty.value, 10) || 1;
    dom.movementQty.value = Math.max(1, atual - 1);
    atualizarPreviewEstoque();
  });

  dom.qtyPlus.addEventListener('click', () => {
    const atual = parseInt(dom.movementQty.value, 10) || 1;
    dom.movementQty.value = atual + 1;
    atualizarPreviewEstoque();
  });
}

/* --------------------------------------------------------------------------
   10. MOVIMENTAÇÕES RECENTES (tabela Movimentacoes)
   -------------------------------------------------------------------------- */
function nomeProdutoPorId(id) {
  const produto = produtos.find((p) => String(p.id) === String(id));
  return produto ? produto.nome : 'Produto removido';
}

function formatarDataMovimentacao(isoString) {
  const data = new Date(isoString);
  const agora = new Date();

  const ontem = new Date(agora);
  ontem.setDate(agora.getDate() - 1);

  const hora = data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  if (data.toDateString() === agora.toDateString()) return `Hoje às ${hora}`;
  if (data.toDateString() === ontem.toDateString()) return `Ontem às ${hora}`;

  const dataCurta = data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  return `${dataCurta} às ${hora}`;
}

async function carregarMovimentacoesRecentes() {

    const { data, error } =
    await supabaseClient
        .from('Movimentacoes')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error(error);
        dom.movementFeed.innerHTML = `<p class="panel__footer-text">Erro ao carregar movimentações.</p>`;
        return;
    }

    renderMovimentacoes(data || []);
}

function renderMovimentacoes(lista) {
  if (lista.length === 0) {
    dom.movementFeed.innerHTML = `<p class="panel__footer-text">Nenhuma movimentação registrada ainda.</p>`;
    return;
  }

  dom.movementFeed.innerHTML = '';

  lista.forEach((m) => {
    const sinal = m.tipo === 'saida' ? '-' : '+';
    const classeSinal = m.tipo === 'saida' ? 'is-negative' : 'is-positive';

    dom.movementFeed.innerHTML += `
      <div class="movement-item">
        <div class="movement-item__icon movement-item__icon--${m.tipo}" aria-hidden="true">${movementIcons[m.tipo] || '•'}</div>
        <div style="flex:1;">
          <p class="movement-item__title">${escapeHtml(m.motivo)}</p>
          <p class="movement-item__time">${escapeHtml(nomeProdutoPorId(m.produto_id))}</p>
          ${m.observacao ? `<p class="movement-item__time">${escapeHtml(m.observacao)}</p>` : ''}
          <p class="movement-item__time">${formatarDataMovimentacao(m.created_at)}</p>
        </div>
        <span class="movement-item__qty ${classeSinal}">${sinal}${m.quantidade}</span>
      </div>
    `;
  });
}

/* --------------------------------------------------------------------------
   11. INICIALIZAÇÃO
   -------------------------------------------------------------------------- */
async function init() {
  bindFiltros();
  bindModal();
  bindMobileSidebar();

  bindEscToClose(
    ['#stockModalOverlay'],
    (el) => el.classList.remove('is-open')
  );

  await recarregarListaEstoque();
  await carregarMovimentacoesRecentes();
}

document.addEventListener('DOMContentLoaded', async () => {

    const autorizado = await protegerPagina();

    if (!autorizado) return;

    await init();
});
