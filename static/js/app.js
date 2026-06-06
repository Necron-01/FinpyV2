// ============================================================
// FINPY — UI Layer (modals, forms, shared helpers)
// ============================================================

/* ---- HELPERS ---- */
function formatCOP(n) {
  return '$' + Math.round(Math.abs(n || 0)).toLocaleString('es-CO');
}

function fechaRel(fechaStr) {
  if (!fechaStr) return '';
  var hoy  = new Date(); hoy.setHours(0, 0, 0, 0);
  var f    = new Date(fechaStr + 'T12:00:00'); f.setHours(0, 0, 0, 0);
  var diff = Math.round((hoy - f) / 86400000);
  if (diff === 0) return 'Hoy';
  if (diff === 1) return 'Ayer';
  return f.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
}

function esc(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function showToast(msg, type) {
  var t = document.createElement('div');
  t.className = 'toast toast-' + (type || 'success');
  t.innerHTML = '<i class="fa-solid fa-circle-check"></i> ' + esc(msg);
  document.body.appendChild(t);
  setTimeout(function () { t.classList.add('show'); }, 10);
  setTimeout(function () { t.classList.remove('show'); setTimeout(function () { t.remove(); }, 300); }, 3000);
}
window.showToast = showToast;

/* ---- SIDEBAR USER INFO ---- */
function updateSidebarUser() {
  var user = FINPY.getCurrentUser();
  if (!user) return;
  var nameEls   = document.querySelectorAll('.sidebar-user-name');
  var avatarEls = document.querySelectorAll('.sidebar-user-avatar');
  nameEls.forEach(function (el) { el.textContent = user.nombre; });
  avatarEls.forEach(function (el) { el.textContent = user.nombre.charAt(0).toUpperCase(); });
}

/* ---- FECHA EN TOPBAR ---- */
function updateFechaHoy() {
  var el = document.getElementById('fechaHoy');
  if (!el) return;
  var hoy = new Date();
  var txt = hoy.toLocaleDateString('es-CO', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
  el.textContent = txt.charAt(0).toUpperCase() + txt.slice(1);
}

/* ---- CATEGORY SELECT HELPER ---- */
function fillCategorySelect(selectId, userId) {
  var sel = document.getElementById(selectId);
  if (!sel) return;
  var cats = FINPY.getCategories(userId);
  sel.innerHTML = '<option value="">Sin categoría</option>';
  cats.forEach(function (c) {
    var opt = document.createElement('option');
    opt.value = c.id;
    opt.textContent = c.nombre;
    sel.appendChild(opt);
  });
}

/* ---- TX ITEM HTML ---- */
function txItemHTML(tx, cats, showDelete) {
  var cat      = cats.find(function (c) { return c.id === tx.categoriaId; });
  var iconCls  = tx.tipo === 'ingreso' ? 'cat-income' : 'cat-' + (cat ? cat.color : 'white');
  var ico      = cat ? cat.icono : (tx.tipo === 'ingreso' ? 'fa-arrow-up' : 'fa-tag');
  var nombre   = tx.descripcion || (cat ? cat.nombre : (tx.tipo === 'ingreso' ? 'Ingreso' : 'Sin descripción'));
  var catName  = cat ? cat.nombre : (tx.tipo === 'ingreso' ? 'Ingreso' : 'Sin categoría');
  var amtCls   = tx.tipo === 'ingreso' ? 'income' : 'expense';
  var sign     = tx.tipo === 'ingreso' ? '+' : '-';
  var delBtn   = showDelete
    ? '<button class="tx-item-del" onclick="window.deleteTx(\'' + tx.id + '\')" title="Eliminar"><i class="fa-solid fa-trash-can"></i></button>'
    : '';
  return '<div class="tx-item" id="txrow-' + tx.id + '">' +
    '<div class="tx-icon ' + iconCls + '"><i class="fa-solid ' + ico + '"></i></div>' +
    '<div class="tx-info"><p class="tx-name">' + esc(nombre) + '</p><p class="tx-cat">' + esc(catName) + '</p></div>' +
    '<div class="tx-right"><p class="tx-amount ' + amtCls + '">' + sign + formatCOP(tx.monto) + '</p><p class="tx-date">' + fechaRel(tx.fecha) + '</p></div>' +
    delBtn + '</div>';
}

/* ---- GOAL ITEM HTML ---- */
function goalItemHTML(goal, colorClass, showActions) {
  var pct    = goal.monto_objetivo > 0 ? Math.min(100, Math.round((goal.monto_actual / goal.monto_objetivo) * 100)) : 0;
  var delBtn = showActions
    ? '<button class="btn-del-meta" onclick="window.deleteGoal(\'' + goal.id + '\')" title="Eliminar"><i class="fa-solid fa-trash-can"></i></button>'
    : '';
  var updateRow = showActions
    ? '<div class="update-input"><input type="number" placeholder="Nuevo monto ahorrado" min="0" id="upd-' + goal.id + '">' +
      '<button onclick="window.updateGoal(\'' + goal.id + '\')">Actualizar</button></div>'
    : '';
  return '<div class="meta-card" id="goal-' + goal.id + '">' +
    '<div class="meta-card-header">' +
      '<div class="meta-card-info">' +
        '<div class="goal-ico"><i class="fa-solid ' + (goal.icono || 'fa-bullseye') + '"></i></div>' +
        '<div><p class="goal-name">' + esc(goal.nombre) + '</p><p class="goal-amount">' + formatCOP(goal.monto_actual) + ' / ' + formatCOP(goal.monto_objetivo) + '</p></div>' +
      '</div>' +
      '<div class="meta-top-right"><span class="goal-pct">' + pct + '%</span>' + delBtn + '</div>' +
    '</div>' +
    '<div class="progress-track"><div class="progress-fill ' + colorClass + '" style="width:' + pct + '%"></div></div>' +
    updateRow +
    '</div>';
}

/* ---- MODAL HELPERS ---- */
function makeModalControls(overlayId, openBtnIds, closeBtnId) {
  var overlay  = document.getElementById(overlayId);
  var closeBtn = document.getElementById(closeBtnId);
  if (!overlay) return;

  function open()  { overlay.classList.add('open');    document.body.style.overflow = 'hidden'; }
  function close() { overlay.classList.remove('open'); document.body.style.overflow = ''; }

  openBtnIds.forEach(function (id) {
    var btn = document.getElementById(id);
    if (btn) btn.addEventListener('click', open);
  });
  if (closeBtn) closeBtn.addEventListener('click', close);
  overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
  return { open: open, close: close };
}

/* ====================================================
   INIT (runs on every page)
   ==================================================== */
document.addEventListener('DOMContentLoaded', function () {

  updateFechaHoy();
  updateSidebarUser();

  /* ---- TABS INDEX ---- */
  var tabR = document.getElementById('tabRegistro');
  var tabL = document.getElementById('tabLogin');
  var fR   = document.getElementById('formRegistro');
  var fL   = document.getElementById('formLogin');
  if (tabR && tabL) {
    tabR.addEventListener('click', function () { tabR.classList.add('active'); tabL.classList.remove('active'); fR.classList.add('active'); fL.classList.remove('active'); });
    tabL.addEventListener('click', function () { tabL.classList.add('active'); tabR.classList.remove('active'); fL.classList.add('active'); fR.classList.remove('active'); });
  }

  /* ---- REGISTRO ---- */
  var registroForm = document.getElementById('registroForm');
  if (registroForm) {
    // Chips exclusivos
    var fuenteChips   = document.querySelectorAll('.fuente-chip');
    var exclusiveVals = ['Sin ingresos por ahora', 'Prefiero no decirlo'];
    fuenteChips.forEach(function (chip) {
      chip.addEventListener('change', function () {
        var cb = chip.querySelector('input[type="checkbox"]');
        if (!cb || !cb.checked) return;
        if (exclusiveVals.includes(cb.value)) {
          fuenteChips.forEach(function (other) { var oc = other.querySelector('input'); if (oc && oc !== cb) oc.checked = false; });
        } else {
          fuenteChips.forEach(function (other) { var oc = other.querySelector('input'); if (oc && exclusiveVals.includes(oc.value)) oc.checked = false; });
        }
      });
    });

    registroForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var nombre   = registroForm.querySelector('[name="nombre"]').value.trim();
      var apellido = registroForm.querySelector('[name="apellido"]').value.trim();
      var email    = registroForm.querySelector('[name="email"]').value.trim();
      var pass     = registroForm.querySelector('[name="password"]').value;
      var fuentes  = Array.from(registroForm.querySelectorAll('[name="fuente_ingresos"]:checked')).map(function (cb) { return cb.value; }).join(', ');
      var errEl    = document.getElementById('errorRegistro');

      if (!nombre) { if (errEl) { errEl.textContent = 'Ingresa tu nombre.'; errEl.style.display = 'flex'; } return; }
      if (pass.length < 6) { if (errEl) { errEl.textContent = 'La contraseña debe tener al menos 6 caracteres.'; errEl.style.display = 'flex'; } return; }

      var result = FINPY.register(nombre, apellido, email, pass, fuentes);
      if (result.ok) {
        window.location.replace('dashboard.html');
      } else {
        if (errEl) { errEl.textContent = result.error; errEl.style.display = 'flex'; }
      }
    });
  }

  /* ---- LOGIN ---- */
  var loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var email = loginForm.querySelector('[name="email"]').value.trim();
      var pass  = loginForm.querySelector('[name="password"]').value;
      var errEl = document.getElementById('errorLogin');

      var result = FINPY.login(email, pass);
      if (result.ok) {
        window.location.replace('dashboard.html');
      } else {
        if (errEl) { errEl.textContent = result.error; errEl.style.display = 'flex'; }
      }
    });
  }

  /* ---- CUESTIONARIO ---- */
  var cuestionarioForm = document.getElementById('cuestionarioForm');
  if (cuestionarioForm) {
    var alertasSelect = document.getElementById('alertasSelect');
    var configAlertas = document.getElementById('configAlertas');
    var frecuenciaAlertas = document.getElementById('frecuenciaAlertas');
    var limiteDiarioBox   = document.getElementById('limiteDiarioBox');
    var limiteSemanalBox  = document.getElementById('limiteSemanalBox');
    var limiteMensualBox  = document.getElementById('limiteMensualBox');

    if (alertasSelect && configAlertas) {
      alertasSelect.addEventListener('change', function () {
        configAlertas.classList.toggle('visible', alertasSelect.value === 'si');
      });
    }
    if (frecuenciaAlertas) {
      frecuenciaAlertas.addEventListener('change', function () {
        [limiteDiarioBox, limiteSemanalBox, limiteMensualBox].forEach(function (b) { if (b) b.style.display = 'none'; });
        var val = frecuenciaAlertas.value;
        if ((val === 'diaria'  || val === 'todas') && limiteDiarioBox)  limiteDiarioBox.style.display  = 'block';
        if ((val === 'semanal' || val === 'todas') && limiteSemanalBox) limiteSemanalBox.style.display = 'block';
        if ((val === 'mensual' || val === 'todas') && limiteMensualBox) limiteMensualBox.style.display = 'block';
      });
    }
    cuestionarioForm.addEventListener('submit', function (e) {
      e.preventDefault();
      window.location.replace('dashboard.html');
    });
  }

  /* ---- LOGOUT LINK ---- */
  var logoutLink = document.getElementById('logoutLink');
  if (logoutLink) {
    logoutLink.addEventListener('click', function (e) {
      e.preventDefault();
      FINPY.logout();
      window.location.replace('index.html');
    });
  }

  /* ---- FILTROS CHART (visual) ---- */
  document.querySelectorAll('.filter-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.filter-btn').forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
    });
  });

  /* ---- NOTIF PANEL ---- */
  var btnNotif   = document.getElementById('btnNotif');
  var notifPanel = document.getElementById('notifPanel');
  if (btnNotif && notifPanel) {
    btnNotif.addEventListener('click', function (e) {
      e.stopPropagation();
      notifPanel.classList.toggle('open');
      var dot = btnNotif.querySelector('.notif-dot');
      if (dot) dot.style.display = 'none';
    });
    document.addEventListener('click', function (e) {
      if (notifPanel.classList.contains('open') && !notifPanel.contains(e.target) && e.target !== btnNotif)
        notifPanel.classList.remove('open');
    });
    var markReadBtn = notifPanel.querySelector('.notif-mark-read');
    if (markReadBtn) markReadBtn.addEventListener('click', function () {
      notifPanel.querySelectorAll('.notif-item').forEach(function (item) { item.style.opacity = '0.45'; });
    });
  }

  /* ---- BUDGET ALERT CLOSE ---- */
  var budgetAlert    = document.getElementById('budgetAlert');
  var btnCloseAlert  = document.getElementById('btnCerrarAlertaBanner');
  if (btnCloseAlert && budgetAlert) {
    btnCloseAlert.addEventListener('click', function () {
      budgetAlert.style.transition = 'opacity 0.3s';
      budgetAlert.style.opacity = '0';
      setTimeout(function () { budgetAlert.style.display = 'none'; }, 300);
    });
  }

  /* ---- MODAL TX ---- */
  var modalTx  = makeModalControls('modalOverlay',  ['btnAgregar','btnAgregar2'], 'btnCerrarModal');
  var tipoGasto   = document.getElementById('tipoGasto');
  var tipoIngreso = document.getElementById('tipoIngreso');
  var savedGastoCats = null;

  var CATS_INGRESO = [
    ['', 'Fuente de ingreso...'], ['', 'Trabajo formal'], ['', 'Trabajo informal'],
    ['', 'Freelance / Independiente'], ['', 'Ayuda familiar / Mesada'],
    ['', 'Beca académica'], ['', 'Emprendimiento propio'], ['', 'Inversiones / Rentas'], ['', 'Otro ingreso']
  ];

  function setSel(opts) {
    var sel = document.getElementById('txCategoria');
    if (!sel) return;
    sel.innerHTML = '';
    opts.forEach(function (p) { var o = document.createElement('option'); o.value = p[0]; o.textContent = p[1]; sel.appendChild(o); });
  }

  if (tipoGasto && tipoIngreso) {
    tipoGasto.addEventListener('click', function () {
      tipoGasto.classList.add('selected'); tipoIngreso.classList.remove('selected');
      if (savedGastoCats) setSel(savedGastoCats);
    });
    tipoIngreso.addEventListener('click', function () {
      tipoIngreso.classList.add('selected'); tipoGasto.classList.remove('selected');
      setSel(CATS_INGRESO);
    });
  }

  if (document.getElementById('modalOverlay')) {
    document.getElementById('btnAgregar') && document.getElementById('btnAgregar').addEventListener('click', function () {
      var fechaInput = document.getElementById('txFecha');
      if (fechaInput && !fechaInput.value) fechaInput.value = new Date().toISOString().slice(0, 10);
      if (tipoGasto) { tipoGasto.classList.add('selected'); tipoIngreso && tipoIngreso.classList.remove('selected'); }
    });
  }

  var txForm = document.getElementById('txForm');
  if (txForm) {
    txForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var user    = FINPY.getCurrentUser(); if (!user) return;
      var tipo    = (tipoIngreso && tipoIngreso.classList.contains('selected')) ? 'ingreso' : 'gasto';
      var monto   = parseFloat(document.getElementById('txMonto').value);
      var catId   = document.getElementById('txCategoria').value || null;
      var desc    = document.getElementById('txDescripcion').value.trim();
      var fecha   = document.getElementById('txFecha').value;
      var errEl   = document.getElementById('txError');
      errEl.style.display = 'none';

      if (!monto || monto <= 0) { errEl.textContent = 'Ingresa un monto válido mayor a 0.'; errEl.style.display = 'flex'; return; }
      if (!fecha)              { errEl.textContent = 'Selecciona una fecha.';               errEl.style.display = 'flex'; return; }

      FINPY.addTransaction({ userId: user.id, tipo: tipo, monto: monto, categoriaId: catId, descripcion: desc, fecha: fecha });
      txForm.reset();
      if (modalTx) modalTx.close();
      document.body.style.overflow = '';
      showToast('Transacción guardada', 'success');
      if (typeof window.renderPage === 'function') window.renderPage();
    });
  }

  /* ---- MODAL META ---- */
  var modalMeta = makeModalControls('modalMeta', ['btnNuevaMeta'], 'btnCerrarMeta');
  var metaForm  = document.getElementById('metaForm');
  if (metaForm) {
    metaForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var user    = FINPY.getCurrentUser(); if (!user) return;
      var nombre  = document.getElementById('metaNombre').value.trim();
      var obj     = parseFloat(document.getElementById('metaObjetivo').value);
      var act     = parseFloat(document.getElementById('metaActual').value) || 0;
      var errEl   = document.getElementById('metaError');
      errEl.style.display = 'none';

      if (!nombre) { errEl.textContent = 'Ingresa un nombre para la meta.'; errEl.style.display = 'flex'; return; }
      if (!obj || obj <= 0) { errEl.textContent = 'Ingresa un monto objetivo válido.'; errEl.style.display = 'flex'; return; }

      FINPY.addGoal({ userId: user.id, nombre: nombre, monto_objetivo: obj, monto_actual: act, icono: 'fa-bullseye' });
      metaForm.reset();
      if (modalMeta) modalMeta.close();
      document.body.style.overflow = '';
      showToast('Meta creada', 'success');
      if (typeof window.renderPage === 'function') window.renderPage();
    });
  }

  /* ---- ESC closes modals ---- */
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    ['modalOverlay', 'modalMeta', 'modalCat', 'modalAlerta'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.classList.remove('open');
    });
    document.body.style.overflow = '';
  });

  /* ---- GLOBAL ACTIONS (transacciones / metas) ---- */
  window.deleteTx = function (id) {
    if (!confirm('¿Eliminar esta transacción?')) return;
    FINPY.deleteTransaction(id);
    var el = document.getElementById('txrow-' + id);
    if (el) { el.style.transition = 'opacity .3s'; el.style.opacity = '0'; setTimeout(function () { el.remove(); }, 300); }
    showToast('Transacción eliminada', 'success');
    if (typeof window.renderPage === 'function') setTimeout(window.renderPage, 350);
  };

  window.deleteGoal = function (id) {
    if (!confirm('¿Eliminar esta meta?')) return;
    FINPY.deleteGoal(id);
    var el = document.getElementById('goal-' + id);
    if (el) { el.style.transition = 'opacity .3s'; el.style.opacity = '0'; setTimeout(function () { el.remove(); }, 300); }
    showToast('Meta eliminada', 'success');
  };

  window.updateGoal = function (id) {
    var input = document.getElementById('upd-' + id);
    var val   = parseFloat(input ? input.value : '');
    if (isNaN(val) || val < 0) { alert('Ingresa un monto válido.'); return; }
    FINPY.updateGoal(id, val);
    showToast('Meta actualizada', 'success');
    if (typeof window.renderPage === 'function') window.renderPage();
  };

  /* ---- CATEGORÍAS MODAL ---- */
  var modalCat = document.getElementById('modalCat');
  var btnNuevaCat  = document.getElementById('btnNuevaCat');
  var btnCerrarCat = document.getElementById('btnCerrarCat');
  if (modalCat) {
    if (btnNuevaCat)  btnNuevaCat.addEventListener('click',  function () { modalCat.classList.add('open'); });
    if (btnCerrarCat) btnCerrarCat.addEventListener('click', function () { modalCat.classList.remove('open'); document.body.style.overflow = ''; });
    modalCat.addEventListener('click', function (e) { if (e.target === modalCat) { modalCat.classList.remove('open'); document.body.style.overflow = ''; } });

    var catForm = document.getElementById('catForm');
    if (catForm) {
      catForm.addEventListener('submit', function (e) {
        e.preventDefault();
        var user   = FINPY.getCurrentUser(); if (!user) return;
        var nombre = document.getElementById('catNombre').value.trim();
        var icono  = document.getElementById('catIcono').value;
        var color  = document.getElementById('catColor').value;
        var errEl  = document.getElementById('catError');
        errEl.style.display = 'none';
        if (!nombre) { errEl.textContent = 'Ingresa un nombre.'; errEl.style.display = 'flex'; return; }

        FINPY.addCategory({ userId: user.id, nombre: nombre, icono: icono, color: color, es_predefinida: false });
        catForm.reset();
        modalCat.classList.remove('open');
        document.body.style.overflow = '';
        showToast('Categoría creada', 'success');
        if (typeof window.renderPage === 'function') window.renderPage();
      });
    }
  }

  window.deleteCategory = function (id) {
    if (!confirm('¿Eliminar esta categoría?')) return;
    FINPY.deleteCategory(id);
    var el = document.getElementById('catcard-' + id);
    if (el) { el.style.transition = 'opacity .3s'; el.style.opacity = '0'; setTimeout(function () { el.remove(); }, 300); }
    showToast('Categoría eliminada', 'success');
  };

  /* ---- ALERTAS MODAL ---- */
  var modalAlerta     = document.getElementById('modalAlerta');
  var btnNuevaAlerta  = document.getElementById('btnNuevaAlerta');
  var btnNuevaAlerta2 = document.getElementById('btnNuevaAlerta2');
  var btnCerrarAlerta = document.getElementById('btnCerrarAlerta');
  var alertaFrec      = document.getElementById('alertaFrecuencia');
  var alertaDBox      = document.getElementById('limiteDiarioBox');
  var alertaSBox      = document.getElementById('limiteSemanalBox');
  var alertaMBox      = document.getElementById('limiteMensualBox');

  if (modalAlerta) {
    function openAlertModal()  { modalAlerta.classList.add('open'); }
    function closeAlertModal() { modalAlerta.classList.remove('open'); document.body.style.overflow = ''; }
    if (btnNuevaAlerta)  btnNuevaAlerta.addEventListener('click', openAlertModal);
    if (btnNuevaAlerta2) btnNuevaAlerta2.addEventListener('click', openAlertModal);
    if (btnCerrarAlerta) btnCerrarAlerta.addEventListener('click', closeAlertModal);
    modalAlerta.addEventListener('click', function (e) { if (e.target === modalAlerta) closeAlertModal(); });

    if (alertaFrec) {
      alertaFrec.addEventListener('change', function () {
        [alertaDBox, alertaSBox, alertaMBox].forEach(function (b) { if (b) b.style.display = 'none'; });
        var val = alertaFrec.value;
        if ((val === 'diaria'  || val === 'todas') && alertaDBox) alertaDBox.style.display = 'flex';
        if ((val === 'semanal' || val === 'todas') && alertaSBox) alertaSBox.style.display = 'flex';
        if ((val === 'mensual' || val === 'todas') && alertaMBox) alertaMBox.style.display = 'flex';
      });
    }

    var alertaForm = document.getElementById('alertaForm');
    if (alertaForm) {
      alertaForm.addEventListener('submit', function (e) {
        e.preventDefault();
        var user    = FINPY.getCurrentUser(); if (!user) return;
        var frec    = alertaFrec ? alertaFrec.value : '';
        var errEl   = document.getElementById('alertaError');
        errEl.style.display = 'none';
        if (!frec)  { errEl.textContent = 'Selecciona una frecuencia.'; errEl.style.display = 'flex'; return; }

        var d = document.getElementById('alertaDiario')  ? parseFloat(document.getElementById('alertaDiario').value)  || null : null;
        var s = document.getElementById('alertaSemanal') ? parseFloat(document.getElementById('alertaSemanal').value) || null : null;
        var m = document.getElementById('alertaMensual') ? parseFloat(document.getElementById('alertaMensual').value) || null : null;

        FINPY.addAlert({ userId: user.id, frecuencia: frec, limite_diario: d, limite_semanal: s, limite_mensual: m });
        alertaForm.reset();
        [alertaDBox, alertaSBox, alertaMBox].forEach(function (b) { if (b) b.style.display = 'none'; });
        closeAlertModal();
        showToast('Alerta creada', 'success');
        if (typeof window.renderPage === 'function') window.renderPage();
      });
    }
  }

  window.deleteAlert = function (id) {
    if (!confirm('¿Eliminar esta alerta?')) return;
    FINPY.deleteAlert(id);
    var el = document.getElementById('alertcard-' + id);
    if (el) { el.style.transition = 'opacity .3s'; el.style.opacity = '0'; setTimeout(function () { el.remove(); }, 300); }
    showToast('Alerta eliminada', 'success');
    if (typeof window.renderPage === 'function') setTimeout(window.renderPage, 350);
  };

});