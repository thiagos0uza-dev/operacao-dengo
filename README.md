# Operação: Dengo Não É Contrato

Experiência interativa (Vite + React + Three.js) — um robô muito incompetente investiga sentimentos.

## Rodar
```
npm install
npm run dev       # desenvolvimento
npm run build     # versão de produção em dist/
npm run preview   # testar a produção
npm test          # testes unitários (Vitest)
npm run test:e2e  # fluxo completo no navegador (Playwright, usa o Chrome instalado)
```

## Personalizar
Tudo fica em `src/content/config.ts` — procure por `✏️ PERSONALIZE`:
- `herName` (nome dela; vazio = "Agente")
- texto do pedido, frase final, mensagem da sala secreta, cores.

## Publicar no GitHub Pages
Publicado em https://thiagos0uza-dev.github.io/operacao-dengo/

Para atualizar depois de editar: `npm run deploy` (gera o build e envia para a branch `gh-pages`).
Alternativa com GitHub Actions: `docs/deploy-actions.yml` (exige token com escopo `workflow`; mova para `.github/workflows/`).

## Segredos
Clique muitas vezes no robô · 3 toques no pôster da Central · 3 toques nos planetas · 3 toques no logo "OP. DENGO" · tente mudar a "Probabilidade de saudade" · Milk Moo infinito.
