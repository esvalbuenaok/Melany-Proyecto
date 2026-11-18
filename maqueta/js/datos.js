/* Datos de EJEMPLO. En la versión real vendrán de la fundación (hoja de cálculo, panel o API).
   Cada animal: ver el módulo de salud y las etiquetas de convivencia del capítulo V (5.6.2). */
(function (root) {
  "use strict";

  var AMIUNI = {
    estadisticas: { adoptados: 128, enProceso: 9, atendidos: 342 },
    meta: { objetivo: 600, recaudado: 410, etiqueta: "Meta del mes: esterilizaciones" },
    animales: [
      {
        id: "luna",
        nombre: "Luna",
        especie: "perro",
        sexo: "hembra",
        edad: "adulto",
        edadTexto: "3 años",
        tamano: "mediano",
        color: "#E9D5B8",
        estado: "disponible",
        fotos: [
          {
            url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/a/af/Brown_street_dog_01.jpg/960px-Brown_street_dog_01.jpg",
            alt: "Luna, perra mestiza marrón de pie"
          },
          {
            url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/2/25/Brown_street_dog_02.jpg/960px-Brown_street_dog_02.jpg",
            alt: "Luna descansando al aire libre"
          },
          {
            url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/17/Brown_street_dog_03.jpg/960px-Brown_street_dog_03.jpg",
            alt: "Luna mirando atentamente a la cámara"
          }
        ],
        salud: { esterilizado: true, vacunas: true, desparasitado: true },
        compatibilidad: { ninos: true, apartamento: true, otrosPerros: true, otrosGatos: false },
        etiquetas: ["Apta para apartamentos", "Apta para niños", "Sociable con perros"],
        historia: "La encontramos junto a un mercado, flaca y con miedo. Hoy es la primera en recibirte en la puerta y adora los paseos largos.",
        fechaIngreso: "2026-08-14",
        apadrinamientoMensual: 25
      },
      {
        id: "toby",
        nombre: "Toby",
        especie: "perro",
        sexo: "macho",
        edad: "cachorro",
        edadTexto: "5 meses",
        tamano: "pequeño",
        color: "#CDE7F5",
        estado: "disponible",
        fotos: [
          {
            url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/0/09/Cute-puppy-dog-13626627873wL.jpg/960px-Cute-puppy-dog-13626627873wL.jpg",
            alt: "Toby, cachorro juguetón mirando hacia arriba"
          }
        ],
        salud: { esterilizado: false, vacunas: true, desparasitado: true },
        compatibilidad: { ninos: true, apartamento: true, otrosPerros: true, otrosGatos: true },
        etiquetas: ["Apto para apartamentos", "Sociable con gatos", "Muy juguetón"],
        historia: "Llegó en una caja de cartón con sus dos hermanos. Es curioso, travieso y se duerme sobre cualquier zapato.",
        fechaIngreso: "2026-09-22",
        apadrinamientoMensual: 20
      },
      {
        id: "mora",
        nombre: "Mora",
        especie: "gato",
        sexo: "hembra",
        edad: "joven",
        edadTexto: "1 año",
        tamano: "pequeño",
        color: "#D9CBE8",
        estado: "disponible",
        fotos: [
          {
            url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/0/01/Calico_cat%2C_-_Assisi%2C_Italy.jpg/960px-Calico_cat%2C_-_Assisi%2C_Italy.jpg",
            alt: "Mora, gata tricolor tranquila descansando"
          }
        ],
        salud: { esterilizado: true, vacunas: true, desparasitado: true },
        compatibilidad: { ninos: true, apartamento: true, otrosPerros: false, otrosGatos: true },
        etiquetas: ["Apta para apartamentos", "Tranquila", "Sociable con gatos"],
        historia: "Rescatada de un techo tras una lluvia fuerte. Le gusta la ventana, el sol de la tarde y que le rasquen la barbilla.",
        fechaIngreso: "2026-09-05",
        apadrinamientoMensual: 18
      },
      {
        id: "rocky",
        nombre: "Rocky",
        especie: "perro",
        sexo: "macho",
        edad: "adulto",
        edadTexto: "4 años",
        tamano: "grande",
        color: "#E8C9B0",
        estado: "proceso",
        fotos: [
          {
            url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/6/61/20110425_German_Shepherd_Dog_8505.jpg/960px-20110425_German_Shepherd_Dog_8505.jpg",
            alt: "Rocky, perro grande atento y noble"
          }
        ],
        salud: { esterilizado: true, vacunas: true, desparasitado: false },
        compatibilidad: { ninos: true, apartamento: false, otrosPerros: false, otrosGatos: false },
        etiquetas: ["Necesita patio", "Apto para niños", "Entrenado para la correa"],
        historia: "Pasó dos años en la calle de un barrio de Mérida. Es noble, obediente y ya tiene una familia en revisión.",
        fechaIngreso: "2026-07-19",
        apadrinamientoMensual: 30
      },
      {
        id: "nina",
        nombre: "Nina",
        especie: "gato",
        sexo: "hembra",
        edad: "cachorro",
        edadTexto: "3 meses",
        tamano: "pequeño",
        color: "#F3DDA8",
        estado: "disponible",
        fotos: [
          {
            url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/0/00/Domestic_tabby_shorthair_kitten.jpg/960px-Domestic_tabby_shorthair_kitten.jpg",
            alt: "Nina, gatita atigrada curiosa"
          }
        ],
        salud: { esterilizado: false, vacunas: false, desparasitado: true },
        compatibilidad: { ninos: true, apartamento: true, otrosPerros: false, otrosGatos: true },
        etiquetas: ["Apta para apartamentos", "Apta para niños", "Muy cariñosa"],
        historia: "La rescató una voluntaria dentro de un motor. Aprendió a ronronear antes que a jugar.",
        fechaIngreso: "2026-10-08",
        apadrinamientoMensual: 15
      },
      {
        id: "bruno",
        nombre: "Bruno",
        especie: "perro",
        sexo: "macho",
        edad: "senior",
        edadTexto: "9 años",
        tamano: "mediano",
        color: "#D5DDC4",
        estado: "disponible",
        fotos: [
          {
            url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/3/35/Portrait_of_a_labrador_retriever.jpg/960px-Portrait_of_a_labrador_retriever.jpg",
            alt: "Bruno, perro senior tranquilo y dulce"
          }
        ],
        salud: { esterilizado: true, vacunas: true, desparasitado: true },
        compatibilidad: { ninos: true, apartamento: true, otrosPerros: true, otrosGatos: true },
        etiquetas: ["Apto para apartamentos", "Tranquilo", "Sociable con perros y gatos"],
        historia: "Su familia se mudó y lo dejó atrás. Pide poco: una cama blanda, un paseo corto y compañía.",
        fechaIngreso: "2026-06-30",
        apadrinamientoMensual: 25
      }
    ],
    testimonios: [
      {
        id: "test-1",
        texto: "Con mi aporte esterilizaron a Mora. Ver su ficha actualizada me dio mucha confianza.",
        autor: "Donante (ejemplo)",
        fecha: "2026-09-18"
      },
      {
        id: "test-2",
        texto: "Adopté a mi perro en una semana. Llené el formulario desde el teléfono, sin vueltas.",
        autor: "Adoptante (ejemplo)",
        fecha: "2026-10-02"
      }
    ],
    mediosPago: {
      pago_movil: {
        titulo: "Pago móvil",
        banco: "Banco de Venezuela (0102) · Demo",
        telefono: "0414-0000000",
        rif: "J-00000000-0",
        titular: "Fundación Amiuni (Demo)"
      },
      transferencia: {
        titulo: "Transferencia bancaria",
        banco: "Banesco · Demo",
        tipoCuenta: "Corriente",
        cuenta: "0134-0000-00-0000000000",
        rif: "J-00000000-0",
        titular: "Fundación Amiuni (Demo)"
      },
      zelle: {
        titulo: "Zelle",
        correo: "donaciones-demo@amiuni.org.example",
        titular: "Fundación Amiuni (Demo)"
      }
    },
    academia: {
      titulo: "Amiuni Academia (nombre por definir)",
      lecciones: [
        {
          id: "antes-adoptar",
          categoria: "Adopción",
          duracion: "4 min",
          titulo: "Antes de adoptar: evalúa tu hogar, tiempo y presupuesto",
          resumen: "Adoptar es asumir el cuidado de una vida durante 10 a 18 años. Analizar tu rutina y espacio antes de elegir evita devoluciones y estrés.",
          puntosClave: [
            "Calcula un presupuesto mensual realista para alimento, vacunas, desparasitación y emergencias veterinarias.",
            "Verifica si tu vivienda permite mascotas y qué nivel de energía se adapta a tu rutina diaria.",
            "Conversa con todas las personas del hogar para asegurar un acuerdo compartido de cuidados y paseos."
          ],
          mito: "Un cachorro siempre se adapta más fácil que un perro o gato adulto.",
          realidad: "Los animales adultos y senior suelen tener carácter definido, hábitos de higiene aprendidos y requieren menos supervisión continua.",
          ctaTexto: "Explorar mascotas compatibles",
          ctaRuta: "#/"
        },
        {
          id: "proceso-pasos",
          categoria: "Adopción",
          duracion: "5 min",
          titulo: "Cómo funciona el proceso de adopción paso a paso",
          resumen: "Cada paso en Amiuni busca unir al animal correcto con la familia adecuada, acompañándote desde la solicitud hasta la adaptación en casa.",
          puntosClave: [
            "Explora las fichas y revisa compatibilidad con niños, apartamentos, otros perros o gatos.",
            "Completa el formulario de adopción en 3 pasos y guarda tu código AMI-XXXXXX para consultar el estado.",
            "Participa en la entrevista y visita de verificación para garantizar un entorno seguro y un período de adaptación guiado."
          ],
          mito: "Los requisitos y entrevistas existen para dificultar o rechazar adopciones.",
          realidad: "El proceso protege al animal de un segundo abandono y orienta a la familia para que la convivencia sea exitosa desde el primer día.",
          ctaTexto: "Ver cómo funciona el seguimiento",
          ctaRuta: "#/seguimiento"
        },
        {
          id: "salud-preventiva",
          categoria: "Cuidados",
          duracion: "6 min",
          titulo: "Salud preventiva: esterilización, vacunas y control",
          resumen: "La prevención es la herramienta más efectiva para proteger la salud de tu compañero y frenar la sobrepoblación en las calles de Mérida.",
          puntosClave: [
            "La esterilización temprana previene tumores mamarios, infecciones uterinas y camadas no deseadas.",
            "Mantener el calendario anual de vacunas y desparasitación interna y externa evita enfermedades graves.",
            "La identificación con placa y supervisión en paseos reducen drásticamente el riesgo de extravío."
          ],
          mito: "Es necesario que las hembras tengan al menos una camada antes de esterilizarlas.",
          realidad: "Está demostrado veterinariamente que esterilizar antes o después del primer celo mejora su salud y no afecta su vitalidad ni carácter.",
          ctaTexto: "Apoyar una esterilización",
          ctaRuta: "#/donar"
        },
        {
          id: "concienciacion",
          categoria: "Concienciación",
          duracion: "4 min",
          titulo: "Concienciación comunitaria: si no puedes adoptar, también salvas vidas",
          resumen: "La tenencia responsable y el apoyo solidario sostienen los rescates. Compartir información, esterilizar y apadrinar multiplica el impacto.",
          puntosClave: [
            "Difundir casos verificados con datos reales ayuda a que animales tímidos o adultos encuentren familia.",
            "Apadrinar cubre alimento y atención médica de un rescatado mientras espera su hogar definitivo.",
            "Promover el respeto hacia los animales comunitarios fortalece la convivencia y reduce el maltrato."
          ],
          mito: "Solo quien tiene patio grande o mucho dinero puede ayudar a un animal rescatado.",
          realidad: "Aportes pequeños y constantes, voluntariado o difusión responsable sostienen cirugías, vacunas y recuperaciones completas.",
          ctaTexto: "Sumarme como padrino o donante",
          ctaRuta: "#/donar"
        }
      ],
      quiz: [
        {
          id: "quiz-tiempo",
          pregunta: "1. ¿Cuánto tiempo diario puedes dedicar de forma constante a paseos, juego, limpieza y compañía?",
          opciones: [
            { texto: "Menos de 20 minutos al día; paso casi todo el día fuera sin apoyo en casa.", puntos: 0 },
            { texto: "Entre 30 y 60 minutos diarios, con apoyo parcial de mi familia.", puntos: 1 },
            { texto: "Más de 1 hora al día y tengo un plan claro para fines de semana y viajes.", puntos: 2 }
          ],
          explicacion: "Perros y gatos necesitan rutina, enriquecimiento y compañía diaria para mantener su equilibrio físico y emocional."
        },
        {
          id: "quiz-presupuesto",
          pregunta: "2. Frente a un gasto veterinario imprevisto (consulta, exámenes o medicinas), ¿cómo responderías?",
          opciones: [
            { texto: "No cuento con margen económico ni respaldo para imprevistos veterinarios.", puntos: 0 },
            { texto: "Podría cubrir cuidados básicos y buscar apoyo familiar para emergencias.", puntos: 1 },
            { texto: "Tengo presupuesto mensual asignado y un fondo o red para emergencias médicas.", puntos: 2 }
          ],
          explicacion: "Además del alimento diario, todo animal requiere vacunación anual, desparasitación y atención oportuna ante emergencias."
        },
        {
          id: "quiz-hogar",
          pregunta: "3. ¿Qué acuerdo existe en tu vivienda respecto a la llegada de un animal rescatado?",
          opciones: [
            { texto: "No he consultado aún con quienes viven conmigo o con el propietario.", puntos: 0 },
            { texto: "Casi todos están de acuerdo, aunque todavía definimos reglas de convivencia.", puntos: 1 },
            { texto: "Todas las personas del hogar están de acuerdo y el espacio es seguro y permitido.", puntos: 2 }
          ],
          explicacion: "La adopción funciona cuando toda la familia comparte el compromiso y la vivienda cuenta con permisos y seguridad."
        },
        {
          id: "quiz-paciencia",
          pregunta: "4. Un animal rescatado puede necesitar semanas para perder el miedo o aprender normas. ¿Cómo lo manejarías?",
          opciones: [
            { texto: "Esperaría que se comporte perfecto desde el primer día; me frustraría rápido.", puntos: 0 },
            { texto: "Tendría paciencia inicial, aunque necesitaría orientación si surgen retos.", puntos: 1 },
            { texto: "Comprendo que requiere paciencia, refuerzo positivo y acompañamiento profesional si hace falta.", puntos: 2 }
          ],
          explicacion: "El período de adaptación es clave: la calma, el refuerzo positivo y la guía de la fundación construyen confianza duradera."
        }
      ]
    }
  };

  root.AMIUNI = AMIUNI;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = AMIUNI;
  }
})(typeof globalThis !== "undefined" ? globalThis : window);
