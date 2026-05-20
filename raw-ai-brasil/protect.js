const PROTECTED_ROUTE_PASSWORD = "1990471Raw";
const ACCESS_KEY = "raw-ai-protected-access-v2";

(function protectPage() {
  try {
    if (
      window.sessionStorage.getItem(ACCESS_KEY) === "granted" ||
      window.localStorage.getItem(ACCESS_KEY) === "granted"
    ) {
      window.sessionStorage.setItem(ACCESS_KEY, "granted");
      return;
    }
  } catch (error) {
    console.warn("Protected route storage unavailable", error);
  }

  const promptText =
    navigator.language && navigator.language.toLowerCase().startsWith("pt")
      ? "Digite a senha para acessar esta área protegida:"
      : "Enter the password to access this protected area:";

  const entered = window.prompt(promptText);
  if (entered === PROTECTED_ROUTE_PASSWORD) {
    try {
      window.sessionStorage.setItem(ACCESS_KEY, "granted");
      window.localStorage.setItem(ACCESS_KEY, "granted");
    } catch (error) {
      console.warn("Could not persist protected access", error);
    }
    return;
  }

  document.documentElement.innerHTML =
    '<head><meta charset="UTF-8"><title>Acesso protegido</title><style>body{font-family:Arial,sans-serif;background:#0b1015;color:#edf3f8;display:grid;place-items:center;min-height:100vh;margin:0;padding:24px}div{max-width:520px;text-align:center}a{color:#56d4ff}</style></head><body><div><h1>Acesso protegido</h1><p>Senha inválida ou acesso cancelado.</p><p><a href="../index.html">Voltar</a></p></div></body>';
})();
