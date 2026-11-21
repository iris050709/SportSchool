import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const DB_KEY = "sportschool-data-v1";
const initialData = { students: [], activities: [] };

function readData() {
  try { return { ...initialData, ...JSON.parse(localStorage.getItem(DB_KEY) || "{}") }; }
  catch { return initialData; }
}
function saveData(data) { localStorage.setItem(DB_KEY, JSON.stringify(data)); }
function today() { return new Date().toISOString().slice(0, 10); }

function App() {
  const [data, setData] = useState(readData);
  const [section, setSection] = useState("inicio");
  const [studentForm, setStudentForm] = useState({ name: "", group: "", sport: "" });
  const [activityForm, setActivityForm] = useState({
    studentId: "", date: today(), activity: "", duration: "", distance: "", notes: ""
  });
  const [selectedStudent, setSelectedStudent] = useState("all");
  const [online, setOnline] = useState(navigator.onLine);
  const [message, setMessage] = useState("");
  const [remoteResult, setRemoteResult] = useState("");
  const [locationText, setLocationText] = useState("");
  const [splash, setSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setSplash(false), 1100);
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => navigator.serviceWorker.register("/sw.js").catch(console.error));
    }
    return () => {
      clearTimeout(timer);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  useEffect(() => { saveData(data); }, [data]);

  const visibleActivities = useMemo(() => data.activities
    .filter(a => selectedStudent === "all" || a.studentId === selectedStudent)
    .sort((a, b) => b.date.localeCompare(a.date)), [data.activities, selectedStudent]);

  const totals = useMemo(() => {
    const list = selectedStudent === "all" ? data.activities : data.activities.filter(a => a.studentId === selectedStudent);
    return {
      count: list.length,
      minutes: list.reduce((sum, a) => sum + Number(a.duration || 0), 0),
      distance: list.reduce((sum, a) => sum + Number(a.distance || 0), 0)
    };
  }, [data.activities, selectedStudent]);

  function notify(text) {
    setMessage(text);
    setTimeout(() => setMessage(""), 3200);
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("SportSchool", { body: text, icon: "/icons/icon-192.svg" });
    }
  }

  async function enableNotifications() {
    if (!("Notification" in window)) return notify("Este navegador no admite notificaciones.");
    const permission = await Notification.requestPermission();
    notify(permission === "granted" ? "Notificaciones activadas." : "No se concedió el permiso de notificaciones.");
  }

  function addStudent(e) {
    e.preventDefault();
    if (!studentForm.name.trim() || !studentForm.group.trim() || !studentForm.sport.trim()) return;
    const student = { ...studentForm, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    setData(prev => ({ ...prev, students: [...prev.students, student] }));
    setStudentForm({ name: "", group: "", sport: "" });
    setActivityForm(prev => ({ ...prev, studentId: prev.studentId || student.id }));
    notify("Estudiante registrado correctamente.");
  }

  function addActivity(e) {
    e.preventDefault();
    if (!activityForm.studentId || !activityForm.activity.trim() || !activityForm.duration) {
      return notify("Completa estudiante, actividad y duración.");
    }
    const activity = {
      ...activityForm, id: crypto.randomUUID(),
      duration: Number(activityForm.duration), distance: Number(activityForm.distance || 0),
      location: locationText || ""
    };
    setData(prev => ({ ...prev, activities: [...prev.activities, activity] }));
    setActivityForm(prev => ({ ...prev, activity: "", duration: "", distance: "", notes: "", date: today() }));
    setLocationText("");
    notify("Actividad guardada correctamente.");
  }

  async function fetchDemo() {
    setRemoteResult("Consultando servicio de demostración...");
    try {
      const response = await fetch("https://jsonplaceholder.typicode.com/todos/1");
      if (!response.ok) throw new Error("Respuesta no válida");
      const result = await response.json();
      setRemoteResult(`Fetch correcto. Servicio de prueba: "${result.title}". Esta consulta es demostrativa; no sincroniza los datos de SportSchool.`);
    } catch {
      setRemoteResult("No fue posible consultar el endpoint. La aplicación conserva sus datos localmente; intenta de nuevo cuando haya conexión.");
    }
  }

  function captureLocation() {
    if (!("geolocation" in navigator)) return notify("Geolocalización no disponible en este dispositivo.");
    navigator.geolocation.getCurrentPosition(
      pos => {
        const value = `${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`;
        setLocationText(value);
        notify("Ubicación agregada a la actividad.");
      },
      () => notify("No se obtuvo la ubicación. Revisa los permisos del navegador."),
      { enableHighAccuracy: false, timeout: 10000 }
    );
  }

  function exportData() {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "sportschool-respaldo.json"; a.click();
    URL.revokeObjectURL(url);
  }

  if (splash) return <div className="splash"><div className="logo">SS</div><h1>SportSchool</h1><p>Seguimiento y desempeño deportivo</p></div>;

  return <div className="app-shell">
    <header className="topbar">
      <div className="brand"><div className="brand-mark">SS</div><div><strong>SportSchool</strong><small>Control deportivo escolar</small></div></div>
      <span className={`connection ${online ? "is-online" : "is-offline"}`}><i />{online ? "En línea" : "Sin conexión"}</span>
    </header>

    <div className="layout">
      <aside className="sidebar">
        <p className="nav-label">MENÚ PRINCIPAL</p>
        {[
          ["inicio", "⌂", "Inicio"], ["estudiantes", "♙", "Estudiantes"],
          ["actividades", "＋", "Registrar actividad"], ["historial", "▤", "Historial"]
        ].map(([id, icon, label]) => <button key={id} className={`nav-button ${section === id ? "active" : ""}`} onClick={() => setSection(id)}><span>{icon}</span>{label}</button>)}
        <div className="sidebar-note"><strong>Modo PWA</strong><p>Los datos se guardan en este dispositivo y pueden consultarse sin conexión.</p></div>
      </aside>

      <main className="content">
        {section === "inicio" && <>
          <div className="page-heading"><div><p className="eyebrow">PANEL GENERAL</p><h1>Resumen deportivo</h1><p className="muted">Consulta la actividad y el progreso de la comunidad escolar.</p></div><button className="primary" onClick={() => setSection("actividades")}>＋ Nueva actividad</button></div>
          <div className="stats-grid">
            <Stat label="Estudiantes registrados" value={data.students.length} detail="Perfiles deportivos" icon="♙"/>
            <Stat label="Actividades realizadas" value={totals.count} detail="Registros guardados" icon="◷"/>
            <Stat label="Tiempo acumulado" value={`${totals.minutes} min`} detail={`${(totals.minutes / 60).toFixed(1)} horas`} icon="◴"/>
            <Stat label="Distancia recorrida" value={`${totals.distance.toFixed(2)} km`} detail="Total registrado" icon="⌁"/>
          </div>
          <div className="grid-two">
            <section className="panel"><div className="panel-heading"><div><h2>Actividad reciente</h2><p className="muted">Últimos registros de la comunidad</p></div><button className="text-button" onClick={() => setSection("historial")}>Ver historial →</button></div>
              {visibleActivities.length ? <ActivityTable activities={visibleActivities.slice(0, 5)} students={data.students}/> : <Empty text="Todavía no hay actividades registradas."/>}
            </section>
            <section className="panel"><div className="panel-heading"><div><h2>Estudiantes</h2><p className="muted">Perfiles registrados</p></div><button className="text-button" onClick={() => setSection("estudiantes")}>Ver todos →</button></div>
              {data.students.length ? data.students.slice(0, 5).map(s => <div className="student-row" key={s.id}><div className="avatar">{s.name.charAt(0).toUpperCase()}</div><div className="student-info"><strong>{s.name}</strong><small>{s.group} · {s.sport}</small></div><span className="tag">{data.activities.filter(a => a.studentId === s.id).length} act.</span></div>) : <Empty text="Registra al primer estudiante para comenzar."/>}
            </section>
          </div>
          <section className="panel tools-panel"><div><h2>Herramientas PWA</h2><p className="muted">Prueba las funciones complementarias solicitadas.</p></div><div className="tool-actions"><button className="secondary" onClick={enableNotifications}>Activar notificaciones</button><button className="secondary" onClick={fetchDemo}>Probar Fetch API</button><button className="secondary" onClick={exportData}>Exportar respaldo</button></div>{remoteResult && <p className="fetch-result">{remoteResult}</p>}</section>
        </>}

        {section === "estudiantes" && <>
          <div className="page-heading"><div><p className="eyebrow">DIRECTORIO</p><h1>Estudiantes</h1><p className="muted">Registra y consulta los perfiles deportivos.</p></div></div>
          <section className="panel form-panel"><h2>Nuevo estudiante</h2><form onSubmit={addStudent} className="form-grid">
            <Field label="Nombre completo"><input value={studentForm.name} onChange={e => setStudentForm({...studentForm, name:e.target.value})} placeholder="Ej. Ana López" required/></Field>
            <Field label="Grupo"><input value={studentForm.group} onChange={e => setStudentForm({...studentForm, group:e.target.value})} placeholder="Ej. 3° A" required/></Field>
            <Field label="Disciplina deportiva"><select value={studentForm.sport} onChange={e => setStudentForm({...studentForm, sport:e.target.value})} required><option value="">Selecciona una disciplina</option>{["Fútbol","Básquetbol","Voleibol","Atletismo","Natación","Otro"].map(x=><option key={x}>{x}</option>)}</select></Field>
            <div className="form-submit"><button className="primary" type="submit">Guardar estudiante</button></div>
          </form></section>
          <section className="panel"><div className="panel-heading"><h2>Lista de estudiantes</h2><span className="tag">{data.students.length} registrados</span></div>
            {data.students.length ? <div className="student-list">{data.students.map(s=><div className="student-card" key={s.id}><div className="avatar large">{s.name.charAt(0).toUpperCase()}</div><div className="student-info"><strong>{s.name}</strong><small>Grupo {s.group} · {s.sport}</small></div><span className="tag">{data.activities.filter(a=>a.studentId===s.id).length} actividades</span></div>)}</div> : <Empty text="No hay estudiantes. Utiliza el formulario para registrar uno."/>}
          </section>
        </>}

        {section === "actividades" && <>
          <div className="page-heading"><div><p className="eyebrow">SEGUIMIENTO</p><h1>Registrar actividad</h1><p className="muted">Captura el desempeño deportivo de un estudiante.</p></div></div>
          <section className="panel form-panel"><h2>Datos de la actividad</h2>
            {!data.students.length ? <div className="notice">Primero debes registrar al menos un estudiante. <button className="text-button" onClick={()=>setSection("estudiantes")}>Ir a estudiantes →</button></div> :
            <form onSubmit={addActivity} className="form-grid">
              <Field label="Estudiante"><select value={activityForm.studentId} onChange={e=>setActivityForm({...activityForm,studentId:e.target.value})} required><option value="">Selecciona un estudiante</option>{data.students.map(s=><option value={s.id} key={s.id}>{s.name} — {s.group}</option>)}</select></Field>
              <Field label="Fecha"><input type="date" value={activityForm.date} onChange={e=>setActivityForm({...activityForm,date:e.target.value})} required/></Field>
              <Field label="Actividad deportiva"><input value={activityForm.activity} onChange={e=>setActivityForm({...activityForm,activity:e.target.value})} placeholder="Ej. Carrera de resistencia" required/></Field>
              <Field label="Duración (minutos)"><input type="number" min="1" value={activityForm.duration} onChange={e=>setActivityForm({...activityForm,duration:e.target.value})} placeholder="Ej. 30" required/></Field>
              <Field label="Distancia (km)"><input type="number" min="0" step="0.01" value={activityForm.distance} onChange={e=>setActivityForm({...activityForm,distance:e.target.value})} placeholder="Ej. 2.5"/></Field>
              <Field label="Observaciones"><textarea value={activityForm.notes} onChange={e=>setActivityForm({...activityForm,notes:e.target.value})} placeholder="Anota comentarios del entrenamiento..."/></Field>
              <div className="location-box"><div><strong>Ubicación (opcional)</strong><small>{locationText || "No se ha agregado una ubicación."}</small></div><button type="button" className="secondary" onClick={captureLocation}>⌖ Obtener ubicación</button></div>
              <div className="form-submit"><button className="primary" type="submit">Guardar actividad</button></div>
            </form>}
          </section>
        </>}

        {section === "historial" && <>
          <div className="page-heading"><div><p className="eyebrow">REGISTROS</p><h1>Historial deportivo</h1><p className="muted">Consulta las actividades por estudiante.</p></div></div>
          <section className="panel">
            <div className="filter-row"><label htmlFor="student-filter">Filtrar por estudiante</label><select id="student-filter" value={selectedStudent} onChange={e=>setSelectedStudent(e.target.value)}><option value="all">Todos los estudiantes</option>{data.students.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
            <div className="stats-strip"><span><strong>{totals.count}</strong> actividades</span><span><strong>{totals.minutes}</strong> minutos</span><span><strong>{totals.distance.toFixed(2)}</strong> km</span></div>
            {visibleActivities.length ? <ActivityTable activities={visibleActivities} students={data.students} detailed/> : <Empty text="No hay actividades para mostrar con este filtro."/>}
          </section>
        </>}
        <footer>© {new Date().getFullYear()} SportSchool · Proyecto académico PWA</footer>
      </main>
    </div>
    {message && <div className="toast" role="status">✓ {message}</div>}
  </div>;
}

function Stat({label,value,detail,icon}) { return <div className="stat-card"><div className="stat-top"><span>{label}</span><div className="stat-icon">{icon}</div></div><strong className="stat-value">{value}</strong><small>{detail}</small></div>; }
function Field({label,children}) { return <label className="field"><span>{label}</span>{children}</label>; }
function Empty({text}) { return <div className="empty"><div>▤</div><p>{text}</p></div>; }
function ActivityTable({activities,students,detailed=false}) {
  const studentName = id => students.find(s=>s.id===id)?.name || "Estudiante no disponible";
  return <div className="table-wrap"><table><thead><tr><th>Fecha</th><th>Estudiante</th><th>Actividad</th><th>Duración</th><th>Distancia</th>{detailed&&<th>Observaciones</th>}</tr></thead><tbody>{activities.map(a=><tr key={a.id}><td>{a.date}</td><td>{studentName(a.studentId)}</td><td>{a.activity}</td><td>{a.duration} min</td><td>{Number(a.distance).toFixed(2)} km</td>{detailed&&<td>{a.notes || "—"}{a.location&&<small className="table-location">Ubicación: {a.location}</small>}</td>}</tr>)}</tbody></table></div>;
}
createRoot(document.getElementById("root")).render(<App/>);