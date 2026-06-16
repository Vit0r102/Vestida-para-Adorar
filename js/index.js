async function carregarDestaques(){

    const { data, error } =
    await supabaseClient
        .from('Produtos')
        .select('*')
        .eq('ativo', true)
        .eq('destaque', true)
        .limit(6);

    if(error){
        console.error(error);
        return;
    }

    mostrarDestaques(data);
}

// =============================
// FAVORITOS
// =============================

let favoritos =
JSON.parse(localStorage.getItem('favoritos')) || [];

function toggleWish(event, btn, produtoId){

    event.stopPropagation();

    btn.classList.add('animate');

    setTimeout(() => {
        btn.classList.remove('animate');
    }, 450);

    const index = favoritos.indexOf(produtoId);

    if(index === -1){

        favoritos.push(produtoId);
        btn.classList.add('active');

    }else{

        favoritos.splice(index, 1);
        btn.classList.remove('active');

    }

    localStorage.setItem(
        'favoritos',
        JSON.stringify(favoritos)
    );
}

window.toggleWish = toggleWish;

// =============================
// DESTAQUES
// =============================

function mostrarDestaques(produtos){

    const container =
    document.getElementById('produtos-destaque');

    container.innerHTML = '';

    produtos.forEach(produto => {

        const favorito =
        favoritos.includes(produto.id);

        let badge = '';

        if(produto.novo){

            badge = `
            <div class="product-badge">
                Novo
            </div>
            `;
        }

        else if(produto.promoção){

            badge = `
            <div class="product-badge"
                style="background:linear-gradient(135deg,var(--rose-muted),var(--rose-dark));">
                Promoção
            </div>
            `;
        }

        else if(produto.desconto){

            badge = `
            <div class="product-badge"
                style="background:var(--rose-dark);">
                -${produto.desconto}%
            </div>
            `;
        }


        container.innerHTML += `

        <div class="product-card">

            <div class="product-img">

                <img
                    src="${produto.imagem}"
                    alt="${produto.nome}"
                >

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

            <div class="p-4">

                <h3
                    class="font-display"
                    style="
                        font-size:1.1rem;
                        color:var(--ink);
                        margin-bottom:6px;
                    ">
                    ${produto.nome}
                </h3>

                <p style="
                    font-size:0.72rem;
                    color:var(--ink-soft);
                    margin-bottom:4px;
                ">
                    Tamanhos: ${produto.tamanho || '42 ao 50'}
                </p>

               <p style="font-size:0.72rem;color:var(--ink-soft);margin-bottom:4px;">
                        Tecido: ${produto.tecido}
                    </p>

                <p style="
                    font-size:1rem;
                    font-weight:600;
                    color:var(--rose-dark);
                    margin-bottom:10px;
                ">
                    R$ ${Number(produto.preco).toFixed(2)}
                </p>

                <button
                    class="btn-primary"
                    onclick="adicionarAoCarrinho(${produto.id})"
                    style="
                        width:100%;
                        padding:10px;
                        font-size:0.52rem;
                        border-radius:10px;
                        justify-content:center;
                    ">
                    Adicionar ao Carrinho
                </button>

            </div>

        </div>

        `;
    });
}

carregarDestaques();