/* ==========================================================
   M4X — script.js  (somente frontend)
   Sem autenticação falsa, sem cadastros simulados, sem chaves.
   Toda a comunicação com o servidor passa pelo objeto M4X_API,
   que hoje apenas informa "backend não conectado".
   ========================================================== */
"use strict";

/* ---------- 1. Configuração (preencher na integração) ----------
   Somente valores PÚBLICOS (URL do projeto e anon key do Supabase).
   Nunca colocar service_role, senhas ou o número do WhatsApp aqui. */
const CONFIG = { SUPABASE_URL: "", SUPABASE_ANON_KEY: "" };

/* ---------- 2. Camada de API (ponto de integração) ----------
   Substituir cada função pela chamada real ao Supabase Auth/DB.
   Notificação ao WhatsApp: NÃO fazer aqui. O backend (ex.: Edge
   Function disparada pelo cadastro) envia apenas e-mail e data. */
const BACKEND_READY = Boolean(CONFIG.SUPABASE_URL && CONFIG.SUPABASE_ANON_KEY);
const notConnected = () => Promise.reject(new Error("Backend ainda não conectado. Nada foi enviado."));
const M4X_API = {
  signIn:        ({ email, password })       => notConnected(), // TODO supabase.auth.signInWithPassword
  signUp:        ({ name, email, password }) => notConnected(), // TODO supabase.auth.signUp (nome em metadata)
  resetPassword: ({ email })                 => notConnected(), // TODO supabase.auth.resetPasswordForEmail
  getProfile:    ()                          => notConnected(), // TODO consulta à tabela de perfis
  listUsers:     ()                          => notConnected(), // TODO consulta admin (protegida por RLS)
  signOut:       ()                          => Promise.resolve()
};

/* ---------- 3. Navegação por hash (#login, #cadastro...) ---------- */
const VIEWS = ["login", "cadastro", "recuperar", "painel", "admin"];
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

function route() {
  const name = VIEWS.includes(location.hash.slice(1)) ? location.hash.slice(1) : "login";
  $$(".view").forEach(v => { v.hidden = v.dataset.view !== name; });
  window.scrollTo(0, 0);
  if (name === "painel") loadPanel();
  if (name === "admin") loadAdmin();
}
addEventListener("hashchange", route);

/* ---------- 4. Validação ---------- */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
function validate(form) {
  const f = Object.fromEntries(new FormData(form));
  const errors = {};
  if (form.name && "name" in f && f.name.trim().length < 2) errors.name = "Informe seu nome.";
  if (!EMAIL_RE.test((f.email || "").trim())) errors.email = "Informe um e-mail válido.";
  if ("password" in f && f.password.length < 8) errors.password = "A senha precisa ter ao menos 8 caracteres.";
  if ("confirm" in f && f.confirm !== f.password) errors.confirm = "As senhas não coincidem.";
  if (form.privacy && !form.privacy.checked) errors.privacy = "Aceite o aviso de privacidade para continuar.";
  return { data: f, errors };
}

function say(form, text, info = false) {
  const el = $(".msg", form);
  el.textContent = text;
  el.classList.toggle("is-info", info);
}

/* ---------- 5. Formulários ---------- */
const handlers = {
  login:     d => M4X_API.signIn(d).then(() => { location.hash = "#painel"; }),
  cadastro:  d => M4X_API.signUp(d).then(() => { location.hash = "#login"; }),
  recuperar: d => M4X_API.resetPassword(d).then(() => "Se o e-mail existir, o link foi enviado.")
};

$$("form[data-form]").forEach(form => {
  form.addEventListener("submit", async e => {
    e.preventDefault();
    const { data, errors } = validate(form);
    $$("input", form).forEach(i => i.removeAttribute("aria-invalid"));
    const keys = Object.keys(errors);
    if (keys.length) {
      const first = form.elements[keys[0]];
      if (first) { first.setAttribute("aria-invalid", "true"); first.focus(); }
      return say(form, errors[keys[0]]);
    }
    const btn = $(".btn", form);
    btn.disabled = true; say(form, "Enviando…", true);
    try {
      const out = await handlers[form.dataset.form](data);
      say(form, out || "", true);
    } catch (err) {
      say(form, err.message);
    } finally { btn.disabled = false; }
  });
});

/* Mostrar / ocultar senha */
$$(".pw__toggle").forEach(b => b.addEventListener("click", () => {
  const input = $("input", b.parentElement);
  const show = input.type === "password";
  input.type = show ? "text" : "password";
  b.textContent = show ? "ocultar" : "ver";
  b.setAttribute("aria-label", show ? "Ocultar senha" : "Mostrar senha");
}));

$$("[data-logout]").forEach(a => a.addEventListener("click", () => M4X_API.signOut()));
$$("[data-soon]").forEach(a => a.addEventListener("click", e => e.preventDefault()));

/* ---------- 6. Painel do usuário ---------- */
const bind = (k, v) => $$(`[data-bind="${k}"]`).forEach(el => { el.textContent = v; });

/* Recebe o perfil real vindo do backend: { name, email, created_at } */
function renderProfile(p) {
  bind("greeting", `Olá, ${p.name}`);
  bind("status", "Conta ativa");
  bind("name", p.name);
  bind("email", p.email);
  bind("since", new Date(p.created_at).toLocaleDateString("pt-BR"));
}
function loadPanel() {
  M4X_API.getProfile().then(renderProfile).catch(() => bind("greeting", "Olá"));
}

/* ---------- 7. Painel administrativo ---------- */
/* Recebe lista real: [{ email, created_at }]. Usa textContent (sem HTML injetado). */
function renderUsers(users) {
  const ul = $("#user-list");
  ul.replaceChildren();
  users.forEach(u => {
    const li = document.createElement("li");
    const mail = document.createElement("span");
    const date = document.createElement("small");
    mail.textContent = u.email;
    date.textContent = "Cadastro: " + new Date(u.created_at).toLocaleDateString("pt-BR");
    li.append(mail, date);
    ul.append(li);
  });
  $("#user-empty").hidden = users.length > 0;
  bind("total", String(users.length));
}
function loadAdmin() {
  M4X_API.listUsers().then(renderUsers).catch(() => bind("total", "—"));
}

route();
