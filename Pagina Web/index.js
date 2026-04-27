/* ============================================================
   index.js — Kontor Tek Inc.
   ============================================================ */

// ── TOAST ──────────────────────────────────────────────────
function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = type === 'error' ? 'error show' : 'show';
  setTimeout(() => t.className = '', 3500);
}

// ── FORM MESSAGE ───────────────────────────────────────────
function showMsg(id, msg, type) {
  const el = document.getElementById(id);
  el.textContent = msg;
  el.className = 'form-msg ' + type;
  el.style.display = 'block';
}

// ── LOGIN ───────────────────────────────────────────────────
/*
  🗄️  BACKEND: POST /api/login.php
  Rep:  { email, password }
  Ret:  { "success": true,  "nom": "Nom" }
      | { "success": false, "error": "Missatge" }
  Lògica PHP:
    SELECT id, nom, contrasenya FROM usuari WHERE email = ?
    password_verify($pass, $hash) → session_start(); $_SESSION['user_id'] = $id
*/
async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim();
  const pass  = document.getElementById('loginPass').value;

  try {
    const res  = await fetch('/api/login.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: pass })
    });
    const data = await res.json();

    if (data.success) {
      showMsg('loginMsg', `✓ Benvingut/da, ${data.nom}! Redirigint al panell...`, 'success');
      showToast(`Sessió iniciada: ${data.nom}`);
      // 🔀 Canvia '/dashboard' per la URL real del teu panell de control
      setTimeout(() => window.location.href = '/dashboard', 1500);
    } else {
      showMsg('loginMsg', `✗ ${data.error || 'Credencials incorrectes. Torna-ho a intentar.'}`, 'error');
    }
  } catch (err) {
    showMsg('loginMsg', '⚠ Servidor no disponible. [Mode demo]', 'error');
    console.warn('Login fetch error:', err);
  }
}

// ── REGISTER ────────────────────────────────────────────────
/*
  🗄️  BACKEND: POST /api/register.php
  Rep:  { nom, email, password, pla }
  Ret:  { "success": true }
      | { "success": false, "error": "Missatge" }
  Lògica PHP:
    Comprovar duplicat: SELECT id FROM usuari WHERE email = ?
    $hash = password_hash($pass, PASSWORD_BCRYPT)
    INSERT INTO usuari (nom, email, contrasenya, data_registre, subscrit) VALUES (?,?,?,NOW(),0)
    Si pla != '' → INSERT INTO subscripcio (id_usuari, tipus_pla, data_inici, estat) VALUES (?,?,NOW(),'pendent')
*/
async function handleRegister(e) {
  e.preventDefault();
  const nom    = document.getElementById('regNom').value.trim();
  const cognom = document.getElementById('regCognom').value.trim();
  const email  = document.getElementById('regEmail').value.trim();
  const pass   = document.getElementById('regPass').value;
  const pass2  = document.getElementById('regPass2').value;
  const pla    = document.getElementById('regPla').value;

  if (pass !== pass2) {
    showMsg('registerMsg', '✗ Les contrasenyes no coincideixen.', 'error'); return;
  }
  if (pass.length < 8) {
    showMsg('registerMsg', '✗ La contrasenya ha de tenir mínim 8 caràcters.', 'error'); return;
  }

  try {
    const res  = await fetch('/api/register.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nom: nom + ' ' + cognom, email, password: pass, pla })
    });
    const data = await res.json();

    if (data.success) {
      showMsg('registerMsg', '✓ Compte creat correctament! Ara pots iniciar sessió.', 'success');
      showToast('Compte registrat amb èxit!');
      document.getElementById('registerForm').reset();
    } else {
      showMsg('registerMsg', `✗ ${data.error || 'Error en el registre. Torna-ho a intentar.'}`, 'error');
    }
  } catch (err) {
    showMsg('registerMsg', '⚠ Servidor no disponible. [Mode demo]', 'error');
    console.warn('Register fetch error:', err);
  }
}

// ── SMOOTH SCROLL ───────────────────────────────────────────
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });
});

// ── MODAL HELPERS ───────────────────────────────────────────
function openModal(state, planName = '') {
  ['modal-no-auth', 'modal-no-plan', 'modal-download'].forEach(id => {
    document.getElementById(id).style.display = 'none';
  });
  document.getElementById(state).style.display = 'block';
  if (planName) document.getElementById('modal-plan-name').textContent = planName.toUpperCase();
  document.getElementById('dl-modal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('dl-modal').classList.remove('open');
  document.body.style.overflow = '';
}

function closeModalOutside(e) {
  if (e.target === document.getElementById('dl-modal')) closeModal();
}

document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

// ── DOWNLOAD CLICK ──────────────────────────────────────────
/*
  🗄️  BACKEND: GET /api/check-session.php  (credentials: 'include')
  Ret:  { "logged": false }
      | { "logged": true, "subscrit": false }
      | { "logged": true, "subscrit": true, "pla": "pro" }
  Lògica PHP:
    session_start();
    if (!isset($_SESSION['user_id'])) → { logged: false }
    SELECT tipus_pla, estat_subscripcio FROM subscripcio
      WHERE id_usuari = $uid AND estat_subscripcio = 'activa' LIMIT 1
    Si resultat → { logged: true, subscrit: true, pla: "pro" }
    Si no       → { logged: true, subscrit: false }
*/
async function handleDownloadClick(e) {
  e.preventDefault();

  try {
    const res  = await fetch('/api/check-session.php', { credentials: 'include' });
    const data = await res.json();

    if (!data.logged) {
      openModal('modal-no-auth');            // Cas 1: no ha iniciat sessió
    } else if (!data.subscrit) {
      openModal('modal-no-plan');            // Cas 2: sessió OK però sense pla
    } else {
      openModal('modal-download', data.pla); // Cas 3: tot OK, descarrega habilitada
    }

  } catch (err) {
    /*
      MODE DEMO — sense backend actiu.
      Canvia DEMO_STATE per provar cadascun dels 3 estats:
        'no-auth'  → usuari no registrat
        'no-plan'  → registrat però sense pla
        'has-plan' → registrat amb pla actiu
      Quan el backend estigui llest, elimina tot aquest bloc catch.
    */
    const DEMO_STATE = 'no-auth'; // ← CANVIA AQUÍ PER PROVAR
    console.warn('[DEMO] Backend no disponible. Estat simulat:', DEMO_STATE);

    if      (DEMO_STATE === 'no-auth')  openModal('modal-no-auth');
    else if (DEMO_STATE === 'no-plan')  openModal('modal-no-plan');
    else                                openModal('modal-download', 'Professional');
  }
}
