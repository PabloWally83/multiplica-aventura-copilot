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

## Corrección 1.0.1

- Los controles del modal de nivel funcionan mediante delegación de eventos, incluido **1. Descubrir**.
- Los clics dentro del diálogo ya no se confunden con clics sobre el fondo oscuro.
- El service worker toma la versión nueva de los archivos al publicar y conserva el modo offline como respaldo.

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

Después de reemplazar los archivos en GitHub, Vercel desplegará la corrección automáticamente. Si la aplicación ya estaba abierta, recargá la página una vez para activar el service worker actualizado.

## Privacidad

No hay cuentas ni analítica. Nombre y progreso quedan guardados solo en el navegador del dispositivo.
