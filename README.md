# Multiplica Aventura

Aplicación web estática, en español, para que un niño de 8 años practique las tablas del 1 al 10 como un juego.

## Qué incluye

- Progresión bloqueada: una tabla por nivel.
- Tres etapas: descubrimiento, práctica individual y desafío combinado.
- Umbral de dominio del 80% para desbloquear el siguiente nivel.
- Repetición espaciada de operaciones débiles y repaso inteligente.
- XP, estrellas, rachas, insignias, confeti y progreso visual.
- Plan intensivo de 3 días, sesiones breves y pausas sugeridas.
- Persistencia en `localStorage`, funcionamiento offline y diseño responsive.
- Sonido opcional y soporte para `prefers-reduced-motion`.
- Opciones múltiples identificadas con **A, B, C y D fuera del recuadro de la respuesta**, para no confundir la etiqueta con el resultado.
- Atajos de teclado `A`, `B`, `C` y `D` durante los ejercicios.
- Modo oscuro configurable desde **Premios → Ajustes**, guardado automáticamente en el dispositivo.

## Ejecutar localmente

No requiere compilación ni backend:

```bash
npx serve .
```

También se puede abrir `index.html` directamente, aunque el modo offline necesita un servidor local.

## Publicar en Vercel

1. Subir esta carpeta a un repositorio Git.
2. Importar el repositorio en Vercel.
3. Elegir **Other** como framework.
4. No configurar build command; usar `.` como output directory.
5. Desplegar.

También puede ejecutarse `vercel` desde esta carpeta si la CLI está instalada.

## Privacidad

No hay cuentas ni analítica. Nombre y progreso quedan guardados solo en el navegador del dispositivo.
