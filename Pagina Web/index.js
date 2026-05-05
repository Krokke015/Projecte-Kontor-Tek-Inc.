function showToast(msg, type) {
  var t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.className = (type === 'error') ? 'error show' : 'show';
  setTimeout(function() { t.className = ''; }, 3500);
}

function showMsg(id, msg, type) {
  var el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  el.className = 'form-msg ' + type;
  el.style.display = 'block';
}

async function handleLogin(e) {
  e.preventDefault();
  var email = document.getElementById('loginEmail').value.trim();
  var pass  = document.getElementById('loginPass').value;
  try {
    var res  = await fetch('/api/login.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email, password: pass })
    });
    var data = await res.json();
    if (data.success) {
      showMsg('loginMsg', 'Benvingut/da, ' + data.nom + '! Redirigint al panell...', 'success');
      showToast('Sessio iniciada: ' + data.nom, 'success');
      setTimeout(function() { window.location.href = '/dashboard'; }, 1500);
    } else {
      showMsg('loginMsg', data.error || 'Credencials incorrectes.', 'error');
    }
  } catch (err) {
    showMsg('loginMsg', 'Servidor no disponible.', 'error');
    console.warn('Login error:', err);
  }
}

async function handleRegister(e) {
  e.preventDefault();
  var nom    = document.getElementById('regNom').value.trim();
  var cognom = document.getElementById('regCognom').value.trim();
  var email  = document.getElementById('regEmail').value.trim();
  var pass   = document.getElementById('regPass').value;
  var pass2  = document.getElementById('regPass2').value;
  var pla    = document.getElementById('regPla').value;
  if (pass !== pass2) {
    showMsg('registerMsg', 'Les contrasenyes no coincideixen.', 'error'); return;
  }
  if (pass.length < 8) {
    showMsg('registerMsg', 'Minim 8 caracters.', 'error'); return;
  }
  try {
    var res  = await fetch('/api/register.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nom: nom + ' ' + cognom, email: email, password: pass, pla: pla })
    });
    var data = await res.json();
    if (data.success) {
      showMsg('registerMsg', 'Compte creat! Ara pots iniciar sessio.', 'success');
      showToast('Compte registrat amb exit!', 'success');
      document.getElementById('registerForm').reset();
    } else {
      showMsg('registerMsg', data.error || 'Error en el registre.', 'error');
    }
  } catch (err) {
    showMsg('registerMsg', 'Servidor no disponible.', 'error');
    console.warn('Register error:', err);
  }
}

document.querySelectorAll('a[href^="#"]').forEach(function(a) {
  a.addEventListener('click', function(e) {
    var target = document.querySelector(a.getAttribute('href'));
    if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth' }); }
  });
});

function openModal(state, planName) {
  ['modal-no-auth', 'modal-no-plan', 'modal-download'].forEach(function(id) {
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

document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') closeModal();
});

async function handleDownloadClick(e) {
  e.preventDefault();
  try {
    var res  = await fetch('/api/check-session.php', { credentials: 'include' });
    var data = await res.json();
    if (!data.logged)       openModal('modal-no-auth');
    else if (!data.subscrit) openModal('modal-no-plan');
    else                     openModal('modal-download', data.pla);
  } catch (err) {
    /* MODE DEMO: canvia DEMO_STATE per provar els 3 estats:
       'no-auth' | 'no-plan' | 'has-plan'
       Elimina aquest bloc catch quan el backend estigui llest. */
    var DEMO_STATE = 'has-plan';
    if      (DEMO_STATE === 'no-auth')  openModal('modal-no-auth');
    else if (DEMO_STATE === 'no-plan')  openModal('modal-no-plan');
    else                                openModal('modal-download', 'Professional');
  }
}
