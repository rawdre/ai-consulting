const PROTECTED_ROUTE_PASSWORD = 'RawAiBrasil2026';
const PROTECTED_ROUTE_SESSION_KEY = 'raw_ai_protected_access_ok';

(function protectPage() {
  let allowed = false;
  try {
    allowed = sessionStorage.getItem(PROTECTED_ROUTE_SESSION_KEY) === '1';
  } catch (e) {}
  if (allowed) return;

  const entered = window.prompt('Digite a senha para acessar esta área protegida:');
  if (entered === PROTECTED_ROUTE_PASSWORD) {
    try {
      sessionStorage.setItem(PROTECTED_ROUTE_SESSION_KEY, '1');
    } catch (e) {}
    return;
  }

  document.documentElement.innerHTML = '<head><meta charset="UTF-8"><title>Acesso protegido</title><style>body{font-family:Arial,sans-serif;background:#0b1015;color:#edf3f8;display:grid;place-items:center;min-height:100vh;margin:0;padding:24px}div{max-width:520px;text-align:center}a{color:#56d4ff}</style></head><body><div><h1>Acesso protegido</h1><p>Senha inválida ou acesso cancelado.</p><p><a href=\"../index.html\">Voltar</a></p></div></body>';
})();
