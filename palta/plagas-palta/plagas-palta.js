(() => {

  const TOTAL_COLUMNAS = 132;
  const PRODUCTOR_ESPERADO = "1000003265";

  /** Orden exportación Excel filtrado (null = columna vacía en plantilla) */
  const EXPORT_ORDEN = (() => {
    const o = [];
    const vacio = () => o.push(null);
    const col = n => o.push(n - 1);
    const rango = (a, b) => { for (let n = a; n <= b; n++) col(n); };

    vacio(); vacio(); vacio();
    rango(10, 19);
    col(20);
    vacio();
    rango(29, 33);
    vacio(); vacio();
    rango(34, 99);
    rango(100, 132);
    return o;
  })();

  /** Excel col. 1-based: no convertir a número en exportación */
  const EXPORT_COLUMNAS_TEXTO = new Set([10, 19, 20, 82]);

  const fileInput = document.getElementById("filePlagasPalta");
  const runReviewBtn = document.getElementById("runReviewPlagasPalta");
  const reviewAllBtn = document.getElementById("reviewAllPlagasPalta");
  const exportExcelErroresBtn = document.getElementById("exportExcelErroresPlagasPalta");
  const clearBtn = document.getElementById("clearDataPlagasPalta");
  const exportBtn = document.getElementById("exportPlagasPalta");
  const inspectionSelect = document.getElementById("inspectionDatePlagasPalta");
  const cosechaSelect = document.getElementById("cosechaDatePlagasPalta");
  const resultsHeader = document.getElementById("resultsHeaderPlagasPalta");
  const resultsBody = document.getElementById("resultsBodyPlagasPalta");
  const resultsTable = document.getElementById("resultsTablePlagasPalta");
  const resumenTodasFechasEl = document.getElementById("resumenTodasFechasPlagasPalta");
  const tableWrapPlagasEl = document.getElementById("tableWrapPlagasPalta");

  if (!fileInput || !inspectionSelect || !cosechaSelect || !runReviewBtn || !exportBtn || !reviewAllBtn || !exportExcelErroresBtn) {
    console.error("Faltan elementos DOM en Plagas Palta.");
    return;
  }

  let rawData = [];
  let processedData = [];
  let columns = [];
  let excelLoaded = false;
  let columnsToShow = [];

  function setPlagasAuxButtonsDisabled(disabled) {
    [reviewAllBtn, exportExcelErroresBtn].forEach(btn => {
      if (!btn) return;
      btn.disabled = disabled;
      btn.style.background = disabled ? "#b8c2cc" : "";
      btn.style.borderColor = disabled ? "#b8c2cc" : "";
      btn.style.cursor = disabled ? "not-allowed" : "";
      btn.style.opacity = disabled ? "1" : "";
    });
  }

  setPlagasAuxButtonsDisabled(true);

  function valorCeldaParaMostrar(val) {
    if (val === null || val === undefined) return "";
    if (typeof val === "object" && val !== null) {
      if ("w" in val && val.w != null && String(val.w).trim() !== "") return String(val.w);
      if ("v" in val && val.v !== undefined && val.v !== null && val.v !== "") return String(val.v);
      if (Array.isArray(val.r)) return val.r.map(x => (x && x.w != null ? x.w : x.t) || "").join("");
    }
    return String(val);
  }

  function celdaVacia(val) {
    return valorCeldaParaMostrar(val).trim() === "";
  }

  function parseFlexibleNumber(val) {
    if (val === null || val === undefined) return NaN;
    if (typeof val === "object" && val !== null) {
      if ("v" in val && val.v !== undefined && val.v !== null && val.v !== "") return parseFlexibleNumber(val.v);
      if ("w" in val && val.w !== undefined && val.w !== null && String(val.w).trim() !== "") return parseFlexibleNumber(val.w);
    }
    if (typeof val === "number" && !Number.isNaN(val)) return val;
    let s = String(val).trim().replace(/\s/g, "").replace(",", ".");
    if (s === "") return NaN;
    const n = Number(s);
    return Number.isFinite(n) ? n : NaN;
  }

  function formatExcelDate(str) {
    const raw = valorCeldaParaMostrar(str).trim();
    if (!raw) return "";
    if (/^\d{8}$/.test(raw)) {
      const y = raw.slice(0, 4), m = raw.slice(4, 6), d = raw.slice(6, 8);
      return `${d}/${m}/${y}`;
    }
    if (/\d{1,2}\/\d{1,2}\/\d{4}/.test(raw)) {
      const [d, m, y] = raw.split("/");
      return `${d.padStart(2, "0")}/${m.padStart(2, "0")}/${y}`;
    }
    if (/\d{1,2}-\d{1,2}-\d{4}/.test(raw)) {
      const [d, m, y] = raw.split("-");
      return `${d.padStart(2, "0")}/${m.padStart(2, "0")}/${y}`;
    }
    return raw;
  }

  const columnasARevisar = [
    ...Array.from({ length: 10 }, (_, i) => i + 9),
    ...Array.from({ length: 5 }, (_, i) => i + 28),
    81,
    ...Array.from({ length: 33 }, (_, i) => i + 99)
  ];

  function resetDashboard() {
    rawData = [];
    processedData = [];
    columns = [];
    excelLoaded = false;
    resultsHeader.innerHTML = "";
    resultsBody.innerHTML = "";
    resultsTable.hidden = true;
    inspectionSelect.innerHTML = `<option disabled selected>Selecciona una fecha</option>`;
    inspectionSelect.disabled = true;
    cosechaSelect.innerHTML = `<option selected>Auto-Fecha</option>`;
    cosechaSelect.disabled = true;
    cosechaSelect.style.border = "";
    cosechaSelect.style.color = "";
    runReviewBtn.disabled = true;
    exportBtn.disabled = true;
    fileInput.value = "";
    const totalFilasDiv = document.getElementById("totalFilasPlagasPalta");
    if (totalFilasDiv) {
      totalFilasDiv.textContent = "";
      totalFilasDiv.style.display = "none";
    }
    if (resumenTodasFechasEl) {
      resumenTodasFechasEl.innerHTML = "";
      resumenTodasFechasEl.hidden = true;
    }
    if (tableWrapPlagasEl) tableWrapPlagasEl.hidden = false;
    setPlagasAuxButtonsDisabled(true);
  }

  function syncFechas() {
    if (!excelLoaded) return;
    const sel = inspectionSelect.value;
    if (!sel) return;
    const matchingRows = rawData.filter(r => r[81] === sel);
    if (!matchingRows.length) return;
    const cosecha = matchingRows[0][19] || "";
    cosechaSelect.innerHTML = "";
    const o = document.createElement("option");
    o.value = cosecha;
    o.textContent = cosecha || "Auto-Fecha";
    cosechaSelect.appendChild(o);
    cosechaSelect.value = cosecha;
    cosechaSelect.disabled = true;
    if (cosecha) {
      const [d1, m1, y1] = sel.split("/").map(Number);
      const [d2, m2, y2] = cosecha.split("/").map(Number);
      if (new Date(y2, m2 - 1, d2) > new Date(y1, m1 - 1, d1)) {
        cosechaSelect.style.border = "2px solid red";
        cosechaSelect.style.color = "red";
        Swal.fire("Atención", "La fecha de cosecha es mayor que la fecha de inspección", "warning");
      } else {
        cosechaSelect.style.border = "";
        cosechaSelect.style.color = "";
      }
    }
  }

  inspectionSelect.addEventListener("change", syncFechas);

  fileInput.addEventListener("change", e => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = ev => {
      const wb = XLSX.read(new Uint8Array(ev.target.result), { type: "array" });
      let sheet = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, raw: false });

      const fila4 = sheet[3] || [];
      const cartilla = valorCeldaParaMostrar(fila4[8]).toUpperCase().trim();
      const estado = valorCeldaParaMostrar(fila4[13]).toUpperCase().trim();

      if (cartilla !== "EPPP") {
        Swal.fire("Error", `Cartilla debe ser <b>EPPP</b> (fila 4, col. 9). Encontrado: <b>${cartilla || "vacío"}</b>`, "error");
        resetDashboard();
        return;
      }
      if (estado !== "ENVIADA") {
        Swal.fire("Error", `Estado debe ser <b>ENVIADA</b> (fila 4, col. 14). Encontrado: <b>${estado || "vacío"}</b>`, "error");
        resetDashboard();
        return;
      }

      sheet.splice(0, 5);

      if ((sheet[0]?.length || 0) !== TOTAL_COLUMNAS) {
        Swal.fire("Error", `El Excel debe tener <b>${TOTAL_COLUMNAS}</b> columnas. Tiene <b>${sheet[0]?.length || 0}</b>.`, "error");
        resetDashboard();
        return;
      }

      columns = sheet[0].map((h, i) => ({ id: `col_${i + 1}`, header: h, originalIndex: i }));
      rawData = sheet.slice(1).filter(r => r.some(c => c !== "" && c !== null && c !== undefined));

      rawData.forEach(r => {
        r[19] = formatExcelDate(r[19]);
        r[81] = formatExcelDate(r[81]);
      });

      columnsToShow = [
        0, 1, 4, 6,
        9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19,
        28, 29, 30, 31, 32,
        81,
        ...Array.from({ length: 33 }, (_, i) => i + 99)
      ];

      const inspectionDates = [...new Set(rawData.map(r => r[81]).filter(Boolean))];
      inspectionSelect.innerHTML = "";
      inspectionDates.forEach(d => {
        const o = document.createElement("option");
        o.value = d;
        o.textContent = d;
        inspectionSelect.appendChild(o);
      });

      inspectionSelect.disabled = !inspectionDates.length;
      runReviewBtn.disabled = !inspectionDates.length;
      setPlagasAuxButtonsDisabled(!inspectionDates.length);
      excelLoaded = true;
      syncFechas();
    };
    reader.readAsArrayBuffer(file);
  });

  function ordenarFechasDDMMYYYY(fechas) {
    return [...fechas].sort((a, b) => {
      const pa = a.split("/").map(Number);
      const pb = b.split("/").map(Number);
      return new Date(pa[2], pa[1] - 1, pa[0]) - new Date(pb[2], pb[1] - 1, pb[0]);
    });
  }

  function limpiarMarcasValidacion(rows) {
    rows.forEach(row => {
      delete row._errors;
      delete row._errorLote;
    });
  }

  function ejecutarValidacion(rows) {
    const celdaVaciaObligatoria = v => celdaVacia(v);

    const loteCount = {};
    rows.forEach(r => {
      const lote = valorCeldaParaMostrar(r[9]).trim();
      if (lote) loteCount[lote] = (loteCount[lote] || 0) + 1;
    });
    const lotesDuplicados = Object.keys(loteCount).filter(k => loteCount[k] > 1);

    rows.forEach(row => {
      row._errors = [];
      row._errorLote = false;
      const addError = (i, msg) => row._errors.push(`Columna ${i + 1}: ${msg}`);

      const lote = valorCeldaParaMostrar(row[9]).trim();
      if (celdaVacia(lote) || lote.length !== 10 || loteCount[lote] > 1) row._errorLote = true;

      if (celdaVaciaObligatoria(row[10])) addError(10, "Cant. muestra obligatoria");

      const med = valorCeldaParaMostrar(row[11]).trim().toUpperCase();
      if (celdaVaciaObligatoria(row[11])) addError(11, "Med. muestra obligatoria");
      else if (!med.includes("UNIDAD")) addError(11, "Debe decir UNIDAD");

      const productor = valorCeldaParaMostrar(row[12]).trim();
      if (celdaVaciaObligatoria(row[12])) addError(12, "Productor obligatorio");
      else if (productor !== PRODUCTOR_ESPERADO) addError(12, `Debe ser ${PRODUCTOR_ESPERADO}`);

      for (const i of [13, 14, 15, 16]) {
        if (celdaVaciaObligatoria(row[i])) addError(i, "Campo obligatorio");
      }

      const fundo = valorCeldaParaMostrar(row[17]).trim().toLowerCase();
      if (celdaVaciaObligatoria(row[17])) addError(17, "Fundo obligatorio");
      else if (fundo !== "n") addError(17, 'Debe ser "n"');

      if (celdaVaciaObligatoria(row[18])) addError(18, "Variedad obligatoria");

      const fCosecha = row[19];
      const fInspeccion = row[81];
      if (!fCosecha) addError(19, "Fecha cosecha obligatoria");
      else if (!fInspeccion) addError(19, "Falta fecha de inspección para comparar");
      else if (fCosecha !== fInspeccion) addError(19, "Debe ser igual a fecha de inspección (col. 82)");

      const tipoFormato = valorCeldaParaMostrar(row[28]).trim();
      if (celdaVaciaObligatoria(row[28])) addError(28, "Tipo formato obligatorio");
      else if (tipoFormato !== "59") addError(28, "Debe ser 59");

      const etiqueta = valorCeldaParaMostrar(row[29]).trim();
      if (celdaVaciaObligatoria(row[29])) addError(29, "Etiqueta obligatoria");
      else if (etiqueta !== "53") addError(29, "Debe ser 53");

      for (const i of [30, 31, 32]) {
        if (celdaVaciaObligatoria(row[i])) addError(i, "Campo obligatorio");
      }

      if (celdaVaciaObligatoria(row[81])) addError(81, "Fecha de inspección obligatoria");

      for (let i = 99; i <= 131; i++) {
        if (celdaVaciaObligatoria(row[i])) addError(i, "Columna obligatoria (100-132)");
      }
    });

    return { lotesDuplicados };
  }

  function htmlEscape(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function mensajeErrorColumna(r, colIdx) {
    const pref = `Columna ${colIdx + 1}: `;
    const err = (r._errors || []).find(e => e.startsWith(pref));
    if (err) return err.slice(pref.length);
    return obtenerTituloColumna(colIdx);
  }

  /** Ancho mínimo por índice de columna (evita filas muy altas por texto largo) */
  function minWidthColumna(indice) {
    const map = {
      0: 60, 1: 52, 4: 180, 6: 56,
      9: 82, 10: 70, 11: 70, 12: 84, 13: 120,
      14: 54, 15: 58, 16: 54, 17: 54, 18: 70, 19: 76,
      28: 64, 29: 64, 30: 62, 31: 62, 32: 70,
      81: 76
    };
    if (map[indice] !== undefined) return map[indice];
    if (indice >= 99 && indice <= 131) return 76;
    return 58;
  }

  function aplicarEstiloCeldaTabla(el, indice) {
    el.dataset.colIndex = String(indice);
    el.style.minWidth = `${minWidthColumna(indice)}px`;
    el.style.verticalAlign = "middle";
    el.style.lineHeight = "2.8";
    el.style.padding = "9px 12px";

    el.style.whiteSpace = "nowrap";
    el.style.overflow = "hidden";
    el.style.textOverflow = "ellipsis";

    if (indice >= 99 && indice <= 131) {
      el.classList.add("plagas-col-texto-wrap");
      el.style.maxWidth = "150px";
      return;
    }

    if (indice === 4 || indice === 13) {
      el.style.maxWidth = "220px";
    }
  }

  function estiloInlineCeldaTabla(indice) {
    const mw = minWidthColumna(indice);
    let s = `min-width:${mw}px;vertical-align:middle;line-height:2.8;padding:9px 12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;`;
    if (indice >= 99 && indice <= 131) {
      s += "max-width:150px;";
      return s;
    }
    if (indice === 4 || indice === 13) {
      s += "max-width:220px;";
    }
    return s;
  }

  function obtenerTituloColumna(i) {
    const titles = {
      9: "10 caracteres, sin duplicados",
      10: "Cant. muestra obligatoria",
      11: "Debe decir UNIDAD",
      12: `Productor: ${PRODUCTOR_ESPERADO}`,
      17: 'Fundo debe ser "n"',
      19: "Igual a fecha inspección (col. 82)",
      28: "Debe ser 59",
      29: "Debe ser 53",
      81: "Fecha de inspección"
    };
    if (i >= 99 && i <= 131) return "Columna obligatoria (100-132)";
    if ((i >= 9 && i <= 18) || (i >= 28 && i <= 32) || i === 81) return titles[i] || "Campo obligatorio";
    return titles[i] || "";
  }

  function htmlTablaFilasConError(filas) {
    if (!filas || !filas.length) return "";
    const thead = columnsToShow.map(i =>
      `<th data-col-index="${i}"${(i >= 99 && i <= 131) ? ' class="plagas-col-texto-wrap"' : ""} style="${estiloInlineCeldaTabla(i)}border:1px solid #ddd;background:#f0f4f8;font-weight:600;color:#333;text-align:center">${htmlEscape(columns[i].header)}</th>`
    ).join("");
    const tbody = filas.map(r => {
      const tds = columnsToShow.map(i => {
        const raw = r[i];
        const val = raw === null || raw === undefined || raw === "" ? "" : valorCeldaParaMostrar(raw);
        let tieneError = false;
        let extra = "";
        if (i === 9 && r._errorLote) {
          tieneError = true;
          if (!val) extra = "background:red;color:white;";
          else extra = "color:red;";
        }
        if (columnasARevisar.includes(i) && (r._errors || []).some(e => e.startsWith(`Columna ${i + 1}: `))) {
          tieneError = true;
          if (!val) extra = "background:red;color:white;";
          else extra = "color:red;";
        }
        const title = tieneError ? ` title="${htmlEscape(mensajeErrorColumna(r, i))}"` : "";
        const wrapCls = (i >= 99 && i <= 131) ? ' class="plagas-col-texto-wrap"' : "";
        return `<td data-col-index="${i}"${wrapCls} style="${estiloInlineCeldaTabla(i)}border:1px solid #ddd;text-align:center;${extra}"${title}>${htmlEscape(val)}</td>`;
      }).join("");
      return `<tr>${tds}</tr>`;
    }).join("");
    return `
      <div style="margin-top:14px">
        <div style="font-weight:600;color:#0E1B40;font-size:14px;margin-bottom:8px">Filas con error</div>
        <div class="table-wrap" style="overflow-x:auto">
          <table style="width:max-content;min-width:100%;border-collapse:collapse;font-size:12px;background:#fff">
            <thead><tr>${thead}</tr></thead>
            <tbody>${tbody}</tbody>
          </table>
        </div>
      </div>`;
  }

  function ocultarResumenTodasFechas() {
    if (resumenTodasFechasEl) {
      resumenTodasFechasEl.innerHTML = "";
      resumenTodasFechasEl.hidden = true;
    }
    if (tableWrapPlagasEl) tableWrapPlagasEl.hidden = false;
  }

  function mostrarResumenTodasFechas(items) {
    if (!resumenTodasFechasEl) return;
    let ok = 0;
    let bad = 0;
    const bloques = items.map(it => {
      const dupTxt = it.lotesDuplicados.length
        ? `<div style="margin-top:8px;color:#e65100;font-size:13px">Lotes duplicados: ${it.lotesDuplicados.join(", ")}</div>`
        : "";
      const lineaErr = it.filasConError > 0
        ? `<div style="margin-top:6px;color:#c62828;font-weight:600">Filas con error: ${it.filasConError} de ${it.totalFilas}</div>`
        : "";
      if (it.tieneErrores) bad++;
      else ok++;
      const borde = it.tieneErrores ? "#c62828" : "#2e7d32";
      const estado = it.tieneErrores
        ? "Con incidencias"
        : "Sin errores";
      const tablaErr = it.filasDetalle && it.filasDetalle.length
        ? htmlTablaFilasConError(it.filasDetalle)
        : "";
      const iconoOk = !it.tieneErrores
        ? `<i class="fi fi-rr-check-circle" style="flex-shrink:0;font-size:1.5rem;color:#2e7d32;line-height:1;margin-top:2px" title="Todo correcto" aria-hidden="true"></i>`
        : "";
      return `
        <div style="margin-bottom:22px">
        <div style="display:flex;align-items:flex-start;background:#fff;border-radius:0 10px 10px 0;box-shadow:0 2px 8px rgba(14,27,64,.08);overflow:hidden">
          <div style="width:4px;align-self:stretch;background:${borde};flex-shrink:0"></div>
          <div style="display:flex;align-items:flex-start;gap:12px;padding:14px 18px;flex:1;min-width:0">
            ${iconoOk}
            <div style="flex:1;min-width:0">
          <div style="font-size:1.1rem;font-weight:700;color:#0E1B40">${it.fecha}</div>
          <div style="margin-top:6px;font-size:15px;color:${it.tieneErrores ? "#c62828" : "#2e7d32"};font-weight:600">${estado}</div>
          <div style="margin-top:4px;font-size:14px;color:#455a64">Registros en esta fecha: ${it.totalFilas}</div>
          ${lineaErr}
          ${dupTxt}
            </div>
          </div>
        </div>
        ${tablaErr}
        </div>`;
    }).join("");

    resumenTodasFechasEl.innerHTML = `
      <div style="width:100%;max-width:none;margin:0 0 20px;padding:20px 0;box-sizing:border-box">
        <h3 style="margin:0 0 18px;font-size:1.25rem;color:#0E1B40;font-weight:700">Resumen — todas las fechas de inspección</h3>
        ${bloques}
        <div style="margin-top:20px;padding:14px 18px;background:linear-gradient(135deg,#e8f4fc 0%,#f5f9ff 100%);border-radius:10px;border:1px solid #b3d4fc;font-size:15px;color:#0E1B40">
          <strong>${items.length}</strong> fecha(s) ·
          <span style="color:#2e7d32;font-weight:600">${ok}</span> sin errores ·
          <span style="color:#c62828;font-weight:600">${bad}</span> con incidencias
        </div>
      </div>`;
    resumenTodasFechasEl.hidden = false;
    if (tableWrapPlagasEl) tableWrapPlagasEl.hidden = true;
    resultsTable.hidden = true;
    const totalDiv = document.getElementById("totalFilasPlagasPalta");
    if (totalDiv) {
      totalDiv.textContent = `Archivo: ${rawData.length} filas · ${items.length} fecha(s) analizada(s)`;
      totalDiv.style.display = "block";
    }
    exportBtn.disabled = true;
    Swal.fire({ icon: "success", title: "Análisis completo", text: `Se revisaron ${items.length} fecha(s).`, timer: 2200, showConfirmButton: true, confirmButtonColor: "#2f7cc0" });
  }

  runReviewBtn.addEventListener("click", () => {
    if (!excelLoaded || !inspectionSelect.value) return;
    procesarTodoExcel();
  });

  exportExcelErroresBtn.addEventListener("click", () => {
    if (!excelLoaded || !rawData.length) return;
    exportExcelCompletoErroresResaltados();
  });

  reviewAllBtn.addEventListener("click", () => {
    if (!excelLoaded || !rawData.length) return;
    const fechas = ordenarFechasDDMMYYYY([...new Set(rawData.map(r => r[81]).filter(Boolean))]);
    if (!fechas.length) {
      Swal.fire("Sin fechas", "No hay fechas de inspección en el archivo.", "info");
      return;
    }
    const items = fechas.map(fecha => {
      const filas = rawData.filter(r => r[81] === fecha).map(r => [...r]);
      const { lotesDuplicados } = ejecutarValidacion(filas);
      const filasConError = filas.filter(r => r._errorLote || (r._errors && r._errors.length > 0));
      return {
        fecha,
        lotesDuplicados,
        totalFilas: filas.length,
        filasConError: filasConError.length,
        filasDetalle: filasConError,
        tieneErrores: filasConError.length > 0 || lotesDuplicados.length > 0
      };
    });
    mostrarResumenTodasFechas(items);
  });

  function procesarTodoExcel() {
    ocultarResumenTodasFechas();
    processedData = rawData.filter(r => r[81] === inspectionSelect.value);
    limpiarMarcasValidacion(processedData);
    const { lotesDuplicados } = ejecutarValidacion(processedData);
    if (lotesDuplicados.length) {
      Swal.fire("Lotes duplicados", lotesDuplicados.join("<br>"), "warning");
    }
    renderTable();
  }

  function renderTable() {
    resultsHeader.innerHTML = "";
    resultsBody.innerHTML = "";
    const filasConError = processedData.filter(r => r._errorLote || (r._errors && r._errors.length > 0));

    if (!filasConError.length) {
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.colSpan = columnsToShow.length;
      td.textContent = "No se encontraron errores en esta inspección";
      td.style.cssText = "text-align:center;font-weight:bold;padding:12px;background:#e8f5e9;color:#2e7d32";
      tr.appendChild(td);
      resultsBody.appendChild(tr);
      Swal.fire({ icon: "success", title: "Todo correcto", text: "No se encontraron errores en la inspección." });
    } else {
      columnsToShow.forEach(i => {
        const th = document.createElement("th");
        th.textContent = columns[i].header;
        th.title = columns[i].header;
        aplicarEstiloCeldaTabla(th, i);
        resultsHeader.appendChild(th);
      });
      filasConError.forEach(r => {
        const tr = document.createElement("tr");
        columnsToShow.forEach(i => {
          const td = document.createElement("td");
          const val = r[i] === null || r[i] === undefined || r[i] === "" ? "" : valorCeldaParaMostrar(r[i]);
          td.textContent = val;
          aplicarEstiloCeldaTabla(td, i);
          if (val) td.title = td.title || val;
          let tieneError = false;
          if (i === 9 && r._errorLote) {
            tieneError = true;
            if (!val) { td.style.background = "red"; td.style.color = "white"; }
            else td.style.color = "red";
          }
          if (columnasARevisar.includes(i) && (r._errors || []).some(e => e.startsWith(`Columna ${i + 1}: `))) {
            tieneError = true;
            if (!val) { td.style.background = "red"; td.style.color = "white"; }
            else td.style.color = "red";
          }
          if (tieneError) td.title = mensajeErrorColumna(r, i);
          tr.appendChild(td);
        });
        resultsBody.appendChild(tr);
      });
    }

    resultsTable.hidden = false;
    exportBtn.disabled = false;
    const totalDiv = document.getElementById("totalFilasPlagasPalta");
    if (totalDiv) {
      totalDiv.textContent = `Total registros: ${processedData.length}`;
      totalDiv.style.display = "block";
    }
  }

  /** Exportación: vacío → celda vacía (nunca 0). Solo numérico si hay valor real. */
  function valorExportCelda(val, colExcel) {
    if (val === undefined || val === null || celdaVacia(val)) return undefined;
    if (colExcel === 20 || colExcel === 82) {
      const f = formatExcelDate(val);
      return f || valorCeldaParaMostrar(val);
    }
    if (EXPORT_COLUMNAS_TEXTO.has(colExcel)) return valorCeldaParaMostrar(val);
    const n = parseFlexibleNumber(val);
    if (!Number.isFinite(n)) return valorCeldaParaMostrar(val);
    return n;
  }

  function encabezadoExportFiltrado() {
    return EXPORT_ORDEN.map(indice =>
      indice === null ? undefined : (columns[indice]?.header || undefined)
    );
  }

  function filaExportFiltrada(r) {
    return EXPORT_ORDEN.map(indice => {
      if (indice === null) return undefined;
      return valorExportCelda(r[indice], indice + 1);
    });
  }

  exportBtn.addEventListener("click", () => {
    if (!processedData.length) return;

    let fechasSeleccionadas = [...new Set(rawData.map(r => r[81]).filter(Boolean))];
    const renderCards = () => `
      <div class="swal-fechas-container">
        ${fechasSeleccionadas.map(f => {
          const esActual = f === inspectionSelect.value;
          return `
            <div class="swal-fecha-card ${esActual ? "actual" : ""}">
              <span class="swal-fecha-text">${f}</span>
              ${esActual ? "" : `<button class="swal-fecha-delete" data-fecha="${f}">×</button>`}
            </div>`;
        }).join("")}
      </div>`;

    Swal.fire({
      title: "Exportar Excel",
      html: `<div style="text-align:center"><b>Fecha en revisión:</b> ${inspectionSelect.value}<br><br><b>Fechas a unir</b>${renderCards()}</div>`,
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
          if (f === inspectionSelect.value) return;
          fechasSeleccionadas = fechasSeleccionadas.filter(x => x !== f);
          Swal.update({ html: `<div style="text-align:center"><b>Fecha en revisión:</b><br>${inspectionSelect.value}<br><br><b>Fechas a unir</b>${renderCards()}</div>` });
        });
      }
    }).then(res => {
      if (res.isConfirmed) {
        exportExcelFiltrado(processedData, `Export_Plaga_Palta_${inspectionSelect.value.replaceAll("/", "-")}.xlsx`);
      }
      if (res.isDenied) {
        exportExcelFiltrado(
          rawData.filter(r => fechasSeleccionadas.includes(r[81])),
          "Export_Plaga_Palta_Fechas_Unidas.xlsx"
        );
      }
    });
  });

  function exportExcelFiltrado(data, nombreArchivo) {
    const wsData = [encabezadoExportFiltrado()];
    data.forEach(r => wsData.push(filaExportFiltrada(r)));
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, "Export");
    XLSX.writeFile(wb, nombreArchivo);
  }

  function exportExcelCompletoErroresResaltados() {
    const filas = rawData.map(r => [...r]);
    ejecutarValidacion(filas);
    const wsData = [columns.map(col => col.header)];
    filas.forEach(row => {
      const linea = [];
      for (let c = 0; c < TOTAL_COLUMNAS; c++) {
        linea.push(valorExportCelda(row[c], c + 1));
      }
      wsData.push(linea);
    });
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const SOFT_RED = "FFFFEBEB";
    for (let C = 0; C < TOTAL_COLUMNAS; C++) {
      const addr = XLSX.utils.encode_cell({ r: 0, c: C });
      if (ws[addr]) ws[addr].s = { ...(ws[addr].s || {}), font: { bold: true } };
    }
    filas.forEach((row, i) => {
      if (!row._errorLote && !(row._errors && row._errors.length)) return;
      const rSheet = i + 1;
      for (let C = 0; C < TOTAL_COLUMNAS; C++) {
        const addr = XLSX.utils.encode_cell({ r: rSheet, c: C });
        if (!ws[addr]) ws[addr] = { t: "s", v: "" };
        ws[addr].s = { fill: { patternType: "solid", fgColor: { rgb: SOFT_RED } } };
      }
    });
    XLSX.utils.book_append_sheet(wb, ws, "Plagas");
    XLSX.writeFile(wb, `Plagas_Palta_ErroresResaltados_${new Date().toISOString().slice(0, 10)}.xlsx`, { cellStyles: true });
    Swal.fire({ icon: "success", title: "Excel generado", text: "Filas con error en rojo muy suave.", timer: 2200, showConfirmButton: true, confirmButtonColor: "#2f7cc0" });
  }

  clearBtn.addEventListener("click", () => {
    resetDashboard();
    Swal.fire({ icon: "success", title: "Datos limpiados", text: "Ya puedes cargar otro Excel.", timer: 1200, showConfirmButton: false });
  });

  resetDashboard();
})();
