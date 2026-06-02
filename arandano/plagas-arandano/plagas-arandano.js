(() => {

  const VAR_MAP = {
    // FALL CREEK
    "01": ["Ventura", "FALL CREEK"],
    "02": ["Emerald", "FALL CREEK"],
    "03": ["Biloxi", "FALL CREEK"],
    "05": ["Snowchaser", "FALL CREEK"],
    "12": ["Jupiter Blue", "FALL CREEK"],
    "13": ["Bianca Blue", "FALL CREEK"],
    "14": ["Atlas Blue", "FALL CREEK"],
    "15": ["Biloxi Orgánico", "FALL CREEK"],
    "16": ["Sekoya Beauty", "FALL CREEK"],
    "18": ["Sekoya Pop", "FALL CREEK"],
    "27": ["Atlas Blue Orgánico", "FALL CREEK"],
    "36": ["FCM17-132", "FALL CREEK"],
    "37": ["FCM15-005", "FALL CREEK"],
    "38": ["FCM15-003", "FALL CREEK"],
    "40": ["FCM14-057", "FALL CREEK"],
    "41": ["Azra", "FALL CREEK"],
    "49": ["Sekoya Pop Orgánica", "FALL CREEK"],
    "58": ["Ventura Orgánico", "FALL CREEK"],
    "C0": ["FCE15-087", "FALL CREEK"],
    "C1": ["FCE18-012", "FALL CREEK"],
    "C2": ["FCE18-015", "FALL CREEK"],

    // DRISCOLL'S
    "17": ["Kirra", "Driscoll´s"],
    "19": ["Arana", "Driscoll´s"],
    "20": ["Stella Blue", "Driscoll´s"],
    "21": ["Terrapin", "Driscoll´s"],
    "26": ["Rosita", "Driscoll´s"],
    "28": ["Arana Orgánico", "Driscoll´s"],
    "29": ["Stella Blue Orgánico", "Driscoll´s"],
    "30": ["Kirra Orgánico", "Driscoll´s"],
    "31": ["Regina", "Driscoll´s"],
    "34": ["Raymi Orgánico", "Driscoll´s"],
    "45": ["Raymi", "Driscoll´s"],
    "50": ["Rosita Orgánica", "Driscoll´s"],

    // OZBLU
    "06": ["Mágica", "OZBLU"],
    "07": ["Bella", "OZBLU"],
    "08": ["Bonita", "OZBLU"],
    "09": ["Julieta", "OZBLU"],
    "10": ["Zila", "OZBLU"],
    "11": ["Magnifica", "OZBLU"],

    // PLANASA
    "22": ["PLA Blue-Malibu", "Planasa"],
    "23": ["PLA Blue-Madeira", "Planasa"],
    "24": ["PLA Blue-Masirah", "Planasa"],
    "35": ["Manila", "Planasa"],

    // IQ BERRIES
    "51": ["Megaone", "IQ BERRIES"],
    "53": ["Megacrisp", "IQ BERRIES"],
    "54": ["Megaearly", "IQ BERRIES"],
    "55": ["Megagem", "IQ BERRIES"],
    "56": ["Megagrand", "IQ BERRIES"],
    "57": ["Megastar", "IQ BERRIES"],

    // UNIVERSIDAD DE FLORIDA
    "04": ["Springhigh", "Univ. Florida"],
    "33": ["Magnus", "Univ. Florida"],
    "39": ["Colosus", "Univ. Florida"],
    "42": ["Raven", "Univ. Florida"],
    "43": ["Avanti", "Univ. Florida"],
    "46": ["Patrecia", "Univ. Florida"],
    "47": ["Wayne", "Univ. Florida"],
    "48": ["Bobolink", "Univ. Florida"],
    "52": ["Keecrisp", "Universidad de Florida"],
    "67": ["Albus (FL 11-051)", "Universidad de Florida"],
    "68": ["Falco (FL 17-141)", "Universidad de Florida"],
    "69": ["FL-11-158", "Universidad de Florida"],
    "70": ["FL-10-179", "Universidad de Florida"],
    "B9": ["FL 19-006", "Universidad de Florida"],
    "C3": ["FL09-279", "Universidad de Florida"],
    "C4": ["FL12-236", "Universidad de Florida"],

    // OTROS / EXPERIMENTALES
    "25": ["Mixto", ""],
    "32": ["I+D", ""],
    "44": ["Merliah", "Mountain Blue"],
    "62": ["FCM15-000", "_"],
    "63": ["FCM15-010", "_"],
    "64": ["FCM-17010", "_"],
    "65": ["Valentina", "_"]
  };

  // ===============================
  // ELEMENTOS DOM (ARÁNDANO)
  // ===============================
  const fileInput = document.getElementById("filePlagasArandano");
  const runReviewBtn = document.getElementById("runReviewPlagasArandano");
  const reviewAllBtn = document.getElementById("reviewAllPlagasArandano");
  const exportExcelErroresBtn = document.getElementById("exportExcelErroresPlagasArandano");
  const clearBtn = document.getElementById("clearDataPlagasArandano");
  const exportBtn = document.getElementById("exportPlagasArandano");

  const inspectionSelect = document.getElementById("inspectionDatePlagasArandano");
  const cosechaSelect = document.getElementById("cosechaDatePlagasArandano");

  const resultsHeader = document.getElementById("resultsHeaderPlagasArandano");
  const resultsBody = document.getElementById("resultsBodyPlagasArandano");
  const resultsTable = document.getElementById("resultsTablePlagasArandano");
  const resumenTodasFechasEl = document.getElementById("resumenTodasFechasPlagasArandano");
  const tableWrapPlagasEl = document.getElementById("tableWrapPlagasArandano");

  if (!fileInput || !inspectionSelect || !cosechaSelect || !runReviewBtn || !exportBtn || !reviewAllBtn || !exportExcelErroresBtn) {
    console.error("Faltan elementos DOM requeridos. Revisa tu HTML.");
    return;
  }

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

  // Todo + export Excel errores: deshabilitados hasta cargar Excel válido.
  setPlagasAuxButtonsDisabled(true);

  // ===============================
  // ESTADO GLOBAL
  // ===============================
  let rawData = [];
  let processedData = [];
  let columns = [];
  let excelLoaded = false;
  let columnsToShow = [];

  // ===============================
  // FORMATEO FECHAS dd/MM/yyyy
  // ===============================
  /** Valor visible de celda SheetJS (evita [object Object] en la tabla). */
  function valorCeldaParaMostrar(val) {
    if (val === null || val === undefined) return "";
    if (typeof val === "object" && val !== null) {
      if ("w" in val && val.w != null && String(val.w).trim() !== "") return String(val.w);
      if ("v" in val && val.v !== undefined && val.v !== null && val.v !== "") return String(val.v);
      if (Array.isArray(val.r)) return val.r.map(x => (x && x.w != null ? x.w : x.t) || "").join("");
    }
    return String(val);
  }

  /** Gramos / Excel: 500, 500.00, "500,00", $500.00, celdas numéricas, coma miles */
  function parseFlexibleNumber(val) {
    if (val === null || val === undefined) return NaN;
    if (typeof val === "object" && val !== null) {
      // SheetJS: no usar v si es "" — si no, se ignora w ("500.00") y falla el parseo
      if ("v" in val && val.v !== undefined && val.v !== null && val.v !== "") {
        return parseFlexibleNumber(val.v);
      }
      if ("w" in val && val.w !== undefined && val.w !== null && String(val.w).trim() !== "") {
        return parseFlexibleNumber(val.w);
      }
      if (Array.isArray(val.r)) {
        const rich = val.r.map(x => (x && x.w != null ? x.w : x.t) || "").join("");
        if (rich.trim()) return parseFlexibleNumber(rich);
      }
    }
    // General / número: 500, 500.00, 502.5 (sin depender del formato de celda en Excel)
    if (typeof val === "number" && !Number.isNaN(val)) return val;
    let s = String(val).trim().replace(/^\uFEFF/, "").replace(/<[^>]+>/g, "");
    s = s.replace(/\u00A0/g, " ").replace(/[\u200B-\u200D\uFEFF]/g, "");
    s = s.replace(/[$€£]/g, "").trim();
    // dígitos ancho completo → ASCII
    s = s.replace(/[\uFF10-\uFF19]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0xFF10 + 0x30));
    s = s.replace(/\uFF0E/g, ".").replace(/\uFF0C/g, ",");
    s = s.replace(/\s/g, "");
    if (s === "") return NaN;
    // "1.500,00" (EU) → última coma es decimal
    const lastComma = s.lastIndexOf(",");
    const lastDot = s.lastIndexOf(".");
    if (lastComma > lastDot) {
      s = s.replace(/\./g, "").replace(",", ".");
    } else if (lastComma >= 0 && lastDot >= 0) {
      s = s.replace(/,/g, "");
    } else {
      s = s.replace(",", ".");
    }
    let n = Number(s);
    if (!Number.isNaN(n)) return n;
    // fallback: primer número reconocible en el texto
    const m = s.match(/-?\d+(?:[.,]\d+)?/);
    if (!m) return NaN;
    let t = m[0].replace(",", ".");
    if (t.includes(".") && t.lastIndexOf(".") !== t.indexOf(".")) {
      t = t.replace(/\./g, "").replace(",", ".");
    }
    n = Number(t);
    return Number.isNaN(n) ? NaN : n;
  }

  function formatExcelDate(str) {
    if (!str) return "";
    str = str.toString().trim();
    if (/^\d{8}$/.test(str)) {
      const y = str.slice(0, 4), m = str.slice(4, 6), d = str.slice(6, 8);
      return `${d}/${m}/${y}`;
    }
    if (/\d{1,2}\/\d{1,2}\/\d{4}/.test(str)) {
      const [d, m, y] = str.split("/");
      return `${d.padStart(2, "0")}/${m.padStart(2, "0")}/${y}`;
    }
    return "";
  }

  // ===============================
  // RESET DASHBOARD
  // ===============================
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

    const totalFilasDiv = document.getElementById("totalFilasPlagasArandano");
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

  // ===============================
  // SINCRONIZAR FECHAS
  // ===============================
  function syncFechas() {
    if (!excelLoaded) return;
    const sel = inspectionSelect.value;
    if (!sel) return;

    const matchingRows = rawData.filter(r => r[71] === sel);
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

  // ===============================
  // CARGAR EXCEL
  // ===============================
  fileInput.addEventListener("change", e => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = ev => {
      const wb = XLSX.read(new Uint8Array(ev.target.result), { type: "array" });
      let sheet = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, raw: false });

      sheet.splice(0, 5);

      if ((sheet[0]?.length || 0) !== 111) {
        Swal.fire("Error", "El Excel de Plagas Arándano debe tener 111 columnas", "error");
        resetDashboard();
        return;
      }

      columns = sheet[0].map((h, i) => ({ id: `col_${i + 1}`, header: h, originalIndex: i }));
      rawData = sheet.slice(1).filter(r => r.some(c => c !== "" && c !== null));

      const tipo = rawData[0][1]?.toString().trim().toUpperCase();
      if (tipo !== "PMPAR") {
        Swal.fire("Error", "Archivo no corresponde a Plagas Arándano (PMPAR)", "error");
        resetDashboard();
        return;
      }

      rawData.forEach(r => {
        r[19] = formatExcelDate(r[19]);
        r[71] = formatExcelDate(r[71]);
      });

      columnsToShow = [
        0, 1, 4, 6,
        9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19,
        28, 29, 30, 31, 32,
        71,
        ...Array.from({ length: 28 }, (_, i) => i + 83)
      ];

      const inspectionDates = [...new Set(rawData.map(r => r[71]).filter(Boolean))];
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

  // ===============================
  // COLUMNAS A REVISAR
  // ===============================
  const columnasARevisar = [
    ...Array.from({ length: 11 }, (_, i) => i + 10).filter(i => i !== 16),
    ...Array.from({ length: 5 }, (_, i) => i + 28),
    19, 71,
    ...Array.from({ length: 28 }, (_, i) => i + 83)
  ];

  // ===============================
  // REVISAR
  // ===============================
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

  /** Misma reglas que la revisión por fecha; muta `rows` (añade _errors). Devuelve lotes duplicados en ese subconjunto. */
  function ejecutarValidacion(rows) {
    const isEmpty = v => v === null || v === undefined || (typeof v === "string" && v.trim() === "");

    const celdaVaciaObligatoria = v => {
      if (v === null || v === undefined) return true;
      if (typeof v === "object" && v !== null) {
        const t = valorCeldaParaMostrar(v).trim();
        return t === "";
      }
      if (typeof v === "string") return v.trim() === "";
      if (typeof v === "number") return Number.isNaN(v);
      return false;
    };

    const loteCount = {};
    rows.forEach(r => {
      const lote = (r[9] || "").toString().trim();
      if (!lote) return;
      loteCount[lote] = (loteCount[lote] || 0) + 1;
    });

    const lotesDuplicados = Object.keys(loteCount).filter(k => loteCount[k] > 1);

    rows.forEach(row => {
      row._errors = [];
      row._errorLote = false;

      const addError = (i, msg) => row._errors.push(`Columna ${i + 1}: ${msg}`);

      const lote = (row[9] || "").toString().trim();
      if (isEmpty(lote) || lote.length !== 10 || loteCount[lote] > 1) row._errorLote = true;

      // Cant. muestra: Excel col. 11 (K) = row[10] (índice JS 0-based). addError(i) muestra "Columna i+1".
      for (let i = 10; i <= 20; i++) {
        if (i === 16) continue;
        if (celdaVaciaObligatoria(row[i])) addError(i, "Obligatorio");
      }

      // Cant. muestra: solo 500 gr; número o formato General (500 / 500.00 / 500,00), no texto arbitrario
      if (!celdaVaciaObligatoria(row[10])) {
        const n = parseFlexibleNumber(row[10]);
        if (!Number.isFinite(n)) {
          addError(10, "Debe ser 500 gramos (solo numérico o formato General)");
        } else if (Math.round(n * 100) !== 50000) {
          addError(10, "Debe ser exactamente 500 gramos");
        }
      }

      for (let i = 28; i <= 32; i++) if (celdaVaciaObligatoria(row[i])) addError(i, "Obligatorio");

      for (let i = 83; i <= 110; i++) if (celdaVaciaObligatoria(row[i])) addError(i, "No debe estar vacío");

      const f20 = row[19], f72 = row[71];
      if (!f20 || !f72) {
        addError(19, "Fecha obligatoria");
      } else if (f20 !== f72) {
        addError(19, "Debe ser igual a fecha de inspección");
      }

      const col11 = valorCeldaParaMostrar(row[11]).trim();
      if (celdaVaciaObligatoria(row[11])) {
        addError(11, "Campo vacío - debe ser 'Gramos'");
      } else if (col11 !== "Gramos") {
        addError(11, "Debe ser 'Gramos'");
      }

      // Productor (Excel col. 13, row[12]): exactamente 10 dígitos
      const col12 = valorCeldaParaMostrar(row[12]).trim();
      if (!celdaVaciaObligatoria(row[12]) && !/^\d{10}$/.test(col12)) {
        addError(12, "Debe tener exactamente 10 dígitos (Productor)");
      }

      const col13 = valorCeldaParaMostrar(row[13]).trim();
      if (celdaVaciaObligatoria(row[13])) {
        addError(13, "Campo vacío - formato: TG##-########");
      } else if (!/^TG\d{2}-\d{8}$/.test(col13)) {
        addError(13, "Formato inválido. Debe ser TG##-######## (ej: TG16-00002196)");
      }

      const col14 = valorCeldaParaMostrar(row[14]).trim();
      const col15 = valorCeldaParaMostrar(row[15]).trim();

      if (celdaVaciaObligatoria(row[14])) {
        addError(14, "Campo vacío - debe ser un número del 0 al 9");
      } else if (!/^[0-9]$/.test(col14)) {
        addError(14, "Debe ser un solo dígito del 0 al 9");
      }

      if (celdaVaciaObligatoria(row[15])) {
        addError(15, "Campo vacío - debe ser un número del 0 al 9");
      } else if (!/^[0-9]$/.test(col15)) {
        addError(15, "Debe ser un solo dígito del 0 al 9");
      }

      const col18 = valorCeldaParaMostrar(row[18]).trim();
      if (celdaVaciaObligatoria(row[18])) {
        addError(18, "Campo vacío - código de variedad requerido");
      } else if (!VAR_MAP[col18]) {
        addError(18, "Código de variedad no válido");
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

  /** Misma tabla de errores que la vista "Revisar Excel" (columnas, rojos, title). */
  function htmlTablaFilasConError(filas) {
    if (!filas || !filas.length) return "";
    const thead = columnsToShow.map(i =>
      `<th style="padding:8px 10px;border:1px solid #ddd;background:#f0f4f8;font-weight:600;color:#333;text-align:center">${htmlEscape(columns[i].header)}</th>`
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
        return `<td style="padding:6px 8px;border:1px solid #ddd;text-align:center;${extra}"${title}>${htmlEscape(val)}</td>`;
      }).join("");
      return `<tr>${tds}</tr>`;
    }).join("");
    return `
      <div style="margin-top:14px">
        <div style="font-weight:600;color:#0E1B40;font-size:14px;margin-bottom:8px">Filas con error</div>
        <div class="table-wrap" style="overflow-x:auto">
          <table style="width:100%;border-collapse:collapse;font-size:14px;background:#fff">
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
      <div style="max-width:920px;margin:0 auto 20px;padding:20px 8px">
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

    const totalDiv = document.getElementById("totalFilasPlagasArandano");
    if (totalDiv) {
      totalDiv.textContent = `Archivo: ${rawData.length} filas · ${items.length} fecha(s) de inspección analizada(s)`;
      totalDiv.style.display = "block";
    }

    exportBtn.disabled = true;

    Swal.fire({
      icon: "success",
      title: "Análisis completo",
      text: `Se revisaron ${items.length} fecha(s).`,
      timer: 2200,
      showConfirmButton: true,
      confirmButtonColor: "#2f7cc0"
    });
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
    const fechas = ordenarFechasDDMMYYYY([...new Set(rawData.map(r => r[71]).filter(Boolean))]);
    if (!fechas.length) {
      Swal.fire("Sin fechas", "No hay fechas de inspección en el archivo.", "info");
      return;
    }
    const items = [];
    fechas.forEach(fecha => {
      const filas = rawData.filter(r => r[71] === fecha).map(r => [...r]);
      const { lotesDuplicados } = ejecutarValidacion(filas);
      const filasConError = filas.filter(r => r._errorLote || (r._errors && r._errors.length > 0));
      items.push({
        fecha,
        lotesDuplicados,
        totalFilas: filas.length,
        filasConError: filasConError.length,
        filasDetalle: filasConError,
        tieneErrores: filasConError.length > 0 || lotesDuplicados.length > 0
      });
    });
    mostrarResumenTodasFechas(items);
  });

  function procesarTodoExcel() {
    ocultarResumenTodasFechas();
    processedData = rawData.filter(r => r[71] === inspectionSelect.value);
    limpiarMarcasValidacion(processedData);
    const { lotesDuplicados } = ejecutarValidacion(processedData);
    if (lotesDuplicados.length) {
      Swal.fire("Lotes duplicados", lotesDuplicados.join("<br>"), "warning");
    }
    renderTable();
  }

  // ===============================
  // OBTENER TITLE PARA TOOLTIPS
  // ===============================
  function obtenerTituloColumna(i) {
    const titles = {
      9: "Debe tener 10 caracteres",
      10: "Debe ser exactamente 500 gramos (numérico o General)",
      11: "Debe ser 'Gramos'",
      12: "Productor: exactamente 10 dígitos",
      13: "Formato: TG##-######## (ej: TG16-00002196)",
      14: "Debe ser un solo dígito del 0 al 9",
      15: "Debe ser un solo dígito del 0 al 9",
      18: "Código de variedad no válido",
      19: "Debe ser igual a fecha de inspección",
      71: "Fecha de inspección"
    };

    // Columnas obligatorias
    if ((i >= 10 && i <= 20 && i !== 16) || 
        (i >= 28 && i <= 32) || 
        (i >= 83 && i <= 110)) {
      return titles[i] || "Campo obligatorio";
    }

    return titles[i] || "";
  }

  function mensajeErrorColumna(r, colIdx) {
    const pref = `Columna ${colIdx + 1}: `;
    const err = (r._errors || []).find(e => e.startsWith(pref));
    if (err) return err.slice(pref.length);
    return obtenerTituloColumna(colIdx);
  }

  // ===============================
  // RENDER (SOLO FILAS CON ERROR)
  // ===============================
  function renderTable() {
    resultsHeader.innerHTML = "";
    resultsBody.innerHTML = "";

    // 🔴 FILTRAR SOLO FILAS CON ERROR
    const filasConError = processedData.filter(r => 
      r._errorLote || (r._errors && r._errors.length > 0)
    );

    if (filasConError.length === 0) {
      // ✅ MENSAJE CUANDO NO HAY ERRORES
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.colSpan = columnsToShow.length;
      td.textContent = "No se encontraron errores en esta inspección";
      td.style.textAlign = "center";
      td.style.fontWeight = "bold";
      td.style.padding = "12px";
      td.style.background = "#e8f5e9";
      td.style.color = "#2e7d32";
      tr.appendChild(td);
      resultsBody.appendChild(tr);

      Swal.fire({
        icon: "success",
        title: "Todo correcto",
        text: "No se encontraron errores en la inspección."
      });
    } else {
      // 📋 HEADERS
      columnsToShow.forEach(i => {
        const th = document.createElement("th");
        th.textContent = columns[i].header;
        resultsHeader.appendChild(th);
      });

      // 📋 FILAS CON ERROR
      filasConError.forEach(r => {
        const tr = document.createElement("tr");
        columnsToShow.forEach(i => {
          const td = document.createElement("td");
          const raw = r[i];
          const val = raw === null || raw === undefined || raw === "" ? "" : valorCeldaParaMostrar(raw);
          td.textContent = val;

          let tieneError = false;

          // 🔴 ERROR EN LOTE
          if (i === 9 && r._errorLote) {
            tieneError = true;
            if (!val) {
              td.style.background = "red";
              td.style.color = "white";
            } else {
              td.style.color = "red";
            }
          }

          // 🔴 ERRORES EN OTRAS COLUMNAS
          if (columnasARevisar.includes(i) && r._errors.some(e => e.startsWith(`Columna ${i + 1}: `))) {
            tieneError = true;
            if (!val) {
              td.style.background = "red";
              td.style.color = "white";
            } else {
              td.style.color = "red";
            }
          }

          // 💡 TITLE = mensaje real de _errors (evita tooltip engañoso)
          if (tieneError) {
            td.title = mensajeErrorColumna(r, i);
          }

          tr.appendChild(td);
        });
        resultsBody.appendChild(tr);
      });
    }

    resultsTable.hidden = false;
    exportBtn.disabled = false;
    mostrarTotalPorFecha();
  }

  function mostrarTotalPorFecha() {
    const totalDiv = document.getElementById("totalFilasPlagasArandano");
    if (!totalDiv) return;

    const totalRegistros = processedData.length;

    totalDiv.textContent = `Total registros: ${totalRegistros}`;
    totalDiv.style.display = "block";
  }

  // ===============================
  // EXPORTAR (SWEETALERT FECHAS)
  // ===============================
  exportBtn.addEventListener("click", () => {
    if (!processedData.length) return;

    let fechasSeleccionadas = [
      ...new Set(rawData.map(r => r[71]).filter(Boolean))
    ];

    const renderCards = () => `
      <div class="swal-fechas-container">
        ${fechasSeleccionadas.map(f => {
          const esActual = f === inspectionSelect.value;
          return `
            <div class="swal-fecha-card ${esActual ? "actual" : ""}">
              <span class="swal-fecha-text">${f}</span>
              ${esActual ? "" : `<button class="swal-fecha-delete" data-fecha="${f}">×</button>`}
            </div>
          `;
        }).join("")}
      </div>
    `;

    Swal.fire({
      title: "Exportar Excel",
      html: `
        <div style="text-align:center">
          <b>Fecha en revisión:</b>
          ${inspectionSelect.value}<br><br>
          <b>Fechas a unir</b>
          ${renderCards()}
        </div>
      `,
      width: 650,
      showCancelButton: true,
      showDenyButton: true,
      confirmButtonColor: "#2f7cc0",
      confirmButtonText: "Solo esta fecha",
      denyButtonText: "Unir seleccionadas",
      cancelButtonText: "Cancelar",
      didOpen: () => {
        const container = Swal.getHtmlContainer();
        container.addEventListener("click", e => {
          const btn = e.target.closest(".swal-fecha-delete");
          if (!btn) return;

          const f = btn.dataset.fecha;
          if (f === inspectionSelect.value) return;

          fechasSeleccionadas = fechasSeleccionadas.filter(x => x !== f);

          Swal.update({
            html: `
              <div style="text-align:center">
                <b>Fecha en revisión:</b><br>
                ${inspectionSelect.value}<br><br>
                <b>Fechas a unir</b>
                ${renderCards()}
              </div>
            `
          });
        });
      }
    }).then(res => {

      if (res.isConfirmed) {
        exportExcelFiltrado(
          processedData,
          `Export_Plaga_Arandano_${inspectionSelect.value.replaceAll("/", "-")}.xlsx`
        );
      }

      if (res.isDenied) {
        const dataUnida = rawData.filter(r =>
          fechasSeleccionadas.includes(r[71])
        );

        exportExcelFiltrado(
          dataUnida,
          "Export_Plaga_Arandano_Fechas_Unidas.xlsx"
        );
      }
    });
  });

  // Excel 15–17 → JS 14–16 (18 Excel / 17 JS sin tocar); Excel 29–111 excepto 72 → JS 28–110 excepto 71
  function columnaExportComoNumero(jsCol) {
    return (
      (jsCol >= 14 && jsCol <= 16) ||
      (jsCol >= 28 && jsCol <= 110 && jsCol !== 71)
    );
  }

  function valorExportConNumeroParcial(val, jsCol) {
    if (val === undefined || val === null) return undefined;
    if (typeof val === "string" && val.trim() === "") return undefined;
    if (!columnaExportComoNumero(jsCol)) return val;
    const n = parseFlexibleNumber(val);
    if (Number.isNaN(n)) return valorCeldaParaMostrar(val);
    return n;
  }

  // ===============================
  // EXPORT: TODO EL EXCEL + FILAS CON ERROR EN ROJO MUY SUAVE (xlsx-js-style)
  // ===============================
  function exportExcelCompletoErroresResaltados() {
    const COLS = 111;

    const filas = rawData.map(r => [...r]);
    ejecutarValidacion(filas);

    const wsData = [columns.map(col => col.header)];
    filas.forEach(row => {
      const linea = [];
      for (let c = 0; c < COLS; c++) linea.push(valorExportConNumeroParcial(row[c], c));
      wsData.push(linea);
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    const SOFT_RED = "FFFFEBEB";
    for (let C = 0; C < COLS; C++) {
      const addr = XLSX.utils.encode_cell({ r: 0, c: C });
      if (!ws[addr]) continue;
      const prev = ws[addr].s || {};
      ws[addr].s = { ...prev, font: { ...prev.font, bold: true } };
    }
    filas.forEach((row, i) => {
      const conError = row._errorLote || (row._errors && row._errors.length > 0);
      if (!conError) return;
      const rSheet = i + 1;
      for (let C = 0; C < COLS; C++) {
        const addr = XLSX.utils.encode_cell({ r: rSheet, c: C });
        if (!ws[addr]) ws[addr] = { t: "s", v: "" };
        ws[addr].s = {
          fill: { patternType: "solid", fgColor: { rgb: SOFT_RED } }
        };
      }
    });

    XLSX.utils.book_append_sheet(wb, ws, "Plagas");
    const nombre = `Plagas_Arandano_ErroresResaltados_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, nombre, { cellStyles: true });

    Swal.fire({
      icon: "success",
      title: "Excel generado",
      text: "Las filas con error aparecen con fondo rojo muy suave.",
      timer: 2200,
      showConfirmButton: true,
      confirmButtonColor: "#2f7cc0"
    });
  }

  // ===============================
  // FUNCIÓN EXPORT (número: 15–17 y 29–111 Excel excepto 18 y 72; JS 14–16 y 28–110 excepto 17 y 71)
  // ===============================
  function exportExcelFiltrado(data, nombreArchivo) {
    const wsData = [];

    wsData.push([
      ...Array.from({ length: 10 }, (_, i) => columns[i + 9].header),
      columns[19].header,
      "",
      ...Array.from({ length: 5 }, (_, i) => columns[i + 28].header),
      "", "",
      ...columns.slice(33).map(c => c.header)
    ]);

    data.forEach(r => {
      wsData.push([
        ...Array.from({ length: 10 }, (_, i) => valorExportConNumeroParcial(r[i + 9], i + 9)),
        valorExportConNumeroParcial(r[19], 19),
        "",
        ...Array.from({ length: 5 }, (_, i) => valorExportConNumeroParcial(r[i + 28], i + 28)),
        "", "",
        ...r.slice(33).map((v, i) => valorExportConNumeroParcial(v, i + 33))
      ]);
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, "Export");
    XLSX.writeFile(wb, nombreArchivo);
  }

  // ===============================
  // LIMPIAR
  // ===============================
  clearBtn.addEventListener("click", () => {
    resetDashboard();
    Swal.fire({ icon: "success", title: "Datos limpiados", text: "Ya puedes cargar otro Excel.", timer: 1200, showConfirmButton: false });
  });

  resetDashboard();
})();