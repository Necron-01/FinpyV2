document.addEventListener('DOMContentLoaded', function () {

  // =============================================
  // INDEX — TABS: Registro / Login
  // =============================================
  var tabRegistro  = document.getElementById('tabRegistro');
  var tabLogin     = document.getElementById('tabLogin');
  var formRegistro = document.getElementById('formRegistro');
  var formLogin    = document.getElementById('formLogin');

  if (tabRegistro && tabLogin) {
    tabRegistro.addEventListener('click', function () {
      tabRegistro.classList.add('active');
      tabLogin.classList.remove('active');
      formRegistro.classList.add('active');
      formLogin.classList.remove('active');
    });

    tabLogin.addEventListener('click', function () {
      tabLogin.classList.add('active');
      tabRegistro.classList.remove('active');
      formLogin.classList.add('active');
      formRegistro.classList.remove('active');
    });
  }

  // =============================================
  // DASHBOARD — FECHA EN TOPBAR
  // =============================================
  var fechaEl = document.getElementById('fechaHoy');
  if (fechaEl) {
    var hoy  = new Date();
    var opts = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    var txt  = hoy.toLocaleDateString('es-CO', opts);
    fechaEl.textContent = txt.charAt(0).toUpperCase() + txt.slice(1);
  }

  // =============================================
  // DASHBOARD — MODAL NUEVA TRANSACCIÓN
  // =============================================
  var modalOverlay   = document.getElementById('modalOverlay');
  var btnAgregar     = document.getElementById('btnAgregar');
  var btnAgregar2    = document.getElementById('btnAgregar2');
  var btnCerrarModal = document.getElementById('btnCerrarModal');

  function abrirModal() {
    if (modalOverlay) {
      modalOverlay.classList.add('open');
      document.body.style.overflow = 'hidden';
      // Resetear siempre a modo Gasto al abrir
      if (tipoGasto && tipoIngreso) {
        tipoGasto.classList.add('selected');
        tipoIngreso.classList.remove('selected');
        setCategoriasGasto();
      }
      var fechaInput = document.getElementById('txFecha');
      if (fechaInput && !fechaInput.value) {
        fechaInput.value = new Date().toISOString().slice(0, 10);
      }
    }
  }

  function cerrarModal() {
    if (modalOverlay) {
      modalOverlay.classList.remove('open');
      document.body.style.overflow = '';
    }
  }

  if (btnAgregar)     btnAgregar.addEventListener('click', abrirModal);
  if (btnAgregar2)    btnAgregar2.addEventListener('click', abrirModal);
  if (btnCerrarModal) btnCerrarModal.addEventListener('click', cerrarModal);

  if (modalOverlay) {
    modalOverlay.addEventListener('click', function (e) {
      if (e.target === modalOverlay) cerrarModal();
    });
  }

  // =============================================
  // DASHBOARD — TOGGLE TIPO (GASTO / INGRESO)
  // =============================================
  var tipoGasto   = document.getElementById('tipoGasto');
  var tipoIngreso = document.getElementById('tipoIngreso');

  var CATEGORIAS_INGRESO = [
    ['', 'Fuente de ingreso...'],
    ['', 'Trabajo formal'],
    ['', 'Trabajo informal'],
    ['', 'Freelance / Independiente'],
    ['', 'Ayuda familiar / Mesada'],
    ['', 'Beca académica'],
    ['', 'Beca deportiva'],
    ['', 'Emprendimiento propio'],
    ['', 'Trabajo part-time'],
    ['', 'Inversiones / Rentas'],
    ['', 'Otro ingreso'],
  ];

  var opcionesGasto = null;

  function setCategoriasIngreso() {
    var sel = document.getElementById('txCategoria');
    if (!sel) return;
    if (!opcionesGasto) {
      opcionesGasto = Array.from(sel.options).map(function(o) { return [o.value, o.text]; });
    }
    sel.innerHTML = '';
    CATEGORIAS_INGRESO.forEach(function(par) {
      var opt = document.createElement('option');
      opt.value = par[0];
      opt.text  = par[1];
      sel.appendChild(opt);
    });
  }

  function setCategoriasGasto() {
    var sel = document.getElementById('txCategoria');
    if (!sel || !opcionesGasto) return;
    sel.innerHTML = '';
    opcionesGasto.forEach(function(par) {
      var opt = document.createElement('option');
      opt.value = par[0];
      opt.text  = par[1];
      sel.appendChild(opt);
    });
  }

  if (tipoGasto && tipoIngreso) {
    tipoGasto.addEventListener('click', function () {
      tipoGasto.classList.add('selected');
      tipoIngreso.classList.remove('selected');
      setCategoriasGasto();
    });
    tipoIngreso.addEventListener('click', function () {
      tipoIngreso.classList.add('selected');
      tipoGasto.classList.remove('selected');
      setCategoriasIngreso();
    });
  }

  // =============================================
  // DASHBOARD — GUARDAR TRANSACCIÓN (AJAX)
  // =============================================
  var txForm = document.getElementById('txForm');
  if (txForm) {
    txForm.addEventListener('submit', function (e) {
      e.preventDefault();

      var tipo       = (tipoIngreso && tipoIngreso.classList.contains('selected')) ? 'ingreso' : 'gasto';
      var monto      = document.getElementById('txMonto').value;
      var categoria  = document.getElementById('txCategoria').value;
      var descripcion = document.getElementById('txDescripcion').value;
      var fecha      = document.getElementById('txFecha').value;
      var errorEl    = document.getElementById('txError');
      var btnGuardar = document.getElementById('btnGuardarTx');

      errorEl.style.display = 'none';

      if (!monto || parseFloat(monto) <= 0) {
        errorEl.textContent = 'Ingresa un monto válido mayor a 0.';
        errorEl.style.display = 'flex';
        return;
      }

      btnGuardar.disabled = true;
      btnGuardar.textContent = 'Guardando...';

      fetch('/api/transacciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo:         tipo,
          monto:        parseFloat(monto),
          categoria_id: categoria || null,
          descripcion:  descripcion,
          fecha:        fecha
        })
      })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (data.ok) {
          cerrarModal();
          txForm.reset();
          showToast('Transacción guardada correctamente', 'success');
          setTimeout(function () { window.location.reload(); }, 1200);
        } else {
          errorEl.textContent = data.error || 'Error al guardar. Intenta de nuevo.';
          errorEl.style.display = 'flex';
          btnGuardar.disabled = false;
          btnGuardar.textContent = 'Guardar transacción';
        }
      })
      .catch(function () {
        errorEl.textContent = 'Error de conexión. Verifica tu internet.';
        errorEl.style.display = 'flex';
        btnGuardar.disabled = false;
        btnGuardar.textContent = 'Guardar transacción';
      });
    });
  }

  // =============================================
  // DASHBOARD — MODAL NUEVA META
  // =============================================
  var modalMeta     = document.getElementById('modalMeta');
  var btnNuevaMeta  = document.getElementById('btnNuevaMeta');
  var btnCerrarMeta = document.getElementById('btnCerrarMeta');

  function abrirModalMeta() {
    if (modalMeta) {
      modalMeta.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
  }

  function cerrarModalMeta() {
    if (modalMeta) {
      modalMeta.classList.remove('open');
      document.body.style.overflow = '';
    }
  }

  if (btnNuevaMeta)  btnNuevaMeta.addEventListener('click', abrirModalMeta);
  if (btnCerrarMeta) btnCerrarMeta.addEventListener('click', cerrarModalMeta);

  if (modalMeta) {
    modalMeta.addEventListener('click', function (e) {
      if (e.target === modalMeta) cerrarModalMeta();
    });
  }

  var metaForm = document.getElementById('metaForm');
  if (metaForm) {
    metaForm.addEventListener('submit', function (e) {
      e.preventDefault();

      var nombre   = document.getElementById('metaNombre').value;
      var objetivo = document.getElementById('metaObjetivo').value;
      var actual   = document.getElementById('metaActual').value || 0;
      var errorEl  = document.getElementById('metaError');

      errorEl.style.display = 'none';

      fetch('/api/metas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre:         nombre,
          monto_objetivo: parseFloat(objetivo),
          monto_actual:   parseFloat(actual),
          icono:          'fa-bullseye'
        })
      })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (data.ok) {
          cerrarModalMeta();
          showToast('Meta creada correctamente', 'success');
          setTimeout(function () { window.location.reload(); }, 1200);
        } else {
          errorEl.textContent = data.error || 'Error al crear la meta.';
          errorEl.style.display = 'flex';
        }
      });
    });
  }

  // Escape cierra cualquier modal abierto
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      cerrarModal();
      cerrarModalMeta();
    }
  });

  // =============================================
  // DASHBOARD — CHART.JS (DONA)
  // =============================================
  var chartCanvas = document.getElementById('chartGastos');

  if (chartCanvas && typeof Chart !== 'undefined' && typeof CHART_DATA !== 'undefined') {
    var labels = Object.keys(CHART_DATA);
    var datos  = Object.values(CHART_DATA);

    var colorMap = {
      'Comida':     '#07C7B7',
      'Transporte': '#2C3E50',
      'Educación':  '#7C6CF6',
      'Ocio':       '#22c55e',
      'Viajes':     '#f59e0b',
      'Salud':      '#ef4444'
    };

    var palette = ['#07C7B7','#2C3E50','#7C6CF6','#22c55e','#f59e0b','#D2D5EB','#A99DF8','#4ade80'];
    var colors  = labels.map(function (l, i) {
      return colorMap[l] || palette[i % palette.length];
    });

    var ctx = chartCanvas.getContext('2d');
    new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels:   labels,
        datasets: [{
          data:            datos,
          backgroundColor: colors,
          borderWidth:     3,
          borderColor:     '#ffffff',
          hoverOffset:     10
        }]
      },
      options: {
        responsive:          true,
        maintainAspectRatio: false,
        cutout:              '68%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding:   14,
              font:      { size: 11, family: 'Inter' },
              boxWidth:  10,
              boxHeight: 10
            }
          },
          tooltip: {
            callbacks: {
              label: function (ctx) {
                return ' $' + ctx.parsed.toLocaleString('es-CO');
              }
            }
          }
        }
      }
    });
  }

  // =============================================
  // DASHBOARD — FILTROS CHART (visual only)
  // =============================================
  var filterBtns = document.querySelectorAll('.filter-btn');
  filterBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      filterBtns.forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
    });
  });

  // =============================================
  // DASHBOARD — PANEL DE NOTIFICACIONES
  // =============================================
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
      if (notifPanel.classList.contains('open') &&
          !notifPanel.contains(e.target) &&
          e.target !== btnNotif) {
        notifPanel.classList.remove('open');
      }
    });

    var markReadBtn = notifPanel.querySelector('.notif-mark-read');
    if (markReadBtn) {
      markReadBtn.addEventListener('click', function () {
        notifPanel.querySelectorAll('.notif-item').forEach(function (item) {
          item.style.opacity = '0.45';
        });
      });
    }
  }

  // =============================================
  // DASHBOARD — ALERTA DE PRESUPUESTO
  // =============================================
  var budgetAlert     = document.getElementById('budgetAlert');
  var btnCerrarAlerta = document.getElementById('btnCerrarAlerta');

  if (btnCerrarAlerta && budgetAlert) {
    btnCerrarAlerta.addEventListener('click', function () {
      budgetAlert.style.transition = 'opacity 0.3s ease';
      budgetAlert.style.opacity    = '0';
      setTimeout(function () { budgetAlert.style.display = 'none'; }, 300);
    });
  }

  // =============================================
  // CUESTIONARIO — ALERTAS DINÁMICAS
  // =============================================
  var alertasSelect = document.getElementById('alertasSelect');
  var configAlertas = document.getElementById('configAlertas');

  if (alertasSelect && configAlertas) {
    alertasSelect.addEventListener('change', function () {
      if (alertasSelect.value === 'si') {
        configAlertas.classList.add('visible');
      } else {
        configAlertas.classList.remove('visible');
      }
    });
  }

  var frecuenciaAlertas = document.getElementById('frecuenciaAlertas');
  var limiteDiarioBox   = document.getElementById('limiteDiarioBox');
  var limiteSemanalBox  = document.getElementById('limiteSemanalBox');
  var limiteMensualBox  = document.getElementById('limiteMensualBox');

  if (frecuenciaAlertas) {
    frecuenciaAlertas.addEventListener('change', function () {
      var boxes = [limiteDiarioBox, limiteSemanalBox, limiteMensualBox];
      boxes.forEach(function (b) { if (b) b.style.display = 'none'; });

      var val = frecuenciaAlertas.value;
      if      (val === 'diaria'  && limiteDiarioBox)   limiteDiarioBox.style.display   = 'block';
      else if (val === 'semanal' && limiteSemanalBox)  limiteSemanalBox.style.display  = 'block';
      else if (val === 'mensual' && limiteMensualBox)  limiteMensualBox.style.display  = 'block';
      else if (val === 'todas')  boxes.forEach(function (b) { if (b) b.style.display = 'block'; });
    });
  }

  // =============================================
  // REGISTRO — FUENTE DE INGRESOS (chips exclusivos)
  // =============================================
  var fuenteChips    = document.querySelectorAll('.fuente-chip');
  var exclusiveVals  = ['Sin ingresos por ahora', 'Prefiero no decirlo'];

  fuenteChips.forEach(function (chip) {
    chip.addEventListener('change', function () {
      var cb  = chip.querySelector('input[type="checkbox"]');
      var val = cb ? cb.value : '';

      if (!cb || !cb.checked) return;

      if (exclusiveVals.includes(val)) {
        // Desmarcar todas las demás
        fuenteChips.forEach(function (other) {
          var otherCb = other.querySelector('input[type="checkbox"]');
          if (otherCb && otherCb !== cb) otherCb.checked = false;
        });
      } else {
        // Desmarcar las exclusivas si hay alguna marcada
        fuenteChips.forEach(function (other) {
          var otherCb = other.querySelector('input[type="checkbox"]');
          if (otherCb && exclusiveVals.includes(otherCb.value)) otherCb.checked = false;
        });
      }
    });
  });

  // =============================================
  // TOAST HELPER
  // =============================================
  function showToast(message, type) {
    var toast = document.createElement('div');
    toast.className = 'toast toast-' + (type || 'success');
    toast.innerHTML = '<i class="fa-solid fa-circle-check"></i> ' + message;
    document.body.appendChild(toast);

    setTimeout(function () { toast.classList.add('show'); }, 10);
    setTimeout(function () {
      toast.classList.remove('show');
      setTimeout(function () { toast.remove(); }, 300);
    }, 3000);
  }

});
