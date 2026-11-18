"use strict";

var assert = require("node:assert/strict");
var path = require("node:path");

var datos = require(path.join(__dirname, "../../maqueta/js/datos"));
var utils = require(path.join(__dirname, "../../maqueta/js/modules/utils"));
var storeModule = require(path.join(__dirname, "../../maqueta/js/modules/store"));

function createSuite(name) {
  var cases = [];

  function test(title, fn) {
    cases.push({ title: title, fn: fn });
  }

  async function run() {
    var passed = 0;
    var failed = 0;
    var failures = [];

    for (var i = 0; i < cases.length; i++) {
      var c = cases[i];
      try {
        await c.fn(assert);
        passed++;
      } catch (err) {
        failed++;
        failures.push({ title: c.title, error: err });
      }
    }

    return {
      name: name,
      total: cases.length,
      passed: passed,
      failed: failed,
      failures: failures
    };
  }

  return {
    name: name,
    test: test,
    run: run
  };
}

function createMockStorage(initial) {
  var map = Object.assign({}, initial || {});
  return {
    getItem: function (key) {
      return Object.prototype.hasOwnProperty.call(map, key) ? map[key] : null;
    },
    setItem: function (key, value) {
      map[key] = String(value);
    },
    removeItem: function (key) {
      delete map[key];
    },
    _dump: function () {
      return Object.assign({}, map);
    }
  };
}

function createTestStore(options) {
  var opts = options || {};
  var storage = opts.storage || createMockStorage(opts.initialStorage);
  var sessionStorage = opts.sessionStorage || createMockStorage(opts.initialSessionStorage);
  var seed = opts.seed || utils.deepClone(datos);
  var store = storeModule.createStore({
    seed: seed,
    storage: storage,
    storageKey: opts.storageKey || "amiuni_test_v1",
    sessionStorage: sessionStorage,
    sessionKey: opts.sessionKey || "amiuni_test_session_v1"
  });
  store.init();
  return { store: store, storage: storage, sessionStorage: sessionStorage, seed: seed };
}

function makeValidAdoptionData(overrides) {
  return Object.assign({
    nombre: "Ana Maria Perez",
    telefono: "0414 1234567",
    correo: "ana.perez@example.com",
    vivienda: "Apartamento",
    otros: "No",
    ninos: "Sí",
    motivo: "Buscamos un compañero tranquilo para darle mucho cariño y paseos.",
    visita: "si"
  }, overrides || {});
}

function makeValidDonationData(overrides) {
  return Object.assign({
    monto: 25,
    metodo: "pago_movil",
    referencia: "PM-987654",
    anonimo: false,
    donanteNombre: "Carlos Rojas",
    donanteCorreo: "carlos@example.com",
    padrino: false,
    mensaje: "Para los perritos de Mérida"
  }, overrides || {});
}

function makeValidAnimalData(overrides) {
  return Object.assign({
    nombre: "Canela",
    especie: "perro",
    sexo: "hembra",
    edad: "joven",
    edadTexto: "2 años",
    tamano: "mediano",
    estado: "disponible",
    historia: "Rescatada en el centro de Mérida, muy noble y sociable con personas.",
    apadrinamientoMensual: 22,
    salud: { esterilizado: true, vacunas: true, desparasitado: true },
    compatibilidad: { ninos: true, apartamento: true, otrosPerros: true, otrosGatos: false },
    etiquetas: ["Apta para apartamentos", "Sociable con perros"]
  }, overrides || {});
}

async function runSingleSuite(suite) {
  var result = await suite.run();
  console.log("Suite: " + result.name + " (" + result.passed + "/" + result.total + " passed)");
  result.failures.forEach(function (f) {
    console.error("  FAIL: " + f.title);
    console.error("    " + (f.error && f.error.stack ? f.error.stack : f.error));
  });
  if (result.failed > 0) {
    process.exitCode = 1;
  }
  return result;
}

module.exports = {
  assert: assert,
  createSuite: createSuite,
  createMockStorage: createMockStorage,
  createTestStore: createTestStore,
  makeValidAdoptionData: makeValidAdoptionData,
  makeValidDonationData: makeValidDonationData,
  makeValidAnimalData: makeValidAnimalData,
  runSingleSuite: runSingleSuite
};
