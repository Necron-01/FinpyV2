# Finpy — Finanzas Inteligentes para Estudiantes

Aplicación web de finanzas personales diseñada para estudiantes universitarios. Permite registrar gastos e ingresos, crear metas de ahorro, definir alertas de presupuesto y visualizar estadísticas. Funciona completamente en el navegador, sin servidor ni base de datos externa — todo se almacena en `localStorage`.

---

## Estructura del proyecto

```
Finpy/
├── index.html            # Landing page + formularios de registro e inicio de sesión
├── dashboard.html         # Panel principal con KPIs, gráfica y transacciones recientes
├── transacciones.html     # Lista completa de transacciones con filtros
├── estadisticas.html      # Gráficas de barras y dona con datos mensuales
├── metas.html             # Metas de ahorro con barra de progreso
├── categorias.html        # Gestión de categorías personalizadas
├── alertas.html           # Configuración de alertas de gasto
└── static/
    ├── css/
    │   └── styles.css     # Sistema de diseño completo (variables, componentes, responsive)
    ├── js/
    │   ├── storage.js     # Capa de datos: todo el acceso a localStorage
    │   └── app.js         # Capa de UI: modales, formularios, helpers visuales
    └── img/
        ├── Finpy Blanco2.png
        └── Finpy IA.png
```

---

## Cómo abrir el proyecto

> **Importante:** abrir con Edge puede causar un loop de redirección porque Edge bloquea `localStorage` en archivos locales (`file:///`). Usar **Chrome** resuelve el problema sin configuración adicional.

1. Descomprimir la carpeta del proyecto
2. Abrir **Chrome**
3. Arrastrar `index.html` al navegador, o clic derecho → Abrir con → Chrome

---

## Arquitectura general

El proyecto sigue una separación en dos capas:

```
┌─────────────────────────────────────────────┐
│                  HTML pages                  │  Vistas (index, dashboard, etc.)
│         (lógica de renderizado inline)       │
└────────────────────┬────────────────────────┘
                     │ llama a
┌────────────────────▼────────────────────────┐
│                   app.js                     │  Capa UI
│   modales, formularios, helpers, toasts      │
└────────────────────┬────────────────────────┘
                     │ llama a
┌────────────────────▼────────────────────────┐
│                 storage.js                   │  Capa de datos
│         FINPY — objeto global único          │
└────────────────────┬────────────────────────┘
                     │ lee y escribe
┌────────────────────▼────────────────────────┐
│              localStorage                    │  Persistencia en el navegador
└─────────────────────────────────────────────┘
```

---

## Cómo funciona el almacenamiento local (`storage.js`)

### ¿Qué es localStorage?

`localStorage` es un mecanismo del navegador que permite guardar datos en formato clave-valor directamente en el dispositivo del usuario. Los datos persisten aunque se cierre el navegador — solo se borran si el usuario limpia el caché o si el código los elimina explícitamente.

No requiere servidor ni base de datos. Es como un pequeño archivo JSON que vive en el navegador.

### Las claves que usa Finpy

Todas las claves están centralizadas en el objeto `K` dentro de `storage.js`:

```javascript
var K = {
  USERS:   'finpy_users',        // Array de usuarios registrados
  SESSION: 'finpy_session',      // Sesión activa: { userId: '...' }
  TX:      'finpy_transactions', // Array de todas las transacciones
  GOALS:   'finpy_goals',        // Array de metas de ahorro
  CATS:    'finpy_categories',   // Array de categorías personalizadas
  ALERTS:  'finpy_alerts'        // Array de alertas configuradas
};
```

### Funciones base de lectura y escritura

```javascript
// Leer: convierte el string JSON de localStorage a objeto JS
function load(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || 'null');
  } catch(e) {
    return null;
  }
}

// Escribir: convierte el objeto JS a string JSON y lo guarda
function save(key, val) {
  localStorage.setItem(key, JSON.stringify(val));
}
```

Todas las operaciones de la app pasan por estas dos funciones. Nunca se llama `localStorage` directamente desde las vistas.

### Flujo de registro y sesión

Cuando un usuario se registra:

```javascript
register: function (nombre, apellido, email, password, fuente) {
  var users = this.getUsers();                  // 1. Carga el array de usuarios
  // 2. Verifica que el email no exista
  var user = { id: uid(), nombre, email, ... }; // 3. Crea el objeto usuario
  users.push(user);
  save(K.USERS, users);                         // 4. Guarda el array actualizado
  save(K.SESSION, { userId: user.id });         // 5. Guarda la sesión activa
}
```

Cuando inicia sesión:

```javascript
login: function (email, password) {
  var user = this.getUsers().find(...);         // Busca el usuario en el array
  save(K.SESSION, { userId: user.id });         // Guarda solo el ID en sesión
}
```

La sesión guarda únicamente el `userId`. Cada vez que se necesita el usuario completo, se busca en el array de usuarios usando ese ID:

```javascript
getCurrentUser: function () {
  var s = this.getSession();           // Lee { userId: '...' }
  return this.getUsers().find(         // Busca el usuario completo
    function (u) { return u.id === s.userId; }
  ) || null;
}
```

### Cómo se genera un ID único

```javascript
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}
```

Combina el timestamp actual en base 36 con caracteres aleatorios. Ejemplo de resultado: `"lq3kx8ab2f"`.

### Operaciones CRUD de transacciones

```javascript
// Agregar
addTransaction: function (tx) {
  var all = load(K.TX) || [];   // Carga todas las transacciones
  tx.id = uid();                 // Asigna ID único
  all.push(tx);                  // Agrega la nueva
  save(K.TX, all);               // Guarda el array completo
}

// Leer (solo las del usuario actual, ordenadas por fecha)
getTransactions: function (userId) {
  return (load(K.TX) || [])
    .filter(function (t) { return t.userId === userId; })
    .sort(function (a, b) { return new Date(b.fecha) - new Date(a.fecha); });
}

// Eliminar
deleteTransaction: function (id) {
  save(K.TX, (load(K.TX) || []).filter(function (t) { return t.id !== id; }));
}
```

El mismo patrón se repite para metas, categorías y alertas.

---

## Cómo ver los datos almacenados en tiempo real

### Método 1 — Application tab (más visual)

1. Abrir Chrome con el proyecto corriendo
2. Presionar `F12` para abrir DevTools
3. Ir a la pestaña **Application**
4. En el panel izquierdo, expandir **Local Storage**
5. Hacer clic en la URL del archivo (ejemplo: `file:///C:/Dev/Finpy/index.html`)
6. Se muestra una tabla con todas las claves y sus valores

Desde esta vista se puede:
- Ver el contenido completo de cada clave
- Editar valores directamente haciendo doble clic
- Eliminar claves individuales con clic derecho → Delete
- Limpiar todo con el botón 🚫 (Clear All)

### Método 2 — Consola (más rápido para inspeccionar)

Abrir la consola (`F12` → **Console`) y ejecutar:

```javascript
// Ver todos los usuarios registrados
JSON.parse(localStorage.getItem('finpy_users'))

// Ver la sesión activa
JSON.parse(localStorage.getItem('finpy_session'))

// Ver todas las transacciones
JSON.parse(localStorage.getItem('finpy_transactions'))

// Ver metas
JSON.parse(localStorage.getItem('finpy_goals'))

// Ver categorías personalizadas
JSON.parse(localStorage.getItem('finpy_categories'))

// Ver alertas
JSON.parse(localStorage.getItem('finpy_alerts'))
```

O de forma más legible con `console.table`:

```javascript
// Muestra las transacciones en formato tabla
console.table(JSON.parse(localStorage.getItem('finpy_transactions')))

// Muestra los usuarios en formato tabla
console.table(JSON.parse(localStorage.getItem('finpy_users')))
```

### Método 3 — Ver todo de una vez

```javascript
// Imprime todas las claves de Finpy con su contenido
['finpy_users','finpy_session','finpy_transactions',
 'finpy_goals','finpy_categories','finpy_alerts'].forEach(function(k) {
  console.group(k);
  console.log(JSON.parse(localStorage.getItem(k)));
  console.groupEnd();
});
```

### Método 4 — Usar el objeto FINPY directamente

Desde la consola también se puede usar la API interna del proyecto:

```javascript
// Usuario actual
FINPY.getCurrentUser()

// Estadísticas del usuario actual
var user = FINPY.getCurrentUser();
FINPY.calcStats(user.id)

// Transacciones del usuario actual
FINPY.getTransactions(user.id)

// Gastos agrupados por categoría
FINPY.getGastosPorCat(user.id)

// Datos mensuales para la gráfica
FINPY.getMonthlyData(user.id)
```

---

## Descripción de cada archivo JS

### `storage.js` — Capa de datos

Expone un único objeto global `FINPY` con todos los métodos de acceso a datos:

| Método | Descripción |
|---|---|
| `register(nombre, apellido, email, pass, fuente)` | Crea un usuario y abre sesión |
| `login(email, pass)` | Verifica credenciales y abre sesión |
| `logout()` | Elimina la sesión de localStorage |
| `getCurrentUser()` | Retorna el objeto del usuario activo o `null` |
| `requireAuth()` | Si no hay sesión, redirige a `index.html` |
| `addTransaction(tx)` | Agrega una transacción al array global |
| `getTransactions(userId)` | Retorna las transacciones del usuario ordenadas |
| `deleteTransaction(id)` | Elimina una transacción por ID |
| `addGoal(goal)` | Crea una meta de ahorro |
| `updateGoal(id, montoActual)` | Actualiza el monto ahorrado de una meta |
| `deleteGoal(id)` | Elimina una meta |
| `getCategories(userId)` | Retorna categorías predefinidas + personalizadas |
| `addCategory(cat)` | Agrega una categoría personalizada |
| `deleteCategory(id)` | Elimina una categoría personalizada |
| `addAlert(alert)` | Crea una alerta de presupuesto |
| `deleteAlert(id)` | Elimina una alerta |
| `calcStats(userId)` | Calcula balance, total ingresos y total gastos |
| `getGastosPorCat(userId)` | Agrupa gastos por nombre de categoría |
| `getMonthlyData(userId)` | Agrupa ingresos y gastos por mes (YYYY-MM) |

### `app.js` — Capa de UI

Contiene funciones de ayuda y la inicialización de todos los componentes visuales:

| Función | Descripción |
|---|---|
| `formatCOP(n)` | Formatea un número como moneda colombiana: `$1.200.000` |
| `fechaRel(fechaStr)` | Convierte una fecha a texto relativo: "Hoy", "Ayer", "12 may" |
| `esc(str)` | Escapa HTML para evitar inyección de código |
| `showToast(msg, type)` | Muestra una notificación flotante temporal |
| `updateSidebarUser()` | Rellena nombre y avatar en el sidebar |
| `fillCategorySelect(id, userId)` | Llena un `<select>` con las categorías del usuario |
| `txItemHTML(tx, cats, showDelete)` | Genera el HTML de una fila de transacción |
| `goalItemHTML(goal, color, actions)` | Genera el HTML de una tarjeta de meta |
| `makeModalControls(overlayId, ...)` | Conecta botones de abrir/cerrar a un modal |

El bloque `DOMContentLoaded` al final inicializa todos los listeners: formularios de login/registro, modales de transacción, meta, categoría y alerta, panel de notificaciones, logout, y acciones globales (`deleteTx`, `deleteGoal`, etc.).

---

## Categorías predefinidas

Definidas directamente en `storage.js` — no se guardan en `localStorage`, siempre están disponibles:

| ID | Nombre | Ícono | Color |
|---|---|---|---|
| pre-1 | Comida | fa-utensils | teal |
| pre-2 | Transporte | fa-bus | blue |
| pre-3 | Educación | fa-graduation-cap | purple |
| pre-4 | Ocio | fa-gamepad | green |
| pre-5 | Viajes | fa-plane | white |
| pre-6 | Salud | fa-heart-pulse | red |

Las categorías personalizadas que crea el usuario sí se guardan en `finpy_categories` con su `userId`.

---

## Sistema de diseño (`styles.css`)

El CSS usa variables CSS definidas en `:root` para mantener consistencia:

```css
--primary:      #07C7B7   /* teal — color principal */
--dark:         #2C3E50   /* azul oscuro — sidebar, textos */
--purple-light: #D2D5EB   /* lila suave — acentos secundarios */
--bg:           #F2F4F8   /* gris claro — fondo general */
--success:      #22c55e   /* verde — ingresos */
--danger:       #ef4444   /* rojo — gastos */
```

Los componentes principales son: navbar, hero, features, auth, sidebar, topbar, kpi-cards, dashboard-grid, modales, notif-panel, toast, chips de categoría y barra de progreso.

---

## Notas importantes

- **No usar Edge con `file:///`:** Edge activa "Tracking Prevention" que bloquea `localStorage` en archivos locales. Usar Chrome.
- **Los datos son locales:** cada navegador y cada computador tienen su propio `localStorage`. Los datos no se sincronizan entre dispositivos.
- **No hay contraseñas hasheadas:** las contraseñas se guardan en texto plano en `localStorage`. Esto es aceptable para un proyecto académico pero no para producción.
- **Chart.js se carga desde CDN:** requiere conexión a internet para que las gráficas funcionen.
- **Font Awesome se carga desde CDN:** requiere conexión a internet para los íconos.