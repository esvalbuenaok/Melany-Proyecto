/* Utilidades compartidas, iconos SVG y helpers de UI para Amiuni. */
(function (root) {
  "use strict";

  var App = (root.AmiuniApp = root.AmiuniApp || {});

  var ICONOS = {
    jeringa: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 2l4 4M17 7l3-3M19 9l-8.7 8.7a2 2 0 0 1-2.8 0L6.3 16.5a2 2 0 0 1 0-2.8L15 5M9 11l4 4M5 19l-3 3M14 4l6 6"/></svg>',
    huella: '<svg viewBox="0 0 32 32" fill="currentColor" aria-hidden="true"><ellipse cx="16" cy="21" rx="7.5" ry="6"/><ellipse cx="6.5" cy="13" rx="3" ry="3.8"/><ellipse cx="12.5" cy="7.5" rx="3" ry="3.8"/><ellipse cx="19.5" cy="7.5" rx="3" ry="3.8"/><ellipse cx="25.5" cy="13" rx="3" ry="3.8"/></svg>',
    corazon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.8 5.6a5 5 0 0 0-7.1 0L12 7.3l-1.7-1.7a5 5 0 0 0-7.1 7.1L12 21.5l8.8-8.8a5 5 0 0 0 0-7.1z"/></svg>',
    corazonLleno: '<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.8 5.6a5 5 0 0 0-7.1 0L12 7.3l-1.7-1.7a5 5 0 0 0-7.1 7.1L12 21.5l8.8-8.8a5 5 0 0 0 0-7.1z"/></svg>',
    casa: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 11l9-8 9 8M5 10v10h14V10M10 20v-6h4v6"/></svg>',
    ok: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M8 12.5l3 3 5-6"/></svg>',
    buscar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg>',
    compartir: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/></svg>',
    copiar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',
    alerta: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4M12 17h.01"/></svg>'
  };

  /** Escapa caracteres HTML especiales para prevenir inyeccion en plantillas. */
  function esc(str) {
    return String(str == null ? "" : str).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /** Capitaliza la primera letra de una cadena. */
  function cap(str) {
    if (str == null) { return ""; }
    var s = String(str);
    return s ? s.charAt(0).toUpperCase() + s.slice(1) : "";
  }

  /** Normaliza texto para busquedas: minusculas, sin tildes ni espacios extremos. */
  function normalizeText(str) {
    if (str == null) { return ""; }
    var s = String(str).trim().toLowerCase();
    if (typeof s.normalize === "function") {
      s = s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    }
    return s.replace(/\s+/g, " ");
  }

  /** Clona profundamente estructuras simples (objetos, arreglos, fechas, primitivos). */
  function deepClone(obj) {
    if (obj === null || typeof obj !== "object") {
      return obj;
    }
    if (obj instanceof Date) {
      return new Date(obj.getTime());
    }
    if (Array.isArray(obj)) {
      return obj.map(deepClone);
    }
    var out = {};
    Object.keys(obj).forEach(function (key) {
      out[key] = deepClone(obj[key]);
    });
    return out;
  }

  /** Formatea un monto numerico en dolares estadounidenses. */
  function formatUSD(amount) {
    var num = Number(amount);
    if (!Number.isFinite(num)) {
      return "$0";
    }
    var sign = num < 0 ? "-" : "";
    var abs = Math.abs(num);
    var formatted = Math.abs(abs - Math.round(abs)) < 1e-9
      ? String(Math.round(abs))
      : abs.toFixed(2);
    return sign + "$" + formatted;
  }

  /** Formatea una fecha ISO (YYYY-MM-DD o timestamp) en espanol legible. */
  function formatDate(isoOrDate) {
    if (!isoOrDate) { return ""; }
    var date;
    if (isoOrDate instanceof Date) {
      date = new Date(isoOrDate.getTime());
    } else if (typeof isoOrDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(isoOrDate.trim())) {
      var parts = isoOrDate.trim().split("-");
      date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]), 12, 0, 0);
    } else {
      date = new Date(isoOrDate);
    }
    if (Number.isNaN(date.getTime())) {
      return "";
    }
    try {
      return new Intl.DateTimeFormat("es-VE", {
        day: "numeric",
        month: "short",
        year: "numeric"
      }).format(date);
    } catch (_err) {
      return date.toISOString().slice(0, 10);
    }
  }

  var CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  /** Genera un codigo unico tipo PREFIX-XXXXXX evitando colisiones. */
  function generateCode(prefix, existingCodes, randomFn) {
    var cleanPrefix = String(prefix || "AMI").trim().toUpperCase() || "AMI";
    var rng = typeof randomFn === "function" ? randomFn : Math.random;
    var used = {};

    if (existingCodes) {
      if (typeof existingCodes.forEach === "function") {
        existingCodes.forEach(function (c) {
          if (c != null) { used[String(c).toUpperCase()] = true; }
        });
      }
    }

    var attempt, i, token, code;
    for (attempt = 0; attempt < 100; attempt++) {
      token = "";
      for (i = 0; i < 6; i++) {
        var r = rng();
        var idx = Math.floor((Number.isFinite(r) ? Math.max(0, Math.min(0.999999, r)) : Math.random()) * CODE_ALPHABET.length);
        token += CODE_ALPHABET.charAt(idx);
      }
      code = cleanPrefix + "-" + token;
      if (!used[code]) {
        return code;
      }
    }

    // Respaldo determinista si un generador de prueba agota las colisiones
    var counter = 1;
    do {
      var suffix = String(counter).toUpperCase();
      while (suffix.length < 6) { suffix = "0" + suffix; }
      code = cleanPrefix + "-" + suffix.slice(-6);
      counter++;
    } while (used[code]);

    return code;
  }

  /** Copia texto al portapapeles con respaldo via textarea. */
  function copyText(text) {
    var value = String(text == null ? "" : text);
    var nav = typeof root.navigator !== "undefined" ? root.navigator : null;
    if (nav && nav.clipboard && typeof nav.clipboard.writeText === "function") {
      return Promise.resolve()
        .then(function () { return nav.clipboard.writeText(value); })
        .then(function () { return true; })
        .catch(function () { return fallbackCopy(value); });
    }
    return Promise.resolve(fallbackCopy(value));
  }

  function fallbackCopy(value) {
    if (typeof root.document === "undefined" || !root.document.createElement || !root.document.body) {
      return false;
    }
    var ta = root.document.createElement("textarea");
    ta.value = value;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    root.document.body.appendChild(ta);
    ta.select();
    var ok = false;
    try {
      ok = typeof root.document.execCommand === "function" && root.document.execCommand("copy");
    } catch (_err) {
      ok = false;
    }
    root.document.body.removeChild(ta);
    return Boolean(ok);
  }

  /** Comparte contenido con Web Share API o copia el enlace/texto como respaldo. */
  function shareContent(payload) {
    var opts = payload || {};
    var nav = typeof root.navigator !== "undefined" ? root.navigator : null;
    if (nav && typeof nav.share === "function") {
      return Promise.resolve()
        .then(function () {
          return nav.share({
            title: opts.title || "",
            text: opts.text || "",
            url: opts.url || ""
          });
        })
        .then(function () {
          return { shared: true, method: "web-share" };
        })
        .catch(function (err) {
          if (err && err.name === "AbortError") {
            return { shared: false, method: "aborted" };
          }
          return copyFallback(opts);
        });
    }
    return copyFallback(opts);
  }

  function copyFallback(opts) {
    var fallbackText = opts.url || [opts.title, opts.text].filter(Boolean).join(" - ");
    return copyText(fallbackText).then(function (ok) {
      return { shared: ok, method: ok ? "clipboard" : "unavailable" };
    });
  }

  /** Muestra un aviso temporal en #toast-region si existe en el DOM. */
  function showToast(message, type) {
    if (typeof root.document === "undefined" || !root.document.getElementById) {
      return null;
    }
    var region = root.document.getElementById("toast-region");
    if (!region) {
      return null;
    }
    var kind = type || "info";
    var toast = root.document.createElement("div");
    toast.className = "toast toast--" + kind;
    toast.setAttribute("role", kind === "error" ? "alert" : "status");
    toast.textContent = String(message == null ? "" : message);
    region.appendChild(toast);

    var remove = function () {
      if (toast.parentNode === region) {
        region.removeChild(toast);
      }
    };
    toast.addEventListener("click", remove);
    if (typeof root.setTimeout === "function") {
      root.setTimeout(remove, 3500);
    }
    return toast;
  }

  var PAYMENT_METHOD_LABELS = {
    pago_movil: "Pago móvil",
    transferencia: "Transferencia bancaria",
    zelle: "Zelle"
  };

  var api = {
    ICONOS: ICONOS,
    PAYMENT_METHOD_LABELS: PAYMENT_METHOD_LABELS,
    esc: esc,
    cap: cap,
    normalizeText: normalizeText,
    deepClone: deepClone,
    formatUSD: formatUSD,
    formatDate: formatDate,
    generateCode: generateCode,
    copyText: copyText,
    shareContent: shareContent,
    showToast: showToast
  };

  App.utils = api;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : window);
