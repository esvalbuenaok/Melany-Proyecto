# Amiuni: interfaz gráfica de adopción y donación animal

Proyecto de tesis de Diseño Gráfico (ULA, Escuela de Diseño Gráfico y Artes Visuales) de **Melany Monsalve**: una interfaz gráfica funcional, centrada en la experiencia de usuario, para la fundación de rescate animal **Amiuni** (Mérida, Venezuela). Este repo lleva esa interfaz del prototipo a una versión programada y funcional.

## Documentos

| Archivo | Qué es |
|---|---|
| `docs/proyecto-completo-15-octubre.docx` | **Documento principal** (capítulos I–VI). El capítulo V es la especificación de lo que se debe construir. |
| `docs/anteproyecto-revision-final.docx` | Anteproyecto (solo contexto; manda el documento principal). |

Los `.docx` incluyen datos personales de la autora: mantener el repo privado.

## Qué hay que construir (resumen del capítulo V)

Interfaz **mobile first** (96 % de los encuestados navega desde el teléfono) con cuatro pantallas:

1. **Inicio**: galería de animales en adopción + buscador con filtros (especie, edad, tamaño…).
2. **Ficha del animal**: foto real central, insignia «¡Adóptame!», nombre/edad/sexo, módulo de salud (esterilizado, vacunas, desparasitado), etiquetas de temperamento y convivencia, sección «Mi historia», CTA «Solicitar adopción».
3. **Formulario de adopción**: por pasos, con mensajes claros y prevención de errores.
4. **Donación**: botones de donación rápida, medios de pago, apadrinamiento, seguimiento visual del aporte (animales atendidos, metas, testimonios).

Además: métricas públicas de transparencia (adopciones y procesos completados) y navegación con filtros robusta.

## Sistema de diseño

- **Tipografía:** Poppins (alternativa Inter). Titulares bold/semibold 28–32 px móvil, 40–48 px escritorio; subtítulos medium 18–22 px; cuerpo regular 14–16 px, interlineado 1,5.
- **Color (regla 60-30-10):** crema `#FDFBF7` (60 %), azul profundo `#1E3A8A` y celeste `#38BDF8` (30 %), marrón cálido `#6B3F23` solo para CTA (10 %).
- **Iconos:** vectoriales redondeados: jeringa (vacunación), huella (especie), corazón (temperamento), casa (disponible).
- **Retícula:** móvil 4 columnas, márgenes 16 px, medianil 12 px; escritorio 12 columnas, contenedor máx. 1200 px, medianil 24 px.
- **Botones:** bordes redondeados; estados reposo / activo / inactivo (gris si faltan campos).
- **Accesibilidad:** WCAG 2.1 AA, contraste > 4,5:1, área táctil mínima 48×48 px, elementos clave al alcance del pulgar.
- **Tono:** cálido, empático, confiable; fotos reales de dignidad y esperanza, fondos limpios y espacio negativo; vectores orgánicos (huellas, formas fluidas).

## Pendientes por aclarar con Melany

- Línea gráfica definitiva (el documento dice «ilustrada / fotográfica / mixta»).
- Prototipo de alta fidelidad en Figma: obtener el enlace o los archivos.
- Dónde se alojará, de dónde saldrán los datos de los animales (¿lo administra la fundación?) y cómo se reciben solicitudes y pagos.
- Nombre: el documento alterna «Amiuni» y «Afiuni»; confirmar el correcto.
