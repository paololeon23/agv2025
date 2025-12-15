(() => {
  // ===============================
  // ELEMENTOS DEL DOM
  // ===============================
  const fileInput = document.getElementById('file');
  const inspectionDateInput = document.getElementById('inspectionDate');
  const updateDateInput = document.getElementById('updateDate');
  const runReviewBtn = document.getElementById('runReview');

  const headerRow = document.getElementById('resultsHeader');
  const bodyRows = document.getElementById('resultsBody');
  const table = document.getElementById('resultsTable');

  let rawData = [];
  let columns = [];

  // ===============================
  // COLUMNAS A MOSTRAR (VALIDADAS)
  // ===============================
  const columnsToShow = [
    9,   // 10 → Lote
    ...Array.from({length:8},(_,i)=>10+i), // 11-18
    28,29, // 29-30
    30,31,32, // 31-33
    38,54,65,68,88, // 39,55,66,69,89
    19,50,69,86 // 20,51,70,87
  ];

  // ===============================
  // CARGAR EXCEL
  // ===============================
  fileInput.addEventListener('change', e => {
    const f = e.target.files[0];
    if (!f) return;

    const reader = new FileReader();
    reader.onload = ev => {
      const data = ev.target.result;
      let workbook;
      try {
        workbook = XLSX.read(new Uint8Array(data), { type: 'array' });
      } catch {
        workbook = XLSX.read(data, { type: 'binary' });
      }

      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false });
      if (!json.length) return alert("Archivo vacío");

      rawData = json;
      initColumns();

      // ===============================
      // LLENAR INPUTS DE FECHAS AUTOMÁTICAMENTE
      // ===============================
      const inspectionDates = [...new Set(rawData.slice(1).map(r=>r[50]).filter(d=>d))];
      const updateDates = [...new Set(rawData.slice(1).map(r=>r[69]).filter(d=>d))];

      if(inspectionDates.length === 1) inspectionDateInput.value = formatDate(inspectionDates[0]);
      if(updateDates.length === 1) updateDateInput.value = formatDate(updateDates[0]);

      runReviewBtn.disabled = false;
    };

    reader.readAsArrayBuffer(f);
  });

  // ===============================
  // INICIALIZAR COLUMNAS CON ID ÚNICO
  // ===============================
  function initColumns() {
    const headers = rawData[0].map(h => h || "");
    columns = headers.map((h, i) => ({
      id: `columna_${i + 1}`,
      header: h,
      originalIndex: i
    }));
  }

  // ===============================
  // BOTÓN DE REVISIÓN
  // ===============================
  runReviewBtn.addEventListener('click', () => {
    const rowsWithErrors = validateRows();
    renderTable(rowsWithErrors);
  });

  // ===============================
  // VALIDACIONES Y CÁLCULOS
  // ===============================
  function validateRows() {
    const rowsWithErrors = [];
    const lotSet = new Set();

    for (let r = 1; r < rawData.length; r++) {
      const row = rawData[r];
      const errors = [];

      // 1. Lote
      const lote = row[9] || "";
      if (lote.length !== 10 || lotSet.has(lote)) errors.push("Columna 10 inválida");
      lotSet.add(lote);

      // 2. Columnas 11-18 → no vacías
      for (let c = 10; c <= 17; c++) {
        if (!row[c] || row[c].toString().trim() === "") errors.push(`Columna ${c+1} vacía`);
      }

      // 3. 29-30, 31-33
      if ((row[28] || "") != "59") errors.push("Columna 29 debe ser 59");
      if ((row[29] || "") != "53") errors.push("Columna 30 debe ser 53");
      for (let c = 30; c <= 32; c++) {
        if (!row[c] || row[c].toString().trim() === "") errors.push(`Columna ${c+1} vacía`);
      }

      // 4. 39,55,66,69,89
      [38,54,65,68,88].forEach(c=>{
        const val = (row[c]||"").toString().toUpperCase();
        if(val!=="CUMPLE" && val!=="NO CUMPLE") errors.push(`Columna ${c+1} inválida`);
      });

      // 5. suma_tonalidades columnas 56-65
      const suma_tonalidades = row.slice(55,65).reduce((a,b)=>a+(parseFloat(b)||0),0);
      row._suma_tonalidades = suma_tonalidades;
      if(Math.abs(suma_tonalidades-parseFloat(row[10]||0))>0.01) errors.push("Suma tonalidades ≠ columna 11");

      // 6. suma_calibres columnas 134-138
      const suma_calibres = row.slice(133,138).reduce((a,b)=>a+(parseFloat(b)||0),0);
      row._suma_calibres = suma_calibres;
      if(Math.abs(suma_calibres-100)>0.1) errors.push("Suma calibres ≠ 100");

      // 7. Fecha inspección columna 51
      const dateValue = row[50]||"";
      row._inspectionDate = dateValue;

      // 8. Fecha cosecha columna 20 ≤ columna 51
      const cosecha = row[19]||"";
      if(cosecha && dateValue && new Date(cosecha)>new Date(dateValue)) errors.push("Fecha cosecha > Fecha inspección");

      // 9. Fecha actualización LMR columna 70
      const updateDate = row[69]||"";
      row._updateDate = updateDate;

      // 10. T° Pulpa columna 87 ≤ 30
      const tempPulpa = parseFloat(row[86]||0);
      if(tempPulpa>30) errors.push("T° Pulpa > 30");

      if(errors.length){
        row._errors = errors;
        rowsWithErrors.push(row);
      }
    }

    return rowsWithErrors;
  }

  // ===============================
  // RENDER TABLA CON COLUMNAS CALCULADAS Y COL ID
  // ===============================
  function renderTable(rows){
    if(!headerRow || !bodyRows) return;
    headerRow.innerHTML = "";
    bodyRows.innerHTML = "";

    // Encabezados: ID + columnas validadas + calculadas
    const headers = ["ID"].concat(columnsToShow.map(idx=>columns[idx]?.header||`Columna ${idx+1}`));
    headers.push("suma_tonalidades","suma_calibres");

    headers.forEach(h=>{
      const th = document.createElement("th");
      th.textContent=h;
      headerRow.appendChild(th);
    });

    // Filas
    rows.forEach(row=>{
      const tr = document.createElement("tr");

      // Columna ID
      const tdId = document.createElement("td");
      tdId.textContent = row[0]||"";
      tr.appendChild(tdId);

      // Columnas validadas
      columnsToShow.forEach(idx=>{
        const td = document.createElement("td");
        const val = row[idx]||"";
        td.textContent=val;

        if(row._errors && row._errors.some(e=>e.includes(`Columna ${idx+1}`))){
          if(!val || val.toString().trim()===""){
            td.style.backgroundColor="red"; // celda vacía → fondo rojo
          } else {
            td.style.color="red"; // valor incorrecto → texto rojo
          }
        }

        tr.appendChild(td);
      });

      // suma_tonalidades
      const tdSumaT = document.createElement("td");
      tdSumaT.textContent=row._suma_tonalidades?.toFixed(2)||"";
      if(row._errors && row._errors.some(e=>e.includes("Suma tonalidades"))){
        if(tdSumaT.textContent==="") tdSumaT.style.backgroundColor="red";
        else tdSumaT.style.color="red";
      }
      tr.appendChild(tdSumaT);

      // suma_calibres
      const tdSumaC = document.createElement("td");
      tdSumaC.textContent=row._suma_calibres?.toFixed(2)||"";
      if(row._errors && row._errors.some(e=>e.includes("Suma calibres"))){
        if(tdSumaC.textContent==="") tdSumaC.style.backgroundColor="red";
        else tdSumaC.style.color="red";
      }
      tr.appendChild(tdSumaC);

      bodyRows.appendChild(tr);
    });

    table.hidden=false;
  }

  function formatDate(str){
    const parts = str.split("/");
    if(parts.length!==3) return "";
    const day = parts[0].padStart(2,"0");
    const month = parts[1].padStart(2,"0");
    const year = parts[2];
    return `${year}-${month}-${day}`;
  }

})();
