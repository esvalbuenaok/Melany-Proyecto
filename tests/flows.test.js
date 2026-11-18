"use strict";

var path = require("node:path");
var harness = require("./helpers/test-harness");
var utils = require(path.join(__dirname, "../maqueta/js/modules/utils"));
var validators = require(path.join(__dirname, "../maqueta/js/modules/validators"));
var routerMod = require(path.join(__dirname, "../maqueta/js/modules/router"));
var storeMod = require(path.join(__dirname, "../maqueta/js/modules/store"));

var suite = harness.createSuite("flows");

suite.test("flujo completo de adopcion, persistencia, seguimiento y revision admin", function (assert) {
  var sharedStorage = harness.createMockStorage();
  var ctx1 = harness.createTestStore({ storage: sharedStorage, storageKey: "amiuni_flow" });
  var store1 = ctx1.store;

  // 1. Guardar borrador paso a paso
  var partial = { nombre: "Mariana", telefono: "0412 5550000", correo: "mariana@example.com" };
  assert.equal(validators.validateAdoptionStep(0, partial).valid, true);
  store1.saveAdoptionDraft("toby", { paso: 1, datos: partial });

  // 2. Simular recarga de pagina con mismo storage
  var store2 = storeMod.createStore({ storage: sharedStorage, storageKey: "amiuni_flow" });
  store2.init();
  var restoredDraft = store2.getAdoptionDraft("toby");
  assert.equal(restoredDraft.paso, 1);
  assert.equal(restoredDraft.datos.nombre, "Mariana");

  // 3. Enviar solicitud completa
  var submitted = store2.submitAdoption("toby", harness.makeValidAdoptionData(partial));
  assert.equal(submitted.ok, true);
  var code = submitted.solicitud.codigo;
  assert.equal(validators.validateTrackingCode(code).valid, true);

  // 4. Consultar seguimiento por codigo (case-insensitive)
  var tracked = store2.getRequestByCode(code.toLowerCase());
  assert.ok(tracked);
  assert.equal(tracked.animalId, "toby");
  assert.equal(tracked.estado, "pendiente");

  // 5. Admin revisa y aprueba
  store2.updateRequestStatus(code, "en_revision", "Llamada agendada");
  assert.equal(store2.getAnimalById("toby").estado, "proceso");

  store2.updateRequestStatus(code, "aprobada", "Adopción concretada");
  assert.equal(store2.getAnimalById("toby").estado, "adoptado");
  assert.equal(store2.getRequestByCode(code).notaAdmin, "Adopción concretada");
  assert.equal(store2.getStats().adoptados, 129);
});

suite.test("flujo completo de donacion, medios de pago, seguimiento y verificacion", function (assert) {
  var ctx = harness.createTestStore();
  var store = ctx.store;

  var methods = store.getPaymentMethods();
  assert.ok(methods.pago_movil.telefono);
  assert.ok(methods.transferencia.cuenta);
  assert.ok(methods.zelle.correo);

  var testimonials = store.getTestimonials();
  assert.equal(testimonials.length, 2);
  assert.ok(testimonials[0].id);
  assert.ok(testimonials[0].fecha);

  var res = store.submitDonation(harness.makeValidDonationData({
    monto: 45,
    metodo: "zelle",
    referencia: "ZELLE-7788",
    anonimo: true,
    padrino: true,
    animalId: "mora"
  }));
  assert.equal(res.ok, true);
  assert.equal(res.donacion.donanteNombre, "Donante anónimo");
  assert.equal(res.meta.recaudado, 455);

  var tracked = store.getDonationByCode(res.donacion.codigo);
  assert.equal(tracked.estado, "pendiente");
  assert.equal(tracked.padrino, true);

  store.updateDonationStatus(res.donacion.codigo, "verificada", "Recibido en cuenta");
  assert.equal(store.getDonationByCode(res.donacion.codigo).estado, "verificada");
  assert.equal(store.getMeta().recaudado, 455);
});

suite.test("router.parseHash y despacho de rutas cubren todas las rutas especificadas", function (assert) {
  assert.deepEqual(routerMod.parseHash(""), { name: "inicio", params: [], query: {} });
  assert.deepEqual(routerMod.parseHash("#/"), { name: "inicio", params: [], query: {} });
  assert.deepEqual(routerMod.parseHash("#/animal/luna"), { name: "animal", params: ["luna"], query: {} });
  assert.deepEqual(routerMod.parseHash("#/adopcion/rocky"), { name: "adopcion", params: ["rocky"], query: {} });
  assert.deepEqual(routerMod.parseHash("#/donar?animal=mora&monto=20"), {
    name: "donar",
    params: [],
    query: { animal: "mora", monto: "20" }
  });
  assert.deepEqual(routerMod.parseHash("#/seguimiento/AMI-123456"), {
    name: "seguimiento",
    params: ["AMI-123456"],
    query: {}
  });
  assert.deepEqual(routerMod.parseHash("#/academia"), { name: "academia", params: [], query: {} });
  assert.deepEqual(routerMod.parseHash("#/academy"), { name: "academia", params: [], query: {} });
  assert.deepEqual(routerMod.parseHash("#/admin"), { name: "admin", params: [], query: {} });

  var router = routerMod.createRouter();
  var visited = [];
  router.register("inicio", function (r) { visited.push(r.name); });
  router.register("seguimiento", function (r) { visited.push(r.name + ":" + (r.params[0] || "")); });
  router.register("academia", function (r) { visited.push(r.name); });
  router.register("notFound", function (r) { visited.push("404:" + r.name); });

  router.start();
  router.navigate("#/seguimiento/DON-554433");
  router.navigate("#/academia");
  router.navigate("#/academy");
  router.navigate("#/ruta-inexistente");
  router.stop();

  assert.deepEqual(visited, ["inicio", "seguimiento:DON-554433", "academia", "academia", "404:ruta-inexistente"]);
});

suite.test("utils provee iconos, escape, formato, codigos unicos y promesas de compartir/copiar", async function (assert) {
  var expectedIcons = [
    "jeringa", "huella", "corazon", "corazonLleno",
    "casa", "ok", "buscar", "compartir", "copiar", "alerta"
  ];
  expectedIcons.forEach(function (k) {
    assert.ok(typeof utils.ICONOS[k] === "string" && utils.ICONOS[k].indexOf("<svg") !== -1);
  });

  assert.equal(utils.esc('<script>"&\''), "&lt;script&gt;&quot;&amp;&#39;");
  assert.equal(utils.cap("luna"), "Luna");
  assert.equal(utils.normalizeText("  Mérida  "), "merida");
  assert.equal(utils.formatUSD(45), "$45");
  assert.equal(utils.formatUSD(12.5), "$12.50");
  assert.ok(utils.formatDate("2026-10-02").indexOf("2026") !== -1);

  var code = utils.generateCode("AMI", ["AMI-AAAAAA"], function () { return 0; });
  assert.notEqual(code, "AMI-AAAAAA");
  assert.match(code, /^AMI-[A-Z0-9]{4,8}$/);

  var copied = await utils.copyText("AMI-123456");
  assert.equal(typeof copied, "boolean");

  var shared = await utils.shareContent({ title: "Luna", text: "Adopta a Luna", url: "#/animal/luna" });
  assert.equal(typeof shared.shared, "boolean");

  assert.equal(utils.showToast("Hola"), null);
});

if (require.main === module) {
  harness.runSingleSuite(suite);
}

module.exports = suite;
