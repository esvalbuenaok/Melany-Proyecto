/* Panel de gestion (demo) con 5 pestanas: solicitudes, animales, donaciones/pagos, academia y sitio/sistema. */
(function (root) {
  "use strict";

  var App = (root.AmiuniApp = root.AmiuniApp || {});
  App.views = App.views || {};

  var PAYMENT_FORM_DEFS = [
    {
      id: "pago_movil",
      heading: "Pago móvil",
      fields: [
        { name: "titulo", label: "Nombre visible" },
        { name: "banco", label: "Banco" },
        { name: "telefono", label: "Teléfono" },
        { name: "rif", label: "RIF / Cédula" },
        { name: "titular", label: "Titular" },
        { name: "nota", label: "Nota adicional (opcional)", wide: true }
      ]
    },
    {
      id: "transferencia",
      heading: "Transferencia bancaria",
      fields: [
        { name: "titulo", label: "Nombre visible" },
        { name: "banco", label: "Banco" },
        { name: "tipoCuenta", label: "Tipo de cuenta" },
        { name: "cuenta", label: "Número de cuenta" },
        { name: "rif", label: "RIF" },
        { name: "titular", label: "Titular" },
        { name: "nota", label: "Nota adicional (opcional)", wide: true }
      ]
    },
    {
      id: "zelle",
      heading: "Zelle",
      fields: [
        { name: "titulo", label: "Nombre visible" },
        { name: "correo", label: "Correo electrónico" },
        { name: "titular", label: "Titular" },
        { name: "nota", label: "Nota adicional (opcional)", wide: true }
      ]
    }
  ];

  function confirmAction(message) {
    if (typeof root.confirm === "function") {
      return root.confirm(message);
    }
    return true;
  }

  function downloadJsonFile(filename, data) {
    var json = JSON.stringify(data, null, 2);
    var doc = root.document;
    if (!doc || typeof Blob === "undefined" || !root.URL || typeof root.URL.createObjectURL !== "function") {
      return false;
    }
    var blob = new Blob([json], { type: "application/json" });
    var url = root.URL.createObjectURL(blob);
    var a = doc.createElement("a");
    a.href = url;
    a.download = filename;
    doc.body.appendChild(a);
    a.click();
    doc.body.removeChild(a);
    root.URL.revokeObjectURL(url);
    return true;
  }

  function scrollIntoViewSmooth(el) {
    if (el && typeof el.scrollIntoView === "function") {
      el.scrollIntoView({ behavior: "smooth" });
    }
  }

  function renderAdmin(vista) {
    var store = App.store;
    var utils = App.utils;
    var validators = App.validators;
    var components = App.components;
    var esc = utils.esc;

    var ui = {
      tab: "solicitudes",
      reqFilter: "",
      donFilter: "",
      editingAnimalId: null,
      animalErrors: {},
      editingTestimonialId: null,
      editingLessonId: null,
      editingQuizId: null,
      loginError: "",
      loginUser: ""
    };

    function resetEditingState() {
      ui.editingAnimalId = null;
      ui.animalErrors = {};
      ui.editingTestimonialId = null;
      ui.editingLessonId = null;
      ui.editingQuizId = null;
    }

    function renderTextField(id, name, label, value, opts) {
      var o = opts || {};
      var cls = "campo" + (o.wide ? " grid-span-full" : "") + (o.error ? " invalido" : "");
      var type = o.type || "text";
      var placeholder = o.placeholder ? ' placeholder="' + esc(o.placeholder) + '"' : "";
      var extra = o.readonly ? " readonly" : "";
      if (o.list) { extra += ' list="' + esc(o.list) + '"'; }
      if (o.min != null) { extra += ' min="' + esc(o.min) + '"'; }
      if (o.max != null) { extra += ' max="' + esc(o.max) + '"'; }
      var inputHtml = o.textarea
        ? '<textarea id="' + esc(id) + '" name="' + esc(name) + '"' + placeholder + extra + ">" + esc(value) + "</textarea>"
        : '<input id="' + esc(id) + '" name="' + esc(name) + '" type="' + esc(type) + '" value="' + esc(value) + '"' + placeholder + extra + ">";
      var errHtml = o.error ? '<span class="error">' + esc(o.error) + "</span>" : "";
      return '<div class="' + cls + '"><label for="' + esc(id) + '">' + esc(label) + "</label>" + inputHtml + errHtml + "</div>";
    }

    function renderLogin() {
      var errHtml = ui.loginError
        ? '<div class="admin-alerta" role="alert" aria-live="assertive">' + esc(ui.loginError) + "</div>"
        : "";

      vista.innerHTML =
        '<section class="pantalla reticula">' +
          '<form class="panel admin-form admin-login" id="form-admin-login" novalidate>' +
            "<h1>Acceso al panel de gestión</h1>" +
            "<p>Ingresa tus credenciales de administración para continuar.</p>" +
            errHtml +
            '<div class="campo' + (ui.loginError ? " invalido" : "") + '">' +
              '<label for="adm-login-user">Usuario</label>' +
              '<input id="adm-login-user" name="usuario" type="text" autocomplete="username" value="' + esc(ui.loginUser) + '" required>' +
            "</div>" +
            '<div class="campo' + (ui.loginError ? " invalido" : "") + '">' +
              '<label for="adm-login-pass">Clave</label>' +
              '<input id="adm-login-pass" name="clave" type="password" autocomplete="current-password" required>' +
            "</div>" +
            '<button type="submit" class="btn btn-cta">Iniciar sesión</button>' +
            '<p class="aviso m-0">Credenciales demo iniciales: usuario <code>admin</code> · clave <code>amiuni2026</code></p>' +
          "</form>" +
        "</section>";

      var loginForm = vista.querySelector("#form-admin-login");
      var userInput = vista.querySelector("#adm-login-user");
      var passInput = vista.querySelector("#adm-login-pass");
      var focusTarget = ui.loginUser ? passInput : userInput;
      if (focusTarget && typeof focusTarget.focus === "function") {
        focusTarget.focus();
      }

      loginForm.addEventListener("submit", function (e) {
        e.preventDefault();
        var usuario = loginForm.elements.usuario.value;
        var clave = loginForm.elements.clave.value;
        ui.loginUser = usuario.trim();

        var res = store.loginAdmin(usuario, clave);
        if (!res.ok) {
          ui.loginError = res.error || "Credenciales inválidas.";
          paint();
          return;
        }

        ui.loginError = "";
        ui.loginUser = "";
        utils.showToast("Sesión iniciada.", "ok");
        paint();
        var heading = vista.querySelector(".admin-cabecera h1");
        if (heading && typeof heading.focus === "function") {
          heading.focus();
        }
      });
    }

    function renderRequestsTab() {
      var filterObj = ui.reqFilter ? { estado: ui.reqFilter } : null;
      var requests = store.getRequests(filterObj);

      var filterBar =
        '<div class="admin-barra">' +
          '<label for="adm-req-filter">Filtrar por estado</label>' +
          '<select id="adm-req-filter">' +
            components.renderSelectOptions([
              ["", "Todas"],
              ["pendiente", "Recibidas"],
              ["en_revision", "En revisión"],
              ["aprobada", "Aprobadas"],
              ["rechazada", "No aprobadas / Canceladas"]
            ], ui.reqFilter) +
          "</select>" +
        "</div>";

      if (!requests.length) {
        return filterBar + '<div class="vacio">No hay solicitudes registradas con este criterio.</div>';
      }

      return filterBar + '<div class="admin-lista">' + requests.map(function (r) {
        var sol = r.solicitante || {};
        var hogar = r.hogar || {};
        return (
          '<form class="admin-card" data-req-form="' + esc(r.codigo) + '">' +
            '<div class="admin-card-top">' +
              "<div><strong>" + esc(r.codigo) + "</strong> · " + esc(r.animalNombre || r.animalId) +
                '<div class="registro-sub">' + esc(sol.nombre || "") + " · " + esc(sol.telefono || "") + " · " + esc(sol.correo || "") + "</div>" +
                '<div class="registro-sub">Vivienda: ' + esc(hogar.vivienda || "") +
                  " · Otros animales: " + esc(hogar.otros || "") +
                  " · Niños: " + esc(hogar.ninos || "") +
                  " · Visita previa: " + (hogar.visita ? "Sí" : "No") +
                "</div>" +
                '<div class="registro-sub">Fecha: ' + esc(utils.formatDate(r.fechaCreacion)) + "</div>" +
              "</div>" +
              components.renderRequestStatusBadge(r.estado) +
            "</div>" +
            '<p class="admin-motivo">"' + esc(hogar.motivo || "") + '"</p>' +
            '<div class="admin-controles">' +
              '<div class="campo"><label>Estado</label><select name="estado">' +
                components.renderSelectOptions([
                  ["pendiente", "Recibida"],
                  ["en_revision", "En revisión"],
                  ["aprobada", "Aprobada"],
                  ["rechazada", "No aprobada / Cancelada"]
                ], r.estado) +
              "</select></div>" +
              '<div class="campo campo-wide"><label>Nota administrativa</label><input type="text" name="notaAdmin" value="' + esc(r.notaAdmin || "") + '" placeholder="Observación visible en seguimiento"></div>' +
              '<button type="submit" class="btn btn-cta btn-compacto">Guardar</button>' +
            "</div>" +
          "</form>"
        );
      }).join("") + "</div>";
    }

    function renderAnimalsTab() {
      var animals = store.getAnimals();
      var editing = ui.editingAnimalId ? store.getAnimalById(ui.editingAnimalId) : null;
      var a = editing || {
        nombre: "",
        especie: "perro",
        sexo: "hembra",
        edad: "joven",
        edadTexto: "",
        tamano: "mediano",
        estado: "disponible",
        apadrinamientoMensual: 20,
        historia: "",
        etiquetas: [],
        fotos: [],
        salud: { vacunas: true, esterilizado: false, desparasitado: true },
        compatibilidad: { ninos: true, apartamento: true, otrosPerros: true, otrosGatos: false }
      };
      var firstPhoto = Array.isArray(a.fotos) && a.fotos[0] ? (a.fotos[0].url || a.fotos[0]) : "";
      var errs = ui.animalErrors || {};

      var listHtml = '<div class="admin-lista">' + animals.map(function (item) {
        return (
          '<div class="admin-card">' +
            '<div class="admin-card-top">' +
              "<div><strong>" + esc(item.nombre) + "</strong> · " + esc(utils.cap(item.especie)) + " · " + esc(item.edadTexto) +
                '<div class="registro-sub">ID: ' + esc(item.id) + " · Apadrinamiento: " + esc(utils.formatUSD(item.apadrinamientoMensual || 0)) + "/mes</div>" +
              "</div>" +
              components.renderBadge(item) +
            "</div>" +
            '<div class="admin-controles">' +
              '<div class="campo"><label>Estado rápido</label><select data-animal-status="' + esc(item.id) + '">' +
                components.renderSelectOptions([["disponible", "Disponible"], ["proceso", "En proceso"], ["adoptado", "Adoptado"]], item.estado) +
              "</select></div>" +
              '<button type="button" class="btn btn-sec btn-compacto" data-edit-animal="' + esc(item.id) + '">Editar</button>' +
              '<button type="button" class="btn btn-peligro btn-compacto" data-delete-animal="' + esc(item.id) + '">Eliminar</button>' +
            "</div>" +
          "</div>"
        );
      }).join("") + "</div>";

      var formHtml =
        '<form class="panel admin-form" id="form-admin-animal" novalidate>' +
          "<h2>" + (editing ? "Editar a " + esc(editing.nombre) : "Agregar nuevo animal") + "</h2>" +
          '<div class="admin-grid-2">' +
            renderTextField("adm-nombre", "nombre", "Nombre *", a.nombre, { error: errs.nombre }) +
            renderTextField("adm-edadTexto", "edadTexto", "Edad en texto *", a.edadTexto, { placeholder: "Ej. 2 años", error: errs.edadTexto }) +
            '<div class="campo"><label for="adm-especie">Especie</label><select id="adm-especie" name="especie">' + components.renderSelectOptions([["perro", "Perro"], ["gato", "Gato"]], a.especie) + "</select></div>" +
            '<div class="campo"><label for="adm-sexo">Sexo</label><select id="adm-sexo" name="sexo">' + components.renderSelectOptions([["hembra", "Hembra"], ["macho", "Macho"]], a.sexo) + "</select></div>" +
            '<div class="campo"><label for="adm-edad">Etapa de edad</label><select id="adm-edad" name="edad">' + components.renderSelectOptions([["cachorro", "Cachorro"], ["joven", "Joven"], ["adulto", "Adulto"], ["senior", "Senior"]], a.edad) + "</select></div>" +
            '<div class="campo"><label for="adm-tamano">Tamaño</label><select id="adm-tamano" name="tamano">' + components.renderSelectOptions([["pequeño", "Pequeño"], ["mediano", "Mediano"], ["grande", "Grande"]], a.tamano) + "</select></div>" +
            '<div class="campo"><label for="adm-estado">Estado</label><select id="adm-estado" name="estado">' + components.renderSelectOptions([["disponible", "Disponible"], ["proceso", "En proceso"], ["adoptado", "Adoptado"]], a.estado) + "</select></div>" +
            renderTextField("adm-apad", "apadrinamientoMensual", "Apadrinamiento mensual (USD)", a.apadrinamientoMensual != null ? a.apadrinamientoMensual : 20, { type: "number", min: 0, max: 5000, error: errs.apadrinamientoMensual }) +
          "</div>" +
          renderTextField("adm-foto", "fotoUrl", "URL de foto (opcional)", firstPhoto, { placeholder: "https://..." }) +
          renderTextField("adm-etiquetas", "etiquetas", "Etiquetas (separadas por coma)", (a.etiquetas || []).join(", "), { placeholder: "Apto para apartamentos, Tranquilo" }) +
          renderTextField("adm-historia", "historia", "Historia *", a.historia, { textarea: true, error: errs.historia }) +
          '<fieldset class="campo"><legend>Salud</legend><div class="filtros-checks">' +
            '<label class="check-pill"><input type="checkbox" name="vacunas"' + (a.salud && a.salud.vacunas ? " checked" : "") + "> Vacunas</label>" +
            '<label class="check-pill"><input type="checkbox" name="esterilizado"' + (a.salud && a.salud.esterilizado ? " checked" : "") + "> Esterilizado/a</label>" +
            '<label class="check-pill"><input type="checkbox" name="desparasitado"' + (a.salud && a.salud.desparasitado ? " checked" : "") + "> Desparasitado/a</label>" +
          "</div></fieldset>" +
          '<fieldset class="campo"><legend>Compatibilidad</legend><div class="filtros-checks">' +
            '<label class="check-pill"><input type="checkbox" name="ninos"' + (a.compatibilidad && a.compatibilidad.ninos ? " checked" : "") + "> Niños</label>" +
            '<label class="check-pill"><input type="checkbox" name="apartamento"' + (a.compatibilidad && a.compatibilidad.apartamento ? " checked" : "") + "> Apartamento</label>" +
            '<label class="check-pill"><input type="checkbox" name="otrosPerros"' + (a.compatibilidad && a.compatibilidad.otrosPerros ? " checked" : "") + "> Otros perros</label>" +
            '<label class="check-pill"><input type="checkbox" name="otrosGatos"' + (a.compatibilidad && a.compatibilidad.otrosGatos ? " checked" : "") + "> Otros gatos</label>" +
          "</div></fieldset>" +
          '<div class="acciones">' +
            (editing ? '<button type="button" class="btn btn-sec" id="btn-cancelar-edicion">Cancelar edición</button>' : "") +
            '<button type="submit" class="btn btn-cta">' + (editing ? "Guardar cambios" : "Crear animal") + "</button>" +
          "</div>" +
        "</form>";

      return listHtml + formHtml;
    }

    function renderDonationsPaymentsTab() {
      var meta = store.getMeta();
      var filterObj = ui.donFilter ? { estado: ui.donFilter } : null;
      var donations = store.getDonations(filterObj);
      var methods = store.getPaymentMethods();
      var testimonials = store.getTestimonials();

      var editingTest = null;
      if (ui.editingTestimonialId != null) {
        editingTest = testimonials.filter(function (t, idx) {
          return (t.id || String(idx)) === ui.editingTestimonialId;
        })[0] || null;
      }

      var metaForm =
        '<form class="panel admin-form" id="form-admin-meta">' +
          "<h2>Meta de recaudación en vivo</h2>" +
          components.renderMetaProgress(meta) +
          '<div class="admin-grid-2">' +
            renderTextField("adm-meta-etiqueta", "etiqueta", "Etiqueta de la campaña", meta.etiqueta, { wide: true }) +
            renderTextField("adm-meta-obj", "objetivo", "Objetivo (USD)", meta.objetivo, { type: "number", min: 1 }) +
            renderTextField("adm-meta-base", "recaudadoBase", "Recaudado base previo (USD)", meta.recaudadoBase, { type: "number", min: 0 }) +
          "</div>" +
          '<button type="submit" class="btn btn-cta">Actualizar meta</button>' +
        "</form>";

      var filterBar =
        '<div class="admin-barra mt-lg">' +
          '<label for="adm-don-filter">Filtrar donaciones</label>' +
          '<select id="adm-don-filter">' +
            components.renderSelectOptions([
              ["", "Todas"],
              ["pendiente", "Pendientes"],
              ["verificada", "Verificadas"],
              ["anulada", "Anuladas"]
            ], ui.donFilter) +
          "</select>" +
        "</div>";

      var donationsHtml = donations.length
        ? '<div class="admin-lista">' + donations.map(function (d) {
            return (
              '<form class="admin-card" data-don-form="' + esc(d.codigo) + '">' +
                '<div class="admin-card-top">' +
                  "<div><strong>" + esc(d.codigo) + "</strong> · " + esc(utils.formatUSD(d.monto)) + " · " + esc(d.donanteNombre) +
                    '<div class="registro-sub">Método: ' + esc(utils.PAYMENT_METHOD_LABELS[d.metodo] || d.metodo) + " · Ref: " + esc(d.referencia) + " · " + esc(utils.formatDate(d.fechaCreacion)) + "</div>" +
                  "</div>" +
                  components.renderDonationStatusBadge(d.estado) +
                "</div>" +
                '<div class="admin-controles">' +
                  '<div class="campo"><label>Estado</label><select name="estado">' +
                    components.renderSelectOptions([
                      ["pendiente", "Pendiente"],
                      ["verificada", "Verificada"],
                      ["anulada", "Anulada"]
                    ], d.estado) +
                  "</select></div>" +
                  '<div class="campo campo-wide"><label>Nota administrativa</label><input type="text" name="notaAdmin" value="' + esc(d.notaAdmin || "") + '" placeholder="Confirmación bancaria o motivo"></div>' +
                  '<button type="submit" class="btn btn-cta btn-compacto">Guardar</button>' +
                "</div>" +
              "</form>"
            );
          }).join("") + "</div>"
        : '<div class="vacio">No hay donaciones registradas con este filtro.</div>';

      var paymentFormsHtml =
        '<div class="panel admin-form mt-lg">' +
          "<h2>Medios de pago visibles en Donar</h2>" +
          '<div class="admin-lista m-0">' +
            PAYMENT_FORM_DEFS.map(function (def) {
              var current = methods[def.id] || {};
              return (
                '<form class="admin-card" data-payment-form="' + esc(def.id) + '">' +
                  "<h3>" + esc(def.heading) + "</h3>" +
                  '<div class="admin-grid-2">' +
                    def.fields.map(function (field) {
                      return renderTextField(
                        "adm-pay-" + def.id + "-" + field.name,
                        field.name,
                        field.label,
                        current[field.name] || "",
                        { wide: field.wide }
                      );
                    }).join("") +
                  "</div>" +
                  '<div><button type="submit" class="btn btn-cta btn-compacto">Guardar ' + esc(def.heading) + "</button></div>" +
                "</form>"
              );
            }).join("") +
          "</div>" +
        "</div>";

      var testimonialsHtml =
        '<div class="panel admin-form mt-lg">' +
          "<h2>Testimonios visibles</h2>" +
          (testimonials.length
            ? '<div class="admin-lista m-0">' + testimonials.map(function (t, idx) {
                var key = t.id || String(idx);
                return (
                  '<div class="admin-card">' +
                    '<div class="admin-card-top">' +
                      "<div><strong>" + esc(t.autor || "Testimonio") + "</strong>" +
                        (t.fecha ? '<div class="registro-sub">' + esc(utils.formatDate(t.fecha)) + "</div>" : "") +
                      "</div>" +
                      '<div class="admin-sistema-acciones">' +
                        '<button type="button" class="btn btn-sec btn-compacto" data-edit-testimonio="' + esc(key) + '">Editar</button>' +
                        '<button type="button" class="btn btn-peligro btn-compacto" data-delete-testimonio="' + esc(key) + '">Eliminar</button>' +
                      "</div>" +
                    "</div>" +
                    '<p class="admin-motivo">"' + esc(t.texto || "") + '"</p>' +
                  "</div>"
                );
              }).join("") + "</div>"
            : '<p class="aviso m-0">No hay testimonios registrados.</p>') +
          '<form class="admin-card m-0" id="form-admin-testimonio" novalidate>' +
            "<h3>" + (editingTest ? "Editar testimonio" : "Agregar nuevo testimonio") + "</h3>" +
            '<div class="admin-grid-2">' +
              renderTextField("adm-test-autor", "autor", "Autor *", editingTest ? editingTest.autor : "", { placeholder: "Ej. Adoptante (Mérida)" }) +
              renderTextField("adm-test-fecha", "fecha", "Fecha (YYYY-MM-DD)", editingTest ? (editingTest.fecha || "") : new Date().toISOString().slice(0, 10), { type: "date" }) +
              renderTextField("adm-test-texto", "texto", "Testimonio *", editingTest ? editingTest.texto : "", { textarea: true, wide: true }) +
            "</div>" +
            '<div class="acciones">' +
              (editingTest ? '<button type="button" class="btn btn-sec" id="btn-cancel-testimonio">Cancelar edición</button>' : "") +
              '<button type="submit" class="btn btn-cta">' + (editingTest ? "Guardar testimonio" : "Agregar testimonio") + "</button>" +
            "</div>" +
          "</form>" +
        "</div>";

      return metaForm + filterBar + donationsHtml + paymentFormsHtml + testimonialsHtml;
    }

    function renderAcademyTab() {
      var site = store.getSiteConfig();
      var academy = store.getAcademyData();
      var lessons = Array.isArray(academy.lecciones) ? academy.lecciones : [];
      var quiz = Array.isArray(academy.quiz) ? academy.quiz : [];

      var editingLesson = ui.editingLessonId
        ? lessons.filter(function (l) { return l.id === ui.editingLessonId; })[0] || null
        : null;
      var lForm = editingLesson || {
        id: "",
        titulo: "",
        categoria: "Adopción",
        duracion: "4 min",
        resumen: "",
        puntosClave: [],
        mito: "",
        realidad: "",
        ctaTexto: "Explorar mascotas",
        ctaRuta: "#/"
      };

      var editingQuiz = ui.editingQuizId
        ? quiz.filter(function (q) { return q.id === ui.editingQuizId; })[0] || null
        : null;
      var qOpts = editingQuiz && Array.isArray(editingQuiz.opciones) ? editingQuiz.opciones : [
        { texto: "", puntos: 0 },
        { texto: "", puntos: 1 },
        { texto: "", puntos: 2 }
      ];
      var optRowsCount = Math.max(3, qOpts.length);
      var optRowsHtml = "";
      for (var i = 0; i < optRowsCount; i++) {
        var op = qOpts[i] || { texto: "", puntos: i };
        optRowsHtml +=
          '<div class="admin-controles">' +
            '<div class="campo campo-wide"><label for="adm-quiz-op-' + i + '">Opción ' + (i + 1) + (i < 2 ? " *" : "") + "</label>" +
              '<input id="adm-quiz-op-' + i + '" name="opTexto_' + i + '" type="text" value="' + esc(op.texto || "") + '">' +
            "</div>" +
            '<div class="campo"><label for="adm-quiz-pts-' + i + '">Puntos</label>' +
              '<input id="adm-quiz-pts-' + i + '" name="opPuntos_' + i + '" type="number" min="0" max="10" value="' + esc(op.puntos != null ? op.puntos : i) + '">' +
            "</div>" +
          "</div>";
      }

      var headerForm =
        '<form class="panel admin-form" id="form-admin-academy-header" novalidate>' +
          "<h2>Identidad de Academia</h2>" +
          '<div class="admin-grid-2">' +
            renderTextField("adm-acad-nav", "academiaNavNombre", "Nombre en el menú de navegación *", site.academiaNavNombre) +
            renderTextField("adm-acad-titulo", "titulo", "Título principal de la sección *", academy.titulo) +
          "</div>" +
          '<div><button type="submit" class="btn btn-cta">Guardar textos de Academia</button></div>' +
        "</form>";

      var lessonsSection =
        '<div class="panel admin-form mt-lg">' +
          "<h2>Lecciones (" + esc(lessons.length) + ")</h2>" +
          (lessons.length
            ? '<div class="admin-lista m-0">' + lessons.map(function (l) {
                return (
                  '<div class="admin-card">' +
                    '<div class="admin-card-top">' +
                      "<div><strong>" + esc(l.titulo) + "</strong>" +
                        '<div class="registro-sub">ID: ' + esc(l.id) + " · Categoría: " + esc(l.categoria) + " · Duración: " + esc(l.duracion) + "</div>" +
                      "</div>" +
                      '<div class="admin-sistema-acciones">' +
                        '<button type="button" class="btn btn-sec btn-compacto" data-edit-lesson="' + esc(l.id) + '">Editar</button>' +
                        '<button type="button" class="btn btn-peligro btn-compacto" data-delete-lesson="' + esc(l.id) + '">Eliminar</button>' +
                      "</div>" +
                    "</div>" +
                  "</div>"
                );
              }).join("") + "</div>"
            : '<p class="aviso m-0">No hay lecciones registradas.</p>') +
          '<form class="admin-card m-0" id="form-admin-lesson" novalidate>' +
            "<h3>" + (editingLesson ? "Editar lección: " + esc(editingLesson.titulo) : "Agregar nueva lección") + "</h3>" +
            '<datalist id="adm-lesson-cats">' +
              '<option value="Adopción"></option><option value="Cuidados"></option><option value="Concienciación"></option>' +
            "</datalist>" +
            '<div class="admin-grid-2">' +
              renderTextField("adm-les-id", "id", "ID (slug)", lForm.id, { placeholder: "Opcional: se genera del título", readonly: Boolean(editingLesson) }) +
              renderTextField("adm-les-titulo", "titulo", "Título *", lForm.titulo) +
              renderTextField("adm-les-cat", "categoria", "Categoría *", lForm.categoria, { list: "adm-lesson-cats" }) +
              renderTextField("adm-les-dur", "duracion", "Duración", lForm.duracion, { placeholder: "Ej. 4 min" }) +
              renderTextField("adm-les-resumen", "resumen", "Resumen *", lForm.resumen, { textarea: true, wide: true }) +
              renderTextField("adm-les-puntos", "puntosClave", "Puntos clave (uno por línea)", (lForm.puntosClave || []).join("\n"), { textarea: true, wide: true }) +
              renderTextField("adm-les-mito", "mito", "Mito", lForm.mito, { textarea: true }) +
              renderTextField("adm-les-realidad", "realidad", "Realidad", lForm.realidad, { textarea: true }) +
              renderTextField("adm-les-cta-txt", "ctaTexto", "Texto del botón CTA", lForm.ctaTexto) +
              renderTextField("adm-les-cta-ruta", "ctaRuta", "Ruta del botón CTA", lForm.ctaRuta, { placeholder: "#/" }) +
            "</div>" +
            '<div class="acciones">' +
              (editingLesson ? '<button type="button" class="btn btn-sec" id="btn-cancel-lesson">Cancelar edición</button>' : "") +
              '<button type="submit" class="btn btn-cta">' + (editingLesson ? "Guardar lección" : "Crear lección") + "</button>" +
            "</div>" +
          "</form>" +
        "</div>";

      var quizSection =
        '<div class="panel admin-form mt-lg">' +
          "<h2>Preguntas del Quiz (" + esc(quiz.length) + ")</h2>" +
          (quiz.length
            ? '<div class="admin-lista m-0">' + quiz.map(function (q) {
                return (
                  '<div class="admin-card">' +
                    '<div class="admin-card-top">' +
                      "<div><strong>" + esc(q.pregunta) + "</strong>" +
                        '<div class="registro-sub">ID: ' + esc(q.id) + " · " + esc((q.opciones || []).length) + " opciones</div>" +
                      "</div>" +
                      '<div class="admin-sistema-acciones">' +
                        '<button type="button" class="btn btn-sec btn-compacto" data-edit-quiz="' + esc(q.id) + '">Editar</button>' +
                        '<button type="button" class="btn btn-peligro btn-compacto" data-delete-quiz="' + esc(q.id) + '">Eliminar</button>' +
                      "</div>" +
                    "</div>" +
                  "</div>"
                );
              }).join("") + "</div>"
            : '<p class="aviso m-0">No hay preguntas en el quiz.</p>') +
          '<form class="admin-card m-0" id="form-admin-quiz" data-opt-count="' + esc(optRowsCount) + '" novalidate>' +
            "<h3>" + (editingQuiz ? "Editar pregunta del quiz" : "Agregar pregunta al quiz") + "</h3>" +
            renderTextField("adm-quiz-pregunta", "pregunta", "Pregunta *", editingQuiz ? editingQuiz.pregunta : "", { wide: true }) +
            renderTextField("adm-quiz-explicacion", "explicacion", "Explicación al finalizar el test", editingQuiz ? editingQuiz.explicacion : "", { textarea: true, wide: true }) +
            optRowsHtml +
            '<div class="acciones">' +
              (editingQuiz ? '<button type="button" class="btn btn-sec" id="btn-cancel-quiz">Cancelar edición</button>' : "") +
              '<button type="submit" class="btn btn-cta">' + (editingQuiz ? "Guardar pregunta" : "Agregar pregunta") + "</button>" +
            "</div>" +
          "</form>" +
        "</div>";

      return headerForm + lessonsSection + quizSection;
    }

    function renderSiteSystemTab() {
      var site = store.getSiteConfig();
      var stats = store.getStats();
      var session = store.getAdminSession();

      var identityForm =
        '<form class="panel admin-form" id="form-admin-site" novalidate>' +
          "<h2>Identidad, portada y pie de página</h2>" +
          '<div class="admin-grid-2">' +
            renderTextField("adm-site-marca", "nombreMarca", "Nombre de marca *", site.nombreMarca) +
            renderTextField("adm-site-kicker", "portadaKicker", "Etiqueta superior de portada", site.portadaKicker) +
            renderTextField("adm-site-titulo", "portadaTitulo", "Título de portada", site.portadaTitulo, { wide: true }) +
            renderTextField("adm-site-desc", "portadaDescripcion", "Descripción de portada", site.portadaDescripcion, { textarea: true, wide: true }) +
            renderTextField("adm-site-cta", "portadaCtaTexto", "Texto del botón principal", site.portadaCtaTexto) +
            renderTextField("adm-site-subpie", "subtituloPie", "Subtítulo del pie de página", site.subtituloPie) +
            renderTextField("adm-site-avisopie", "avisoPie", "Aviso del pie de página", site.avisoPie, { textarea: true, wide: true }) +
            renderTextField("adm-site-wa", "whatsappContacto", "WhatsApp de contacto", site.whatsappContacto) +
            renderTextField("adm-site-correo", "correoContacto", "Correo de contacto", site.correoContacto, { type: "email" }) +
          "</div>" +
          '<div><button type="submit" class="btn btn-cta">Guardar configuración del sitio</button></div>' +
        "</form>";

      var statsForm =
        '<form class="panel admin-form mt-lg" id="form-admin-stats" novalidate>' +
          "<h2>Métricas visibles en inicio</h2>" +
          '<p class="aviso m-0">Ajusta las cifras actuales mostradas al público. Los cambios posteriores en el catálogo seguirán sumando automáticamente.</p>' +
          '<div class="admin-grid-2">' +
            renderTextField("adm-stat-adop", "adoptados", "Adopciones logradas", stats.adoptados, { type: "number", min: 0 }) +
            renderTextField("adm-stat-proc", "enProceso", "Procesos en curso", stats.enProceso, { type: "number", min: 0 }) +
            renderTextField("adm-stat-aten", "atendidos", "Animales atendidos", stats.atendidos, { type: "number", min: 0 }) +
          "</div>" +
          '<div><button type="submit" class="btn btn-cta">Actualizar métricas</button></div>' +
        "</form>";

      var authForm =
        '<form class="panel admin-form mt-lg" id="form-admin-auth" novalidate>' +
          "<h2>Credenciales de acceso Admin</h2>" +
          '<div class="admin-grid-2">' +
            renderTextField("adm-auth-user", "usuario", "Usuario *", session ? session.usuario : "admin") +
            renderTextField("adm-auth-pass", "clave", "Nueva clave *", "", { type: "password", placeholder: "Mínimo 4 caracteres" }) +
          "</div>" +
          '<div><button type="submit" class="btn btn-cta">Actualizar credenciales</button></div>' +
        "</form>";

      var backupSection =
        '<div class="panel admin-form mt-lg">' +
          "<h2>Respaldo y sistema</h2>" +
          '<p class="aviso m-0">Exporta o importa una copia JSON completa del sitio y datos, o restablece los datos iniciales de demostración.</p>' +
          '<div class="admin-sistema-acciones">' +
            '<button type="button" class="btn btn-sec" id="btn-export-backup">Exportar respaldo JSON</button>' +
            '<label class="btn btn-sec" for="input-import-backup">Importar respaldo JSON</label>' +
            '<input id="input-import-backup" type="file" accept="application/json,.json" hidden>' +
            '<button type="button" class="btn btn-peligro" id="btn-reset-demo">Restablecer datos de demostración</button>' +
          "</div>" +
        "</div>";

      return identityForm + statsForm + authForm + backupSection;
    }

    function paint() {
      if (!store.isAdminAuthenticated()) {
        renderLogin();
        return;
      }

      var tabs = [
        { id: "solicitudes", label: "Solicitudes" },
        { id: "animales", label: "Animales" },
        { id: "donaciones", label: "Donaciones y Pagos" },
        { id: "academia", label: "Academia" },
        { id: "sitio", label: "Sitio y Sistema" }
      ];

      var tabContent = "";
      if (ui.tab === "solicitudes") {
        tabContent = renderRequestsTab();
      } else if (ui.tab === "animales") {
        tabContent = renderAnimalsTab();
      } else if (ui.tab === "donaciones") {
        tabContent = renderDonationsPaymentsTab();
      } else if (ui.tab === "academia") {
        tabContent = renderAcademyTab();
      } else {
        tabContent = renderSiteSystemTab();
      }

      vista.innerHTML =
        '<section class="pantalla reticula">' +
          '<div class="admin-cabecera">' +
            "<div>" +
              '<h1 tabindex="-1">Panel de gestión (demo)</h1>' +
              "<p>Administra solicitudes, catálogo de animales, donaciones, pagos, academia y configuración del sitio.</p>" +
            "</div>" +
            '<button type="button" class="btn btn-sec" id="btn-admin-logout">Cerrar sesión</button>' +
          "</div>" +
          '<div class="admin-tabs" role="tablist" aria-label="Secciones de administración">' +
            tabs.map(function (t) {
              var active = ui.tab === t.id;
              return '<button type="button" role="tab" class="admin-tab' + (active ? " activo" : "") + '" data-tab="' + t.id + '" aria-selected="' + (active ? "true" : "false") + '">' + esc(t.label) + "</button>";
            }).join("") +
          "</div>" +
          '<div class="admin-panel" role="tabpanel">' + tabContent + "</div>" +
        "</section>";

      bindPanelEvents();
    }

    function bindRequestAndAnimalEvents() {
      var reqFilterEl = vista.querySelector("#adm-req-filter");
      if (reqFilterEl) {
        reqFilterEl.addEventListener("change", function () {
          ui.reqFilter = this.value;
          paint();
        });
      }

      vista.querySelectorAll("[data-req-form]").forEach(function (form) {
        form.addEventListener("submit", function (e) {
          e.preventDefault();
          var code = this.getAttribute("data-req-form");
          var res = store.updateRequestStatus(code, this.elements.estado.value, this.elements.notaAdmin.value);
          if (res.ok) {
            utils.showToast("Solicitud " + code + " actualizada.", "ok");
            paint();
          } else {
            utils.showToast(res.error || "Error al actualizar.", "error");
          }
        });
      });

      vista.querySelectorAll("[data-animal-status]").forEach(function (sel) {
        sel.addEventListener("change", function () {
          var res = store.updateAnimalStatus(this.getAttribute("data-animal-status"), this.value);
          if (res.ok) {
            utils.showToast("Estado de " + res.animal.nombre + " actualizado.", "ok");
            paint();
          }
        });
      });

      vista.querySelectorAll("[data-edit-animal]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          ui.editingAnimalId = this.getAttribute("data-edit-animal");
          ui.animalErrors = {};
          paint();
          scrollIntoViewSmooth(vista.querySelector("#form-admin-animal"));
        });
      });

      vista.querySelectorAll("[data-delete-animal]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          var id = this.getAttribute("data-delete-animal");
          var animal = store.getAnimalById(id);
          var label = animal ? animal.nombre : id;
          if (!confirmAction("¿Eliminar a " + label + " del catálogo?")) {
            return;
          }
          var res = store.deleteAnimal(id);
          if (res.ok) {
            if (ui.editingAnimalId === id) { ui.editingAnimalId = null; }
            utils.showToast("Animal eliminado del catálogo.", "info");
            paint();
          }
        });
      });

      var cancelEditBtn = vista.querySelector("#btn-cancelar-edicion");
      if (cancelEditBtn) {
        cancelEditBtn.addEventListener("click", function () {
          ui.editingAnimalId = null;
          ui.animalErrors = {};
          paint();
        });
      }

      var animalForm = vista.querySelector("#form-admin-animal");
      if (animalForm) {
        animalForm.addEventListener("submit", function (e) {
          e.preventDefault();
          var f = animalForm.elements;
          var fotoUrl = f.fotoUrl.value.trim();
          var existing = ui.editingAnimalId ? store.getAnimalById(ui.editingAnimalId) : null;
          var fotos = existing ? (existing.fotos || []).slice() : [];
          if (fotoUrl) {
            fotos[0] = { url: fotoUrl, alt: f.nombre.value.trim() || "Foto de animal" };
          } else if (existing && fotos.length > 0) {
            fotos.shift();
          }

          var payload = {
            id: ui.editingAnimalId || undefined,
            nombre: f.nombre.value,
            especie: f.especie.value,
            sexo: f.sexo.value,
            edad: f.edad.value,
            edadTexto: f.edadTexto.value,
            tamano: f.tamano.value,
            estado: f.estado.value,
            apadrinamientoMensual: f.apadrinamientoMensual.value,
            historia: f.historia.value,
            etiquetas: f.etiquetas.value.split(",").map(function (t) { return t.trim(); }).filter(Boolean),
            fotos: fotos,
            salud: {
              vacunas: f.vacunas.checked,
              esterilizado: f.esterilizado.checked,
              desparasitado: f.desparasitado.checked
            },
            compatibilidad: {
              ninos: f.ninos.checked,
              apartamento: f.apartamento.checked,
              otrosPerros: f.otrosPerros.checked,
              otrosGatos: f.otrosGatos.checked
            }
          };

          var check = validators.validateAnimalInput(payload);
          if (!check.valid) {
            ui.animalErrors = check.errors;
            paint();
            utils.showToast("Revisa los campos obligatorios del animal.", "error");
            return;
          }

          var res = store.upsertAnimal(payload);
          if (!res.ok) {
            ui.animalErrors = res.errors || {};
            paint();
            return;
          }

          ui.editingAnimalId = null;
          ui.animalErrors = {};
          utils.showToast("Animal " + res.animal.nombre + " guardado.", "ok");
          paint();
        });
      }
    }

    function bindDonationsAndPaymentsEvents() {
      var metaForm = vista.querySelector("#form-admin-meta");
      if (metaForm) {
        metaForm.addEventListener("submit", function (e) {
          e.preventDefault();
          var f = metaForm.elements;
          var res = store.updateMetaConfig({
            etiqueta: f.etiqueta.value,
            objetivo: Number(f.objetivo.value),
            recaudadoBase: Number(f.recaudadoBase.value)
          });
          if (res.ok) {
            utils.showToast("Meta actualizada.", "ok");
            paint();
          } else {
            utils.showToast(res.error || "Valores inválidos para la meta.", "error");
          }
        });
      }

      var donFilterEl = vista.querySelector("#adm-don-filter");
      if (donFilterEl) {
        donFilterEl.addEventListener("change", function () {
          ui.donFilter = this.value;
          paint();
        });
      }

      vista.querySelectorAll("[data-don-form]").forEach(function (form) {
        form.addEventListener("submit", function (e) {
          e.preventDefault();
          var code = this.getAttribute("data-don-form");
          var res = store.updateDonationStatus(code, this.elements.estado.value, this.elements.notaAdmin.value);
          if (res.ok) {
            utils.showToast("Donación " + code + " actualizada.", "ok");
            paint();
          } else {
            utils.showToast(res.error || "Error al actualizar.", "error");
          }
        });
      });

      vista.querySelectorAll("[data-payment-form]").forEach(function (form) {
        form.addEventListener("submit", function (e) {
          e.preventDefault();
          var methodId = this.getAttribute("data-payment-form");
          var patch = {};
          for (var i = 0; i < this.elements.length; i++) {
            var el = this.elements[i];
            if (el.name) {
              patch[el.name] = el.value;
            }
          }
          var res = store.updatePaymentMethod(methodId, patch);
          if (res.ok) {
            utils.showToast("Medio de pago actualizado.", "ok");
            paint();
          } else {
            utils.showToast(res.error || "No se pudo actualizar el medio de pago.", "error");
          }
        });
      });

      vista.querySelectorAll("[data-edit-testimonio]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          ui.editingTestimonialId = this.getAttribute("data-edit-testimonio");
          paint();
          scrollIntoViewSmooth(vista.querySelector("#form-admin-testimonio"));
        });
      });

      var cancelTestBtn = vista.querySelector("#btn-cancel-testimonio");
      if (cancelTestBtn) {
        cancelTestBtn.addEventListener("click", function () {
          ui.editingTestimonialId = null;
          paint();
        });
      }

      var testForm = vista.querySelector("#form-admin-testimonio");
      if (testForm) {
        testForm.addEventListener("submit", function (e) {
          e.preventDefault();
          var f = testForm.elements;
          var res = store.upsertTestimonial({
            id: ui.editingTestimonialId || undefined,
            autor: f.autor.value,
            fecha: f.fecha.value,
            texto: f.texto.value
          });
          if (res.ok) {
            ui.editingTestimonialId = null;
            utils.showToast("Testimonio guardado.", "ok");
            paint();
          } else {
            utils.showToast(res.error || "Completa autor y texto del testimonio.", "error");
          }
        });
      }

      vista.querySelectorAll("[data-delete-testimonio]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          var key = this.getAttribute("data-delete-testimonio");
          if (!confirmAction("¿Eliminar este testimonio?")) {
            return;
          }
          var res = store.deleteTestimonial(key);
          if (res.ok) {
            if (ui.editingTestimonialId === key) { ui.editingTestimonialId = null; }
            utils.showToast("Testimonio eliminado.", "info");
            paint();
          } else {
            utils.showToast(res.error || "No se pudo eliminar el testimonio.", "error");
          }
        });
      });
    }

    function bindAcademyEvents() {
      var headerForm = vista.querySelector("#form-admin-academy-header");
      if (headerForm) {
        headerForm.addEventListener("submit", function (e) {
          e.preventDefault();
          var navRes = store.updateSiteConfig({ academiaNavNombre: headerForm.elements.academiaNavNombre.value });
          if (!navRes.ok) {
            utils.showToast(navRes.error || "Nombre de menú inválido.", "error");
            return;
          }
          var titleRes = store.updateAcademyTitle(headerForm.elements.titulo.value);
          if (!titleRes.ok) {
            utils.showToast(titleRes.error || "Título inválido.", "error");
            return;
          }
          utils.showToast("Textos de Academia actualizados.", "ok");
          paint();
        });
      }

      vista.querySelectorAll("[data-edit-lesson]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          ui.editingLessonId = this.getAttribute("data-edit-lesson");
          paint();
          scrollIntoViewSmooth(vista.querySelector("#form-admin-lesson"));
        });
      });

      vista.querySelectorAll("[data-delete-lesson]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          var id = this.getAttribute("data-delete-lesson");
          if (!confirmAction("¿Eliminar esta lección de Academia?")) {
            return;
          }
          var res = store.deleteAcademyLesson(id);
          if (res.ok) {
            if (ui.editingLessonId === id) { ui.editingLessonId = null; }
            utils.showToast("Lección eliminada.", "info");
            paint();
          } else {
            utils.showToast(res.error || "No se pudo eliminar la lección.", "error");
          }
        });
      });

      var cancelLessonBtn = vista.querySelector("#btn-cancel-lesson");
      if (cancelLessonBtn) {
        cancelLessonBtn.addEventListener("click", function () {
          ui.editingLessonId = null;
          paint();
        });
      }

      var lessonForm = vista.querySelector("#form-admin-lesson");
      if (lessonForm) {
        lessonForm.addEventListener("submit", function (e) {
          e.preventDefault();
          var f = lessonForm.elements;
          var res = store.upsertAcademyLesson({
            id: ui.editingLessonId || f.id.value.trim() || undefined,
            titulo: f.titulo.value,
            categoria: f.categoria.value,
            duracion: f.duracion.value,
            resumen: f.resumen.value,
            puntosClave: f.puntosClave.value,
            mito: f.mito.value,
            realidad: f.realidad.value,
            ctaTexto: f.ctaTexto.value,
            ctaRuta: f.ctaRuta.value
          });
          if (res.ok) {
            ui.editingLessonId = null;
            utils.showToast("Lección guardada.", "ok");
            paint();
          } else {
            utils.showToast(res.error || "Revisa los campos obligatorios de la lección.", "error");
          }
        });
      }

      vista.querySelectorAll("[data-edit-quiz]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          ui.editingQuizId = this.getAttribute("data-edit-quiz");
          paint();
          scrollIntoViewSmooth(vista.querySelector("#form-admin-quiz"));
        });
      });

      vista.querySelectorAll("[data-delete-quiz]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          var id = this.getAttribute("data-delete-quiz");
          if (!confirmAction("¿Eliminar esta pregunta del quiz?")) {
            return;
          }
          var res = store.deleteAcademyQuestion(id);
          if (res.ok) {
            if (ui.editingQuizId === id) { ui.editingQuizId = null; }
            utils.showToast("Pregunta eliminada.", "info");
            paint();
          } else {
            utils.showToast(res.error || "No se pudo eliminar la pregunta.", "error");
          }
        });
      });

      var cancelQuizBtn = vista.querySelector("#btn-cancel-quiz");
      if (cancelQuizBtn) {
        cancelQuizBtn.addEventListener("click", function () {
          ui.editingQuizId = null;
          paint();
        });
      }

      var quizForm = vista.querySelector("#form-admin-quiz");
      if (quizForm) {
        quizForm.addEventListener("submit", function (e) {
          e.preventDefault();
          var optCount = Number(quizForm.getAttribute("data-opt-count")) || 3;
          var opciones = [];
          for (var i = 0; i < optCount; i++) {
            var txtEl = quizForm.elements["opTexto_" + i];
            var ptsEl = quizForm.elements["opPuntos_" + i];
            if (txtEl && txtEl.value.trim()) {
              opciones.push({
                texto: txtEl.value.trim(),
                puntos: Number(ptsEl ? ptsEl.value : 0)
              });
            }
          }
          var res = store.upsertAcademyQuestion({
            id: ui.editingQuizId || undefined,
            pregunta: quizForm.elements.pregunta.value,
            explicacion: quizForm.elements.explicacion.value,
            opciones: opciones
          });
          if (res.ok) {
            ui.editingQuizId = null;
            utils.showToast("Pregunta del quiz guardada.", "ok");
            paint();
          } else {
            utils.showToast(res.error || "Revisa la pregunta y sus opciones.", "error");
          }
        });
      }
    }

    function bindSiteAndSystemEvents() {
      var siteForm = vista.querySelector("#form-admin-site");
      if (siteForm) {
        siteForm.addEventListener("submit", function (e) {
          e.preventDefault();
          var f = siteForm.elements;
          var res = store.updateSiteConfig({
            nombreMarca: f.nombreMarca.value,
            portadaKicker: f.portadaKicker.value,
            portadaTitulo: f.portadaTitulo.value,
            portadaDescripcion: f.portadaDescripcion.value,
            portadaCtaTexto: f.portadaCtaTexto.value,
            subtituloPie: f.subtituloPie.value,
            avisoPie: f.avisoPie.value,
            whatsappContacto: f.whatsappContacto.value,
            correoContacto: f.correoContacto.value
          });
          if (res.ok) {
            utils.showToast("Configuración del sitio actualizada.", "ok");
            paint();
          } else {
            utils.showToast(res.error || "Error al guardar la configuración.", "error");
          }
        });
      }

      var statsForm = vista.querySelector("#form-admin-stats");
      if (statsForm) {
        statsForm.addEventListener("submit", function (e) {
          e.preventDefault();
          var f = statsForm.elements;
          var res = store.updateBaseStats({
            adoptados: Number(f.adoptados.value),
            enProceso: Number(f.enProceso.value),
            atendidos: Number(f.atendidos.value)
          });
          if (res.ok) {
            utils.showToast("Métricas actualizadas.", "ok");
            paint();
          } else {
            utils.showToast(res.error || "Valores inválidos para las métricas.", "error");
          }
        });
      }

      var authForm = vista.querySelector("#form-admin-auth");
      if (authForm) {
        authForm.addEventListener("submit", function (e) {
          e.preventDefault();
          var f = authForm.elements;
          var res = store.updateAdminCredentials({
            usuario: f.usuario.value,
            clave: f.clave.value
          });
          if (res.ok) {
            utils.showToast("Credenciales de acceso actualizadas.", "ok");
            paint();
          } else {
            utils.showToast(res.error || "Credenciales inválidas.", "error");
          }
        });
      }

      var exportBtn = vista.querySelector("#btn-export-backup");
      if (exportBtn) {
        exportBtn.addEventListener("click", function () {
          var backup = store.exportBackup();
          var dateTag = new Date().toISOString().slice(0, 10);
          var downloaded = downloadJsonFile("amiuni-respaldo-" + dateTag + ".json", backup);
          utils.showToast(downloaded ? "Respaldo JSON descargado." : "Respaldo generado (descarga no disponible en este entorno).", downloaded ? "ok" : "info");
        });
      }

      var importInput = vista.querySelector("#input-import-backup");
      if (importInput) {
        importInput.addEventListener("change", function () {
          var file = this.files && this.files[0];
          if (!file) { return; }
          var handleText = function (rawText) {
            var res = store.importBackup(rawText);
            if (res.ok) {
              resetEditingState();
              utils.showToast("Respaldo JSON importado correctamente.", "ok");
              paint();
            } else {
              utils.showToast(res.error || "El respaldo JSON no es válido.", "error");
            }
          };
          if (typeof file.text === "function") {
            file.text().then(handleText).catch(function () {
              utils.showToast("No se pudo leer el archivo seleccionado.", "error");
            });
          } else if (typeof FileReader !== "undefined") {
            var reader = new FileReader();
            reader.onload = function () { handleText(String(reader.result || "")); };
            reader.onerror = function () { utils.showToast("No se pudo leer el archivo seleccionado.", "error"); };
            reader.readAsText(file);
          }
          this.value = "";
        });
      }

      var resetBtn = vista.querySelector("#btn-reset-demo");
      if (resetBtn) {
        resetBtn.addEventListener("click", function () {
          if (!confirmAction("¿Restablecer todos los datos de demostración? Se perderán los cambios locales.")) {
            return;
          }
          store.resetDemoData();
          resetEditingState();
          utils.showToast("Datos de demostración restablecidos.", "info");
          paint();
        });
      }
    }

    function bindPanelEvents() {
      vista.querySelector("#btn-admin-logout").addEventListener("click", function () {
        store.logoutAdmin();
        resetEditingState();
        utils.showToast("Sesión cerrada.", "info");
        paint();
      });

      vista.querySelectorAll("[data-tab]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          ui.tab = this.getAttribute("data-tab");
          paint();
        });
      });

      bindRequestAndAnimalEvents();
      bindDonationsAndPaymentsEvents();
      bindAcademyEvents();
      bindSiteAndSystemEvents();
    }

    paint();
  }

  App.views.admin = renderAdmin;
})(typeof globalThis !== "undefined" ? globalThis : window);
