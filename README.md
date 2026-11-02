# M4X — Frontend

HTML + CSS + JavaScript puro. Publicação: GitHub Pages (raiz do repositório).

- `index.html` — telas: login, cadastro, recuperar senha, painel, admin
- `style.css` — identidade visual (mobile-first)
- `script.js` — navegação, validação e `M4X_API` (pontos de integração)
- `images/` — referências visuais fornecidas

## Integração futura
1. Preencher `CONFIG` em `script.js` (somente URL e anon key públicas do Supabase).
2. Implementar as funções de `M4X_API`.
3. Proteger o painel admin com RLS/roles no Supabase (o frontend não é barreira de segurança).
4. Notificação no WhatsApp: enviar pelo backend (ex.: Edge Function ao criar usuário), com
   apenas e-mail e data de cadastro. O número de destino fica em secret do servidor. Nunca enviar senha.

Hoje nenhum formulário envia dados: todos respondem "Backend ainda não conectado".
Para visualizar os painéis: abra `#painel` ou `#admin` na URL.
