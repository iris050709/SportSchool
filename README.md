# SportSchool — PWA de seguimiento deportivo escolar

Aplicación académica desarrollada con React + Vite. Permite registrar estudiantes, registrar actividades deportivas, consultar historial e indicadores, conservar datos localmente y cargar la interfaz principal sin conexión después de la primera visita en línea.

## Requisitos
- Node.js 18 o superior
- npm
- Navegador actualizado (Chrome recomendado)

## Instalación y ejecución
```bash
npm install
npm run dev
```
Abre la URL que muestra Vite (normalmente `http://localhost:5173`). `localhost` se considera contexto seguro para Service Worker, notificaciones y geolocalización.

## Preparar versión de producción
```bash
npm run build
npm run preview
```
La carpeta `dist/` contiene los archivos publicables. Publica esa carpeta en un hosting HTTPS estático, por ejemplo GitHub Pages, Netlify o Vercel.

## Funcionalidades incluidas
1. Splash y Home con panel de indicadores.
2. Registro de estudiantes: nombre, grupo y disciplina.
3. Registro de actividades: fecha, actividad, duración, distancia y observaciones.
4. Historial filtrable por estudiante.
5. Indicadores: número de actividades, minutos acumulados y kilómetros.
6. Persistencia con `localStorage`; se recuperan los datos al recargar.
7. Consulta de demostración con Fetch API a JSONPlaceholder. **No sincroniza los registros de SportSchool**; cumple como solicitud demostrativa cuando el servicio está disponible.
8. Service Worker (`public/sw.js`) y Cache API para guardar el app shell y recursos del mismo origen.
9. Notificación local al guardar, únicamente si el usuario concede permiso.
10. Geolocation API opcional, mediante autorización del usuario.
11. Exportación de respaldo JSON.

## Prueba offline
1. Ejecuta `npm run dev` y abre la aplicación en `localhost`.
2. Registra un estudiante y dos actividades.
3. Recarga la página y verifica que sigan visibles.
4. En Chrome DevTools > Application, verifica Manifest, Service Workers y Cache Storage.
5. Abre DevTools > Network y selecciona Offline. Recarga la aplicación.
6. Comprueba que la interfaz y los datos locales sigan disponibles. La consulta Fetch externa no estará disponible sin conexión.
7. Regresa a Online.

**Importante:** la primera carga debe realizarse con conexión para que el navegador descargue y almacene los recursos. Para probar Service Worker, utiliza `localhost` o HTTPS; no abras `index.html` directamente como archivo.

## Estructura
```text
SportSchool/
├── public/
│   ├── icons/
│   │   ├── icon-192.svg
│   │   └── icon-512.svg
│   ├── manifest.webmanifest
│   └── sw.js
├── src/
│   ├── main.jsx
│   └── styles.css
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

## Consideraciones técnicas
- Los datos se guardan en el almacenamiento del navegador del dispositivo; no existe una base de datos central ni sincronización entre dispositivos.
- El endpoint Fetch es externo y demostrativo. Puede fallar por falta de Internet o disponibilidad del servicio.
- La geolocalización y las notificaciones requieren permisos y contexto seguro.
- Los iconos se incluyen en SVG para mantener el proyecto ligero. Si el hosting o la auditoría PWA exige PNG, se pueden generar versiones PNG de 192 y 512 px.

## Evidencias para la entrega
Toma capturas reales de:
- Pantalla de inicio y panel de indicadores.
- Formulario y lista de estudiantes.
- Formulario de actividad.
- Historial con al menos dos actividades.
- DevTools > Application > Manifest.
- DevTools > Application > Service Workers y Cache Storage.
- DevTools > Network en modo Offline mostrando la aplicación.
- Resultado de la consulta Fetch en línea.
- Permiso/confirmación de notificación, si el navegador lo permite.

No presentes capturas simuladas: realiza las pruebas en tu equipo y agrega las imágenes al reporte.
