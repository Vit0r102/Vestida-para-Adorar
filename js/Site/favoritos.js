// ── Atualizar contador de favoritos na navbar ─────────────
function atualizarContadorFavoritos() {

    const favoritos =
    JSON.parse(localStorage.getItem('favoritos')) || [];

    const totalFavoritos = favoritos.length;

    // Contador no texto da página
    const textoContador =
    document.getElementById('contador-favoritos-texto');

    if (textoContador) {

        textoContador.textContent =
        totalFavoritos === 1
            ? `1 peça salva`
            : `${totalFavoritos} peças salvas`;

    }

    // Badge na navbar (caso exista)
    const badge =
    document.getElementById('contador-favoritos');

    if (!badge) return;

    badge.textContent = totalFavoritos;

    if (totalFavoritos === 0) {

        badge.style.display = 'none';

    } else {

        badge.style.display = 'flex';

    }
}

atualizarContadorFavoritos();

// ── Carregar e renderizar lista de favoritos ──────────────
async function carregarFavoritos() {

    const favoritos =
    JSON.parse(localStorage.getItem('favoritos')) || [];

    const container =
    document.getElementById('lista-favoritos');

    const acoes =
    document.getElementById('acoes-favoritos');

    if (!container) return;

    // Estado vazio
    if (favoritos.length === 0) {

        container.innerHTML = `
            <span style="color:var(--ink-soft);font-size:1rem;">
                Você ainda não salvou nenhuma peça.
            </span>
        `;

        if (acoes) acoes.style.display = 'none';

        return;

    }

    // Busca produtos no Supabase
    const { data, error } =
    await supabaseClient
        .from('Produtos')
        .select('*')
        .in('id', favoritos);

    if (error) {
        console.error(error);
        return;
    }

    container.innerHTML = '';

    data.forEach(produto => {

        container.innerHTML += `
            <div class="product fav-card" style="background:white; border-radius:30px;" data-id="${produto.id}">

                <div class="product-img" style="border-radius:30px; position:relative;">
                    <img src="${produto.imagem}" alt="${produto.nome}">

                    <!-- Botão de remover favorito -->
                    <button
                        onclick="removerFavorito(${produto.id})"
                        class="fav-heart-btn active"
                        title="Remover dos favoritos"
                        aria-label="Remover dos favoritos">
                        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                        </svg>
                    </button>

                    <!-- Badge de estoque -->
                    ${produto.estoque <= 0
                        ? `<div class="product-badge" style="background:var(--ink-soft);">Esgotado</div>`
                        : produto.estoque <= 3
                        ? `<div class="product-badge" style="background:linear-gradient(135deg,var(--gold),#b8914a);">Últimas!</div>`
                        : ''}
                </div>

                <div class="p-4">

                    <p style="font-size:0.72rem;color:var(--ink-soft);margin-bottom:2px;">
                        Tamanhos: 42 ao 50
                    </p>

                    <h3 class="font-display" style="font-size:1rem;color:var(--ink);margin-bottom:6px;">
                        ${produto.nome}
                    </h3>

                    <p style="font-size:1rem;font-weight:600;color:var(--rose-dark);margin-bottom:14px;">
                        R$ ${Number(produto.preco).toFixed(2)}
                    </p>

                    <button
                        onclick="moverParaCarrinho(${produto.id})"
                        ${produto.estoque <= 0 ? 'disabled style="opacity:0.5;cursor:not-allowed;"' : ''}
                        class="fav-btn-carrinho">
                        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                        ${produto.estoque <= 0 ? 'Esgotado' : 'Adicionar ao Carrinho'}
                    </button>

                </div>
            </div>
        `;

    });

    // Painel de ações em lote
    if (acoes) {

        acoes.style.display = 'block';

        acoes.innerHTML = `
            <div style="
                background:white;
                padding:20px;
                border-radius:16px;
            ">

                <h3 style="
                    font-size:1.2rem;
                    color:var(--ink);
                    margin-bottom:10px;
                ">
                    Ações
                </h3>

                <p style="
                    font-size:0.85rem;
                    color:var(--ink-soft);
                    margin-bottom:16px;
                ">
                    ${data.length} ${data.length === 1 ? 'peça salva' : 'peças salvas'} na sua lista de desejos.
                </p>

                <div style="display:flex;flex-wrap:wrap;gap:10px;">

                    <button
                        onclick="moverTudoParaCarrinho()"
                        style="
                        background:var(--rose-dark);
                        color:white;
                        padding:12px 20px;
                        border-radius:10px;
                        font-weight:600;
                        ">
                        Mover tudo para o Carrinho
                    </button>

                    <button
                        onclick="limparFavoritos()"
                        style="
                        background:transparent;
                        color:var(--ink-soft);
                        padding:12px 20px;
                        border-radius:10px;
                        font-weight:600;
                        border:1.5px solid rgba(107,87,83,0.25);
                        ">
                        Limpar Lista
                    </button>

                </div>
            </div>
        `;

    }

    atualizarContadorFavoritos();
}

carregarFavoritos();

// ── Remover um favorito ───────────────────────────────────
function removerFavorito(produtoId) {

    let favoritos =
    JSON.parse(localStorage.getItem('favoritos')) || [];

    favoritos =
    favoritos.filter(id => id !== produtoId);

    localStorage.setItem(
        'favoritos',
        JSON.stringify(favoritos)
    );

    carregarFavoritos();
    atualizarContadorFavoritos();
}

window.removerFavorito = removerFavorito;

// ── Mover um produto para o carrinho ─────────────────────
async function moverParaCarrinho(produtoId) {

    await adicionarAoCarrinho(produtoId);
}

window.moverParaCarrinho = moverParaCarrinho;

// ── Mover todos os favoritos para o carrinho ──────────────
async function moverTudoParaCarrinho() {

    const favoritos =
    JSON.parse(localStorage.getItem('favoritos')) || [];

    if (favoritos.length === 0) return;

    for (const id of favoritos) {

        await adicionarAoCarrinho(id);

    }
}

window.moverTudoParaCarrinho = moverTudoParaCarrinho;

// ── Limpar todos os favoritos ─────────────────────────────
function limparFavoritos() {

    localStorage.removeItem('favoritos');

    carregarFavoritos();
    atualizarContadorFavoritos();
}

window.limparFavoritos = limparFavoritos;


// ============================================================
//   ANIMAÇÕES MINIMALISTAS — FAVORITOS
// ============================================================

/* ── Injeção de estilos ──────────────────────────────────── */
(function injetarEstilosFav() {

    if (document.getElementById('fav-anim-styles')) return;

    const style = document.createElement('style');
    style.id = 'fav-anim-styles';
    style.textContent = `

        /* Entrada dos cards */
        @keyframes favFadeUp {
            from { opacity:0; transform:translateY(16px); }
            to   { opacity:1; transform:translateY(0);    }
        }

        /* Saída ao remover */
        @keyframes favFadeOut {
            from { opacity:1; transform:scale(1);    }
            to   { opacity:0; transform:scale(0.94); }
        }

        /* Pulsação do coração */
        @keyframes heartBeat {
            0%  { transform:scale(1);   }
            30% { transform:scale(1.4); }
            60% { transform:scale(0.9); }
            100%{ transform:scale(1);   }
        }

        /* Toast */
        @keyframes favToastIn  { from{opacity:0;transform:translateX(-50%) translateY(10px);}to{opacity:1;transform:translateX(-50%) translateY(0);} }
        @keyframes favToastOut { from{opacity:1;}to{opacity:0;} }

        /* Divisor dourado */
        @keyframes favDivider  { to{width:100%;} }

        /* Bob do ícone vazio */
        @keyframes favBob { 0%,100%{transform:translateY(0);}50%{transform:translateY(-7px);} }

        /* Card */
        .fav-card {
            animation: favFadeUp 0.45s cubic-bezier(.22,1,.36,1) both;
            transition: box-shadow 0.3s, transform 0.3s;
        }
        .fav-card:hover {
            transform: translateY(-3px);
            box-shadow: 0 12px 32px rgba(58,46,44,0.10) !important;
        }

        /* Botão coração */
        .fav-heart-btn {
            position: absolute; top: 12px; right: 12px;
            width: 34px; height: 34px; border-radius: 50%;
            background: white;
            border: none; cursor: pointer;
            display: flex; align-items: center; justify-content: center;
            box-shadow: 0 2px 10px rgba(58,46,44,0.12);
            transition: background 0.2s, transform 0.15s;
            color: var(--rose-dark, #a05a52);
        }
        .fav-heart-btn:hover {
            background: var(--blush-light, #fdf0ee);
            transform: scale(1.1);
        }
        .fav-heart-btn:active { transform: scale(0.88); }
        .fav-heart-btn.active svg {
            animation: heartBeat 0.4s cubic-bezier(.22,1,.36,1);
        }

        /* Botão adicionar ao carrinho */
        .fav-btn-carrinho {
            display: inline-flex; align-items: center; justify-content: center; gap: 7px;
            width: 100%;
            background: var(--rose-dark, #a05a52);
            color: white;
            font-family: 'Jost', sans-serif;
            font-size: 0.78rem; font-weight: 600;
            letter-spacing: 0.07em; text-transform: uppercase;
            padding: 11px 16px; border-radius: 50px;
            border: none; cursor: pointer;
            box-shadow: 0 4px 14px rgba(160,90,82,0.25);
            transition: transform 0.2s, box-shadow 0.2s, background 0.2s;
        }
        .fav-btn-carrinho:hover {
            background: #8a4c45;
            transform: translateY(-1px);
            box-shadow: 0 7px 20px rgba(160,90,82,0.35);
        }
        .fav-btn-carrinho:active { transform: scale(0.97); }

        /* Painel de ações */
        .fav-acoes-inner {
            animation: favFadeUp 0.5s 0.15s cubic-bezier(.22,1,.36,1) both;
        }
        .fav-divider {
            height: 1px;
            background: linear-gradient(to right, var(--gold, #c9a96e), transparent);
            margin: 14px 0; width: 0;
            animation: favDivider 0.9s 0.5s ease forwards;
        }

        /* Botão mover tudo */
        .fav-btn-mover-tudo {
            display: inline-flex; align-items: center; gap: 7px;
            background: var(--rose-dark, #a05a52);
            color: white;
            font-family: 'Jost', sans-serif;
            font-size: 0.82rem; font-weight: 600;
            letter-spacing: 0.06em; text-transform: uppercase;
            padding: 12px 22px; border-radius: 50px;
            border: none; cursor: pointer;
            box-shadow: 0 5px 16px rgba(160,90,82,0.28);
            transition: transform 0.2s, box-shadow 0.2s;
        }
        .fav-btn-mover-tudo:hover { transform: translateY(-2px); box-shadow: 0 8px 22px rgba(160,90,82,0.38); }
        .fav-btn-mover-tudo:active { transform: scale(0.97); }

        /* Botão limpar */
        .fav-btn-limpar {
            display: inline-flex; align-items: center; gap: 7px;
            background: transparent;
            border: 1.5px solid rgba(107,87,83,0.25);
            color: var(--ink-soft, #6b5753);
            font-family: 'Jost', sans-serif;
            font-size: 0.82rem; font-weight: 600;
            letter-spacing: 0.06em; text-transform: uppercase;
            padding: 12px 22px; border-radius: 50px;
            cursor: pointer;
            transition: background 0.22s, color 0.22s, transform 0.15s;
        }
        .fav-btn-limpar:hover { background: var(--linen-dark, #ede4d8); color: var(--ink, #3a2e2c); }
        .fav-btn-limpar:active { transform: scale(0.96); }

        /* Estado vazio */
        .fav-vazio {
            grid-column: 1/-1;
            display: flex; flex-direction: column;
            align-items: center; justify-content: center;
            padding: 72px 24px; text-align: center;
            animation: favFadeUp 0.5s cubic-bezier(.22,1,.36,1) both;
        }
        .fav-vazio-icon { font-size: 3.2rem; margin-bottom: 18px; animation: favBob 4s ease-in-out infinite; }
        .fav-vazio h3 { font-family:'Cormorant Garamond',serif; font-size:1.7rem; font-weight:300; color:var(--ink,#3a2e2c); margin-bottom:8px; }
        .fav-vazio p  { color:var(--ink-soft,#6b5753); font-size:0.88rem; line-height:1.7; margin-bottom:26px; }
        .fav-btn-loja {
            display: inline-flex; align-items: center; gap: 6px;
            background: var(--rose-dark, #a05a52); color: white; text-decoration: none;
            font-size: 0.8rem; font-weight: 600;
            letter-spacing: 0.1em; text-transform: uppercase;
            padding: 12px 26px; border-radius: 50px;
            transition: transform 0.2s, box-shadow 0.2s;
            box-shadow: 0 5px 16px rgba(160,90,82,0.28);
        }
        .fav-btn-loja:hover { transform: translateY(-2px); box-shadow: 0 8px 22px rgba(160,90,82,0.36); }

        /* Toast */
        #fav-toast {
            position: fixed; bottom: 88px; left: 50%;
            transform: translateX(-50%) translateY(10px);
            background: var(--ink, #3a2e2c); color: white;
            font-size: 0.78rem; font-weight: 500; letter-spacing: 0.06em;
            padding: 11px 22px; border-radius: 50px;
            white-space: nowrap;
            box-shadow: 0 6px 20px rgba(58,46,44,0.22);
            opacity: 0; pointer-events: none; z-index: 9999;
        }
        #fav-toast.show { animation: favToastIn  0.35s ease forwards; }
        #fav-toast.hide { animation: favToastOut 0.35s ease forwards; }
    `;

    document.head.appendChild(style);

})();

/* ── Toast helper ────────────────────────────────────────── */
function favToast(msg) {

    let t = document.getElementById('fav-toast');

    if (!t) {
        t = document.createElement('div');
        t.id = 'fav-toast';
        document.body.appendChild(t);
    }

    t.textContent = msg;
    t.className = 'show';
    clearTimeout(t._timer);

    t._timer = setTimeout(() => {
        t.className = 'hide';
        setTimeout(() => { t.className = ''; }, 350);
    }, 2600);
}

/* ── Aplica animações ao HTML gerado pelo carregarFavoritos() ── */
function favAplicarAnimacoes() {

    const container =
    document.getElementById('lista-favoritos');

    const acoes =
    document.getElementById('acoes-favoritos');

    if (container) {

        /* Estado vazio elegante */
        const spanVazio = container.querySelector('span');

        if (spanVazio && spanVazio.textContent.includes('ainda não')) {

            container.innerHTML = `
                <div class="fav-vazio">
                    <div class="fav-vazio-icon">❤️</div>
                    <h3>Sua lista está vazia</h3>
                    <p>Explore nossa coleção e salve as peças<br/>que tocaram o seu coração.</p>
                    <a href="./Vestidos.html" class="fav-btn-loja">Ver Coleção ✦</a>
                </div>`;

            return;
        }

        /* Cards com delay escalonado */
        container.querySelectorAll('.fav-card:not([data-fav-anim])').forEach((card, i) => {

            card.setAttribute('data-fav-anim', '1');
            card.style.animationDelay = `${i * 0.07}s`;

            /* Botão de carrinho */
            const btnCarrinho =
            card.querySelector('button[onclick^="moverParaCarrinho"]');

            if (btnCarrinho && !btnCarrinho.dataset.favP) {

                btnCarrinho.dataset.favP = '1';
                btnCarrinho.classList.add('fav-btn-carrinho');
                const idMatch = btnCarrinho.getAttribute('onclick')?.match(/\d+/);

                if (idMatch) {
                    btnCarrinho.removeAttribute('onclick');
                    btnCarrinho.addEventListener('click', async () => {
                        btnCarrinho.textContent = 'Adicionando...';
                        btnCarrinho.disabled = true;
                        await moverParaCarrinho(Number(idMatch[0]));
                        btnCarrinho.innerHTML = `✦ Adicionado!`;
                        favToast('Peça adicionada ao carrinho ✦');
                        setTimeout(() => {
                            btnCarrinho.disabled = false;
                            btnCarrinho.innerHTML = `
                                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                                Adicionar ao Carrinho`;
                        }, 2500);
                    });
                }
            }

            /* Botão coração — animação ao remover */
            const btnHeart =
            card.querySelector('button[onclick^="removerFavorito"]');

            if (btnHeart && !btnHeart.dataset.favP) {

                btnHeart.dataset.favP = '1';
                const idRemove = btnHeart.getAttribute('onclick')?.match(/\d+/);

                if (idRemove) {
                    btnHeart.removeAttribute('onclick');
                    btnHeart.addEventListener('click', () => {
                        card.style.animation = 'favFadeOut 0.38s ease forwards';
                        card.style.overflow  = 'hidden';
                        setTimeout(() => {
                            removerFavorito(Number(idRemove[0]));
                            favToast('Peça removida dos favoritos ♡');
                        }, 360);
                    });
                }
            }
        });
    }

    /* Painel de ações */
    if (acoes && acoes.innerHTML.trim()) {

        const inner = acoes.querySelector('div');

        if (inner && !inner.classList.contains('fav-acoes-inner')) {

            inner.classList.add('fav-acoes-inner');

            /* Divisor dourado */
            const pInfo = inner.querySelector('p');

            if (pInfo && !inner.querySelector('.fav-divider')) {
                const div = document.createElement('div');
                div.className = 'fav-divider';
                pInfo.after(div);
            }

            /* Botão mover tudo */
            const btnMover =
            inner.querySelector('button[onclick="moverTudoParaCarrinho()"]');

            if (btnMover && !btnMover.classList.contains('fav-btn-mover-tudo')) {

                btnMover.className = 'fav-btn-mover-tudo';
                btnMover.removeAttribute('style');
                btnMover.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                    Mover tudo ao Carrinho`;

                btnMover.removeAttribute('onclick');
                btnMover.addEventListener('click', async () => {
                    btnMover.textContent = 'Adicionando...';
                    btnMover.disabled = true;
                    await moverTudoParaCarrinho();
                    btnMover.textContent = '✦ Tudo adicionado!';
                    favToast('Todas as peças foram ao carrinho ✦');
                    setTimeout(() => {
                        btnMover.disabled = false;
                        btnMover.innerHTML = `
                            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                            Mover tudo ao Carrinho`;
                    }, 3000);
                });
            }

            /* Botão limpar */
            const btnLimpar =
            inner.querySelector('button[onclick="limparFavoritos()"]');

            if (btnLimpar && !btnLimpar.classList.contains('fav-btn-limpar')) {

                btnLimpar.className = 'fav-btn-limpar';
                btnLimpar.removeAttribute('style');
                btnLimpar.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>
                    Limpar Lista`;

                btnLimpar.removeAttribute('onclick');
                btnLimpar.addEventListener('click', () => {
                    limparFavoritos();
                    favToast('Lista de favoritos limpa ♡');
                });
            }
        }
    }
}

/* ── MutationObserver — captura toda re-renderização ─────── */
document.addEventListener('DOMContentLoaded', () => {

    const lista =
    document.getElementById('lista-favoritos');

    const acoes =
    document.getElementById('acoes-favoritos');

    if (lista) {
        new MutationObserver(favAplicarAnimacoes)
            .observe(lista, { childList: true, subtree: true });
    }

    if (acoes) {
        new MutationObserver(favAplicarAnimacoes)
            .observe(acoes, { childList: true, subtree: true });
    }

    setTimeout(favAplicarAnimacoes, 700);

});
