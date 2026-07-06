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
            <div class="product-card">
                <div class="product-img">
                    <img src="${produto.imagem}" alt="${produto.nome}">
                </div>

                <div class="p-4">
                    <h3 class="font-display" style="font-size:1rem;color:var(--ink);margin-bottom:6px;">
                        ${produto.nome}
                    </h3>

                    <p style="font-size:0.9rem;color:var(--ink-soft);margin-bottom:4px;">
                        Quantidade: ${item.quantidade}
                    </p>

                    <p style="font-size:1rem;font-weight:600;color:var(--rose-dark);">
                        Subtotal: R$ ${subtotal.toFixed(2)}
                    </p>
                </div>
            </div>
        `;
    });

    if (resumo) {
        resumo.innerHTML = `
            <div style="background:white;padding:20px;border-radius:16px;">
                <h3 style="font-size:1.2rem;color:var(--ink);margin-bottom:10px;">
                    Resumo do Pedido
                </h3>
                <p style="font-size:1rem;font-weight:600;color:var(--rose-dark);">
                    Total: R$ ${total.toFixed(2)}
                </p>
            </div>
        `;
    }
}

carregarCarrinho();
