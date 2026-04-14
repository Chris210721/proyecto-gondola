import React, { useState, useEffect, useCallback } from "react";
import { API_BASE_URL } from "./config";

const ESTADOS = ["", "pendiente", "finalizada", "enviada_whatsapp"];
const ESTADO_LABELS = {
  pendiente: { label: "Pendiente", className: "estado-pendiente" },
  finalizada: { label: "Finalizada", className: "estado-finalizada" },
  enviada_whatsapp: { label: "Enviada WhatsApp", className: "estado-whatsapp" },
};

function Admin() {
  const [visitas, setVisitas] = useState([]);
  const [cadenas, setCadenas] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [cargando, setCargando] = useState(false);

  // Filters
  const [filtroCadena, setFiltroCadena] = useState("");
  const [filtroSucursal, setFiltroSucursal] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [filtroFechaDesde, setFiltroFechaDesde] = useState("");
  const [filtroFechaHasta, setFiltroFechaHasta] = useState("");

  // Selected visit photos
  const [visitaExpandida, setVisitaExpandida] = useState(null);
  const [fotosVisita, setFotosVisita] = useState([]);
  const [cargandoFotos, setCargandoFotos] = useState(false);

  const cargarCadenas = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/cadenas`);
      const data = await res.json();
      setCadenas(data.data || []);
    } catch (e) {
      console.error("Error cargando cadenas:", e);
    }
  };

  const cargarSucursales = async (cadenaId) => {
    try {
      const url = cadenaId
        ? `${API_BASE_URL}/sucursales?cadena_id=${cadenaId}`
        : `${API_BASE_URL}/sucursales`;
      const res = await fetch(url);
      const data = await res.json();
      setSucursales(data.data || []);
    } catch (e) {
      console.error("Error cargando sucursales:", e);
    }
  };

  const cargarVisitas = useCallback(async () => {
    setCargando(true);
    try {
      const params = new URLSearchParams();
      if (filtroCadena) params.append("cadena_id", filtroCadena);
      if (filtroSucursal) params.append("sucursal_id", filtroSucursal);
      if (filtroEstado) params.append("estado", filtroEstado);
      if (filtroFechaDesde) params.append("fecha_desde", filtroFechaDesde);
      if (filtroFechaHasta) params.append("fecha_hasta", filtroFechaHasta + "T23:59:59");

      const res = await fetch(`${API_BASE_URL}/admin/visitas?${params.toString()}`);
      const data = await res.json();
      setVisitas(data.data || []);
    } catch (e) {
      console.error("Error cargando visitas:", e);
    } finally {
      setCargando(false);
    }
  }, [filtroCadena, filtroSucursal, filtroEstado, filtroFechaDesde, filtroFechaHasta]);

  useEffect(() => {
    cargarCadenas();
    cargarSucursales();
    cargarVisitas();
  }, [cargarVisitas]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFiltrar = (e) => {
    e.preventDefault();
    cargarVisitas();
  };

  const handleCadenaChange = (e) => {
    setFiltroCadena(e.target.value);
    setFiltroSucursal("");
    cargarSucursales(e.target.value || null);
  };

  const handleVerFotos = async (visita) => {
    if (visitaExpandida === visita.id) {
      setVisitaExpandida(null);
      setFotosVisita([]);
      return;
    }
    setVisitaExpandida(visita.id);
    setCargandoFotos(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/visitas/${visita.id}/fotos`);
      const data = await res.json();
      setFotosVisita(data.data || []);
    } catch (e) {
      console.error("Error cargando fotos:", e);
    } finally {
      setCargandoFotos(false);
    }
  };

  const handleDescargarFoto = (foto) => {
    if (!foto.url) return;
    // Use only the last segment of the path and sanitize it
    const rawName = (foto.archivo || "").split("/").pop() || `foto_${foto.id}.jpg`;
    const safeName = rawName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const a = document.createElement("a");
    a.href = foto.url;
    a.download = safeName;
    a.target = "_blank";
    a.rel = "noreferrer";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDescargarTodasFotos = async () => {
    for (const foto of fotosVisita) {
      if (foto.url) {
        handleDescargarFoto(foto);
        // Small delay to avoid browser blocking multiple downloads
        await new Promise((r) => setTimeout(r, 300));
      }
    }
  };

  const formatFecha = (dateStr) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return d.toLocaleString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getNombreCadena = (visita) => {
    return visita.sucursales?.cadenas?.nombre || "-";
  };

  const getNombreSucursal = (visita) => {
    return visita.sucursales?.nombre || "-";
  };

  return (
    <div className="container admin-container">
      <div className="admin-header">
        <h1>⚙️ Panel Admin - Gondola</h1>
        <a href="/" className="admin-link">← Volver a la App</a>
      </div>

      {/* Filters */}
      <div className="filtros-card">
        <h3>🔍 Filtros</h3>
        <form onSubmit={handleFiltrar} className="filtros-form">
          <div className="filtros-grid">
            <div className="filtro-group">
              <label>Cadena</label>
              <select value={filtroCadena} onChange={handleCadenaChange} className="filtro-select">
                <option value="">Todas</option>
                {cadenas.map((c) => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            </div>

            <div className="filtro-group">
              <label>Sucursal</label>
              <select
                value={filtroSucursal}
                onChange={(e) => setFiltroSucursal(e.target.value)}
                className="filtro-select"
              >
                <option value="">Todas</option>
                {sucursales.map((s) => (
                  <option key={s.id} value={s.id}>{s.nombre}</option>
                ))}
              </select>
            </div>

            <div className="filtro-group">
              <label>Estado</label>
              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                className="filtro-select"
              >
                {ESTADOS.map((e) => (
                  <option key={e} value={e}>
                    {e === "" ? "Todos" : ESTADO_LABELS[e]?.label || e}
                  </option>
                ))}
              </select>
            </div>

            <div className="filtro-group">
              <label>Fecha desde</label>
              <input
                type="date"
                value={filtroFechaDesde}
                onChange={(e) => setFiltroFechaDesde(e.target.value)}
                className="filtro-input"
              />
            </div>

            <div className="filtro-group">
              <label>Fecha hasta</label>
              <input
                type="date"
                value={filtroFechaHasta}
                onChange={(e) => setFiltroFechaHasta(e.target.value)}
                className="filtro-input"
              />
            </div>
          </div>

          <button type="submit" className="btn-submit" disabled={cargando}>
            {cargando ? "⏳ Cargando..." : "🔍 Filtrar"}
          </button>
        </form>
      </div>

      {/* Results table */}
      <div className="tabla-card">
        <div className="tabla-header">
          <h3>📋 Visitas ({visitas.length})</h3>
        </div>

        {cargando ? (
          <div className="cargando">⏳ Cargando visitas...</div>
        ) : visitas.length === 0 ? (
          <div className="sin-datos">No se encontraron visitas con los filtros aplicados.</div>
        ) : (
          <div className="tabla-wrapper">
            <table className="admin-tabla">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Cadena</th>
                  <th>Sucursal</th>
                  <th>Marca</th>
                  <th>Producto</th>
                  <th>Mercaderista</th>
                  <th>Estado</th>
                  <th>Fecha</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {visitas.map((visita) => (
                  <React.Fragment key={visita.id}>
                    <tr className={visitaExpandida === visita.id ? "row-expanded" : ""}>
                      <td>#{visita.id}</td>
                      <td>{getNombreCadena(visita)}</td>
                      <td>{getNombreSucursal(visita)}</td>
                      <td>{visita.marcas?.nombre || "-"}</td>
                      <td>{visita.productos?.nombre || "-"}</td>
                      <td>{visita.usuario_nombre || <em className="sin-valor">Sin asignar</em>}</td>
                      <td>
                        {visita.estado ? (
                          <span className={`estado-badge ${ESTADO_LABELS[visita.estado]?.className || ""}`}>
                            {ESTADO_LABELS[visita.estado]?.label || visita.estado}
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td>{formatFecha(visita.fecha || visita.created_at)}</td>
                      <td>
                        <button
                          className="btn-ver-fotos"
                          onClick={() => handleVerFotos(visita)}
                        >
                          {visitaExpandida === visita.id ? "🔼 Ocultar" : "📸 Ver fotos"}
                        </button>
                      </td>
                    </tr>

                    {visitaExpandida === visita.id && (
                      <tr className="fotos-row">
                        <td colSpan={9}>
                          <div className="fotos-expandidas">
                            {visita.observaciones && (
                              <p className="observaciones-text">
                                <strong>📝 Observaciones:</strong> {visita.observaciones}
                              </p>
                            )}

                            {cargandoFotos ? (
                              <p>⏳ Cargando fotos...</p>
                            ) : fotosVisita.length === 0 ? (
                              <p className="sin-datos">Sin fotos subidas.</p>
                            ) : (
                              <>
                                <div className="fotos-actions">
                                  <span>{fotosVisita.length} foto(s)</span>
                                  <button
                                    className="btn-descargar-todas"
                                    onClick={handleDescargarTodasFotos}
                                  >
                                    ⬇️ Descargar todas
                                  </button>
                                </div>
                                <div className="fotos-grid-admin">
                                  {fotosVisita.map((foto) => (
                                    <div key={foto.id} className="foto-card-admin">
                                      {foto.url ? (
                                        <img
                                          src={foto.url}
                                          alt="Foto gondola"
                                          className="foto-thumb-admin"
                                        />
                                      ) : (
                                        <div className="foto-placeholder-admin">📸</div>
                                      )}
                                      <button
                                        className="btn-descargar"
                                        onClick={() => handleDescargarFoto(foto)}
                                      >
                                        ⬇️ Descargar
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Admin;
