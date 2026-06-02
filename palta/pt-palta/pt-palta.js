(() => {

  const CARTILLA_ESPERADA = "PTCP";
  const COLUMNAS_PERMITIDAS = 119;
  const COL_FECHA_COSECHA = 53;   /* Excel 54 */
  const COL_FECHA_EMBALAJE = 54; /* Excel 55 */

  const COLUMNAS_FRONT = [
    0, 3, 4, 6, 9, 10, 27, 33, 37, 38, 51, 53, 54, 55, 60, 65, 69, 70, 71, 72,
    "E_C"
  ];

  const COLS_OBLIG_74_119 = Array.from({ length: 46 }, (_, i) => i + 73);

  /** Orden de exportación (Excel 1-based → índice 0-based en fila) */
  const EXPORT_ORDEN_COLUMNAS = [
    1, 4, 5, 10, 11, 12, 52, 28, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 72,
    46, 47, 48, 49, 50, 51, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69,
    53, 70, 71, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91,
    92, 93, 95, 94, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110,
    111, 112, 113, 114, 115, 116, 118, 117, 119
  ].map(n => n - 1);

  /** Excel 1-based: texto forzado al exportar (el resto numérico si aplica) */
  const EXPORT_COLUMNAS_TEXTO = new Set([1, 4, 5, 10, 34, 54, 55, 73]);

  const fileInput = document.getElementById("filePTPalta");
  const embalajeDateSelect = document.getElementById("embalajeDatePTPalta");
  const cosechaDateSelect = document.getElementById("cosechaDatePTPalta");
  const runBtn = document.getElementById("runReviewPTPalta");
  const exportBtn = document.getElementById("exportPTPalta");
  const clearBtn = document.getElementById("clearPTPalta");
  const headerRow = document.getElementById("resultsHeaderPTPalta");
  const bodyRows = document.getElementById("resultsBodyPTPalta");
  const totalFilasDiv = document.getElementById("totalFilasPTPalta");
  const containerBuscador = document.getElementById("containerBuscadorPTPalta");
  const inputBusqueda = document.getElementById("inputBusquedaPTPalta");

  let headers = [];
  let dataRows = [];
  let filasVistaActual = [];
  let nextGroupId = 1;
  const selectedRowIndexes = new Set();
  let ordenSeleccion = [];
  let ultimoCheckIndex = null;

  const COLOR_VERDE = "linear-gradient(to right,#afd8af,#afd8af)";
  const COLOR_NARANJA = "linear-gradient(to right,#ff9900,#ffcc66)";

  const getFechaExcel = v => {
    if (v === null || v === undefined || v === "") return "";
    if (typeof v === "number") {
      const d = new Date(Math.round((v - 25569) * 86400 * 1000));
      return `${String(d.getUTCDate()).padStart(2, "0")}/${String(d.getUTCMonth() + 1).padStart(2, "0")}/${d.getUTCFullYear()}`;
    }
    return String(v).trim();
  };

  function valorCelda(val) {
    if (val === null || val === undefined) return "";
    if (typeof val === "object" && val !== null) {
      if ("w" in val && val.w != null && String(val.w).trim() !== "") return String(val.w);
      if ("v" in val && val.v !== undefined && val.v !== null && val.v !== "") return String(val.v);
    }
    return String(val);
  }

  function celdaVacia(val) {
    return valorCelda(val).trim() === "";
  }

  function normUpper(val) {
    return valorCelda(val).trim().toUpperCase();
  }

  /** Etapa/Campo - Variedad desde trazabilidad (Excel: =EXTRAE(...;6;1)&"/"&EXTRAE(...;7;1)&" - "&SI(...)) */
  function derivarEtapaCampo(codigo) {
    const s = normUpper(codigo);
    if (s.length < 10) return "";
    const etapa = s.charAt(5);
    const campo = s.charAt(6);
    const varCode = s.substring(8, 10);
    const varName = varCode === "01" ? "HASS" : varCode;
    return `${etapa}/${campo} - ${varName}`;
  }

  function julianoDesdeFecha(val) {
    const f = getFechaExcel(val);
    if (!f) return null;
    const p = f.split("/");
    if (p.length !== 3) return null;
    const [dd, mm, yyyy] = p.map(Number);
    const fechaObj = new Date(yyyy, mm - 1, dd);
    const start = new Date(yyyy, 0, 0);
    const diff = fechaObj - start;
    const oneDay = 1000 * 60 * 60 * 24;
    return String(Math.floor(diff / oneDay)).padStart(3, "0");
  }

  function trazabilidadConectaEmbalaje(traz, fechaEmb) {
    const t = normUpper(traz);
    if (t.length < 3) return false;
    const suf = t.slice(-3);
    const jul = julianoDesdeFecha(fechaEmb);
    return jul !== null && suf === jul;
  }

  function validarHoraInspeccion(val) {
    const s = valorCelda(val).trim();
    if (!s) return false;
    const m = s.match(/^(\d{1,2}):(\d{2})$/);
    if (!m) return false;
    const h = m[1];
    const min = parseInt(m[2], 10);
    if (h.length === 1) return false;
    const hi = parseInt(h, 10);
    if (hi < 0 || hi > 23 || min < 0 || min > 59) return false;
    if (h.length === 2 && h[0] === "0") return true;
    if (h.length === 2 && hi >= 10) return true;
    return false;
  }

  function compararFechasISO(a, b) {
    const pa = parseFechaISO(a);
    const pb = parseFechaISO(b);
    if (!pa || !pb) return null;
    return pa <= pb;
  }

  function parseFechaISO(val) {
    const f = getFechaExcel(val);
    if (!f) return null;
    const p = f.split("/");
    if (p.length !== 3) return null;
    const [dd, mm, yyyy] = p;
    return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
  }

  function filasFiltradasPorFechas() {
    const emb = embalajeDateSelect.value;
    if (!emb) return [];
    return dataRows.filter(r => getFechaExcel(r[COL_FECHA_EMBALAJE]) === emb);
  }

  const COLORES_MARCA = ["afd8af", "ff9900", "ffcc66"];

  function filaDatosTabla(idx) {
    return filasVistaActual[idx] ?? null;
  }

  function filaTieneColorVisible(tr) {
    if (!tr) return false;
    const inline = (tr.style.backgroundImage || tr.style.background || "").toLowerCase();
    if (COLORES_MARCA.some(c => inline.includes(c))) return true;
    if (tr.classList.contains("pt-row-grupo-verde") || tr.classList.contains("pt-row-grupo-naranja") || tr.classList.contains("pt-row-grouped")) return true;
    try {
      const cs = getComputedStyle(tr);
      const comp = (cs.backgroundImage || cs.backgroundColor || "").toLowerCase();
      return COLORES_MARCA.some(c => comp.includes(c));
    } catch {
      return false;
    }
  }

  function filaGrupoActivoEnDom(r, tr) {
    return !!(r?.__groupId && tr && tr.classList.contains("pt-row-grouped"));
  }

  /** Fila que ya pertenece a un bloque agrupado (no se puede mezclar en otro grupo). */
  function filaBloqueadaEnGrupo(r, tr) {
    return filaGrupoActivoEnDom(r, tr);
  }

  /** Fila blanca elegible para marcar y crear un grupo nuevo. */
  function filaPuedeSeleccionarseLibre(r, tr) {
    if (!r) return false;
    if (filaBloqueadaEnGrupo(r, tr)) return false;
    if (r.__groupId) repararGrupoResidualEnFila(tr, r);
    return !r.__groupId;
  }

  function repararGrupoResidualEnFila(tr, r) {
    if (!r?.__groupId || filaGrupoActivoEnDom(r, tr)) return;
    delete r.__groupId;
    delete r.__color;
    delete r.__ordenGrupo;
    if (tr) {
      limpiarEstilosGrupoDeFila(tr);
      limpiarCeldasGrupoDeFila(tr);
      tr.classList.remove("pt-row-check-grupo", "pt-row-last-check");
      repintarCeldasFila(tr, r);
    }
  }

  function ordenarIndicesSeleccion(indices) {
    const set = new Set(indices);
    const ordenados = ordenSeleccion.filter(i => set.has(i));
    indices.forEach(i => {
      if (!ordenados.includes(i)) ordenados.push(i);
    });
    return ordenados;
  }

  function validarIndicesParaAgrupar(candidatos) {
    let indicesCandidatos = [];
    if (Array.isArray(candidatos) && candidatos.length) {
      indicesCandidatos = [...candidatos];
    } else if (ordenSeleccion.length) {
      ordenSeleccion.forEach(idx => {
        const r = filaDatosTabla(idx);
        const tr = bodyRows.querySelector(`tr[data-row-index="${idx}"]`);
        if (!tr || !filaVisibleEnDom(tr)) return;
        const cb = tr.querySelector(".pt-row-sel-cb");
        if (!cb?.checked) return;
        if (!filaPuedeSeleccionarseLibre(r, tr)) return;
        indicesCandidatos.push(idx);
      });
      bodyRows.querySelectorAll("tr").forEach(tr => {
        if (!filaVisibleEnDom(tr)) return;
        const cb = tr.querySelector(".pt-row-sel-cb");
        if (!cb?.checked) return;
        const idx = parseInt(tr.dataset.rowIndex, 10);
        if (Number.isNaN(idx) || indicesCandidatos.includes(idx)) return;
        const r = filaDatosTabla(idx);
        if (!filaPuedeSeleccionarseLibre(r, tr)) return;
        indicesCandidatos.push(idx);
      });
    } else {
      bodyRows.querySelectorAll("tr").forEach(tr => {
        if (!filaVisibleEnDom(tr)) return;
        const cb = tr.querySelector(".pt-row-sel-cb");
        if (!cb?.checked) return;
        const idx = parseInt(tr.dataset.rowIndex, 10);
        if (!Number.isNaN(idx)) indicesCandidatos.push(idx);
      });
    }
    const indices = [];
    indicesCandidatos.forEach(idx => {
      if (Number.isNaN(idx)) return;
      const r = filaDatosTabla(idx);
      const tr = bodyRows.querySelector(`tr[data-row-index="${idx}"]`);
      if (!tr || !filaVisibleEnDom(tr)) return;
      const cb = tr.querySelector(".pt-row-sel-cb");
      if (!cb?.checked) return;
      if (!filaPuedeSeleccionarseLibre(r, tr)) return;
      if (!indices.includes(idx)) indices.push(idx);
    });
    return ordenarIndicesSeleccion(indices);
  }

  function limpiarEstadoGrupoEnFila(idx) {
    const r = filaDatosTabla(idx);
    if (!r) return;
    delete r.__groupId;
    delete r.__color;
    delete r.__ordenGrupo;
    const tr = bodyRows.querySelector(`tr[data-row-index="${idx}"]`);
    if (tr) {
      limpiarEstilosGrupoDeFila(tr);
      limpiarCeldasGrupoDeFila(tr);
      tr.classList.remove("pt-row-last-check", "pt-row-check-grupo");
      tr.title = "";
      const cb = tr.querySelector(".pt-row-sel-cb");
      if (cb) {
        cb.disabled = false;
        cb.checked = false;
      }
      repintarCeldasFila(tr, r);
      pintarFila(tr, r);
    }
    selectedRowIndexes.delete(idx);
  }

  function filaMarcadaConColor(r) {
    return !!(r && (r.__color || r.__groupId));
  }

  function filaEstaMarcada(r, tr) {
    if (filaMarcadaConColor(r)) return true;
    if (!tr) return false;
    return filaTieneColorVisible(tr);
  }

  function sincronizarMarcaFilaDesdeDom(tr, r) {
    if (!tr) return;
    if (!r) r = filaDatosTabla(parseInt(tr.dataset.rowIndex, 10));
    if (!r || r.__color || r.__groupId || r.__duplicado) return;
    const bg = tr.style.backgroundImage || tr.style.background;
    if (bg && filaTieneColorVisible(tr)) r.__color = bg;
    else if (tr.classList.contains("pt-row-grupo-verde") || tr.classList.contains("pt-row-grupo-naranja") || tr.classList.contains("pt-row-grouped")) {
      r.__color = COLOR_VERDE;
    }
  }

  function sincronizarMarcasDesdeDom() {
    bodyRows.querySelectorAll("tr").forEach(tr => {
      if (!filaVisibleEnDom(tr)) return;
      sincronizarMarcaFilaDesdeDom(tr, filaDatosTabla(parseInt(tr.dataset.rowIndex, 10)));
    });
  }

  function hayFilasMarcadasEnTabla() {
    sincronizarMarcasDesdeDom();
    if (filasVistaActual.some(r => filaMarcadaConColor(r))) return true;
    return [...bodyRows.querySelectorAll("tr")].some(
      tr => tr.style.display !== "none" && filaTieneColorVisible(tr)
    );
  }

  function contarFilasMarcadasVisibles() {
    let n = 0;
    bodyRows.querySelectorAll("tr").forEach(tr => {
      if (!filaVisibleEnDom(tr)) return;
      const idx = parseInt(tr.dataset.rowIndex, 10);
      if (filaEstaMarcada(filaDatosTabla(idx), tr)) n++;
    });
    return n;
  }

  function aplicarEstadoCheckFila(tr, r) {
    const cb = tr.querySelector(".pt-row-sel-cb");
    if (!cb) return;
    const idx = parseInt(tr.dataset.rowIndex, 10);
    if (!r) r = filaDatosTabla(idx);
    repararGrupoResidualEnFila(tr, r);
    if (filaBloqueadaEnGrupo(r, tr)) {
      cb.checked = true;
      cb.disabled = true;
      selectedRowIndexes.add(idx);
      cb.title = `Grupo ${r.__groupId} — desagrupa para volver a seleccionar`;
      tr.classList.add("pt-row-check-grupo");
    } else {
      cb.disabled = false;
      tr.classList.remove("pt-row-check-grupo");
      cb.checked = selectedRowIndexes.has(idx);
      const marcada = filaEstaMarcada(r, tr);
      cb.title = marcada ? "Fila con color — marcar para desagrupar" : "Seleccionar fila";
    }
  }

  function indicesGruposActivosEnTabla() {
    const out = [];
    filasVistaActual.forEach((row, i) => {
      if (!row.__groupId) return;
      const tr = bodyRows.querySelector(`tr[data-row-index="${i}"]`);
      if (filaGrupoActivoEnDom(row, tr)) out.push(i);
    });
    return out;
  }

  function indicesSeleccionLibresEnTabla() {
    return validarIndicesParaAgrupar(null);
  }

  function contarChecksEnGruposActivos() {
    let n = 0;
    bodyRows.querySelectorAll("tr").forEach(tr => {
      if (!filaVisibleEnDom(tr)) return;
      const cb = tr.querySelector(".pt-row-sel-cb");
      if (!cb?.checked) return;
      const r = filaDatosTabla(parseInt(tr.dataset.rowIndex, 10));
      if (filaBloqueadaEnGrupo(r, tr)) n++;
    });
    return n;
  }

  function sincronizarChecksFilasEnGrupo() {
    const indicesGrupo = indicesGruposActivosEnTabla();
    indicesGrupo.forEach(i => selectedRowIndexes.add(i));
    ordenSeleccion = ordenSeleccion.filter(i => {
      const row = filaDatosTabla(i);
      const tr = bodyRows.querySelector(`tr[data-row-index="${i}"]`);
      return row && !filaBloqueadaEnGrupo(row, tr);
    });
    bodyRows.querySelectorAll("tr").forEach(tr => {
      aplicarEstadoCheckFila(tr, filaDatosTabla(parseInt(tr.dataset.rowIndex, 10)));
    });
    const libresSel = ordenSeleccion.filter(i => {
      const row = filaDatosTabla(i);
      const tr = bodyRows.querySelector(`tr[data-row-index="${i}"]`);
      return row && !filaBloqueadaEnGrupo(row, tr);
    });
    ultimoCheckIndex = libresSel.length ? libresSel[libresSel.length - 1] : null;
    marcarUltimoCheck();
    actualizarNumerosOrden();
  }

  function seleccionLibresVisibleParaMenu() {
    return indicesSeleccionLibresEnTabla();
  }

  function filaVisibleEnDom(tr) {
    return tr && !tr.hidden && !tr.classList.contains("pt-row-filter-hidden") && tr.style.display !== "none";
  }

  function claseGrupoDesdeColor(colorStr) {
    if (!colorStr) return null;
    const c = String(colorStr).toLowerCase();
    if (c.includes("afd8af")) return "pt-row-grupo-verde";
    if (c.includes("ff9900") || c.includes("ffcc66")) return "pt-row-grupo-naranja";
    return null;
  }

  function limpiarEstilosGrupoDeFila(tr) {
    tr.style.background = "";
    tr.style.backgroundImage = "";
    tr.classList.remove(
      "pt-row-grouped", "pt-row-grupo-verde", "pt-row-grupo-naranja", "pt-row-duplicado"
    );
  }

  function limpiarCeldasGrupoDeFila(tr) {
    tr.querySelectorAll("td").forEach(td => {
      td.style.background = "";
      td.style.backgroundColor = "";
    });
  }

  function limpiarFondoFila(tr) {
    limpiarEstilosGrupoDeFila(tr);
    limpiarCeldasGrupoDeFila(tr);
  }

  function repintarCeldasFila(tr, r) {
    if (!tr || !r) return;
    const ext = { E_C: derivarEtapaCampo(r[72]) };
    const loteDup = !!r.__duplicado;
    tr.querySelectorAll("td[data-col-key]").forEach(td => {
      const col = colKeyToColumn(td.dataset.colKey);
      if (col === null) return;
      td.style.background = "";
      td.style.backgroundColor = "";
      td.style.color = "";
      td.style.fontWeight = "";
      td.title = "";
      pintarCelda(td, col, r, ext, loteDup);
    });
  }

  function aplicarEstiloGrupoEnFila(tr, r) {
    if (!r?.__groupId || !r.__color) return;
    const cls = claseGrupoDesdeColor(r.__color);
    if (cls) tr.classList.add(cls);
    tr.classList.add("pt-row-grouped");
    tr.classList.remove("pt-row-last-check");
  }

  function aplicarEstiloDuplicadoEnFila(tr, r) {
    if (!r?.__duplicado) return;
    tr.classList.add("pt-row-duplicado");
    tr.querySelectorAll("td").forEach(td => { td.style.backgroundColor = "#ffcccc"; });
    const loteTd = tr.querySelector('td[data-col-key="9"]');
    if (loteTd) {
      loteTd.style.background = "linear-gradient(to right, #ffcccc, #ff9999)";
    }
  }

  function ordenSeleccionSoloLibres() {
    return ordenSeleccion.filter(i => {
      const r = filaDatosTabla(i);
      const tr = bodyRows.querySelector(`tr[data-row-index="${i}"]`);
      return r && !filaBloqueadaEnGrupo(r, tr);
    });
  }

  function libresParaAgruparOrdenados() {
    return indicesSeleccionLibresEnTabla();
  }

  function indicesGrupoEnOrden(gid) {
    const items = [];
    filasVistaActual.forEach((row, i) => {
      if (row.__groupId !== gid) return;
      const tr = bodyRows.querySelector(`tr[data-row-index="${i}"]`);
      if (!filaGrupoActivoEnDom(row, tr)) return;
      items.push({ i, ord: row.__ordenGrupo ?? i });
    });
    items.sort((a, b) => (a.ord !== b.ord ? a.ord - b.ord : a.i - b.i));
    return items.map(x => x.i);
  }

  function actualizarNumerosOrden() {
    const ordenPorGrupo = {};
    const gids = new Set();
    filasVistaActual.forEach(row => {
      if (row.__groupId) gids.add(row.__groupId);
    });
    gids.forEach(gid => {
      ordenPorGrupo[gid] = indicesGrupoEnOrden(gid);
    });
    const libresOrden = libresParaAgruparOrdenados();

    bodyRows.querySelectorAll("tr").forEach(tr => {
      const badge = tr.querySelector(".pt-sel-orden");
      if (!badge) return;
      if (!filaVisibleEnDom(tr)) {
        badge.textContent = "";
        badge.classList.remove("pt-sel-orden-visible", "pt-sel-orden-grupo");
        return;
      }
      const idx = parseInt(tr.dataset.rowIndex, 10);
      const r = filaDatosTabla(idx);
      let pos = -1;
      let etiqueta = "";
      if (filaBloqueadaEnGrupo(r, tr) && ordenPorGrupo[r.__groupId]) {
        pos = ordenPorGrupo[r.__groupId].indexOf(idx);
        etiqueta = pos >= 0 ? `G${r.__groupId}·${pos + 1}` : "";
      } else if (libresOrden.includes(idx)) {
        pos = libresOrden.indexOf(idx);
        etiqueta = pos >= 0 ? String(pos + 1) : "";
      }
      if (etiqueta) {
        badge.textContent = etiqueta;
        badge.classList.add("pt-sel-orden-visible");
        if (filaBloqueadaEnGrupo(r, tr)) badge.classList.add("pt-sel-orden-grupo");
        else badge.classList.remove("pt-sel-orden-grupo");
      } else {
        badge.classList.remove("pt-sel-orden-grupo");
        badge.textContent = "";
        badge.classList.remove("pt-sel-orden-visible");
      }
    });
  }

  function indicesSeleccionados() {
    return [...selectedRowIndexes].sort((a, b) => a - b);
  }

  function sincronizarChecksDesdeDom(opciones = {}) {
    const preservarOrden = opciones.preservarOrden === true;
    const actualizarUi = opciones.actualizarUi !== false;

    const libresDom = indicesSeleccionLibresEnTabla();
    const enGrupo = indicesGruposActivosEnTabla();

    selectedRowIndexes.clear();
    enGrupo.forEach(i => selectedRowIndexes.add(i));
    libresDom.forEach(i => selectedRowIndexes.add(i));

    if (preservarOrden) {
      const setLibres = new Set(libresDom);
      ordenSeleccion = ordenSeleccion.filter(i => setLibres.has(i));
      libresDom.forEach(i => {
        if (!ordenSeleccion.includes(i)) ordenSeleccion.push(i);
      });
    } else {
      const prev = ordenSeleccion.filter(i => libresDom.includes(i));
      ordenSeleccion = [...prev];
      libresDom.forEach(i => {
        if (!ordenSeleccion.includes(i)) ordenSeleccion.push(i);
      });
    }

    if (actualizarUi) {
      const libresSel = ordenSeleccionSoloLibres();
      ultimoCheckIndex = libresSel.length ? libresSel[libresSel.length - 1] : null;
      marcarUltimoCheck();
    }
    return libresDom;
  }

  function limpiarSeleccionChecks() {
    const enGrupo = new Set(indicesGruposActivosEnTabla());
    selectedRowIndexes.forEach(i => { if (!enGrupo.has(i)) selectedRowIndexes.delete(i); });
    ordenSeleccion = [];
    bodyRows.querySelectorAll("tr").forEach(tr => {
      const idx = parseInt(tr.dataset.rowIndex, 10);
      const r = filaDatosTabla(idx);
      if (filaBloqueadaEnGrupo(r, tr)) return;
      const cb = tr.querySelector(".pt-row-sel-cb");
      if (cb) cb.checked = false;
      tr.classList.remove("pt-row-last-check", "pt-row-check-grupo");
    });
    ultimoCheckIndex = null;
    marcarUltimoCheck();
    actualizarNumerosOrden();
  }

  /** Al cambiar fecha embalaje: cero checks visibles y sin numeración 1,2,3… */
  function reiniciarSeleccionPorCambioEmbalaje() {
    selectedRowIndexes.clear();
    ordenSeleccion = [];
    ultimoCheckIndex = null;
    bodyRows.querySelectorAll("tr").forEach(tr => {
      tr.classList.remove("pt-row-last-check", "pt-row-check-grupo");
      const cb = tr.querySelector(".pt-row-sel-cb");
      if (cb) {
        cb.checked = false;
        cb.disabled = false;
        cb.title = "Seleccionar fila";
      }
      const badge = tr.querySelector(".pt-sel-orden");
      if (badge) {
        badge.textContent = "";
        badge.classList.remove("pt-sel-orden-visible", "pt-sel-orden-grupo");
      }
    });
  }

  function refrescarEstadoChecksGrupo() {
    bodyRows.querySelectorAll("tr").forEach(tr => {
      aplicarEstadoCheckFila(tr, filaDatosTabla(parseInt(tr.dataset.rowIndex, 10)));
    });
    actualizarNumerosOrden();
  }

  function marcarUltimoCheck() {
    bodyRows.querySelectorAll("tr.pt-row-last-check").forEach(tr => tr.classList.remove("pt-row-last-check"));
    if (ultimoCheckIndex === null) return;
    const r = filaDatosTabla(ultimoCheckIndex);
    const tr = bodyRows.querySelector(`tr[data-row-index="${ultimoCheckIndex}"]`);
    if (!r || filaBloqueadaEnGrupo(r, tr)) {
      ultimoCheckIndex = null;
      return;
    }
    if (tr && filaVisibleEnDom(tr)) tr.classList.add("pt-row-last-check");
  }

  function toggleSeleccionFila(rowIndex, checked) {
    const r = filaDatosTabla(rowIndex);
    const tr = bodyRows.querySelector(`tr[data-row-index="${rowIndex}"]`);
    if (checked) {
      if (filaBloqueadaEnGrupo(r, tr)) return true;
      if (!filaPuedeSeleccionarseLibre(r, tr)) return false;
      selectedRowIndexes.add(rowIndex);
      if (!ordenSeleccion.includes(rowIndex)) ordenSeleccion.push(rowIndex);
      ultimoCheckIndex = rowIndex;
    } else {
      if (filaBloqueadaEnGrupo(r, tr)) return true;
      selectedRowIndexes.delete(rowIndex);
      ordenSeleccion = ordenSeleccion.filter(i => i !== rowIndex);
      const libres = ordenSeleccionSoloLibres();
      ultimoCheckIndex = libres.length ? libres[libres.length - 1] : null;
    }
    marcarUltimoCheck();
    actualizarNumerosOrden();
    return true;
  }

  function pintarFila(tr, r) {
    const teniaEstiloGrupo = tr.classList.contains("pt-row-grouped")
      || tr.classList.contains("pt-row-grupo-verde")
      || tr.classList.contains("pt-row-grupo-naranja")
      || tr.classList.contains("pt-row-duplicado");
    limpiarEstilosGrupoDeFila(tr);
    if (teniaEstiloGrupo) limpiarCeldasGrupoDeFila(tr);
    if (r.__groupId && r.__color) {
      aplicarEstiloGrupoEnFila(tr, r);
      tr.title = r.__duplicado
        ? `Lote duplicado · Grupo ${r.__groupId}`
        : `Grupo ${r.__groupId}`;
    } else if (r.__color) {
      const cls = claseGrupoDesdeColor(r.__color);
      if (cls) tr.classList.add(cls);
      tr.title = "";
    } else {
      tr.title = r.__duplicado ? "Lote duplicado" : "";
    }
    if (r.__duplicado) aplicarEstiloDuplicadoEnFila(tr, r);
    aplicarEstadoCheckFila(tr, r);
  }

  function reordenarFilasParaGrupo(filas, indicesEnOrdenSeleccion) {
    const ordenSel = [...indicesEnOrdenSeleccion];
    const setSel = new Set(ordenSel);
    const minIdx = Math.min(...ordenSel);
    const picked = ordenSel.map(i => filas[i]);
    const rest = filas.filter((_, i) => !setSel.has(i));
    rest.splice(minIdx, 0, ...picked);
    return rest;
  }

  function persistirOrdenFilasEmbalaje(filas) {
    const emb = embalajeDateSelect.value;
    if (!emb) return;
    dataRows = dataRows.filter(r => getFechaExcel(r[COL_FECHA_EMBALAJE]) !== emb).concat(filas);
    filasVistaActual = filas;
  }

  function sincronizarNextGroupId() {
    let max = 0;
    filasVistaActual.forEach(r => {
      if (r?.__groupId && r.__groupId > max) max = r.__groupId;
    });
    dataRows.forEach(r => {
      if (r?.__groupId && r.__groupId > max) max = r.__groupId;
    });
    nextGroupId = max + 1;
  }

  function agruparSeleccion(color, selPrevia) {
    const sel = validarIndicesParaAgrupar(
      Array.isArray(selPrevia) && selPrevia.length ? selPrevia : null
    );
    const idsGrupo = new Set();
    sel.forEach(i => {
      const row = filaDatosTabla(i);
      if (row?.__groupId) idsGrupo.add(row.__groupId);
    });
    if (idsGrupo.size > 1) {
      Swal.fire({
        icon: "warning",
        title: "Selección inválida",
        text: "No mezcles filas de grupos distintos. Desagrupa o marca solo filas blancas.",
        timer: 2400,
        showConfirmButton: false
      });
      return;
    }

    if (sel.length < 2) {
      const enGrupo = contarChecksEnGruposActivos();
      const msg = enGrupo > 0
        ? "Marca 2+ filas blancas (las de un grupo ya armado no cuentan). Desagrupa si quieres cambiarlas."
        : "Marca al menos 2 filas blancas con ☑";
      Swal.fire({ icon: "info", title: msg, timer: 2200, showConfirmButton: false });
      return;
    }
    const snapVista = clonarEstadoVistaTabla();
    let rows = [...(filasVistaActual.length ? filasVistaActual : filasFiltradasPorFechas())];
    sincronizarNextGroupId();
    const gid = nextGroupId++;
    sel.forEach((idx, pos) => {
      const r = rows[idx];
      if (!r) return;
      r.__groupId = gid;
      r.__color = color;
      r.__ordenGrupo = pos + 1;
    });
    rows = reordenarFilasParaGrupo(rows, sel);
    persistirOrdenFilasEmbalaje(rows);
    ordenSeleccion = [];
    selectedRowIndexes.clear();
    ultimoCheckIndex = null;
    renderCuerpoTabla({ deferirVista: true });
    restaurarEstadoVistaTabla(snapVista);
    aplicarVistaCompletaConReintentos();
    Swal.fire({ icon: "success", title: `Grupo ${gid}`, text: `${sel.length} fila(s) · listo para otro grupo`, timer: 1400, showConfirmButton: false });
  }

  function indicesParaDesagrupar(anchorIdx) {
    if (anchorIdx == null || Number.isNaN(anchorIdx)) return [];
    const r = filaDatosTabla(anchorIdx);
    if (!r) return [];
    if (r.__groupId) {
      return filasVistaActual
        .map((row, i) => (row.__groupId === r.__groupId ? i : -1))
        .filter(i => i >= 0);
    }
    if (filaMarcadaConColor(r)) return [anchorIdx];
    return [];
  }

  function desagruparSeleccion(anchorIdx) {
    const targets = indicesParaDesagrupar(anchorIdx);
    if (!targets.length) return;
    const quitar = new Set(targets);
    ejecutarPreservandoFiltrosColumnas(() => {
      targets.forEach(idx => limpiarEstadoGrupoEnFila(idx));
      ordenSeleccion = ordenSeleccion.filter(i => !quitar.has(i));
      ultimoCheckIndex = null;
      refrescarEstadoChecksGrupo();
      actualizarNumerosOrden();
    });
  }

  function cerrarMenuFila() {
    const menu = document.getElementById("ptRowContextMenuPTPalta");
    if (menu) menu.style.display = "none";
  }

  function cerrarMenuLote() {
    const menu = document.getElementById("ptLoteContextMenuPTPalta");
    if (menu) menu.style.display = "none";
  }

  function abrirMenuCopiarLote(td, e) {
    let menu = document.getElementById("ptLoteContextMenuPTPalta");
    if (!menu) {
      menu = document.createElement("div");
      menu.id = "ptLoteContextMenuPTPalta";
      document.body.appendChild(menu);
      menu.addEventListener("click", ev => {
        const act = ev.target.closest("[data-act]")?.dataset.act;
        if (act !== "copy-lote") return;
        const val = menu.dataset.loteVal || "";
        if (!val) return;
        navigator.clipboard.writeText(val).then(() => {
          Swal.fire({ icon: "success", title: "Lote copiado", text: val, timer: 1200, showConfirmButton: false });
        });
        cerrarMenuLote();
      });
    }
    const texto = (td.textContent || "").trim();
    menu.dataset.loteVal = texto;
    menu.innerHTML = `<div class="ctx-item" data-act="copy-lote">📋 Copiar lote</div>`;
    menu.style.top = `${e.pageY}px`;
    menu.style.left = `${e.pageX}px`;
    menu.style.display = "block";
  }

  function abrirMenuFila(tr, e) {
    let menu = document.getElementById("ptRowContextMenuPTPalta");
    if (!menu) {
      menu = document.createElement("div");
      menu.id = "ptRowContextMenuPTPalta";
      document.body.appendChild(menu);
      menu.addEventListener("click", ev => {
        const item = ev.target.closest("[data-act]");
        if (!item || item.classList.contains("pt-ctx-disabled")) return;
        const act = item.dataset.act;
        let selGuardada = [];
        try {
          selGuardada = JSON.parse(menu.dataset.selJson || "[]");
        } catch { selGuardada = []; }
        if (act === "grp-green") agruparSeleccion(COLOR_VERDE, selGuardada);
        if (act === "grp-orange") agruparSeleccion(COLOR_NARANJA, selGuardada);
        if (act === "grp-clear") {
          const aid = menu.dataset.anchorIdx != null ? parseInt(menu.dataset.anchorIdx, 10) : null;
          desagruparSeleccion(aid);
        }
        cerrarMenuFila();
      });
    }
    const idx = parseInt(tr.dataset.rowIndex, 10);
    menu.dataset.anchorIdx = String(idx);
    const r = filaDatosTabla(idx);
    const selNueva = seleccionLibresVisibleParaMenu();
    menu.dataset.selJson = JSON.stringify(selNueva);
    const n = selNueva.length;
    const enGrupoBloqueados = contarChecksEnGruposActivos();
    const filaAnchorMarcada = filaEstaMarcada(r, tr);
    const enGrupo = filaBloqueadaEnGrupo(r, tr);
    const puedeAgrupar = n >= 2 && !enGrupo;
    const puedeDesagrupar = enGrupo
      || (filaAnchorMarcada && !r?.__groupId)
      || !!(r?.__color && !enGrupo);
    let hint = "";
    if (enGrupo) {
      hint = `<div class="pt-ctx-hint">Grupo ${r.__groupId} · <b>Desagrupar</b> solo este bloque</div>`;
    } else if (filaAnchorMarcada && !enGrupo) {
      hint = `<div class="pt-ctx-hint">Fila con color · <b>Desagrupar</b> quita el color</div>`;
    } else if (puedeAgrupar) {
      const extra = enGrupoBloqueados > 0
        ? ` · ${enGrupoBloqueados} fila(s) ya en otro grupo no se incluyen`
        : "";
      hint = `<div class="pt-ctx-hint">${n} fila(s) blanca(s) para nuevo grupo${extra}</div>`;
    } else if (!enGrupo) {
      hint = `<div class="pt-ctx-hint">Marca 2+ filas <b>blancas</b> (sin color de grupo) y clic derecho aquí</div>`;
    }
    menu.innerHTML = hint +
      `<div class="ctx-item${puedeAgrupar ? "" : " pt-ctx-disabled"}" data-act="grp-green">🟢 Agrupar (verde)</div>` +
      `<div class="ctx-item${puedeAgrupar ? "" : " pt-ctx-disabled"}" data-act="grp-orange">🟠 Agrupar (naranja)</div>` +
      `<div class="ctx-item${puedeDesagrupar ? "" : " pt-ctx-disabled"}" data-act="grp-clear">✖ Desagrupar / quitar color</div>`;
    menu.style.top = `${e.pageY}px`;
    menu.style.left = `${e.pageX}px`;
    menu.style.display = "block";
  }

  /** Varias fechas mismo mes/año → "28, 29 - 05 - 2026" */
  function formatearFechasCosecha(fechas) {
    if (!fechas.length) return "Auto-Fecha";
    if (fechas.length === 1) return fechas[0];

    const partes = fechas.map(f => {
      const p = f.split("/");
      if (p.length !== 3) return null;
      return { d: parseInt(p[0], 10), m: p[1], y: p[2], raw: f };
    }).filter(Boolean);

    const mismoMesAnio = partes.length > 1 &&
      partes.every(p => p.m === partes[0].m && p.y === partes[0].y);

    if (mismoMesAnio) {
      const dias = partes.map(p => String(p.d)).join(", ");
      return `${dias} - ${partes[0].m} - ${partes[0].y}`;
    }
    return fechas.join(" · ");
  }

  function limpiarVistaTablaPorCambioEmbalaje() {
    reiniciarSeleccionPorCambioEmbalaje();
    cerrarMenuFiltro();
    cerrarMenuFila();
    const menuCol = document.getElementById("customContextMenuPTPalta");
    if (menuCol) menuCol.style.display = "none";
    bodyRows.innerHTML = "";
    headerRow.innerHTML = "";
    filasVistaActual = [];
    Object.keys(activeColumnFilters).forEach(k => { delete activeColumnFilters[k]; });
    columnasOcultas.clear();
    containerBuscador.style.display = "none";
    if (inputBusqueda) inputBusqueda.value = "";
    exportBtn.disabled = true;
    if (totalFilasDiv) totalFilasDiv.textContent = "";
  }

  function syncCosechaDesdeEmbalaje() {
    const emb = embalajeDateSelect.value;
    cosechaDateSelect.value = "Auto-Fecha";
    cosechaDateSelect.dataset.fechas = "";
    cosechaDateSelect.disabled = true;
    cosechaDateSelect.classList.remove("pt-cosecha-error");
    runBtn.disabled = true;

    if (!emb) return;

    const matchingRows = dataRows.filter(r => getFechaExcel(r[COL_FECHA_EMBALAJE]) === emb);
    if (!matchingRows.length) return;

    const fechasCos = [...new Set(
      matchingRows.map(r => getFechaExcel(r[COL_FECHA_COSECHA])).filter(Boolean)
    )].sort((a, b) => {
      const pa = parseFechaISO(a);
      const pb = parseFechaISO(b);
      if (!pa || !pb) return a.localeCompare(b);
      return pa.localeCompare(pb);
    });

    cosechaDateSelect.dataset.fechas = fechasCos.join(",");
    cosechaDateSelect.value = formatearFechasCosecha(fechasCos);
    cosechaDateSelect.disabled = true;
    cosechaDateSelect.classList.remove("pt-cosecha-error");

    const algunaCosechaMayor = fechasCos.some(f => compararFechasISO(f, emb) === false);
    if (algunaCosechaMayor) {
      cosechaDateSelect.classList.add("pt-cosecha-error");
      cosechaDateSelect.title = "Alguna fecha de cosecha es mayor que embalaje";
    } else {
      cosechaDateSelect.title = fechasCos.length
        ? `Fechas de cosecha: ${fechasCos.join(", ")}`
        : "";
    }

    runBtn.disabled = !emb;
  }

  function textoFechasCosecha() {
    const raw = cosechaDateSelect.dataset.fechas || "";
    if (!raw) return "";
    return raw.split(",").filter(Boolean).join(" · ");
  }

  function fechasCosechaLista() {
    const raw = cosechaDateSelect.dataset.fechas || "";
    return raw ? raw.split(",").filter(Boolean) : [];
  }

  function marcarErroresFila(r, loteCounts) {
    r._errs = [];
    const err = (col, msg) => r._errs.push({ col, msg });

    const lote = valorCelda(r[9]).trim();
    if (lote && loteCounts && loteCounts[lote] > 1) err(9, "Lote duplicado");
    const emb = r[54];
    const cosecha = r[53];
    const traz = valorCelda(r[72]).trim();

    if (celdaVacia(r[9])) err(9, "Lote vacío");
    else if (lote.length !== 12) err(9, "Lote debe tener 12 caracteres");

    if (celdaVacia(r[10])) err(10, "Cant. muestra vacía");
    const med = normUpper(r[11]);
    if (celdaVacia(r[11])) err(11, "Med. muestra vacía");
    else if (med !== "UNIDADES") err(11, "Debe decir Unidades");

    if (celdaVacia(r[27])) err(27, "Nota Condición vacía");
    if (celdaVacia(r[33]) || !validarHoraInspeccion(r[33])) err(33, "Hora inválida (ej. 05:10 o 18:20; no 6:30)");

    const seg = normUpper(r[35]);
    if (celdaVacia(r[35])) err(35, "Segregación vacía");
    else if (seg !== "NO") err(35, 'Debe ser "NO"');

    if (celdaVacia(r[37]) || normUpper(r[37]) !== "CUMPLE") err(37, 'Uso materiales: "CUMPLE"');
    if (celdaVacia(r[38]) || normUpper(r[38]) !== "CUMPLE") err(38, 'Rotulación: "CUMPLE"');

    if (celdaVacia(r[51])) err(51, "Destino AVO vacío");

    if (celdaVacia(cosecha)) err(53, "Fecha cosecha vacía");
    if (celdaVacia(emb)) err(54, "Fecha embalaje vacía");
    else if (!celdaVacia(cosecha) && compararFechasISO(cosecha, emb) === false) {
      err(53, "Cosecha debe ser ≤ embalaje");
      err(54, "Embalaje debe ser ≥ cosecha");
    }

    if (celdaVacia(traz)) err(72, "Trazabilidad vacía");
    else if (!trazabilidadConectaEmbalaje(traz, emb)) {
      err(72, "Trazabilidad no conecta con fecha embalaje (últimos 3 dígitos = día juliano)");
      err(54, "Fecha embalaje no coincide con trazabilidad");
    }

    const ec = derivarEtapaCampo(traz);
    if (!ec) err(72, "Trazabilidad incompleta para Etapa/Campo");

    if (celdaVacia(r[55])) err(55, "Formato Avo vacío");
    if (celdaVacia(r[60])) err(60, "Línea vacía");
    if (celdaVacia(r[65])) err(65, "Peso neto vacío");

    const pulpa = parseFloat(String(r[69]).replace(",", "."));
    if (celdaVacia(r[69])) err(69, "Pulpa vacía");
    else if (isNaN(pulpa) || pulpa < 16 || pulpa > 18) err(69, "Pulpa debe ser 16–18");

    if (celdaVacia(r[70])) err(70, "Categoría vacía");
    if (celdaVacia(r[71])) err(71, "Calibre Avo vacío");

    COLS_OBLIG_74_119.forEach(i => {
      if (celdaVacia(r[i])) err(i, `Columna ${i + 1} obligatoria`);
    });
  }

  function etiquetaColumna(c) {
    if (c === "E_C") return "Etapa/Campo";
    if (c === 0) return headers[0] || "Usuario";
    if (c === 3) return headers[3] || "F. Insp.";
    if (c === 27) return "Nota C.";
    if (c === 10) return "Cant. M.";
    if (c === 33) return "Hora Insp.";
    if (c === 54) return "F. Embalaje";
    if (c === 53) return "F. Cosecha";
    if (typeof c === "number") return headers[c] || `Col ${c + 1}`;
    return String(c);
  }

  function valorFiltroCelda(r, c, ext) {
    if (c === "E_C") return normalizarValorFiltro(ext?.E_C ?? derivarEtapaCampo(r[72]) ?? "");
    if (typeof c !== "number") return "";
    if (c === 3 || c === 53 || c === 54) {
      const f = getFechaExcel(r[c]);
      return f ? normalizarValorFiltro(f) : "";
    }
    return normalizarValorFiltro(r[c]);
  }

  /** Mismo criterio en menú, filtro y celdas (4, 4.0, " 4 " → "4") */
  function normalizarValorFiltro(v) {
    if (v === null || v === undefined) return "";
    if (typeof v === "number") {
      if (!Number.isFinite(v)) return "";
      return Number.isInteger(v) ? String(v) : String(v);
    }
    if (typeof v === "object") return normalizarValorFiltro(valorCelda(v));
    const s = String(v).trim();
    if (s === "") return "";
    const n = Number(s.replace(",", "."));
    if (!Number.isNaN(n) && /^-?\d+([.,]\d+)?$/.test(s.replace(/\s/g, ""))) {
      return Number.isInteger(n) ? String(Math.trunc(n)) : String(n);
    }
    return s;
  }

  const VACIO_FILTRO = "(Vacío)";
  const activeColumnFilters = {};
  let filterMenuColKey = null;
  /** Claves de columna ocultas (data-col-key); persiste al re-renderizar cuerpo/agrupar */
  const columnasOcultas = new Set();

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/"/g, "&quot;");
  }

  function valorFiltroDisplay(r, c) {
    const ext = { E_C: derivarEtapaCampo(r[72]) };
    const v = valorFiltroCelda(r, c, ext);
    return v === "" ? VACIO_FILTRO : v;
  }

  function valorPermitidoEnFiltro(v, allowed) {
    if (!allowed || !(allowed instanceof Set)) return false;
    if (allowed.has(v)) return true;
    if (v === VACIO_FILTRO) return false;
    const n = Number(v);
    if (!Number.isNaN(n) && Number.isFinite(n)) {
      const ent = String(Math.trunc(n));
      if (allowed.has(ent)) return true;
      if (allowed.has(String(n))) return true;
    }
    return false;
  }

  function filtroColumnaActivo(key) {
    const allowed = activeColumnFilters[key];
    return allowed instanceof Set && allowed.size > 0;
  }

  function sincronizarIndicadoresFiltroEncabezado() {
    headerRow.querySelectorAll("th[data-col-key]").forEach(th => {
      const key = th.dataset.colKey;
      th.classList.toggle("pt-th-filtered", filtroColumnaActivo(key));
    });
  }

  function preservarVistaFiltros() {
    aplicarVistaCompleta();
  }

  function clonarFiltrosColumnas() {
    const snap = {};
    for (const [k, v] of Object.entries(activeColumnFilters)) {
      if (v instanceof Set) snap[k] = new Set(v);
    }
    return snap;
  }

  function clonarEstadoVistaTabla() {
    return {
      filtros: clonarFiltrosColumnas(),
      columnasOcultas: new Set(columnasOcultas)
    };
  }

  function restaurarFiltrosColumnas(snap) {
    Object.keys(activeColumnFilters).forEach(k => { delete activeColumnFilters[k]; });
    for (const [k, v] of Object.entries(snap)) {
      activeColumnFilters[k] = v;
    }
  }

  function restaurarEstadoVistaTabla(snap) {
    if (!snap) return;
    restaurarFiltrosColumnas(snap.filtros || {});
    columnasOcultas.clear();
    (snap.columnasOcultas || []).forEach(k => columnasOcultas.add(k));
  }

  function aplicarVistaCompleta() {
    aplicarVisibilidadColumnas();
    sincronizarIndicadoresFiltroEncabezado();
    aplicarFiltrosTabla();
  }

  function aplicarVistaCompletaConReintentos() {
    aplicarVistaCompleta();
    requestAnimationFrame(() => {
      aplicarVistaCompleta();
      setTimeout(() => aplicarVistaCompleta(), 0);
    });
  }

  function forzarFiltrosColumnasActivos() {
    aplicarVistaCompleta();
  }

  function aplicarFiltrosColumnasConReintentos() {
    aplicarVistaCompletaConReintentos();
  }

  /** Agrupar/ordenar: conservar filtros y columnas ocultas; reaplicar vista al terminar */
  function ejecutarPreservandoFiltrosColumnas(fn) {
    const snapVista = clonarEstadoVistaTabla();
    fn();
    restaurarEstadoVistaTabla(snapVista);
    aplicarVistaCompletaConReintentos();
  }

  function unicosColumna(c, rows) {
    return [...new Set(rows.map(r => valorFiltroDisplay(r, c)))]
      .sort((a, b) => a.localeCompare(b, "es", { sensitivity: "base" }));
  }

  function cerrarMenuFiltro() {
    const menu = document.getElementById("ptFilterMenuPTPalta");
    if (menu) menu.style.display = "none";
    filterMenuColKey = null;
  }

  function getMenuFiltro() {
    let menu = document.getElementById("ptFilterMenuPTPalta");
    if (menu) return menu;
    menu = document.createElement("div");
    menu.id = "ptFilterMenuPTPalta";
    menu.className = "pt-excel-filter-menu";
    menu.innerHTML = `
      <button type="button" class="pt-fm-item" data-act="sort-az">Ordenar A → Z</button>
      <button type="button" class="pt-fm-item" data-act="sort-za">Ordenar Z → A</button>
      <button type="button" class="pt-fm-item pt-fm-clear" data-act="clear">Borrar filtro</button>
      <div class="pt-fm-search-wrap">
        <input type="text" class="pt-fm-search" placeholder="Buscar" autocomplete="off">
      </div>
      <label class="pt-fm-check pt-fm-all"><input type="checkbox" class="pt-fm-all-cb" checked> (Seleccionar todo)</label>
      <div class="pt-fm-list"></div>
      <div class="pt-fm-actions">
        <button type="button" class="pt-fm-ok">ACEPTAR</button>
        <button type="button" class="pt-fm-cancel">Cancelar</button>
      </div>`;
    document.body.appendChild(menu);

    menu.querySelector(".pt-fm-search").addEventListener("input", e => {
      const q = e.target.value.trim().toLowerCase();
      menu.querySelectorAll(".pt-fm-check[data-val]").forEach(lbl => {
        const t = lbl.dataset.val.toLowerCase();
        lbl.style.display = !q || t.includes(q) ? "" : "none";
      });
    });

    menu.querySelector(".pt-fm-all-cb").addEventListener("change", e => {
      if (menu._filtroSync) return;
      const on = e.target.checked;
      menu.querySelectorAll(".pt-fm-list .pt-fm-val-cb").forEach(cb => { cb.checked = on; });
    });

    menu.querySelector(".pt-fm-ok").addEventListener("click", e => {
      e.stopPropagation();
      if (!filterMenuColKey) return cerrarMenuFiltro();
      const key = filterMenuColKey;
      const checks = [...menu.querySelectorAll(".pt-fm-list .pt-fm-val-cb")];
      const sel = checks.filter(cb => cb.checked).map(cb =>
        cb.value === VACIO_FILTRO ? VACIO_FILTRO : normalizarValorFiltro(cb.value)
      );
      if (sel.length === 0) {
        activeColumnFilters[key] = new Set();
      } else if (!filtroColumnaActivo(key) && sel.length === checks.length) {
        /* Sin filtro previo y todo marcado: no crear filtro (solo Borrar filtro lo quita) */
      } else {
        activeColumnFilters[key] = new Set(sel);
      }
      sincronizarIndicadoresFiltroEncabezado();
      cerrarMenuFiltro();
      aplicarVistaCompleta();
    });

    menu.querySelector(".pt-fm-cancel").addEventListener("click", e => {
      e.stopPropagation();
      cerrarMenuFiltro();
    });

    menu.addEventListener("click", e => {
      const act = e.target.closest("[data-act]")?.dataset.act;
      if (!act || !filterMenuColKey) return;
      const colKey = filterMenuColKey;
      const colIdx = 1 + COLUMNAS_FRONT.findIndex(c => String(c) === colKey);
      if (act === "clear") {
        delete activeColumnFilters[colKey];
        sincronizarIndicadoresFiltroEncabezado();
        cerrarMenuFiltro();
        aplicarVistaCompleta();
        return;
      }
      if (act === "sort-az" || act === "sort-za") {
        const col = colKeyToColumn(colKey);
        if (col === null) return cerrarMenuFiltro();
        const asc = act === "sort-az";
        const filas = filasVistaActual.length ? [...filasVistaActual] : filasFiltradasPorFechas();
        filas.sort((a, b) => {
          const ta = valorFiltroDisplay(a, col);
          const tb = valorFiltroDisplay(b, col);
          const cmp = ta.localeCompare(tb, "es", { sensitivity: "base", numeric: true });
          return asc ? cmp : -cmp;
        });
        ejecutarPreservandoFiltrosColumnas(() => {
          persistirOrdenFilasEmbalaje(filas);
          renderCuerpoTabla({ deferirVista: true });
        });
        cerrarMenuFiltro();
      }
    });

    return menu;
  }

  function abrirMenuFiltro(th, c) {
    const menu = getMenuFiltro();
    const rows = filasVistaActual.length ? filasVistaActual : filasFiltradasPorFechas();
    const key = String(c);
    filterMenuColKey = key;
    const titulo = etiquetaColumna(c);
    const valores = unicosColumna(c, rows);
    const prev = activeColumnFilters[key];
    const filtroActivo = filtroColumnaActivo(key);

    menu.querySelector(".pt-fm-clear").textContent = `Borrar filtro de "${titulo}"`;
    menu.querySelector(".pt-fm-search").value = "";

    const list = menu.querySelector(".pt-fm-list");
    list.innerHTML = valores.map(v => {
      const marcado = !filtroActivo || valorPermitidoEnFiltro(v, prev);
      return `<label class="pt-fm-check" data-val="${escapeHtml(v)}">` +
        `<input type="checkbox" class="pt-fm-val-cb" value="${escapeHtml(v)}" ` +
        `${marcado ? "checked" : ""}> ${escapeHtml(v)}</label>`;
    }).join("");

    const allCb = menu.querySelector(".pt-fm-all-cb");
    const todosMarcados = !filtroActivo || valores.every(v => valorPermitidoEnFiltro(v, prev));
    menu._filtroSync = true;
    allCb.checked = todosMarcados;
    menu._filtroSync = false;

    const rect = th.getBoundingClientRect();
    menu.style.display = "block";
    menu.style.left = `${Math.min(rect.left, window.innerWidth - 240)}px`;
    menu.style.top = `${rect.bottom + 4}px`;
  }

  function colKeyDesdeTh(th) {
    if (!th || th.classList.contains("pt-th-acciones")) return null;
    return th.dataset.colKey || null;
  }

  function aplicarVisibilidadColumnas() {
    headerRow.querySelectorAll("th").forEach(th => {
      if (th.classList.contains("pt-th-acciones")) {
        th.classList.remove("pt-col-oculta");
        th.style.display = "";
        return;
      }
      const key = th.dataset.colKey;
      if (!key) return;
      const oculta = columnasOcultas.has(key);
      th.classList.toggle("pt-col-oculta", oculta);
      th.style.display = oculta ? "none" : "";
    });
    bodyRows.querySelectorAll("tr").forEach(tr => {
      const acc = tr.querySelector("td.pt-acciones-cell");
      if (acc) {
        acc.classList.remove("pt-col-oculta");
        acc.style.display = "";
      }
      tr.querySelectorAll("td[data-col-key]").forEach(td => {
        const key = td.dataset.colKey;
        const oculta = !!(key && columnasOcultas.has(key));
        td.classList.toggle("pt-col-oculta", oculta);
        td.style.display = oculta ? "none" : "";
      });
    });
  }

  function ocultarColumnaPorKey(colKey) {
    if (!colKey) return;
    columnasOcultas.add(colKey);
    aplicarVisibilidadColumnas();
  }

  function mostrarTodasLasColumnas() {
    columnasOcultas.clear();
    aplicarVisibilidadColumnas();
  }

  function crearThConFiltro(c) {
    const th = document.createElement("th");
    const key = String(c);
    th.dataset.colKey = key;
    if (filtroColumnaActivo(key)) th.classList.add("pt-th-filtered");

    const wrap = document.createElement("div");
    wrap.className = "pt-th-filter-wrap";

    const label = document.createElement("span");
    label.className = "pt-th-label";
    label.textContent = etiquetaColumna(c);

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "pt-th-filter-btn";
    btn.title = "Filtrar";
    btn.innerHTML = "▾";
    btn.addEventListener("click", e => {
      e.stopPropagation();
      abrirMenuFiltro(th, c);
    });

    wrap.append(label, btn);
    th.appendChild(wrap);
    return th;
  }

  function colKeyToColumn(key) {
    if (key === "E_C") return "E_C";
    const n = parseInt(key, 10);
    return Number.isNaN(n) ? null : n;
  }

  function filaPasaBusquedaDatos(r, term) {
    if (!term || !r) return true;
    const idText = valorCelda(r[0]).trim().toUpperCase();
    const loteText = valorCelda(r[9]).trim().toUpperCase();
    return idText.includes(term) || loteText.includes(term);
  }

  function filaPasaFiltrosActivos(r, term) {
    if (!r) return false;
    for (const [key, allowed] of Object.entries(activeColumnFilters)) {
      if (!(allowed instanceof Set)) continue;
      const col = colKeyToColumn(key);
      if (col === null) continue;
      if (allowed.size === 0) return false;
      const v = valorFiltroDisplay(r, col);
      if (!valorPermitidoEnFiltro(v, allowed)) return false;
    }
    return filaPasaBusquedaDatos(r, term);
  }

  function aplicarFiltrosTabla() {
    if (!filasVistaActual.length) filasVistaActual = filasFiltradasPorFechas();
    const rows = filasVistaActual;
    const term = (inputBusqueda?.value || "").trim().toUpperCase();
    let visibles = 0;
    const hayFiltroCol = Object.keys(activeColumnFilters).some(k => filtroColumnaActivo(k));

    bodyRows.querySelectorAll("tr").forEach(tr => {
      const idx = parseInt(tr.dataset.rowIndex, 10);
      const r = Number.isNaN(idx) ? null : rows[idx];
      if (!r) {
        tr.classList.add("pt-row-filter-hidden");
        tr.hidden = true;
        tr.style.display = "none";
        return;
      }
      const pasa = filaPasaFiltrosActivos(r, term);
      tr.classList.toggle("pt-row-filter-hidden", !pasa);
      tr.hidden = !pasa;
      tr.style.display = pasa ? "" : "none";
      if (pasa) visibles++;
    });

    if (totalFilasDiv) {
      const emb = embalajeDateSelect.value;
      const cos = textoFechasCosecha();
      totalFilasDiv.textContent = (hayFiltroCol || term)
        ? `${visibles} de ${rows.length} fila(s) · embalaje ${emb} · cosecha ${cos}`
        : `${rows.length} fila(s) · embalaje ${emb} · cosecha ${cos}`;
    }
  }

  function finalizarVistaTabla(opciones = {}) {
    sincronizarChecksFilasEnGrupo();
    if (!opciones.deferirVista) {
      aplicarVistaCompleta();
    }
  }

  function pintarCelda(td, c, r, ext, loteDup) {
    const val = typeof c === "number"
      ? (c === 3 && typeof r[c] === "number" ? getFechaExcel(r[c]) : valorCelda(r[c]))
      : ext[c];

    td.textContent = val ?? "";
    const errs = (r._errs || []).filter(e => e.col === c || (c === "E_C" && e.col === 72));
    const hasErr = errs.length > 0;

    if (hasErr) {
      if (!val) {
        td.style.background = "red";
        td.style.color = "white";
      } else {
        td.style.color = "red";
        td.style.fontWeight = "bold";
      }
      td.title = errs.map(e => e.msg).join("\n");
    }

    if (c === 9 && loteDup) {
      td.style.background = "linear-gradient(to right, #ffcccc, #ff9999)";
      td.title = (td.title ? td.title + "\n" : "") + "Lote duplicado";
    }
    if (c === 9 && val && valorCelda(val).trim().length !== 12 && !hasErr) {
      td.style.color = "red";
    }
    if (c === 11 && !celdaVacia(r[11]) && normUpper(r[11]) !== "UNIDADES") {
      td.style.color = "red";
    }
    if (c === 33 && val && !validarHoraInspeccion(val)) td.style.color = "red";
    if (c === 35 && normUpper(r[35]) !== "NO" && val) td.style.color = "red";
    if ((c === 37 || c === 38) && val && normUpper(r[c]) !== "CUMPLE") td.style.color = "red";
    if (c === 69 && val) {
      const p = parseFloat(String(val).replace(",", "."));
      if (!isNaN(p) && (p < 16 || p > 18)) td.style.color = "red";
    }
    if (c === 72 && val && !trazabilidadConectaEmbalaje(val, r[54])) td.style.color = "red";
    if (c === "E_C" && !val) {
      td.style.background = "red";
      td.style.color = "white";
    }
  }

  fileInput.addEventListener("change", async e => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const sheetData = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });

      const fila4 = sheetData[3] || [];
      const cartilla = normUpper(fila4[8]);
      const estado = normUpper(fila4[13]);

      if (cartilla !== CARTILLA_ESPERADA) {
        Swal.fire("Cartilla incorrecta", `Se espera <b>PTCP</b> (fila 4, col. 9). Encontrado: <b>${cartilla || "—"}</b>`, "error");
        fileInput.value = "";
        return;
      }
      if (estado !== "ENVIADA") {
        Swal.fire("Estado incorrecto", "El archivo debe estar en estado <b>ENVIADA</b> (fila 4, col. 14).", "error");
        fileInput.value = "";
        return;
      }

      sheetData.splice(0, 5);
      if (!sheetData.length) {
        Swal.fire("Sin datos", "No hay filas después de quitar las 5 filas iniciales.", "warning");
        fileInput.value = "";
        return;
      }

      headers = sheetData[0] || [];
      if (headers.length !== COLUMNAS_PERMITIDAS) {
        Swal.fire("Columnas incorrectas", `Se requieren <b>${COLUMNAS_PERMITIDAS}</b> columnas. El archivo tiene <b>${headers.length}</b>.`, "error");
        fileInput.value = "";
        return;
      }

      dataRows = sheetData.slice(1).filter(r => r.some(c => c !== "" && c !== null && c !== undefined));
      dataRows.forEach(r => { r.__cartilla = CARTILLA_ESPERADA; });

      const fechasEmb = [...new Set(dataRows.map(r => getFechaExcel(r[COL_FECHA_EMBALAJE])).filter(Boolean))].sort();

      embalajeDateSelect.innerHTML = `<option value="" disabled selected>Selecciona fecha</option>` +
        fechasEmb.map(f => `<option value="${f}">${f}</option>`).join("");
      embalajeDateSelect.disabled = fechasEmb.length === 0;

      cosechaDateSelect.value = "Auto-Fecha";
      cosechaDateSelect.dataset.fechas = "";
      cosechaDateSelect.disabled = true;
      runBtn.disabled = true;
      exportBtn.disabled = true;

      Swal.fire({
        icon: "success",
        title: "Excel cargado",
        text: `${dataRows.length} fila(s) · ${fechasEmb.length} fecha(s) de embalaje`,
        timer: 2000,
        showConfirmButton: false
      });
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "No se pudo leer el archivo.", "error");
      fileInput.value = "";
    }
  });

  embalajeDateSelect.addEventListener("change", () => {
    const refrescarAuto = bodyRows.querySelectorAll("tr").length > 0;
    limpiarVistaTablaPorCambioEmbalaje();
    syncCosechaDesdeEmbalaje();
    if (refrescarAuto && embalajeDateSelect.value && dataRows.length) {
      renderTabla();
    }
  });

  if (inputBusqueda) {
    inputBusqueda.addEventListener("input", aplicarFiltrosTabla);
  }

  function enlazarDragFilas() {
    let dragIdx = null;
    let dragTr = null;
    bodyRows.querySelectorAll("tr").forEach(tr => {
      tr.addEventListener("dragstart", () => {
        dragTr = tr;
        dragIdx = parseInt(tr.dataset.rowIndex, 10);
        tr.style.opacity = "0.5";
      });
      tr.addEventListener("dragover", e => e.preventDefault());
      tr.addEventListener("drop", e => {
        e.preventDefault();
        if (!dragTr || dragIdx === null) return;
        const dropIdx = parseInt(tr.dataset.rowIndex, 10);
        if (dropIdx === dragIdx) return;
        ejecutarPreservandoFiltrosColumnas(() => {
          const filas = [...filasVistaActual];
          const moved = filas.splice(dragIdx, 1)[0];
          filas.splice(dropIdx, 0, moved);
          persistirOrdenFilasEmbalaje(filas);
          renderCuerpoTabla({ deferirVista: true });
        });
      });
      tr.addEventListener("dragend", () => { tr.style.opacity = "1"; });
    });
  }

  function renderCuerpoTabla(opciones = {}) {
    bodyRows.innerHTML = "";
    if (!filasVistaActual.length) {
      filasVistaActual = filasFiltradasPorFechas();
    }
    const rows = filasVistaActual;

    const loteCounts = {};
    rows.forEach(r => {
      const l = valorCelda(r[9]).trim();
      if (l) loteCounts[l] = (loteCounts[l] || 0) + 1;
    });

    rows.forEach((r, rowIndex) => {
      marcarErroresFila(r, loteCounts);
      const lote = valorCelda(r[9]).trim();
      const loteDup = lote && loteCounts[lote] > 1;
      r.__duplicado = !!loteDup;

      const tr = document.createElement("tr");
      tr.dataset.rowIndex = rowIndex;
      tr.setAttribute("draggable", "true");

      const tdAction = document.createElement("td");
      tdAction.className = "pt-acciones-cell";

      const inner = document.createElement("div");
      inner.className = "pt-acciones-inner";

      const ordenBadge = document.createElement("span");
      ordenBadge.className = "pt-sel-orden";
      ordenBadge.title = "Orden de selección";
      inner.appendChild(ordenBadge);

      const rowCb = document.createElement("input");
      rowCb.type = "checkbox";
      rowCb.className = "pt-row-sel-cb";
      rowCb.checked = selectedRowIndexes.has(rowIndex);
      rowCb.title = "Seleccionar fila";
      rowCb.addEventListener("mousedown", ev => ev.stopPropagation());
      rowCb.addEventListener("click", ev => ev.stopPropagation());
      rowCb.addEventListener("change", () => {
        if (filaBloqueadaEnGrupo(r, tr)) {
          rowCb.checked = true;
          return;
        }
        sincronizarMarcaFilaDesdeDom(tr, r);
        const ok = toggleSeleccionFila(rowIndex, rowCb.checked);
        if (!ok) rowCb.checked = false;
      });
      inner.appendChild(rowCb);

      const dragIcon = document.createElement("span");
      dragIcon.className = "pt-drag-icon";
      dragIcon.innerHTML = "☰";
      dragIcon.title = "Arrastrar fila";
      inner.appendChild(dragIcon);

      const greenBtn = document.createElement("div");
      greenBtn.className = "pt-color-btn pt-color-verde";
      greenBtn.title = "Color verde (solo pintar; agrupar con clic derecho)";
      greenBtn.addEventListener("mousedown", ev => ev.stopPropagation());
      greenBtn.addEventListener("click", ev => {
        ev.stopPropagation();
        if (filaBloqueadaEnGrupo(r, tr)) return;
        delete r.__groupId;
        r.__color = COLOR_VERDE;
        pintarFila(tr, r);
        actualizarNumerosOrden();
      });
      inner.appendChild(greenBtn);

      const orangeBtn = document.createElement("div");
      orangeBtn.className = "pt-color-btn pt-color-naranja";
      orangeBtn.title = "Color naranja (solo pintar; agrupar con clic derecho)";
      orangeBtn.addEventListener("mousedown", ev => ev.stopPropagation());
      orangeBtn.addEventListener("click", ev => {
        ev.stopPropagation();
        if (filaBloqueadaEnGrupo(r, tr)) return;
        delete r.__groupId;
        r.__color = COLOR_NARANJA;
        pintarFila(tr, r);
        actualizarNumerosOrden();
      });
      inner.appendChild(orangeBtn);

      const copyBtn = document.createElement("div");
      copyBtn.className = "pt-wa-btn";
      copyBtn.title = "Copiar errores (WhatsApp)";
      copyBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="white" viewBox="0 0 16 16"><path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.06 3.973L0 16l4.104-1.076a7.863 7.863 0 0 0 3.89.593c4.365 0 7.923-3.559 7.923-7.928a7.858 7.858 0 0 0-2.316-5.563zM7.994 14.52a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z"/></svg>`;
      copyBtn.onclick = () => {
        const inc = (r._errs || []).map(e => `• ${e.msg}`);
        if (!inc.length) return Swal.fire({ icon: "info", title: "Sin errores", timer: 900, showConfirmButton: false });
        const msg = `*PT Palta*\n*ID:* ${r[0]}\n*Lote:* ${r[9]}\n*Incidencias:*\n${inc.join("\n")}\n*Acción: Corregir por favor.*`;
        navigator.clipboard.writeText(msg).then(() => Swal.fire({ icon: "success", title: "Copiado", timer: 1000, showConfirmButton: false }));
      };
      inner.appendChild(copyBtn);

      tdAction.appendChild(inner);
      tr.appendChild(tdAction);

      const ext = { E_C: derivarEtapaCampo(r[72]) };

      COLUMNAS_FRONT.forEach(c => {
        const td = document.createElement("td");
        td.dataset.colKey = String(c);
        pintarCelda(td, c, r, ext, loteDup);
        tr.appendChild(td);
      });

      pintarFila(tr, r);
      bodyRows.appendChild(tr);
    });

    enlazarDragFilas();
    exportBtn.disabled = rows.length === 0;
    finalizarVistaTabla(opciones);
  }

  function renderTabla() {
    reiniciarSeleccionPorCambioEmbalaje();
    containerBuscador.style.display = "flex";
    headerRow.innerHTML = "";
    filasVistaActual = filasFiltradasPorFechas();

    const thAction = document.createElement("th");
    thAction.className = "pt-th-acciones";
    thAction.textContent = "Acciones";
    headerRow.appendChild(thAction);

    COLUMNAS_FRONT.forEach(c => {
      headerRow.appendChild(crearThConFiltro(c));
    });

    renderCuerpoTabla();
  }

  runBtn.addEventListener("click", renderTabla);

  function parseFlexibleNumber(val) {
    const s = valorCelda(val).trim().replace(/\s/g, "").replace(",", ".");
    if (s === "") return NaN;
    const n = Number(s);
    return Number.isFinite(n) ? n : NaN;
  }

  function valorCeldaExportExcel(val, colIdxOrigen) {
    if (val === undefined || val === null || celdaVacia(val)) {
      return undefined;
    }

    const colExcel = colIdxOrigen + 1;
    if (EXPORT_COLUMNAS_TEXTO.has(colExcel)) {
      if (colExcel === 4 || colExcel === 54 || colExcel === 55) {
        return getFechaExcel(val) || valorCelda(val);
      }
      return valorCelda(val);
    }

    if (typeof val === "number" && Number.isFinite(val)) return val;

    const n = parseFlexibleNumber(val);
    if (Number.isFinite(n)) return n;
    return valorCelda(val);
  }

  function encabezadoExportOrdenado() {
    return EXPORT_ORDEN_COLUMNAS.map(idx => headers[idx] || undefined);
  }

  function filaExportOrdenada(r) {
    return EXPORT_ORDEN_COLUMNAS.map(idx => valorCeldaExportExcel(r[idx], idx));
  }

  function colorFillExportFila(r) {
    if (r.__duplicado) return "FFCCCC";
    if (!r.__color) return null;
    const c = String(r.__color).toLowerCase();
    if (c.includes("afd8af")) return "D4EDD4";
    if (c.includes("ff9900") || c.includes("ffcc66")) return "FFE4C4";
    return null;
  }

  /** Todas las filas de la fecha embalaje, orden actual (grupos/colores en data) */
  function filasParaExportarEmbalaje() {
    const porEmb = filasFiltradasPorFechas();
    if (!porEmb.length) return [];
    if (!filasVistaActual.length) return porEmb;
    const setEmb = new Set(porEmb);
    const ordenVista = filasVistaActual.filter(r => setEmb.has(r));
    if (ordenVista.length === porEmb.length) return ordenVista;
    const enVista = new Set(ordenVista);
    const faltan = porEmb.filter(r => !enVista.has(r));
    return ordenVista.concat(faltan);
  }

  function fechasEmbalajeDisponibles() {
    return [...new Set(
      dataRows.map(r => getFechaExcel(r[COL_FECHA_EMBALAJE])).filter(Boolean)
    )].sort();
  }

  function filasParaExportarMultiplesFechas(fechas) {
    const ordenFecha = new Map(fechas.map((f, i) => [f, i]));
    return dataRows.filter(r => ordenFecha.has(getFechaExcel(r[COL_FECHA_EMBALAJE])))
      .sort((a, b) => {
        const fa = ordenFecha.get(getFechaExcel(a[COL_FECHA_EMBALAJE])) ?? 0;
        const fb = ordenFecha.get(getFechaExcel(b[COL_FECHA_EMBALAJE])) ?? 0;
        return fa - fb;
      });
  }

  function exportExcelPTPalta(rowsAExportar, nombreArchivo) {
    if (!rowsAExportar.length) {
      Swal.fire("Sin datos", "No hay filas para exportar.", "warning");
      return;
    }
    if (!headers.length) {
      Swal.fire("Sin encabezados", "Vuelve a cargar el Excel.", "warning");
      return;
    }

    const exportHeaders = encabezadoExportOrdenado();
    const numCols = exportHeaders.length;
    const ws = XLSX.utils.aoa_to_sheet([exportHeaders]);
    rowsAExportar.forEach((r, i) => {
      const rowIndex = i + 1;
      const rowData = filaExportOrdenada(r);
      XLSX.utils.sheet_add_aoa(ws, [rowData], { origin: { r: rowIndex, c: 0 } });
      aplicarEstiloCeldaExport(ws, rowIndex, numCols, colorFillExportFila(r));
    });

    ws["!cols"] = exportHeaders.map(h => ({
      wch: Math.min(42, Math.max(10, String(h || "").length + 2))
    }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "PT Palta");
    XLSX.writeFile(wb, nombreArchivo, { cellStyles: true });
    Swal.fire({
      icon: "success",
      title: "Exportado",
      text: `${rowsAExportar.length} fila(s) · ${numCols} columnas · colores y grupos`,
      timer: 2200,
      showConfirmButton: false
    });
  }

  function aplicarEstiloCeldaExport(ws, rowIndex, colCount, fillRgb) {
    if (!fillRgb) return;
    for (let c = 0; c < colCount; c++) {
      const ref = XLSX.utils.encode_cell({ r: rowIndex, c });
      const prev = ws[ref];
      const v = prev ? prev.v : "";
      ws[ref] = prev || { t: typeof v === "number" ? "n" : "s", v };
      ws[ref].s = {
        fill: { patternType: "solid", fgColor: { rgb: fillRgb } },
        font: prev?.s?.font || undefined
      };
    }
  }

  exportBtn.addEventListener("click", () => {
    if (!dataRows.length || !headers.length) {
      Swal.fire("Sin datos", "Carga un Excel y revisa al menos una fecha.", "warning");
      return;
    }

    const fechaEmb = embalajeDateSelect.value;
    let fechasSeleccionadas = fechasEmbalajeDisponibles();
    if (!fechasSeleccionadas.length) {
      Swal.fire("Sin fechas", "No hay fechas de embalaje en el archivo.", "info");
      return;
    }

    const renderCards = () => `
      <div class="swal-fechas-container">
        ${fechasSeleccionadas.map(f => {
          const esActual = f === fechaEmb;
          return `
            <div class="swal-fecha-card ${esActual ? "actual" : ""}">
              <span class="swal-fecha-text">${f}</span>
              ${esActual ? "" : `<button type="button" class="swal-fecha-delete" data-fecha="${f}">×</button>`}
            </div>`;
        }).join("")}
      </div>`;

    const htmlSwal = () => `
      <div style="text-align:center">
        <b>Fecha en revisión:</b> ${fechaEmb || "—"}<br><br>
        <b>Fechas de embalaje a unir</b>
        ${renderCards()}
      </div>`;

    Swal.fire({
      title: "Exportar Excel PT Palta",
      html: htmlSwal(),
      width: 650,
      showCancelButton: true,
      showDenyButton: true,
      confirmButtonColor: "#2f7cc0",
      confirmButtonText: "Solo esta fecha",
      denyButtonText: "Unir seleccionadas",
      cancelButtonText: "Cancelar",
      didOpen: () => {
        Swal.getHtmlContainer().addEventListener("click", e => {
          const btn = e.target.closest(".swal-fecha-delete");
          if (!btn) return;
          const f = btn.dataset.fecha;
          if (f === fechaEmb) return;
          fechasSeleccionadas = fechasSeleccionadas.filter(x => x !== f);
          Swal.update({ html: htmlSwal() });
        });
      }
    }).then(res => {
      if (res.isConfirmed) {
        if (!fechaEmb) {
          Swal.fire("Atención", "Selecciona una fecha de embalaje en revisión.", "warning");
          return;
        }
        const rows = filasParaExportarEmbalaje();
        const cosFile = textoFechasCosecha().replace(/\s*·\s*/g, "_").replace(/\//g, "-") || "cosecha";
        exportExcelPTPalta(
          rows,
          `PT_Palta_emb_${fechaEmb.replace(/\//g, "-")}_cos_${cosFile}.xlsx`
        );
      }
      if (res.isDenied) {
        if (!fechasSeleccionadas.length) {
          Swal.fire("Atención", "Queda al menos la fecha en revisión para exportar.", "warning");
          return;
        }
        exportExcelPTPalta(
          filasParaExportarMultiplesFechas(fechasSeleccionadas),
          "PT_Palta_Fechas_Embalaje_Unidas.xlsx"
        );
      }
    });
  });

  clearBtn.addEventListener("click", () => {
    selectedRowIndexes.clear();
    ordenSeleccion = [];
    ultimoCheckIndex = null;
    nextGroupId = 1;
    Object.keys(activeColumnFilters).forEach(k => delete activeColumnFilters[k]);
    columnasOcultas.clear();
    cerrarMenuFiltro();
    cerrarMenuFila();
    headerRow.innerHTML = "";
    bodyRows.innerHTML = "";
    containerBuscador.style.display = "none";
    if (inputBusqueda) inputBusqueda.value = "";
    fileInput.value = "";
    embalajeDateSelect.innerHTML = `<option value="" disabled selected>Selecciona fecha</option>`;
    embalajeDateSelect.disabled = true;
    cosechaDateSelect.value = "Auto-Fecha";
    cosechaDateSelect.dataset.fechas = "";
    cosechaDateSelect.disabled = true;
    cosechaDateSelect.classList.remove("pt-cosecha-error");
    dataRows = [];
    filasVistaActual = [];
    headers = [];
    runBtn.disabled = true;
    exportBtn.disabled = true;
    if (totalFilasDiv) totalFilasDiv.textContent = "";
    Swal.fire({ icon: "success", title: "Limpiado", timer: 900, showConfirmButton: false });
  });

  /* Menú contextual filas: agrupar (solo PT Palta) */
  document.addEventListener("contextmenu", e => {
    const tdLote = e.target.closest("#resultsBodyPTPalta td[data-col-key=\"9\"]");
    if (tdLote && !e.target.closest(".pt-row-sel-cb")) {
      e.preventDefault();
      cerrarMenuFiltro();
      cerrarMenuFila();
      const menuCol = document.getElementById("customContextMenuPTPalta");
      if (menuCol) menuCol.style.display = "none";
      abrirMenuCopiarLote(tdLote, e);
      return;
    }

    const tr = e.target.closest("#resultsBodyPTPalta tr");
    if (tr && !e.target.closest(".pt-row-sel-cb")) {
      e.preventDefault();
      cerrarMenuFiltro();
      cerrarMenuLote();
      const menuCol = document.getElementById("customContextMenuPTPalta");
      if (menuCol) menuCol.style.display = "none";
      abrirMenuFila(tr, e);
      return;
    }

    const th = e.target.closest("#resultsHeaderPTPalta th");
    if (!th || th.cellIndex === 0 || e.target.closest(".pt-th-filter-btn")) return;
    e.preventDefault();
    cerrarMenuFila();
    cerrarMenuLote();
    let menu = document.getElementById("customContextMenuPTPalta");
    if (!menu) {
      menu = document.createElement("div");
      menu.id = "customContextMenuPTPalta";
      document.body.appendChild(menu);
    }
    const tabla = document.getElementById("resultsTablePTPalta");
    const colKey = colKeyDesdeTh(th);
    const hayOcultos = columnasOcultas.size > 0;
    menu.innerHTML = `<div class="ctx-item" data-act="hide">🚫 Ocultar columna</div>` +
      (hayOcultos ? `<div class="ctx-item" data-act="show">✅ Mostrar todas</div>` : "");
    menu.style.top = `${e.pageY}px`;
    menu.style.left = `${e.pageX}px`;
    menu.style.display = "block";
    menu.onclick = ev => {
      const act = ev.target.closest("[data-act]")?.dataset.act;
      if (act === "hide" && colKey) ocultarColumnaPorKey(colKey);
      if (act === "show") mostrarTodasLasColumnas();
      menu.style.display = "none";
    };
  });

  document.addEventListener("click", e => {
    const menu = document.getElementById("customContextMenuPTPalta");
    if (menu) menu.style.display = "none";
    const menuLote = document.getElementById("ptLoteContextMenuPTPalta");
    if (menuLote && !menuLote.contains(e.target)) menuLote.style.display = "none";
    const menuRow = document.getElementById("ptRowContextMenuPTPalta");
    if (menuRow && !menuRow.contains(e.target)) menuRow.style.display = "none";
    const fm = document.getElementById("ptFilterMenuPTPalta");
    if (fm && fm.style.display === "block" && !fm.contains(e.target) && !e.target.closest(".pt-th-filter-btn")) {
      cerrarMenuFiltro();
    }
  });

})();
