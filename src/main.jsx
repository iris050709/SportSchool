
import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const DB_KEY = "sportschool-data-v1";
const initialData = { students: [], activities: [] };

const sportsOptions = [
  "Fútbol",
  "Básquetbol",
  "Voleibol",
  "Atletismo",
  "Natación",
  "Taekwondo",
  "Gimnasia",
  "Otro",
];

function readData() {
  try {
    const saved = JSON.parse(localStorage.getItem(DB_KEY) || "{}");
    return {
      students: Array.isArray(saved.students) ? saved.students : [],
      activities: Array.isArray(saved.activities) ? saved.activities : [],
    };
  } catch {
    return { ...initialData };
  }
}

function saveData(data) {
  localStorage.setItem(DB_KEY, JSON.stringify(data));
}

function today() {
  const date = new Date();
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 10);
}

function App() {
  const [data, setData] = useState(readData);
  const [section, setSection] = useState("inicio");

  const [studentForm, setStudentForm] = useState({
    name: "",
    group: "",
    sport: "",
  });
  const [sportOther, setSportOther] = useState("");

  const [activityForm, setActivityForm] = useState({
    studentId: "",
    date: today(),
    activity: "",
    duration: "",
    distance: "",
    notes: "",
  });

  const [selectedStudent, setSelectedStudent] = useState("all");
  const [online, setOnline] = useState(navigator.onLine);
  const [message, setMessage] = useState("");
  const [remoteResult, setRemoteResult] = useState("");
  const [locationText, setLocationText] = useState("");
  const [splash, setSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setSplash(false), 1000);

    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    if ("serviceWorker" in navigator) {
      const registerSW = () => {
        navigator.serviceWorker
          .register("/sw.js")
          .catch(error => console.error("SW:", error));
      };

      if (document.readyState === "complete") {
        registerSW();
      } else {
        window.addEventListener("load", registerSW, { once: true });
      }
    }

    return () => {
      clearTimeout(timer);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  useEffect(() => {
    saveData(data);
  }, [data]);

  const visibleActivities = useMemo(() => {
    return data.activities
      .filter(
        activity =>
          selectedStudent === "all" ||
          activity.studentId === selectedStudent
      )
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [data.activities, selectedStudent]);

  const totals = useMemo(() => {
    const list =
      selectedStudent === "all"
        ? data.activities
        : data.activities.filter(a => a.studentId === selectedStudent);

    return {
      count: list.length,
      minutes: list.reduce((sum, a) => sum + Number(a.duration || 0), 0),
      distance: list.reduce((sum, a) => sum + Number(a.distance || 0), 0),
    };
  }, [data.activities, selectedStudent]);

  function notify(text) {
    setMessage(text);

    setTimeout(() => setMessage(""), 3200);

    if (
      "Notification" in window &&
      Notification.permission === "granted"
    ) {
      new Notification("SportSchool", {
        body: text,
        icon: "/icons/icon-1.png",
      });
    }
  }

  async function enableNotifications() {
    if (!("Notification" in window)) {
      return notify("Este navegador no admite notificaciones.");
    }

    const permission = await Notification.requestPermission();

    notify(
      permission === "granted"
        ? "Notificaciones activadas."
        : "No se concedió el permiso de notificaciones."
    );
  }

  function addStudent(e) {
    e.preventDefault();

    const name = studentForm.name.trim();
    const group = studentForm.group.trim();

    const sport =
      studentForm.sport === "Otro"
        ? sportOther.trim()
        : studentForm.sport;

    if (!name || !group || !sport) {
      return notify("Completa todos los campos del estudiante.");
    }

    const student = {
      name,
      group,
      sport,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };

    setData(prev => ({
      ...prev,
      students: [...prev.students, student],
    }));

    setStudentForm({ name: "", group: "", sport: "" });
    setSportOther("");

    setActivityForm(prev => ({
      ...prev,
      studentId: prev.studentId || student.id,
    }));

    notify("Estudiante registrado correctamente.");
  }

  function addActivity(e) {
    e.preventDefault();

    if (
      !activityForm.studentId ||
      !activityForm.activity.trim() ||
      !activityForm.duration ||
      Number(activityForm.duration) <= 0
    ) {
      return notify("Revisa los datos de la actividad.");
    }

    const activity = {
      ...activityForm,
      activity: activityForm.activity.trim(),
      id: crypto.randomUUID(),
      duration: Number(activityForm.duration),
      distance: Number(activityForm.distance || 0),
      location: locationText || "",
    };

    setData(prev => ({
      ...prev,
      activities: [...prev.activities, activity],
    }));

    setActivityForm(prev => ({
      ...prev,
      activity: "",
      duration: "",
      distance: "",
      notes: "",
      date: today(),
    }));

    setLocationText("");
    notify("Actividad guardada correctamente.");
  }

  async function fetchDemo() {
    setRemoteResult("Consultando servicio...");

    try {
      const response = await fetch(
        "https://jsonplaceholder.typicode.com/todos/1"
      );

      if (!response.ok) throw new Error("Respuesta no válida");

      const result = await response.json();

      setRemoteResult(
        `Conexión correcta. Respuesta recibida: "${result.title}". Esta prueba no sincroniza los datos de SportSchool.`
      );
    } catch {
      setRemoteResult(
        "No se pudo realizar la consulta. Los datos locales siguen disponibles."
      );
    }
  }

  function captureLocation() {
    if (!("geolocation" in navigator)) {
      return notify("Geolocalización no disponible en este dispositivo.");
    }

    navigator.geolocation.getCurrentPosition(
      position => {
        const value = `${position.coords.latitude.toFixed(5)}, ${position.coords.longitude.toFixed(5)}`;
        setLocationText(value);
        notify("Ubicación agregada a la actividad.");
      },
      () => notify("No se obtuvo la ubicación. Revisa los permisos."),
      { enableHighAccuracy: false, timeout: 10000 }
    );
  }

  function exportData() {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = "sportschool-respaldo.json";
    a.click();

    URL.revokeObjectURL(url);
    notify("Respaldo descargado.");
  }

  if (splash) {
    return (
      <div className="splash">
        <div className="splash-logo">ss</div>
        <h1>SportSchool</h1>
        <p>El deporte también forma parte de aprender.</p>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">ss</div>
          <div>
            <strong>SportSchool</strong>
            <small>Registro deportivo escolar</small>
          </div>
        </div>

        <span className={`connection ${online ? "is-online" : "is-offline"}`}>
          <i />
          {online ? "En línea" : "Sin conexión"}
        </span>
      </header>

      <div className="layout">
        <aside className="sidebar">
          <p className="nav-label">NAVEGACIÓN</p>

          {[
            ["inicio", "⌂", "Inicio"],
            ["estudiantes", "♙", "Estudiantes"],
            ["actividades", "＋", "Nueva actividad"],
            ["historial", "▤", "Historial"],
          ].map(([id, icon, label]) => (
            <button
              key={id}
              className={`nav-button ${section === id ? "active" : ""}`}
              onClick={() => setSection(id)}
            >
              <span>{icon}</span>
              {label}
            </button>
          ))}

          <div className="sidebar-note">
            <span className="note-icon">♡</span>
            <strong>SportSchool</strong>
            <p>
              Un espacio para registrar, organizar y consultar el
              desempeño deportivo escolar.
            </p>
          </div>
        </aside>

        <main className="content">
          {section === "inicio" && (
            <>
              <div className="page-heading">
                <div>
                  <p className="eyebrow">INICIO</p>
                  <h1>Resumen deportivo</h1>
                  <p className="muted">
                    Un vistazo a las actividades y registros escolares.
                  </p>
                </div>

                <button
                  className="primary"
                  onClick={() => setSection("actividades")}
                >
                  + Registrar actividad
                </button>
              </div>

              <div className="stats-grid">
                <Stat
                  label="Estudiantes"
                  value={data.students.length}
                  detail="Registrados"
                  icon="♙"
                  color="rose"
                />
                <Stat
                  label="Actividades"
                  value={totals.count}
                  detail="Sesiones registradas"
                  icon="↗"
                  color="lilac"
                />
                <Stat
                  label="Tiempo"
                  value={`${totals.minutes} min`}
                  detail={`${(totals.minutes / 60).toFixed(1)} horas`}
                  icon="◷"
                  color="peach"
                />
                <Stat
                  label="Distancia"
                  value={`${totals.distance.toFixed(2)} km`}
                  detail="Total recorrido"
                  icon="⌁"
                  color="pink"
                />
              </div>

              <div className="grid-two">
                <section className="panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Últimas actividades</h2>
                      <p className="muted">Registros recientes</p>
                    </div>
                    <button
                      className="text-button"
                      onClick={() => setSection("historial")}
                    >
                      Ver historial →
                    </button>
                  </div>

                  {visibleActivities.length ? (
                    <ActivityTable
                      activities={visibleActivities.slice(0, 5)}
                      students={data.students}
                    />
                  ) : (
                    <Empty text="Aún no hay actividades. Cuando registres una, aparecerá aquí." />
                  )}
                </section>

                <section className="panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Alumnos registrados</h2>
                      <p className="muted">Directorio deportivo</p>
                    </div>
                    <button
                      className="text-button"
                      onClick={() => setSection("estudiantes")}
                    >
                      Ver lista →
                    </button>
                  </div>

                  {data.students.length ? (
                    data.students.slice(0, 5).map(student => (
                      <div className="student-row" key={student.id}>
                        <div className="avatar">
                          {student.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="student-info">
                          <strong>{student.name}</strong>
                          <small>
                            {student.group} · {student.sport}
                          </small>
                        </div>
                        <span className="tag">
                          {data.activities.filter(a => a.studentId === student.id).length}
                          {" "}reg.
                        </span>
                      </div>
                    ))
                  ) : (
                    <Empty text="Todavía no hay alumnos registrados." />
                  )}
                </section>
              </div>

              <section className="panel tools-panel">
                <div>
                  <p className="eyebrow">OPCIONES</p>
                  <h2>Herramientas</h2>
                  <p className="muted">
                    Funciones adicionales de la aplicación.
                  </p>
                </div>

                <div className="tool-actions">
                  <button className="secondary" onClick={enableNotifications}>
                    ♡ Notificaciones
                  </button>
                  <button className="secondary" onClick={fetchDemo}>
                    ↗ Probar conexión
                  </button>
                  <button className="secondary" onClick={exportData}>
                    ↓ Descargar respaldo
                  </button>
                </div>

                {remoteResult && (
                  <p className="fetch-result">{remoteResult}</p>
                )}
              </section>
            </>
          )}

          {section === "estudiantes" && (
            <>
              <div className="page-heading">
                <div>
                  <p className="eyebrow">DIRECTORIO</p>
                  <h1>Estudiantes</h1>
                  <p className="muted">
                    Registra a los alumnos y su disciplina deportiva.
                  </p>
                </div>
              </div>

              <section className="panel form-panel">
                <div className="form-title">
                  <span className="form-title-icon">＋</span>
                  <div>
                    <h2>Nuevo estudiante</h2>
                    <p className="muted">Completa la información solicitada.</p>
                  </div>
                </div>

                <form onSubmit={addStudent} className="form-grid">
                  <Field label="Nombre completo">
                    <input
                      value={studentForm.name}
                      onChange={e =>
                        setStudentForm({ ...studentForm, name: e.target.value })
                      }
                      placeholder="Nombre del estudiante"
                      required
                    />
                  </Field>

                  <Field label="Grupo">
                    <input
                      value={studentForm.group}
                      onChange={e =>
                        setStudentForm({ ...studentForm, group: e.target.value })
                      }
                      placeholder="Ej. 3° A"
                      required
                    />
                  </Field>

                  <Field label="Disciplina deportiva">
                    <select
                      value={studentForm.sport}
                      onChange={e => {
                        setStudentForm({
                          ...studentForm,
                          sport: e.target.value,
                        });
                        setSportOther("");
                      }}
                      required
                    >
                      <option value="">Selecciona una disciplina</option>
                      {sportsOptions.map(sport => (
                        <option key={sport} value={sport}>
                          {sport}
                        </option>
                      ))}
                    </select>
                  </Field>

                  {studentForm.sport === "Otro" && (
                    <Field label="Especifica la disciplina">
                      <input
                        value={sportOther}
                        onChange={e => setSportOther(e.target.value)}
                        placeholder="Escribe el deporte"
                        required
                      />
                    </Field>
                  )}

                  <div className="form-submit">
                    <button className="primary" type="submit">
                      Guardar estudiante
                    </button>
                  </div>
                </form>
              </section>

              <section className="panel">
                <div className="panel-heading">
                  <div>
                    <h2>Lista de estudiantes</h2>
                    <p className="muted">Alumnos registrados en SportSchool</p>
                  </div>
                  <span className="tag">{data.students.length} alumnos</span>
                </div>

                {data.students.length ? (
                  <div className="student-list">
                    {data.students.map(student => (
                      <div className="student-card" key={student.id}>
                        <div className="avatar large">
                          {student.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="student-info">
                          <strong>{student.name}</strong>
                          <small>
                            {student.group} · {student.sport}
                          </small>
                        </div>
                        <span className="tag">
                          {data.activities.filter(a => a.studentId === student.id).length}
                          {" "}actividades
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Empty text="No hay estudiantes registrados. Puedes agregar el primero desde el formulario." />
                )}
              </section>
            </>
          )}

          {section === "actividades" && (
            <>
              <div className="page-heading">
                <div>
                  <p className="eyebrow">REGISTRO</p>
                  <h1>Nueva actividad</h1>
                  <p className="muted">
                    Guarda los datos de la práctica o entrenamiento.
                  </p>
                </div>
              </div>

              <section className="panel form-panel">
                <div className="form-title">
                  <span className="form-title-icon">♡</span>
                  <div>
                    <h2>Información de la actividad</h2>
                    <p className="muted">
                      Los campos marcados son necesarios para el registro.
                    </p>
                  </div>
                </div>

                {!data.students.length ? (
                  <div className="notice">
                    Primero registra un estudiante.
                    <button
                      className="text-button"
                      onClick={() => setSection("estudiantes")}
                    >
                      Ir al directorio →
                    </button>
                  </div>
                ) : (
                  <form onSubmit={addActivity} className="form-grid">
                    <Field label="Estudiante">
                      <select
                        value={activityForm.studentId}
                        onChange={e =>
                          setActivityForm({
                            ...activityForm,
                            studentId: e.target.value,
                          })
                        }
                        required
                      >
                        <option value="">Selecciona un estudiante</option>
                        {data.students.map(student => (
                          <option value={student.id} key={student.id}>
                            {student.name} — {student.group}
                          </option>
                        ))}
                      </select>
                    </Field>

                    <Field label="Fecha">
                      <input
                        type="date"
                        value={activityForm.date}
                        onChange={e =>
                          setActivityForm({
                            ...activityForm,
                            date: e.target.value,
                          })
                        }
                        required
                      />
                    </Field>

                    <Field label="Actividad deportiva">
                      <input
                        value={activityForm.activity}
                        onChange={e =>
                          setActivityForm({
                            ...activityForm,
                            activity: e.target.value,
                          })
                        }
                        placeholder="Ej. Entrenamiento de pases"
                        required
                      />
                    </Field>

                    <Field label="Duración (minutos)">
                      <input
                        type="number"
                        min="1"
                        value={activityForm.duration}
                        onChange={e =>
                          setActivityForm({
                            ...activityForm,
                            duration: e.target.value,
                          })
                        }
                        placeholder="Ej. 45"
                        required
                      />
                    </Field>

                    <Field label="Distancia (km)">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={activityForm.distance}
                        onChange={e =>
                          setActivityForm({
                            ...activityForm,
                            distance: e.target.value,
                          })
                        }
                        placeholder="Ej. 1.50"
                      />
                    </Field>

                    <Field label="Observaciones">
                      <textarea
                        value={activityForm.notes}
                        onChange={e =>
                          setActivityForm({
                            ...activityForm,
                            notes: e.target.value,
                          })
                        }
                        placeholder="Comentarios sobre la actividad"
                      />
                    </Field>

                    <div className="location-box">
                      <div>
                        <strong>Ubicación</strong>
                        <small>
                          {locationText || "Opcional, puedes agregarla si lo deseas."}
                        </small>
                      </div>
                      <button
                        type="button"
                        className="secondary"
                        onClick={captureLocation}
                      >
                        ⌖ Obtener ubicación
                      </button>
                    </div>

                    <div className="form-submit">
                      <button className="primary" type="submit">
                        Guardar actividad
                      </button>
                    </div>
                  </form>
                )}
              </section>
            </>
          )}

          {section === "historial" && (
            <>
              <div className="page-heading">
                <div>
                  <p className="eyebrow">CONSULTA</p>
                  <h1>Historial deportivo</h1>
                  <p className="muted">
                    Revisa los registros y filtra por estudiante.
                  </p>
                </div>
              </div>

              <section className="panel">
                <div className="filter-row">
                  <label htmlFor="student-filter">Estudiante</label>
                  <select
                    id="student-filter"
                    value={selectedStudent}
                    onChange={e => setSelectedStudent(e.target.value)}
                  >
                    <option value="all">Todos los estudiantes</option>
                    {data.students.map(student => (
                      <option key={student.id} value={student.id}>
                        {student.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="stats-strip">
                  <span><strong>{totals.count}</strong> actividades</span>
                  <span><strong>{totals.minutes}</strong> minutos</span>
                  <span><strong>{totals.distance.toFixed(2)}</strong> km</span>
                </div>

                {visibleActivities.length ? (
                  <ActivityTable
                    activities={visibleActivities}
                    students={data.students}
                    detailed
                  />
                ) : (
                  <Empty text="No se encontraron actividades para este filtro." />
                )}
              </section>
            </>
          )}

          <footer>
            SportSchool · Registro deportivo escolar · {new Date().getFullYear()}
          </footer>
        </main>
      </div>

      {message && <div className="toast" role="status">✓ {message}</div>}
    </div>
  );
}

function Stat({ label, value, detail, icon, color }) {
  return (
    <div className={`stat-card ${color}`}>
      <div className="stat-top">
        <span>{label}</span>
        <div className="stat-icon">{icon}</div>
      </div>
      <strong className="stat-value">{value}</strong>
      <small>{detail}</small>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}

function Empty({ text }) {
  return (
    <div className="empty">
      <div className="empty-icon">♡</div>
      <p>{text}</p>
    </div>
  );
}

function ActivityTable({ activities, students, detailed = false }) {
  const studentName = id =>
    students.find(student => student.id === id)?.name ||
    "Estudiante no disponible";

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Estudiante</th>
            <th>Actividad</th>
            <th>Duración</th>
            <th>Distancia</th>
            {detailed && <th>Observaciones</th>}
          </tr>
        </thead>
        <tbody>
          {activities.map(activity => (
            <tr key={activity.id}>
              <td>{activity.date}</td>
              <td>{studentName(activity.studentId)}</td>
              <td>{activity.activity}</td>
              <td>{activity.duration} min</td>
              <td>{Number(activity.distance || 0).toFixed(2)} km</td>
              {detailed && (
                <td>
                  {activity.notes || "—"}
                  {activity.location && (
                    <small className="table-location">
                      Ubicación: {activity.location}
                    </small>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
