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
    deletingId: null,

    // Galeria de fotos do produto no modal (multi-imagem)
    galeria: {
        existentes: [],   // [{ id, imagem, ordem }] vindas do banco — id pode ser 'legado' (representa Produtos.imagem quando não há linhas em Produto_Imagens)
        removidasIds: [], // ids marcados para excluir (numbers reais, ou 'legado')
        novas: []          // File[] selecionados nesta sessão, ainda não enviados
    }
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
  productPricePix: document.getElementById('productPricePix'),
  productPriceCartao: document.getElementById('productPriceCartao'),
  productStock: document.getElementById('productStock'),
  productActive: document.getElementById('productActive'),
  productFeatured: document.getElementById('productFeatured'),
  productDescription: document.getElementById('productDescription'),
  productFabric: document.getElementById('productFabric'),
  productDiscount: document.getElementById('productDiscount'),
  productImageInput: document.getElementById('productImageInput'),
  productGalleryGrid: document.getElementById('productGalleryGrid'),

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
        .select(`
            *,
            Produto_Imagens ( id, imagem, ordem )
        `)
        .order('created_at', { ascending: false })
        .order('ordem', { foreignTable: 'Produto_Imagens', ascending: true });

    if(error){
        console.error(error);
        showToast('Erro ao carregar produtos.', 'danger');
        return;
    }

    produtos = data || [];


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
   7A. GALERIA DE FOTOS DO PRODUTO (multi-imagem)
   -------------------------------------------------------------------------- */
function resetGaleria() {
  state.galeria.existentes = [];
  state.galeria.removidasIds = [];
  state.galeria.novas = [];
}

function totalFotosGaleria() {
  const restantes = state.galeria.existentes.filter(
    (img) => !state.galeria.removidasIds.includes(img.id)
  );
  return restantes.length + state.galeria.novas.length;
}

function renderGaleria() {
  const itens = [];

  state.galeria.existentes.forEach((img) => {
    if (!state.galeria.removidasIds.includes(img.id)) {
      itens.push({ tipo: 'existente', dado: img });
    }
  });

  state.galeria.novas.forEach((file, index) => {
    itens.push({ tipo: 'nova', dado: file, index });
  });

  dom.productGalleryGrid.innerHTML = '';

  itens.forEach((item, posicao) => {
    const url = item.tipo === 'existente'
      ? obterImagemProduto(item.dado.imagem)
      : URL.createObjectURL(item.dado);

    const idParaRemover = item.tipo === 'existente'
      ? (item.dado.id === 'legado' ? `'legado'` : item.dado.id)
      : null;

    const onclickRemover = item.tipo === 'existente'
      ? `removerFotoExistente(${idParaRemover})`
      : `removerFotoNova(${item.index})`;

    dom.productGalleryGrid.innerHTML += `
      <div class="product-gallery-item">
        <img src="${url}" alt="Foto ${posicao + 1} do produto">
        ${posicao === 0 ? '<span class="product-gallery-item__cover-tag">Capa</span>' : ''}
        <button type="button" class="product-gallery-item__remove" onclick="${onclickRemover}" aria-label="Remover esta foto">✕</button>
      </div>
    `;
  });

  if (itens.length < 4) {
    dom.productGalleryGrid.innerHTML += `
      <button type="button" class="product-gallery-add" id="btnAdicionarFoto" aria-label="Adicionar foto">＋</button>
    `;
    document.getElementById('btnAdicionarFoto').addEventListener('click', () => dom.productImageInput.click());
  }
}

function removerFotoExistente(id) {
  state.galeria.removidasIds.push(id);
  renderGaleria();
}
window.removerFotoExistente = removerFotoExistente;

function removerFotoNova(index) {
  state.galeria.novas.splice(index, 1);
  renderGaleria();
}
window.removerFotoNova = removerFotoNova;

/* --------------------------------------------------------------------------
   7. MODAL — NOVO / EDITAR PRODUTO
   -------------------------------------------------------------------------- */
function abrirModalProduto(produto = null) {
  state.editingId = produto ? produto.id : null;
  dom.productModalTitle.textContent = produto ? 'Editar Produto' : 'Novo Produto';

  dom.productForm.reset();
  resetGaleria();

  if (produto) {
    dom.productName.value = produto.nome;
    dom.productCategory.value = produto.categoria;
    dom.productPrice.value = produto.preco;
    dom.productPricePix.value = produto.preco_pix ?? '';
    dom.productPriceCartao.value = produto.preco_cartao ?? '';
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

    const imagensCadastradas = Array.isArray(produto.Produto_Imagens) ? produto.Produto_Imagens : [];

    if (imagensCadastradas.length > 0) {
      state.galeria.existentes = imagensCadastradas
        .slice()
        .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0))
        .map((img) => ({ id: img.id, imagem: img.imagem, ordem: img.ordem }));
    } else if (produto.imagem) {
      // Produto antigo: só tem a foto em Produtos.imagem, nunca migrou
      // pra Produto_Imagens. Mostra como a primeira foto da galeria.
      state.galeria.existentes = [{ id: 'legado', imagem: produto.imagem, ordem: 0 }];
    }

  } else {
    dom.productActive.checked = true;
    dom.productFeatured.checked = false;
  }

  renderGaleria();

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

  const precoPix = dom.productPricePix.value === ''
    ? null
    : parseFloat(dom.productPricePix.value);

  const precoCartao = dom.productPriceCartao.value === ''
    ? null
    : parseFloat(dom.productPriceCartao.value);

  // ── 1. Upload das fotos novas selecionadas nesta sessão ──────────────
  const novosNomes = [];

  for (const arquivo of state.galeria.novas) {
    const extensao = arquivo.name.split('.').pop();
    const nomeArquivo = `produto_${Date.now()}_${novosNomes.length}.${extensao}`;

    const { error: erroUpload } = await supabaseClient
        .storage
        .from('produtos')
        .upload(nomeArquivo, arquivo);

    if (erroUpload) {
        console.error(erroUpload);
        showToast('Erro ao enviar uma das fotos.', 'danger');
        return;
    }

    novosNomes.push(nomeArquivo);
  }

  // ── 2. Galeria final (o que sobrou de existente + o que subiu agora) ─
  const restantes = state.galeria.existentes.filter(
    (img) => !state.galeria.removidasIds.includes(img.id)
  );

  const galeriaFinal = [
    ...restantes,
    ...novosNomes.map((imagem) => ({ id: null, imagem }))
  ];

  const payload = {
    nome: dom.productName.value.trim(),
    categoria: dom.productCategory.value,
    preco: parseFloat(dom.productPrice.value),
    preco_pix: precoPix,
    preco_cartao: precoCartao,
    estoque: parseInt(dom.productStock.value, 10),
    ativo: dom.productActive.checked,
    destaque: dom.productFeatured.checked,
    descricao: dom.productDescription.value.trim(),
    tecido: dom.productFabric.value.trim(),
    tamanho: tamanhosSelecionados.join(', '),
    desconto: desconto,
    promocao: desconto > 0,
    // A capa (Produtos.imagem) é sempre a primeira foto da galeria — é o
    // que o grid da loja, a tabela do admin e a Visão Geral leem direto,
    // sem passar por Produto_Imagens.
    imagem: galeriaFinal.length > 0 ? galeriaFinal[0].imagem : null
  };

  if (!state.editingId) {
    payload.novo = true;
  }

  // ── 3. Salva o produto (insert ou update) e garante o id ─────────────
  let produtoId = state.editingId;

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
    const { data: novoProduto, error } =
    await supabaseClient
        .from('Produtos')
        .insert(payload)
        .select()
        .single();

    if (error) {
        console.error(error);
        showToast('Erro ao cadastrar produto.', 'danger');
        return;
    }

    produtoId = novoProduto.id;
    showToast('Produto cadastrado com sucesso.');
  }

  // ── 4. Sincroniza Produto_Imagens ─────────────────────────────────────

  // Remove do banco as linhas que a admin marcou com o "×" (a foto
  // 'legado' nunca teve linha própria, então é ignorada aqui).
  const idsParaRemoverDoBanco = state.galeria.removidasIds.filter((id) => id !== 'legado');

  if (idsParaRemoverDoBanco.length > 0) {
    const { error: erroRemoverImagens } = await supabaseClient
        .from('Produto_Imagens')
        .delete()
        .in('id', idsParaRemoverDoBanco);

    if (erroRemoverImagens) {
        console.error('Erro ao remover imagens antigas:', erroRemoverImagens);
    }
  }

  // Se o produto passou a ter mais de 1 foto, toda foto precisa de uma
  // linha real em Produto_Imagens — inclusive uma foto legado que só
  // existia em Produtos.imagem, senão ela desaparece do carrossel da loja
  // (que ignora Produtos.imagem assim que existe qualquer linha lá).
  if (galeriaFinal.length > 1) {
    const linhasParaInserir = [];

    const legado = restantes.find((img) => img.id === 'legado');
    if (legado) {
      linhasParaInserir.push({
        produto_id: produtoId,
        imagem: legado.imagem,
        ordem: 0 // sempre a mais baixa: continua sendo a primeira/capa
      });
    }

    const maiorOrdemExistente = restantes.reduce((max, img) => {
      return typeof img.id === 'number' ? Math.max(max, img.ordem || 0) : max;
    }, 0);

    let proximaOrdem = maiorOrdemExistente + 1;
    novosNomes.forEach((nomeArquivo) => {
      linhasParaInserir.push({
        produto_id: produtoId,
        imagem: nomeArquivo,
        ordem: proximaOrdem++
      });
    });

    if (linhasParaInserir.length > 0) {
      const { error: erroInserirImagens } = await supabaseClient
          .from('Produto_Imagens')
          .insert(linhasParaInserir);

      if (erroInserirImagens) {
          console.error('Erro ao salvar novas imagens:', erroInserirImagens);
      }
    }
  }

  // ── 5. Limpa do Storage os arquivos das fotos removidas ──────────────
  const arquivosParaRemoverDoStorage = state.galeria.existentes
    .filter((img) => state.galeria.removidasIds.includes(img.id))
    .map((img) => img.imagem)
    .filter((nome) => nome && !nome.startsWith('http'));

  if (arquivosParaRemoverDoStorage.length > 0) {
    const { error: erroRemoverStorage } = await supabaseClient
        .storage
        .from('produtos')
        .remove(arquivosParaRemoverDoStorage);

    if (erroRemoverStorage) {
        console.error('Erro ao remover fotos do storage:', erroRemoverStorage);
    }
  }

  resetGaleria();
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
    const arquivosSelecionados = Array.from(dom.productImageInput.files || []);
    const vagas = 4 - totalFotosGaleria();

    if (arquivosSelecionados.length === 0) return;

    if (vagas <= 0) {
      showToast('Você já atingiu o limite de 4 fotos por produto.', 'danger');
      dom.productImageInput.value = '';
      return;
    }

    const aceitos = arquivosSelecionados.slice(0, vagas);

    if (arquivosSelecionados.length > vagas) {
      showToast(`Só cabiam mais ${vagas} foto${vagas === 1 ? '' : 's'} — o restante não foi adicionado.`, 'danger');
    }

    state.galeria.novas.push(...aceitos);
    dom.productImageInput.value = '';
    renderGaleria();
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