
  import { createRoot } from "react-dom/client";
  import App from "./app/App.tsx";
  import "./styles/index.css";

  // Depois de uma atualização do site, quem estava com a versão anterior aberta
  // pede arquivos que não existem mais. Em vez de mostrar erro, recarrega uma vez.
  window.addEventListener("vite:preloadError", (event) => {
    event.preventDefault();
    try {
      if (sessionStorage.getItem("recarregou-apos-atualizacao")) return;
      sessionStorage.setItem("recarregou-apos-atualizacao", "1");
    } catch { /* sem sessionStorage: recarrega mesmo assim */ }
    window.location.reload();
  });
  window.addEventListener("load", () => {
    setTimeout(() => { try { sessionStorage.removeItem("recarregou-apos-atualizacao"); } catch { /* ok */ } }, 10000);
  });

  createRoot(document.getElementById("root")!).render(<App />);
