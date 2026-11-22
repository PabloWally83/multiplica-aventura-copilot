# Multiplica Aventura — versión acumulativa

Aplicación web estática, en español, para aprender las tablas del 1 al 10 mediante una aventura progresiva. Esta entrega reúne en una sola base todos los cambios funcionales y visuales solicitados.

## Funciones incluidas

- Tablas del **1 al 10**, con desbloqueo progresivo.
- Tres etapas por nivel: **Descubrir**, **Practicar** y **Desafío mixto**.
- Modal de nivel corregido: todos sus botones funcionan mediante delegación de eventos.
- Elección inicial entre completar todo de una vez o distribuir las tablas entre **2 y 10 días**.
- Plan equilibrado que se actualiza de acuerdo con la elección guardada.
- Respuesta mediante **opciones múltiples** o **carga manual**.
- Opciones identificadas con **A, B, C y D fuera del recuadro numérico**.
- Dificultades configurables: **Tranquilo 70%**, **Normal 80%** y **Experto 90%**.
- Explicación visual separada de los operandos: número que se repite y cantidad de veces.
- Resultado detallado de cada operación: respuesta ingresada, respuesta correcta y estado.
- Sonidos musicales, animaciones de acierto/error, confeti y fuegos artificiales.
- Botón independiente **Ajustes**, separado de **Premios**.
- **Modo oscuro persistente** dentro de Ajustes.
- Repaso inteligente, XP, estrellas, rachas, insignias y progreso visual.
- Persistencia compatible con el progreso anterior en `localStorage`.
- Diseño responsive, funcionamiento offline y soporte para `prefers-reduced-motion`.

## Reemplazar el repositorio actual

Subí **el contenido de esta carpeta directamente a la raíz** del repositorio `multiplica-aventura-copilot`, reemplazando los archivos existentes. No subas una carpeta contenedora adicional.

Eliminá del repositorio, si todavía existen, los artefactos antiguos `served-index.html` y `http-test.log`.

## Ejecutar localmente

No requiere compilación ni backend:

```bash
npm run dev
```

## Verificar

```bash
npm test
```

La prueba valida sintaxis, configuración, generación de ejercicios y marcadores de regresión para todas las funciones acumuladas.

## Publicar en Vercel

1. Subir los archivos a la raíz del repositorio GitHub.
2. Importar o mantener conectado ese repositorio en Vercel.
3. Usar **Other** como framework.
4. No configurar build command ni output directory.
5. Desplegar y realizar una recarga forzada una vez (`Ctrl + F5`).

El service worker y los encabezados de Vercel usan una versión de caché nueva para evitar que el navegador conserve archivos anteriores.

## Privacidad

No hay cuentas, publicidad ni analítica. El nombre, las preferencias y el progreso quedan guardados únicamente en el navegador del dispositivo.
