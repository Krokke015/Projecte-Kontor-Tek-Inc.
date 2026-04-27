    // ── TABS ──
    function switchTab(tab) {
      document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
      document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
      document.getElementById('tab-' + tab).classList.add('active');
      document.querySelectorAll('.tab-btn')[tab === 'login' ? 0 : 1].classList.add('active');
      // Netejar missatges en canviar de tab
      document.getElementById('loginMsg').style.display = 'none';
      document.getElementById('registerMsg').style.display = 'none';
    }

    // ── PASSWORD STRENGTH ──
    function checkPassStrength(val) {
      const bar  = document.getElementById('passBar');
      const hint = document.getElementById('passHint');
      let score = 0;
      if (val.length >= 8)  score++;
      if (val.length >= 12) score++;
      if (/[A-Z]/.test(val)) score++;
      if (/[0-9]/.test(val)) score++;
      if (/[^A-Za-z0-9]/.test(val)) score++;

      const levels = [
        { w: '20%', bg: '#ff4060', txt: 'Molt feble' },
        { w: '40%', bg: '#ff8c00', txt: 'Feble' },
        { w: '60%', bg: '#ffd700', txt: 'Acceptable' },
        { w: '80%', bg: '#00c8ff', txt: 'Bona' },
        { w: '100%',bg: '#00ff9d', txt: 'Excel·lent' },
      ];
      const lv = levels[Math.min(score, 4)];
      bar.style.width = val.length ? lv.w : '0%';
      bar.style.background = lv.bg;
      hint.textContent = val.length ? lv.txt : 'Introdueix una contrasenya';
      hint.style.color = val.length ? lv.bg : 'var(--text-dim)';
    }

    // ── TOAST ──
    function showToast(msg, type = 'success') {
      const t = document.getElementById('toast');
      t.textContent = msg;
      t.className = type === 'error' ? 'error show' : 'show';
      setTimeout(() => t.className = '', 3500);
    }

    // ── MSG ──
    function showMsg(id, msg, type) {
      const el = document.getElementById(id);
      el.textContent = msg;
      el.className = 'form-msg ' + type;
      el.style.display = 'block';
    }

    // ─────────────────────────────────────────────
    // LOGIN
    // Connecta amb /api/login.php via fetch (POST JSON)
    // ─────────────────────────────────────────────
    async function handleLogin(e) {
      e.preventDefault();
      const email = document.getElementById('loginEmail').value.trim();
      const pass  = document.getElementById('loginPass').value;

      /*
      ╔═══════════════════════════════════════════════════════════╗
      ║  🗄️  CONNEXIÓ BASE DE DADES — LOGIN                     ║
      ║  Canvia '/api/login.php' per la ruta real del teu server ║
      ║  Resposta esperada:                                       ║
      ║    { "success": true, "nom": "Nom" }                     ║
      ║    { "success": false, "error": "Missatge" }             ║
      ╚═══════════════════════════════════════════════════════════╝
      */
      try {
        const res  = await fetch('/api/login.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password: pass })
        });
        const data = await res.json();

        if (data.success) {
          showMsg('loginMsg', `✓ Benvingut/da, ${data.nom}! Redirigint...`, 'success');
          showToast(`Sessió iniciada: ${data.nom}`);
          // 🔀 REDIRECCIÓ: canvia per la URL del teu panell de control
          setTimeout(() => window.location.href = '/dashboard', 1500);
        } else {
          showMsg('loginMsg', `✗ ${data.error || 'Credencials incorrectes.'}`, 'error');
        }
      } catch (err) {
        showMsg('loginMsg', '⚠ Servidor no disponible. [Mode demo]', 'error');
        console.warn('Login error:', err);
      }
    }

    // ─────────────────────────────────────────────
    // REGISTRE
    // Connecta amb /api/register.php via fetch (POST JSON)
    // ─────────────────────────────────────────────
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

      /*
      ╔════════════════════════════════════════════════════════════════╗
      ║  🗄️  CONNEXIÓ BASE DE DADES — REGISTRE                      ║
      ║  Canvia '/api/register.php' per la ruta real del teu server  ║
      ║  Resposta esperada:                                           ║
      ║    { "success": true }                                        ║
      ║    { "success": false, "error": "Missatge" }                 ║
      ╚════════════════════════════════════════════════════════════════╝
      */
      try {
        const res  = await fetch('/api/register.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nom: nom + (cognom ? ' ' + cognom : ''), email, password: pass, pla })
        });
        const data = await res.json();

        if (data.success) {
          showMsg('registerMsg', '✓ Compte creat! Ara pots iniciar sessió.', 'success');
          showToast('Compte registrat amb èxit!');
          document.getElementById('registerForm').reset();
          document.getElementById('passBar').style.width = '0%';
          document.getElementById('passHint').textContent = 'Introdueix una contrasenya';
          setTimeout(() => switchTab('login'), 2000);
        } else {
          showMsg('registerMsg', `✗ ${data.error || 'Error en el registre.'}`, 'error');
        }
      } catch (err) {
        showMsg('registerMsg', '⚠ Servidor no disponible. [Mode demo]', 'error');
        console.warn('Register error:', err);
      }
    }

    // ── Detectar ?tab=register a la URL ──
    if (new URLSearchParams(window.location.search).get('tab') === 'register') {
      switchTab('register');
    }
  </script>
