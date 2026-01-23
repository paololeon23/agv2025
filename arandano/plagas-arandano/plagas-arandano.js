(() => {
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
    totalFilasDiv.style.display = "none"; // 👈 ocultar
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
        Swal.fire("Error", "El Excel de Arándano debe tener 111 columnas", "error");
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
        0, 1, 6,
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

      const f20 = row[19], f72 = row[71];
      if (!f20 || !f72) addError(19, "Fecha obligatoria");
      else if (new Date(formatExcelDate(f20)) > new Date(formatExcelDate(f72))) addError(19, "Debe ser <= inspección");
    });

    renderTable();
  }

  // ===============================
  // RENDER
  // ===============================
  function renderTable() {
    resultsHeader.innerHTML = "";
    resultsBody.innerHTML = "";

    columnsToShow.forEach(i => {
      const th = document.createElement("th");
      th.textContent = columns[i].header;
      resultsHeader.appendChild(th);
    });

    processedData.forEach(r => {
      const tr = document.createElement("tr");
      columnsToShow.forEach(i => {
        const td = document.createElement("td");
        const val = r[i] || "";
        td.textContent = val;

        if (i === 9 && r._errorLote) {
          if (!val) {
            td.style.background = "red";
            td.style.color = "white";
          } else {
            td.style.color = "red";
          }
        }

        if (columnasARevisar.includes(i) && r._errors.some(e => e.includes(`Columna ${i + 1}`))) {
          if (!val) {
            td.style.background = "red";
            td.style.color = "white";
          } else {
            td.style.color = "red";
          }
        }

        tr.appendChild(td);
      });
      resultsBody.appendChild(tr);
    });

    resultsTable.hidden = false;
    exportBtn.disabled = false;
    mostrarTotalPorFecha();
  }

function mostrarTotalPorFecha() {
  const totalDiv = document.getElementById("totalFilasPlagasArandano");
  if (!totalDiv) return;

  const totalValidos = processedData.filter(r => 
    !r._errorLote && (!r._errors || r._errors.length === 0)
  ).length;

  totalDiv.textContent = `Total registros válidos: ${totalValidos}`;
  totalDiv.style.display = "block"; // 👈 mostrar solo al revisar
}


// ===============================
// EXPORTAR (SWEETALERT FECHAS)
// ===============================
exportBtn.addEventListener("click", () => {
  if (!processedData.length) return;

  // 👉 fechas de INSPECCIÓN (col 71)
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
        if (f === inspectionSelect.value) return; // no borrar actual

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

    // SOLO FECHA ACTUAL
    if (res.isConfirmed) {
      exportExcelFiltrado(
        processedData,
        `Export_Plaga_Arandano_${inspectionSelect.value.replaceAll("/", "-")}.xlsx`
      );
    }

    // UNIR FECHAS
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
// FUNCIÓN EXPORT (reutilizable)
// ===============================
function exportExcelFiltrado(data, nombreArchivo) {
  const wsData = [];

  const toNumberExcept = (val, excelCol) => {
    if (excelCol === 10 || excelCol === 19) return val;
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
      ...Array.from({ length: 10 }, (_, i) => toNumberExcept(r[i + 9], i + 10)),
      formatExcelDate(r[19]),
      "",
      ...Array.from({ length: 5 }, (_, i) => toNumberExcept(r[i + 28], i + 29)),
      "", "",
      ...r.slice(33).map((v, i) => toNumberExcept(v, i + 34))
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
    Swal.fire({ icon: "success", title: "Datos limpiados",text:"Ya puedes cargar otro Excel.", timer: 1200, showConfirmButton: false });
  });

  resetDashboard();
})();
