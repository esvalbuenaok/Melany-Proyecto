/* Validadores de formularios y datos de dominio para Amiuni. */
(function (root) {
  "use strict";

  var App = (root.AmiuniApp = root.AmiuniApp || {});

  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  var PHONE_RE = /^[0-9+\s()-]{10,16}$/;
  var REF_RE = /^[a-zA-Z0-9\-_.]{4,30}$/;
  var TRACKING_RE = /^(AMI|DON)-[A-Z0-9]{4,8}$/;

  var VALID_PAYMENT_METHODS = ["pago_movil", "transferencia", "zelle"];
  var VALID_SPECIES = ["perro", "gato"];
  var VALID_SEXES = ["hembra", "macho"];
  var VALID_AGES = ["cachorro", "joven", "adulto", "senior"];
  var VALID_SIZES = ["pequeño", "mediano", "grande"];
  var VALID_ANIMAL_STATUSES = ["disponible", "proceso", "adoptado"];

  var ADOPTION_STEPS = [
    { id: "datos", label: "Tus datos", fields: ["nombre", "telefono", "correo"] },
    { id: "hogar", label: "Tu hogar", fields: ["vivienda", "otros", "ninos", "motivo"] },
    { id: "confirmar", label: "Confirmar", fields: ["visita"] }
  ];

  function str(v) {
    return String(v == null ? "" : v).trim();
  }

  function ok() {
    return { valid: true, error: "" };
  }

  function fail(msg) {
    return { valid: false, error: msg };
  }

  var ADOPTION_RULES = {
    nombre: function (v) {
      return str(v).length >= 3 ? ok() : fail("Escribe tu nombre completo.");
    },
    telefono: function (v) {
      return PHONE_RE.test(str(v)) ? ok() : fail("Escribe un teléfono válido, por ejemplo 0412 1234567.");
    },
    correo: function (v) {
      return EMAIL_RE.test(str(v)) ? ok() : fail("Escribe un correo válido.");
    },
    vivienda: function (v) {
      return str(v).length > 0 ? ok() : fail("Elige una opción.");
    },
    otros: function (v) {
      return str(v).length > 0 ? ok() : fail("Elige una opción.");
    },
    ninos: function (v) {
      return str(v).length > 0 ? ok() : fail("Elige una opción.");
    },
    motivo: function (v) {
      return str(v).length >= 15 ? ok() : fail("Cuéntanos un poco más (mínimo 15 caracteres).");
    },
    visita: function (v) {
      return v === "si" || v === true ? ok() : fail("Debes aceptar para continuar.");
    }
  };

  function validateAdoptionField(field, value) {
    var rule = ADOPTION_RULES[field];
    if (!rule) {
      return fail("Campo desconocido.");
    }
    return rule(value);
  }

  function validateFieldList(fields, datos) {
    var data = datos || {};
    var errors = {};
    var valid = true;

    fields.forEach(function (field) {
      var res = validateAdoptionField(field, data[field]);
      if (!res.valid) {
        errors[field] = res.error;
        valid = false;
      }
    });

    return { valid: valid, errors: errors };
  }

  function validateAdoptionStep(stepIndex, datos) {
    var step = ADOPTION_STEPS[stepIndex];
    if (!step) {
      return { valid: false, errors: { general: "Paso de adopción inválido." } };
    }
    return validateFieldList(step.fields, datos);
  }

  function validateAdoptionFull(datos) {
    var allFields = [];
    ADOPTION_STEPS.forEach(function (step) {
      allFields = allFields.concat(step.fields);
    });
    return validateFieldList(allFields, datos);
  }

  function validateDonation(payload) {
    var p = payload || {};
    var errors = {};
    var monto = Number(p.monto);

    if (!Number.isFinite(monto) || monto < 1 || monto > 50000) {
      errors.monto = "El monto debe estar entre $1 y $50000.";
    }

    if (VALID_PAYMENT_METHODS.indexOf(p.metodo) === -1) {
      errors.metodo = "Selecciona un medio de pago válido.";
    }

    if (!REF_RE.test(str(p.referencia))) {
      errors.referencia = "Ingresa una referencia válida (4 a 30 caracteres alfanuméricos, '-', '_' o '.').";
    }

    if (p.anonimo !== true && str(p.donanteNombre).length < 2) {
      errors.donanteNombre = "Escribe tu nombre o marca la donación como anónima.";
    }

    var correo = str(p.donanteCorreo);
    if (correo && !EMAIL_RE.test(correo)) {
      errors.donanteCorreo = "Escribe un correo electrónico válido.";
    }

    var mensaje = p.mensaje == null ? "" : String(p.mensaje);
    if (mensaje.length > 240) {
      errors.mensaje = "El mensaje no puede superar los 240 caracteres.";
    }

    return { valid: Object.keys(errors).length === 0, errors: errors };
  }

  function validateAnimalInput(payload) {
    var p = payload || {};
    var errors = {};

    if (str(p.nombre).length < 2) {
      errors.nombre = "Escribe el nombre del animal (mínimo 2 caracteres).";
    }
    if (VALID_SPECIES.indexOf(p.especie) === -1) {
      errors.especie = "Selecciona una especie válida (perro o gato).";
    }
    if (VALID_SEXES.indexOf(p.sexo) === -1) {
      errors.sexo = "Selecciona un sexo válido (hembra o macho).";
    }
    if (VALID_AGES.indexOf(p.edad) === -1) {
      errors.edad = "Selecciona una etapa de edad válida.";
    }
    if (!str(p.edadTexto)) {
      errors.edadTexto = "Indica la edad aproximada (ej. 2 años).";
    }
    if (VALID_SIZES.indexOf(p.tamano) === -1) {
      errors.tamano = "Selecciona un tamaño válido.";
    }
    if (p.estado != null && p.estado !== "" && VALID_ANIMAL_STATUSES.indexOf(p.estado) === -1) {
      errors.estado = "Estado del animal inválido.";
    }
    if (str(p.historia).length < 10) {
      errors.historia = "Escribe una breve historia (mínimo 10 caracteres).";
    }
    if (p.apadrinamientoMensual != null && p.apadrinamientoMensual !== "") {
      var apad = Number(p.apadrinamientoMensual);
      if (!Number.isFinite(apad) || apad < 0 || apad > 5000) {
        errors.apadrinamientoMensual = "El apadrinamiento mensual debe estar entre $0 y $5000.";
      }
    }

    return { valid: Object.keys(errors).length === 0, errors: errors };
  }

  function validateTrackingCode(code) {
    var normalized = str(code).toUpperCase();
    if (!TRACKING_RE.test(normalized)) {
      return {
        valid: false,
        code: normalized,
        error: "Código inválido. Debe tener el formato AMI-XXXXXX o DON-XXXXXX."
      };
    }
    return { valid: true, code: normalized, error: "" };
  }

  var api = {
    ADOPTION_STEPS: ADOPTION_STEPS,
    VALID_PAYMENT_METHODS: VALID_PAYMENT_METHODS,
    VALID_ANIMAL_STATUSES: VALID_ANIMAL_STATUSES,
    validateAdoptionField: validateAdoptionField,
    validateAdoptionStep: validateAdoptionStep,
    validateAdoptionFull: validateAdoptionFull,
    validateDonation: validateDonation,
    validateAnimalInput: validateAnimalInput,
    validateTrackingCode: validateTrackingCode
  };

  App.validators = api;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : window);
