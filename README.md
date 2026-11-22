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
1. Crie um repositório no GitHub e faça push da branch `main`.
2. No repositório: **Settings → Pages → Source: GitHub Actions**.
3. Cada push na `main` publica em `https://USUARIO.github.io/NOME-DO-REPOSITORIO/` (o caminho base é configurado sozinho pelo workflow).

## Segredos
Clique muitas vezes no robô · 3 toques no pôster da Central · 3 toques nos planetas · 3 toques no logo "OP. DENGO" · tente mudar a "Probabilidade de saudade" · Milk Moo infinito.
