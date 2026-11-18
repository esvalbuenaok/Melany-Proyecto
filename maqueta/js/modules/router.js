/* Enrutador por hash ligero compatible con navegador (file:// y http://) y pruebas en Node. */
(function (root) {
  "use strict";

  var App = (root.AmiuniApp = root.AmiuniApp || {});

  var KNOWN_ROUTES = ["inicio", "animal", "adopcion", "donar", "seguimiento", "academia", "admin"];

  function decodeSafe(s) {
    try {
      return decodeURIComponent(String(s).replace(/\+/g, " "));
    } catch (_err) {
      return String(s);
    }
  }

  /** Parsea un hash (#/ruta/param?a=1) en { name, params, query }. */
  function parseHash(hashStr) {
    var raw = String(hashStr == null ? "" : hashStr).trim();
    var withoutHash = raw.replace(/^#/, "");
    var qIndex = withoutHash.indexOf("?");
    var pathPart = qIndex === -1 ? withoutHash : withoutHash.slice(0, qIndex);
    var queryPart = qIndex === -1 ? "" : withoutHash.slice(qIndex + 1);

    var segments = pathPart
      .replace(/^\/+|\/+$/g, "")
      .split("/")
      .filter(Boolean)
      .map(decodeSafe);

    var rawName = segments.length > 0 ? segments[0] : "inicio";
    var lowerName = rawName.toLowerCase();
    var name = (lowerName === "academia" || lowerName === "academy") ? "academia" : rawName;
    var params = segments.length > 1 ? segments.slice(1) : [];
    var query = {};

    if (queryPart) {
      queryPart.split("&").forEach(function (pair) {
        if (!pair) { return; }
        var eqIdx = pair.indexOf("=");
        var key = eqIdx === -1 ? decodeSafe(pair) : decodeSafe(pair.slice(0, eqIdx));
        var val = eqIdx === -1 ? "" : decodeSafe(pair.slice(eqIdx + 1));
        if (key) {
          query[key] = val;
        }
      });
    }

    return {
      name: name,
      params: params,
      query: query
    };
  }

  function normalizeHashPath(hashPath) {
    var clean = String(hashPath == null ? "" : hashPath).trim();
    if (!clean || clean === "#" || clean === "/") {
      return "#/";
    }
    if (clean.indexOf("#") === 0) {
      clean = clean.slice(1);
    }
    if (clean.indexOf("/") !== 0) {
      clean = "/" + clean;
    }
    return "#" + clean;
  }

  function createRouter() {
    var handlers = {};
    var started = false;
    var fallbackHash = "#/";
    var onHashChange = null;

    function getCurrentHash() {
      if (root.location && typeof root.location.hash === "string") {
        return root.location.hash || "#/";
      }
      return fallbackHash;
    }

    function resolve(explicitHash) {
      var parsed = parseHash(explicitHash !== undefined ? explicitHash : getCurrentHash());
      var handler = handlers[parsed.name] || handlers.notFound;
      if (typeof handler === "function") {
        return handler(parsed);
      }
      return null;
    }

    function register(name, handler) {
      if (name && typeof handler === "function") {
        handlers[name] = handler;
      }
    }

    function navigate(hashPath) {
      var target = normalizeHashPath(hashPath);
      fallbackHash = target;
      if (root.location && typeof root.location.hash === "string") {
        var prev = root.location.hash || "#/";
        root.location.hash = target;
        if (prev === target) {
          resolve(target);
        }
      } else {
        resolve(target);
      }
      return target;
    }

    function stop() {
      if (started && onHashChange && typeof root.removeEventListener === "function") {
        root.removeEventListener("hashchange", onHashChange);
      }
      started = false;
      onHashChange = null;
    }

    function start() {
      if (!started && typeof root.addEventListener === "function") {
        onHashChange = function () { resolve(); };
        root.addEventListener("hashchange", onHashChange);
        started = true;
      }
      resolve();
      return stop;
    }

    return {
      KNOWN_ROUTES: KNOWN_ROUTES,
      parseHash: parseHash,
      register: register,
      navigate: navigate,
      start: start,
      stop: stop,
      resolve: resolve
    };
  }

  var router = createRouter();
  router.createRouter = createRouter;

  App.router = router;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = router;
  }
})(typeof globalThis !== "undefined" ? globalThis : window);
