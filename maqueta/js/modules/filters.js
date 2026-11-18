/* Logica pura de filtrado, busqueda, compatibilidad y ordenamiento para Amiuni. */
(function (root) {
  "use strict";

  var App = (root.AmiuniApp = root.AmiuniApp || {});
  var utils = App.utils || (typeof require === "function" ? require("./utils") : null);

  function norm(v) {
    if (utils && typeof utils.normalizeText === "function") {
      return utils.normalizeText(v);
    }
    return String(v == null ? "" : v).trim().toLowerCase();
  }

  var DEFAULT_FILTERS = {
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

  var TAG_COMPAT_HINTS = {
    ninos: ["ninos", "niños"],
    apartamento: ["apartamento", "apartamentos"],
    otrosPerros: ["perro", "perros"],
    otrosGatos: ["gato", "gatos"]
  };

  /** Verifica si un animal cumple una clave de compatibilidad (ninos, apartamento, otrosPerros, otrosGatos). */
  function isCompatible(animal, key) {
    if (!animal || !key) { return true; }
    if (animal.compatibilidad && typeof animal.compatibilidad === "object" && Object.prototype.hasOwnProperty.call(animal.compatibilidad, key)) {
      return Boolean(animal.compatibilidad[key]);
    }
    var hints = TAG_COMPAT_HINTS[key];
    if (!hints || !Array.isArray(animal.etiquetas)) {
      return false;
    }
    var joined = norm(animal.etiquetas.join(" "));
    return hints.some(function (h) {
      return joined.indexOf(norm(h)) !== -1;
    });
  }

  function extractCompatibilityKeys(compat) {
    if (!compat) { return []; }
    if (typeof compat === "string") {
      var trimmed = compat.trim();
      return trimmed ? [trimmed] : [];
    }
    if (Array.isArray(compat)) {
      return compat.filter(function (k) { return typeof k === "string" && k.trim(); });
    }
    if (typeof compat === "object") {
      return Object.keys(compat).filter(function (k) { return Boolean(compat[k]); });
    }
    return [];
  }

  /** Determina si un animal coincide con una consulta de texto libre (soporta tildes y multiples palabras). */
  function matchesSearch(animal, query) {
    var q = norm(query);
    if (!q) { return true; }
    if (!animal) { return false; }

    var haystack = norm([
      animal.nombre,
      animal.especie,
      animal.sexo,
      animal.edad,
      animal.edadTexto,
      animal.tamano,
      animal.historia,
      Array.isArray(animal.etiquetas) ? animal.etiquetas.join(" ") : ""
    ].join(" "));

    var tokens = q.split(" ").filter(Boolean);
    return tokens.every(function (token) {
      return haystack.indexOf(token) !== -1;
    });
  }

  function buildFavoriteLookup(favoritosIds) {
    var map = {};
    if (!favoritosIds) { return map; }
    if (typeof favoritosIds.forEach === "function") {
      favoritosIds.forEach(function (id) {
        if (id != null) { map[String(id)] = true; }
      });
    }
    return map;
  }

  function sortAnimals(list, orden) {
    if (!orden) { return list; }
    var copy = list.slice();

    if (orden === "nombre" || orden === "nombre_asc") {
      copy.sort(function (a, b) {
        return String(a.nombre || "").localeCompare(String(b.nombre || ""), "es");
      });
    } else if (orden === "recientes") {
      copy.sort(function (a, b) {
        var da = Date.parse(a.fechaIngreso || "") || 0;
        var db = Date.parse(b.fechaIngreso || "") || 0;
        return db - da;
      });
    } else if (orden === "disponibles") {
      var rank = { disponible: 0, proceso: 1, adoptado: 2 };
      copy.sort(function (a, b) {
        var ra = Object.prototype.hasOwnProperty.call(rank, a.estado) ? rank[a.estado] : 3;
        var rb = Object.prototype.hasOwnProperty.call(rank, b.estado) ? rank[b.estado] : 3;
        return ra - rb;
      });
    }
    return copy;
  }

  /** Filtra y ordena una lista de animales sin mutar el arreglo original. */
  function filterAnimals(animales, filters, favoritosIds) {
    var list = Array.isArray(animales) ? animales : [];
    var f = Object.assign({}, DEFAULT_FILTERS, filters || {});
    var favMap = f.soloFavoritos ? buildFavoriteLookup(favoritosIds) : null;
    var compatKeys = extractCompatibilityKeys(f.compatibilidad);

    var filtered = list.filter(function (animal) {
      if (!animal) { return false; }
      if (f.especie && animal.especie !== f.especie) { return false; }
      if (f.edad && animal.edad !== f.edad) { return false; }
      if (f.tamano && animal.tamano !== f.tamano) { return false; }
      if (f.sexo && animal.sexo !== f.sexo) { return false; }
      if (f.estado && animal.estado !== f.estado) { return false; }
      if (f.soloDisponibles && animal.estado !== "disponible") { return false; }
      if (f.soloFavoritos && !favMap[String(animal.id)]) { return false; }
      if (compatKeys.length && !compatKeys.every(function (key) { return isCompatible(animal, key); })) {
        return false;
      }
      if (f.busqueda && !matchesSearch(animal, f.busqueda)) { return false; }
      return true;
    });

    return sortAnimals(filtered, f.orden);
  }

  /** Cuenta cuantos criterios de filtro activos tiene el usuario. */
  function countActiveFilters(filters) {
    var f = Object.assign({}, DEFAULT_FILTERS, filters || {});
    var count = 0;

    ["especie", "edad", "tamano", "sexo", "estado", "busqueda"].forEach(function (key) {
      if (String(f[key] || "").trim()) {
        count++;
      }
    });

    count += extractCompatibilityKeys(f.compatibilidad).length;
    if (f.soloDisponibles === true) { count++; }
    if (f.soloFavoritos === true) { count++; }

    return count;
  }

  /** Resume textualmente la cantidad de animales visibles respecto al total. */
  function summarizeResults(total, filteredCount) {
    var totalNum = Math.max(0, Number(total) || 0);
    var filteredNum = Math.max(0, Number(filteredCount) || 0);

    if (filteredNum === totalNum) {
      return filteredNum + (filteredNum === 1 ? " animal" : " animales");
    }
    return filteredNum + " de " + totalNum + (totalNum === 1 ? " animal" : " animales");
  }

  var api = {
    DEFAULT_FILTERS: DEFAULT_FILTERS,
    isCompatible: isCompatible,
    matchesSearch: matchesSearch,
    filterAnimals: filterAnimals,
    countActiveFilters: countActiveFilters,
    summarizeResults: summarizeResults
  };

  App.filters = api;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : window);
