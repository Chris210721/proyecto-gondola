import React, { useState, useEffect, useRef } from "react";
import { API_BASE_URL } from "./config";

function App() {
  const [cadenas, setCadenas] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [productos, setProductos] = useState([]);
  const [fotos, setFotos] = useState([]);

  const [cadenaSeleccionada, setCadenaSeleccionada] = useState(null);
  const [sucursalSeleccionada, setSucursalSeleccionada] = useState(null);
  const [marcaSeleccionada, setMarcaSeleccionada] = useState(null);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [visitaId, setVisitaId] = useState(null);

  // Photo editor state
  const [previewImg, setPreviewImg] = useState(null);
  const [editandoFoto, setEditandoFoto] = useState(false);
  const canvasRef = useRef(null);
  const [herramienta, setHerramienta] = useState("gondola");
  const [areas, setAreas] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);
  const [originalImage, setOriginalImage] = useState(null);

  // Finalizar visita state
  const [mostrarFinalizarForm, setMostrarFinalizarForm] = useState(false);
  const [usuarioNombre, setUsuarioNombre] = useState("");
  const [grupoWhatsapp, setGrupoWhatsapp] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [enviando, setEnviando] = useState(false);

  // -------- Data loaders --------

  const cargarCadenas = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/cadenas`);
      const data = await res.json();
      setCadenas(data.data || []);
    } catch (error) {
      console.error("Error cargando cadenas:", error);
    }
  };

  const cargarSucursales = async (cadenaId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/sucursales?cadena_id=${cadenaId}`);
      const data = await res.json();
      setSucursales(data.data || []);
      setSucursalSeleccionada(null);
    } catch (error) {
      console.error("Error cargando sucursales:", error);
    }
  };

  const cargarMarcas = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/marcas`);
      const data = await res.json();
      setMarcas(data.data || []);
    } catch (error) {
      console.error("Error cargando marcas:", error);
    }
  };

  const cargarProductos = async (marcaId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/productos?marca_id=${marcaId}`);
      const data = await res.json();
      setProductos(data.data || []);
      setProductoSeleccionado(null);
    } catch (error) {
      console.error("Error cargando productos:", error);
    }
  };

  const cargarFotos = async (vid) => {
    try {
      const res = await fetch(`${API_BASE_URL}/fotos/${vid}`);
      const data = await res.json();
      setFotos(data.data || []);
    } catch (error) {
      console.error("Error cargando fotos:", error);
    }
  };

  // -------- Effects --------

  useEffect(() => {
    cargarCadenas();
    cargarMarcas();
  }, []);

  useEffect(() => {
    if (cadenaSeleccionada) cargarSucursales(cadenaSeleccionada);
  }, [cadenaSeleccionada]);

  useEffect(() => {
    if (marcaSeleccionada) cargarProductos(marcaSeleccionada);
  }, [marcaSeleccionada]);

  useEffect(() => {
    if (visitaId) cargarFotos(visitaId);
  }, [visitaId]);

  useEffect(() => {
    if (editandoFoto && previewImg && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      const img = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        setOriginalImage(img);
        setAreas([]);
      };
      img.src = previewImg;
    }
  }, [editandoFoto, previewImg]);

  // Prevent scroll while drawing on touch
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const handleTouchMove = (e) => {
      if (isDrawing) e.preventDefault();
    };
    canvas.addEventListener("touchmove", handleTouchMove, { passive: false });
    return () => canvas.removeEventListener("touchmove", handleTouchMove);
  }, [isDrawing]);

  // -------- Canvas helpers --------

  const redrawCanvas = (newAreas = areas) => {
    if (!canvasRef.current || !originalImage) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(originalImage, 0, 0);
    newAreas.forEach((area) => {
      ctx.fillStyle = area.tipo === "gondola" ? "rgba(255,0,0,0.25)" : "rgba(0,255,0,0.25)";
      ctx.strokeStyle = area.tipo === "gondola" ? "red" : "green";
      ctx.lineWidth = 3;
      ctx.fillRect(area.x, area.y, area.width, area.height);
      ctx.strokeRect(area.x, area.y, area.width, area.height);
    });
  };

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    let clientX, clientY;
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if (e.changedTouches && e.changedTouches.length > 0) {
      clientX = e.changedTouches[0].clientX;
      clientY = e.changedTouches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const handleCanvasMouseDown = (e) => {
    const { x, y } = getCoordinates(e);
    setIsDrawing(true);
    setStartX(x);
    setStartY(y);
  };

  const handleCanvasMouseMove = (e) => {
    if (!isDrawing || !canvasRef.current || !originalImage) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const { x: currentX, y: currentY } = getCoordinates(e);
    redrawCanvas();
    const width = currentX - startX;
    const height = currentY - startY;
    ctx.fillStyle = herramienta === "gondola" ? "rgba(255,0,0,0.3)" : "rgba(0,255,0,0.3)";
    ctx.strokeStyle = herramienta === "gondola" ? "red" : "green";
    ctx.lineWidth = 3;
    ctx.fillRect(startX, startY, width, height);
    ctx.strokeRect(startX, startY, width, height);
  };

  const handleCanvasMouseUp = (e) => {
    if (!isDrawing || !canvasRef.current || !originalImage) return;
    const { x: currentX, y: currentY } = getCoordinates(e);
    const width = currentX - startX;
    const height = currentY - startY;
    if (Math.abs(width) > 20 && Math.abs(height) > 20) {
      const newArea = {
        tipo: herramienta,
        x: Math.min(startX, currentX),
        y: Math.min(startY, currentY),
        width: Math.abs(width),
        height: Math.abs(height),
      };
      const newAreas = [...areas, newArea];
      setAreas(newAreas);
      redrawCanvas(newAreas);
    }
    setIsDrawing(false);
  };

  const handleLimpiarUltima = () => {
    const newAreas = areas.slice(0, -1);
    setAreas(newAreas);
    redrawCanvas(newAreas);
  };

  const handleLimpiarTodo = () => {
    setAreas([]);
    if (canvasRef.current && originalImage) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(originalImage, 0, 0);
    }
  };

  // -------- File / Photo handlers --------

  const handleArchivoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setPreviewImg(event.target.result);
      setEditandoFoto(true);
      setAreas([]);
    };
    reader.readAsDataURL(file);
  };

  const handleSubirFoto = async () => {
    if (!visitaId || !previewImg) {
      alert("Error: Visita no registrada");
      return;
    }
    try {
      const canvas = canvasRef.current;
      canvas.toBlob(async (blob) => {
        const formData = new FormData();
        formData.append("file", blob, "foto-gondola.jpg");
        const res = await fetch(`${API_BASE_URL}/fotos?visita_id=${visitaId}`, {
          method: "POST",
          body: formData,
        });
        if (res.ok) {
          alert("✅ Foto subida exitosamente");
          setPreviewImg(null);
          setEditandoFoto(false);
          setAreas([]);
          cargarFotos(visitaId);
        } else {
          alert("❌ Error al subir foto");
        }
      }, "image/jpeg", 0.9);
    } catch (error) {
      alert("❌ Error: " + error.message);
    }
  };

  // -------- Visita creation --------

  const handleProductoSeleccionado = async () => {
    if (!sucursalSeleccionada || !marcaSeleccionada || !productoSeleccionado) {
      alert("Selecciona cadena, sucursal, marca y producto");
      return;
    }
    try {
      const res = await fetch(
        `${API_BASE_URL}/visitas?sucursal_id=${sucursalSeleccionada}&marca_id=${marcaSeleccionada}&producto_id=${productoSeleccionado}`,
        { method: "POST" }
      );
      const data = await res.json();
      if (data.data && data.data.length > 0) {
        setVisitaId(data.data[0].id);
        alert("✅ Visita registrada exitosamente");
      }
    } catch (error) {
      alert("❌ Error al registrar visita");
    }
  };

  // -------- Finalizar Visita + WhatsApp --------

  const handleAbrirFinalizarForm = () => {
    if (fotos.length === 0) {
      alert("⚠️ Debes subir al menos una foto antes de finalizar la visita.");
      return;
    }
    setMostrarFinalizarForm(true);
  };

  const generarMensajeWhatsApp = () => {
    const cadena = cadenas.find((c) => c.id === cadenaSeleccionada)?.nombre || "-";
    const sucursal = sucursales.find((s) => s.id === sucursalSeleccionada)?.nombre || "-";
    const marca = marcas.find((m) => m.id === marcaSeleccionada)?.nombre || "-";
    const producto = productos.find((p) => p.id === productoSeleccionado)?.nombre || "-";
    const ahora = new Date().toLocaleString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    return (
      `📦 *INFORME DE VISITA GONDOLA*\n\n` +
      `👤 *Mercaderista:* ${usuarioNombre || "Sin nombre"}\n` +
      `🏬 *Cadena:* ${cadena}\n` +
      `📍 *Sucursal:* ${sucursal}\n` +
      `🏷️ *Marca:* ${marca}\n` +
      `🛒 *Producto:* ${producto}\n` +
      `📸 *Fotos subidas:* ${fotos.length}\n` +
      `📝 *Observaciones:* ${observaciones || "Sin observaciones"}\n` +
      `📅 *Fecha/Hora:* ${ahora}\n` +
      `\n_Enviado desde App Gondola_`
    );
  };

  const handleEnviarWhatsApp = async () => {
    if (!usuarioNombre.trim()) {
      alert("⚠️ Por favor ingresa tu nombre.");
      return;
    }
    setEnviando(true);
    try {
      // 1. Update visit with user data and mark as sent via WhatsApp
      await fetch(`${API_BASE_URL}/visitas/${visitaId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          usuario_nombre: usuarioNombre,
          observaciones: observaciones,
          grupo_whatsapp: grupoWhatsapp,
          estado: "enviada_whatsapp",
          enviada_whatsapp: true,
        }),
      });

      // 2. Mark as finalized
      await fetch(`${API_BASE_URL}/visitas/${visitaId}/finalizar`, {
        method: "POST",
      });

      // 3. Open WhatsApp Web with pre-filled message
      const mensaje = generarMensajeWhatsApp();
      const encodedMsg = encodeURIComponent(mensaje);
      window.open(`https://wa.me/?text=${encodedMsg}`, "_blank");

      alert("✅ Visita finalizada. Se abrirá WhatsApp para enviar el mensaje al grupo.");
      handleReiniciar();
    } catch (error) {
      alert("❌ Error al finalizar visita: " + error.message);
    } finally {
      setEnviando(false);
    }
  };

  // -------- Reset --------

  const handleReiniciar = () => {
    setCadenaSeleccionada(null);
    setSucursalSeleccionada(null);
    setMarcaSeleccionada(null);
    setProductoSeleccionado(null);
    setVisitaId(null);
    setFotos([]);
    setPreviewImg(null);
    setEditandoFoto(false);
    setAreas([]);
    setMostrarFinalizarForm(false);
    setUsuarioNombre("");
    setGrupoWhatsapp("");
    setObservaciones("");
  };

  // -------- Render --------

  return (
    <div className="container">
      <h1>🏪 Gondola - Control de Visitas</h1>
      <a href="/admin" className="admin-link">⚙️ Panel Admin</a>

      {!visitaId ? (
        <div className="wizard">
          {/* Step 1 */}
          <div className="step">
            <h2>Paso 1: Selecciona Cadena</h2>
            <div className="buttons-group">
              {cadenas.map((cadena) => (
                <button
                  key={cadena.id}
                  className={`btn ${cadenaSeleccionada === cadena.id ? "active" : ""}`}
                  onClick={() => setCadenaSeleccionada(cadena.id)}
                >
                  {cadena.nombre}
                </button>
              ))}
            </div>
          </div>

          {/* Step 2 */}
          {cadenaSeleccionada && (
            <div className="step">
              <h2>Paso 2: Selecciona Sucursal</h2>
              <div className="buttons-group">
                {sucursales.map((sucursal) => (
                  <button
                    key={sucursal.id}
                    className={`btn ${sucursalSeleccionada === sucursal.id ? "active" : ""}`}
                    onClick={() => setSucursalSeleccionada(sucursal.id)}
                  >
                    {sucursal.nombre}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3 */}
          {sucursalSeleccionada && (
            <div className="step">
              <h2>Paso 3: Selecciona Marca</h2>
              <div className="buttons-group">
                {marcas.map((marca) => (
                  <button
                    key={marca.id}
                    className={`btn ${marcaSeleccionada === marca.id ? "active" : ""}`}
                    onClick={() => setMarcaSeleccionada(marca.id)}
                  >
                    {marca.nombre}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 4 */}
          {marcaSeleccionada && (
            <div className="step">
              <h2>Paso 4: Selecciona Producto</h2>
              <div className="buttons-group">
                {productos.map((producto) => (
                  <button
                    key={producto.id}
                    className={`btn ${productoSeleccionado === producto.id ? "active" : ""}`}
                    onClick={() => setProductoSeleccionado(producto.id)}
                  >
                    {producto.nombre}
                  </button>
                ))}
              </div>
            </div>
          )}

          {productoSeleccionado && (
            <button className="btn-submit" onClick={handleProductoSeleccionado}>
              ✅ Confirmar Visita
            </button>
          )}
        </div>
      ) : mostrarFinalizarForm ? (
        /* -------- Finalizar Visita Form -------- */
        <div className="finalizar-section">
          <h2>✅ Finalizar Visita</h2>

          <div className="resumen">
            <h3>📋 Resumen de la Visita</h3>
            <p><strong>Cadena:</strong> {cadenas.find((c) => c.id === cadenaSeleccionada)?.nombre}</p>
            <p><strong>Sucursal:</strong> {sucursales.find((s) => s.id === sucursalSeleccionada)?.nombre}</p>
            <p><strong>Marca:</strong> {marcas.find((m) => m.id === marcaSeleccionada)?.nombre}</p>
            <p><strong>Producto:</strong> {productos.find((p) => p.id === productoSeleccionado)?.nombre}</p>
            <p><strong>Fotos subidas:</strong> {fotos.length} 📸</p>
          </div>

          <div className="form-finalizar">
            <div className="form-group">
              <label>👤 Tu nombre (mercaderista) *</label>
              <input
                type="text"
                placeholder="Ej: Juan Pérez"
                value={usuarioNombre}
                onChange={(e) => setUsuarioNombre(e.target.value)}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>💬 Nombre del grupo de WhatsApp</label>
              <input
                type="text"
                placeholder="Ej: Mercaderistas Gondola"
                value={grupoWhatsapp}
                onChange={(e) => setGrupoWhatsapp(e.target.value)}
                className="form-input"
              />
              <small className="form-hint">
                WhatsApp se abrirá y deberás buscar y seleccionar el grupo manualmente.
              </small>
            </div>

            <div className="form-group">
              <label>📝 Observaciones</label>
              <textarea
                placeholder="Describe cualquier observación relevante de la visita..."
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                className="form-textarea"
                rows={4}
              />
            </div>

            <div className="preview-mensaje">
              <h4>👁️ Vista previa del mensaje:</h4>
              <pre className="mensaje-preview">{generarMensajeWhatsApp()}</pre>
            </div>

            <div className="botones-finalizar">
              <button
                className="btn-secondary"
                onClick={() => setMostrarFinalizarForm(false)}
              >
                ← Volver
              </button>
              <button
                className="btn-whatsapp"
                onClick={handleEnviarWhatsApp}
                disabled={enviando}
              >
                {enviando ? "⏳ Enviando..." : "📲 Enviar por WhatsApp"}
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* -------- Fotos Section -------- */
        <div className="fotos-section">
          <h2>📸 Captura de Fotos</h2>

          <div className="resumen">
            <h3>📋 Visita Registrada</h3>
            <p><strong>Cadena:</strong> {cadenas.find((c) => c.id === cadenaSeleccionada)?.nombre}</p>
            <p><strong>Sucursal:</strong> {sucursales.find((s) => s.id === sucursalSeleccionada)?.nombre}</p>
            <p><strong>Marca:</strong> {marcas.find((m) => m.id === marcaSeleccionada)?.nombre}</p>
            <p><strong>Producto:</strong> {productos.find((p) => p.id === productoSeleccionado)?.nombre}</p>
          </div>

          {editandoFoto ? (
            <div className="editor-section">
              <h3>✏️ Edita tu Foto</h3>
              <p className="info-text">
                Marca las áreas: primero la GÓNDOLA (rojo) y luego el PRODUCTO (verde)
              </p>

              <div className="herramientas">
                <button
                  className={`herr-btn ${herramienta === "gondola" ? "active" : ""}`}
                  onClick={() => setHerramienta("gondola")}
                >
                  🔴 Marcar Góndola
                </button>
                <button
                  className={`herr-btn ${herramienta === "producto" ? "active" : ""}`}
                  onClick={() => setHerramienta("producto")}
                >
                  🟢 Marcar Producto
                </button>
              </div>

              <div className="areas-info">
                <p>
                  <strong>Áreas marcadas:</strong> {areas.length}
                  {areas.map((area, idx) => (
                    <span key={idx} className={`area-badge ${area.tipo}`}>
                      {area.tipo === "gondola" ? "🔴 Góndola" : "🟢 Producto"}
                    </span>
                  ))}
                </p>
              </div>

              <canvas
                ref={canvasRef}
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                onMouseLeave={handleCanvasMouseUp}
                onTouchStart={handleCanvasMouseDown}
                onTouchMove={handleCanvasMouseMove}
                onTouchEnd={handleCanvasMouseUp}
                className="canvas-editor"
                style={{ cursor: isDrawing ? "grabbing" : "crosshair", touchAction: "none" }}
              />

              <div className="botones-editor">
                <button className="btn-limpiar" onClick={handleLimpiarUltima}>
                  ↶ Deshacer
                </button>
                <button className="btn-limpiar" onClick={handleLimpiarTodo}>
                  🗑️ Limpiar Todo
                </button>
                <button className="btn-cancel" onClick={() => setEditandoFoto(false)}>
                  ❌ Cancelar
                </button>
                <button
                  className="btn-upload"
                  onClick={handleSubirFoto}
                  disabled={areas.length === 0}
                >
                  ✅ Guardar Foto
                </button>
              </div>
            </div>
          ) : (
            <div className="upload-section">
              <h3>📷 Sube una Foto</h3>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleArchivoChange}
                className="file-input"
              />
            </div>
          )}

          {fotos.length > 0 && (
            <div className="galeria">
              <h3>📷 Fotos Capturadas ({fotos.length})</h3>
              <div className="fotos-grid">
                {fotos.map((foto) => (
                  <div key={foto.id} className="foto-card">
                    {foto.url ? (
                      <img src={foto.url} alt="Foto gondola" className="foto-thumb" />
                    ) : (
                      <div className="foto-placeholder">📸</div>
                    )}
                    <small>#{foto.id}</small>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="botones-acciones">
            <button className="btn-secondary" onClick={handleReiniciar}>
              🔄 Nueva Visita
            </button>
            <button className="btn-finish" onClick={handleAbrirFinalizarForm}>
              ✅ Finalizar Visita
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
