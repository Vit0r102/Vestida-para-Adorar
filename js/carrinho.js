//==============================
//    CONTADOR DO CARRINHO
//==============================
function atualizarContadorCarrinho(){

    const carrinho =
    JSON.parse(localStorage.getItem('carrinho')) || [];

    let totalItens = 0;

    carrinho.forEach(item => {

        totalItens += item.quantidade;

    });

    const contador =
    document.getElementById('contador-carrinho');

    if(!contador) return;

    contador.textContent = totalItens;

    if(totalItens === 0){

        contador.style.display = 'none';

    }else{

        contador.style.display = 'flex';

    }

}

// =============================
// CARRINHO
// =============================

let carrinho =
JSON.parse(localStorage.getItem('carrinho')) || [];
async function adicionarAoCarrinho(produtoId){

    const { data, error } =
    await supabaseClient
        .from('Produtos')
        .select('*')
        .eq('id', produtoId)
        .single();

    if(error){
        console.error(error);
        return;
    }

    if(!data.ativo){

        alert('Produto indisponível.');
        return;

    }

    if(data.estoque <= 0){

        alert('Produto esgotado.');
        return;

    }

    const itemExistente =
    carrinho.find(item => item.id === produtoId);

    if(itemExistente){

        itemExistente.quantidade++;

    }else{

        carrinho.push({
            id: produtoId,
            quantidade: 1
        });

    }

    localStorage.setItem(
        'carrinho',
        JSON.stringify(carrinho)
    );
    atualizarContadorCarrinho();
    
    console.log("Carrinho:", carrinho);
}
window.adicionarAoCarrinho =
adicionarAoCarrinho;

atualizarContadorCarrinho(); 


async function carregarCarrinho() {
    const carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];

    const container = document.getElementById('lista-carrinho');
    const resumo = document.getElementById('resumo-carrinho');

    if (!container) return;

    if (carrinho.length === 0) {
        container.innerHTML = `
            <span style="color:var(--ink-soft);font-size:1rem;">
                Seu carrinho está vazio.
            </span>
        `;
        if (resumo) resumo.innerHTML = '';
        return;
    }

    const ids = carrinho.map(item => item.id);

    const { data, error } = await supabaseClient
        .from('Produtos')
        .select('*')
        .in('id', ids);

    if (error) {
        console.error(error);
        return;
    }

    let total = 0;

    container.innerHTML = '';

    carrinho.forEach(item => {
        const produto = data.find(p => p.id === item.id);

        if (!produto) return;

        const subtotal = Number(produto.preco) * item.quantidade;
        total += subtotal;

        container.innerHTML += `
            <div class="product" style="background:white; border-radius:30px;">
                <div class="product-img" style="border-radius:30px;">
                    <img src="${produto.imagem}" alt="${produto.nome}">
                </div>

                <div class="p-4" style="text-aling:center";>
                    <h3 class="font-display" style="font-size:1rem;color:var(--ink);margin-bottom:6px;">
                        ${produto.nome}
                    </h3>

                    <div style="display:flex;align-items:center; gap:10px; margin-bottom:10px;">
                    <button onclick="diminuirQuantidade(${produto.id})" style=" width:30px; height:30px; border-radius:50%; background:#f5f5f5; font-weight:bold;"> - </button>
                    <span>${item.quantidade}</span>
                    <button onclick="aumentarQuantidade(${produto.id})" style="width:30px; height:30px; border-radius:50%; background:#f5f5f5; font-weight:bold;"> + </button>
                    </div>

                    <p style="font-size:1rem;font-weight:600;color:var(--rose-dark);">
                        Subtotal: R$ ${subtotal.toFixed(2)}
                    </p>

                    <button onclick="removerProduto(${produto.id})" style=" margin-top:10px; background:var(--rose-dark); color:white; padding:8px 12px; border-radius:8px;text-alin:center"> Remover </button>

                </div>
            </div>
        `;
    });

   if (resumo) {

    resumo.innerHTML = `
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
                Resumo do Pedido
            </h3>

            <p style="
            font-size:1rem;
            font-weight:600;
            color:var(--rose-dark);
            margin-bottom:15px;
            ">
                Total: R$ ${total.toFixed(2)}
            </p>

            <button
            onclick="finalizarWhatsapp()"
            style="
            background:var(--rose-dark);
            color:white;
            padding:12px 20px;
            border-radius:10px;
            font-weight:600;
            ">
                Finalizar no WhatsApp
            </button>

        </div>
    `;
}
}

carregarCarrinho();

async function aumentarQuantidade(produtoId){

    const carrinho =
    JSON.parse(localStorage.getItem("carrinho")) || [];

    const item =
    carrinho.find(p => p.id === produtoId);

    if(!item) return;

    // Busca estoque atual
    const { data, error } =
    await supabaseClient
        .from("Produtos")
        .select("estoque")
        .eq("id", produtoId)
        .single();

    if(error){
        console.error(error);
        return;
    }

    if(item.quantidade >= data.estoque){

        alert("Não há mais unidades disponíveis desse produto.");
        return;

    }

    item.quantidade++;

    localStorage.setItem(
        "carrinho",
        JSON.stringify(carrinho)
    );

    carregarCarrinho();
    atualizarContadorCarrinho();

}
function diminuirQuantidade(produtoId){

    let carrinho =
    JSON.parse(localStorage.getItem('carrinho')) || [];

    const item =
    carrinho.find(item => item.id === produtoId);

    if(!item) return;

    item.quantidade--;

    if(item.quantidade <= 0){

        carrinho =
        carrinho.filter(
            p => p.id !== produtoId
        );

    }

    localStorage.setItem(
        'carrinho',
        JSON.stringify(carrinho)
    );

    carregarCarrinho();
    atualizarContadorCarrinho();
}
function removerProduto(produtoId){

    let carrinho =
    JSON.parse(localStorage.getItem('carrinho')) || [];

    carrinho =
    carrinho.filter(
        item => item.id !== produtoId
    );

    localStorage.setItem(
        'carrinho',
        JSON.stringify(carrinho)
    );

    carregarCarrinho();
    atualizarContadorCarrinho();
}


    function limparCarrinho(){

    localStorage.removeItem("carrinho");

    carregarCarrinho();

    atualizarContadorCarrinho();
    }

//-----------------------------------
//  FUNÇÃO DE VERIFICAÇÃO DE ESTOQUE
//-----------------------------------

    async function verificarEstoqueCarrinho() {

    const carrinho =
    JSON.parse(localStorage.getItem("carrinho")) || [];

    for (const item of carrinho) {

        const { data, error } =
        await supabaseClient
            .from("Produtos")
            .select("nome, estoque")
            .eq("id", item.id)
            .single();

        if (error) {

            console.error(error);
            return false;

        }

        if (item.quantidade > data.estoque) {

            alert(
                `O produto "${data.nome}" possui apenas ${data.estoque} unidade(s) disponível(is).`
            );

            return false;

        }

    }

    return true;

}


//-----------------------------------
//        FUNÇÃO WHATSAPP
//-----------------------------------


async function finalizarWhatsapp(){

    const estoqueOk =
await verificarEstoqueCarrinho();

if(!estoqueOk){

    return;

}

    const carrinho =
    JSON.parse(localStorage.getItem('carrinho')) || [];

    const ids =
    carrinho.map(item => item.id);

    const { data } =
    await supabaseClient
        .from('Produtos')
        .select('*')
        .in('id', ids);

    let mensagem =
`Olá! Gostaria de finalizar este pedido:%0A%0A`;

    let total = 0;

    carrinho.forEach(item => {

        const produto =
        data.find(
            p => p.id === item.id
        );

        if(!produto) return;

        const subtotal =
        produto.preco * item.quantidade;

        total += subtotal;

        mensagem += `| ${produto.nome}, Qtd: ${item.quantidade}, Subtotal: R$ ${subtotal.toFixed(2)} `;
    });

    mensagem += `%0ATotal do pedido: R$ ${total.toFixed(2)}`;
    window.open(
        `https://wa.me/556796317690?text=${mensagem}`,
        '_blank'
    );

    setTimeout(() => {

    limparCarrinho();

    },1000);
}
// ============================================================
//   ANIMAÇÕES    
// ============================================================

(function injetarEstilos() {
    if (document.getElementById('cr-anim-styles')) return;
    const style = document.createElement('style');
    style.id = 'cr-anim-styles';
    style.textContent = `
        @keyframes crFadeUp {
            from { opacity:0; transform:translateY(16px); }
            to   { opacity:1; transform:translateY(0);    }
        }
        @keyframes crQtyPop {
            0%  { transform:scale(1);    }
            45% { transform:scale(1.35); }
            100%{ transform:scale(1);    }
        }
        @keyframes crFadeOut {
            from { opacity:1; transform:scale(1);    }
            to   { opacity:0; transform:scale(0.95); }
        }
        @keyframes crToastIn  { from{opacity:0;transform:translateX(-50%) translateY(10px);}to{opacity:1;transform:translateX(-50%) translateY(0);} }
        @keyframes crToastOut { from{opacity:1;}to{opacity:0;} }
        @keyframes crDivider  { to{width:100%;} }
        @keyframes crBob      { 0%,100%{transform:translateY(0);}50%{transform:translateY(-7px);} }

        .cr-card {
            animation: crFadeUp 0.45s cubic-bezier(.22,1,.36,1) both;
            transition: box-shadow 0.3s, transform 0.3s;
        }
        .cr-card:hover { transform:translateY(-2px); box-shadow:0 10px 28px rgba(58,46,44,0.09)!important; }

        .cr-qty-btn {
            width:30px; height:30px; border-radius:50%;
            border:1.5px solid rgba(201,169,110,0.35);
            background:var(--linen-dark,#ede4d8); color:var(--ink,#3a2e2c);
            font-size:1rem; font-weight:700;
            display:inline-flex; align-items:center; justify-content:center;
            cursor:pointer;
            transition:background 0.2s, border-color 0.2s, transform 0.15s;
        }
        .cr-qty-btn:hover  { background:var(--blush,#f0c8c0); border-color:var(--rose-muted,#c9837a); }
        .cr-qty-btn:active { transform:scale(0.88); }

        .cr-qty-num {
            font-family:'Cormorant Garamond',serif;
            font-size:1.1rem; font-weight:600;
            min-width:22px; text-align:center;
            color:var(--ink,#3a2e2c); display:inline-block;
        }
        .cr-qty-num.pop { animation:crQtyPop 0.28s cubic-bezier(.22,1,.36,1); }

        .cr-btn-remover {
            display:inline-flex; align-items:center; gap:5px;
            margin-top:10px;
            background:transparent;
            border:1.5px solid rgba(160,90,82,0.28);
            color:var(--rose-dark,#a05a52);
            font-size:0.7rem; font-weight:600;
            letter-spacing:0.08em; text-transform:uppercase;
            padding:6px 14px; border-radius:50px; cursor:pointer;
            transition:background 0.22s, color 0.22s, transform 0.15s;
        }
        .cr-btn-remover:hover  { background:var(--rose-dark,#a05a52); color:white; }
        .cr-btn-remover:active { transform:scale(0.95); }

        .cr-resumo-inner { animation:crFadeUp 0.5s 0.15s cubic-bezier(.22,1,.36,1) both; }
        .cr-divider {
            height:1px;
            background:linear-gradient(to right,var(--gold,#c9a96e),transparent);
            margin:14px 0; width:0;
            animation:crDivider 0.9s 0.5s ease forwards;
        }

        .cr-btn-wa {
            display:flex; align-items:center; justify-content:center; gap:8px;
            width:100%;
            background:linear-gradient(135deg,#25d366,#128c54);
            color:white; font-family:'Jost',sans-serif;
            font-size:0.85rem; font-weight:600;
            letter-spacing:0.06em; text-transform:uppercase;
            padding:13px 20px; border-radius:50px;
            border:none; cursor:pointer;
            box-shadow:0 5px 18px rgba(37,211,102,0.28);
            transition:transform 0.2s, box-shadow 0.2s;
        }
        .cr-btn-wa:hover  { transform:translateY(-2px); box-shadow:0 8px 24px rgba(37,211,102,0.38); }
        .cr-btn-wa:active { transform:scale(0.97); }

        .cr-vazio {
            grid-column:1/-1;
            display:flex; flex-direction:column;
            align-items:center; justify-content:center;
            padding:72px 24px; text-align:center;
            animation:crFadeUp 0.5s cubic-bezier(.22,1,.36,1) both;
        }
        .cr-vazio-icon { font-size:3.2rem; margin-bottom:18px; animation:crBob 4s ease-in-out infinite; }
        .cr-vazio h3 { font-family:'Cormorant Garamond',serif; font-size:1.7rem; font-weight:300; color:var(--ink,#3a2e2c); margin-bottom:8px; }
        .cr-vazio p  { color:var(--ink-soft,#6b5753); font-size:0.88rem; line-height:1.7; margin-bottom:26px; }
        .cr-btn-loja {
            display:inline-flex; align-items:center; gap:6px;
            background:var(--rose-dark,#a05a52); color:white; text-decoration:none;
            font-size:0.8rem; font-weight:600;
            letter-spacing:0.1em; text-transform:uppercase;
            padding:12px 26px; border-radius:50px;
            transition:transform 0.2s, box-shadow 0.2s;
            box-shadow:0 5px 16px rgba(160,90,82,0.28);
        }
        .cr-btn-loja:hover { transform:translateY(-2px); box-shadow:0 8px 22px rgba(160,90,82,0.36); }

        #cr-toast {
            position:fixed; bottom:88px; left:50%;
            transform:translateX(-50%) translateY(10px);
            background:var(--ink,#3a2e2c); color:white;
            font-size:0.78rem; font-weight:500; letter-spacing:0.06em;
            padding:11px 22px; border-radius:50px; white-space:nowrap;
            box-shadow:0 6px 20px rgba(58,46,44,0.22);
            opacity:0; pointer-events:none; z-index:9999;
        }
        #cr-toast.show { animation:crToastIn  0.35s ease forwards; }
        #cr-toast.hide { animation:crToastOut 0.35s ease forwards; }
    `;
    document.head.appendChild(style);
})();

/* ── Toast helper ────────────────────────────────────────── */
function crToast(msg) {
    let t = document.getElementById('cr-toast');
    if (!t) {
        t = document.createElement('div');
        t.id = 'cr-toast';
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

/* ── Aplica animações ao HTML gerado pelo carregarCarrinho() ── */
function crAplicarAnimacoes() {
    const container = document.getElementById('lista-carrinho');
    const resumo    = document.getElementById('resumo-carrinho');

    if (container) {
        /* Estado vazio elegante */
        const spanVazio = container.querySelector('span');
        if (spanVazio && spanVazio.textContent.includes('vazio')) {
            container.innerHTML = `
                <div class="cr-vazio">
                    <div class="cr-vazio-icon">🛍️</div>
                    <h3>Seu carrinho está vazio</h3>
                    <p>Explore nossas peças e encontre algo especial<br/>para se vestir com fé e elegância.</p>
                    <a href="./Vestidos.html" class="cr-btn-loja">Ver Coleção ✦</a>
                </div>`;
            return;
        }

        /* Cards de produto */
        container.querySelectorAll('.product:not(.cr-card)').forEach((card, i) => {
            card.classList.add('cr-card');
            card.style.animationDelay = `${i * 0.07}s`;

            /* Botão − */
            const btnMenos = card.querySelector('button[onclick^="diminuirQuantidade"]');
            if (btnMenos) { btnMenos.className = 'cr-qty-btn'; btnMenos.textContent = '−'; }

            /* Span de quantidade */
            card.querySelectorAll('span').forEach(s => {
                if (/^\d+$/.test(s.textContent.trim())) s.classList.add('cr-qty-num');
            });

            /* Botão + com pop na quantidade */
            const btnMais = card.querySelector('button[onclick^="aumentarQuantidade"]');
            if (btnMais && !btnMais.dataset.crP) {
                btnMais.className = 'cr-qty-btn';
                btnMais.dataset.crP = '1';
                const idM = btnMais.getAttribute('onclick').match(/\d+/);
                if (idM) {
                    btnMais.removeAttribute('onclick');
                    btnMais.addEventListener('click', () => {
                        aumentarQuantidade(Number(idM[0]));
                        setTimeout(() => {
                            const num = card.querySelector('.cr-qty-num');
                            if (num) { num.classList.remove('pop'); void num.offsetWidth; num.classList.add('pop'); }
                        }, 250);
                    });
                }
                btnMais.textContent = '+';
            }

            /* Botão remover com saída animada */
            const btnRem = card.querySelector('button[onclick^="removerProduto"]');
            if (btnRem && !btnRem.dataset.crP) {
                const idR = btnRem.getAttribute('onclick').match(/\d+/);
                btnRem.className   = 'cr-btn-remover';
                btnRem.dataset.crP = '1';
                btnRem.innerHTML   = `<svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg> Remover`;
                if (idR) {
                    btnRem.removeAttribute('onclick');
                    btnRem.addEventListener('click', () => {
                        card.style.animation = 'crFadeOut 0.38s ease forwards';
                        card.style.overflow  = 'hidden';
                        setTimeout(() => {
                            removerProduto(Number(idR[0]));
                            crToast('Peça removida do carrinho ✦');
                        }, 360);
                    });
                }
            }
        });
    }

    /* Resumo */
    if (resumo && resumo.innerHTML.trim()) {
        const inner = resumo.querySelector('div');
        if (inner && !inner.classList.contains('cr-resumo-inner')) {
            inner.classList.add('cr-resumo-inner');

            const pTotal = inner.querySelector('p[style*="rose-dark"]');
            if (pTotal && !inner.querySelector('.cr-divider')) {
                const div = document.createElement('div');
                div.className = 'cr-divider';
                pTotal.after(div);
            }

            const btnWa = inner.querySelector('button[onclick="finalizarWhatsapp()"]');
            if (btnWa && !btnWa.classList.contains('cr-btn-wa')) {
                btnWa.className = 'cr-btn-wa';
                btnWa.addEventListener('click', () => crToast('Redirecionando para o WhatsApp... ✦'));
            }
        }
    }
}

/* ── MutationObserver — captura toda re-renderização ─────── */
document.addEventListener('DOMContentLoaded', () => {
    const lista  = document.getElementById('lista-carrinho');
    const resumo = document.getElementById('resumo-carrinho');
    if (lista)  new MutationObserver(crAplicarAnimacoes).observe(lista,  { childList:true, subtree:true });
    if (resumo) new MutationObserver(crAplicarAnimacoes).observe(resumo, { childList:true, subtree:true });
    setTimeout(crAplicarAnimacoes, 700);
});