# Verificación de la versión acumulativa

Versión del paquete: **2.0.0 acumulativa**

## Lista de regresión

- [x] Tablas limitadas del 1 al 10.
- [x] Modal de nivel y botón **1. Descubrir** sin bloqueo de propagación.
- [x] Etapas Descubrir, Practicar y Desafío mixto.
- [x] Sonidos musicales para acierto, error y nivel superado.
- [x] Animaciones de acierto/error, confeti y fuegos artificiales.
- [x] Tabla final con el resultado de cada operación.
- [x] Elección inicial: ruta completa o distribución entre 2 y 10 días.
- [x] Botón independiente **Ajustes**, separado de Premios.
- [x] Respuesta por opciones múltiples o carga manual.
- [x] Dificultades Tranquilo 70%, Normal 80% y Experto 90%.
- [x] Separación visual de número repetido y cantidad de veces.
- [x] Letras A, B, C y D fuera de los recuadros numéricos.
- [x] Modo oscuro persistente dentro de Ajustes.
- [x] Migración compatible con el progreso anterior de `localStorage`.
- [x] Nueva versión de caché del service worker.

## Pruebas ejecutadas

```bash
npm test
```

Resultado esperado y obtenido:

```text
OK: 36 cumulative logic, configuration and regression assertions passed.
```

También se comprobó por HTTP local la respuesta 200 y contenido no vacío de `index.html`, `styles.css`, `app.js`, `sw.js` y `manifest.webmanifest`.
