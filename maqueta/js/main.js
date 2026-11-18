/* Punto de entrada de la aplicacion Amiuni: inicializa store, registra rutas y coordina vistas. */
(function (root) {
  "use strict";

  var App = (root.AmiuniApp = root.AmiuniApp || {});
  var doc = root.document;

  if (!doc) { return; }

  var vista = doc.getElementById("vista");
  var navLinks = doc.querySelectorAll(".nav a[data-ruta]");
  var brandEl = doc.querySelector(".marca");
  var brandTextEl = doc.querySelector('[data-site="nombreMarca"]');
  var academiaNavEl = doc.querySelector('.nav a[data-ruta="academia"]');
  var footerSubEl = doc.querySelector('[data-site="subtituloPie"]');
  var footerAvisoEl = doc.querySelector('[data-site="avisoPie"]');
  var footerContactEl = doc.querySelector('[data-site="contactoPie"]');
  var activeCleanup = null;
  var currentRouteName = "inicio";

  function applySiteChrome(siteConfig) {
    var cfg = siteConfig || (App.store && typeof App.store.getSiteConfig === "function" ? App.store.getSiteConfig() : {});
    var brand = cfg.nombreMarca || "Amiuni";
    var academiaName = cfg.academiaNavNombre || "Academia";

    if (brandTextEl) {
      brandTextEl.textContent = brand;
    }
    if (brandEl) {
      brandEl.setAttribute("aria-label", brand + ", ir al inicio");
    }
    if (academiaNavEl) {
      academiaNavEl.textContent = academiaName;
    }
    if (footerSubEl) {
      footerSubEl.textContent = cfg.subtituloPie || "";
    }
    if (footerAvisoEl) {
      footerAvisoEl.textContent = cfg.avisoPie || "";
    }
    if (footerContactEl) {
      var contactParts = [];
      if (cfg.whatsappContacto) { contactParts.push("WhatsApp: " + cfg.whatsappContacto); }
      if (cfg.correoContacto) { contactParts.push("Correo: " + cfg.correoContacto); }
      footerContactEl.textContent = contactParts.join(" · ");
      footerContactEl.hidden = contactParts.length === 0;
    }

    doc.title = currentRouteName === "academia"
      ? (brand + " · " + academiaName)
      : (brand + " · Adopta y dona");
  }

  function setActiveNav(routeName) {
    var active = routeName === "animal" || routeName === "adopcion" ? "inicio" : routeName;
    for (var i = 0; i < navLinks.length; i++) {
      var link = navLinks[i];
      if (link.getAttribute("data-ruta") === active) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    }
  }

  function renderNotFound() {
    vista.innerHTML =
      '<section class="pantalla">' +
        '<div class="vacio">' +
          "<h1>No encontramos esa página</h1>" +
          "<p>Verifica el enlace o regresa al inicio para conocer a nuestros animales.</p>" +
          '<a class="btn btn-cta" href="#/">Volver al inicio</a>' +
        "</div>" +
      "</section>";
  }

  function runView(routeName, renderer, parsed) {
    if (typeof activeCleanup === "function") {
      try {
        activeCleanup();
      } catch (_err) {
        // Ignora errores de limpieza de vista anterior
      }
      activeCleanup = null;
    }

    currentRouteName = routeName;
    setActiveNav(routeName);
    applySiteChrome();
    if (typeof renderer === "function") {
      var maybeCleanup = renderer(vista, parsed.params || [], parsed.query || {});
      if (typeof maybeCleanup === "function") {
        activeCleanup = maybeCleanup;
      }
    } else {
      renderNotFound();
    }

    if (typeof root.scrollTo === "function") {
      root.scrollTo(0, 0);
    }
  }

  function bootstrap() {
    App.store.init();
    applySiteChrome(App.store.getSiteConfig());
    App.store.subscribe(function (snapshot) {
      applySiteChrome(snapshot && snapshot.sitio ? snapshot.sitio : App.store.getSiteConfig());
    });

    var router = App.router;
    var views = App.views || {};

    router.register("inicio", function (parsed) { runView("inicio", views.inicio, parsed); });
    router.register("animal", function (parsed) { runView("animal", views.ficha, parsed); });
    router.register("adopcion", function (parsed) { runView("adopcion", views.adopcion, parsed); });
    router.register("donar", function (parsed) { runView("donar", views.donar, parsed); });
    router.register("seguimiento", function (parsed) { runView("seguimiento", views.seguimiento, parsed); });
    router.register("academia", function (parsed) { runView("academia", views.academia, parsed); });
    router.register("admin", function (parsed) { runView("admin", views.admin, parsed); });
    router.register("notFound", function () {
      runView("notFound", renderNotFound, { params: [], query: {} });
    });

    router.start();
  }

  bootstrap();
})(typeof globalThis !== "undefined" ? globalThis : window);
