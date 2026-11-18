/* Vista de donaciones y apadrinamientos con meta en vivo, datos de pago y comprobante DON-XXXX. */
(function (root) {
  "use strict";

  var App = (root.AmiuniApp = root.AmiuniApp || {});
  App.views = App.views || {};

  function buildPaymentCopyText(methodKey, info) {
    if (!info) { return ""; }
    if (methodKey === "pago_movil") {
      return [info.titulo, info.banco, "Tel: " + info.telefono, "RIF: " + info.rif, info.titular, info.nota].filter(Boolean).join(" | ");
    }
    if (methodKey === "transferencia") {
      return [info.titulo, info.banco, info.tipoCuenta, "Cuenta: " + info.cuenta, "RIF: " + info.rif, info.titular, info.nota].filter(Boolean).join(" | ");
    }
    if (methodKey === "zelle") {
      return [info.titulo, "Correo: " + info.correo, info.titular, info.nota].filter(Boolean).join(" | ");
    }
    return "";
  }

  function renderDonar(vista, _params, query) {
    var store = App.store;
    var utils = App.utils;
    var validators = App.validators;
    var components = App.components;
    var esc = utils.esc;

    var q = query || {};
    var preAnimalId = q.apadrinar || q.animal || "";
    var animals = store.getAnimals();
    var validPreAnimal = animals.some(function (a) { return a.id === preAnimalId; }) ? preAnimalId : "";
    var preAmount = Number(q.monto);
    var quickAmounts = ["5", "10", "20", "45"];
    var initialMontoOpt = "";
    var initialOtro = "";

    if (Number.isFinite(preAmount) && preAmount > 0) {
      var asStr = String(preAmount);
      if (quickAmounts.indexOf(asStr) !== -1) {
        initialMontoOpt = asStr;
      } else {
        initialMontoOpt = "otro";
        initialOtro = asStr;
      }
    } else if (validPreAnimal) {
      var targetAnimal = store.getAnimalById(validPreAnimal);
      if (targetAnimal && Number(targetAnimal.apadrinamientoMensual) > 0) {
        var apStr = String(targetAnimal.apadrinamientoMensual);
        if (quickAmounts.indexOf(apStr) !== -1) {
          initialMontoOpt = apStr;
        } else {
          initialMontoOpt = "otro";
          initialOtro = apStr;
        }
      }
    }

    var draft = {
      montoOpt: initialMontoOpt,
      otro: initialOtro,
      metodo: "pago_movil",
      referencia: "",
      padrino: Boolean(q.apadrinar || validPreAnimal),
      animalId: validPreAnimal,
      anonimo: false,
      donanteNombre: "",
      donanteCorreo: "",
      mensaje: "",
      comprobante: null
    };

    function getCurrentAmount() {
      return draft.montoOpt === "otro" ? Number(draft.otro) : Number(draft.montoOpt);
    }

    function renderPaymentDetails(methodKey, methods) {
      var info = methods && methods[methodKey];
      if (!info) { return ""; }
      var rows = [];
      if (info.banco) { rows.push("<div><dt>Banco</dt><dd>" + esc(info.banco) + "</dd></div>"); }
      if (info.tipoCuenta) { rows.push("<div><dt>Tipo</dt><dd>" + esc(info.tipoCuenta) + "</dd></div>"); }
      if (info.telefono) { rows.push("<div><dt>Teléfono</dt><dd>" + esc(info.telefono) + "</dd></div>"); }
      if (info.cuenta) { rows.push("<div><dt>Cuenta</dt><dd>" + esc(info.cuenta) + "</dd></div>"); }
      if (info.rif) { rows.push("<div><dt>RIF</dt><dd>" + esc(info.rif) + "</dd></div>"); }
      if (info.correo) { rows.push("<div><dt>Correo</dt><dd>" + esc(info.correo) + "</dd></div>"); }
      if (info.titular) { rows.push("<div><dt>Titular</dt><dd>" + esc(info.titular) + "</dd></div>"); }
      if (info.nota) { rows.push("<div><dt>Nota</dt><dd>" + esc(info.nota) + "</dd></div>"); }

      return (
        '<div class="pago-detalle" id="pago-detalle">' +
          '<div class="pago-detalle-cabecera">' +
            "<strong>Datos para " + esc(info.titulo || utils.PAYMENT_METHOD_LABELS[methodKey] || methodKey) + "</strong>" +
            '<button type="button" class="btn btn-sec btn-compacto" id="btn-copiar-pago">' + utils.ICONOS.copiar + " Copiar datos</button>" +
          "</div>" +
          '<dl class="resumen">' + rows.join("") + "</dl>" +
        "</div>"
      );
    }

    function renderDonationsAndTestimonials() {
      var donations = store.getDonations();
      var baseTestimonials = store.getTestimonials();
      var dynamicTestimonials = donations
        .filter(function (d) { return d.estado !== "anulada" && d.mensaje; })
        .map(function (d) {
          return {
            texto: d.mensaje,
            autor: d.donanteNombre || "Donante anónimo",
            fecha: d.fechaCreacion
          };
        });
      var allTestimonials = dynamicTestimonials.concat(baseTestimonials);

      var donationsHtml = donations.length
        ? '<ul class="lista-registros">' + donations.slice(0, 8).map(function (d) {
            var animalObj = d.animalId ? store.getAnimalById(d.animalId) : null;
            return (
              '<li class="registro-item">' +
                '<div>' +
                  "<strong>" + esc(utils.formatUSD(d.monto)) + "</strong> · " + esc(d.donanteNombre) +
                  (d.padrino ? " · Apadrinamiento" + (animalObj ? " (" + esc(animalObj.nombre) + ")" : "") : "") +
                  '<div class="registro-sub">' + esc(utils.PAYMENT_METHOD_LABELS[d.metodo] || d.metodo) + " · Ref: " + esc(d.referencia) + " · " + esc(utils.formatDate(d.fechaCreacion)) + "</div>" +
                "</div>" +
                '<div class="registro-acciones">' +
                  components.renderDonationStatusBadge(d.estado) +
                  '<a class="btn-texto" href="#/seguimiento/' + encodeURIComponent(d.codigo) + '">' + esc(d.codigo) + "</a>" +
                "</div>" +
              "</li>"
            );
          }).join("") + "</ul>"
        : '<p class="aviso">Aún no hay aportes registrados en esta sesión. ¡Tu aporte será el primero!</p>';

      var testimonialsHtml = allTestimonials.map(function (t) {
        return (
          '<blockquote class="testimonio testimonio-flush">' +
            esc(t.texto) +
            "<cite>" + esc(t.autor) + (t.fecha ? " · " + esc(utils.formatDate(t.fecha)) : "") + "</cite>" +
          "</blockquote>"
        );
      }).join("");

      return (
        '<section class="donar-comunidad">' +
          "<h2>Aportes recientes</h2>" +
          donationsHtml +
          '<h2 class="mt-lg">Lo que dicen quienes ya ayudaron</h2>' +
          testimonialsHtml +
        "</section>"
      );
    }

    function renderReceipt() {
      var don = draft.comprobante;
      var meta = store.getMeta();
      var animalObj = don.animalId ? store.getAnimalById(don.animalId) : null;

      vista.innerHTML =
        '<section class="pantalla reticula">' +
          '<div class="panel">' +
            '<div class="confirmacion comprobante">' +
              utils.ICONOS.ok +
              "<h1>¡Gracias por tu aporte!</h1>" +
              "<p>Registramos tu donación y actualizamos la meta de la fundación.</p>" +
              '<div class="codigo-caja">' +
                "<span>Código de comprobante</span>" +
                "<strong>" + esc(don.codigo) + "</strong>" +
                '<button type="button" class="btn btn-sec btn-compacto" id="btn-copiar-don">' + utils.ICONOS.copiar + " Copiar código</button>" +
              "</div>" +
              '<dl class="resumen">' +
                "<div><dt>Monto</dt><dd>" + esc(utils.formatUSD(don.monto)) + "</dd></div>" +
                "<div><dt>Medio de pago</dt><dd>" + esc(utils.PAYMENT_METHOD_LABELS[don.metodo] || don.metodo) + "</dd></div>" +
                "<div><dt>Referencia</dt><dd>" + esc(don.referencia) + "</dd></div>" +
                "<div><dt>Donante</dt><dd>" + esc(don.donanteNombre) + "</dd></div>" +
                (don.padrino ? "<div><dt>Modalidad</dt><dd>Apadrinamiento mensual" + (animalObj ? " (" + esc(animalObj.nombre) + ")" : "") + "</dd></div>" : "") +
                "<div><dt>Fecha</dt><dd>" + esc(utils.formatDate(don.fechaCreacion)) + "</dd></div>" +
                "<div><dt>Estado</dt><dd>" + components.renderDonationStatusBadge(don.estado) + "</dd></div>" +
              "</dl>" +
              components.renderMetaProgress(meta, "meta-bloque") +
              '<div class="acciones no-print mt-md">' +
                '<button type="button" class="btn btn-sec" id="btn-imprimir">Imprimir comprobante</button>' +
                '<a class="btn btn-cta" href="#/seguimiento/' + encodeURIComponent(don.codigo) + '">Ver seguimiento</a>' +
              "</div>" +
              '<div class="acciones no-print mt-sm">' +
                '<button type="button" class="btn-texto" id="btn-otra-donacion">Hacer otro aporte</button>' +
                '<a class="btn-texto" href="#/">Conocer a los animales</a>' +
              "</div>" +
            "</div>" +
            renderDonationsAndTestimonials() +
          "</div>" +
        "</section>";

      vista.querySelector("#btn-copiar-don").addEventListener("click", function () {
        utils.copyText(don.codigo).then(function (ok) {
          utils.showToast(ok ? "Código " + don.codigo + " copiado." : "No se pudo copiar.", ok ? "ok" : "error");
        });
      });

      vista.querySelector("#btn-imprimir").addEventListener("click", function () {
        if (typeof root.print === "function") {
          root.print();
        }
      });

      vista.querySelector("#btn-otra-donacion").addEventListener("click", function () {
        draft.comprobante = null;
        draft.referencia = "";
        draft.mensaje = "";
        renderForm();
      });
    }

    function renderForm() {
      if (draft.comprobante) {
        renderReceipt();
        return;
      }

      var meta = store.getMeta();
      var methods = store.getPaymentMethods();
      var animalOptions = [["", "Cualquier animal que más lo necesite"]].concat(
        animals.map(function (a) {
          return [a.id, a.nombre + " (" + utils.cap(a.especie) + " · " + utils.formatUSD(a.apadrinamientoMensual || 20) + "/mes)"];
        })
      );

      vista.innerHTML =
        '<section class="pantalla reticula">' +
          '<div class="panel">' +
            "<h1>Tu aporte cambia una vida</h1>" +
            "<p>Cada dólar se destina a esterilización, alimentación y tratamientos. Mira el avance en tiempo real.</p>" +
            components.renderMetaProgress(meta, "meta-bloque") +
            '<ul class="impacto"><li><b>$5</b>una desparasitación</li><li><b>$20</b>una vacuna completa</li><li><b>$45</b>una esterilización</li></ul>' +
            '<form class="formulario" id="form-don" novalidate>' +
              '<fieldset class="campo" data-campo="monto"><legend>Elige un monto (USD)</legend><div class="montos">' +
                ["5", "10", "20", "45", "otro"].map(function (v) {
                  return '<label class="monto"><input type="radio" name="montoOpt" value="' + v + '"' + (draft.montoOpt === v ? " checked" : "") + "><span>" + (v === "otro" ? "Otro" : "$" + v) + "</span></label>";
                }).join("") +
              '</div><span class="error" aria-live="polite"></span></fieldset>' +
              '<div class="campo" id="otro-wrap"' + (draft.montoOpt === "otro" ? "" : " hidden") + ">" +
                '<label for="c-otro">Monto personalizado (USD)</label>' +
                '<input id="c-otro" name="otro" type="number" min="1" max="50000" step="1" inputmode="numeric" value="' + esc(draft.otro) + '">' +
              "</div>" +
              '<label class="opcion"><input type="checkbox" name="padrino" id="c-padrino"' + (draft.padrino ? " checked" : "") + "> Quiero apadrinar a un animal con un aporte mensual</label>" +
              '<div class="campo" id="padrino-animal-wrap"' + (draft.padrino ? "" : " hidden") + ">" +
                '<label for="c-animalId">Animal a apadrinar</label>' +
                '<select id="c-animalId" name="animalId">' + components.renderSelectOptions(animalOptions, draft.animalId) + "</select>" +
              "</div>" +
              '<fieldset class="campo opciones" data-campo="metodo"><legend>Medio de pago</legend>' +
                validators.VALID_PAYMENT_METHODS.map(function (m) {
                  var label = (methods[m] && methods[m].titulo) || utils.PAYMENT_METHOD_LABELS[m] || m;
                  return '<label class="opcion"><input type="radio" name="metodo" value="' + esc(m) + '"' + (draft.metodo === m ? " checked" : "") + "> " + esc(label) + "</label>";
                }).join("") +
                '<span class="error" aria-live="polite"></span>' +
              "</fieldset>" +
              '<div id="pago-detalle-wrap">' + renderPaymentDetails(draft.metodo, methods) + "</div>" +
              '<div class="campo" data-campo="referencia">' +
                '<label for="c-referencia">Número de referencia del pago *</label>' +
                '<input id="c-referencia" name="referencia" type="text" placeholder="Ej. PM-123456" value="' + esc(draft.referencia) + '">' +
                '<span class="error" aria-live="polite"></span>' +
              "</div>" +
              '<label class="opcion"><input type="checkbox" name="anonimo" id="c-anonimo"' + (draft.anonimo ? " checked" : "") + "> Prefiero donar de forma anónima</label>" +
              '<div class="campo" id="donante-nombre-wrap" data-campo="donanteNombre"' + (draft.anonimo ? " hidden" : "") + ">" +
                '<label for="c-donanteNombre">Tu nombre *</label>' +
                '<input id="c-donanteNombre" name="donanteNombre" type="text" autocomplete="name" value="' + esc(draft.donanteNombre) + '">' +
                '<span class="error" aria-live="polite"></span>' +
              "</div>" +
              '<div class="campo" data-campo="donanteCorreo">' +
                '<label for="c-donanteCorreo">Correo electrónico (opcional, para comprobante)</label>' +
                '<input id="c-donanteCorreo" name="donanteCorreo" type="email" autocomplete="email" value="' + esc(draft.donanteCorreo) + '">' +
                '<span class="error" aria-live="polite"></span>' +
              "</div>" +
              '<div class="campo" data-campo="mensaje">' +
                '<label for="c-mensaje">Mensaje de apoyo (opcional, se muestra en testimonios)</label>' +
                '<textarea id="c-mensaje" name="mensaje" maxlength="240" placeholder="Ej. Para que sigan rescatando en Mérida...">' + esc(draft.mensaje) + "</textarea>" +
                '<span class="error" aria-live="polite"></span>' +
              "</div>" +
              '<button type="submit" class="btn btn-cta btn-bloque" id="btn-don">Registrar aporte</button>' +
            "</form>" +
            renderDonationsAndTestimonials() +
          "</div>" +
        "</section>";

      var form = vista.querySelector("#form-don");
      var otroWrap = vista.querySelector("#otro-wrap");
      var padrinoWrap = vista.querySelector("#padrino-animal-wrap");
      var nombreWrap = vista.querySelector("#donante-nombre-wrap");
      var pagoWrap = vista.querySelector("#pago-detalle-wrap");

      function bindCopyPayment() {
        var btn = vista.querySelector("#btn-copiar-pago");
        if (!btn) { return; }
        btn.addEventListener("click", function () {
          var latestMethods = store.getPaymentMethods();
          var txt = buildPaymentCopyText(draft.metodo, latestMethods[draft.metodo]);
          utils.copyText(txt).then(function (ok) {
            utils.showToast(ok ? "Datos de pago copiados." : "No se pudo copiar.", ok ? "ok" : "error");
          });
        });
      }

      function showErrors(errors) {
        var fields = ["monto", "metodo", "referencia", "donanteNombre", "donanteCorreo", "mensaje"];
        fields.forEach(function (field) {
          var cont = form.querySelector('[data-campo="' + field + '"]');
          if (!cont) { return; }
          var msg = (errors && errors[field]) || "";
          cont.classList.toggle("invalido", Boolean(msg));
          var errEl = cont.querySelector(".error");
          if (errEl) { errEl.textContent = msg; }
        });
      }

      form.addEventListener("input", function (e) {
        var t = e.target;
        if (!t || !t.name) { return; }
        if (t.type === "checkbox") {
          draft[t.name] = t.checked;
        } else {
          draft[t.name] = t.value;
        }
        otroWrap.hidden = draft.montoOpt !== "otro";
        padrinoWrap.hidden = !draft.padrino;
        nombreWrap.hidden = draft.anonimo;
      });

      form.addEventListener("change", function (e) {
        var t = e.target;
        if (!t || !t.name) { return; }
        if (t.type === "checkbox") {
          draft[t.name] = t.checked;
        } else {
          draft[t.name] = t.value;
        }
        otroWrap.hidden = draft.montoOpt !== "otro";
        padrinoWrap.hidden = !draft.padrino;
        nombreWrap.hidden = draft.anonimo;
        if (t.name === "metodo") {
          methods = store.getPaymentMethods();
          pagoWrap.innerHTML = renderPaymentDetails(draft.metodo, methods);
          bindCopyPayment();
        }
      });

      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var payload = {
          monto: getCurrentAmount(),
          metodo: draft.metodo,
          referencia: draft.referencia,
          anonimo: draft.anonimo,
          donanteNombre: draft.donanteNombre,
          donanteCorreo: draft.donanteCorreo,
          padrino: draft.padrino,
          animalId: draft.padrino ? (draft.animalId || null) : null,
          mensaje: draft.mensaje
        };

        var check = validators.validateDonation(payload);
        if (!check.valid) {
          showErrors(check.errors);
          utils.showToast("Revisa los campos marcados antes de enviar.", "error");
          return;
        }

        var res = store.submitDonation(payload);
        if (!res.ok) {
          showErrors(res.errors);
          return;
        }

        draft.comprobante = res.donacion;
        utils.showToast("Donación " + res.donacion.codigo + " registrada.", "ok");
        renderForm();
        if (typeof root.scrollTo === "function") { root.scrollTo(0, 0); }
      });

      bindCopyPayment();
    }

    renderForm();
  }

  App.views.donar = renderDonar;
})(typeof globalThis !== "undefined" ? globalThis : window);
