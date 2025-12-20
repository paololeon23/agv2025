(() => {

  // ===============================
  // ELEMENTOS DOM
  // ===============================
  const fileInput = document.getElementById("filePT");
  const runReviewBtn = document.getElementById("runReviewPT");
  const exportBtn = document.getElementById("exportPT");
  const clearBtn = document.getElementById("clearDataPT");

  const inspectionSelect = document.getElementById("inspectionDatePT");
  const cosechaSelect = document.getElementById("cosechaDatePT");
  const embalajeSelect = document.getElementById("embalajeDatePT");
  const updateSelect = document.getElementById("updateDatePT");

  const resultsHeader = document.getElementById("resultsHeaderPT");
  const resultsBody = document.getElementById("resultsBodyPT");
  const resultsTable = document.getElementById("resultsTablePT");

  // ===============================
  // ESTADO GLOBAL
  // ===============================
  let rawData = [];
  let processedData = [];
  let columns = [];
  let excelLoaded = false;

  const columnsToShow = [
    0,1,6,9,10,37,38,40,53,54,55,
    69,71,73,75,76,83,91,92,94,95
  ];

  // ===============================
  // FECHAS
  // ===============================
  function formatDate(str){
    if(!str) return "";
    const p = str.split("/");
    if(p.length !== 3) return "";
    return `${p[2]}-${p[1].padStart(2,"0")}-${p[0].padStart(2,"0")}`;
  }

  // ===============================
  // LLENAR SELECT
  // ===============================
  function fillSelect(select, dates){
    select.innerHTML = "";
    dates.forEach(d=>{
      const o = document.createElement("option");
      o.value = formatDate(d);
      o.textContent = d;
      select.appendChild(o);
    });
  }

  // ===============================
  // RESET TOTAL (CLAVE)
  // ===============================
  function resetDashboard(){
    rawData = [];
    processedData = [];
    excelLoaded = false;

    resultsHeader.innerHTML = "";
    resultsBody.innerHTML = "";
    resultsTable.hidden = true;

    inspectionSelect.innerHTML = `<option disabled selected>Selecciona una fecha</option>`;
    inspectionSelect.disabled = true;

    cosechaSelect.innerHTML =
    embalajeSelect.innerHTML =
    updateSelect.innerHTML = `<option selected>Se actualizará</option>`;

    cosechaSelect.disabled =
    embalajeSelect.disabled =
    updateSelect.disabled = true;

    runReviewBtn.disabled = true;
    exportBtn.disabled = true;

    fileInput.value = "";

    // ✅ Limpiar estilos de alerta de updateSelect
    updateSelect.style.border = "";
    updateSelect.style.color = "";

    // ✅ Limpiar total de filas
    const totalFilasDiv = document.getElementById("totalFilas");
    if(totalFilasDiv) totalFilasDiv.textContent = "";
  }

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

    if (sheet.length < 7) {
      Swal.fire("Error", "Archivo inválido", "error");
      resetDashboard();
      return;
    }

    // Eliminar filas arriba del header
    sheet.splice(0, 5);

    columns = sheet[0].map((h, i) => ({ header: h, index: i }));
    rawData = sheet.slice(1).filter(r => r.some(c => c));

    // ===============================
    // 🔹 VALIDACIÓN DE COLUMNAS Y TIPO
    // ===============================

    const totalColumns = sheet[0]?.length || 0;
    if (totalColumns !== 184) {
      Swal.fire({
        icon: "error",
        title: "Estructura de Excel incorrecta",
        html: `
          El archivo cargado tiene <b>${totalColumns} columnas</b>.<br><br>
          El formato estándar <b>PTCUV</b> debe tener exactamente <b>184 columnas</b>.<br><br>
          ⚠️ Revisa el Excel antes de cargarlo.
        `
      });
      fileInput.value = "";
      return;
    }

    // Validar segunda fila (primer registro real)
    const secondRow = rawData[0];
    if (!secondRow || !secondRow[1] || secondRow[1].toString().trim() === "") {
      Swal.fire({
        icon: "error",
        title: "Archivo inválido",
        text: "La segunda fila está vacía o no contiene datos en la columna 2."
      });
      fileInput.value = "";
      return;
    }

    // Validar tipo PTCUV
    const tipo = secondRow[1].toString().trim().toUpperCase();
    if (tipo !== "PTCUV") {
      Swal.fire({
        icon: "error",
        title: "¡Archivo inválido!",
        text: "Este archivo no corresponde a materia prima de Uva (PTCUV)."
      });
      fileInput.value = "";
      return;
    }

    // ===============================
    // FECHAS
    // ===============================
    const inspectionDates = [...new Set(rawData.map(r => r[53]).filter(Boolean))];
    const cosechaDates    = [...new Set(rawData.map(r => r[51]).filter(Boolean))];
    const embalajeDates   = [...new Set(rawData.map(r => r[52]).filter(Boolean))];
    const updateDates     = [...new Set(rawData.map(r => r[70]).filter(Boolean))];

    fillSelect(inspectionSelect, inspectionDates);
    fillSelect(cosechaSelect, cosechaDates);
    fillSelect(embalajeSelect, embalajeDates);
    fillSelect(updateSelect, updateDates);

    // Auto seleccionar primera fecha
    if (inspectionDates.length) {
      inspectionSelect.value = formatDate(inspectionDates[0]);
    }

    inspectionSelect.disabled = inspectionDates.length === 0;
    cosechaSelect.disabled = embalajeSelect.disabled = updateSelect.disabled = true;

    excelLoaded = true;
    runReviewBtn.disabled = inspectionDates.length === 0;

    inspectionSelect.dispatchEvent(new Event("change"));
  };

  reader.readAsArrayBuffer(file);
});


  // ===============================
// FUNCIONES AUXILIARES
// ===============================
function normalizeDate(value) {
  if (!value) return "";
  if (value instanceof Date) {
    const d = value.getDate().toString().padStart(2, "0");
    const m = (value.getMonth() + 1).toString().padStart(2, "0");
    const y = value.getFullYear();
    return `${d}/${m}/${y}`;
  }
  // Si ya es string en formato dd/MM/yyyy
  const parts = value.split("/");
  if (parts.length === 3) {
    const [d, m, y] = parts;
    return `${d.padStart(2,'0')}/${m.padStart(2,'0')}/${y}`;
  }
  return value;
}


    // ===============================
    // SINCRONIZAR FECHAS (UNA VEZ)
    // ===============================
    inspectionSelect.addEventListener("change", () => {
      if(!excelLoaded) return;

      const sel = inspectionSelect.value;

      // Filtrar todas las filas que coinciden con la fecha inspección
      const matchingRows = rawData.filter(r => formatDate(r[53]) === sel);
      if(!matchingRows.length) return;

      // Sincronizar fechas cosecha y embalaje con la primera fila que coincide
      cosechaSelect.value  = formatDate(matchingRows[0][51] || "");
      embalajeSelect.value = formatDate(matchingRows[0][52] || "");

      // Extraer todas las fechas LMR (columna 71 / r[70]) de esas filas
      const lmrDates = [...new Set(matchingRows.map(r => formatDate(r[70])).filter(Boolean))];

      // Mostrar la primera fecha LMR en el select
      updateSelect.value = lmrDates[0] || "";

      // Cambiar estilo del select si hay más de una fecha LMR
      if(lmrDates.length > 1){  // >1 significa 2 o más fechas
          updateSelect.style.border = "2px solid red";
          updateSelect.style.color = "red";
          // Mostrar alerta con Swal
          Swal.fire({
              icon: 'warning',
              title: 'Atención',
              html: `Se han encontrado <b>${lmrDates.length}</b> fechas LMR para esta inspección.<br>Consulta a la supervisora si es correcto.`,
              confirmButtonText: 'Aceptar'
          });
      } else {
          updateSelect.style.border = "";
          updateSelect.style.color = "";
          updateSelect.title = "";
      }
      });

    // ===============================
    // REVISAR
    // ===============================
    runReviewBtn.addEventListener("click", () => {
      if(!excelLoaded || !inspectionSelect.value) return;

      processedData = rawData.filter(
        r => formatDate(r[53]) === inspectionSelect.value
      );

      processedData.forEach(r => {
        const suma = Array.from({length:10}, (_, i) => parseFloat(r[59 + i]) || 0)
          .reduce((a, b) => a + b, 0);
        r._sumaTonalidades = suma;
        r._sumaCorrecta = Math.abs(suma - (parseFloat(r[10]) || 0)) < 0.01;
      });

      renderTable();

      // Mostrar total de filas
      document.getElementById("totalFilas").textContent =
      `Total filas: ${processedData.length}`;

    });


  // ===============================
  // RENDER TABLA
  // ===============================
  function renderTable(){
    resultsHeader.innerHTML = "";
    resultsBody.innerHTML = "";

    [...columnsToShow.map(i=>columns[i].header),"Suma Tonalidades"]
      .forEach(h=>{
        const th = document.createElement("th");
        th.textContent = h;
        resultsHeader.appendChild(th);
      });

    processedData.forEach(r=>{
      const tr = document.createElement("tr");

      columnsToShow.forEach(i=>{
        const td = document.createElement("td");
        td.textContent = r[i] || "";
        tr.appendChild(td);
      });

      const td = document.createElement("td");
      td.textContent = r._sumaTonalidades.toFixed(2);
      if(!r._sumaCorrecta) td.style.color = "red";
      tr.appendChild(td);

      resultsBody.appendChild(tr);
    });

    resultsTable.hidden = false;
    exportBtn.disabled = false;
  }

  // ===============================
  // EXPORTAR
  // ===============================
  exportBtn.addEventListener("click", () => {
    if(!processedData.length) return;

    const wsData = [
      columnsToShow.map(i=>columns[i].header)
    ];

    processedData.forEach(r=>{
      wsData.push(columnsToShow.map(i=>r[i]));
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, "Export");

    XLSX.writeFile(wb, `Export_Fecha_${inspectionSelect.value}.xlsx`);
  });

  // ===============================
  // LIMPIAR
  // ===============================
  clearBtn.addEventListener("click", () => {
    resetDashboard();
    Swal.fire({
      icon:"success",
      title:"Datos limpiados",
      text: "Ya puedes cargar otro Excel.",
      timer:1200,
      showConfirmButton:false
    });
  });

  // INIT
  resetDashboard();

})();
