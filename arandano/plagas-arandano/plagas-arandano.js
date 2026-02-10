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
  const clearBtn = document.getElementById("clearDataPlagasArandano");
  const exportBtn = document.getElementById("exportPlagasArandano");

  const inspectionSelect = document.getElementById("inspectionDatePlagasArandano");
  const cosechaSelect = document.getElementById("cosechaDatePlagasArandano");

  const resultsHeader = document.getElementById("resultsHeaderPlagasArandano");
  const resultsBody = document.getElementById("resultsBodyPlagasArandano");
  const resultsTable = document.getElementById("resultsTablePlagasArandano");

  if (!fileInput || !inspectionSelect || !cosechaSelect || !runReviewBtn || !exportBtn) {
    console.error("Faltan elementos DOM requeridos. Revisa tu HTML.");
    return;
  }

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
  runReviewBtn.addEventListener("click", () => {
    if (!excelLoaded || !inspectionSelect.value) return;
    procesarTodoExcel();
  });

  function procesarTodoExcel() {
    processedData = rawData.filter(r => r[71] === inspectionSelect.value);

    const isEmpty = v => v === null || v === undefined || (typeof v === "string" && v.trim() === "");

    const loteCount = {};
    processedData.forEach(r => {
      const lote = (r[9] || "").toString().trim();
      if (!lote) return;
      loteCount[lote] = (loteCount[lote] || 0) + 1;
    });

    const lotesDuplicados = Object.keys(loteCount).filter(k => loteCount[k] > 1);
    if (lotesDuplicados.length) {
      Swal.fire("Lotes duplicados", lotesDuplicados.join("<br>"), "warning");
    }

    processedData.forEach(row => {
      row._errors = [];
      row._errorLote = false;

      const addError = (i, msg) => row._errors.push(`Columna ${i + 1}: ${msg}`);

      const lote = (row[9] || "").toString().trim();
      if (isEmpty(lote) || lote.length !== 10 || loteCount[lote] > 1) row._errorLote = true;

      for (let i = 10; i <= 20; i++) {
        if (i === 16) continue;
        if (isEmpty(row[i])) addError(i, "Obligatorio");
      }

      for (let i = 28; i <= 32; i++) if (isEmpty(row[i])) addError(i, "Obligatorio");

      for (let i = 83; i <= 110; i++) if (isEmpty(row[i])) addError(i, "No debe estar vacío");

      // 🆕 VALIDAR: Fecha Cosecha (19) debe ser IGUAL a Fecha Inspección (71)
      const f20 = row[19], f72 = row[71];
      if (!f20 || !f72) {
        addError(19, "Fecha obligatoria");
      } else if (f20 !== f72) {
        addError(19, "Debe ser igual a fecha de inspección");
      }

      // 🆕 VALIDAR COLUMNA 11 (Excel 12): Debe ser "Gramos"
      const col11 = (row[11] || "").toString().trim();
      if (isEmpty(row[11])) {
        addError(11, "Campo vacío - debe ser 'Gramos'");
      } else if (col11 !== "Gramos") {
        addError(11, "Debe ser 'Gramos'");
      }

      // 🆕 VALIDAR COLUMNA 13 (Excel 14): Debe comenzar con "TG"
      const col13 = (row[13] || "").toString().trim();
      if (isEmpty(row[13])) {
        addError(13, "Campo vacío - debe comenzar con 'TG'");
      } else if (!col13.startsWith("TG")) {
        addError(13, "Debe comenzar con 'TG'");
      }

      // 🆕 VALIDAR COLUMNAS 14 y 15 (Excel 15 y 16): Deben ser numéricos de 0 a 9 (un solo dígito)
      const col14 = (row[14] || "").toString().trim();
      const col15 = (row[15] || "").toString().trim();

      if (isEmpty(row[14])) {
        addError(14, "Campo vacío - debe ser un número del 0 al 9");
      } else if (!/^[0-9]$/.test(col14)) {
        addError(14, "Debe ser un solo dígito del 0 al 9");
      }

      if (isEmpty(row[15])) {
        addError(15, "Campo vacío - debe ser un número del 0 al 9");
      } else if (!/^[0-9]$/.test(col15)) {
        addError(15, "Debe ser un solo dígito del 0 al 9");
      }

      // 🆕 VALIDAR COLUMNA 18 (Excel 19): Debe existir en VAR_MAP
      const col18 = (row[18] || "").toString().trim();
      if (isEmpty(row[18])) {
        addError(18, "Campo vacío - código de variedad requerido");
      } else if (!VAR_MAP[col18]) {
        addError(18, "Código de variedad no válido");
      }
    });

    renderTable();
  }

  // ===============================
  // OBTENER TITLE PARA TOOLTIPS
  // ===============================
  function obtenerTituloColumna(i) {
    const titles = {
      9: "Debe tener 10 caracteres",
      11: "Debe ser 'Gramos'",
      13: "Debe comenzar con 'TG'",
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
          const val = r[i] || "";
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
          if (columnasARevisar.includes(i) && r._errors.some(e => e.includes(`Columna ${i + 1}`))) {
            tieneError = true;
            if (!val) {
              td.style.background = "red";
              td.style.color = "white";
            } else {
              td.style.color = "red";
            }
          }

          // 💡 AGREGAR TITLE SOLO SI HAY ERROR
          if (tieneError) {
            td.title = obtenerTituloColumna(i);
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

  // ===============================
  // FUNCIÓN EXPORT (CONVERTIR A NÚMERO)
  // ===============================
  function exportExcelFiltrado(data, nombreArchivo) {
    const wsData = [];

    // 🔢 COLUMNAS QUE NO SE CONVIERTEN A NÚMERO (JS index)
    const COLUMNAS_TEXTO = [9, 18, 19, 71];

    const toNumberExcept = (val, jsIndex) => {
      if (COLUMNAS_TEXTO.includes(jsIndex)) return val;
      const n = Number(val);
      return val === "" || isNaN(n) ? val : n;
    };

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
        ...Array.from({ length: 10 }, (_, i) => toNumberExcept(r[i + 9], i + 9)),
        formatExcelDate(r[19]),
        "",
        ...Array.from({ length: 5 }, (_, i) => toNumberExcept(r[i + 28], i + 28)),
        "", "",
        ...r.slice(33).map((v, i) => toNumberExcept(v, i + 33))
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