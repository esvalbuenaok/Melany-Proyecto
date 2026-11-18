"use strict";

var path = require("node:path");
var harness = require("./helpers/test-harness");
var datos = require(path.join(__dirname, "../maqueta/js/datos"));
var tangram = require(path.join(__dirname, "../maqueta/js/modules/tangram"));

var suite = harness.createSuite("tangram");

function triangleArea(pts) {
  var x1 = pts[0], y1 = pts[1];
  var x2 = pts[2], y2 = pts[3];
  var x3 = pts[4], y3 = pts[5];
  return Math.abs((x2 - x1) * (y3 - y1) - (x3 - x1) * (y2 - y1)) / 2;
}

suite.test("SHARD_COUNT es 24 y todas las siluetas tienen 24 triangulos validos", function (assert) {
  assert.equal(tangram.SHARD_COUNT, 24);
  var keys = Object.keys(tangram.PRESETS);
  assert.ok(keys.length >= 6);

  keys.forEach(function (key) {
    var shards = tangram.PRESETS[key];
    assert.equal(shards.length, 24, key + " debe tener 24 triangulos");
    shards.forEach(function (sh, idx) {
      assert.ok(Array.isArray(sh.points) && sh.points.length === 6, key + "[" + idx + "] debe tener 6 coordenadas");
      for (var i = 0; i < 6; i += 2) {
        var x = sh.points[i];
        var y = sh.points[i + 1];
        assert.ok(Number.isFinite(x) && x >= 0 && x <= 400, key + "[" + idx + "] x fuera de rango: " + x);
        assert.ok(Number.isFinite(y) && y >= 0 && y <= 320, key + "[" + idx + "] y fuera de rango: " + y);
      }
      assert.ok(triangleArea(sh.points) > 1, key + "[" + idx + "] no debe ser un triangulo degenerado");
      assert.match(sh.color, /^#[0-9a-fA-F]{6}$/, key + "[" + idx + "] color hexadecimal valido");
    });
  });
});

suite.test("getPresetForAnimal mapea cada animal de datos.js y casos limite a siluetas de 24 piezas", function (assert) {
  assert.equal(tangram.getPresetForAnimal(datos.animales[0]).id, "perro_mediano");
  assert.equal(tangram.getPresetForAnimal(datos.animales[1]).id, "cachorro");
  assert.equal(tangram.getPresetForAnimal(datos.animales[2]).id, "gato");
  assert.equal(tangram.getPresetForAnimal(datos.animales[3]).id, "perro_grande");
  assert.equal(tangram.getPresetForAnimal(datos.animales[4]).id, "gatito");
  assert.equal(tangram.getPresetForAnimal(datos.animales[5]).id, "perro_senior");

  datos.animales.forEach(function (animal) {
    var preset = tangram.getPresetForAnimal(animal);
    assert.equal(preset.shards.length, 24);
  });

  assert.equal(tangram.getPresetForAnimal(null).shards.length, 24);
});

suite.test("interpolateShards interpola coordenadas y colores en t=0, t=0.5 y t=1", function (assert) {
  var fromShards = tangram.getPresetForAnimal(datos.animales[0]).shards;
  var toShards = tangram.getPresetForAnimal(datos.animales[2]).shards;

  var at0 = tangram.interpolateShards(fromShards, toShards, 0);
  assert.equal(at0.length, 24);
  assert.deepEqual(at0[0].points, fromShards[0].points);
  assert.equal(at0[0].color.toLowerCase(), fromShards[0].color.toLowerCase());

  var at1 = tangram.interpolateShards(fromShards, toShards, 1);
  assert.equal(at1.length, 24);
  assert.deepEqual(at1[0].points, toShards[0].points);
  assert.equal(at1[0].color.toLowerCase(), toShards[0].color.toLowerCase());

  var atHalf = tangram.interpolateShards(fromShards, toShards, 0.5);
  assert.equal(atHalf.length, 24);
  for (var i = 0; i < 24; i++) {
    for (var p = 0; p < 6; p++) {
      var expected = Number(((fromShards[i].points[p] + toShards[i].points[p]) / 2).toFixed(2));
      assert.equal(atHalf[i].points[p], expected);
    }
    assert.match(atHalf[i].color, /^#[0-9a-fA-F]{6}$/);
  }

  // Clamping fuera de [0, 1]
  assert.deepEqual(tangram.interpolateShards(fromShards, toShards, -2)[0].points, fromShards[0].points);
  assert.deepEqual(tangram.interpolateShards(fromShards, toShards, 3)[0].points, toShards[0].points);
});

if (require.main === module) {
  harness.runSingleSuite(suite);
}

module.exports = suite;
