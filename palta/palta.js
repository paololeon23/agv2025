(() => {

  const TOTAL_COLUMNAS = 157;
  const PRODUCTOR_ESPERADO = "1000003265";
  const STICKY_COLUMNS = [0, 1, 6, 9];

  const COLS_OBLIGATORIAS_1 = Array.from({ length: 38 }, (_, i) => i + 81);  // Excel 82-119
  const COLS_OBLIGATORIAS_2 = Array.from({ length: 23 }, (_, i) => i + 134); // Excel 135-157
  const COLS_SUMA_MUESTRA = Array.from({ length: 15 }, (_, i) => i + 35);   // Excel 36-50

  const COLS_CUMPLE = [34, 56, 70, 79]; // Excel 35, 57, 71, 80

  /** Cartilla Excel 1-based: texto forzado (no convertir a número al exportar) */
  const EXPORT_COLUMNAS_TEXTO = new Set([1, 10, 19]);

  /** Orden de columnas para Excel filtrado (null = columna vacía) */
  const EXPORT_ORDEN_COLUMNAS = (() => {
    const orden = [];
    const col = n => orden.push(n - 1);
    const rango = (a, b) => { for (let n = a; n <= b; n++) col(n); };
    const vacio = () => orden.push(null);

    col(1);
    col(4);
    col(5);
    vacio();
    rango(10, 19);
    vacio();
    vacio();
    rango(28, 34);
    rango(35, 62);
    rango(64, 78);
    col(63);
    rango(79, 96);
    rango(97, 111);
    rango(113, 119);
    col(112);
    rango(135, 149);
    rango(151, 157);
    col(150);
    return orden;
  })();

  /* ===============================
    DOM
  =============================== */
  const fileInput = document.getElementById("filePalta");
  const inspectionDateSelect = document.getElementById("inspectionDate");
  const runReviewBtn = document.getElementById("runReviewPalta");
  const headerRow = document.getElementById("resultsHeader");
  const bodyRows = document.getElementById("resultsBody");
  const totalFilasDiv = document.getElementById("totalFilas");
  const notificationIcon = document.getElementById("notificationIcon");
  const notificationCount = document.getElementById("notificationCount");
  const clearBtnPalta = document.getElementById("clearPalta");
  const exportBtnPalta = document.getElementById("exportPalta");

  let rawRows = [];
  let headers = [];
  let columns = [];
  let notificationErrors = [];
  let lotesDuplicadosGlobal = [];

  /* ===============================
    UTILS
  =============================== */
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

  function parseFlexibleNumber(val) {
    const s = valorCelda(val).trim().replace(/\s/g, "").replace(",", ".");
    if (s === "") return NaN;
    const n = Number(s);
    return Number.isFinite(n) ? n : NaN;
  }

  function parseExcelDateISO(v) {
    const s = valorCelda(v).trim();
    if (!s) return "";
    if (/^\d{8}$/.test(s)) return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) {
      const [d, m, y] = s.split("/");
      return `${y}-${m}-${d}`;
    }
    if (/^\d{2}-\d{2}-\d{4}$/.test(s)) {
      const [d, m, y] = s.split("-");
      return `${y}-${m}-${d}`;
    }
    const d = new Date(s);
    return isNaN(d) ? "" : d.toISOString().split("T")[0];
  }

  function formatISOToDMY(iso) {
    if (!iso) return "";
    const [y, m, d] = iso.split("-");
    return `${d}-${m}-${y}`;
  }

  function formatFechaCelda(val) {
    const iso = parseExcelDateISO(val);
    return iso ? formatISOToDMY(iso) : valorCelda(val);
  }

  function normCumple(val) {
    return valorCelda(val).trim().toUpperCase();
  }

  function sumaColumnasMuestra(row) {
    return COLS_SUMA_MUESTRA.reduce((acc, i) => {
      const n = parseFlexibleNumber(row[i]);
      return acc + (Number.isFinite(n) ? n : 0);
    }, 0);
  }

  /* ===============================
    VALIDACIÓN POR FILA
  =============================== */
  function ejecutarValidacion(rows) {
    const loteCount = {};
    rows.forEach(r => {
      const lote = valorCelda(r[9]).trim();
      if (lote) loteCount[lote] = (loteCount[lote] || 0) + 1;
    });
    const lotesDuplicados = Object.keys(loteCount).filter(k => loteCount[k] > 1);

    rows.forEach(row => {
      row._errors = new Set();
      row._errorCols = new Set();

      const err = (colIndex, msg) => {
        row._errors.add(`Columna ${colIndex + 1}: ${msg}`);
        row._errorCols.add(colIndex);
      };

      const lote = valorCelda(row[9]).trim();
      if (celdaVacia(lote) || lote.length !== 10 || loteCount[lote] > 1) {
        row._errorCols.add(9);
        if (!lote) err(9, "Lote vacío");
        else if (lote.length !== 10) err(9, "Debe tener 10 caracteres");
        else err(9, "Lote duplicado");
      }

      if (celdaVacia(row[10])) err(10, "Cant. muestra obligatoria");

      const med = valorCelda(row[11]).trim().toUpperCase();
      if (celdaVacia(row[11])) err(11, "Med. muestra obligatoria");
      else if (!med.includes("UNIDAD")) err(11, "Debe decir UNIDAD");

      const productor = valorCelda(row[12]).trim();
      if (celdaVacia(row[12])) err(12, "Productor obligatorio");
      else if (productor !== PRODUCTOR_ESPERADO) err(12, `Debe ser ${PRODUCTOR_ESPERADO}`);

      for (const i of [13, 14, 15, 16]) {
        if (celdaVacia(row[i])) err(i, "Campo obligatorio");
      }

      const fundo = valorCelda(row[17]).trim().toLowerCase();
      if (celdaVacia(row[17])) err(17, "Fundo obligatorio");
      else if (fundo !== "n") err(17, 'Debe ser "n"');

      if (celdaVacia(row[18])) err(18, "Variedad obligatoria");

      const fechaCosechaISO = parseExcelDateISO(row[19]);
      const fechaCosecha2ISO = parseExcelDateISO(row[63]);
      const fechaInspeccionISO = parseExcelDateISO(row[64]);

      if (!fechaCosechaISO) err(19, "Fecha cosecha obligatoria");
      else if (fechaCosecha2ISO && fechaCosechaISO !== fechaCosecha2ISO) {
        err(19, "Debe ser igual a Fecha cosecha 2.0 (col. 64)");
      }

      if (celdaVacia(row[27])) err(27, "Nota condición obligatoria");

      const tipoFormato = valorCelda(row[28]).trim();
      if (celdaVacia(row[28])) err(28, "Tipo formato obligatorio");
      else if (tipoFormato !== "59") err(28, "Debe ser 59");

      const etiqueta = valorCelda(row[29]).trim();
      if (celdaVacia(row[29])) err(29, "Etiqueta obligatoria");
      else if (etiqueta !== "53") err(29, "Debe ser 53");

      for (const i of [30, 31, 32, 33]) {
        if (celdaVacia(row[i])) err(i, "Campo obligatorio");
      }

      COLS_CUMPLE.forEach(i => {
        if (celdaVacia(row[i])) err(i, "Debe decir CUMPLE y no estar vacío");
        else if (normCumple(row[i]) !== "CUMPLE") err(i, "Debe decir CUMPLE");
      });

      const cantMuestra = parseFlexibleNumber(row[10]);
      const suma = sumaColumnasMuestra(row);
      if (Number.isFinite(cantMuestra) && Math.abs(suma - cantMuestra) > 0.001) {
        COLS_SUMA_MUESTRA.forEach(i => row._errorCols.add(i));
        err(10, `Suma cols. 36-50 (${suma}) debe igualar Cant. muestra (${cantMuestra})`);
      }

      if (!fechaCosecha2ISO) err(63, "Fecha cosecha 2.0 obligatoria");
      else if (fechaInspeccionISO && fechaCosecha2ISO > fechaInspeccionISO) {
        err(63, "No puede ser mayor a la fecha de inspección");
      }

      if (!fechaInspeccionISO) err(64, "Fecha inspección obligatoria");

      if (celdaVacia(row[68])) err(68, "Inoloro obligatorio");

      const tPulpa = parseFlexibleNumber(row[78]);
      if (celdaVacia(row[78])) err(78, "T. pulpa obligatoria");
      else if (!Number.isFinite(tPulpa) || tPulpa < 19 || tPulpa > 36) {
        err(78, "Debe estar entre 19 y 36 °C");
      }

      const tAmbiente = parseFlexibleNumber(row[80]);
      if (celdaVacia(row[80])) err(80, "T. ambiente obligatoria");
      else if (!Number.isFinite(tAmbiente) || tAmbiente < 18.5 || tAmbiente > 32.5) {
        err(80, "Debe estar entre 18.5 y 32.5 °C");
      } else if (Number.isFinite(tPulpa) && tAmbiente > tPulpa) {
        err(80, "No puede ser mayor que T. pulpa");
      }

      COLS_OBLIGATORIAS_1.forEach(i => {
        if (celdaVacia(row[i])) err(i, "Columna obligatoria (82-119)");
      });

      COLS_OBLIGATORIAS_2.forEach(i => {
        if (celdaVacia(row[i])) err(i, "Columna obligatoria (135-157)");
      });
    });

    return { lotesDuplicados };
  }

  function filaTieneError(row) {
    return row._errorCols && row._errorCols.size > 0;
  }

  function obtenerTituloColumna(c, row) {
    if (!row || !row._errors) return "";
    const prefix = `Columna ${c + 1}: `;
    for (const e of row._errors) {
      if (e.startsWith(prefix)) return e.replace(prefix, "");
    }
    if (row._errorCols.has(c)) return "Error de validación";
    return "";
  }

  function celdaVaciaObligatoria(c, val, row) {
    if (!celdaVacia(val)) return false;
    return row._errorCols && row._errorCols.has(c);
  }

  function celdaValorIncorrecto(c, val, row) {
    if (celdaVacia(val)) return false;
    return row._errorCols && row._errorCols.has(c);
  }

  /* ===============================
    FILE INPUT
  =============================== */
  fileInput.addEventListener("change", async e => {
    const file = e.target.files[0];
    if (!file) return;

    resetAll();

    const buffer = await file.arrayBuffer();
    const wb = XLSX.read(buffer, { type: "array" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false });

    const fila4 = data[3] || [];
    const cartilla = valorCelda(fila4[8]).toUpperCase().trim();
    const estado = valorCelda(fila4[13]).toUpperCase().trim();

    if (cartilla !== "MPCP") {
      Swal.fire(
        "Cartilla no válida",
        `Se esperaba <b>MPCP</b> en fila 4, columna 9.<br>Valor encontrado: <b>${cartilla || "vacío"}</b>`,
        "error"
      );
      fileInput.value = "";
      return;
    }

    if (estado !== "ENVIADA") {
      Swal.fire(
        "Estado incorrecto",
        `La cartilla debe estar en estado <b>ENVIADA</b> (fila 4, columna 14).<br>Valor: <b>${estado || "vacío"}</b>`,
        "error"
      );
      fileInput.value = "";
      return;
    }

    data.splice(0, 5);
    if (data.length < 2) {
      Swal.fire("Sin datos", "El archivo no contiene filas de inspección.", "error");
      fileInput.value = "";
      return;
    }

    headers = data[0];
    if (headers.length !== TOTAL_COLUMNAS) {
      Swal.fire(
        "Estructura incorrecta",
        `El archivo tiene <b>${headers.length}</b> columnas.<br>Se requieren <b>${TOTAL_COLUMNAS}</b>.`,
        "error"
      );
      fileInput.value = "";
      return;
    }

    columns = headers.map((h, i) => ({
      id: `columna_${i + 1}`,
      header: h || "",
      originalIndex: i
    }));

    rawRows = data.slice(1);
    cargarFechasInspeccion();
    setNotification(detectarFechasInspeccionFaltantes());
    runReviewBtn.disabled = false;

    Swal.fire({
      icon: "success",
      title: "Excel cargado",
      html: `Cartilla <b>MPCP</b> · <b>${rawRows.length}</b> registros · <b>${TOTAL_COLUMNAS}</b> columnas`,
      timer: 1800,
      showConfirmButton: false
    });
  });

  function cargarFechasInspeccion() {
    const fechas = [...new Set(
      rawRows.map(r => parseExcelDateISO(r[64])).filter(Boolean)
    )].sort();

    fillSelectWithFormat(inspectionDateSelect, fechas);
    inspectionDateSelect.disabled = fechas.length === 0;
  }

  function detectarFechasInspeccionFaltantes() {
    return rawRows
      .filter(r => !parseExcelDateISO(r[64]))
      .map(r => ({
        id: valorCelda(r[0]),
        lote: valorCelda(r[9])
      }));
  }

  /* ===============================
    NOTIFICACIÓN
  =============================== */
  notificationIcon.addEventListener("click", () => {
    if (!notificationErrors.length) return;
    Swal.fire({
      icon: "warning",
      title: "Falta fecha de inspección",
      html: `
        <div style="text-align:left; max-height:300px; overflow:auto">
          ${notificationErrors.map(e =>
            `• <b>ID:</b> ${e.id} &nbsp; <b>Lote:</b> ${e.lote}`
          ).join("<br>")}
        </div>
      `,
      confirmButtonText: "Aceptar"
    });
  });

  function setNotification(errors) {
    notificationErrors = errors;
    if (errors.length > 0) {
      notificationIcon.classList.remove("ok");
      notificationIcon.classList.add("error");
      notificationCount.textContent = errors.length;
      notificationIcon.style.pointerEvents = "auto";
    } else {
      notificationIcon.classList.remove("error");
      notificationIcon.classList.add("ok");
      notificationCount.textContent = "0";
      notificationIcon.style.pointerEvents = "none";
    }
    notificationCount.style.display = "block";
  }

  /* ===============================
    RUN REVIEW
  =============================== */
  runReviewBtn.addEventListener("click", () => {
    const fechaISO = inspectionDateSelect.value;
    const fechasValidas = Array.from(inspectionDateSelect.options)
      .map(o => o.value)
      .filter(Boolean);

    if (!fechaISO || !fechasValidas.includes(fechaISO)) {
      Swal.fire(
        "Falta fecha de inspección",
        "Debes seleccionar una <b>fecha de inspección</b> antes de ejecutar.",
        "warning"
      );
      return;
    }

    const rows = rawRows.filter(r => parseExcelDateISO(r[64]) === fechaISO);

    Swal.fire({
      title: "Revisión de fechas",
      html: `
        <div style="line-height:1.4">
          Se va a revisar la inspección del<br><br>
          <b>${formatISOToDMY(fechaISO)}</b><br><br>
          <b>${rows.length}</b> registro(s)
        </div>
      `,
      icon: "info",
      showCancelButton: true,
      confirmButtonText: "Continuar",
      cancelButtonText: "Cancelar"
    }).then(result => {
      if (result.isConfirmed) validarYRender(rows, fechaISO);
    });
  });

  function validarYRender(rows, fechaISO) {
    headerRow.innerHTML = "";
    bodyRows.innerHTML = "";

    limpiarMarcasValidacion(rows);
    const { lotesDuplicados } = ejecutarValidacion(rows);
    lotesDuplicadosGlobal = lotesDuplicados;

    const filasParaMostrar = rows.filter(r => filaTieneError(r));

    if (filasParaMostrar.length) {
      headers.forEach((h, i) => {
        const th = document.createElement("th");
        th.textContent = h;
        if (STICKY_COLUMNS.includes(i)) {
          th.classList.add("palta-col", `palta-col-${i}`);
        }
        headerRow.appendChild(th);
      });

      filasParaMostrar.forEach(r => {
        const tr = document.createElement("tr");
        columns.forEach(col => {
          const c = col.originalIndex;
          const td = document.createElement("td");
          let val = r[c] ?? "";

          if ([19, 63, 64].includes(c)) {
            val = formatFechaCelda(val);
          } else {
            val = valorCelda(val);
          }
          td.textContent = val;
          td.style.background = "#fff";
          td.style.color = "#000";

          if (STICKY_COLUMNS.includes(c)) {
            td.classList.add("palta-col", `palta-col-${c}`);
          }

          const esVacia = celdaVaciaObligatoria(c, r[c], r);
          const esIncorrecta = celdaValorIncorrecto(c, r[c], r);
          if (esVacia) td.style.background = "red";
          if (esIncorrecta) td.style.color = "red";

          const tieneError = esVacia || esIncorrecta;
          if (tieneError) td.title = obtenerTituloColumna(c, r);

          tr.appendChild(td);
        });
        bodyRows.appendChild(tr);
      });
    } else {
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.colSpan = headers.length;
      td.textContent = "No se encontraron errores en esta inspección";
      td.style.textAlign = "center";
      td.style.fontWeight = "bold";
      td.style.padding = "12px";
      td.style.background = "#e8f5e9";
      td.style.color = "#2e7d32";
      tr.appendChild(td);
      bodyRows.appendChild(tr);
    }

    if (totalFilasDiv) {
      totalFilasDiv.textContent = `Total registros inspección: ${rows.length}`;
    }

    if (!filasParaMostrar.length) {
      Swal.fire({
        icon: "success",
        title: "Todo correcto",
        text: "No se encontraron errores en esta inspección."
      });
    } else if (lotesDuplicados.length) {
      Swal.fire({
        icon: "error",
        title: "Lotes duplicados",
        text: `Lotes duplicados: ${lotesDuplicados.join(", ")}`
      });
    }

    exportBtnPalta.disabled = false;
  }

  function limpiarMarcasValidacion(rows) {
    rows.forEach(row => {
      delete row._errors;
      delete row._errorCols;
    });
  }

  /* ===============================
    EXPORTAR
  =============================== */
  function fechasInspeccionDisponibles() {
    return [...new Set(
      rawRows.map(r => parseExcelDateISO(r[64])).filter(Boolean)
    )].sort();
  }

  exportBtnPalta.addEventListener("click", () => {
    if (!rawRows.length) return;

    const fechaISO = inspectionDateSelect.value;
    let fechasSeleccionadas = fechasInspeccionDisponibles();
    if (!fechasSeleccionadas.length) {
      Swal.fire("Sin fechas", "No hay fechas de inspección en el archivo.", "info");
      return;
    }

    const renderCards = () => `
      <div class="swal-fechas-container">
        ${fechasSeleccionadas.map(f => {
          const esActual = f === fechaISO;
          return `
            <div class="swal-fecha-card ${esActual ? "actual" : ""}">
              <span class="swal-fecha-text">${formatISOToDMY(f)}</span>
              ${esActual ? "" : `<button type="button" class="swal-fecha-delete" data-fecha="${f}">×</button>`}
            </div>`;
        }).join("")}
      </div>`;

    const htmlSwal = () => `
      <div style="text-align:center">
        <b>Fecha en revisión:</b> ${fechaISO ? formatISOToDMY(fechaISO) : "—"}<br><br>
        <b>Fechas de inspección a unir</b>
        ${renderCards()}
      </div>`;

    Swal.fire({
      title: "Exportar Excel Palta",
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
          if (f === fechaISO) return;
          fechasSeleccionadas = fechasSeleccionadas.filter(x => x !== f);
          Swal.update({ html: htmlSwal() });
        });
      }
    }).then(res => {
      if (res.isConfirmed) {
        if (!fechaISO) {
          Swal.fire("Atención", "Selecciona una fecha de inspección en revisión.", "warning");
          return;
        }
        const rows = rawRows.filter(r => parseExcelDateISO(r[64]) === fechaISO);
        if (!rows.length) {
          Swal.fire("Sin data", "No hay registros para la fecha seleccionada.", "warning");
          return;
        }
        generarExcelPalta(
          rows,
          `PALTA_MPCP_${formatISOToDMY(fechaISO).replace(/\//g, "-")}.xlsx`,
          formatISOToDMY(fechaISO)
        );
      }
      if (res.isDenied) {
        if (!fechasSeleccionadas.length) {
          Swal.fire("Atención", "Queda al menos la fecha en revisión para exportar.", "warning");
          return;
        }
        const setFechas = new Set(fechasSeleccionadas);
        const rows = rawRows.filter(r => setFechas.has(parseExcelDateISO(r[64])));
        generarExcelPalta(rows, "PALTA_MPCP_Fechas_Inspeccion_Unidas.xlsx");
      }
    });
  });

  function valorCeldaExport(val, indiceOrigen) {
    if (val === undefined || val === null || celdaVacia(val)) {
      return undefined;
    }

    const colExcel = indiceOrigen + 1;
    if (EXPORT_COLUMNAS_TEXTO.has(colExcel)) {
      return valorCelda(val);
    }

    const n = parseFlexibleNumber(val);
    if (Number.isFinite(n)) return n;
    return valorCelda(val);
  }

  function filaExportOrdenada(r) {
    return EXPORT_ORDEN_COLUMNAS.map(indice => {
      if (indice === null) return undefined;
      return valorCeldaExport(r[indice], indice);
    });
  }

  function encabezadoExportOrdenado() {
    return EXPORT_ORDEN_COLUMNAS.map(indice =>
      indice === null ? undefined : (headers[indice] || undefined)
    );
  }

  function generarExcelPalta(rows, nombreArchivo, etiquetaFecha) {
    const exportArray = [encabezadoExportOrdenado()];
    rows.forEach(r => exportArray.push(filaExportOrdenada(r)));

    const ws = XLSX.utils.aoa_to_sheet(exportArray);

    ws["!cols"] = exportArray[0].map(h => ({
      wch: Math.max(10, String(h || "").length + 2)
    }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "MPCP");
    XLSX.writeFile(wb, nombreArchivo);

    const detalle = etiquetaFecha
      ? `Excel MPCP (${etiquetaFecha}) listo para copiar a la base principal.`
      : `${rows.length} fila(s) · fechas unidas listas para copiar a la base principal.`;

    Swal.fire({
      icon: "success",
      title: "Exportación completa",
      text: detalle
    });
  }

  /* ===============================
    LIMPIAR
  =============================== */
  clearBtnPalta.addEventListener("click", limpiarTodoPalta);

  function limpiarTodoPalta() {
    rawRows = [];
    headers = [];
    columns = [];
    notificationErrors = [];
    lotesDuplicadosGlobal = [];
    fileInput.value = "";
    headerRow.innerHTML = "";
    bodyRows.innerHTML = "";
    totalFilasDiv.textContent = "";
    inspectionDateSelect.innerHTML = `<option value="" disabled selected>Selecciona fecha</option>`;
    inspectionDateSelect.disabled = true;
    inspectionDateSelect.style.border = "";
    inspectionDateSelect.style.color = "";
    runReviewBtn.disabled = true;
    exportBtnPalta.disabled = true;
    setNotification([]);
    Swal.fire({
      icon: "success",
      title: "Limpieza completa",
      text: "El módulo de Palta se limpió correctamente.",
      timer: 1000,
      showConfirmButton: false
    });
  }

  function resetAll() {
    headerRow.innerHTML = "";
    bodyRows.innerHTML = "";
    totalFilasDiv.textContent = "";
    inspectionDateSelect.innerHTML = `<option value="" disabled selected>Selecciona fecha</option>`;
    inspectionDateSelect.value = "";
    inspectionDateSelect.disabled = true;
    setNotification([]);
  }

  function fillSelectWithFormat(select, valuesISO) {
    select.innerHTML = `<option value="" disabled selected>Selecciona fecha</option>`;
    valuesISO.forEach(v => {
      const o = document.createElement("option");
      o.value = v;
      o.textContent = formatISOToDMY(v);
      select.appendChild(o);
    });
  }

})();
