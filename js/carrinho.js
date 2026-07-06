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

//-----------------------------------
//        FUNÇÃO WHATSAPP
//-----------------------------------

async function finalizarWhatsapp(){

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
}