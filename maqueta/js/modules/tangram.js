/* Motor Tangram / Origami Poligonal estilo Species in Pieces para Amiuni (24 facetas triangulares). */
(function (root) {
  "use strict";

  var App = (root.AmiuniApp = root.AmiuniApp || {});
  var utils = App.utils || (typeof require === "function" ? require("./utils") : null);

  var SHARD_COUNT = 24;
  var VIEWBOX = "0 0 400 320";

  function shard(x1, y1, x2, y2, x3, y3, color) {
    return { points: [x1, y1, x2, y2, x3, y3], color: color };
  }

  var PRESETS = {
    perro_mediano: [
      // Orejas
      shard(235, 62, 248, 28, 260, 62, "#C98A5B"),
      shard(258, 64, 272, 34, 280, 68, "#B47143"),
      // Cabeza y hocico
      shard(235, 62, 260, 62, 246, 96, "#E3B488"),
      shard(260, 62, 280, 68, 268, 100, "#D8A172"),
      shard(246, 96, 260, 62, 268, 100, "#ECC49D"),
      shard(280, 68, 316, 84, 286, 104, "#C5895C"),
      shard(268, 100, 280, 68, 286, 104, "#9A623C"),
      // Cuello y pecho
      shard(235, 62, 246, 96, 212, 118, "#E9D5B8"),
      shard(246, 96, 268, 100, 232, 146, "#F3E4CD"),
      shard(246, 96, 232, 146, 212, 118, "#DFC29D"),
      shard(268, 100, 274, 148, 232, 146, "#38BDF8"),
      // Torso
      shard(212, 118, 232, 146, 165, 134, "#D79E6E"),
      shard(165, 134, 232, 146, 178, 192, "#C88C5D"),
      shard(232, 146, 274, 148, 236, 196, "#E5B78E"),
      shard(232, 146, 236, 196, 178, 192, "#D29767"),
      shard(165, 134, 178, 192, 118, 154, "#B87A4D"),
      shard(118, 154, 178, 192, 128, 200, "#A76A3F"),
      // Cola
      shard(118, 154, 82, 118, 102, 158, "#8F5632"),
      shard(118, 154, 102, 158, 128, 200, "#6B3F23"),
      // Patas
      shard(128, 200, 152, 196, 134, 274, "#B5784B"),
      shard(134, 274, 152, 196, 158, 274, "#935B35"),
      shard(228, 196, 250, 196, 234, 274, "#DFB287"),
      shard(250, 196, 274, 148, 264, 274, "#C78E60"),
      shard(158, 194, 178, 192, 168, 266, "#8F5632")
    ],
    cachorro: [
      // Orejas caidas
      shard(196, 74, 168, 116, 200, 126, "#4A78B8"),
      shard(196, 74, 216, 86, 200, 126, "#325C9B"),
      shard(268, 72, 294, 114, 264, 124, "#1E3A8A"),
      shard(268, 72, 248, 84, 264, 124, "#2B4D9E"),
      // Cabeza y hocico
      shard(196, 74, 234, 56, 216, 86, "#89C9F2"),
      shard(234, 56, 268, 72, 248, 84, "#67B8EC"),
      shard(216, 86, 234, 56, 248, 84, "#CDE7F5"),
      shard(216, 86, 248, 84, 236, 126, "#A6D6F4"),
      shard(248, 84, 292, 102, 254, 128, "#38BDF8"),
      // Collar y pecho
      shard(216, 124, 254, 128, 224, 162, "#E89A63"),
      shard(254, 128, 268, 166, 224, 162, "#D47E45"),
      shard(200, 126, 216, 124, 224, 162, "#6B3F23"),
      // Cuerpo compacto
      shard(224, 162, 164, 148, 174, 204, "#74BEEB"),
      shard(224, 162, 174, 204, 228, 214, "#9AD2F3"),
      shard(224, 162, 268, 166, 228, 214, "#BCE1F7"),
      shard(164, 148, 122, 166, 174, 204, "#54A7DE"),
      shard(122, 166, 134, 218, 174, 204, "#3B8CC9"),
      shard(174, 204, 134, 218, 186, 232, "#63B2E5"),
      // Patitas
      shard(134, 218, 158, 218, 140, 276, "#2D6EAA"),
      shard(174, 204, 198, 214, 184, 276, "#4A90CC"),
      shard(228, 214, 252, 214, 236, 276, "#83C5EF"),
      shard(252, 214, 268, 166, 266, 276, "#58A6DB"),
      // Cola alegre
      shard(122, 166, 86, 124, 108, 176, "#2B4D9E"),
      shard(86, 124, 98, 110, 114, 154, "#38BDF8")
    ],
    gato: [
      // Orejas puntiagudas
      shard(136, 88, 140, 40, 164, 74, "#6D5B8D"),
      shard(140, 40, 152, 64, 164, 74, "#E9A7B8"),
      shard(184, 74, 204, 38, 208, 88, "#5A4979"),
      shard(204, 38, 196, 66, 184, 74, "#E295A8"),
      // Cabeza
      shard(136, 88, 164, 74, 172, 102, "#C3B2DB"),
      shard(164, 74, 184, 74, 172, 102, "#D9CBE8"),
      shard(184, 74, 208, 88, 172, 102, "#AE9BC9"),
      shard(136, 88, 208, 88, 172, 126, "#E6DDF1"),
      // Cuello y pecho
      shard(150, 116, 172, 126, 146, 162, "#9783B5"),
      shard(172, 126, 196, 118, 188, 166, "#B9A7D4"),
      shard(146, 162, 172, 126, 188, 166, "#F5EFE4"),
      // Cuerpo sentado
      shard(146, 162, 188, 166, 152, 226, "#CBBCE0"),
      shard(188, 166, 232, 196, 196, 240, "#8E7AA9"),
      shard(188, 166, 196, 240, 152, 226, "#A694C2"),
      shard(152, 226, 196, 240, 168, 274, "#7B6897"),
      shard(196, 240, 246, 246, 212, 276, "#695685"),
      shard(232, 196, 256, 228, 246, 246, "#584674"),
      shard(196, 240, 232, 196, 246, 246, "#7A6796"),
      // Patas delanteras
      shard(146, 162, 152, 226, 134, 274, "#DFD4EE"),
      shard(152, 226, 168, 274, 134, 274, "#BDB0D5"),
      // Cola curva
      shard(246, 246, 282, 224, 256, 262, "#4B3B66"),
      shard(282, 224, 304, 176, 266, 204, "#6D5B8D"),
      shard(304, 176, 294, 132, 276, 168, "#8A77A7"),
      shard(294, 132, 314, 116, 306, 154, "#B5A3D1")
    ],
    perro_grande: [
      // Orejas altas
      shard(244, 58, 254, 20, 268, 56, "#6B3F23"),
      shard(272, 58, 286, 22, 294, 64, "#55321C"),
      // Cabeza y hocico
      shard(244, 58, 268, 56, 256, 94, "#C58958"),
      shard(268, 56, 294, 64, 278, 98, "#B37345"),
      shard(256, 94, 268, 56, 278, 98, "#DDA778"),
      shard(294, 64, 336, 84, 298, 104, "#4E3426"),
      shard(278, 98, 294, 64, 298, 104, "#7A4C2E"),
      // Cuello y pecho robusto
      shard(244, 58, 256, 94, 216, 118, "#8D5634"),
      shard(256, 94, 278, 98, 244, 154, "#E8C9B0"),
      shard(256, 94, 244, 154, 216, 118, "#C99364"),
      shard(278, 98, 288, 148, 244, 154, "#D7A374"),
      // Lomo y torso
      shard(216, 118, 244, 154, 158, 128, "#5A3825"),
      shard(158, 128, 244, 154, 174, 196, "#9A623C"),
      shard(244, 154, 288, 148, 242, 202, "#DDA87B"),
      shard(244, 154, 242, 202, 174, 196, "#C48858"),
      shard(158, 128, 174, 196, 108, 148, "#472C1E"),
      shard(108, 148, 174, 196, 122, 204, "#7D4F30"),
      // Patas largas
      shard(122, 204, 148, 198, 124, 284, "#B5794B"),
      shard(148, 198, 168, 200, 156, 284, "#8E5835"),
      shard(232, 202, 256, 202, 240, 284, "#D9A477"),
      shard(256, 202, 282, 158, 274, 284, "#BD8253"),
      shard(174, 196, 198, 198, 184, 268, "#6E4228"),
      // Cola larga
      shard(108, 148, 66, 184, 96, 196, "#55321C"),
      shard(66, 184, 56, 222, 88, 208, "#3E2314")
    ],
    gatito: [
      // Orejas grandes de gatito
      shard(144, 96, 134, 42, 174, 78, "#D49B4B"),
      shard(134, 42, 160, 68, 174, 78, "#F4B6C2"),
      shard(194, 78, 224, 42, 222, 96, "#C28438"),
      shard(224, 42, 208, 68, 194, 78, "#EE9FB0"),
      // Carita ancha
      shard(144, 96, 174, 78, 184, 106, "#F3DDA8"),
      shard(174, 78, 194, 78, 184, 106, "#FAE8BE"),
      shard(194, 78, 222, 96, 184, 106, "#E9C77E"),
      shard(144, 96, 184, 106, 164, 132, "#E3B96A"),
      shard(184, 106, 222, 96, 202, 132, "#D6A756"),
      // Menton y pecho
      shard(164, 132, 184, 106, 202, 132, "#FFF3D9"),
      shard(164, 132, 202, 132, 184, 168, "#F5DFB0"),
      shard(156, 148, 184, 168, 160, 186, "#E3BD76"),
      // Cuerpo agazapado
      shard(184, 168, 214, 152, 228, 196, "#D8AA58"),
      shard(184, 168, 228, 196, 174, 218, "#ECCA80"),
      shard(228, 196, 262, 188, 246, 232, "#C49142"),
      shard(174, 218, 228, 196, 246, 232, "#DEB366"),
      shard(160, 186, 184, 168, 174, 218, "#F3DDA8"),
      shard(174, 218, 246, 232, 198, 248, "#B48034"),
      // Patitas
      shard(156, 216, 174, 218, 150, 262, "#FAE8BE"),
      shard(174, 218, 198, 248, 182, 264, "#E9C77E"),
      shard(232, 232, 256, 230, 248, 266, "#D49B4B"),
      // Colita levantada
      shard(262, 188, 288, 154, 274, 202, "#C28438"),
      shard(288, 154, 306, 118, 294, 168, "#D8AA58"),
      shard(306, 118, 322, 126, 298, 148, "#F3DDA8")
    ],
    perro_senior: [
      // Orejas suaves
      shard(232, 96, 214, 136, 244, 142, "#7C8C6B"),
      shard(232, 96, 250, 104, 244, 142, "#637355"),
      shard(272, 96, 292, 134, 266, 138, "#58684B"),
      // Cabeza serena
      shard(232, 96, 256, 82, 250, 104, "#D5DDC4"),
      shard(256, 82, 272, 96, 250, 104, "#E4E9D6"),
      shard(250, 104, 272, 96, 266, 138, "#C3CEAF"),
      shard(272, 96, 314, 116, 278, 138, "#9EAD8A"),
      shard(250, 104, 266, 138, 244, 142, "#B3C19E"),
      // Cuello y hombros
      shard(232, 138, 266, 138, 244, 174, "#DAE2CC"),
      shard(210, 148, 232, 138, 244, 174, "#AEBFA0"),
      shard(210, 148, 244, 174, 206, 192, "#97AA87"),
      // Cuerpo recostado
      shard(206, 192, 244, 174, 256, 222, "#C8D3B6"),
      shard(156, 162, 210, 148, 206, 192, "#879B78"),
      shard(156, 162, 206, 192, 162, 226, "#A2B491"),
      shard(162, 226, 206, 192, 256, 222, "#B7C6A6"),
      shard(110, 178, 156, 162, 162, 226, "#758867"),
      shard(110, 178, 162, 226, 114, 234, "#8E9F7E"),
      shard(162, 226, 256, 222, 198, 252, "#96A887"),
      // Patas en reposo
      shard(244, 222, 294, 232, 252, 254, "#DFE5D2"),
      shard(294, 232, 316, 248, 268, 254, "#BDC9AC"),
      shard(114, 234, 154, 234, 128, 256, "#697B5C"),
      shard(154, 234, 184, 244, 152, 258, "#829473"),
      // Cola relajada
      shard(110, 178, 74, 206, 100, 222, "#637355"),
      shard(74, 206, 68, 236, 98, 224, "#4E5D42")
    ]
  };

  function cloneShards(shards) {
    return (shards || []).map(function (s) {
      return { points: s.points.slice(), color: s.color };
    });
  }

  function parseHexColor(hex) {
    var clean = String(hex || "#1E3A8A").replace(/^#/, "");
    if (clean.length === 3) {
      clean = clean.charAt(0) + clean.charAt(0) + clean.charAt(1) + clean.charAt(1) + clean.charAt(2) + clean.charAt(2);
    }
    var num = parseInt(clean, 16);
    if (!Number.isFinite(num)) {
      return [30, 58, 138];
    }
    return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
  }

  function toHexColor(r, g, b) {
    var clampByte = function (v) {
      return Math.max(0, Math.min(255, Math.round(v)));
    };
    var hex = function (v) {
      var h = clampByte(v).toString(16);
      return h.length === 1 ? "0" + h : h;
    };
    return "#" + hex(r) + hex(g) + hex(b);
  }

  function resolvePresetKey(animal) {
    if (!animal || typeof animal !== "object") {
      return "perro_mediano";
    }
    if (animal.especie === "gato") {
      return animal.edad === "cachorro" ? "gatito" : "gato";
    }
    if (animal.edad === "cachorro") {
      return "cachorro";
    }
    if (animal.edad === "senior") {
      return "perro_senior";
    }
    if (animal.tamano === "grande") {
      return "perro_grande";
    }
    return "perro_mediano";
  }

  /** Devuelve el preset poligonal (id y 24 triangulos) correspondiente a un animal. */
  function getPresetForAnimal(animal) {
    var key = resolvePresetKey(animal);
    return {
      id: key,
      shards: cloneShards(PRESETS[key])
    };
  }

  /** Interpola coordenadas y color de las 24 facetas triangulares entre dos siluetas para t en [0, 1]. */
  function interpolateShards(fromShards, toShards, t) {
    var clamped = Math.max(0, Math.min(1, Number.isFinite(Number(t)) ? Number(t) : 0));
    var out = [];
    for (var i = 0; i < SHARD_COUNT; i++) {
      var a = (fromShards && fromShards[i]) || PRESETS.perro_mediano[i];
      var b = (toShards && toShards[i]) || PRESETS.perro_mediano[i];
      var pts = [];
      for (var p = 0; p < 6; p++) {
        var v0 = Number(a.points[p]) || 0;
        var v1 = Number(b.points[p]) || 0;
        pts.push(Number((v0 + (v1 - v0) * clamped).toFixed(2)));
      }
      var c0 = parseHexColor(a.color);
      var c1 = parseHexColor(b.color);
      var color = toHexColor(
        c0[0] + (c1[0] - c0[0]) * clamped,
        c0[1] + (c1[1] - c0[1]) * clamped,
        c0[2] + (c1[2] - c0[2]) * clamped
      );
      out.push({ points: pts, color: color });
    }
    return out;
  }

  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function formatPointsAttr(points) {
    return points[0] + "," + points[1] + " " + points[2] + "," + points[3] + " " + points[4] + "," + points[5];
  }

  function prefersReducedMotion() {
    return Boolean(
      typeof root.matchMedia === "function" &&
      root.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  }

  /** Monta el visor interactivo Tangram/Origami en containerEl para las mascotas disponibles. */
  function mountTangramShowcase(containerEl, animals, options) {
    if (!containerEl) {
      return { destroy: function () {} };
    }

    var opts = options || {};
    var esc = utils ? utils.esc : function (s) { return String(s == null ? "" : s); };
    var cap = utils ? utils.cap : function (s) { return String(s || ""); };
    var all = Array.isArray(animals) ? animals : [];
    var available = opts.includeAll ? all.slice() : all.filter(function (a) { return a && a.estado === "disponible"; });
    if (!available.length) {
      available = all.slice();
    }

    if (!available.length) {
      containerEl.innerHTML = '<div class="vacio">No hay mascotas disponibles para mostrar en la vista origami.</div>';
      return { destroy: function () {} };
    }

    var currentIndex = 0;
    var currentShards = getPresetForAnimal(available[0]).shards;
    var autoPlay = opts.autoPlay !== false;
    var photoFocus = false;
    var rafId = null;
    var autoTimer = null;
    var destroyed = false;

    function getPrimaryPhoto(animal) {
      if (animal && Array.isArray(animal.fotos) && animal.fotos.length && animal.fotos[0] && animal.fotos[0].url) {
        return {
          url: animal.fotos[0].url,
          alt: animal.fotos[0].alt || ("Foto real de " + (animal.nombre || "mascota"))
        };
      }
      return null;
    }

    function renderThumbMarkup(animal) {
      var foto = getPrimaryPhoto(animal);
      var color = (animal && animal.color) || "#E0F4FD";
      if (foto) {
        return '<img src="' + esc(foto.url) + '" alt="" loading="lazy" onerror="this.style.display=\'none\';if(this.nextElementSibling)this.nextElementSibling.hidden=false;">' +
          '<span class="tangram-thumb-fallback" style="background:' + esc(color) + '" hidden>' + esc((animal.nombre || "?").charAt(0)) + "</span>";
      }
      return '<span class="tangram-thumb-fallback" style="background:' + esc(color) + '">' + esc((animal.nombre || "?").charAt(0)) + "</span>";
    }

    function buildMarkup() {
      var polygons = "";
      for (var i = 0; i < SHARD_COUNT; i++) {
        var sh = currentShards[i];
        polygons += '<polygon class="tangram-shard" points="' + formatPointsAttr(sh.points) + '" fill="' + esc(sh.color) + '" filter="url(#amiuni-shard-depth)"></polygon>';
      }

      var dots = available.map(function (a, idx) {
        return '<button type="button" class="tangram-dot' + (idx === 0 ? " activo" : "") + '" data-tangram-idx="' + idx + '" aria-label="Ver a ' + esc(a.nombre) + '" aria-current="' + (idx === 0 ? "true" : "false") + '" title="' + esc(a.nombre) + '">' +
          renderThumbMarkup(a) +
          '<span class="sr-only">' + esc(a.nombre) + "</span></button>";
      }).join("");

      return (
        '<section class="tangram-showcase" aria-label="Vitrina interactiva de mascotas en origami y foto real">' +
          '<div class="tangram-escena" style="--mx: 50%; --my: 50%;">' +
            '<div class="tangram-foto-fondo" aria-hidden="true">' +
              '<img class="tangram-foto-full" src="" alt="" loading="lazy">' +
            "</div>" +
            '<svg class="tangram-svg" viewBox="' + VIEWBOX + '" role="img" aria-labelledby="tangram-titulo">' +
              "<defs>" +
                '<filter id="amiuni-shard-depth" x="-12%" y="-12%" width="124%" height="124%">' +
                  '<feDropShadow dx="0" dy="2" stdDeviation="2.2" flood-color="#081336" flood-opacity="0.32"/>' +
                "</filter>" +
              "</defs>" +
              polygons +
            "</svg>" +
            '<button type="button" class="tangram-retrato" aria-pressed="false" aria-label="Alternar entre mosaico origami y foto real">' +
              '<img class="tangram-retrato-img" src="" alt="">' +
              '<span class="tangram-retrato-fallback" hidden></span>' +
              '<span class="tangram-retrato-tag">Foto real</span>' +
            "</button>" +
          "</div>" +
          '<div class="tangram-info">' +
            '<span class="tangram-kicker">En piezas · Origami + Foto real</span>' +
            '<h2 id="tangram-titulo" class="tangram-nombre"></h2>' +
            '<p class="tangram-meta"></p>' +
            '<ul class="etiquetas tangram-etiquetas"></ul>' +
            '<p class="tangram-historia"></p>' +
            '<div class="tangram-cta-wrap">' +
              '<a class="btn btn-cta tangram-cta" href="#/animal/' + esc(available[0].id) + '"></a>' +
            "</div>" +
            '<div class="tangram-controles">' +
              '<button type="button" class="btn btn-sec tangram-prev" aria-label="Mascota anterior">← Anterior</button>' +
              '<button type="button" class="btn btn-sec tangram-auto" aria-pressed="' + (autoPlay ? "true" : "false") + '">' + (autoPlay ? "Pausa" : "Auto") + "</button>" +
              '<button type="button" class="btn btn-sec tangram-modo" aria-pressed="false">Ver foto</button>' +
              '<button type="button" class="btn btn-sec tangram-next" aria-label="Siguiente mascota">Siguiente →</button>' +
            "</div>" +
            '<div class="tangram-indicadores" role="group" aria-label="Mascotas disponibles">' + dots + "</div>" +
          "</div>" +
        "</section>"
      );
    }

    containerEl.innerHTML = buildMarkup();

    var showcaseEl = containerEl.querySelector(".tangram-showcase");
    var polygonEls = containerEl.querySelectorAll(".tangram-shard");
    var escenaEl = containerEl.querySelector(".tangram-escena");
    var svgEl = containerEl.querySelector(".tangram-svg");
    var fullFotoEl = containerEl.querySelector(".tangram-foto-full");
    var retratoBtn = containerEl.querySelector(".tangram-retrato");
    var retratoImgEl = containerEl.querySelector(".tangram-retrato-img");
    var retratoFallbackEl = containerEl.querySelector(".tangram-retrato-fallback");
    var retratoTagEl = containerEl.querySelector(".tangram-retrato-tag");
    var nombreEl = containerEl.querySelector(".tangram-nombre");
    var metaEl = containerEl.querySelector(".tangram-meta");
    var tagsEl = containerEl.querySelector(".tangram-etiquetas");
    var historiaEl = containerEl.querySelector(".tangram-historia");
    var ctaEl = containerEl.querySelector(".tangram-cta");
    var prevBtn = containerEl.querySelector(".tangram-prev");
    var nextBtn = containerEl.querySelector(".tangram-next");
    var autoBtn = containerEl.querySelector(".tangram-auto");
    var modoBtn = containerEl.querySelector(".tangram-modo");
    var dotEls = containerEl.querySelectorAll(".tangram-dot");

    function setSpotlight(xPct, yPct) {
      if (!escenaEl || !escenaEl.style || typeof escenaEl.style.setProperty !== "function") {
        return;
      }
      escenaEl.style.setProperty("--mx", xPct + "%");
      escenaEl.style.setProperty("--my", yPct + "%");
    }

    function handlePointerMove(e) {
      if (destroyed || prefersReducedMotion() || !escenaEl || typeof escenaEl.getBoundingClientRect !== "function") {
        return;
      }
      var rect = escenaEl.getBoundingClientRect();
      if (!rect || rect.width <= 0 || rect.height <= 0) { return; }
      var rawX = ((e.clientX - rect.left) / rect.width) * 100;
      var rawY = ((e.clientY - rect.top) / rect.height) * 100;
      var x = Math.max(0, Math.min(100, rawX));
      var y = Math.max(0, Math.min(100, rawY));
      setSpotlight(x.toFixed(1), y.toFixed(1));
    }

    function handlePointerLeave() {
      setSpotlight(50, 50);
    }

    setSpotlight(50, 50);

    function applyShardsToSvg(shards) {
      for (var i = 0; i < polygonEls.length; i++) {
        var sh = shards[i];
        polygonEls[i].setAttribute("points", formatPointsAttr(sh.points));
        polygonEls[i].setAttribute("fill", sh.color);
      }
    }

    function updatePhotoDisplay(animal) {
      var foto = getPrimaryPhoto(animal);
      var color = (animal && animal.color) || "#E0F4FD";
      var initial = esc((animal && animal.nombre ? animal.nombre : "?").charAt(0));

      if (retratoFallbackEl) {
        retratoFallbackEl.style.background = color;
        retratoFallbackEl.textContent = initial;
      }

      if (foto) {
        if (fullFotoEl) {
          fullFotoEl.src = foto.url;
          fullFotoEl.alt = foto.alt;
          fullFotoEl.hidden = false;
        }
        if (retratoImgEl) {
          retratoImgEl.hidden = false;
          retratoImgEl.src = foto.url;
          retratoImgEl.alt = foto.alt;
          retratoImgEl.onerror = function () {
            retratoImgEl.hidden = true;
            if (retratoFallbackEl) { retratoFallbackEl.hidden = false; }
            if (fullFotoEl) { fullFotoEl.hidden = true; }
          };
        }
        if (retratoFallbackEl) { retratoFallbackEl.hidden = true; }
      } else {
        if (fullFotoEl) { fullFotoEl.hidden = true; fullFotoEl.removeAttribute("src"); }
        if (retratoImgEl) { retratoImgEl.hidden = true; retratoImgEl.removeAttribute("src"); }
        if (retratoFallbackEl) { retratoFallbackEl.hidden = false; }
      }
    }

    function togglePhotoMode(forceVal) {
      photoFocus = typeof forceVal === "boolean" ? forceVal : !photoFocus;
      if (showcaseEl) {
        showcaseEl.classList.toggle("modo-foto", photoFocus);
      }
      if (modoBtn) {
        modoBtn.setAttribute("aria-pressed", photoFocus ? "true" : "false");
        modoBtn.textContent = photoFocus ? "Ver origami" : "Ver foto";
      }
      if (retratoBtn) {
        retratoBtn.setAttribute("aria-pressed", photoFocus ? "true" : "false");
      }
      if (retratoTagEl) {
        retratoTagEl.textContent = photoFocus ? "Origami" : "Foto real";
      }
    }

    function updateInfo(index) {
      var animal = available[index];
      if (!animal) { return; }
      nombreEl.textContent = animal.nombre;
      metaEl.textContent = cap(animal.especie) + " · " + animal.edadTexto + " · " + animal.tamano;
      var tags = Array.isArray(animal.etiquetas) ? animal.etiquetas.slice(0, 3) : [];
      tagsEl.innerHTML = tags.map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("");
      historiaEl.textContent = animal.historia || "";
      ctaEl.href = "#/animal/" + encodeURIComponent(animal.id);
      ctaEl.textContent = "Ver ficha de " + animal.nombre;
      updatePhotoDisplay(animal);
      if (svgEl) {
        svgEl.setAttribute("aria-label", "Silueta poligonal de " + animal.nombre);
      }
      for (var i = 0; i < dotEls.length; i++) {
        var active = i === index;
        dotEls[i].classList.toggle("activo", active);
        dotEls[i].setAttribute("aria-current", active ? "true" : "false");
      }
    }

    function stopAnimation() {
      if (rafId !== null && typeof root.cancelAnimationFrame === "function") {
        root.cancelAnimationFrame(rafId);
      }
      rafId = null;
    }

    function goTo(targetIdx) {
      if (destroyed || !available.length) { return; }
      var nextIdx = ((targetIdx % available.length) + available.length) % available.length;
      if (nextIdx === currentIndex && !opts.force) {
        return;
      }

      var fromShards = cloneShards(currentShards);
      var toShards = getPresetForAnimal(available[nextIdx]).shards;
      currentIndex = nextIdx;
      updateInfo(nextIdx);
      stopAnimation();

      if (prefersReducedMotion() || typeof root.requestAnimationFrame !== "function") {
        currentShards = toShards;
        applyShardsToSvg(currentShards);
        return;
      }

      var duration = Number(opts.duration) > 0 ? Number(opts.duration) : 650;
      var startTime = null;

      function step(ts) {
        if (destroyed) { return; }
        if (startTime === null) { startTime = ts; }
        var elapsed = ts - startTime;
        var rawT = Math.min(1, elapsed / duration);
        var easedT = easeInOutCubic(rawT);
        currentShards = interpolateShards(fromShards, toShards, easedT);
        applyShardsToSvg(currentShards);
        if (rawT < 1) {
          rafId = root.requestAnimationFrame(step);
        } else {
          rafId = null;
          currentShards = toShards;
        }
      }

      rafId = root.requestAnimationFrame(step);
    }

    function scheduleAuto() {
      if (autoTimer !== null) {
        clearInterval(autoTimer);
        autoTimer = null;
      }
      if (autoPlay && available.length > 1 && !destroyed) {
        autoTimer = setInterval(function () {
          if (destroyed || (typeof root.document !== "undefined" && !root.document.body.contains(containerEl))) {
            destroy();
            return;
          }
          goTo(currentIndex + 1);
        }, Number(opts.interval) > 0 ? Number(opts.interval) : 4500);
      }
    }

    function toggleAuto(forceVal) {
      autoPlay = typeof forceVal === "boolean" ? forceVal : !autoPlay;
      if (autoBtn) {
        autoBtn.setAttribute("aria-pressed", autoPlay ? "true" : "false");
        autoBtn.textContent = autoPlay ? "Pausa" : "Auto";
      }
      scheduleAuto();
    }

    function destroy() {
      destroyed = true;
      stopAnimation();
      if (autoTimer !== null) {
        clearInterval(autoTimer);
        autoTimer = null;
      }
      if (escenaEl && typeof escenaEl.removeEventListener === "function") {
        escenaEl.removeEventListener("pointermove", handlePointerMove);
        escenaEl.removeEventListener("pointerleave", handlePointerLeave);
      }
    }

    if (escenaEl && typeof escenaEl.addEventListener === "function" && !prefersReducedMotion()) {
      escenaEl.addEventListener("pointermove", handlePointerMove);
      escenaEl.addEventListener("pointerleave", handlePointerLeave);
    }

    prevBtn.addEventListener("click", function () {
      goTo(currentIndex - 1);
      scheduleAuto();
    });
    nextBtn.addEventListener("click", function () {
      goTo(currentIndex + 1);
      scheduleAuto();
    });
    autoBtn.addEventListener("click", function () {
      toggleAuto();
    });
    if (modoBtn) {
      modoBtn.addEventListener("click", function () {
        togglePhotoMode();
      });
    }
    if (retratoBtn) {
      retratoBtn.addEventListener("click", function () {
        togglePhotoMode();
      });
    }
    for (var d = 0; d < dotEls.length; d++) {
      dotEls[d].addEventListener("click", function () {
        var idx = Number(this.getAttribute("data-tangram-idx"));
        if (Number.isFinite(idx)) {
          goTo(idx);
          scheduleAuto();
        }
      });
    }

    updateInfo(0);
    scheduleAuto();

    return {
      goTo: goTo,
      next: function () { goTo(currentIndex + 1); },
      prev: function () { goTo(currentIndex - 1); },
      toggleAuto: toggleAuto,
      destroy: destroy
    };
  }

  var api = {
    SHARD_COUNT: SHARD_COUNT,
    VIEWBOX: VIEWBOX,
    PRESETS: PRESETS,
    getPresetForAnimal: getPresetForAnimal,
    interpolateShards: interpolateShards,
    mountTangramShowcase: mountTangramShowcase
  };

  App.tangram = api;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : window);
