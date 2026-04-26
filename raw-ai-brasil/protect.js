const PROTECTED_ROUTE_PASSWORD = '1990471Raw';

(function protectPage() {
  const entered = window.prompt('Digite a senha para acessar esta área protegida:');
  if (entered === PROTECTED_ROUTE_PASSWORD) {
    return;
  }

  document.documentElement.innerHTML = '<head><meta charset="UTF-8"><title>Acesso protegido</title><style>body{font-family:Arial,sans-serif;background:#0b1015;color:#edf3f8;display:grid;place-items:center;min-height:100vh;margin:0;padding:24px}div{max-width:520px;text-align:center}a{color:#56d4ff}</style></head><body><div><h1>Acesso protegido</h1><p>Senha inválida ou acesso cancelado.</p><p><a href=\"../index.html\">Voltar</a></p></div></body>';
})();
