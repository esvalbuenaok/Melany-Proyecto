/* Vista de Academia: formacion en adopcion responsable, mitos vs. realidad, progreso y test interactivo. */
(function (root) {
  "use strict";

  var App = (root.AmiuniApp = root.AmiuniApp || {});
  App.views = App.views || {};

  var BASE_CATEGORIAS = ["Todas", "Adopción", "Cuidados", "Concienciación"];

  function getCategories(lecciones) {
    var list = BASE_CATEGORIAS.slice();
    (lecciones || []).forEach(function (l) {
      var cat = l && l.categoria ? String(l.categoria).trim() : "";
      if (cat && list.indexOf(cat) === -1) {
        list.push(cat);
      }
    });
    return list;
  }

  function getMaxQuizScore(quiz) {
    return (quiz || []).reduce(function (acc, item) {
      var opts = Array.isArray(item && item.opciones) ? item.opciones : [];
      var maxPts = opts.reduce(function (best, op) {
        var pts = Number(op && op.puntos);
        return Number.isFinite(pts) && pts > best ? pts : best;
      }, 0);
      return acc + maxPts;
    }, 0);
  }

  function getQuizRecommendation(porcentaje) {
    if (porcentaje >= 75) {
      return {
        nivel: "alto",
        titulo: "¡Estás listo para dar el paso hacia la adopción!",
        mensaje: "Cuentas con tiempo, respaldo y disposición emocional para acompañar la adaptación de un animal rescatado. Conoce a quienes esperan hogar hoy.",
        primaryCta: { texto: "Buscar compañero", ruta: "#/" },
        secondaryCta: { texto: "Apoyar esterilizaciones", ruta: "#/donar" }
      };
    }
    if (porcentaje >= 45) {
      return {
        nivel: "medio",
        titulo: "Vas por buen camino, con detalles por afinar",
        mensaje: "Tienes una base positiva, pero conviene revisar los acuerdos familiares y tu fondo para imprevistos veterinarios antes de iniciar una solicitud.",
        primaryCta: { texto: "Explorar mascotas", ruta: "#/" },
        secondaryCta: { texto: "Apadrinar o donar", ruta: "#/donar" }
      };
    }
    return {
      nivel: "inicial",
      titulo: "Aún no es el momento ideal para adoptar, pero sí para ayudar",
      mensaje: "Ahora mismo adoptar podría generar estrés para ti y el animal. Mientras preparas tu entorno, puedes salvar vidas apoyando rescates y esterilizaciones.",
      primaryCta: { texto: "Donar para esterilizaciones", ruta: "#/donar" },
      secondaryCta: { texto: "Conocer a los rescatados", ruta: "#/" }
    };
  }

  function renderAcademia(vista) {
    var store = App.store;
    var utils = App.utils;
    var esc = utils.esc;

    var data = store.getAcademyData();
    var siteConfig = typeof store.getSiteConfig === "function" ? store.getSiteConfig() : {};
    var lecciones = Array.isArray(data.lecciones) ? data.lecciones : [];
    var quiz = Array.isArray(data.quiz) ? data.quiz : [];
    var categorias = getCategories(lecciones);
    var activeCategory = "Todas";

    function renderProgressHtml(progress) {
      var done = progress.completadas.length;
      var total = progress.total;
      var pct = progress.porcentaje;
      var lastQuizHtml = progress.ultimoQuiz
        ? '<span class="academia-ultimo-quiz">Último test: <strong>' + esc(progress.ultimoQuiz.score) + " de " + esc(progress.ultimoQuiz.total) + " (" + esc(progress.ultimoQuiz.porcentaje) + "%)</strong></span>"
        : '<span class="academia-ultimo-quiz">Test de preparación pendiente</span>';

      return (
        '<div class="academia-progreso-cabecera">' +
          '<div>' +
            '<h2>Tu progreso de aprendizaje</h2>' +
            '<p class="contador m-0" id="academia-progreso-texto">' + esc(done) + " de " + esc(total) + " módulos completados (" + esc(pct) + "%)</p>" +
          "</div>" +
          lastQuizHtml +
        "</div>" +
        '<div class="meta-barra" role="progressbar" aria-label="Progreso en Amiuni Academia" aria-valuemin="0" aria-valuemax="' + esc(total) + '" aria-valuenow="' + esc(done) + '">' +
          '<i style="width:' + esc(pct) + '%"></i>' +
        "</div>"
      );
    }

    function renderFiltersHtml() {
      return categorias.map(function (cat) {
        var isActive = cat === activeCategory;
        return (
          '<button type="button" class="btn academia-filtro-btn' + (isActive ? " activo" : "") + '" data-categoria="' + esc(cat) + '" aria-pressed="' + (isActive ? "true" : "false") + '">' +
            esc(cat) +
          "</button>"
        );
      }).join("");
    }

    function renderLessonCard(leccion, isCompleted) {
      var puntos = Array.isArray(leccion.puntosClave) ? leccion.puntosClave : [];
      var puntosHtml = puntos.map(function (pt) {
        return "<li>" + esc(pt) + "</li>";
      }).join("");

      return (
        '<article class="academia-card' + (isCompleted ? " completada" : "") + '" data-card-id="' + esc(leccion.id) + '">' +
          '<div class="academia-card-meta">' +
            '<span class="academia-tag">' + esc(leccion.categoria) + "</span>" +
            '<span class="academia-duracion">' + esc(leccion.duracion) + " de lectura</span>" +
          "</div>" +
          "<h3>" + esc(leccion.titulo) + "</h3>" +
          '<p class="academia-resumen">' + esc(leccion.resumen) + "</p>" +
          '<ul class="academia-puntos">' + puntosHtml + "</ul>" +
          '<div class="academia-mito" role="note" aria-label="Mito frente a realidad">' +
            '<p class="academia-mito-item"><strong>Mito:</strong> ' + esc(leccion.mito) + "</p>" +
            '<p class="academia-realidad-item"><strong>Realidad:</strong> ' + esc(leccion.realidad) + "</p>" +
          "</div>" +
          '<div class="academia-card-acciones">' +
            '<button type="button" class="btn ' + (isCompleted ? "btn-sec academia-btn-done" : "btn-sec") + '" data-lesson-id="' + esc(leccion.id) + '" aria-pressed="' + (isCompleted ? "true" : "false") + '">' +
              (isCompleted ? "Completado ✓" : "Marcar como completado") +
            "</button>" +
            '<a class="btn btn-cta" href="' + esc(leccion.ctaRuta || "#/") + '">' + esc(leccion.ctaTexto || "Continuar") + "</a>" +
          "</div>" +
        "</article>"
      );
    }

    function renderQuizResultHtml(summary, showExplanations) {
      if (!summary) { return ""; }
      var rec = getQuizRecommendation(summary.porcentaje);
      var explanationsHtml = "";
      if (showExplanations && quiz.length) {
        explanationsHtml =
          '<ul class="academia-quiz-explicaciones">' +
            quiz.map(function (q, idx) {
              return "<li><strong>Pregunta " + (idx + 1) + ":</strong> " + esc(q.explicacion) + "</li>";
            }).join("") +
          "</ul>";
      }

      return (
        '<div class="academia-quiz-resultado academia-quiz-resultado--' + esc(rec.nivel) + '" role="status" aria-live="polite">' +
          '<div class="academia-quiz-puntaje">' +
            '<span>Resultado:</span> <strong>' + esc(summary.score) + " de " + esc(summary.total) + " puntos (" + esc(summary.porcentaje) + "%)</strong>" +
          "</div>" +
          "<h3>" + esc(rec.titulo) + "</h3>" +
          "<p>" + esc(rec.mensaje) + "</p>" +
          explanationsHtml +
          '<div class="portada-acciones">' +
            '<a class="btn btn-cta" href="' + esc(rec.primaryCta.ruta) + '">' + esc(rec.primaryCta.texto) + "</a>" +
            '<a class="btn btn-sec" href="' + esc(rec.secondaryCta.ruta) + '">' + esc(rec.secondaryCta.texto) + "</a>" +
          "</div>" +
        "</div>"
      );
    }

    function renderQuizQuestionsHtml() {
      return quiz.map(function (q, qIndex) {
        var opts = Array.isArray(q.opciones) ? q.opciones : [];
        var optsHtml = opts.map(function (op, oIndex) {
          var inputId = "quiz-" + q.id + "-" + oIndex;
          return (
            '<label class="opcion academia-opcion" for="' + esc(inputId) + '">' +
              '<input type="radio" id="' + esc(inputId) + '" name="quiz-' + esc(q.id) + '" value="' + esc(op.puntos) + '">' +
              "<span>" + esc(op.texto) + "</span>" +
            "</label>"
          );
        }).join("");

        return (
          '<fieldset class="academia-pregunta">' +
            "<legend>" + esc(q.pregunta) + "</legend>" +
            '<div class="academia-opciones" data-question-index="' + qIndex + '">' +
              optsHtml +
            "</div>" +
          "</fieldset>"
        );
      }).join("");
    }

    var initialProgress = store.getAcademyProgress();

    vista.innerHTML =
      '<section class="pantalla reticula">' +
        '<header class="portada portada-academia">' +
          '<span class="portada-kicker">Formación y concienciación · ' + esc(siteConfig.academiaNavNombre || "Academia") + "</span>" +
          "<h1>" + esc(data.titulo || "Amiuni Academia (nombre por definir)") + "</h1>" +
          "<p>Antes de abrir la puerta de tu casa —o cuando quieres ayudar sin poder adoptar— la información clara salva vidas. Aprende en módulos cortos y evalúa si estás listo para dar el paso.</p>" +
          '<div class="portada-acciones">' +
            '<a class="btn btn-cta" href="#/">Buscar compañero</a>' +
            '<a class="btn btn-sec" href="#/donar">Donar para esterilizaciones</a>' +
          "</div>" +
          '<span class="huellas">' + utils.ICONOS.huella + "</span>" +
        "</header>" +

        '<section class="academia-progreso grid-span-full" id="academia-progreso" aria-label="Progreso de aprendizaje">' +
          renderProgressHtml(initialProgress) +
        "</section>" +

        '<div class="academia-filtros grid-span-full" id="academia-filtros" role="group" aria-label="Filtrar módulos por categoría">' +
          renderFiltersHtml() +
        "</div>" +

        '<div class="academia-grid grid-span-full" id="academia-grid"></div>' +

        '<section class="academia-quiz grid-span-full" aria-labelledby="academia-quiz-titulo">' +
          '<div class="academia-quiz-cabecera">' +
            '<h2 id="academia-quiz-titulo">¿Estoy listo para adoptar?</h2>' +
            "<p>Responde estas " + esc(quiz.length) + " preguntas rápidas para recibir una orientación honesta sobre tu momento actual.</p>" +
          "</div>" +
          '<form id="academia-quiz-form" novalidate>' +
            renderQuizQuestionsHtml() +
            '<div id="academia-quiz-error" class="admin-alerta mt-sm" role="alert" hidden></div>' +
            '<div class="academia-quiz-acciones">' +
              '<button type="submit" class="btn btn-cta">Calcular mi resultado</button>' +
              '<button type="button" class="btn btn-sec" id="academia-quiz-reset">Reiniciar respuestas</button>' +
            "</div>" +
          "</form>" +
          '<div id="academia-quiz-resultado" class="mt-md">' +
            renderQuizResultHtml(initialProgress.ultimoQuiz, false) +
          "</div>" +
        "</section>" +
      "</section>";

    var progressEl = vista.querySelector("#academia-progreso");
    var filtersEl = vista.querySelector("#academia-filtros");
    var gridEl = vista.querySelector("#academia-grid");
    var quizFormEl = vista.querySelector("#academia-quiz-form");
    var quizErrorEl = vista.querySelector("#academia-quiz-error");
    var quizResultEl = vista.querySelector("#academia-quiz-resultado");
    var quizResetBtn = vista.querySelector("#academia-quiz-reset");

    function paintProgress() {
      progressEl.innerHTML = renderProgressHtml(store.getAcademyProgress());
    }

    function paintLessons() {
      var progress = store.getAcademyProgress();
      var doneMap = {};
      progress.completadas.forEach(function (id) { doneMap[id] = true; });

      var visible = activeCategory === "Todas"
        ? lecciones
        : lecciones.filter(function (l) { return l.categoria === activeCategory; });

      if (!visible.length) {
        gridEl.innerHTML = '<div class="vacio">No hay módulos disponibles en esta categoría.</div>';
        return;
      }

      gridEl.innerHTML = visible.map(function (l) {
        return renderLessonCard(l, Boolean(doneMap[l.id]));
      }).join("");
    }

    filtersEl.addEventListener("click", function (e) {
      var btn = e.target && e.target.closest ? e.target.closest("[data-categoria]") : null;
      if (!btn) { return; }
      activeCategory = btn.getAttribute("data-categoria") || "Todas";
      filtersEl.innerHTML = renderFiltersHtml();
      paintLessons();
    });

    gridEl.addEventListener("click", function (e) {
      var btn = e.target && e.target.closest ? e.target.closest("[data-lesson-id]") : null;
      if (!btn) { return; }
      var lessonId = btn.getAttribute("data-lesson-id");
      var nowCompleted = store.toggleLessonCompleted(lessonId);
      paintProgress();
      paintLessons();
      utils.showToast(
        nowCompleted ? "Módulo marcado como completado." : "Módulo desmarcado.",
        nowCompleted ? "ok" : "info"
      );
    });

    quizFormEl.addEventListener("submit", function (e) {
      e.preventDefault();
      var score = 0;
      var missing = 0;

      quiz.forEach(function (q) {
        var selected = quizFormEl.querySelector('input[name="quiz-' + q.id + '"]:checked');
        if (!selected) {
          missing++;
        } else {
          var pts = Number(selected.value);
          if (Number.isFinite(pts)) {
            score += pts;
          }
        }
      });

      if (missing > 0) {
        quizErrorEl.hidden = false;
        quizErrorEl.textContent = "Por favor responde todas las preguntas antes de calcular tu resultado (faltan " + missing + ").";
        return;
      }

      quizErrorEl.hidden = true;
      quizErrorEl.textContent = "";

      var maxScore = getMaxQuizScore(quiz);
      var summary = store.saveAcademyQuizResult(score, maxScore);
      paintProgress();
      quizResultEl.innerHTML = renderQuizResultHtml(summary, true);
      utils.showToast("Resultado del test guardado.", "ok");
    });

    quizResetBtn.addEventListener("click", function () {
      quizFormEl.reset();
      quizErrorEl.hidden = true;
      quizErrorEl.textContent = "";
      quizResultEl.innerHTML = "";
    });

    paintLessons();
  }

  App.views.academia = renderAcademia;
})(typeof globalThis !== "undefined" ? globalThis : window);
