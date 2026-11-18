"use strict";

var path = require("node:path");
var harness = require("./helpers/test-harness");
var validators = require(path.join(__dirname, "../maqueta/js/modules/validators"));

var suite = harness.createSuite("validators");

suite.test("ADOPTION_STEPS define 3 pasos con sus campos", function (assert) {
  assert.equal(validators.ADOPTION_STEPS.length, 3);
  assert.deepEqual(validators.ADOPTION_STEPS[0].fields, ["nombre", "telefono", "correo"]);
  assert.deepEqual(validators.ADOPTION_STEPS[1].fields, ["vivienda", "otros", "ninos", "motivo"]);
  assert.deepEqual(validators.ADOPTION_STEPS[2].fields, ["visita"]);
});

suite.test("validateAdoptionField valida cada campo correctamente", function (assert) {
  assert.equal(validators.validateAdoptionField("nombre", "Lu").valid, false);
  assert.equal(validators.validateAdoptionField("nombre", "Lucia").valid, true);

  assert.equal(validators.validateAdoptionField("telefono", "123").valid, false);
  assert.equal(validators.validateAdoptionField("telefono", "+58 412 5551234").valid, true);

  assert.equal(validators.validateAdoptionField("correo", "no-es-correo").valid, false);
  assert.equal(validators.validateAdoptionField("correo", "lucia@amiuni.org").valid, true);

  assert.equal(validators.validateAdoptionField("motivo", "Muy corto").valid, false);
  assert.equal(validators.validateAdoptionField("motivo", "Quiero darle un hogar lleno de amor.").valid, true);

  assert.equal(validators.validateAdoptionField("visita", "").valid, false);
  assert.equal(validators.validateAdoptionField("visita", "si").valid, true);
  assert.equal(validators.validateAdoptionField("visita", true).valid, true);
});

suite.test("validateAdoptionStep valida paso por paso", function (assert) {
  var datos = harness.makeValidAdoptionData({ telefono: "bad" });
  var step0 = validators.validateAdoptionStep(0, datos);
  assert.equal(step0.valid, false);
  assert.ok(step0.errors.telefono);

  var step1 = validators.validateAdoptionStep(1, datos);
  assert.equal(step1.valid, true);
  assert.deepEqual(step1.errors, {});

  var invalidStep = validators.validateAdoptionStep(9, datos);
  assert.equal(invalidStep.valid, false);
});

suite.test("validateAdoptionFull valida formulario completo", function (assert) {
  var validData = harness.makeValidAdoptionData();
  assert.equal(validators.validateAdoptionFull(validData).valid, true);

  var invalidData = harness.makeValidAdoptionData({ nombre: "", visita: "" });
  var res = validators.validateAdoptionFull(invalidData);
  assert.equal(res.valid, false);
  assert.ok(res.errors.nombre);
  assert.ok(res.errors.visita);
});

suite.test("validateDonation aplica reglas de monto, metodo, referencia, donante y mensaje", function (assert) {
  var okRes = validators.validateDonation(harness.makeValidDonationData());
  assert.equal(okRes.valid, true);

  var badBounds = validators.validateDonation(harness.makeValidDonationData({ monto: 0 }));
  assert.equal(badBounds.valid, false);
  assert.ok(badBounds.errors.monto);

  var overLimit = validators.validateDonation(harness.makeValidDonationData({ monto: 50001 }));
  assert.equal(overLimit.valid, false);
  assert.ok(overLimit.errors.monto);

  var badMethod = validators.validateDonation(harness.makeValidDonationData({ metodo: "efectivo" }));
  assert.equal(badMethod.valid, false);
  assert.ok(badMethod.errors.metodo);

  var badRef = validators.validateDonation(harness.makeValidDonationData({ referencia: "12" }));
  assert.equal(badRef.valid, false);
  assert.ok(badRef.errors.referencia);

  var anonOk = validators.validateDonation(harness.makeValidDonationData({
    anonimo: true,
    donanteNombre: "",
    donanteCorreo: ""
  }));
  assert.equal(anonOk.valid, true);

  var namedMissing = validators.validateDonation(harness.makeValidDonationData({
    anonimo: false,
    donanteNombre: ""
  }));
  assert.equal(namedMissing.valid, false);
  assert.ok(namedMissing.errors.donanteNombre);

  var badEmail = validators.validateDonation(harness.makeValidDonationData({
    donanteCorreo: "correo-malo"
  }));
  assert.equal(badEmail.valid, false);
  assert.ok(badEmail.errors.donanteCorreo);

  var longMsg = validators.validateDonation(harness.makeValidDonationData({
    mensaje: "a".repeat(241)
  }));
  assert.equal(longMsg.valid, false);
  assert.ok(longMsg.errors.mensaje);
});

suite.test("validateAnimalInput valida alta y edicion de animales", function (assert) {
  var ok = validators.validateAnimalInput(harness.makeValidAnimalData());
  assert.equal(ok.valid, true);

  var bad = validators.validateAnimalInput({
    nombre: "A",
    especie: "conejo",
    sexo: "otro",
    edad: "bebe",
    edadTexto: "",
    tamano: "gigante",
    estado: "perdido",
    historia: "corta",
    apadrinamientoMensual: -5
  });
  assert.equal(bad.valid, false);
  assert.ok(bad.errors.nombre);
  assert.ok(bad.errors.especie);
  assert.ok(bad.errors.sexo);
  assert.ok(bad.errors.edad);
  assert.ok(bad.errors.edadTexto);
  assert.ok(bad.errors.tamano);
  assert.ok(bad.errors.estado);
  assert.ok(bad.errors.historia);
  assert.ok(bad.errors.apadrinamientoMensual);
});

suite.test("validateTrackingCode acepta AMI/DON validos y rechaza otros formatos", function (assert) {
  var r1 = validators.validateTrackingCode("  ami-ab12cd ");
  assert.equal(r1.valid, true);
  assert.equal(r1.code, "AMI-AB12CD");

  var r2 = validators.validateTrackingCode("DON-9988");
  assert.equal(r2.valid, true);

  assert.equal(validators.validateTrackingCode("XYZ-12345").valid, false);
  assert.equal(validators.validateTrackingCode("AMI-12").valid, false);
  assert.equal(validators.validateTrackingCode("AMI-123456789").valid, false);
});

if (require.main === module) {
  harness.runSingleSuite(suite);
}

module.exports = suite;
