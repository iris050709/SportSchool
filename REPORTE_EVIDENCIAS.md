# Reporte de desarrollo — SportSchool

**Nombre del estudiante:** __________________________________  
**Grupo:** ____________________  
**Asignatura:** ____________________  
**Docente:** ____________________  
**Fecha:** ____________________

## 1. Descripción del proyecto
SportSchool es una aplicación web progresiva para registrar estudiantes y sus actividades deportivas, consultar el historial individual y visualizar indicadores básicos de desempeño. Está diseñada para dispositivos móviles y escritorio.

## 2. Tecnologías utilizadas
- React y JavaScript para la interfaz y el renderizado del lado del cliente (CSR).
- HTML y CSS para estructura y diseño responsivo.
- localStorage para persistencia local.
- Fetch API para una consulta demostrativa a un servicio remoto.
- Web App Manifest para los metadatos de instalación.
- Service Worker y Cache API para conservar recursos principales.
- Notifications API para avisos locales con permiso.
- Geolocation API como función opcional.

## 3. Estructura del proyecto
Inserta aquí una captura del explorador de archivos mostrando las carpetas `public` y `src`.

## 4. Pantallas principales
### 4.1 Splash y Home
[Insertar captura real]

### 4.2 Registro de estudiantes
[Insertar captura real]

### 4.3 Registro de actividades
[Insertar captura real]

### 4.4 Historial e indicadores
[Insertar captura real]

## 5. Almacenamiento local
Se utiliza localStorage con la clave `sportschool-data-v1`. Los datos de estudiantes y actividades se serializan en formato JSON y se recuperan al iniciar la aplicación.

**Evidencia:** insertar captura de la aplicación con registros, recargar y mostrar que continúan disponibles. Opcional: DevTools > Application > Local Storage.

## 6. Fetch API
El botón “Probar Fetch API” realiza una solicitud GET a `https://jsonplaceholder.typicode.com/todos/1`. Es una solicitud demostrativa y no representa sincronización real de los registros deportivos.

**Evidencia:** insertar captura del mensaje de respuesta correcta.

## 7. Funcionamiento offline
El Service Worker `public/sw.js` precarga el app shell y guarda recursos del mismo origen en Cache Storage. Si no hay conexión, intenta responder desde caché. Los registros continúan disponibles porque se almacenan localmente.

**Evidencias:** insertar capturas de:
- DevTools > Application > Service Workers.
- DevTools > Application > Cache Storage.
- DevTools > Network con Offline activado y la aplicación cargada.

## 8. Notificaciones y geolocalización
La notificación local se solicita mediante el botón “Activar notificaciones” y solo se muestra si el usuario concede el permiso. La ubicación se solicita desde el formulario de actividad y se adjunta al registro únicamente con autorización.

**Evidencia:** insertar captura real si se concedieron los permisos. Si no se concedieron, documentar el resultado.

## 9. Pruebas realizadas
Completa la tabla después de probar la aplicación en tu equipo.

| Prueba | Resultado | Evidencia |
|---|---|---|
| Registrar estudiante | Pendiente de ejecutar | Captura |
| Registrar dos actividades | Pendiente de ejecutar | Captura |
| Recargar y recuperar registros | Pendiente de ejecutar | Captura |
| Consultar historial e indicadores | Pendiente de ejecutar | Captura |
| Ejecutar solicitud Fetch | Pendiente de ejecutar | Captura |
| Verificar Service Worker y caché | Pendiente de ejecutar | Captura |
| Probar modo offline | Pendiente de ejecutar | Captura |
| Probar notificación (opcional) | Pendiente de ejecutar | Captura |
| Probar geolocalización (opcional) | Pendiente de ejecutar | Captura |

## 10. Publicación o ejecución local
**URL publicada o entorno local:** __________________________________

Si se ejecutó localmente, indicar: `http://localhost:5173`.

## 11. Conclusión
La aplicación SportSchool integra los componentes esenciales de una PWA para el seguimiento deportivo escolar. Permite registrar y consultar información, calcular indicadores sencillos y mantener la disponibilidad de la interfaz y de los datos guardados localmente cuando no existe conexión, después de una primera carga correcta.

## 12. Repositorio
**URL del repositorio:** __________________________________
