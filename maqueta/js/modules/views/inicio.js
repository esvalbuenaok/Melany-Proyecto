/* Vista de Inicio: vitrina Tangram/Origami, metricas en vivo, buscador, filtros y galeria. */
(function (root) {
  "use strict";

  var App = (root.AmiuniApp = root.AmiuniApp || {});
  App.views = App.views || {};

  function hasCompatKey(compat, key) {
    if (!compat) { return false; }
    if (typeof compat === "string") { return compat === key; }
    if (Array.isArray(compat)) { return compat.indexOf(key) !== -1; }
    if (typeof compat === "object") { return Boolean(compat[key]); }
    return false;
  }

  function renderInicio(vista) {
    var store = App.store;
    var utils = App.utils;
    var filtersMod = App.filters;
    var components = App.components;
    var tangram = App.tangram;

    var esc = utils.esc;
    var f = store.getFilters();
    var stats = store.getStats();
    var site = typeof store.getSiteConfig === "function" ? store.getSiteConfig() : {};
    var allAnimals = store.getAnimals();
    var showcaseCtrl = null;
    var showTangram = true;
    var kickerHtml = site.portadaKicker
      ? '<span class="portada-kicker">' + esc(site.portadaKicker) + "</span>"
      : "";

    vista.innerHTML =
      '<section class="pantalla reticula">' +
        '<div class="portada">' +
          kickerHtml +
          "<h1>" + esc(site.portadaTitulo || "Encuentra a tu compañero") + "</h1>" +
          "<p>" + esc(site.portadaDescripcion || "Perros y gatos rescatados en Mérida esperan un hogar. Conoce su historia y adopta con confianza.") + "</p>" +
          '<div class="portada-acciones">' +
            '<a class="btn btn-cta" href="#/donar">' + esc(site.portadaCtaTexto || "Quiero ayudar") + "</a>" +
            '<button type="button" class="btn btn-sec" id="toggle-tangram" aria-expanded="true">Ocultar vista origami</button>' +
          "</div>" +
          '<span class="huellas">' + utils.ICONOS.huella + "</span>" +
        "</div>" +
        '<div id="tangram-wrap" class="tangram-wrap"></div>' +
        components.renderMetrics(stats) +
        '<form class="filtros" id="filtros" aria-label="Buscar y filtrar animales">' +
          '<div class="campo campo-busqueda">' +
            '<label for="f-busqueda">Buscar por nombre, historia o etiqueta</label>' +
            '<input id="f-busqueda" name="busqueda" type="search" placeholder="Ej. Luna, tranquilo, Mérida..." value="' + esc(f.busqueda || "") + '">' +
          "</div>" +
          '<div class="campo"><label for="f-especie">Especie</label><select id="f-especie" name="especie">' +
            components.renderSelectOptions([["", "Todas"], ["perro", "Perros"], ["gato", "Gatos"]], f.especie || "") +
          "</select></div>" +
          '<div class="campo"><label for="f-edad">Edad</label><select id="f-edad" name="edad">' +
            components.renderSelectOptions([["", "Todas"], ["cachorro", "Cachorro"], ["joven", "Joven"], ["adulto", "Adulto"], ["senior", "Senior"]], f.edad || "") +
          "</select></div>" +
          '<div class="campo"><label for="f-tamano">Tamaño</label><select id="f-tamano" name="tamano">' +
            components.renderSelectOptions([["", "Todos"], ["pequeño", "Pequeño"], ["mediano", "Mediano"], ["grande", "Grande"]], f.tamano || "") +
          "</select></div>" +
          '<div class="campo"><label for="f-sexo">Sexo</label><select id="f-sexo" name="sexo">' +
            components.renderSelectOptions([["", "Todos"], ["hembra", "Hembra"], ["macho", "Macho"]], f.sexo || "") +
          "</select></div>" +
          '<div class="campo"><label for="f-estado">Estado</label><select id="f-estado" name="estado">' +
            components.renderSelectOptions([["", "Todos"], ["disponible", "Disponibles"], ["proceso", "En proceso"], ["adoptado", "Adoptados"]], f.estado || "") +
          "</select></div>" +
          '<div class="campo"><label for="f-orden">Ordenar por</label><select id="f-orden" name="orden">' +
            components.renderSelectOptions([["", "Predeterminado"], ["disponibles", "Disponibles primero"], ["nombre", "Nombre (A-Z)"], ["recientes", "Más recientes"]], f.orden || "") +
          "</select></div>" +
          '<div class="filtros-checks">' +
            '<label class="check-pill"><input type="checkbox" id="f-ninos" name="aptoNinos"' + (hasCompatKey(f.compatibilidad, "ninos") ? " checked" : "") + "> Apto para niños</label>" +
            '<label class="check-pill"><input type="checkbox" id="f-apto" name="aptoApartamento"' + (hasCompatKey(f.compatibilidad, "apartamento") ? " checked" : "") + "> Apto para apartamento</label>" +
            '<label class="check-pill"><input type="checkbox" id="f-favs" name="soloFavoritos"' + (f.soloFavoritos ? " checked" : "") + "> Solo favoritos</label>" +
          "</div>" +
          '<div class="fila-acciones">' +
            '<span class="contador" id="contador" aria-live="polite"></span>' +
            '<button type="button" class="btn-texto" id="limpiar">Quitar filtros</button>' +
          "</div>" +
        "</form>" +
        '<div class="reticula resultados-grid" id="resultados"></div>' +
      "</section>";

    var tangramWrap = vista.querySelector("#tangram-wrap");
    var toggleTangramBtn = vista.querySelector("#toggle-tangram");
    var formEl = vista.querySelector("#filtros");
    var resultadosEl = vista.querySelector("#resultados");
    var contadorEl = vista.querySelector("#contador");
    var limpiarBtn = vista.querySelector("#limpiar");

    function mountShowcase() {
      if (showcaseCtrl && typeof showcaseCtrl.destroy === "function") {
        showcaseCtrl.destroy();
        showcaseCtrl = null;
      }
      if (showTangram && tangram && typeof tangram.mountTangramShowcase === "function") {
        tangramWrap.hidden = false;
        showcaseCtrl = tangram.mountTangramShowcase(tangramWrap, allAnimals, { autoPlay: true });
      } else {
        tangramWrap.hidden = true;
      }
    }

    function paintResults() {
      var currentFilters = store.getFilters();
      var total = store.getAnimals().length;
      var filtered = store.getAnimals(currentFilters);
      var favList = store.getFavorites();
      var favLookup = {};
      favList.forEach(function (id) { favLookup[id] = true; });

      if (!filtered.length) {
        resultadosEl.innerHTML = '<div class="vacio">No encontramos animales con esos filtros.<br>Prueba quitando alguno o limpiando la búsqueda.</div>';
      } else {
        resultadosEl.innerHTML = filtered.map(function (a) {
          return components.renderAnimalCard(a, Boolean(favLookup[a.id]));
        }).join("");
      }

      var activeCount = filtersMod ? filtersMod.countActiveFilters(currentFilters) : 0;
      var summary = filtersMod
        ? filtersMod.summarizeResults(total, filtered.length)
        : (filtered.length + " animales");
      contadorEl.textContent = activeCount > 0
        ? summary + " (" + activeCount + (activeCount === 1 ? " filtro activo)" : " filtros activos)")
        : summary;
    }

    function syncFormFromFilters(filtersObj) {
      formEl.elements.busqueda.value = filtersObj.busqueda || "";
      formEl.elements.especie.value = filtersObj.especie || "";
      formEl.elements.edad.value = filtersObj.edad || "";
      formEl.elements.tamano.value = filtersObj.tamano || "";
      formEl.elements.sexo.value = filtersObj.sexo || "";
      formEl.elements.estado.value = filtersObj.estado || "";
      formEl.elements.orden.value = filtersObj.orden || "";
      formEl.elements.aptoNinos.checked = hasCompatKey(filtersObj.compatibilidad, "ninos");
      formEl.elements.aptoApartamento.checked = hasCompatKey(filtersObj.compatibilidad, "apartamento");
      formEl.elements.soloFavoritos.checked = Boolean(filtersObj.soloFavoritos);
    }

    function readFiltersFromForm() {
      var compat = [];
      if (formEl.elements.aptoNinos.checked) { compat.push("ninos"); }
      if (formEl.elements.aptoApartamento.checked) { compat.push("apartamento"); }
      return {
        busqueda: formEl.elements.busqueda.value,
        especie: formEl.elements.especie.value,
        edad: formEl.elements.edad.value,
        tamano: formEl.elements.tamano.value,
        sexo: formEl.elements.sexo.value,
        estado: formEl.elements.estado.value,
        orden: formEl.elements.orden.value,
        compatibilidad: compat,
        soloFavoritos: formEl.elements.soloFavoritos.checked
      };
    }

    formEl.addEventListener("input", function (e) {
      if (e.target && e.target.name === "busqueda") {
        store.setFilters({ busqueda: e.target.value });
        paintResults();
      }
    });

    formEl.addEventListener("change", function () {
      store.setFilters(readFiltersFromForm());
      paintResults();
    });

    formEl.addEventListener("submit", function (e) {
      e.preventDefault();
    });

    limpiarBtn.addEventListener("click", function () {
      var reset = store.resetFilters();
      syncFormFromFilters(reset);
      paintResults();
    });

    toggleTangramBtn.addEventListener("click", function () {
      showTangram = !showTangram;
      toggleTangramBtn.setAttribute("aria-expanded", showTangram ? "true" : "false");
      toggleTangramBtn.textContent = showTangram ? "Ocultar vista origami" : "Ver vista origami";
      mountShowcase();
    });

    resultadosEl.addEventListener("click", function (e) {
      var favBtn = e.target && e.target.closest ? e.target.closest("[data-fav-id]") : null;
      if (!favBtn) { return; }
      var animalId = favBtn.getAttribute("data-fav-id");
      var animalObj = store.getAnimalById(animalId);
      var nowFav = store.toggleFavorite(animalId);
      var nombre = animalObj ? animalObj.nombre : "animal";

      if (store.getFilters().soloFavoritos) {
        paintResults();
      } else {
        favBtn.classList.toggle("activo", nowFav);
        favBtn.setAttribute("aria-pressed", nowFav ? "true" : "false");
        favBtn.setAttribute("aria-label", nowFav
          ? "Quitar a " + nombre + " de favoritos"
          : "Guardar a " + nombre + " en favoritos");
        favBtn.innerHTML = nowFav ? utils.ICONOS.corazonLleno : utils.ICONOS.corazon;
      }

      utils.showToast(nowFav ? nombre + " guardado en favoritos." : nombre + " quitado de favoritos.", "info");
    });

    mountShowcase();
    paintResults();

    return function cleanup() {
      if (showcaseCtrl && typeof showcaseCtrl.destroy === "function") {
        showcaseCtrl.destroy();
      }
    };
  }

  App.views.inicio = renderInicio;
})(typeof globalThis !== "undefined" ? globalThis : window);
