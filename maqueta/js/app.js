/* Amiuni · maqueta funcional (HTML/CSS/JS puro, sin dependencias).
   Rutas por hash: #/ inicio · #/animal/ID · #/adopcion/ID · #/donar */
(function () {
  "use strict";
  var D = window.AMIUNI;
  var vista = document.getElementById("vista");
  var filtros = { especie: "", edad: "", tamano: "", sexo: "" };

  /* ---------- utilidades ---------- */
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function animal(id) { return D.animales.filter(function (a) { return a.id === id; })[0]; }

  var ICONOS = {
    jeringa: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 2l4 4M17 7l3-3M19 9l-8.7 8.7a2 2 0 0 1-2.8 0L6.3 16.5a2 2 0 0 1 0-2.8L15 5M9 11l4 4M5 19l-3 3M14 4l6 6"/></svg>',
    huella: '<svg viewBox="0 0 32 32" fill="currentColor" aria-hidden="true"><ellipse cx="16" cy="21" rx="7.5" ry="6"/><ellipse cx="6.5" cy="13" rx="3" ry="3.8"/><ellipse cx="12.5" cy="7.5" rx="3" ry="3.8"/><ellipse cx="19.5" cy="7.5" rx="3" ry="3.8"/><ellipse cx="25.5" cy="13" rx="3" ry="3.8"/></svg>',
    corazon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.8 5.6a5 5 0 0 0-7.1 0L12 7.3l-1.7-1.7a5 5 0 0 0-7.1 7.1L12 21.5l8.8-8.8a5 5 0 0 0 0-7.1z"/></svg>',
    casa: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 11l9-8 9 8M5 10v10h14V10M10 20v-6h4v6"/></svg>',
    ok: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M8 12.5l3 3 5-6"/></svg>'
  };

  /* Marcador de posición hasta tener fotos reales de los animales rescatados */
  function foto(a) {
    return '<div class="foto-ejemplo" style="background:' + a.color + ';color:#1E3A8A" role="img" aria-label="Foto de ejemplo de ' + esc(a.nombre) + '">' +
      ICONOS.huella + "<small>foto de ejemplo</small></div>";
  }
  function insignia(a) {
    return a.estado === "disponible"
      ? '<span class="insignia">¡Adóptame!</span>'
      : '<span class="insignia proceso">En proceso</span>';
  }

  /* ---------- Inicio ---------- */
  function opciones(lista, actual) {
    return lista.map(function (o) {
      return '<option value="' + esc(o[0]) + '"' + (o[0] === actual ? " selected" : "") + ">" + esc(o[1]) + "</option>";
    }).join("");
  }
  function filtrar() {
    return D.animales.filter(function (a) {
      return (!filtros.especie || a.especie === filtros.especie) &&
        (!filtros.edad || a.edad === filtros.edad) &&
        (!filtros.tamano || a.tamano === filtros.tamano) &&
        (!filtros.sexo || a.sexo === filtros.sexo);
    });
  }
  function tarjetas() {
    var r = filtrar();
    if (!r.length) {
      return '<div class="vacio">No encontramos animales con esos filtros.<br>Prueba quitando alguno.</div>';
    }
    return r.map(function (a) {
      return '<a class="tarjeta" href="#/animal/' + a.id + '"><div class="foto">' + foto(a) + insignia(a) + "</div>" +
        '<div class="cuerpo"><h3>' + esc(a.nombre) + '</h3><p class="meta">' + esc(cap(a.especie)) + " · " + esc(a.edadTexto) + " · " + esc(a.tamano) + "</p></div></a>";
    }).join("");
  }
  function pintarResultados() {
    var r = filtrar();
    document.getElementById("resultados").innerHTML = tarjetas();
    document.getElementById("contador").textContent = r.length + (r.length === 1 ? " animal" : " animales");
  }
  function inicio() {
    var s = D.estadisticas;
    vista.innerHTML =
      '<section class="pantalla reticula">' +
      '<div class="portada"><h1>Encuentra a tu compañero</h1><p>Perros y gatos rescatados en Mérida esperan un hogar. Conoce su historia y adopta con confianza.</p>' +
      '<a class="btn btn-cta" href="#/donar">Quiero ayudar</a><span class="huellas">' + ICONOS.huella + "</span></div>" +
      '<div class="metricas" aria-label="Transparencia de la fundación">' +
      '<div class="metrica"><b>' + s.adoptados + "</b><span>adopciones logradas</span></div>" +
      '<div class="metrica"><b>' + s.enProceso + "</b><span>procesos en curso</span></div>" +
      '<div class="metrica"><b>' + s.atendidos + "</b><span>animales atendidos</span></div></div>" +
      '<form class="filtros" id="filtros" aria-label="Filtrar animales">' +
      '<div class="campo"><label for="f-especie">Especie</label><select id="f-especie" name="especie">' + opciones([["", "Todas"], ["perro", "Perros"], ["gato", "Gatos"]], filtros.especie) + "</select></div>" +
      '<div class="campo"><label for="f-edad">Edad</label><select id="f-edad" name="edad">' + opciones([["", "Todas"], ["cachorro", "Cachorro"], ["joven", "Joven"], ["adulto", "Adulto"], ["senior", "Senior"]], filtros.edad) + "</select></div>" +
      '<div class="campo"><label for="f-tamano">Tamaño</label><select id="f-tamano" name="tamano">' + opciones([["", "Todos"], ["pequeño", "Pequeño"], ["mediano", "Mediano"], ["grande", "Grande"]], filtros.tamano) + "</select></div>" +
      '<div class="campo"><label for="f-sexo">Sexo</label><select id="f-sexo" name="sexo">' + opciones([["", "Todos"], ["hembra", "Hembra"], ["macho", "Macho"]], filtros.sexo) + "</select></div>" +
      '<div class="fila-acciones"><span class="contador" id="contador" aria-live="polite"></span><button type="button" class="btn-texto" id="limpiar">Quitar filtros</button></div></form>' +
      '<div class="reticula" style="grid-column:1/-1;display:contents" id="resultados"></div></section>';
    pintarResultados();
    document.getElementById("filtros").addEventListener("change", function (e) {
      filtros[e.target.name] = e.target.value;
      pintarResultados();
    });
    document.getElementById("limpiar").addEventListener("click", function () {
      filtros = { especie: "", edad: "", tamano: "", sexo: "" };
      inicio();
    });
  }

  /* ---------- Ficha del animal ---------- */
  function modulo(icono, texto, si) {
    return '<div class="modulo' + (si ? "" : " no") + '">' + icono + (si ? "" : "<span class='sr-only'>No: </span>") + texto + "</div>";
  }
  function ficha(id) {
    var a = animal(id);
    if (!a) { return noEncontrado(); }
    var disp = a.estado === "disponible";
    vista.innerHTML =
      '<section class="pantalla reticula"><div class="migas"><a href="#/">← Ver todos los animales</a></div>' +
      '<article class="ficha"><div class="ficha-foto">' + foto(a) + insignia(a) + "</div><div>" +
      "<h1>" + esc(a.nombre) + '</h1><p class="datos-basicos">' + esc(cap(a.especie)) + " · " + esc(a.sexo) + " · " + esc(a.edadTexto) + " · " + esc(a.tamano) + "</p>" +
      '<div class="modulos" aria-label="Ficha médica">' +
      modulo(ICONOS.jeringa, a.salud.vacunas ? "Vacunas al día" : "Vacunas pendientes", a.salud.vacunas) +
      modulo(ICONOS.huella, a.salud.esterilizado ? "Esterilizado/a" : "Sin esterilizar", a.salud.esterilizado) +
      modulo(ICONOS.corazon, a.salud.desparasitado ? "Desparasitado/a" : "Desparasitación pendiente", a.salud.desparasitado) + "</div>" +
      "<h2>Temperamento y convivencia</h2>" +
      '<ul class="etiquetas">' + a.etiquetas.map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("") + "</ul>" +
      '<div class="historia"><h2>Mi historia</h2><p>' + esc(a.historia) + "</p></div>" +
      '<div class="barra-cta">' +
      (disp ? '<a class="btn btn-cta" href="#/adopcion/' + a.id + '">Solicitar adopción</a>'
            : '<span class="btn" aria-disabled="true">Ya tiene una solicitud en proceso</span>') +
      "</div></div></article></section>";
  }

  /* ---------- Formulario de adopción (por pasos) ---------- */
  var sol = null; // { id, paso, datos }
  var PASOS = ["Tus datos", "Tu hogar", "Confirmar"];
  function campoTexto(n, etiqueta, tipo, extra) {
    var v = sol.datos[n] || "";
    return '<div class="campo" data-campo="' + n + '"><label for="c-' + n + '">' + etiqueta + '</label><input id="c-' + n + '" name="' + n + '" type="' + tipo + '" value="' + esc(v) + '" autocomplete="' + (extra || "off") + '"><span class="error" aria-live="polite"></span></div>';
  }
  function grupoRadio(n, etiqueta, lista) {
    return '<fieldset class="campo opciones" data-campo="' + n + '"><legend>' + etiqueta + "</legend>" +
      lista.map(function (o) {
        return '<label class="opcion"><input type="radio" name="' + n + '" value="' + esc(o) + '"' + (sol.datos[n] === o ? " checked" : "") + "> " + esc(o) + "</label>";
      }).join("") + '<span class="error" aria-live="polite"></span></fieldset>';
  }
  var REGLAS = {
    nombre: function (v) { return v.trim().length >= 3 || "Escribe tu nombre completo."; },
    telefono: function (v) { return /^[0-9+\s()-]{10,16}$/.test(v.trim()) || "Escribe un teléfono válido, por ejemplo 0412 1234567."; },
    correo: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) || "Escribe un correo válido."; },
    vivienda: function (v) { return !!v || "Elige una opción."; },
    otros: function (v) { return !!v || "Elige una opción."; },
    ninos: function (v) { return !!v || "Elige una opción."; },
    motivo: function (v) { return v.trim().length >= 15 || "Cuéntanos un poco más (mínimo 15 caracteres)."; },
    visita: function (v) { return v === "si" || "Debes aceptar para continuar."; }
  };
  var POR_PASO = [["nombre", "telefono", "correo"], ["vivienda", "otros", "ninos", "motivo"], ["visita"]];
  function pasoValido(p) {
    return POR_PASO[p].every(function (n) { return REGLAS[n](sol.datos[n] || "") === true; });
  }
  function adopcion(id) {
    var a = animal(id);
    if (!a || a.estado !== "disponible") { return noEncontrado(); }
    if (!sol || sol.id !== id) { sol = { id: id, paso: 0, datos: {}, enviado: false }; }
    var p = sol.paso, h;
    if (sol.enviado) {
      vista.innerHTML = '<section class="pantalla reticula"><div class="panel confirmacion">' + ICONOS.ok +
        "<h1>¡Solicitud enviada!</h1><p>Gracias, " + esc(sol.datos.nombre.split(" ")[0]) + ". La fundación revisará tu solicitud para adoptar a <strong>" + esc(a.nombre) + "</strong> y te escribirá por WhatsApp.</p>" +
        '<p class="aviso">Maqueta: no se envió ningún dato real.</p><a class="btn btn-cta" href="#/">Ver más animales</a></div></section>';
      return;
    }
    if (p === 0) {
      h = campoTexto("nombre", "Nombre y apellido", "text", "name") + campoTexto("telefono", "Teléfono (WhatsApp)", "tel", "tel") + campoTexto("correo", "Correo electrónico", "email", "email");
    } else if (p === 1) {
      h = grupoRadio("vivienda", "¿Dónde vivirá?", ["Casa con patio", "Casa sin patio", "Apartamento"]) +
        grupoRadio("otros", "¿Tienes otros animales?", ["Sí", "No"]) +
        grupoRadio("ninos", "¿Hay niños en casa?", ["Sí", "No"]) +
        '<div class="campo" data-campo="motivo"><label for="c-motivo">¿Por qué quieres adoptar a ' + esc(a.nombre) + '?</label><textarea id="c-motivo" name="motivo">' + esc(sol.datos.motivo || "") + '</textarea><span class="error" aria-live="polite"></span></div>';
    } else {
      var d = sol.datos;
      h = '<dl class="resumen"><div><dt>Animal</dt><dd>' + esc(a.nombre) + "</dd></div><div><dt>Nombre</dt><dd>" + esc(d.nombre) + "</dd></div><div><dt>Teléfono</dt><dd>" + esc(d.telefono) + "</dd></div><div><dt>Correo</dt><dd>" + esc(d.correo) + "</dd></div><div><dt>Vivienda</dt><dd>" + esc(d.vivienda) + "</dd></div><div><dt>Otros animales</dt><dd>" + esc(d.otros) + "</dd></div><div><dt>Niños</dt><dd>" + esc(d.ninos) + "</dd></div></dl>" +
        '<div class="campo" data-campo="visita"><label class="opcion"><input type="checkbox" name="visita" value="si"' + (d.visita === "si" ? " checked" : "") + "> Acepto una visita o llamada de seguimiento de la fundación.</label>" + '<span class="error" aria-live="polite"></span></div>';
    }
    vista.innerHTML = '<section class="pantalla reticula"><div class="panel"><div class="migas"><a href="#/animal/' + a.id + '">← Volver a la ficha de ' + esc(a.nombre) + "</a></div>" +
      "<h1>Adoptar a " + esc(a.nombre) + "</h1>" +
      '<ol class="pasos" aria-label="Progreso">' + PASOS.map(function (n, i) {
        return '<li class="' + (i < p ? "hecho" : i === p ? "actual" : "") + '"' + (i === p ? ' aria-current="step"' : "") + ">" + (i + 1) + ". " + n + "</li>";
      }).join("") + "</ol>" +
      '<form class="formulario" id="form" novalidate>' + h +
      '<div class="acciones">' + (p > 0 ? '<button type="button" class="btn btn-sec" id="atras">Atrás</button>' : "") +
      '<button type="submit" class="btn btn-cta" id="sig">' + (p === 2 ? "Enviar solicitud" : "Continuar") + "</button></div></form></div></section>";
    var form = document.getElementById("form"), sig = document.getElementById("sig");
    function marcar(mostrarErrores) {
      POR_PASO[p].forEach(function (n) {
        var cont = form.querySelector('[data-campo="' + n + '"]');
        var r = REGLAS[n](sol.datos[n] || "");
        cont.classList.toggle("invalido", mostrarErrores && r !== true);
        cont.querySelector(".error").textContent = mostrarErrores && r !== true ? r : "";
      });
      var ok = pasoValido(p);
      sig.disabled = !ok; // estado inactivo hasta completar los campos
    }
    function leer(e) {
      var t = e.target;
      if (t.type === "checkbox") { sol.datos[t.name] = t.checked ? "si" : ""; } else { sol.datos[t.name] = t.value; }
      marcar(e.type === "change" || e.type === "blur");
    }
    form.addEventListener("input", leer);
    form.addEventListener("change", leer);
    form.addEventListener("focusout", function (e) { if (e.target.name) { marcar(true); } });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!pasoValido(p)) { marcar(true); return; }
      if (p < 2) { sol.paso++; } else { sol.enviado = true; }
      adopcion(id);
      window.scrollTo(0, 0);
    });
    var atras = document.getElementById("atras");
    if (atras) { atras.addEventListener("click", function () { sol.paso--; adopcion(id); window.scrollTo(0, 0); }); }
    marcar(false);
  }

  /* ---------- Donación ---------- */
  var don = { monto: "", otro: "", metodo: "", padrino: false, hecho: false };
  function montoActual() { return don.monto === "otro" ? Number(don.otro) || 0 : Number(don.monto) || 0; }
  function donar() {
    var m = D.meta, pct = Math.min(100, Math.round(m.recaudado / m.objetivo * 100));
    if (don.hecho) {
      vista.innerHTML = '<section class="pantalla reticula"><div class="panel confirmacion">' + ICONOS.ok +
        "<h1>¡Gracias por tu aporte!</h1><p>Anotamos tu intención de donar <strong>$" + montoActual() + "</strong>" + (don.padrino ? " como padrino/madrina" : "") + ". En la versión real aquí verás los datos de " + esc(don.metodo) + " y recibirás un comprobante.</p>" +
        '<p class="aviso">Maqueta: no se procesó ningún pago.</p><a class="btn btn-cta" href="#/">Conocer a los animales</a></div></section>';
      return;
    }
    vista.innerHTML = '<section class="pantalla reticula"><div class="panel"><h1>Tu aporte cambia una vida</h1>' +
      "<p>Cada dólar se destina a esterilización, alimentación y tratamientos. Mira el avance en tiempo real.</p>" +
      '<div class="historia"><strong>' + esc(m.etiqueta) + '</strong><div class="meta-barra" role="progressbar" aria-valuemin="0" aria-valuemax="' + m.objetivo + '" aria-valuenow="' + m.recaudado + '"><i style="width:' + pct + '%"></i></div><span class="contador">$' + m.recaudado + " de $" + m.objetivo + " (" + pct + " %)</span></div>" +
      '<ul class="impacto"><li><b>$5</b>una desparasitación</li><li><b>$20</b>una vacuna completa</li><li><b>$45</b>una esterilización</li></ul>' +
      '<form class="formulario" id="form-don" novalidate>' +
      '<fieldset class="campo"><legend>Elige un monto (USD)</legend><div class="montos">' +
      ["5", "10", "20", "45", "otro"].map(function (v) {
        return '<label class="monto"><input type="radio" name="monto" value="' + v + '"' + (don.monto === v ? " checked" : "") + "><span>" + (v === "otro" ? "Otro" : "$" + v) + "</span></label>";
      }).join("") + "</div></fieldset>" +
      '<div class="campo" id="otro-wrap"' + (don.monto === "otro" ? "" : " hidden") + '><label for="c-otro">Monto (USD)</label><input id="c-otro" name="otro" type="number" min="1" step="1" inputmode="numeric" value="' + esc(don.otro) + '"></div>' +
      '<fieldset class="campo opciones"><legend>Medio de pago</legend>' + ["Pago móvil", "Transferencia bancaria", "Zelle"].map(function (o) {
        return '<label class="opcion"><input type="radio" name="metodo" value="' + o + '"' + (don.metodo === o ? " checked" : "") + "> " + o + "</label>";
      }).join("") + "</fieldset>" +
      '<label class="opcion"><input type="checkbox" name="padrino"' + (don.padrino ? " checked" : "") + "> Quiero apadrinar a un animal con un aporte mensual</label>" +
      '<button type="submit" class="btn btn-cta btn-bloque" id="btn-don">Donar</button></form>' +
      '<h2 style="margin-top:28px">Lo que dicen quienes ya ayudaron</h2>' +
      D.testimonios.map(function (t) { return '<blockquote class="testimonio" style="margin-inline:0">' + esc(t.texto) + "<cite>" + esc(t.autor) + "</cite></blockquote>"; }).join("") +
      "</div></section>";
    var f = document.getElementById("form-don"), b = document.getElementById("btn-don");
    function revisar() { b.disabled = !(montoActual() > 0 && don.metodo); }
    f.addEventListener("input", function (e) {
      var t = e.target;
      if (t.name === "padrino") { don.padrino = t.checked; } else { don[t.name] = t.value; }
      document.getElementById("otro-wrap").hidden = don.monto !== "otro";
      revisar();
    });
    f.addEventListener("submit", function (e) { e.preventDefault(); if (montoActual() > 0 && don.metodo) { don.hecho = true; donar(); window.scrollTo(0, 0); } });
    revisar();
  }

  function noEncontrado() {
    vista.innerHTML = '<section class="pantalla"><div class="vacio"><h1>No encontramos esa página</h1><a class="btn btn-cta" href="#/">Volver al inicio</a></div></section>';
  }

  /* ---------- Rutas ---------- */
  function ruta() {
    var p = (location.hash || "#/").replace(/^#\/?/, "").split("/");
    var nombre = p[0] || "inicio";
    if (nombre !== "donar") { don.hecho = false; }
    if (nombre !== "adopcion" && sol && sol.enviado) { sol = null; }
    if (nombre === "inicio") { inicio(); }
    else if (nombre === "animal") { ficha(p[1]); }
    else if (nombre === "adopcion") { adopcion(p[1]); }
    else if (nombre === "donar") { donar(); }
    else { noEncontrado(); }
    document.querySelectorAll(".nav a").forEach(function (l) {
      var activo = l.dataset.ruta === (nombre === "animal" || nombre === "adopcion" ? "inicio" : nombre);
      if (activo) { l.setAttribute("aria-current", "page"); } else { l.removeAttribute("aria-current"); }
    });
    window.scrollTo(0, 0);
    document.title = "Amiuni · " + (nombre === "donar" ? "Donar" : "Adopta y dona");
  }
  window.addEventListener("hashchange", ruta);
  ruta();
})();
