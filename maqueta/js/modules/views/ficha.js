/* Vista de ficha individual del animal (#/animal/:id). */
(function (root) {
  "use strict";

  var App = (root.AmiuniApp = root.AmiuniApp || {});
  App.views = App.views || {};

  function healthItem(icon, text, ok) {
    return '<div class="modulo' + (ok ? "" : " no") + '">' + icon + (ok ? "" : '<span class="sr-only">No: </span>') + text + "</div>";
  }

  function renderCompatList(animal) {
    var comp = (animal && animal.compatibilidad) || {};
    var items = [
      { key: "ninos", label: "Niños" },
      { key: "apartamento", label: "Apartamento" },
      { key: "otrosPerros", label: "Otros perros" },
      { key: "otrosGatos", label: "Otros gatos" }
    ];
    return items.map(function (it) {
      var yes = Boolean(comp[it.key]);
      return '<span class="compat-chip ' + (yes ? "si" : "no") + '">' + (yes ? "✓ " : "✕ ") + it.label + "</span>";
    }).join("");
  }

  function renderFicha(vista, params) {
    var store = App.store;
    var utils = App.utils;
    var components = App.components;
    var esc = utils.esc;
    var cap = utils.cap;

    var id = params && params[0];
    var animal = store.getAnimalById(id);

    if (!animal) {
      vista.innerHTML =
        '<section class="pantalla"><div class="vacio"><h1>No encontramos ese animal</h1>' +
        '<p>Puede que haya sido retirado del catálogo o el enlace sea incorrecto.</p>' +
        '<a class="btn btn-cta" href="#/">Volver al catálogo</a></div></section>';
      return;
    }

    var fotos = Array.isArray(animal.fotos) ? animal.fotos : [];
    var isFav = store.isFavorite(animal.id);
    var disp = animal.estado === "disponible";
    var inProcess = animal.estado === "proceso";
    var salud = animal.salud || {};

    var thumbsHtml = "";
    if (fotos.length > 1) {
      thumbsHtml = '<div class="ficha-thumbs" role="group" aria-label="Galería de fotos de ' + esc(animal.nombre) + '">' +
        fotos.map(function (f, idx) {
          var alt = (f && f.alt) || (animal.nombre + " foto " + (idx + 1));
          return '<button type="button" class="ficha-thumb' + (idx === 0 ? " activo" : "") + '" data-foto-idx="' + idx + '" aria-label="Ver foto ' + (idx + 1) + ": " + esc(alt) + '" aria-pressed="' + (idx === 0 ? "true" : "false") + '">' +
            components.renderAnimalMedia(animal, { photoIndex: idx, lazy: true }) +
          "</button>";
        }).join("") +
      "</div>";
    }

    var ctaHtml;
    if (disp) {
      ctaHtml = '<a class="btn btn-cta" href="#/adopcion/' + encodeURIComponent(animal.id) + '">Solicitar adopción</a>';
    } else if (inProcess) {
      ctaHtml = '<span class="btn" aria-disabled="true">Ya tiene una solicitud en proceso</span>' +
        '<a class="btn btn-sec" href="#/seguimiento">Consultar seguimiento</a>';
    } else {
      ctaHtml = '<span class="btn" aria-disabled="true">¡Ya fue adoptado!</span>';
    }

    var ingresoStr = animal.fechaIngreso ? utils.formatDate(animal.fechaIngreso) : "";
    var apadStr = Number(animal.apadrinamientoMensual) > 0
      ? "Apadrinar (" + utils.formatUSD(animal.apadrinamientoMensual) + "/mes)"
      : "Apadrinar a " + animal.nombre;

    vista.innerHTML =
      '<section class="pantalla reticula">' +
        '<div class="migas"><a href="#/">← Ver todos los animales</a></div>' +
        '<article class="ficha">' +
          '<div class="ficha-galeria">' +
            '<div class="ficha-foto" id="ficha-foto-principal">' +
              components.renderAnimalMedia(animal, { photoIndex: 0, lazy: false }) +
              components.renderBadge(animal) +
            "</div>" +
            thumbsHtml +
          "</div>" +
          '<div class="ficha-detalle">' +
            '<div class="ficha-cabecera">' +
              "<div>" +
                "<h1>" + esc(animal.nombre) + "</h1>" +
                '<p class="datos-basicos">' + esc(cap(animal.especie)) + " · " + esc(animal.sexo) + " · " + esc(animal.edadTexto) + " · " + esc(animal.tamano) +
                  (ingresoStr ? " · Ingreso: " + esc(ingresoStr) : "") +
                "</p>" +
              "</div>" +
              '<div class="ficha-acciones-top">' +
                '<button type="button" class="btn btn-sec btn-compacto' + (isFav ? " activo" : "") + '" id="ficha-fav" aria-pressed="' + (isFav ? "true" : "false") + '">' +
                  (isFav ? utils.ICONOS.corazonLleno : utils.ICONOS.corazon) +
                  "<span>" + (isFav ? "En favoritos" : "Favorito") + "</span>" +
                "</button>" +
                '<button type="button" class="btn btn-sec btn-compacto" id="ficha-compartir">' +
                  utils.ICONOS.compartir +
                  "<span>Compartir</span>" +
                "</button>" +
              "</div>" +
            "</div>" +
            '<div class="modulos" aria-label="Ficha médica">' +
              healthItem(utils.ICONOS.jeringa, salud.vacunas ? "Vacunas al día" : "Vacunas pendientes", Boolean(salud.vacunas)) +
              healthItem(utils.ICONOS.huella, salud.esterilizado ? "Esterilizado/a" : "Sin esterilizar", Boolean(salud.esterilizado)) +
              healthItem(utils.ICONOS.corazon, salud.desparasitado ? "Desparasitado/a" : "Desparasitación pendiente", Boolean(salud.desparasitado)) +
            "</div>" +
            "<h2>Compatibilidad y temperamento</h2>" +
            '<div class="compat-grid">' + renderCompatList(animal) + "</div>" +
            '<ul class="etiquetas">' + (animal.etiquetas || []).map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("") + "</ul>" +
            '<div class="historia"><h2>Mi historia</h2><p>' + esc(animal.historia) + "</p></div>" +
            '<div class="ficha-apadrinar">' +
              '<a class="btn btn-sec btn-bloque" href="#/donar?apadrinar=' + encodeURIComponent(animal.id) + '">' + esc(apadStr) + "</a>" +
            "</div>" +
            '<div class="barra-cta">' + ctaHtml + "</div>" +
          "</div>" +
        "</article>" +
      "</section>";

    var mainFotoEl = vista.querySelector("#ficha-foto-principal");
    var thumbBtns = vista.querySelectorAll("[data-foto-idx]");
    for (var i = 0; i < thumbBtns.length; i++) {
      thumbBtns[i].addEventListener("click", function () {
        var idx = Number(this.getAttribute("data-foto-idx"));
        mainFotoEl.innerHTML = components.renderAnimalMedia(animal, { photoIndex: idx, lazy: false }) + components.renderBadge(animal);
        for (var j = 0; j < thumbBtns.length; j++) {
          var active = j === idx;
          thumbBtns[j].classList.toggle("activo", active);
          thumbBtns[j].setAttribute("aria-pressed", active ? "true" : "false");
        }
      });
    }

    var favBtn = vista.querySelector("#ficha-fav");
    favBtn.addEventListener("click", function () {
      var nowFav = store.toggleFavorite(animal.id);
      favBtn.classList.toggle("activo", nowFav);
      favBtn.setAttribute("aria-pressed", nowFav ? "true" : "false");
      favBtn.innerHTML = (nowFav ? utils.ICONOS.corazonLleno : utils.ICONOS.corazon) +
        "<span>" + (nowFav ? "En favoritos" : "Favorito") + "</span>";
      utils.showToast(nowFav ? animal.nombre + " guardado en favoritos." : animal.nombre + " quitado de favoritos.", "info");
    });

    var shareBtn = vista.querySelector("#ficha-compartir");
    shareBtn.addEventListener("click", function () {
      var url = (root.location && root.location.href) ? root.location.href : "#/animal/" + animal.id;
      utils.shareContent({
        title: "Adopta a " + animal.nombre + " en Amiuni",
        text: animal.nombre + " (" + cap(animal.especie) + ", " + animal.edadTexto + ") busca hogar.",
        url: url
      }).then(function (res) {
        if (res.method === "clipboard") {
          utils.showToast("Enlace de " + animal.nombre + " copiado al portapapeles.", "ok");
        } else if (res.shared) {
          utils.showToast("Ficha compartida.", "ok");
        }
      });
    });
  }

  App.views.ficha = renderFicha;
})(typeof globalThis !== "undefined" ? globalThis : window);
