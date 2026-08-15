/* ==========================================================================
   VESTIDA PARA ADORAR — PAINEL ADMINISTRATIVO
   login.js — Lógica de autenticação com Supabase Auth
   ========================================================================== */

// Verifica se o usuário já está logado ao carregar a página
document.addEventListener('DOMContentLoaded', async () => {
  // Configura ouvintes de tecla Enter nos campos
  const campoSenha = document.getElementById('senha');
  const campoEmail = document.getElementById('email');

  if (campoSenha) {
    campoSenha.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') fazerLogin();
    });
  }
  if (campoEmail) {
    campoEmail.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') campoSenha && campoSenha.focus();
    });
  }

  // Se o usuário já estiver logado, redireciona automaticamente para visao-geral.html
  const sessao = await verificarLogin();
  if (sessao) {
    window.location.replace("visao-geral.html");
  }
});

/**
 * Realiza o login utilizando o Supabase Auth (signInWithPassword)
 */
async function fazerLogin() {
  const campoEmail = document.getElementById('email');
  const campoSenha = document.getElementById('senha');
  const btn = document.getElementById('btn-login');
  const loginError = document.getElementById('login-error');

  const email = campoEmail ? campoEmail.value.trim() : '';
  const senha = campoSenha ? campoSenha.value : '';

  // Limpar mensagens de erro anteriores
  document.querySelectorAll('.error-msg').forEach((el) => el.classList.remove('show'));
  document.querySelectorAll('input').forEach((el) => el.classList.remove('error'));
  if (loginError) {
    loginError.style.display = 'none';
    loginError.textContent = '';
  }

  let valido = true;

  if (!email || !email.includes('@')) {
    const emailErr = document.getElementById('email-error');
    if (emailErr) emailErr.classList.add('show');
    if (campoEmail) campoEmail.classList.add('error');
    valido = false;
  }

  if (!senha || senha.length < 6) {
    const senhaErr = document.getElementById('senha-error');
    if (senhaErr) senhaErr.classList.add('show');
    if (campoSenha) campoSenha.classList.add('error');
    valido = false;
  }

  if (!valido) return;

  // Estado de carregamento do botão
  if (btn) {
    btn.classList.add('loading');
    btn.textContent = 'Verificando...';
  }

  try {
    // Autenticação via Supabase Auth
    const { data, error } = await supabaseClient.auth.signInWithPassword({
    email,
    password: senha
});

    if (error || !data.session) {
      if (btn) {
        btn.classList.remove('loading');
        btn.textContent = 'Entrar no Painel';
      }
      if (loginError) {
        loginError.textContent = 'E-mail ou senha incorretos. Tente novamente.';
        loginError.style.display = 'block';
        loginError.classList.add('show');
      }
      if (campoEmail) campoEmail.classList.add('error');
      if (campoSenha) {
        campoSenha.classList.add('error');
        campoSenha.value = '';
      }
      return;
    }

    // ======================================================
// VERIFICA SE O USUÁRIO ESTÁ CADASTRADO NA TABELA ADMIN
// ======================================================

const user = data.user;

const { data: admin, error: adminError } = await supabaseClient
  .from("Admin")
  .select("*")
  .eq("ativo", true)
  .eq("id", user.id)
  .single();

if (adminError || !admin) {

  await supabaseClient.auth.signOut();

  if (btn) {
    btn.classList.remove('loading');
    btn.textContent = 'Entrar no Painel';
  }

  if (loginError) {
    loginError.textContent = 'Você não possui permissão para acessar este painel.';
    loginError.style.display = 'block';
    loginError.classList.add('show');
  }

  return;
}

    supabaseClient.auth.onAuthStateChange((event, session) => {

    if (event === "SIGNED_OUT"){

        window.location.replace("login.html");

    }

});

    // Sucesso no login
    if (btn) {
      btn.textContent = 'Bem-vinda! ❤️';
      btn.style.background = 'linear-gradient(135deg, #16a34a, #15803d)';
    }

    setTimeout(() => {
      window.location.replace("visao-geral.html");
    }, 500);

  } catch (err) {
    console.error('Erro ao realizar login:', err);
    if (btn) {
      btn.classList.remove('loading');
      btn.textContent = 'Entrar no Painel';
    }
    if (loginError) {
      loginError.textContent = 'Ocorreu um erro ao conectar ao servidor. Tente novamente.';
      loginError.style.display = 'block';
      loginError.classList.add('show');
    }
  }
}