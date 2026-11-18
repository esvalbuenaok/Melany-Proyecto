"use strict";

var path = require("node:path");
var harness = require("./helpers/test-harness");
var datos = require(path.join(__dirname, "../maqueta/js/datos"));
var filters = require(path.join(__dirname, "../maqueta/js/modules/filters"));

var suite = harness.createSuite("filters");

suite.test("isCompatible verifica compatibilidad por propiedad y respaldo por etiquetas", function (assert) {
  var luna = datos.animales[0];
  var rocky = datos.animales[3];

  assert.equal(filters.isCompatible(luna, "apartamento"), true);
  assert.equal(filters.isCompatible(luna, "otrosGatos"), false);
  assert.equal(filters.isCompatible(rocky, "apartamento"), false);
  assert.equal(filters.isCompatible(rocky, "ninos"), true);

  var legacy = { etiquetas: ["Apto para niños", "Sociable con gatos"] };
  assert.equal(filters.isCompatible(legacy, "ninos"), true);
  assert.equal(filters.isCompatible(legacy, "otrosGatos"), true);
  assert.equal(filters.isCompatible(legacy, "apartamento"), false);
});

suite.test("matchesSearch ignora tildes, mayusculas y soporta multiples palabras", function (assert) {
  var rocky = datos.animales[3];
  assert.equal(filters.matchesSearch(rocky, "merida"), true);
  assert.equal(filters.matchesSearch(rocky, "MÉRIDA noble"), true);
  assert.equal(filters.matchesSearch(rocky, "correa grande"), true);
  assert.equal(filters.matchesSearch(rocky, "gato"), false);
  assert.equal(filters.matchesSearch(rocky, ""), true);
});

suite.test("filterAnimals filtra por especie, edad, tamano, sexo, compatibilidad, disponibles y favoritos", function (assert) {
  var animales = datos.animales;

  var gatos = filters.filterAnimals(animales, { especie: "gato" });
  assert.deepEqual(gatos.map(function (a) { return a.id; }), ["mora", "nina"]);

  var disponibles = filters.filterAnimals(animales, { soloDisponibles: true });
  assert.equal(disponibles.length, 5);
  assert.equal(disponibles.some(function (a) { return a.id === "rocky"; }), false);

  var favs = filters.filterAnimals(animales, { soloFavoritos: true }, ["luna", "bruno"]);
  assert.deepEqual(favs.map(function (a) { return a.id; }), ["luna", "bruno"]);

  var compatMulti = filters.filterAnimals(animales, { compatibilidad: ["apartamento", "otrosGatos"] });
  assert.deepEqual(compatMulti.map(function (a) { return a.id; }), ["toby", "mora", "nina", "bruno"]);

  var ordenNombre = filters.filterAnimals(animales, { orden: "nombre" });
  assert.equal(ordenNombre[0].nombre, "Bruno");
  assert.equal(ordenNombre[ordenNombre.length - 1].nombre, "Toby");
});

suite.test("countActiveFilters cuenta criterios activos sin contar ordenamiento", function (assert) {
  assert.equal(filters.countActiveFilters(filters.DEFAULT_FILTERS), 0);
  assert.equal(filters.countActiveFilters({
    especie: "perro",
    busqueda: "merida",
    compatibilidad: ["ninos", "apartamento"],
    soloDisponibles: true,
    orden: "nombre"
  }), 5);
});

suite.test("summarizeResults formatea conteo total y filtrado", function (assert) {
  assert.equal(filters.summarizeResults(6, 6), "6 animales");
  assert.equal(filters.summarizeResults(6, 2), "2 de 6 animales");
  assert.equal(filters.summarizeResults(1, 1), "1 animal");
  assert.equal(filters.summarizeResults(6, 0), "0 de 6 animales");
});

if (require.main === module) {
  harness.runSingleSuite(suite);
}

module.exports = suite;
