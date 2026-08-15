/* ==========================================================================
   VESTIDA PARA ADORAR — PAINEL ADMINISTRATIVO
   Página: Produtos — JavaScript
   Depende de: Supa.js, common.js, micro.js (carregados antes deste arquivo)
   ========================================================================== */

'use strict';

/* --------------------------------------------------------------------------
   1. ESTADO DA PÁGINA
   -------------------------------------------------------------------------- */
let produtos = [];

const state = {
    filters: {
        search: "",
        category: "todas",
        status: "todos",
        sort: "recentes"
    },

    page: 1,
    perPage: 5,

    editingId: null,
    deletingId: null
};

/* --------------------------------------------------------------------------
   2. REFERÊNCIAS DO DOM
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
  statusFilter: document.getElementById('statusFilter'),
  sortFilter: document.getElementById('sortFilter'),
  btnLimparFiltros: document.getElementById('btnLimparFiltros'),

  statTotal: document.getElementById('statTotal'),
  statAtivos: document.getElementById('statAtivos'),
  statBaixo: document.getElementById('statBaixo'),
  statSemEstoque: document.getElementById('statSemEstoque'),

  btnNovoProduto: document.getElementById('btnNovoProduto'),
  productModalOverlay: document.getElementById('productModalOverlay'),
  productModalTitle: document.getElementById('productModalTitle'),
  productForm: document.getElementById('productForm'),
  closeProductModal: document.getElementById('closeProductModal'),
  cancelProductModal: document.getElementById('cancelProductModal'),
  productName: document.getElementById('productName'),
  productCategory: document.getElementById('productCategory'),
  productPrice: document.getElementById('productPrice'),
  productStock: document.getElementById('productStock'),
  productActive: document.getElementById('productActive'),
  productFeatured: document.getElementById('productFeatured'),
  productDescription: document.getElementById('productDescription'),
  productFabric: document.getElementById('productFabric'),
  productDiscount: document.getElementById('productDiscount'),
  productImageInput: document.getElementById('productImageInput'),
  uploadBoxText: document.getElementById('uploadBoxText'),

  deleteModalOverlay: document.getElementById('deleteModalOverlay'),
  deleteProductName: document.getElementById('deleteProductName'),
  closeDeleteModal: document.getElementById('closeDeleteModal'),
  cancelDeleteModal: document.getElementById('cancelDeleteModal'),
  confirmDeleteBtn: document.getElementById('confirmDeleteBtn'),
};

/* --------------------------------------------------------------------------
   3. SUPABASE — CARREGAR PRODUTOS
   -------------------------------------------------------------------------- */
async function carregarProdutos(){

    const { data, error } =
    await supabaseClient
        .from('Produtos')
        .select('*')
        .order('created_at', { ascending: false });

    if(error){
        console.error(error);
        showToast('Erro ao carregar produtos.', 'danger');
        return;
    }

    produtos = data || [];

    console.log("DATA DO SUPABASE");
    console.table(data);

    render();
}

/* --------------------------------------------------------------------------
   4. FILTRAGEM, ORDENAÇÃO E PAGINAÇÃO
   -------------------------------------------------------------------------- */
function getFilteredProducts() {
  const { search, category, status } = state.filters;

  let result = produtos.filter((p) => {
    const matchesSearch = p.nome.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === 'todas' || p.categoria === category;
    const matchesStatus =
      status === 'todos' ||
      (status === 'Ativo' && p.ativo) ||
      (status === 'Inativo' && !p.ativo);
    return matchesSearch && matchesCategory && matchesStatus;
  });

  switch (state.filters.sort) {
    case 'nome':
      result.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
      break;
    case 'preco-asc':
      result.sort((a, b) => a.preco - b.preco);
      break;
    case 'preco-desc':
      result.sort((a, b) => b.preco - a.preco);
      break;
    case 'estoque':
      result.sort((a, b) => a.estoque - b.estoque);
      break;
    default:
      result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  return result;
}

function getPageProducts(list) {
  const start = (state.page - 1) * state.perPage;
  return list.slice(start, start + state.perPage);
}

/* --------------------------------------------------------------------------
   5. RENDERIZAÇÃO
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

function productThumb(produto, imgClass) {

    if (produto.imagem) {

        const urlImagem = obterImagemProduto(produto.imagem);

        return `
            <img
                src="${urlImagem}"
                alt="${escapeHtml(produto.nome)}"
                class="${imgClass}">
        `;
    }

    const inicial = escapeHtml(produto.nome.charAt(0));

    return `
        <div class="${imgClass}"
             style="display:flex;align-items:center;justify-content:center;color:var(--rose-dark);font-family:var(--font-display);font-weight:600;">
             ${inicial}
        </div>
    `;
}

function renderTabela(lista) {
  dom.tableBody.innerHTML = '';

  lista.forEach(produto => {
    dom.tableBody.innerHTML += `
      <tr>
        <td>
          <div class="product-cell">
            ${productThumb(produto, 'product-cell__img')}
            <div>
              <p class="product-cell__name">${escapeHtml(produto.nome)}</p>
              <p class="product-cell__sku">${produto.destaque ? '★ Destaque' : ''}</p>
            </div>
          </div>
        </td>
        <td>${escapeHtml(produto.categoria)}</td>
        <td class="price-cell">${formatCurrency(produto.preco)}</td>
        <td>${stockLabel(produto.estoque)}</td>
        <td>${statusBadge(produto)}</td>
        <td>
          <div class="row-actions">
            <button class="icon-btn" onclick="editarProduto(${produto.id})" aria-label="Editar ${escapeHtml(produto.nome)}">✏</button>
            <button class="icon-btn icon-btn--danger" onclick="confirmarExclusaoProduto(${produto.id})" aria-label="Excluir ${escapeHtml(produto.nome)}">🗑</button>
          </div>
        </td>
      </tr>
    `;
  });
}

function renderCards(lista) {
  dom.cardsList.innerHTML = '';

  lista.forEach(produto => {
    dom.cardsList.innerHTML += `
      <article class="product-card">
        ${productThumb(produto, 'product-card__img')}
        <div class="product-card__body">
          <div class="product-card__top">
            <div>
              <p class="product-card__name">${escapeHtml(produto.nome)}</p>
              <p class="product-card__category">${escapeHtml(produto.categoria)}</p>
            </div>
            ${statusBadge(produto)}
          </div>
          <p class="product-card__price">${formatCurrency(produto.preco)}</p>
          <div class="product-card__meta">
            <span class="panel__footer-text">Estoque: ${stockLabel(produto.estoque)}</span>
            <div class="product-card__actions">
              <button class="icon-btn" onclick="editarProduto(${produto.id})" aria-label="Editar ${escapeHtml(produto.nome)}">✏</button>
              <button class="icon-btn icon-btn--danger" onclick="confirmarExclusaoProduto(${produto.id})" aria-label="Excluir ${escapeHtml(produto.nome)}">🗑</button>
            </div>
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
    <button type="button" class="pagination__btn" ${state.page === 1 ? 'disabled' : ''} onclick="irParaPagina(${state.page - 1})">‹</button>
  `;

  for (let i = 1; i <= totalPages; i++) {
    dom.pagination.innerHTML += `
      <button type="button" class="pagination__btn ${i === state.page ? 'is-active' : ''}" onclick="irParaPagina(${i})">${i}</button>
    `;
  }

  dom.pagination.innerHTML += `
    <button type="button" class="pagination__btn" ${state.page === totalPages ? 'disabled' : ''} onclick="irParaPagina(${state.page + 1})">›</button>
  `;
}

function irParaPagina(pagina) {
  state.page = pagina;
  render();
}
window.irParaPagina = irParaPagina;

function renderStats() {
  const total = produtos.length;
  const ativos = produtos.filter((p) => p.ativo).length;
  const baixo = produtos.filter((p) => p.estoque > 0 && p.estoque <= APP_CONFIG.lowStockThreshold).length;
  const semEstoque = produtos.filter((p) => p.estoque === 0).length;

  dom.statTotal.textContent = total;
  dom.statAtivos.textContent = ativos;
  dom.statBaixo.textContent = baixo;
  dom.statSemEstoque.textContent = semEstoque;
}

function render() {
  const filtered = getFilteredProducts();
  const pageItems = getPageProducts(filtered);

  renderTabela(pageItems);
  renderCards(pageItems);

  const isEmpty = filtered.length === 0;
  dom.emptyState.style.display = isEmpty ? 'flex' : 'none';
  dom.tableWrap.style.display = isEmpty ? 'none' : '';
  dom.cardsList.style.display = isEmpty ? 'none' : '';

  dom.resultCount.textContent = `${filtered.length} produto${filtered.length === 1 ? '' : 's'}`;
  const start = filtered.length === 0 ? 0 : (state.page - 1) * state.perPage + 1;
  const end = Math.min(state.page * state.perPage, filtered.length);
  dom.paginationInfo.textContent = `Mostrando ${filtered.length === 0 ? 0 : `${start}–${end}`} de ${filtered.length} produtos`;
  renderPaginacao(filtered.length);

  renderStats();
}

/* --------------------------------------------------------------------------
   6. FILTROS — EVENTOS
   -------------------------------------------------------------------------- */
function bindFilters() {
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

  dom.statusFilter.addEventListener('change', (e) => {
    state.filters.status = e.target.value;
    state.page = 1;
    render();
  });

  dom.sortFilter.addEventListener('change', (e) => {
    state.filters.sort = e.target.value;
    render();
  });

  dom.btnLimparFiltros.addEventListener('click', () => {
    state.filters = { search: '', category: 'todas', status: 'todos', sort: 'recentes' };
    dom.searchInput.value = '';
    dom.categoryFilter.value = 'todas';
    dom.statusFilter.value = 'todos';
    dom.sortFilter.value = 'recentes';
    state.page = 1;
    render();
  });
}

/* --------------------------------------------------------------------------
   7. MODAL — NOVO / EDITAR PRODUTO
   -------------------------------------------------------------------------- */
function abrirModalProduto(produto = null) {
  state.editingId = produto ? produto.id : null;
  dom.productModalTitle.textContent = produto ? 'Editar Produto' : 'Novo Produto';

  dom.productForm.reset();
  dom.uploadBoxText.textContent = 'Clique para adicionar uma foto do produto';

  if (produto) {
    dom.productName.value = produto.nome;
    dom.productCategory.value = produto.categoria;
    dom.productPrice.value = produto.preco;
    dom.productStock.value = produto.estoque;
    dom.productActive.checked = produto.ativo;
    dom.productFeatured.checked = produto.destaque;
    dom.productDescription.value = produto.descricao || '';
    dom.productFabric.value = produto.tecido || '';
    dom.productDiscount.value = produto.desconto || '';

    const tamanhosAtuais = (produto.tamanho || '')
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    document.querySelectorAll('.product-size-checkbox').forEach((cb) => {
      cb.checked = tamanhosAtuais.includes(cb.value);
    });

  } else {
    dom.productActive.checked = true;
    dom.productFeatured.checked = false;
  }

  dom.productModalOverlay.classList.add('is-open');
  dom.productName.focus();
}

function editarProduto(id) {
  const produto = produtos.find((p) => p.id === id);
  if (produto) abrirModalProduto(produto);
}
window.editarProduto = editarProduto;

function fecharModalProduto() {
  dom.productModalOverlay.classList.remove('is-open');
  state.editingId = null;
}

/* --------------------------------------------------------------------------
   8. SUPABASE — SALVAR PRODUTO (INSERT / UPDATE)
   -------------------------------------------------------------------------- */
async function salvarProduto(e) {
  e.preventDefault();

  if (!dom.productForm.checkValidity()) {
    dom.productForm.reportValidity();
    return;
  }

  const tamanhosSelecionados = Array.from(
    document.querySelectorAll('.product-size-checkbox:checked')
  ).map((cb) => cb.value);

  const desconto = dom.productDiscount.value === ''
    ? 0
    : parseFloat(dom.productDiscount.value);

  let imageUrl;
  const arquivo = dom.productImageInput.files[0];

  if (arquivo) {
    const extensao = arquivo.name.split('.').pop();
    const nomeArquivo = `produto_${Date.now()}.${extensao}`;

    const { error: erroUpload } = await supabaseClient
        .storage
        .from('produtos')
        .upload(nomeArquivo, arquivo);

    if (erroUpload) {
        console.error(erroUpload);
        showToast('Erro ao enviar a imagem.', 'danger');
        return;
    }
    imageUrl = nomeArquivo;
  }
  let imagemAntiga = null;

if (state.editingId) {

    const produtoAtual = produtos.find(
        p => p.id === state.editingId
    );

    imagemAntiga = produtoAtual?.imagem;

}

  const payload = {
    nome: dom.productName.value.trim(),
    categoria: dom.productCategory.value,
    preco: parseFloat(dom.productPrice.value),
    estoque: parseInt(dom.productStock.value, 10),
    ativo: dom.productActive.checked,
    destaque: dom.productFeatured.checked,
    descricao: dom.productDescription.value.trim(),
    tecido: dom.productFabric.value.trim(),
    tamanho: tamanhosSelecionados.join(', '),
    desconto: desconto,
    promocao: desconto > 0
  };

  if (imageUrl) {
    payload.imagem = imageUrl;
  }

  if (!state.editingId) {
    payload.novo = true;
  }

  if (state.editingId) {
    const { error } =
    await supabaseClient
        .from('Produtos')
        .update(payload)
        .eq('id', state.editingId);

    if (error) {
        console.error(error);
        showToast('Erro ao atualizar produto.', 'danger');
        return;
    }

    showToast('Produto atualizado com sucesso.');

  } else {
    const { error } =
    await supabaseClient
        .from('Produtos')
        .insert(payload);

    if (error) {
        console.error(error);
        showToast('Erro ao cadastrar produto.', 'danger');
        return;
    }

    showToast('Produto cadastrado com sucesso.');
  }
  if (
    imageUrl &&
    imagemAntiga &&
    imagemAntiga !== payload.imagem
) {

    await supabaseClient
        .storage
        .from("produtos")
        .remove([imagemAntiga]);

}

const { data, error } = await supabaseClient
    .storage
    .from("produtos")
    .remove([imagemAntiga]);

console.log("Imagem antiga:", imagemAntiga);
console.log("Remove retornou:", data);
console.log("Erro:", error);

  fecharModalProduto();
  state.page = 1;

  await carregarProdutos();
}

function bindProductModal() {
  dom.btnNovoProduto.addEventListener('click', () => abrirModalProduto());
  dom.closeProductModal.addEventListener('click', fecharModalProduto);
  dom.cancelProductModal.addEventListener('click', fecharModalProduto);
  dom.productModalOverlay.addEventListener('click', (e) => {
    if (e.target === dom.productModalOverlay) fecharModalProduto();
  });
  dom.productForm.addEventListener('submit', salvarProduto);

  dom.productImageInput.addEventListener('change', () => {
    const file = dom.productImageInput.files[0];
    dom.uploadBoxText.textContent = file ? file.name : 'Clique para adicionar uma foto do produto';
  });
}

/* --------------------------------------------------------------------------
   9. MODAL — EXCLUIR PRODUTO
   -------------------------------------------------------------------------- */
function abrirModalExclusao(id) {
  const produto = produtos.find((p) => p.id === id);
  if (!produto) return;
  state.deletingId = id;
  dom.deleteProductName.textContent = produto.nome;
  dom.deleteModalOverlay.classList.add('is-open');
}

function confirmarExclusaoProduto(id) {
  abrirModalExclusao(id);
}
window.confirmarExclusaoProduto = confirmarExclusaoProduto;

function fecharModalExclusao() {
  dom.deleteModalOverlay.classList.remove('is-open');
  state.deletingId = null;
}
/* --------------------------------------------------------------------------
   10. SUPABASE — EXCLUIR PRODUTO
   -------------------------------------------------------------------------- */
async function excluirProduto() {

    const produto = produtos.find(p => p.id === state.deletingId);

    if (produto?.imagem) {

        const { error: erroStorage } = await supabaseClient
            .storage
            .from("produtos")
            .remove([produto.imagem]);
             
            console.log("Arquivo:", [produto.imagem]);
        if (erroStorage) {
            console.error("Erro ao apagar imagem:", erroStorage);
        }

    }

    const { error } = await supabaseClient
        .from("Produtos")
        .delete()
        .eq("id", state.deletingId);

    if (error) {
        console.error(error);
        showToast("Erro ao excluir produto.", "danger");
        return;
    }

    showToast("Produto excluído.", "danger");
    fecharModalExclusao();

    await carregarProdutos();
    }

function bindDeleteModal() {
  dom.closeDeleteModal.addEventListener('click', fecharModalExclusao);
  dom.cancelDeleteModal.addEventListener('click', fecharModalExclusao);
  dom.confirmDeleteBtn.addEventListener('click', excluirProduto);
  dom.deleteModalOverlay.addEventListener('click', (e) => {
    if (e.target === dom.deleteModalOverlay) fecharModalExclusao();
  });
}

/* --------------------------------------------------------------------------
   11. INICIALIZAÇÃO
   -------------------------------------------------------------------------- */
async function init() {
    bindFilters();
    bindProductModal();
    bindDeleteModal();
    bindMobileSidebar();

    bindEscToClose(
        ['#productModalOverlay', '#deleteModalOverlay'],
        (el) => el.classList.remove('is-open')
    );

    await carregarProdutos();
}

document.addEventListener("DOMContentLoaded", async () => {
    const autorizado = await protegerPagina();

    if (!autorizado) return;

    await init();
});