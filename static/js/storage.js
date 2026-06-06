// ============================================================
// FINPY — Capa de datos con localStorage
// ============================================================
var FINPY = (function () {
  'use strict';

  var K = {
    USERS:    'finpy_users',
    SESSION:  'finpy_session',
    TX:       'finpy_transactions',
    GOALS:    'finpy_goals',
    CATS:     'finpy_categories',
    ALERTS:   'finpy_alerts'
  };

  var PREDEFINED = [
    { id:'pre-1', nombre:'Comida',     icono:'fa-utensils',      color:'teal',   es_predefinida:true },
    { id:'pre-2', nombre:'Transporte', icono:'fa-bus',           color:'blue',   es_predefinida:true },
    { id:'pre-3', nombre:'Educación',  icono:'fa-graduation-cap',color:'purple', es_predefinida:true },
    { id:'pre-4', nombre:'Ocio',       icono:'fa-gamepad',       color:'green',  es_predefinida:true },
    { id:'pre-5', nombre:'Viajes',     icono:'fa-plane',         color:'white',  es_predefinida:true },
    { id:'pre-6', nombre:'Salud',      icono:'fa-heart-pulse',   color:'red',    es_predefinida:true }
  ];

  function load(key) {
    try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch(e) { return null; }
  }
  function save(key, val) { localStorage.setItem(key, JSON.stringify(val)); }
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

  var DB = {

    /* ---- AUTH ---- */
    getUsers: function () { return load(K.USERS) || []; },

    register: function (nombre, apellido, email, password, fuente) {
      var users = this.getUsers();
      if (users.find(function (u) { return u.email.toLowerCase() === email.toLowerCase(); })) {
        return { ok: false, error: 'Ese correo ya está registrado.' };
      }
      var user = { id: uid(), nombre: nombre, apellido: apellido || '', email: email, password: password, fuente_ingresos: fuente || '' };
      users.push(user);
      save(K.USERS, users);
      save(K.SESSION, { userId: user.id });
      return { ok: true, user: user };
    },

    login: function (email, password) {
      var user = this.getUsers().find(function (u) {
        return u.email.toLowerCase() === email.toLowerCase() && u.password === password;
      });
      if (!user) return { ok: false, error: 'Correo o contraseña incorrectos.' };
      save(K.SESSION, { userId: user.id });
      return { ok: true, user: user };
    },

    logout: function () { localStorage.removeItem(K.SESSION); },

    getSession: function () { return load(K.SESSION); },

    getCurrentUser: function () {
      var s = this.getSession();
      if (!s) return null;
      var uid = s.userId;
      return this.getUsers().find(function (u) { return u.id === uid; }) || null;
    },

    requireAuth: function () {
      if (!this.getCurrentUser()) { window.location.replace('index.html'); return false; }
      return true;
    },

    /* ---- TRANSACTIONS ---- */
    getTransactions: function (userId) {
      var all = load(K.TX) || [];
      return all
        .filter(function (t) { return t.userId === userId; })
        .sort(function (a, b) { return new Date(b.fecha + 'T00:00:00') - new Date(a.fecha + 'T00:00:00'); });
    },

    addTransaction: function (tx) {
      var all = load(K.TX) || [];
      tx.id = uid();
      all.push(tx);
      save(K.TX, all);
      return tx;
    },

    deleteTransaction: function (id) {
      save(K.TX, (load(K.TX) || []).filter(function (t) { return t.id !== id; }));
    },

    /* ---- GOALS ---- */
    getGoals: function (userId) {
      return (load(K.GOALS) || []).filter(function (g) { return g.userId === userId; });
    },

    addGoal: function (goal) {
      var all = load(K.GOALS) || [];
      goal.id = uid();
      all.push(goal);
      save(K.GOALS, all);
      return goal;
    },

    updateGoal: function (id, montoActual) {
      var all = (load(K.GOALS) || []).map(function (g) {
        return g.id === id ? Object.assign({}, g, { monto_actual: montoActual }) : g;
      });
      save(K.GOALS, all);
    },

    deleteGoal: function (id) {
      save(K.GOALS, (load(K.GOALS) || []).filter(function (g) { return g.id !== id; }));
    },

    /* ---- CATEGORIES ---- */
    getCategories: function (userId) {
      var custom = (load(K.CATS) || []).filter(function (c) { return c.userId === userId; });
      return PREDEFINED.concat(custom);
    },

    addCategory: function (cat) {
      var all = load(K.CATS) || [];
      cat.id = uid();
      all.push(cat);
      save(K.CATS, all);
      return cat;
    },

    deleteCategory: function (id) {
      save(K.CATS, (load(K.CATS) || []).filter(function (c) { return c.id !== id; }));
    },

    getCategoryById: function (id, userId) {
      return this.getCategories(userId).find(function (c) { return c.id === id; }) || null;
    },

    /* ---- ALERTS ---- */
    getAlerts: function (userId) {
      return (load(K.ALERTS) || []).filter(function (a) { return a.userId === userId; });
    },

    addAlert: function (alert) {
      var all = load(K.ALERTS) || [];
      alert.id = uid();
      all.push(alert);
      save(K.ALERTS, all);
      return alert;
    },

    deleteAlert: function (id) {
      save(K.ALERTS, (load(K.ALERTS) || []).filter(function (a) { return a.id !== id; }));
    },

    /* ---- STATS ---- */
    calcStats: function (userId) {
      var txs = this.getTransactions(userId);
      var ing = txs.filter(function (t) { return t.tipo === 'ingreso'; }).reduce(function (s, t) { return s + t.monto; }, 0);
      var gas = txs.filter(function (t) { return t.tipo === 'gasto'; }).reduce(function (s, t) { return s + t.monto; }, 0);
      return { total_ingresos: ing, total_gastos: gas, balance: ing - gas };
    },

    getGastosPorCat: function (userId) {
      var txs = this.getTransactions(userId).filter(function (t) { return t.tipo === 'gasto'; });
      var result = {};
      var self = this;
      txs.forEach(function (t) {
        var cat = t.categoriaId ? self.getCategoryById(t.categoriaId, userId) : null;
        var nombre = cat ? cat.nombre : 'Sin categoría';
        result[nombre] = (result[nombre] || 0) + t.monto;
      });
      return result;
    },

    getMonthlyData: function (userId) {
      var txs = this.getTransactions(userId);
      var result = {};
      txs.forEach(function (t) {
        var key = (t.fecha || '').slice(0, 7);
        if (!key) return;
        if (!result[key]) result[key] = { ingresos: 0, gastos: 0 };
        if (t.tipo === 'ingreso') result[key].ingresos += t.monto;
        else result[key].gastos += t.monto;
      });
      var sorted = {};
      Object.keys(result).sort().forEach(function (k) { sorted[k] = result[k]; });
      return sorted;
    }
  };

  return DB;
})();