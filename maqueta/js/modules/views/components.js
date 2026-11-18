/* Componentes compartidos de UI para las vistas de Amiuni. */
(function (root) {
  "use strict";

  var App = (root.AmiuniApp = root.AmiuniApp || {});
  var utils = App.utils || (typeof require === "function" ? require("../utils") : null);

  function esc(str) {
    return utils ? utils.esc(str) : String(str == null ? "" : str);
  }

  function cap(str) {
    return utils ? utils.cap(str) : String(str || "");
  }

  function renderFallbackMedia(animal, hidden) {
    var color = (animal && animal.color) || "#CDE7F5";
    var nombre = (animal && animal.nombre) || "Animal rescatado";
    var huella = utils ? utils.ICONOS.huella : "";
    return (
      '<div class="foto-ejemplo" style="background:' + esc(color) + ';color:#1E3A8A" role="img" aria-label="Foto de ejemplo de ' + esc(nombre) + '"' + (hidden ? " hidden" : "") + ">" +
        huella + "<small>foto de ejemplo</small>" +
      "</div>"
    );
  }

  /** Renderiza la foto real del animal con carga diferida y respaldo automatico a .foto-ejemplo. */
  function renderAnimalMedia(animal, options) {
    var opts = options || {};
    var fotos = animal && Array.isArray(animal.fotos) ? animal.fotos : [];
    var idx = Number.isInteger(opts.photoIndex) ? opts.photoIndex : 0;
    var item = fotos[idx] || fotos[0] || null;
    var url = typeof item === "string" ? item : (item && item.url ? item.url : "");
    var alt = (item && item.alt) || ("Foto de " + ((animal && animal.nombre) || "animal"));

    if (!url) {
      return renderFallbackMedia(animal, false);
    }

    var lazyAttr = opts.lazy === false ? "" : ' loading="lazy"';
    var cls = opts.className ? ' class="' + esc(opts.className) + '"' : "";
    return (
      '<img src="' + esc(url) + '" alt="' + esc(alt) + '"' + cls + lazyAttr +
      ' onerror="this.hidden=true;if(this.nextElementSibling){this.nextElementSibling.hidden=false;}">' +
      renderFallbackMedia(animal, true)
    );
  }

  /** Renderiza la insignia de estado de adopcion de un animal. */
  function renderBadge(animal) {
    var estado = (animal && animal.estado) || "disponible";
    if (estado === "adoptado") {
      return '<span class="insignia adoptado">Adoptado</span>';
    }
    if (estado === "proceso") {
      return '<span class="insignia proceso">En proceso</span>';
    }
    return '<span class="insignia">¡Adóptame!</span>';
  }

  /** Renderiza una tarjeta de animal accesible (enlace y boton de favorito hermanos). */
  function renderAnimalCard(animal, isFav) {
    if (!animal) { return ""; }
    var fav = Boolean(isFav);
    var heartIcon = utils
      ? (fav ? utils.ICONOS.corazonLleno : utils.ICONOS.corazon)
      : (fav ? "♥" : "♡");
    var favLabel = fav
      ? "Quitar a " + animal.nombre + " de favoritos"
      : "Guardar a " + animal.nombre + " en favoritos";

    return (
      '<article class="tarjeta">' +
        '<a class="tarjeta-enlace" href="#/animal/' + encodeURIComponent(animal.id) + '">' +
          '<div class="foto">' +
            renderAnimalMedia(animal, { lazy: true, className: "foto-img" }) +
            renderBadge(animal) +
          "</div>" +
          '<div class="cuerpo">' +
            "<h3>" + esc(animal.nombre) + "</h3>" +
            '<p class="meta">' + esc(cap(animal.especie)) + " · " + esc(animal.edadTexto) + " · " + esc(animal.tamano) + "</p>" +
          "</div>" +
        "</a>" +
        '<button type="button" class="btn-fav' + (fav ? " activo" : "") + '" data-fav-id="' + esc(animal.id) + '" aria-pressed="' + (fav ? "true" : "false") + '" aria-label="' + esc(favLabel) + '">' +
          heartIcon +
        "</button>" +
      "</article>"
    );
  }

  /** Renderiza las metricas de transparencia de la fundacion. */
  function renderMetrics(stats) {
    var s = stats || { adoptados: 0, enProceso: 0, atendidos: 0 };
    return (
      '<div class="metricas" aria-label="Transparencia de la fundación">' +
        '<div class="metrica"><b>' + esc(s.adoptados) + "</b><span>adopciones logradas</span></div>" +
        '<div class="metrica"><b>' + esc(s.enProceso) + "</b><span>procesos en curso</span></div>" +
        '<div class="metrica"><b>' + esc(s.atendidos) + "</b><span>animales atendidos</span></div>" +
      "</div>"
    );
  }

  var REQUEST_STATUS_META = {
    pendiente: { label: "Recibida", cls: "pendiente" },
    recibida: { label: "Recibida", cls: "pendiente" },
    en_revision: { label: "En revisión", cls: "revision" },
    aprobada: { label: "Aprobada", cls: "ok" },
    rechazada: { label: "No aprobada / Cancelada", cls: "error" }
  };

  /** Renderiza una insignia de estado para solicitudes de adopcion. */
  function renderRequestStatusBadge(estado) {
    var meta = REQUEST_STATUS_META[estado] || { label: cap(estado || "Pendiente"), cls: "pendiente" };
    return '<span class="estado-pill estado-' + esc(meta.cls) + '">' + esc(meta.label) + "</span>";
  }

  var DONATION_STATUS_META = {
    pendiente: { label: "Pendiente por verificar", cls: "pendiente" },
    verificada: { label: "Verificada", cls: "ok" },
    anulada: { label: "Anulada", cls: "error" }
  };

  /** Renderiza una insignia de estado para donaciones. */
  function renderDonationStatusBadge(estado) {
    var meta = DONATION_STATUS_META[estado] || { label: cap(estado || "Pendiente"), cls: "pendiente" };
    return '<span class="estado-pill estado-' + esc(meta.cls) + '">' + esc(meta.label) + "</span>";
  }

  /** Renderiza el bloque de progreso de la meta mensual de recaudacion. */
  function renderMetaProgress(meta, blockId) {
    var m = meta || { etiqueta: "Meta del mes", objetivo: 600, recaudado: 0, porcentaje: 0 };
    var idAttr = blockId ? ' id="' + esc(blockId) + '"' : "";
    var formattedRec = utils ? utils.formatUSD(m.recaudado) : "$" + m.recaudado;
    var formattedObj = utils ? utils.formatUSD(m.objetivo) : "$" + m.objetivo;
    return (
      '<div class="historia"' + idAttr + ">" +
        "<strong>" + esc(m.etiqueta) + "</strong>" +
        '<div class="meta-barra" role="progressbar" aria-valuemin="0" aria-valuemax="' + esc(m.objetivo) + '" aria-valuenow="' + esc(m.recaudado) + '">' +
          '<i style="width:' + esc(m.porcentaje) + '%"></i>' +
        "</div>" +
        '<span class="contador">' + esc(formattedRec) + " de " + esc(formattedObj) + " (" + esc(m.porcentaje) + " %)</span>" +
      "</div>"
    );
  }

  /** Genera etiquetas <option> a partir de pares [valor, etiqueta]. */
  function renderSelectOptions(optionsList, currentValue) {
    return (optionsList || []).map(function (pair) {
      var val = pair[0];
      var label = pair[1];
      return '<option value="' + esc(val) + '"' + (val === currentValue ? " selected" : "") + ">" + esc(label) + "</option>";
    }).join("");
  }

  var api = {
    renderAnimalMedia: renderAnimalMedia,
    renderBadge: renderBadge,
    renderAnimalCard: renderAnimalCard,
    renderMetrics: renderMetrics,
    renderRequestStatusBadge: renderRequestStatusBadge,
    renderDonationStatusBadge: renderDonationStatusBadge,
    renderMetaProgress: renderMetaProgress,
    renderSelectOptions: renderSelectOptions
  };

  App.components = api;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : window);
