/* Vista de seguimiento de solicitudes de adopcion (AMI-XXXX) y donaciones (DON-XXXX). */
(function (root) {
  "use strict";

  var App = (root.AmiuniApp = root.AmiuniApp || {});
  App.views = App.views || {};

  function renderRequestStages(estado) {
    var st = estado || "pendiente";
    var isRejected = st === "rechazada";
    var activeIdx = 0;
    if (st === "en_revision") {
      activeIdx = 1;
    } else if (st === "aprobada" || st === "rechazada") {
      activeIdx = 2;
    }

    var stages = [
      "1. Recibida",
      "2. En revisión",
      isRejected ? "3. No aprobada / Cancelada" : "3. Aprobada"
    ];

    return (
      '<ol class="pasos" aria-label="Etapas de la solicitud">' +
        stages.map(function (label, idx) {
          var cls = "";
          if (idx < activeIdx) {
            cls = "hecho";
          } else if (idx === activeIdx) {
            cls = isRejected ? "actual rechazada" : "actual";
          }
          return '<li class="' + cls + '"' + (idx === activeIdx ? ' aria-current="step"' : "") + ">" + label + "</li>";
        }).join("") +
      "</ol>"
    );
  }

  function renderRequestDetail(req, store, utils, components) {
    var esc = utils.esc;
    var animal = req.animalId ? store.getAnimalById(req.animalId) : null;
    var canCancel = req.estado === "pendiente" || req.estado === "recibida" || req.estado === "en_revision";

    return (
      '<article class="panel seguimiento-detalle">' +
        '<div class="seguimiento-cabecera">' +
          "<div>" +
            '<span class="tangram-kicker">Solicitud de adopción</span>' +
            "<h2>" + esc(req.codigo) + "</h2>" +
          "</div>" +
          components.renderRequestStatusBadge(req.estado) +
        "</div>" +
        renderRequestStages(req.estado) +
        '<dl class="resumen">' +
          "<div><dt>Animal</dt><dd>" +
            (animal
              ? '<a href="#/animal/' + encodeURIComponent(animal.id) + '">' + esc(animal.nombre) + "</a>"
              : esc(req.animalNombre || req.animalId)) +
          "</dd></div>" +
          "<div><dt>Solicitante</dt><dd>" + esc((req.solicitante && req.solicitante.nombre) || "") + "</dd></div>" +
          "<div><dt>Teléfono</dt><dd>" + esc((req.solicitante && req.solicitante.telefono) || "") + "</dd></div>" +
          "<div><dt>Correo</dt><dd>" + esc((req.solicitante && req.solicitante.correo) || "") + "</dd></div>" +
          "<div><dt>Vivienda</dt><dd>" + esc((req.hogar && req.hogar.vivienda) || "") + "</dd></div>" +
          "<div><dt>Nota de la fundación</dt><dd>" + esc(req.notaAdmin || "Sin observaciones por ahora.") + "</dd></div>" +
        "</dl>" +
        '<div class="historial">' +
          "<h3>Historial de estados</h3>" +
          '<ul class="lista-historial">' +
            "<li><strong>Recibida:</strong> " + esc(utils.formatDate(req.fechaCreacion)) + "</li>" +
            "<li><strong>Última actualización:</strong> " + esc(utils.formatDate(req.fechaActualizacion)) + " · " + components.renderRequestStatusBadge(req.estado) + "</li>" +
          "</ul>" +
        "</div>" +
        '<div class="acciones">' +
          '<button type="button" class="btn btn-sec" id="btn-copiar-seg" data-copy="' + esc(req.codigo) + '">' + utils.ICONOS.copiar + " Copiar código</button>" +
          (canCancel ? '<button type="button" class="btn btn-peligro" id="btn-cancelar-sol" data-cancel-code="' + esc(req.codigo) + '">Cancelar solicitud</button>' : "") +
        "</div>" +
      "</article>"
    );
  }

  function renderDonationDetail(don, store, utils, components) {
    var esc = utils.esc;
    var animal = don.animalId ? store.getAnimalById(don.animalId) : null;

    return (
      '<article class="panel seguimiento-detalle">' +
        '<div class="seguimiento-cabecera">' +
          "<div>" +
            '<span class="tangram-kicker">Comprobante de donación</span>' +
            "<h2>" + esc(don.codigo) + "</h2>" +
          "</div>" +
          components.renderDonationStatusBadge(don.estado) +
        "</div>" +
        '<dl class="resumen">' +
          "<div><dt>Monto</dt><dd>" + esc(utils.formatUSD(don.monto)) + "</dd></div>" +
          "<div><dt>Medio de pago</dt><dd>" + esc(utils.PAYMENT_METHOD_LABELS[don.metodo] || don.metodo) + "</dd></div>" +
          "<div><dt>Referencia</dt><dd>" + esc(don.referencia) + "</dd></div>" +
          "<div><dt>Donante</dt><dd>" + esc(don.donanteNombre) + "</dd></div>" +
          (don.padrino ? "<div><dt>Modalidad</dt><dd>Apadrinamiento mensual" + (animal ? " (" + esc(animal.nombre) + ")" : "") + "</dd></div>" : "") +
          (don.mensaje ? "<div><dt>Mensaje</dt><dd>" + esc(don.mensaje) + "</dd></div>" : "") +
          "<div><dt>Nota de la fundación</dt><dd>" + esc(don.notaAdmin || "Sin observaciones por ahora.") + "</dd></div>" +
          "<div><dt>Fecha de registro</dt><dd>" + esc(utils.formatDate(don.fechaCreacion)) + "</dd></div>" +
          "<div><dt>Última actualización</dt><dd>" + esc(utils.formatDate(don.fechaActualizacion)) + "</dd></div>" +
        "</dl>" +
        '<div class="acciones mt-md">' +
          '<button type="button" class="btn btn-sec" id="btn-copiar-seg" data-copy="' + esc(don.codigo) + '">' + utils.ICONOS.copiar + " Copiar código</button>" +
        "</div>" +
      "</article>"
    );
  }

  function renderSeguimiento(vista, params) {
    var store = App.store;
    var utils = App.utils;
    var validators = App.validators;
    var components = App.components;
    var router = App.router;
    var esc = utils.esc;

    var rawParamCode = (params && params[0]) ? String(params[0]).trim() : "";
    var currentCode = rawParamCode ? rawParamCode.toUpperCase() : "";
    var lookupError = "";
    var resultHtml = "";

    if (currentCode) {
      var check = validators.validateTrackingCode(currentCode);
      if (!check.valid) {
        lookupError = check.error;
      } else {
        currentCode = check.code;
        var req = store.getRequestByCode(currentCode);
        var don = !req ? store.getDonationByCode(currentCode) : null;

        if (req) {
          resultHtml = renderRequestDetail(req, store, utils, components);
        } else if (don) {
          resultHtml = renderDonationDetail(don, store, utils, components);
        } else {
          resultHtml =
            '<div class="panel vacio">' +
              "<h2>No encontramos el código " + esc(currentCode) + "</h2>" +
              "<p>Verifica que esté bien escrito. En esta maqueta se consultan las solicitudes y donaciones guardadas en este navegador.</p>" +
            "</div>";
        }
      }
    }

    var requests = store.getRequests();
    var donations = store.getDonations();
    var stats = store.getStats();

    var requestsListHtml = requests.length
      ? '<ul class="lista-registros">' + requests.map(function (r) {
          return (
            '<li class="registro-item">' +
              "<div><strong>" + esc(r.codigo) + "</strong> · " + esc(r.animalNombre || r.animalId) +
                '<div class="registro-sub">' + esc((r.solicitante && r.solicitante.nombre) || "") + " · " + esc(utils.formatDate(r.fechaCreacion)) + "</div>" +
              "</div>" +
              '<div class="registro-acciones">' +
                components.renderRequestStatusBadge(r.estado) +
                '<a class="btn-texto" href="#/seguimiento/' + encodeURIComponent(r.codigo) + '">Consultar</a>' +
              "</div>" +
            "</li>"
          );
        }).join("") + "</ul>"
      : '<p class="aviso">Aún no has enviado solicitudes de adopción desde este navegador.</p>';

    var donationsListHtml = donations.length
      ? '<ul class="lista-registros">' + donations.map(function (d) {
          return (
            '<li class="registro-item">' +
              "<div><strong>" + esc(d.codigo) + "</strong> · " + esc(utils.formatUSD(d.monto)) +
                '<div class="registro-sub">' + esc(d.donanteNombre) + " · " + esc(utils.formatDate(d.fechaCreacion)) + "</div>" +
              "</div>" +
              '<div class="registro-acciones">' +
                components.renderDonationStatusBadge(d.estado) +
                '<a class="btn-texto" href="#/seguimiento/' + encodeURIComponent(d.codigo) + '">Consultar</a>' +
              "</div>" +
            "</li>"
          );
        }).join("") + "</ul>"
      : '<p class="aviso">Aún no has registrado donaciones desde este navegador.</p>';

    vista.innerHTML =
      '<section class="pantalla reticula">' +
        '<div class="panel">' +
          "<h1>Seguimiento de solicitudes y aportes</h1>" +
          "<p>Ingresa tu código <strong>AMI-XXXXXX</strong> o <strong>DON-XXXXXX</strong> para conocer el estado actualizado.</p>" +
          '<form class="form-seguimiento" id="form-seguimiento" novalidate>' +
            '<div class="campo campo-grow' + (lookupError ? " invalido" : "") + '">' +
              '<label for="c-codigo">Código de seguimiento</label>' +
              '<input id="c-codigo" name="codigo" type="text" placeholder="Ej. AMI-123456 o DON-123456" value="' + esc(currentCode) + '">' +
              '<span class="error" aria-live="polite">' + esc(lookupError) + "</span>" +
            "</div>" +
            '<button type="submit" class="btn btn-cta">Buscar</button>' +
          "</form>" +
        "</div>" +
        resultHtml +
        '<div class="panel">' +
          "<h2>Tus solicitudes registradas en este dispositivo</h2>" +
          requestsListHtml +
          '<h2 class="mt-lg">Tus aportes registrados en este dispositivo</h2>' +
          donationsListHtml +
        "</div>" +
        components.renderMetrics(stats) +
      "</section>";

    var form = vista.querySelector("#form-seguimiento");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var codeInput = form.elements.codigo.value;
      var checkRes = validators.validateTrackingCode(codeInput);
      if (!checkRes.valid) {
        var fieldWrap = form.querySelector(".campo");
        fieldWrap.classList.add("invalido");
        fieldWrap.querySelector(".error").textContent = checkRes.error;
        return;
      }
      router.navigate("#/seguimiento/" + encodeURIComponent(checkRes.code));
    });

    var copyBtn = vista.querySelector("#btn-copiar-seg");
    if (copyBtn) {
      copyBtn.addEventListener("click", function () {
        var code = this.getAttribute("data-copy");
        utils.copyText(code).then(function (ok) {
          utils.showToast(ok ? "Código " + code + " copiado." : "No se pudo copiar.", ok ? "ok" : "error");
        });
      });
    }

    var cancelBtn = vista.querySelector("#btn-cancelar-sol");
    if (cancelBtn) {
      cancelBtn.addEventListener("click", function () {
        var code = this.getAttribute("data-cancel-code");
        var res = store.updateRequestStatus(code, "rechazada", "Cancelada por el solicitante");
        if (res.ok) {
          utils.showToast("Solicitud " + code + " cancelada.", "info");
          renderSeguimiento(vista, [code]);
        } else {
          utils.showToast(res.error || "No se pudo cancelar la solicitud.", "error");
        }
      });
    }
  }

  App.views.seguimiento = renderSeguimiento;
})(typeof globalThis !== "undefined" ? globalThis : window);
