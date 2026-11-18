/* Vista de adopcion: wizard de 3 pasos con borrador persistente y codigo de seguimiento AMI-XXXX. */
(function (root) {
  "use strict";

  var App = (root.AmiuniApp = root.AmiuniApp || {});
  App.views = App.views || {};

  function renderAdopcion(vista, params) {
    var store = App.store;
    var utils = App.utils;
    var validators = App.validators;
    var esc = utils.esc;

    var id = params && params[0];
    var animal = store.getAnimalById(id);

    if (!animal) {
      vista.innerHTML =
        '<section class="pantalla"><div class="vacio"><h1>Animal no encontrado</h1>' +
        '<a class="btn btn-cta" href="#/">Volver al catálogo</a></div></section>';
      return;
    }

    if (animal.estado !== "disponible") {
      vista.innerHTML =
        '<section class="pantalla"><div class="panel vacio">' +
        "<h1>" + esc(animal.nombre) + " no está disponible para nuevas solicitudes</h1>" +
        "<p>Actualmente su estado es <strong>" + esc(animal.estado === "proceso" ? "En proceso de adopción" : "Adoptado") + "</strong>.</p>" +
        '<div class="acciones acciones-centro">' +
          '<a class="btn btn-sec" href="#/animal/' + encodeURIComponent(animal.id) + '">Volver a su ficha</a>' +
          '<a class="btn btn-cta" href="#/seguimiento">Consultar seguimiento</a>' +
        "</div></div></section>";
      return;
    }

    var savedDraft = store.getAdoptionDraft(animal.id);
    var state = {
      paso: savedDraft && Number.isInteger(savedDraft.paso) ? Math.max(0, Math.min(2, savedDraft.paso)) : 0,
      datos: (savedDraft && savedDraft.datos) ? Object.assign({}, savedDraft.datos) : {},
      solicitud: null
    };

    function persistDraft() {
      store.saveAdoptionDraft(animal.id, { paso: state.paso, datos: state.datos });
    }

    function textInput(name, label, type, autoComplete) {
      var val = state.datos[name] || "";
      return (
        '<div class="campo" data-campo="' + name + '">' +
          '<label for="c-' + name + '">' + label + "</label>" +
          '<input id="c-' + name + '" name="' + name + '" type="' + type + '" value="' + esc(val) + '" autocomplete="' + (autoComplete || "off") + '">' +
          '<span class="error" aria-live="polite"></span>' +
        "</div>"
      );
    }

    function radioGroup(name, legend, optionsList) {
      return (
        '<fieldset class="campo opciones" data-campo="' + name + '">' +
          "<legend>" + legend + "</legend>" +
          optionsList.map(function (opt) {
            return '<label class="opcion"><input type="radio" name="' + name + '" value="' + esc(opt) + '"' + (state.datos[name] === opt ? " checked" : "") + "> " + esc(opt) + "</label>";
          }).join("") +
          '<span class="error" aria-live="polite"></span>' +
        "</fieldset>"
      );
    }

    function renderConfirmation() {
      var sol = state.solicitud;
      var firstName = String((sol.solicitante && sol.solicitante.nombre) || "").split(" ")[0] || "amigo/a";
      vista.innerHTML =
        '<section class="pantalla reticula">' +
          '<div class="panel confirmacion">' +
            utils.ICONOS.ok +
            "<h1>¡Solicitud enviada!</h1>" +
            "<p>Gracias, " + esc(firstName) + ". Registramos tu solicitud para adoptar a <strong>" + esc(animal.nombre) + "</strong>.</p>" +
            '<div class="codigo-caja">' +
              "<span>Tu código de seguimiento</span>" +
              '<strong id="codigo-solicitud">' + esc(sol.codigo) + "</strong>" +
              '<button type="button" class="btn btn-sec btn-compacto" id="btn-copiar-codigo">' + utils.ICONOS.copiar + " Copiar código</button>" +
            "</div>" +
            '<p class="aviso">Guarda este código para revisar el estado de tu solicitud o cancelarla si lo necesitas.</p>' +
            '<div class="acciones acciones-centro">' +
              '<a class="btn btn-cta" href="#/seguimiento/' + encodeURIComponent(sol.codigo) + '">Ver seguimiento</a>' +
              '<a class="btn btn-sec" href="#/">Ver más animales</a>' +
            "</div>" +
          "</div>" +
        "</section>";

      var copyBtn = vista.querySelector("#btn-copiar-codigo");
      copyBtn.addEventListener("click", function () {
        utils.copyText(sol.codigo).then(function (ok) {
          utils.showToast(ok ? "Código " + sol.codigo + " copiado." : "No se pudo copiar automáticamente.", ok ? "ok" : "error");
        });
      });
    }

    function renderStep() {
      if (state.solicitud) {
        renderConfirmation();
        return;
      }

      var p = state.paso;
      var bodyHtml = "";

      if (p === 0) {
        bodyHtml =
          textInput("nombre", "Nombre y apellido", "text", "name") +
          textInput("telefono", "Teléfono (WhatsApp)", "tel", "tel") +
          textInput("correo", "Correo electrónico", "email", "email");
      } else if (p === 1) {
        bodyHtml =
          radioGroup("vivienda", "¿Dónde vivirá?", ["Casa con patio", "Casa sin patio", "Apartamento"]) +
          radioGroup("otros", "¿Tienes otros animales?", ["Sí", "No"]) +
          radioGroup("ninos", "¿Hay niños en casa?", ["Sí", "No"]) +
          '<div class="campo" data-campo="motivo">' +
            '<label for="c-motivo">¿Por qué quieres adoptar a ' + esc(animal.nombre) + "?</label>" +
            '<textarea id="c-motivo" name="motivo">' + esc(state.datos.motivo || "") + "</textarea>" +
            '<span class="error" aria-live="polite"></span>' +
          "</div>";
      } else {
        var d = state.datos;
        bodyHtml =
          '<div class="resumen-bloque">' +
            '<div class="resumen-cabecera"><h2>Tus datos</h2><button type="button" class="btn-texto" data-edit-step="0">Editar datos</button></div>' +
            '<dl class="resumen">' +
              "<div><dt>Animal</dt><dd>" + esc(animal.nombre) + "</dd></div>" +
              "<div><dt>Nombre</dt><dd>" + esc(d.nombre) + "</dd></div>" +
              "<div><dt>Teléfono</dt><dd>" + esc(d.telefono) + "</dd></div>" +
              "<div><dt>Correo</dt><dd>" + esc(d.correo) + "</dd></div>" +
            "</dl>" +
          "</div>" +
          '<div class="resumen-bloque">' +
            '<div class="resumen-cabecera"><h2>Tu hogar</h2><button type="button" class="btn-texto" data-edit-step="1">Editar hogar</button></div>' +
            '<dl class="resumen">' +
              "<div><dt>Vivienda</dt><dd>" + esc(d.vivienda) + "</dd></div>" +
              "<div><dt>Otros animales</dt><dd>" + esc(d.otros) + "</dd></div>" +
              "<div><dt>Niños</dt><dd>" + esc(d.ninos) + "</dd></div>" +
              "<div><dt>Motivo</dt><dd>" + esc(d.motivo) + "</dd></div>" +
            "</dl>" +
          "</div>" +
          '<div class="campo" data-campo="visita">' +
            '<label class="opcion"><input type="checkbox" name="visita" value="si"' + (d.visita === "si" ? " checked" : "") + "> Acepto una visita o llamada de seguimiento de la fundación.</label>" +
            '<span class="error" aria-live="polite"></span>' +
          "</div>";
      }

      var stepsListHtml = validators.ADOPTION_STEPS.map(function (st, i) {
        var cls = i < p ? "hecho" : (i === p ? "actual" : "");
        return '<li class="' + cls + '"' + (i === p ? ' aria-current="step"' : "") + ">" + (i + 1) + ". " + esc(st.label) + "</li>";
      }).join("");

      vista.innerHTML =
        '<section class="pantalla reticula">' +
          '<div class="panel">' +
            '<div class="migas"><a href="#/animal/' + encodeURIComponent(animal.id) + '">← Volver a la ficha de ' + esc(animal.nombre) + "</a></div>" +
            "<h1>Adoptar a " + esc(animal.nombre) + "</h1>" +
            '<p class="aviso">Tu avance se guarda automáticamente en este dispositivo mientras completas la solicitud.</p>' +
            '<ol class="pasos" aria-label="Progreso">' + stepsListHtml + "</ol>" +
            '<form class="formulario" id="form-adopcion" novalidate>' +
              bodyHtml +
              '<div class="error-general error" id="adopcion-error" aria-live="assertive"></div>' +
              '<div class="acciones">' +
                (p > 0 ? '<button type="button" class="btn btn-sec" id="atras">Atrás</button>' : "") +
                '<button type="submit" class="btn btn-cta" id="sig">' + (p === 2 ? "Enviar solicitud" : "Continuar") + "</button>" +
              "</div>" +
            "</form>" +
          "</div>" +
        "</section>";

      var form = vista.querySelector("#form-adopcion");
      var sigBtn = vista.querySelector("#sig");
      var errBanner = vista.querySelector("#adopcion-error");
      var touched = {};

      function validateUI(showAll) {
        var stepFields = validators.ADOPTION_STEPS[p].fields;
        stepFields.forEach(function (field) {
          var cont = form.querySelector('[data-campo="' + field + '"]');
          if (!cont) { return; }
          var res = validators.validateAdoptionField(field, state.datos[field]);
          var showErr = !res.valid && (showAll || Boolean(touched[field]));
          cont.classList.toggle("invalido", showErr);
          var errEl = cont.querySelector(".error");
          if (errEl) {
            errEl.textContent = showErr ? res.error : "";
          }
        });
        var stepCheck = validators.validateAdoptionStep(p, state.datos);
        sigBtn.disabled = !stepCheck.valid;
        return stepCheck;
      }

      function handleFieldChange(e) {
        var t = e.target;
        if (!t || !t.name) { return; }
        state.datos[t.name] = t.type === "checkbox" ? (t.checked ? "si" : "") : t.value;
        if (e.type === "change") {
          touched[t.name] = true;
        }
        persistDraft();
        validateUI(false);
      }

      form.addEventListener("input", handleFieldChange);
      form.addEventListener("change", handleFieldChange);
      form.addEventListener("focusout", function (e) {
        if (e.target && e.target.name) {
          touched[e.target.name] = true;
          validateUI(false);
        }
      });

      var editBtns = form.querySelectorAll("[data-edit-step]");
      for (var i = 0; i < editBtns.length; i++) {
        editBtns[i].addEventListener("click", function () {
          var targetStep = Number(this.getAttribute("data-edit-step"));
          if (Number.isInteger(targetStep) && targetStep >= 0 && targetStep <= 2) {
            state.paso = targetStep;
            persistDraft();
            renderStep();
            if (typeof root.scrollTo === "function") { root.scrollTo(0, 0); }
          }
        });
      }

      var atrasBtn = vista.querySelector("#atras");
      if (atrasBtn) {
        atrasBtn.addEventListener("click", function () {
          state.paso = Math.max(0, state.paso - 1);
          persistDraft();
          renderStep();
          if (typeof root.scrollTo === "function") { root.scrollTo(0, 0); }
        });
      }

      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var check = validateUI(true);
        if (!check.valid) { return; }

        if (p < 2) {
          state.paso = p + 1;
          persistDraft();
          renderStep();
          if (typeof root.scrollTo === "function") { root.scrollTo(0, 0); }
          return;
        }

        var res = store.submitAdoption(animal.id, state.datos);
        if (!res.ok) {
          errBanner.textContent = (res.errors && res.errors.general) || "Revisa los campos antes de enviar.";
          return;
        }
        state.solicitud = res.solicitud;
        utils.showToast("Solicitud " + res.solicitud.codigo + " registrada.", "ok");
        renderStep();
        if (typeof root.scrollTo === "function") { root.scrollTo(0, 0); }
      });

      validateUI(false);
    }

    renderStep();
  }

  App.views.adopcion = renderAdopcion;
})(typeof globalThis !== "undefined" ? globalThis : window);
