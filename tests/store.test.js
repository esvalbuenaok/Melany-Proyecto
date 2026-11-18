"use strict";

var path = require("node:path");
var harness = require("./helpers/test-harness");
var storeMod = require(path.join(__dirname, "../maqueta/js/modules/store"));

var suite = harness.createSuite("store");

suite.test("init usa fallback MemoryStorage y se recupera de JSON corrupto", function (assert) {
  var corrupted = harness.createMockStorage({
    amiuni_state_v1: "{not-valid-json!!!"
  });
  var store = storeMod.createStore({ storage: corrupted });
  store.init();

  assert.equal(store.getAnimals().length, 6);
  assert.deepEqual(store.getStats(), { adoptados: 128, enProceso: 9, atendidos: 342 });

  // Verifica que reescribio JSON valido en storage
  var persisted = JSON.parse(corrupted.getItem("amiuni_state_v1"));
  assert.equal(persisted.animales.length, 6);

  // Sin storage explicito en Node usa MemoryStorage sin lanzar errores
  var memStore = storeMod.createStore();
  memStore.init();
  assert.equal(memStore.getAnimals().length, 6);
});

suite.test("invariante de getStats refleja cambios de estado y alta/baja de animales", function (assert) {
  var ctx = harness.createTestStore();
  var store = ctx.store;

  assert.deepEqual(store.getStats(), { adoptados: 128, enProceso: 9, atendidos: 342 });

  var added = store.upsertAnimal(harness.makeValidAnimalData());
  assert.equal(added.ok, true);
  assert.deepEqual(store.getStats(), { adoptados: 128, enProceso: 9, atendidos: 343 });

  store.updateAnimalStatus(added.animal.id, "proceso");
  assert.deepEqual(store.getStats(), { adoptados: 128, enProceso: 10, atendidos: 343 });

  store.updateAnimalStatus(added.animal.id, "adoptado");
  assert.deepEqual(store.getStats(), { adoptados: 129, enProceso: 9, atendidos: 343 });

  store.deleteAnimal(added.animal.id);
  assert.deepEqual(store.getStats(), { adoptados: 128, enProceso: 9, atendidos: 342 });
});

suite.test("invariante de getMeta suma donaciones no anuladas y updateMetaConfig actualiza limites", function (assert) {
  var ctx = harness.createTestStore();
  var store = ctx.store;

  assert.deepEqual(store.getMeta(), {
    objetivo: 600,
    recaudado: 410,
    recaudadoBase: 410,
    etiqueta: "Meta del mes: esterilizaciones",
    porcentaje: 68
  });

  var d1 = store.submitDonation(harness.makeValidDonationData({ monto: 40 }));
  assert.equal(d1.ok, true);
  assert.match(d1.donacion.codigo, /^DON-[A-Z0-9]{4,8}$/);
  assert.equal(store.getMeta().recaudado, 450);

  // Verificar no duplica
  store.updateDonationStatus(d1.donacion.codigo, "verificada", "Confirmado");
  assert.equal(store.getMeta().recaudado, 450);

  // Anular descuenta
  store.updateDonationStatus(d1.donacion.codigo, "anulada", "Referencia duplicada");
  assert.equal(store.getMeta().recaudado, 410);

  var cfg = store.updateMetaConfig({ objetivo: 800, etiqueta: "Meta de vacunas" });
  assert.equal(cfg.ok, true);
  assert.equal(store.getMeta().objetivo, 800);
  assert.equal(store.getMeta().etiqueta, "Meta de vacunas");
});

suite.test("submitAdoption y updateRequestStatus sincronizan el estado del animal", function (assert) {
  var ctx = harness.createTestStore();
  var store = ctx.store;

  store.saveAdoptionDraft("luna", { paso: 1, datos: { nombre: "Ana" } });
  assert.equal(store.getAdoptionDraft("luna").paso, 1);

  var res = store.submitAdoption("luna", harness.makeValidAdoptionData());
  assert.equal(res.ok, true);
  assert.match(res.solicitud.codigo, /^AMI-[A-Z0-9]{4,8}$/);
  assert.equal(store.getAnimalById("luna").estado, "proceso");
  assert.equal(store.getAdoptionDraft("luna"), null);
  assert.equal(store.getStats().enProceso, 10);

  // Segunda solicitud sobre el mismo animal en proceso debe ser rechazada
  var dup = store.submitAdoption("luna", harness.makeValidAdoptionData());
  assert.equal(dup.ok, false);

  // Rechazar vuelve el animal a disponible
  var rej = store.updateRequestStatus(res.solicitud.codigo, "rechazada", "Sin patio");
  assert.equal(rej.ok, true);
  assert.equal(store.getAnimalById("luna").estado, "disponible");
  assert.equal(store.getStats().enProceso, 9);

  // Nueva solicitud y aprobacion pasa a adoptado
  var res2 = store.submitAdoption("luna", harness.makeValidAdoptionData());
  assert.equal(res2.ok, true);
  var apr = store.updateRequestStatus(res2.solicitud.codigo, "aprobada", "Hogar verificado");
  assert.equal(apr.ok, true);
  assert.equal(store.getAnimalById("luna").estado, "adoptado");
  assert.equal(store.getStats().adoptados, 129);
  assert.equal(store.getStats().enProceso, 9);
});

suite.test("favoritos, filtros, suscripcion y resetDemoData funcionan de forma consistente", function (assert) {
  var ctx = harness.createTestStore();
  var store = ctx.store;

  var events = 0;
  var unsub = store.subscribe(function () { events++; });

  assert.equal(store.isFavorite("luna"), false);
  assert.equal(store.toggleFavorite("luna"), true);
  assert.equal(store.isFavorite("luna"), true);
  assert.deepEqual(store.getFavorites(), ["luna"]);
  assert.equal(store.toggleFavorite("luna"), false);
  assert.deepEqual(store.getFavorites(), []);

  store.setFilters({ especie: "gato" });
  assert.equal(store.getAnimals(store.getFilters()).length, 2);
  store.resetFilters();
  assert.equal(store.getAnimals(store.getFilters()).length, 6);

  unsub();
  var beforeResetEvents = events;
  store.toggleFavorite("toby");
  assert.equal(events, beforeResetEvents);

  store.resetDemoData();
  assert.deepEqual(store.getFavorites(), []);
  assert.equal(store.getRequests().length, 0);
  assert.equal(store.getDonations().length, 0);
});

suite.test("loginAdmin, logoutAdmin y rechazo de credenciales invalidas persisten en sessionStorage", function (assert) {
  var sessionStorageMock = harness.createMockStorage();
  var ctx = harness.createTestStore({ sessionStorage: sessionStorageMock });
  var store = ctx.store;

  assert.equal(store.isAdminAuthenticated(), false);
  assert.equal(store.getAdminSession(), null);

  var badUser = store.loginAdmin("otro", "amiuni2026");
  assert.equal(badUser.ok, false);
  assert.ok(badUser.error);
  assert.equal(store.isAdminAuthenticated(), false);

  var badPass = store.loginAdmin("admin", "clave-incorrecta");
  assert.equal(badPass.ok, false);
  assert.equal(store.isAdminAuthenticated(), false);

  var okRes = store.loginAdmin("admin", "amiuni2026");
  assert.equal(okRes.ok, true);
  assert.equal(okRes.session.usuario, "admin");
  assert.equal(store.isAdminAuthenticated(), true);
  assert.equal(store.getAdminSession().usuario, "admin");

  // Simula recarga de pestana conservando sessionStorage
  var storeReloaded = storeMod.createStore({
    storage: ctx.storage,
    sessionStorage: sessionStorageMock,
    sessionKey: "amiuni_test_session_v1"
  });
  storeReloaded.init();
  assert.equal(storeReloaded.isAdminAuthenticated(), true);

  storeReloaded.logoutAdmin();
  assert.equal(storeReloaded.isAdminAuthenticated(), false);
  assert.equal(storeReloaded.getAdminSession(), null);
});

suite.test("CRUD completo de animales y eliminacion de testimonios en admin", function (assert) {
  var ctx = harness.createTestStore();
  var store = ctx.store;

  var created = store.upsertAnimal(harness.makeValidAnimalData({
    nombre: "Kira",
    especie: "gato",
    apadrinamientoMensual: 35,
    etiquetas: ["Cariñosa", "Interior"],
    fotos: [{ url: "https://example.com/kira.jpg", alt: "Kira" }],
    salud: { vacunas: true, esterilizado: true, desparasitado: true },
    compatibilidad: { ninos: true, apartamento: true, otrosPerros: false, otrosGatos: true }
  }));
  assert.equal(created.ok, true);
  assert.equal(created.animal.especie, "gato");
  assert.equal(created.animal.apadrinamientoMensual, 35);
  assert.deepEqual(created.animal.etiquetas, ["Cariñosa", "Interior"]);
  assert.equal(created.animal.fotos[0].url, "https://example.com/kira.jpg");
  assert.equal(created.animal.salud.esterilizado, true);
  assert.equal(created.animal.compatibilidad.otrosGatos, true);

  var edited = store.upsertAnimal({
    id: created.animal.id,
    nombre: "Kira Actualizada",
    apadrinamientoMensual: 40,
    historia: "Historia actualizada de Kira lista para un hogar definitivo."
  });
  assert.equal(edited.ok, true);
  assert.equal(edited.animal.nombre, "Kira Actualizada");
  assert.equal(edited.animal.apadrinamientoMensual, 40);
  assert.equal(store.getAnimalById(created.animal.id).nombre, "Kira Actualizada");

  var deleted = store.deleteAnimal(created.animal.id);
  assert.equal(deleted.ok, true);
  assert.equal(store.getAnimalById(created.animal.id), null);

  var beforeTestimonials = store.getTestimonials().length;
  assert.ok(beforeTestimonials >= 2);
  var delTest = store.deleteTestimonial("test-1");
  assert.equal(delTest.ok, true);
  assert.equal(store.getTestimonials().length, beforeTestimonials - 1);
});

suite.test("exportBackup e importBackup validan la estructura y restauran el estado", function (assert) {
  var ctx = harness.createTestStore();
  var store = ctx.store;

  store.upsertAnimal(harness.makeValidAnimalData({ nombre: "Nube" }));
  store.updateMetaConfig({ objetivo: 950, etiqueta: "Campaña Nube" });
  var backup = store.exportBackup();
  var backupJson = JSON.stringify(backup);

  // Rechaza JSON invalido o estructura incompleta
  assert.equal(store.importBackup("{json roto").ok, false);
  assert.equal(store.importBackup({ animales: "no-array" }).ok, false);
  assert.equal(store.importBackup({ animales: [{ id: "", nombre: "" }], offsets: {}, metaConfig: { objetivo: 100 } }).ok, false);

  // Restablece demo y luego restaura desde el respaldo exportado
  store.resetDemoData();
  assert.equal(store.getAnimals().length, 6);
  assert.equal(store.getMeta().objetivo, 600);

  var imported = store.importBackup(backupJson);
  assert.equal(imported.ok, true);
  assert.equal(store.getAnimals().length, 7);
  assert.equal(store.getMeta().objetivo, 950);
  assert.equal(store.getMeta().etiqueta, "Campaña Nube");
});

suite.test("academia: getAcademyData, toggleLessonCompleted, getAcademyProgress, saveAcademyQuizResult, persistencia y reset", function (assert) {
  var sharedStorage = harness.createMockStorage();
  var ctx = harness.createTestStore({ storage: sharedStorage, storageKey: "amiuni_academy_test" });
  var store = ctx.store;

  var data = store.getAcademyData();
  assert.equal(data.titulo, "Amiuni Academia (nombre por definir)");
  assert.equal(data.lecciones.length, 4);
  assert.equal(data.quiz.length, 4);
  assert.deepEqual(
    data.lecciones.map(function (l) { return l.id; }),
    ["antes-adoptar", "proceso-pasos", "salud-preventiva", "concienciacion"]
  );

  var initialProgress = store.getAcademyProgress();
  assert.deepEqual(initialProgress, {
    completadas: [],
    total: 4,
    porcentaje: 0,
    ultimoQuiz: null
  });

  var notifications = 0;
  var unsub = store.subscribe(function () { notifications++; });

  assert.equal(store.toggleLessonCompleted("antes-adoptar"), true);
  assert.equal(store.toggleLessonCompleted("salud-preventiva"), true);
  assert.equal(notifications, 2);

  var midProgress = store.getAcademyProgress();
  assert.deepEqual(midProgress.completadas, ["antes-adoptar", "salud-preventiva"]);
  assert.equal(midProgress.total, 4);
  assert.equal(midProgress.porcentaje, 50);

  assert.equal(store.toggleLessonCompleted("antes-adoptar"), false);
  var afterUncheck = store.getAcademyProgress();
  assert.deepEqual(afterUncheck.completadas, ["salud-preventiva"]);
  assert.equal(afterUncheck.porcentaje, 25);

  var quizSummary = store.saveAcademyQuizResult(6, 8);
  assert.equal(quizSummary.score, 6);
  assert.equal(quizSummary.total, 8);
  assert.equal(quizSummary.porcentaje, 75);
  assert.ok(quizSummary.fecha);
  assert.equal(notifications, 4);

  unsub();

  // Simula recarga desde storage
  var reloaded = storeMod.createStore({ storage: sharedStorage, storageKey: "amiuni_academy_test" });
  reloaded.init();
  var reloadedProgress = reloaded.getAcademyProgress();
  assert.deepEqual(reloadedProgress.completadas, ["salud-preventiva"]);
  assert.equal(reloadedProgress.porcentaje, 25);
  assert.equal(reloadedProgress.ultimoQuiz.score, 6);
  assert.equal(reloadedProgress.ultimoQuiz.porcentaje, 75);

  // Respaldo y reinicio demo
  var backupJson = JSON.stringify(reloaded.exportBackup());
  reloaded.resetDemoData();
  assert.deepEqual(reloaded.getAcademyProgress(), {
    completadas: [],
    total: 4,
    porcentaje: 0,
    ultimoQuiz: null
  });

  var restored = reloaded.importBackup(backupJson);
  assert.equal(restored.ok, true);
  assert.deepEqual(reloaded.getAcademyProgress().completadas, ["salud-preventiva"]);
  assert.equal(reloaded.getAcademyProgress().ultimoQuiz.score, 6);
});

suite.test("updateSiteConfig, updateBaseStats y updatePaymentMethod persisten y se integran con backup y reset", function (assert) {
  var sharedStorage = harness.createMockStorage();
  var ctx = harness.createTestStore({ storage: sharedStorage, storageKey: "amiuni_site_cfg_test" });
  var store = ctx.store;

  var initialSite = store.getSiteConfig();
  assert.equal(initialSite.nombreMarca, "Amiuni");
  assert.equal(initialSite.academiaNavNombre, "Academia");

  assert.equal(store.updateSiteConfig({ nombreMarca: "   " }).ok, false);
  var updSite = store.updateSiteConfig({
    nombreMarca: "Refugio Mérida",
    portadaTitulo: "Adopta hoy en Mérida",
    academiaNavNombre: "Escuela",
    whatsappContacto: "0424-9998877",
    correoContacto: "hola@refugio.org"
  });
  assert.equal(updSite.ok, true);
  assert.equal(store.getSiteConfig().nombreMarca, "Refugio Mérida");
  assert.equal(store.getSiteConfig().academiaNavNombre, "Escuela");

  // updateBaseStats recalcula offsets y preserva dinamismo al agregar/adoptar animales
  assert.equal(store.updateBaseStats({ adoptados: -1 }).ok, false);
  var updStats = store.updateBaseStats({ adoptados: 200, enProceso: 15, atendidos: 500 });
  assert.equal(updStats.ok, true);
  assert.deepEqual(store.getStats(), { adoptados: 200, enProceso: 15, atendidos: 500 });

  var extra = store.upsertAnimal(harness.makeValidAnimalData({ nombre: "Sol" }));
  assert.equal(extra.ok, true);
  assert.deepEqual(store.getStats(), { adoptados: 200, enProceso: 15, atendidos: 501 });
  store.updateAnimalStatus(extra.animal.id, "adoptado");
  assert.deepEqual(store.getStats(), { adoptados: 201, enProceso: 15, atendidos: 501 });

  // updatePaymentMethod
  assert.equal(store.updatePaymentMethod("inexistente", { banco: "X" }).ok, false);
  var payRes = store.updatePaymentMethod("pago_movil", {
    banco: "Mercantil",
    telefono: "0414-7776655",
    nota: "Enviar captura por WhatsApp"
  });
  assert.equal(payRes.ok, true);
  assert.equal(store.getPaymentMethods().pago_movil.banco, "Mercantil");
  assert.equal(store.getPaymentMethods().pago_movil.nota, "Enviar captura por WhatsApp");

  // Persistencia tras recarga y backup
  var reloaded = storeMod.createStore({ storage: sharedStorage, storageKey: "amiuni_site_cfg_test" });
  reloaded.init();
  assert.equal(reloaded.getSiteConfig().nombreMarca, "Refugio Mérida");
  assert.deepEqual(reloaded.getStats(), { adoptados: 201, enProceso: 15, atendidos: 501 });
  assert.equal(reloaded.getPaymentMethods().pago_movil.telefono, "0414-7776655");

  var backup = JSON.stringify(reloaded.exportBackup());
  reloaded.resetDemoData();
  assert.equal(reloaded.getSiteConfig().nombreMarca, "Amiuni");
  assert.deepEqual(reloaded.getStats(), { adoptados: 128, enProceso: 9, atendidos: 342 });
  assert.equal(reloaded.getPaymentMethods().pago_movil.telefono, "0414-0000000");

  assert.equal(reloaded.importBackup(backup).ok, true);
  assert.equal(reloaded.getSiteConfig().nombreMarca, "Refugio Mérida");
  assert.deepEqual(reloaded.getStats(), { adoptados: 201, enProceso: 15, atendidos: 501 });
  assert.equal(reloaded.getPaymentMethods().pago_movil.nota, "Enviar captura por WhatsApp");
});

suite.test("edicion de contenido de Academia, testimonios y credenciales Admin", function (assert) {
  var sessionStorageMock = harness.createMockStorage();
  var ctx = harness.createTestStore({ sessionStorage: sessionStorageMock });
  var store = ctx.store;

  // Titulo y lecciones de Academia
  assert.equal(store.updateAcademyTitle("   ").ok, false);
  assert.equal(store.updateAcademyTitle("Escuela Amiuni").ok, true);
  assert.equal(store.getAcademyData().titulo, "Escuela Amiuni");

  var createdLesson = store.upsertAcademyLesson({
    titulo: "Primeros días en casa",
    categoria: "Cuidados",
    duracion: "5 min",
    resumen: "Cómo preparar un espacio seguro para la llegada de tu compañero.",
    puntosClave: "Prepara cama y agua\nMantén rutinas tranquilas",
    mito: "El primer día debe conocer a toda la familia.",
    realidad: "Conviene presentarle el hogar de forma gradual.",
    ctaTexto: "Ver catálogo",
    ctaRuta: "#/"
  });
  assert.equal(createdLesson.ok, true);
  assert.equal(store.getAcademyData().lecciones.length, 5);
  assert.deepEqual(createdLesson.lesson.puntosClave, [
    "Prepara cama y agua",
    "Mantén rutinas tranquilas"
  ]);

  var editedLesson = store.upsertAcademyLesson({
    id: createdLesson.lesson.id,
    titulo: "Primeros días en casa (actualizado)",
    categoria: "Adopción",
    resumen: "Guía práctica para la primera semana de convivencia."
  });
  assert.equal(editedLesson.ok, true);
  assert.equal(editedLesson.lesson.titulo, "Primeros días en casa (actualizado)");

  store.toggleLessonCompleted(createdLesson.lesson.id);
  assert.ok(store.getAcademyProgress().completadas.indexOf(createdLesson.lesson.id) !== -1);

  var delLesson = store.deleteAcademyLesson(createdLesson.lesson.id);
  assert.equal(delLesson.ok, true);
  assert.equal(store.getAcademyData().lecciones.length, 4);
  assert.equal(store.getAcademyProgress().completadas.indexOf(createdLesson.lesson.id), -1);

  // Preguntas de quiz
  var createdQ = store.upsertAcademyQuestion({
    pregunta: "5. ¿Tienes plan en caso de viaje?",
    explicacion: "Es importante contar con alguien de confianza.",
    opciones: [
      { texto: "No tengo plan", puntos: 0 },
      { texto: "Sí, familia o guardería", puntos: 2 }
    ]
  });
  assert.equal(createdQ.ok, true);
  assert.equal(store.getAcademyData().quiz.length, 5);
  assert.equal(store.deleteAcademyQuestion(createdQ.question.id).ok, true);
  assert.equal(store.getAcademyData().quiz.length, 4);

  // Testimonios: crear y editar
  assert.equal(store.upsertTestimonial({ autor: "", texto: "Hola" }).ok, false);
  var newTest = store.upsertTestimonial({
    autor: "Carlos M.",
    texto: "Excelente acompañamiento durante todo el proceso.",
    fecha: "2026-11-10"
  });
  assert.equal(newTest.ok, true);
  assert.equal(store.getTestimonials().length, 3);

  var updTest = store.upsertTestimonial({
    id: newTest.testimonial.id,
    autor: "Carlos Mendoza",
    texto: "Acompañamiento impecable."
  });
  assert.equal(updTest.ok, true);
  assert.equal(updTest.testimonial.autor, "Carlos Mendoza");
  assert.equal(store.getTestimonials().length, 3);

  // Credenciales Admin
  assert.equal(store.loginAdmin("admin", "amiuni2026").ok, true);
  assert.equal(store.updateAdminCredentials({ usuario: "ab", clave: "123" }).ok, false);
  var authRes = store.updateAdminCredentials({ usuario: "melany", clave: "clave2026" });
  assert.equal(authRes.ok, true);
  assert.equal(store.isAdminAuthenticated(), true);
  assert.equal(store.getAdminSession().usuario, "melany");

  store.logoutAdmin();
  assert.equal(store.loginAdmin("admin", "amiuni2026").ok, false);
  assert.equal(store.loginAdmin("melany", "clave2026").ok, true);

  // Respaldo conserva credenciales y resetDemoData restaura admin/amiuni2026
  var backup = JSON.stringify(store.exportBackup());
  store.resetDemoData();
  store.logoutAdmin();
  assert.equal(store.loginAdmin("melany", "clave2026").ok, false);
  assert.equal(store.loginAdmin("admin", "amiuni2026").ok, true);
  assert.equal(store.getAcademyData().titulo, "Amiuni Academia (nombre por definir)");
  assert.equal(store.getTestimonials().length, 2);

  assert.equal(store.importBackup(backup).ok, true);
  store.logoutAdmin();
  assert.equal(store.loginAdmin("melany", "clave2026").ok, true);
});

if (require.main === module) {
  harness.runSingleSuite(suite);
}

module.exports = suite;
