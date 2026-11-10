/* Datos de EJEMPLO. En la versión real vendrán de la fundación (hoja de cálculo, panel o API).
   Cada animal: ver el módulo de salud y las etiquetas de convivencia del capítulo V (5.6.2). */
window.AMIUNI = {
  estadisticas: { adoptados: 128, enProceso: 9, atendidos: 342 },
  meta: { objetivo: 600, recaudado: 410, etiqueta: "Meta del mes: esterilizaciones" },
  animales: [
    { id: "luna", nombre: "Luna", especie: "perro", sexo: "hembra", edad: "adulto", edadTexto: "3 años", tamano: "mediano", color: "#E9D5B8", estado: "disponible",
      salud: { esterilizado: true, vacunas: true, desparasitado: true },
      etiquetas: ["Apta para apartamentos", "Apta para niños", "Sociable con perros"],
      historia: "La encontramos junto a un mercado, flaca y con miedo. Hoy es la primera en recibirte en la puerta y adora los paseos largos." },
    { id: "toby", nombre: "Toby", especie: "perro", sexo: "macho", edad: "cachorro", edadTexto: "5 meses", tamano: "pequeño", color: "#CDE7F5", estado: "disponible",
      salud: { esterilizado: false, vacunas: true, desparasitado: true },
      etiquetas: ["Apto para apartamentos", "Sociable con gatos", "Muy juguetón"],
      historia: "Llegó en una caja de cartón con sus dos hermanos. Es curioso, travieso y se duerme sobre cualquier zapato." },
    { id: "mora", nombre: "Mora", especie: "gato", sexo: "hembra", edad: "joven", edadTexto: "1 año", tamano: "pequeño", color: "#D9CBE8", estado: "disponible",
      salud: { esterilizado: true, vacunas: true, desparasitado: true },
      etiquetas: ["Apta para apartamentos", "Tranquila", "Sociable con gatos"],
      historia: "Rescatada de un techo tras una lluvia fuerte. Le gusta la ventana, el sol de la tarde y que le rasquen la barbilla." },
    { id: "rocky", nombre: "Rocky", especie: "perro", sexo: "macho", edad: "adulto", edadTexto: "4 años", tamano: "grande", color: "#E8C9B0", estado: "proceso",
      salud: { esterilizado: true, vacunas: true, desparasitado: false },
      etiquetas: ["Necesita patio", "Apto para niños", "Entrenado para la correa"],
      historia: "Pasó dos años en la calle de un barrio de Mérida. Es noble, obediente y ya tiene una familia en revisión." },
    { id: "nina", nombre: "Nina", especie: "gato", sexo: "hembra", edad: "cachorro", edadTexto: "3 meses", tamano: "pequeño", color: "#F3DDA8", estado: "disponible",
      salud: { esterilizado: false, vacunas: false, desparasitado: true },
      etiquetas: ["Apta para apartamentos", "Apta para niños", "Muy cariñosa"],
      historia: "La rescató una voluntaria dentro de un motor. Aprendió a ronronear antes que a jugar." },
    { id: "bruno", nombre: "Bruno", especie: "perro", sexo: "macho", edad: "senior", edadTexto: "9 años", tamano: "mediano", color: "#D5DDC4", estado: "disponible",
      salud: { esterilizado: true, vacunas: true, desparasitado: true },
      etiquetas: ["Apto para apartamentos", "Tranquilo", "Sociable con perros y gatos"],
      historia: "Su familia se mudó y lo dejó atrás. Pide poco: una cama blanda, un paseo corto y compañía." }
  ],
  testimonios: [
    { texto: "Con mi aporte esterilizaron a Mora. Ver su ficha actualizada me dio mucha confianza.", autor: "Donante (ejemplo)" },
    { texto: "Adopté a mi perro en una semana. Llené el formulario desde el teléfono, sin vueltas.", autor: "Adoptante (ejemplo)" }
  ]
};
