/* ==========================================================================
   VESTIDA PARA ADORAR — LOJA PÚBLICA
   detalhes-produto.js — Página pública de detalhes do produto
   Depende de: Supa.js, common.js, carrinho.js, favoritos.js
   (carregados antes deste arquivo)

   Não carrega vestidos.js aqui de propósito: vestidos.js busca TODOS os
   produtos ativos para montar a vitrine, e essa página só precisa de UM
   produto — buscar a lista inteira só para achar um item seria desperdício
   de consulta ao Supabase.
   ========================================================================== */

'use strict';

// Regra de parcelamento do cartão: mesma regra fixa já usada no card do
// grid (vestidos.js) — o banco guarda o preço total no cartão, não o valor
// da parcela, e não existe (ainda) uma coluna própria de "parcelas máximas".
const PARCELAS_CARTAO = 4;

//=============================
// FAVORITOS
// (mesma lógica de toggleWish já usada em vestidos.js — duplicada aqui de
// propósito, já que vestidos.js não é carregado nesta página. A atualização
// do contador continua vindo de favoritos.js, como em qualquer outra página.)
//=============================
let favoritos =
(JSON.parse(localStorage.getItem('favoritos')) || []).map(Number);

function toggleWish(event, btn, produtoId) {

    event.stopPropagation();

    const id = Number(produtoId);

    favoritos =
    (JSON.parse(localStorage.getItem('favoritos')) || []).map(Number);

    const index = favoritos.indexOf(id);

    if (index === -1) {
        favoritos.push(id);
        btn.classList.add("active");
    } else {
        favoritos.splice(index, 1);
        btn.classList.remove("active");
    }

    localStorage.setItem(
        "favoritos",
        JSON.stringify(favoritos)
    );

    atualizarContadorFavoritos();
}

//=============================
// LEITURA DO ID NA URL
//=============================
function obterIdProdutoDaUrl() {
    const params = new URLSearchParams(window.location.search);
    const idTexto = params.get('id');

    if (!idTexto) return null;

    const id = Number(idTexto);

    if (!Number.isFinite(id) || id <= 0) return null;

    return id;
}

//=============================
// SUPABASE — CARREGAR PRODUTO
//=============================
async function carregarProdutoDetalhe() {

    const idProduto = obterIdProdutoDaUrl();

    if (!idProduto) {
        mostrarErroProduto();
        return;
    }

    const { data, error } =
    await supabaseClient
        .from('Produtos')
        .select('*')
        .eq('id', idProduto)
        .single();

    if (error || !data) {
        console.error(error);
        mostrarErroProduto();
        return;
    }

    mostrarProdutoDetalhe(data);
}

//=============================
// ESTADOS DE TELA
//=============================
function mostrarErroProduto() {
    document.getElementById('pdEstadoCarregando').style.display = 'none';
    document.getElementById('pdConteudo').style.display = 'none';
    document.getElementById('pdEstadoErro').style.display = 'flex';
}

function montarBadge(produto) {
    let badge = '';

    if (produto.novo) {
        badge = `<div class="product-badge">Novo</div>`;
    }
    if (produto.promocao) {
        badge = `
        <div class="product-badge" style="background:linear-gradient(135deg,var(--rose-muted),var(--rose-dark));">
            Promo
        </div>`;
    }
    if (produto.desconto) {
        badge = `
        <div class="product-badge" style="background:var(--rose-dark)">
            -${produto.desconto}%
        </div>`;
    }

    return badge;
}

function montarBlocoPrecos(produto) {
    const precoOriginal = Number(produto.preco);

    let html = `
        <p style="font-family:'Cormorant Garamond',serif;font-size:2.1rem;font-weight:600;color:var(--rose-dark);margin-bottom:6px;">
            R$ ${precoOriginal.toFixed(2)}
        </p>
    `;

    if (produto.preco_pix != null) {
        html += `
            <p style="font-size:0.95rem;color:var(--ink-soft);margin-bottom:3px;">
                No Pix: <strong style="color:var(--rose-muted);">R$ ${Number(produto.preco_pix).toFixed(2)}</strong>
            </p>
        `;
    }

    if (produto.preco_cartao != null) {
        const valorParcela = Number(produto.preco_cartao) / PARCELAS_CARTAO;
        html += `
            <p style="font-size:0.95rem;color:var(--ink-soft);margin-bottom:18px;">
                No cartão: R$ ${Number(produto.preco_cartao).toFixed(2)}
                em até ${PARCELAS_CARTAO}x de R$ ${valorParcela.toFixed(2)}
            </p>
        `;
    } else {
        html += `<div style="margin-bottom:18px;"></div>`;
    }

    return html;
}

function montarTamanhos(produto) {
    const tamanhos = (produto.tamanho || '')
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

    if (tamanhos.length === 0) {
        return `<span style="font-size:0.85rem;color:var(--ink-soft);">Não especificado</span>`;
    }

    return tamanhos
        .map((t) => `<span class="pd-size-chip">${escapeHtml(t)}</span>`)
        .join('');
}

function montarAcaoCompra(produto) {
    if (!produto.ativo) {
        return `<button type="button" class="pd-btn-indisponivel" disabled>Produto indisponível</button>`;
    }

    if (produto.estoque <= 0) {
        return `<button type="button" class="pd-btn-indisponivel" disabled>Esgotado</button>`;
    }

    return `
        <button
            type="button"
            class="btn-primary"
            onclick="adicionarAoCarrinho(${produto.id})"
            style="width:100%;justify-content:center;padding:16px;font-size:0.8rem;">
            Adicionar ao Carrinho
        </button>
    `;
}

function mostrarProdutoDetalhe(produto) {

    document.getElementById('pdEstadoCarregando').style.display = 'none';
    document.getElementById('pdEstadoErro').style.display = 'none';

    const conteudo = document.getElementById('pdConteudo');
    conteudo.style.display = 'grid';

    document.title = `${produto.nome} · Vestida para Adorar`;

    const breadcrumbNome = document.getElementById('pdBreadcrumbNome');
    if (breadcrumbNome) breadcrumbNome.textContent = produto.nome;

    const favorito = favoritos.includes(Number(produto.id));
    const badge = montarBadge(produto);

    const tecido = produto.tecido || 'Não especificado';
    const descricao = produto.descricao || 'Esse produto ainda não possui uma descrição detalhada.';

    const disponivel = produto.ativo && produto.estoque > 0;

    // Galeria (imagem)
    document.getElementById('pdGaleria').innerHTML = `
        <div class="product-img">
            <img src="${obterImagemProduto(produto.imagem)}" alt="${escapeHtml(produto.nome)}">

            ${badge}

            <div
                class="product-wishlist ${favorito ? 'active' : ''}"
                onclick="toggleWish(event, this, ${produto.id})">

                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    fill="currentColor"
                    viewBox="0 0 24 24">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5C2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
            </div>
        </div>
    `;

    // Informações do produto
    document.getElementById('pdInfo').innerHTML = `
        <p class="section-tag" style="margin-bottom:6px;">${escapeHtml(produto.categoria || '')}</p>

        <h1 class="font-display" style="font-size:clamp(1.8rem,4vw,2.6rem);font-weight:500;color:var(--ink);margin-bottom:16px;">
            ${escapeHtml(produto.nome)}
        </h1>

        ${montarBlocoPrecos(produto)}

        <div style="margin-bottom:24px;">
            <p style="font-size:0.72rem;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:var(--ink-soft);margin-bottom:10px;">
                Tamanhos disponíveis
            </p>
            <div style="display:flex;flex-wrap:wrap;gap:8px;">
                ${montarTamanhos(produto)}
            </div>
        </div>

        <div style="margin-bottom:24px;">
            <p style="font-size:0.72rem;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:var(--ink-soft);margin-bottom:8px;">
                Descrição
            </p>
            <p style="font-size:0.9rem;line-height:1.85;color:var(--ink-soft);">
                ${escapeHtml(descricao)}
            </p>
        </div>

        <div style="display:flex;gap:20px;flex-wrap:wrap;margin-bottom:28px;font-size:0.8rem;color:var(--ink-soft);">
            <span><strong style="color:var(--ink);">Tecido:</strong> ${escapeHtml(tecido)}</span>
            <span><strong style="color:var(--ink);">Estoque:</strong> ${disponivel ? produto.estoque + ' disponíveis' : 'indisponível'}</span>
        </div>

        ${montarAcaoCompra(produto)}

        <a href="Vestidos.html" class="btn-outline" style="margin-top:16px;width:100%;justify-content:center;">
            ← Voltar para a loja
        </a>
    `;
}

//=============================
// INICIALIZAÇÃO
//=============================
document.addEventListener('DOMContentLoaded', carregarProdutoDetalhe);
