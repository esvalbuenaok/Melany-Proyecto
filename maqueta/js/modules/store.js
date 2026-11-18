/* Almacen de estado centralizado con persistencia en localStorage, respaldo en memoria e invariantes de transparencia. */
(function (root) {
  "use strict";

  var App = (root.AmiuniApp = root.AmiuniApp || {});
  var utils = App.utils || (typeof require === "function" ? require("./utils") : null);
  var validators = App.validators || (typeof require === "function" ? require("./validators") : null);
  var filtersMod = App.filters || (typeof require === "function" ? require("./filters") : null);

  var STORAGE_KEY = "amiuni_state_v1";
  var ADMIN_SESSION_KEY = "amiuni_admin_session_v1";
  var ADMIN_DEMO_CREDENTIALS = { usuario: "admin", clave: "amiuni2026" };
  var VALID_REQUEST_STATUSES = ["pendiente", "en_revision", "aprobada", "rechazada"];
  var VALID_DONATION_STATUSES = ["pendiente", "verificada", "anulada"];
  var DEFAULT_SITE_CONFIG = {
    nombreMarca: "Amiuni",
    subtituloPie: "Fundación Amiuni · Mérida, Venezuela",
    avisoPie: "Maqueta funcional de la tesis de Melany Monsalve (ULA, Diseño Gráfico). Los animales, fotos, cifras y medios de pago son de ejemplo.",
    portadaKicker: "Mérida, Venezuela · Adopción responsable",
    portadaTitulo: "Encuentra a tu compañero",
    portadaDescripcion: "Perros y gatos rescatados en Mérida esperan un hogar. Conoce su historia y adopta con confianza.",
    portadaCtaTexto: "Quiero ayudar",
    academiaNavNombre: "Academia",
    whatsappContacto: "0414-0000000",
    correoContacto: "contacto@amiuni-demo.org"
  };
  var SITE_CONFIG_KEYS = Object.keys(DEFAULT_SITE_CONFIG);
  var REQUIRED_SITE_KEYS = { nombreMarca: true, academiaNavNombre: true };
  var PAYMENT_METHOD_FIELDS = ["titulo", "banco", "telefono", "tipoCuenta", "cuenta", "rif", "correo", "titular", "nota"];

  function clone(val) {
    if (utils && typeof utils.deepClone === "function") {
      return utils.deepClone(val);
    }
    return JSON.parse(JSON.stringify(val));
  }

  function createMemoryStorage() {
    var map = {};
    return {
      getItem: function (key) {
        return Object.prototype.hasOwnProperty.call(map, key) ? map[key] : null;
      },
      setItem: function (key, value) {
        map[key] = String(value);
      },
      removeItem: function (key) {
        delete map[key];
      }
    };
  }

  function resolveWebStorage(customStorage, webStorage) {
    if (customStorage && typeof customStorage.getItem === "function" && typeof customStorage.setItem === "function") {
      return customStorage;
    }
    try {
      if (webStorage) {
        var testKey = "__amiuni_storage_test__";
        webStorage.setItem(testKey, "1");
        webStorage.removeItem(testKey);
        return webStorage;
      }
    } catch (_err) {
      // Modo privado o file:// restringido: usa almacenamiento en memoria
    }
    return createMemoryStorage();
  }

  function resolveDefaultSeed() {
    if (root.AMIUNI && typeof root.AMIUNI === "object") {
      return root.AMIUNI;
    }
    if (typeof require === "function") {
      try {
        return require("../datos");
      } catch (_err) {
        return {};
      }
    }
    return {};
  }

  function countByStatus(animales, status) {
    return (animales || []).filter(function (a) {
      return a && a.estado === status;
    }).length;
  }

  function normalizeSiteConfig(rawSitio, fallbackSitio) {
    var base = fallbackSitio || DEFAULT_SITE_CONFIG;
    var src = rawSitio && typeof rawSitio === "object" && !Array.isArray(rawSitio) ? rawSitio : {};
    var out = {};
    SITE_CONFIG_KEYS.forEach(function (key) {
      if (typeof src[key] === "string") {
        var trimmed = src[key].trim();
        out[key] = REQUIRED_SITE_KEYS[key] && !trimmed ? base[key] : trimmed;
      } else {
        out[key] = base[key] != null ? String(base[key]) : "";
      }
    });
    return out;
  }

  function normalizePaymentMethods(rawMethods, baseMethods) {
    var base = baseMethods && typeof baseMethods === "object" && !Array.isArray(baseMethods) ? baseMethods : {};
    var src = rawMethods && typeof rawMethods === "object" && !Array.isArray(rawMethods) ? rawMethods : {};
    var out = clone(base);
    Object.keys(src).forEach(function (methodId) {
      var item = src[methodId];
      if (!item || typeof item !== "object" || Array.isArray(item)) {
        return;
      }
      var target = out[methodId] && typeof out[methodId] === "object" ? clone(out[methodId]) : {};
      Object.keys(item).forEach(function (field) {
        if (item[field] != null) {
          target[field] = String(item[field]).trim();
        }
      });
      out[methodId] = target;
    });
    return out;
  }

  function normalizeAcademyContent(rawContent, baseContent) {
    var base = baseContent && typeof baseContent === "object" ? baseContent : { titulo: "Amiuni Academia (nombre por definir)", lecciones: [], quiz: [] };
    var src = rawContent && typeof rawContent === "object" && !Array.isArray(rawContent) ? rawContent : {};
    var titulo = typeof src.titulo === "string" && src.titulo.trim()
      ? src.titulo.trim()
      : String(base.titulo || "Amiuni Academia (nombre por definir)");
    var lecciones = Array.isArray(src.lecciones) ? clone(src.lecciones) : clone(Array.isArray(base.lecciones) ? base.lecciones : []);
    var quiz = Array.isArray(src.quiz) ? clone(src.quiz) : clone(Array.isArray(base.quiz) ? base.quiz : []);
    return {
      titulo: titulo,
      lecciones: lecciones,
      quiz: quiz
    };
  }

  function normalizeAdminAuth(rawAuth) {
    if (
      rawAuth &&
      typeof rawAuth === "object" &&
      !Array.isArray(rawAuth) &&
      typeof rawAuth.usuario === "string" &&
      rawAuth.usuario.trim() &&
      typeof rawAuth.clave === "string" &&
      rawAuth.clave.length > 0
    ) {
      return {
        usuario: rawAuth.usuario.trim(),
        clave: rawAuth.clave
      };
    }
    return {
      usuario: ADMIN_DEMO_CREDENTIALS.usuario,
      clave: ADMIN_DEMO_CREDENTIALS.clave
    };
  }

  function buildSeedState(seedInput) {
    var seed = seedInput || {};
    var animales = clone(Array.isArray(seed.animales) ? seed.animales : []);
    var stats = seed.estadisticas || {};
    var meta = seed.meta || {};
    var defaultFilters = filtersMod ? clone(filtersMod.DEFAULT_FILTERS) : {
      especie: "",
      edad: "",
      tamano: "",
      sexo: "",
      estado: "",
      compatibilidad: "",
      busqueda: "",
      soloDisponibles: false,
      soloFavoritos: false,
      orden: ""
    };

    return {
      version: 1,
      animales: animales,
      filtros: defaultFilters,
      favoritos: [],
      borradoresAdopcion: {},
      solicitudes: [],
      donaciones: [],
      testimonios: clone(Array.isArray(seed.testimonios) ? seed.testimonios : []),
      sitio: normalizeSiteConfig(seed.sitio, DEFAULT_SITE_CONFIG),
      mediosPago: normalizePaymentMethods(seed.mediosPago, {}),
      metaConfig: {
        objetivo: Number(meta.objetivo) > 0 ? Number(meta.objetivo) : 600,
        recaudadoBase: Number.isFinite(Number(meta.recaudado)) ? Number(meta.recaudado) : 0,
        etiqueta: String(meta.etiqueta || "Meta del mes")
      },
      academia: {
        completadas: [],
        ultimoQuiz: null
      },
      academiaContenido: normalizeAcademyContent(seed.academia, null),
      adminAuth: normalizeAdminAuth(null),
      offsets: {
        offsetAdoptados: (Number(stats.adoptados) || 0) - countByStatus(animales, "adoptado"),
        offsetEnProceso: (Number(stats.enProceso) || 0) - countByStatus(animales, "proceso"),
        offsetAtendidos: (Number(stats.atendidos) || 0) - animales.length
      }
    };
  }

  function normalizeAcademiaState(rawAcademia) {
    var src = rawAcademia && typeof rawAcademia === "object" && !Array.isArray(rawAcademia)
      ? rawAcademia
      : {};
    var completadas = [];
    if (Array.isArray(src.completadas)) {
      src.completadas.forEach(function (id) {
        var key = id == null ? "" : String(id).trim();
        if (key && completadas.indexOf(key) === -1) {
          completadas.push(key);
        }
      });
    }
    var ultimoQuiz = null;
    if (src.ultimoQuiz && typeof src.ultimoQuiz === "object") {
      var qScore = Number(src.ultimoQuiz.score);
      var qTotal = Number(src.ultimoQuiz.total);
      if (Number.isFinite(qScore) && Number.isFinite(qTotal) && qTotal > 0) {
        var cleanScore = Math.max(0, Math.min(qTotal, qScore));
        ultimoQuiz = {
          score: cleanScore,
          total: qTotal,
          porcentaje: Number.isFinite(Number(src.ultimoQuiz.porcentaje))
            ? Math.min(100, Math.max(0, Math.round(Number(src.ultimoQuiz.porcentaje))))
            : Math.min(100, Math.max(0, Math.round((cleanScore / qTotal) * 100))),
          fecha: String(src.ultimoQuiz.fecha || "")
        };
      }
    }
    return {
      completadas: completadas,
      ultimoQuiz: ultimoQuiz
    };
  }

  function isValidPersistedState(parsed) {
    return Boolean(
      parsed &&
      typeof parsed === "object" &&
      Array.isArray(parsed.animales) &&
      parsed.offsets &&
      typeof parsed.offsets === "object" &&
      parsed.metaConfig &&
      typeof parsed.metaConfig === "object"
    );
  }

  function normalizePersistedState(parsed, seedInput) {
    var base = buildSeedState(seedInput);
    if (!isValidPersistedState(parsed)) {
      return base;
    }

    return {
      version: 1,
      animales: clone(parsed.animales),
      filtros: Object.assign({}, base.filtros, parsed.filtros || {}),
      favoritos: Array.isArray(parsed.favoritos) ? parsed.favoritos.filter(Boolean).map(String) : [],
      borradoresAdopcion: parsed.borradoresAdopcion && typeof parsed.borradoresAdopcion === "object"
        ? clone(parsed.borradoresAdopcion)
        : {},
      solicitudes: Array.isArray(parsed.solicitudes) ? clone(parsed.solicitudes) : [],
      donaciones: Array.isArray(parsed.donaciones) ? clone(parsed.donaciones) : [],
      testimonios: Array.isArray(parsed.testimonios) ? clone(parsed.testimonios) : base.testimonios,
      sitio: normalizeSiteConfig(parsed.sitio, base.sitio),
      mediosPago: normalizePaymentMethods(parsed.mediosPago, base.mediosPago),
      metaConfig: {
        objetivo: Number(parsed.metaConfig.objetivo) > 0 ? Number(parsed.metaConfig.objetivo) : base.metaConfig.objetivo,
        recaudadoBase: Number.isFinite(Number(parsed.metaConfig.recaudadoBase))
          ? Number(parsed.metaConfig.recaudadoBase)
          : base.metaConfig.recaudadoBase,
        etiqueta: String(parsed.metaConfig.etiqueta || base.metaConfig.etiqueta)
      },
      academia: normalizeAcademiaState(parsed.academia),
      academiaContenido: normalizeAcademyContent(parsed.academiaContenido, base.academiaContenido),
      adminAuth: normalizeAdminAuth(parsed.adminAuth),
      offsets: {
        offsetAdoptados: Number.isFinite(Number(parsed.offsets.offsetAdoptados))
          ? Number(parsed.offsets.offsetAdoptados)
          : base.offsets.offsetAdoptados,
        offsetEnProceso: Number.isFinite(Number(parsed.offsets.offsetEnProceso))
          ? Number(parsed.offsets.offsetEnProceso)
          : base.offsets.offsetEnProceso,
        offsetAtendidos: Number.isFinite(Number(parsed.offsets.offsetAtendidos))
          ? Number(parsed.offsets.offsetAtendidos)
          : base.offsets.offsetAtendidos
      }
    };
  }

  function createStore(initialOptions) {
    var opts = initialOptions || {};
    var seedData = opts.seed || resolveDefaultSeed();
    var storageKey = opts.storageKey || STORAGE_KEY;
    var storage = resolveWebStorage(opts.storage, typeof root.localStorage !== "undefined" ? root.localStorage : null);
    var sessionKey = opts.sessionKey || ADMIN_SESSION_KEY;
    var sessionStore = resolveWebStorage(opts.sessionStorage, typeof root.sessionStorage !== "undefined" ? root.sessionStorage : null);
    var listeners = [];
    var state = null;

    function persist() {
      try {
        storage.setItem(storageKey, JSON.stringify(state));
      } catch (_err) {
        // Fallback silencioso a memoria si excede cuota
        storage = createMemoryStorage();
        storage.setItem(storageKey, JSON.stringify(state));
      }
    }

    function notify() {
      var snapshot = clone(state);
      listeners.slice().forEach(function (fn) {
        try {
          fn(snapshot);
        } catch (_err) {
          // Evita que un suscriptor con error rompa el ciclo de notificaciones
        }
      });
    }

    function init(initOpts) {
      if (initOpts && typeof initOpts === "object") {
        if (initOpts.seed) { seedData = initOpts.seed; }
        if (initOpts.storageKey) { storageKey = initOpts.storageKey; }
        if (initOpts.storage) { storage = resolveWebStorage(initOpts.storage, typeof root.localStorage !== "undefined" ? root.localStorage : null); }
        if (initOpts.sessionKey) { sessionKey = initOpts.sessionKey; }
        if (initOpts.sessionStorage) { sessionStore = resolveWebStorage(initOpts.sessionStorage, typeof root.sessionStorage !== "undefined" ? root.sessionStorage : null); }
      }

      var parsed = null;
      try {
        var raw = storage.getItem(storageKey);
        if (raw) {
          parsed = JSON.parse(raw);
        }
      } catch (_err) {
        parsed = null;
      }

      state = normalizePersistedState(parsed, seedData);
      persist();
      return clone(state);
    }

    function ensureState() {
      if (!state) {
        init();
      }
    }

    function subscribe(listener) {
      if (typeof listener !== "function") {
        return function () {};
      }
      listeners.push(listener);
      return function unsubscribe() {
        var idx = listeners.indexOf(listener);
        if (idx !== -1) {
          listeners.splice(idx, 1);
        }
      };
    }

    function getState() {
      ensureState();
      return clone(state);
    }

    function resetDemoData() {
      state = buildSeedState(seedData);
      persist();
      notify();
      return clone(state);
    }

    function getAnimals(filters) {
      ensureState();
      if (filters && filtersMod && typeof filtersMod.filterAnimals === "function") {
        return clone(filtersMod.filterAnimals(state.animales, filters, state.favoritos));
      }
      return clone(state.animales);
    }

    function getAnimalById(id) {
      ensureState();
      var found = state.animales.filter(function (a) { return a.id === id; })[0];
      return found ? clone(found) : null;
    }

    function makeUniqueId(baseText, desiredId, items, fallbackPrefix) {
      var prefix = fallbackPrefix || "item";
      var rawBase = desiredId || (utils ? utils.normalizeText(baseText) : String(baseText || prefix).toLowerCase());
      var slug = rawBase.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || prefix;
      var list = Array.isArray(items) ? items : [];
      var exists = function (candidate) {
        return list.some(function (item) { return item && item.id === candidate; });
      };
      if (!exists(slug)) {
        return slug;
      }
      var i = 2;
      while (exists(slug + "-" + i)) {
        i++;
      }
      return slug + "-" + i;
    }

    function makeUniqueAnimalId(baseName, desiredId) {
      return makeUniqueId(baseName, desiredId, state.animales, "animal");
    }

    function upsertAnimal(payload) {
      ensureState();
      var input = payload || {};
      var existingIdx = -1;
      if (input.id) {
        for (var i = 0; i < state.animales.length; i++) {
          if (state.animales[i].id === input.id) {
            existingIdx = i;
            break;
          }
        }
      }

      var existing = existingIdx !== -1 ? state.animales[existingIdx] : null;
      var merged = existing ? Object.assign({}, existing, input) : Object.assign({}, input);

      if (validators && typeof validators.validateAnimalInput === "function") {
        var check = validators.validateAnimalInput(merged);
        if (!check.valid) {
          return { ok: false, errors: check.errors };
        }
      }

      var saludIn = merged.salud || {};
      var compatIn = merged.compatibilidad || {};
      var record = {
        id: existing ? existing.id : makeUniqueAnimalId(merged.nombre, merged.id),
        nombre: String(merged.nombre).trim(),
        especie: merged.especie,
        sexo: merged.sexo,
        edad: merged.edad,
        edadTexto: String(merged.edadTexto).trim(),
        tamano: merged.tamano,
        color: merged.color || "#CDE7F5",
        estado: merged.estado || "disponible",
        fotos: Array.isArray(merged.fotos) ? merged.fotos.slice() : [],
        salud: {
          esterilizado: Boolean(saludIn.esterilizado),
          vacunas: Boolean(saludIn.vacunas),
          desparasitado: Boolean(saludIn.desparasitado)
        },
        compatibilidad: {
          ninos: Boolean(compatIn.ninos),
          apartamento: Boolean(compatIn.apartamento),
          otrosPerros: Boolean(compatIn.otrosPerros),
          otrosGatos: Boolean(compatIn.otrosGatos)
        },
        etiquetas: Array.isArray(merged.etiquetas)
          ? merged.etiquetas.map(function (t) { return String(t).trim(); }).filter(Boolean)
          : [],
        historia: String(merged.historia).trim(),
        fechaIngreso: merged.fechaIngreso || new Date().toISOString().slice(0, 10),
        apadrinamientoMensual: merged.apadrinamientoMensual != null && merged.apadrinamientoMensual !== ""
          ? Number(merged.apadrinamientoMensual)
          : 20
      };

      if (existingIdx !== -1) {
        state.animales[existingIdx] = record;
      } else {
        state.animales.push(record);
      }

      persist();
      notify();
      return { ok: true, animal: clone(record) };
    }

    function updateAnimalStatus(id, estado) {
      ensureState();
      var validStatuses = validators ? validators.VALID_ANIMAL_STATUSES : ["disponible", "proceso", "adoptado"];
      if (validStatuses.indexOf(estado) === -1) {
        return { ok: false, error: "Estado de animal inválido." };
      }
      var found = state.animales.filter(function (a) { return a.id === id; })[0];
      if (!found) {
        return { ok: false, error: "Animal no encontrado." };
      }
      found.estado = estado;
      persist();
      notify();
      return { ok: true, animal: clone(found) };
    }

    function deleteAnimal(id) {
      ensureState();
      var prevLen = state.animales.length;
      state.animales = state.animales.filter(function (a) { return a.id !== id; });
      if (state.animales.length === prevLen) {
        return { ok: false, error: "Animal no encontrado." };
      }
      state.favoritos = state.favoritos.filter(function (favId) { return favId !== id; });
      delete state.borradoresAdopcion[id];
      persist();
      notify();
      return { ok: true };
    }

    function getFilters() {
      ensureState();
      return clone(state.filtros);
    }

    function setFilters(partialFilters) {
      ensureState();
      state.filtros = Object.assign({}, state.filtros, partialFilters || {});
      persist();
      notify();
      return clone(state.filtros);
    }

    function resetFilters() {
      ensureState();
      var defaults = filtersMod ? filtersMod.DEFAULT_FILTERS : {};
      state.filtros = clone(defaults);
      persist();
      notify();
      return clone(state.filtros);
    }

    function getFavorites() {
      ensureState();
      return clone(state.favoritos);
    }

    function isFavorite(animalId) {
      ensureState();
      return state.favoritos.indexOf(String(animalId)) !== -1;
    }

    function toggleFavorite(animalId) {
      ensureState();
      if (!animalId) { return false; }
      var key = String(animalId);
      var idx = state.favoritos.indexOf(key);
      var nowFav;
      if (idx === -1) {
        state.favoritos.push(key);
        nowFav = true;
      } else {
        state.favoritos.splice(idx, 1);
        nowFav = false;
      }
      persist();
      notify();
      return nowFav;
    }

    function getAdoptionDraft(animalId) {
      ensureState();
      if (!animalId) { return null; }
      var draft = state.borradoresAdopcion[animalId];
      return draft ? clone(draft) : null;
    }

    function saveAdoptionDraft(animalId, draft) {
      ensureState();
      if (!animalId) { return null; }
      var d = draft || {};
      var saved = {
        animalId: animalId,
        paso: Number.isFinite(Number(d.paso)) ? Number(d.paso) : 0,
        datos: clone(d.datos || {}),
        updatedAt: new Date().toISOString()
      };
      state.borradoresAdopcion[animalId] = saved;
      persist();
      notify();
      return clone(saved);
    }

    function clearAdoptionDraft(animalId) {
      ensureState();
      if (animalId) {
        delete state.borradoresAdopcion[animalId];
      } else {
        state.borradoresAdopcion = {};
      }
      persist();
      notify();
    }

    function submitAdoption(animalId, datos) {
      ensureState();
      var animal = state.animales.filter(function (a) { return a.id === animalId; })[0];
      if (!animal) {
        return { ok: false, errors: { general: "Animal no encontrado." } };
      }
      if (animal.estado !== "disponible") {
        return { ok: false, errors: { general: "Este animal ya tiene una solicitud en proceso o fue adoptado." } };
      }

      if (validators && typeof validators.validateAdoptionFull === "function") {
        var check = validators.validateAdoptionFull(datos);
        if (!check.valid) {
          return { ok: false, errors: check.errors };
        }
      }

      var existingCodes = state.solicitudes.map(function (s) { return s.codigo; });
      var code = utils
        ? utils.generateCode("AMI", existingCodes)
        : "AMI-" + String(Date.now()).slice(-6);
      var now = new Date().toISOString();

      var solicitud = {
        codigo: code,
        animalId: animal.id,
        animalNombre: animal.nombre,
        solicitante: {
          nombre: String(datos.nombre).trim(),
          telefono: String(datos.telefono).trim(),
          correo: String(datos.correo).trim()
        },
        hogar: {
          vivienda: datos.vivienda,
          otros: datos.otros,
          ninos: datos.ninos,
          motivo: String(datos.motivo).trim(),
          visita: datos.visita === "si" || datos.visita === true
        },
        estado: "pendiente",
        notaAdmin: "",
        fechaCreacion: now,
        fechaActualizacion: now
      };

      state.solicitudes.unshift(solicitud);
      animal.estado = "proceso";
      delete state.borradoresAdopcion[animal.id];

      persist();
      notify();
      return { ok: true, solicitud: clone(solicitud), animal: clone(animal) };
    }

    function getRequests(filter) {
      ensureState();
      var list = state.solicitudes;
      if (filter && typeof filter === "object") {
        list = list.filter(function (s) {
          if (filter.estado && s.estado !== filter.estado) { return false; }
          if (filter.animalId && s.animalId !== filter.animalId) { return false; }
          return true;
        });
      }
      return clone(list);
    }

    function getRequestByCode(code) {
      ensureState();
      var target = String(code == null ? "" : code).trim().toUpperCase();
      if (!target) { return null; }
      var found = state.solicitudes.filter(function (s) {
        return String(s.codigo || "").toUpperCase() === target;
      })[0];
      return found ? clone(found) : null;
    }

    function syncAnimalStatusFromRequests(animalId) {
      var animal = state.animales.filter(function (a) { return a.id === animalId; })[0];
      if (!animal) { return null; }

      var related = state.solicitudes.filter(function (s) { return s.animalId === animalId; });
      var hasApproved = related.some(function (s) { return s.estado === "aprobada"; });
      var hasActive = related.some(function (s) { return s.estado === "pendiente" || s.estado === "en_revision"; });

      if (hasApproved) {
        animal.estado = "adoptado";
      } else if (hasActive) {
        animal.estado = "proceso";
      } else {
        animal.estado = "disponible";
      }
      return animal;
    }

    function updateRequestStatus(code, newStatus, notaAdmin) {
      ensureState();
      if (VALID_REQUEST_STATUSES.indexOf(newStatus) === -1) {
        return { ok: false, error: "Estado de solicitud inválido." };
      }
      var target = String(code == null ? "" : code).trim().toUpperCase();
      var req = state.solicitudes.filter(function (s) {
        return String(s.codigo || "").toUpperCase() === target;
      })[0];

      if (!req) {
        return { ok: false, error: "Solicitud no encontrada." };
      }

      req.estado = newStatus;
      req.fechaActualizacion = new Date().toISOString();
      if (typeof notaAdmin === "string") {
        req.notaAdmin = notaAdmin.trim();
      }

      var syncedAnimal = syncAnimalStatusFromRequests(req.animalId);

      persist();
      notify();
      return {
        ok: true,
        solicitud: clone(req),
        animal: syncedAnimal ? clone(syncedAnimal) : null
      };
    }

    function getSiteConfig() {
      ensureState();
      return clone(state.sitio);
    }

    function updateSiteConfig(patch) {
      ensureState();
      if (!patch || typeof patch !== "object" || Array.isArray(patch)) {
        return { ok: false, error: "Configuración de sitio inválida." };
      }
      var next = clone(state.sitio);
      for (var i = 0; i < SITE_CONFIG_KEYS.length; i++) {
        var key = SITE_CONFIG_KEYS[i];
        if (Object.prototype.hasOwnProperty.call(patch, key) && patch[key] != null) {
          var val = String(patch[key]).trim();
          if (REQUIRED_SITE_KEYS[key] && !val) {
            return {
              ok: false,
              error: key === "nombreMarca"
                ? "El nombre de marca no puede estar vacío."
                : "El nombre de Academia en el menú no puede estar vacío."
            };
          }
          next[key] = val;
        }
      }
      state.sitio = next;
      persist();
      notify();
      return { ok: true, sitio: clone(state.sitio) };
    }

    function updateBaseStats(payload) {
      ensureState();
      var p = payload || {};
      var nextOffsets = clone(state.offsets);
      var mappings = [
        { field: "adoptados", offsetKey: "offsetAdoptados", baseCount: countByStatus(state.animales, "adoptado") },
        { field: "enProceso", offsetKey: "offsetEnProceso", baseCount: countByStatus(state.animales, "proceso") },
        { field: "atendidos", offsetKey: "offsetAtendidos", baseCount: state.animales.length }
      ];
      for (var i = 0; i < mappings.length; i++) {
        var m = mappings[i];
        if (p[m.field] != null && p[m.field] !== "") {
          var num = Number(p[m.field]);
          if (!Number.isFinite(num) || num < 0) {
            return { ok: false, error: "Las métricas deben ser números mayores o iguales a 0." };
          }
          nextOffsets[m.offsetKey] = Math.round(num) - m.baseCount;
        }
      }
      state.offsets = nextOffsets;
      persist();
      notify();
      return { ok: true, stats: getStats() };
    }

    function getPaymentMethods() {
      ensureState();
      return clone(state.mediosPago);
    }

    function updatePaymentMethod(id, patch) {
      ensureState();
      if (!id || !state.mediosPago || !Object.prototype.hasOwnProperty.call(state.mediosPago, id)) {
        return { ok: false, error: "Medio de pago no encontrado." };
      }
      if (!patch || typeof patch !== "object" || Array.isArray(patch)) {
        return { ok: false, error: "Datos de medio de pago inválidos." };
      }
      var target = clone(state.mediosPago[id]);
      PAYMENT_METHOD_FIELDS.forEach(function (field) {
        if (Object.prototype.hasOwnProperty.call(patch, field) && patch[field] != null) {
          target[field] = String(patch[field]).trim();
        }
      });
      state.mediosPago[id] = target;
      persist();
      notify();
      return { ok: true, method: clone(target), methods: clone(state.mediosPago) };
    }

    function getMeta() {
      ensureState();
      var sumDonaciones = state.donaciones
        .filter(function (d) { return d && d.estado !== "anulada"; })
        .reduce(function (acc, d) { return acc + (Number(d.monto) || 0); }, 0);
      var objetivo = state.metaConfig.objetivo;
      var recaudado = state.metaConfig.recaudadoBase + sumDonaciones;
      var porcentaje = objetivo > 0 ? Math.min(100, Math.round((recaudado / objetivo) * 100)) : 0;

      return {
        objetivo: objetivo,
        recaudado: recaudado,
        recaudadoBase: state.metaConfig.recaudadoBase,
        etiqueta: state.metaConfig.etiqueta,
        porcentaje: porcentaje
      };
    }

    function updateMetaConfig(partialMeta) {
      ensureState();
      var p = partialMeta || {};
      if (p.objetivo != null) {
        var obj = Number(p.objetivo);
        if (!Number.isFinite(obj) || obj <= 0) {
          return { ok: false, error: "El objetivo debe ser mayor a 0." };
        }
        state.metaConfig.objetivo = obj;
      }
      if (p.recaudadoBase != null) {
        var base = Number(p.recaudadoBase);
        if (!Number.isFinite(base) || base < 0) {
          return { ok: false, error: "El monto base no puede ser negativo." };
        }
        state.metaConfig.recaudadoBase = base;
      }
      if (typeof p.etiqueta === "string" && p.etiqueta.trim()) {
        state.metaConfig.etiqueta = p.etiqueta.trim();
      }

      persist();
      notify();
      return { ok: true, meta: getMeta() };
    }

    function getDonations(filter) {
      ensureState();
      var list = state.donaciones;
      if (filter && typeof filter === "object") {
        list = list.filter(function (d) {
          if (filter.estado && d.estado !== filter.estado) { return false; }
          if (filter.metodo && d.metodo !== filter.metodo) { return false; }
          return true;
        });
      }
      return clone(list);
    }

    function getDonationByCode(code) {
      ensureState();
      var target = String(code == null ? "" : code).trim().toUpperCase();
      if (!target) { return null; }
      var found = state.donaciones.filter(function (d) {
        return String(d.codigo || "").toUpperCase() === target;
      })[0];
      return found ? clone(found) : null;
    }

    function submitDonation(payload) {
      ensureState();
      var p = payload || {};
      if (validators && typeof validators.validateDonation === "function") {
        var check = validators.validateDonation(p);
        if (!check.valid) {
          return { ok: false, errors: check.errors };
        }
      }

      var existingCodes = state.donaciones.map(function (d) { return d.codigo; });
      var code = utils
        ? utils.generateCode("DON", existingCodes)
        : "DON-" + String(Date.now()).slice(-6);
      var now = new Date().toISOString();
      var anonimo = Boolean(p.anonimo);

      var donacion = {
        codigo: code,
        monto: Number(p.monto),
        metodo: p.metodo,
        referencia: String(p.referencia).trim(),
        anonimo: anonimo,
        donanteNombre: anonimo ? "Donante anónimo" : String(p.donanteNombre || "").trim(),
        donanteCorreo: String(p.donanteCorreo || "").trim(),
        padrino: Boolean(p.padrino),
        animalId: p.animalId || null,
        mensaje: String(p.mensaje || "").trim(),
        estado: "pendiente",
        notaAdmin: "",
        fechaCreacion: now,
        fechaActualizacion: now
      };

      state.donaciones.unshift(donacion);
      persist();
      notify();
      return { ok: true, donacion: clone(donacion), meta: getMeta() };
    }

    function updateDonationStatus(code, newStatus, notaAdmin) {
      ensureState();
      if (VALID_DONATION_STATUSES.indexOf(newStatus) === -1) {
        return { ok: false, error: "Estado de donación inválido." };
      }
      var target = String(code == null ? "" : code).trim().toUpperCase();
      var don = state.donaciones.filter(function (d) {
        return String(d.codigo || "").toUpperCase() === target;
      })[0];

      if (!don) {
        return { ok: false, error: "Donación no encontrada." };
      }

      don.estado = newStatus;
      don.fechaActualizacion = new Date().toISOString();
      if (typeof notaAdmin === "string") {
        don.notaAdmin = notaAdmin.trim();
      }

      persist();
      notify();
      return { ok: true, donacion: clone(don), meta: getMeta() };
    }

    function getTestimonials() {
      ensureState();
      return clone(state.testimonios);
    }

    function upsertTestimonial(payload) {
      ensureState();
      var p = payload || {};
      var texto = String(p.texto == null ? "" : p.texto).trim();
      var autor = String(p.autor == null ? "" : p.autor).trim();
      if (!texto || !autor) {
        return { ok: false, error: "Completa el autor y el texto del testimonio." };
      }

      var existingIdx = -1;
      if (p.id != null && p.id !== "") {
        for (var i = 0; i < state.testimonios.length; i++) {
          if (state.testimonios[i] && state.testimonios[i].id === p.id) {
            existingIdx = i;
            break;
          }
        }
        if (existingIdx === -1 && /^\d+$/.test(String(p.id))) {
          var numIdx = Number(p.id);
          if (numIdx >= 0 && numIdx < state.testimonios.length && !state.testimonios[numIdx].id) {
            existingIdx = numIdx;
          }
        }
      }

      var existing = existingIdx !== -1 ? state.testimonios[existingIdx] : null;
      var fechaInput = p.fecha != null ? String(p.fecha).trim() : "";
      var record = {
        id: existing && existing.id
          ? existing.id
          : makeUniqueId("test", typeof p.id === "string" ? p.id : "", state.testimonios, "test"),
        texto: texto,
        autor: autor,
        fecha: fechaInput || (existing && existing.fecha) || new Date().toISOString().slice(0, 10)
      };

      if (existingIdx !== -1) {
        state.testimonios[existingIdx] = record;
      } else {
        state.testimonios.push(record);
      }

      persist();
      notify();
      return { ok: true, testimonial: clone(record) };
    }

    function deleteTestimonial(idOrIndex) {
      ensureState();
      var idx = -1;
      for (var i = 0; i < state.testimonios.length; i++) {
        if (state.testimonios[i] && state.testimonios[i].id === idOrIndex) {
          idx = i;
          break;
        }
      }
      if (idx === -1 && Number.isInteger(Number(idOrIndex))) {
        var numIdx = Number(idOrIndex);
        if (numIdx >= 0 && numIdx < state.testimonios.length) {
          idx = numIdx;
        }
      }
      if (idx === -1) {
        return { ok: false, error: "Testimonio no encontrado." };
      }
      state.testimonios.splice(idx, 1);
      persist();
      notify();
      return { ok: true };
    }

    function exportBackup() {
      ensureState();
      return {
        app: "amiuni",
        version: 1,
        exportedAt: new Date().toISOString(),
        state: clone(state)
      };
    }

    function isValidBackupCandidate(candidate) {
      if (!isValidPersistedState(candidate)) {
        return false;
      }
      if (!(Number(candidate.metaConfig.objetivo) > 0)) {
        return false;
      }
      var validAnimals = candidate.animales.every(function (a) {
        return a && typeof a === "object" && typeof a.id === "string" && a.id.trim() && typeof a.nombre === "string" && a.nombre.trim();
      });
      if (!validAnimals) {
        return false;
      }
      if (candidate.solicitudes != null && !Array.isArray(candidate.solicitudes)) { return false; }
      if (candidate.donaciones != null && !Array.isArray(candidate.donaciones)) { return false; }
      if (candidate.testimonios != null && !Array.isArray(candidate.testimonios)) { return false; }
      if (candidate.academia != null && (typeof candidate.academia !== "object" || Array.isArray(candidate.academia))) { return false; }
      if (candidate.sitio != null && (typeof candidate.sitio !== "object" || Array.isArray(candidate.sitio))) { return false; }
      if (candidate.mediosPago != null && (typeof candidate.mediosPago !== "object" || Array.isArray(candidate.mediosPago))) { return false; }
      if (candidate.academiaContenido != null) {
        if (typeof candidate.academiaContenido !== "object" || Array.isArray(candidate.academiaContenido)) { return false; }
        if (candidate.academiaContenido.lecciones != null && !Array.isArray(candidate.academiaContenido.lecciones)) { return false; }
        if (candidate.academiaContenido.quiz != null && !Array.isArray(candidate.academiaContenido.quiz)) { return false; }
      }
      if (candidate.adminAuth != null) {
        if (typeof candidate.adminAuth !== "object" || Array.isArray(candidate.adminAuth)) { return false; }
        if (typeof candidate.adminAuth.usuario !== "string" || !candidate.adminAuth.usuario.trim() ||
            typeof candidate.adminAuth.clave !== "string" || !candidate.adminAuth.clave) {
          return false;
        }
      }
      return true;
    }

    function importBackup(input) {
      ensureState();
      var parsed = input;
      if (typeof input === "string") {
        try {
          parsed = JSON.parse(input);
        } catch (_err) {
          return { ok: false, error: "El archivo no contiene un JSON válido." };
        }
      }
      var candidate = (parsed && typeof parsed === "object" && parsed.state && typeof parsed.state === "object")
        ? parsed.state
        : parsed;

      if (!isValidBackupCandidate(candidate)) {
        return { ok: false, error: "El respaldo JSON no tiene la estructura esperada de Amiuni." };
      }

      state = normalizePersistedState(candidate, seedData);
      persist();
      notify();
      return { ok: true, state: clone(state) };
    }

    function saveAdminSessionObj(session) {
      try {
        sessionStore.setItem(sessionKey, JSON.stringify(session));
      } catch (_err) {
        sessionStore = createMemoryStorage();
        sessionStore.setItem(sessionKey, JSON.stringify(session));
      }
    }

    function getAdminSession() {
      ensureState();
      try {
        var raw = sessionStore.getItem(sessionKey);
        if (!raw) { return null; }
        var parsed = JSON.parse(raw);
        var activeUser = (state.adminAuth && state.adminAuth.usuario) || ADMIN_DEMO_CREDENTIALS.usuario;
        if (parsed && parsed.usuario === activeUser) {
          return clone(parsed);
        }
      } catch (_err) {
        return null;
      }
      return null;
    }

    function isAdminAuthenticated() {
      return Boolean(getAdminSession());
    }

    function loginAdmin(usuario, clave) {
      ensureState();
      var u = String(usuario == null ? "" : usuario).trim();
      var p = String(clave == null ? "" : clave);
      var auth = state.adminAuth || ADMIN_DEMO_CREDENTIALS;
      if (u !== auth.usuario || p !== auth.clave) {
        return { ok: false, error: "Usuario o clave incorrectos." };
      }
      var session = {
        usuario: u,
        role: "admin",
        loggedInAt: new Date().toISOString()
      };
      saveAdminSessionObj(session);
      notify();
      return { ok: true, session: clone(session) };
    }

    function updateAdminCredentials(payload) {
      ensureState();
      var p = payload || {};
      var u = String(p.usuario == null ? "" : p.usuario).trim();
      var c = String(p.clave == null ? "" : p.clave);
      if (u.length < 3) {
        return { ok: false, error: "El usuario debe tener al menos 3 caracteres." };
      }
      if (c.length < 4) {
        return { ok: false, error: "La clave debe tener al menos 4 caracteres." };
      }
      var currentSession = getAdminSession();
      state.adminAuth = { usuario: u, clave: c };
      if (currentSession) {
        saveAdminSessionObj({
          usuario: u,
          role: "admin",
          loggedInAt: currentSession.loggedInAt || new Date().toISOString()
        });
      }
      persist();
      notify();
      return { ok: true, usuario: u };
    }

    function logoutAdmin() {
      try {
        if (typeof sessionStore.removeItem === "function") {
          sessionStore.removeItem(sessionKey);
        } else {
          sessionStore.setItem(sessionKey, "");
        }
      } catch (_err) {
        sessionStore = createMemoryStorage();
      }
      notify();
      return { ok: true };
    }

    function getStats() {
      ensureState();
      return {
        adoptados: Math.max(0, state.offsets.offsetAdoptados + countByStatus(state.animales, "adoptado")),
        enProceso: Math.max(0, state.offsets.offsetEnProceso + countByStatus(state.animales, "proceso")),
        atendidos: Math.max(0, state.offsets.offsetAtendidos + state.animales.length)
      };
    }

    function getAcademyData() {
      ensureState();
      var raw = state.academiaContenido && typeof state.academiaContenido === "object"
        ? state.academiaContenido
        : {};
      return {
        titulo: String(raw.titulo || "Amiuni Academia (nombre por definir)"),
        lecciones: clone(Array.isArray(raw.lecciones) ? raw.lecciones : []),
        quiz: clone(Array.isArray(raw.quiz) ? raw.quiz : [])
      };
    }

    function updateAcademyTitle(titulo) {
      ensureState();
      var clean = String(titulo == null ? "" : titulo).trim();
      if (!clean) {
        return { ok: false, error: "El título de la sección no puede estar vacío." };
      }
      state.academiaContenido.titulo = clean;
      persist();
      notify();
      return { ok: true, titulo: clean, academia: getAcademyData() };
    }

    function upsertAcademyLesson(lesson) {
      ensureState();
      var input = lesson || {};
      var titulo = String(input.titulo == null ? "" : input.titulo).trim();
      var categoria = String(input.categoria == null ? "" : input.categoria).trim();
      var resumen = String(input.resumen == null ? "" : input.resumen).trim();
      if (!titulo || !categoria || !resumen) {
        return { ok: false, error: "Completa título, categoría y resumen de la lección." };
      }

      var lecciones = state.academiaContenido.lecciones;
      var existingIdx = -1;
      if (input.id) {
        for (var i = 0; i < lecciones.length; i++) {
          if (lecciones[i] && lecciones[i].id === input.id) {
            existingIdx = i;
            break;
          }
        }
      }

      var puntosClave = [];
      if (Array.isArray(input.puntosClave)) {
        puntosClave = input.puntosClave.map(function (pt) { return String(pt == null ? "" : pt).trim(); }).filter(Boolean);
      } else if (typeof input.puntosClave === "string") {
        puntosClave = input.puntosClave.split(/\r?\n/).map(function (pt) { return pt.trim(); }).filter(Boolean);
      }

      var record = {
        id: existingIdx !== -1
          ? lecciones[existingIdx].id
          : makeUniqueId(titulo, input.id, lecciones, "leccion"),
        categoria: categoria,
        duracion: String(input.duracion == null ? "" : input.duracion).trim() || "4 min",
        titulo: titulo,
        resumen: resumen,
        puntosClave: puntosClave,
        mito: String(input.mito == null ? "" : input.mito).trim(),
        realidad: String(input.realidad == null ? "" : input.realidad).trim(),
        ctaTexto: String(input.ctaTexto == null ? "" : input.ctaTexto).trim() || "Ver más",
        ctaRuta: String(input.ctaRuta == null ? "" : input.ctaRuta).trim() || "#/"
      };

      if (existingIdx !== -1) {
        lecciones[existingIdx] = record;
      } else {
        lecciones.push(record);
      }

      persist();
      notify();
      return { ok: true, lesson: clone(record) };
    }

    function deleteAcademyLesson(id) {
      ensureState();
      var lecciones = state.academiaContenido.lecciones;
      var prevLen = lecciones.length;
      state.academiaContenido.lecciones = lecciones.filter(function (l) { return l && l.id !== id; });
      if (state.academiaContenido.lecciones.length === prevLen) {
        return { ok: false, error: "Lección no encontrada." };
      }
      state.academia.completadas = state.academia.completadas.filter(function (cid) { return cid !== id; });
      persist();
      notify();
      return { ok: true };
    }

    function upsertAcademyQuestion(question) {
      ensureState();
      var input = question || {};
      var pregunta = String(input.pregunta == null ? "" : input.pregunta).trim();
      if (!pregunta) {
        return { ok: false, error: "Escribe el texto de la pregunta." };
      }

      var rawOpts = Array.isArray(input.opciones) ? input.opciones : [];
      var opciones = rawOpts
        .map(function (op) {
          var txt = op && op.texto != null ? String(op.texto).trim() : "";
          var pts = Number(op && op.puntos);
          return {
            texto: txt,
            puntos: Number.isFinite(pts) ? pts : 0
          };
        })
        .filter(function (op) { return Boolean(op.texto); });

      if (opciones.length < 2) {
        return { ok: false, error: "Agrega al menos 2 opciones de respuesta." };
      }

      var quiz = state.academiaContenido.quiz;
      var existingIdx = -1;
      if (input.id) {
        for (var i = 0; i < quiz.length; i++) {
          if (quiz[i] && quiz[i].id === input.id) {
            existingIdx = i;
            break;
          }
        }
      }

      var record = {
        id: existingIdx !== -1
          ? quiz[existingIdx].id
          : makeUniqueId(pregunta, input.id, quiz, "quiz"),
        pregunta: pregunta,
        opciones: opciones,
        explicacion: String(input.explicacion == null ? "" : input.explicacion).trim()
      };

      if (existingIdx !== -1) {
        quiz[existingIdx] = record;
      } else {
        quiz.push(record);
      }

      persist();
      notify();
      return { ok: true, question: clone(record) };
    }

    function deleteAcademyQuestion(id) {
      ensureState();
      var quiz = state.academiaContenido.quiz;
      var prevLen = quiz.length;
      state.academiaContenido.quiz = quiz.filter(function (q) { return q && q.id !== id; });
      if (state.academiaContenido.quiz.length === prevLen) {
        return { ok: false, error: "Pregunta no encontrada." };
      }
      persist();
      notify();
      return { ok: true };
    }

    function getAcademyProgress() {
      ensureState();
      var data = getAcademyData();
      var total = data.lecciones.length;
      var completadas = clone(state.academia.completadas);
      var porcentaje = total > 0 ? Math.min(100, Math.round((completadas.length / total) * 100)) : 0;
      return {
        completadas: completadas,
        total: total,
        porcentaje: porcentaje,
        ultimoQuiz: state.academia.ultimoQuiz ? clone(state.academia.ultimoQuiz) : null
      };
    }

    function toggleLessonCompleted(lessonId) {
      ensureState();
      if (!lessonId) { return false; }
      var key = String(lessonId).trim();
      if (!key) { return false; }
      var idx = state.academia.completadas.indexOf(key);
      var nowCompleted;
      if (idx === -1) {
        state.academia.completadas.push(key);
        nowCompleted = true;
      } else {
        state.academia.completadas.splice(idx, 1);
        nowCompleted = false;
      }
      persist();
      notify();
      return nowCompleted;
    }

    function saveAcademyQuizResult(score, total) {
      ensureState();
      var numScore = Number(score);
      var numTotal = Number(total);
      if (!Number.isFinite(numScore) || !Number.isFinite(numTotal) || numTotal <= 0) {
        return null;
      }
      var cleanScore = Math.max(0, Math.min(numTotal, numScore));
      var porcentaje = Math.min(100, Math.max(0, Math.round((cleanScore / numTotal) * 100)));
      var summary = {
        score: cleanScore,
        total: numTotal,
        porcentaje: porcentaje,
        fecha: new Date().toISOString()
      };
      state.academia.ultimoQuiz = summary;
      persist();
      notify();
      return clone(summary);
    }

    return {
      init: init,
      subscribe: subscribe,
      getState: getState,
      resetDemoData: resetDemoData,
      getAnimals: getAnimals,
      getAnimalById: getAnimalById,
      upsertAnimal: upsertAnimal,
      updateAnimalStatus: updateAnimalStatus,
      deleteAnimal: deleteAnimal,
      getFilters: getFilters,
      setFilters: setFilters,
      resetFilters: resetFilters,
      getFavorites: getFavorites,
      isFavorite: isFavorite,
      toggleFavorite: toggleFavorite,
      getAdoptionDraft: getAdoptionDraft,
      saveAdoptionDraft: saveAdoptionDraft,
      clearAdoptionDraft: clearAdoptionDraft,
      submitAdoption: submitAdoption,
      getRequests: getRequests,
      getRequestByCode: getRequestByCode,
      updateRequestStatus: updateRequestStatus,
      getSiteConfig: getSiteConfig,
      updateSiteConfig: updateSiteConfig,
      updateBaseStats: updateBaseStats,
      getPaymentMethods: getPaymentMethods,
      updatePaymentMethod: updatePaymentMethod,
      getMeta: getMeta,
      updateMetaConfig: updateMetaConfig,
      getDonations: getDonations,
      getDonationByCode: getDonationByCode,
      submitDonation: submitDonation,
      updateDonationStatus: updateDonationStatus,
      getTestimonials: getTestimonials,
      upsertTestimonial: upsertTestimonial,
      deleteTestimonial: deleteTestimonial,
      exportBackup: exportBackup,
      importBackup: importBackup,
      loginAdmin: loginAdmin,
      logoutAdmin: logoutAdmin,
      isAdminAuthenticated: isAdminAuthenticated,
      getAdminSession: getAdminSession,
      updateAdminCredentials: updateAdminCredentials,
      getStats: getStats,
      getAcademyData: getAcademyData,
      updateAcademyTitle: updateAcademyTitle,
      upsertAcademyLesson: upsertAcademyLesson,
      deleteAcademyLesson: deleteAcademyLesson,
      upsertAcademyQuestion: upsertAcademyQuestion,
      deleteAcademyQuestion: deleteAcademyQuestion,
      getAcademyProgress: getAcademyProgress,
      toggleLessonCompleted: toggleLessonCompleted,
      saveAcademyQuizResult: saveAcademyQuizResult
    };
  }

  var defaultStore = createStore();
  defaultStore.store = defaultStore;
  defaultStore.createStore = createStore;
  defaultStore.STORAGE_KEY = STORAGE_KEY;
  defaultStore.ADMIN_SESSION_KEY = ADMIN_SESSION_KEY;
  defaultStore.ADMIN_DEMO_CREDENTIALS = Object.assign({}, ADMIN_DEMO_CREDENTIALS);
  defaultStore.createMemoryStorage = createMemoryStorage;

  App.createStore = createStore;
  App.store = defaultStore;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = defaultStore;
  }
})(typeof globalThis !== "undefined" ? globalThis : window);
