(() => {
  // ===============================
  // ELEMENTOS DEL DOM
  // ===============================
  const fileInput = document.getElementById('file');
  const inspectionDateSelect = document.getElementById('inspectionDate');
  const updateDateSelect = document.getElementById('updateDate');
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

    // ===============================
    // 🔹 CORRECCIÓN: Ignorar filas extra arriba del encabezado
    // ===============================
    // Eliminar 5 primeras filas
    json.splice(0, 5);

    // Encabezado (fila 6 original)
    const headers = json[0];
    let dataRows = json.slice(1);

    // Eliminar filas vacías completas
    dataRows = dataRows.filter(row => row.some(cell => cell !== null && cell !== ""));

    // ===============================
    // VALIDACIONES
    // ===============================

    // 1️⃣ Excel vacío o solo encabezados
    if (!json || json.length < 2) {
      Swal.fire({
        icon: "error",
        title: "Archivo inválido",
        text: "El archivo no contiene registros para evaluar."
      });
      fileInput.value = "";
      return;
    }

    // 1️⃣🅱️ Validar cantidad EXACTA de columnas (187)
    const totalColumns = json[0]?.length || 0;

    if (totalColumns !== 187) {
      Swal.fire({
        icon: "error",
        title: "Estructura de Excel incorrecta",
        html: `
          El archivo cargado tiene <b>${totalColumns} columnas</b>.<br><br>
          El formato estándar <b>MPCUV</b> debe tener exactamente <b>187 columnas</b>.<br><br>
          ⚠️ Revisa bien el Excel antes de cargarlo, ya que se ha agregado o eliminado
          una columna del formato oficial.
        `
      });
      fileInput.value = "";
      return;
    }

    // 2️⃣ Validar fila 2 (primer registro real)
    const secondRow = json[1];

    if (
      !secondRow ||
      !secondRow[1] ||
      secondRow[1].toString().trim() === ""
    ) {
      Swal.fire({
        icon: "error",
        title: "Archivo inválido",
        text: "La segunda fila está vacía o no contiene el tipo de materia prima."
      });
      fileInput.value = "";
      return;
    }

    // 3️⃣ Validar SOLO MPCUV
    const tipo = secondRow[1].toString().trim().toUpperCase();

    if (tipo !== "MPCUV") {
      Swal.fire({
        icon: "error",
        title: "¡Archivo inválido!",
        text: "Este archivo no corresponde a materia prima de Uva (MPCUV)."
      });
      fileInput.value = "";
      return;
    }

    // ===============================
    // ARCHIVO VÁLIDO
    // ===============================
    rawData = json;
    initColumns();

    // ===============================
    // LLENAR SELECTS DE FECHAS
    // ===============================
    const inspectionDates = [...new Set(
      rawData.slice(1).map(r => r[50]).filter(d => d)
    )];

    const updateDates = [...new Set(
      rawData.slice(1).map(r => r[69]).filter(d => d)
    )];

    fillSelect(inspectionDateSelect, inspectionDates);
    fillSelect(updateDateSelect, updateDates);

          if (inspectionDates.length) inspectionDateSelect.disabled = false;
          runReviewBtn.disabled = false;

        inspectionDateSelect.addEventListener('change', () => {
          const selectedInspection = inspectionDateSelect.value;

          // Filtrar solo filas de esta inspección
          const matchingRows = rawData.slice(1).filter(r => formatDate(r[50]) === selectedInspection);

          // Extraer todas las fechas LMR de estas filas
          const lmrDates = [...new Set(matchingRows.map(r => formatDate(r[69])).filter(Boolean))];

          // Mostrar la primera fecha LMR en el select
          updateDateSelect.value = lmrDates[0] || "";

          // Cambiar estilo si hay más de una fecha LMR
          if(lmrDates.length > 1){
            updateDateSelect.style.border = "2px solid red";
            updateDateSelect.style.color = "red";

            Swal.fire({
              icon: 'warning',
              title: 'Atención',
              html: `Se han encontrado <b>${lmrDates.length}</b> fechas LMR para esta inspección.<br>Consulta a la supervisora si es correcto.`,
              confirmButtonText: 'Aceptar'
            });
          } else {
            updateDateSelect.style.border = "";
            updateDateSelect.style.color = "";
          }
        });

        };

          reader.readAsArrayBuffer(f);
        });

        // ===============================
        // FUNCIÓN PARA LLENAR SELECT
        // ===============================
        function fillSelect(selectElement, dates) {
            selectElement.innerHTML = "";
            dates.forEach(d => {
            const option = document.createElement("option");
            option.value = formatDate(d);  // yyyy-mm-dd
            option.textContent = d;        // dd/mm/yyyy
            selectElement.appendChild(option);
            });
            if(dates.length === 1){
            selectElement.value = formatDate(dates[0]);
            }
        }

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

       function formatDateDMY(dateStr) {
        if (!dateStr) return "";
        const [year, month, day] = dateStr.split("-");
        return `${day}-${month}-${year}`;
        }

        // ===============================
        // BOTÓN DE REVISIÓN
        // ===============================
        runReviewBtn.addEventListener('click', () => {
        const selectedInspection = inspectionDateSelect.value; 
        const selectedUpdate = updateDateSelect.value; 

        Swal.fire({
            title: 'Revisión de fechas',
            html: `
            Se va a revisar:<br>
            <b>Fecha inspección:</b> ${formatDateDMY(selectedInspection)}<br>
            <b>Fecha LMR:</b> ${formatDateDMY(selectedUpdate)}
            `,
            icon: 'info',
            confirmButtonText: 'Continuar'
        }).then(result => {

            if (result.isConfirmed) {
            const rowsWithErrors = validateRows(selectedInspection, selectedUpdate);
            renderTable(rowsWithErrors);

            if (rowsWithErrors.length === 0) {
                Swal.fire({
                title: '¡Todo correcto!',
                text: 'No se encontraron errores en las filas seleccionadas.',
                icon: 'success'
                });
            }
            }

        });
        });

        // ===============================
        // VALIDACIONES Y FILTRADO POR FECHAS
        // ===============================
        function validateRows(selectedInspection, selectedUpdate) {
            const rowsWithErrors = [];
            const lotSet = new Set();

            for (let r = 1; r < rawData.length; r++) {
            const row = rawData[r];

            const inspection = formatDate(row[50] || "");
            const update = formatDate(row[69] || "");
            // Filtrar solo por fecha de inspección
            if (inspection !== selectedInspection) continue;

            const errors = [];

            const lote = row[9] || "";
            if (lote.length !== 10 || lotSet.has(lote)) errors.push("Columna 10 inválida");
            lotSet.add(lote);

            for (let c = 10; c <= 17; c++) {
                if (!row[c] || row[c].toString().trim() === "") errors.push(`Columna ${c+1} vacía`);
            }

            if ((row[28] || "") != "59") errors.push("Columna 29 debe ser 59");
            if ((row[29] || "") != "53") errors.push("Columna 30 debe ser 53");
            for (let c = 30; c <= 32; c++) {
                if (!row[c] || row[c].toString().trim() === "") errors.push(`Columna ${c+1} vacía`);
            }

            [38,54,65,68,88].forEach(c => {
            const val = (row[c] || "").toString().trim().toUpperCase();

            // ❌ vacío o NO CUMPLE = error
            if (val === "" || val === "NO CUMPLE") {
                errors.push(`Columna ${c+1} NO CUMPLE`);
            }

            // ❌ cualquier otro texto también es error
            else if (val !== "CUMPLE") {
                errors.push(`Columna ${c+1} inválida`);
            }
            });

            const suma_tonalidades = row.slice(55,65).reduce((a,b)=>a+(parseFloat(b)||0),0);
            row._suma_tonalidades = suma_tonalidades;
            if(Math.abs(suma_tonalidades-parseFloat(row[10]||0))>0.01) errors.push("Suma tonalidades ≠ columna 11");

            const suma_calibres = row.slice(133,138).reduce((a,b)=>a+(parseFloat(b)||0),0);
            row._suma_calibres = suma_calibres;
            if(Math.abs(suma_calibres-100)>0.1) errors.push("Suma calibres ≠ 100");

            row._inspectionDate = inspection;
            row._updateDate = update;

            const cosecha = row[19]||"";
            if(cosecha && inspection && new Date(cosecha)>new Date(inspection)) errors.push("Fecha cosecha > Fecha inspección");

            const rawPulpa = (row[86] || "").toString().trim();
            const tempPulpa = parseFloat(rawPulpa);

            if (rawPulpa === "") {
            errors.push("Columna 87 T° Pulpa vacía");
            }
            else if (isNaN(tempPulpa)) {
            errors.push("Columna 87 T° Pulpa no numérica");
            }
            else if (tempPulpa > 30) {
            errors.push("Columna 87 T° Pulpa > 30");
            }


            if(errors.length){
                row._errors = errors;
                rowsWithErrors.push(row);
            }
            }

            return rowsWithErrors;
        }

  // ===============================
  // RENDER TABLA
  // ===============================
function renderTable(rows){
  if(!headerRow || !bodyRows) return;
  headerRow.innerHTML = "";
  bodyRows.innerHTML = "";

  // ===============================
  // HEADERS
  // ===============================
  const headers = ["ID"]
    .concat(columnsToShow.map(idx => columns[idx]?.header || `Columna ${idx+1}`))
    .concat(["suma_tonalidades", "suma_calibres"]);

  headers.forEach((h, i) => {
    const th = document.createElement("th");
    th.textContent = h;

    // 🔒 columnas fijas (headers)
    if (i === 0) th.classList.add("sticky-col", "sticky-col-1"); // ID
    if (i === 1) th.classList.add("sticky-col", "sticky-col-2"); // Lote
    if (i === 2) th.classList.add("sticky-col", "sticky-col-3"); // Cant Muestra

    headerRow.appendChild(th);
  });

  // ===============================
  // FILAS
  // ===============================
  rows.forEach(row => {
    const tr = document.createElement("tr");

    // ---- ID ----
    const tdId = document.createElement("td");
    tdId.textContent = row[0] || "";
    tdId.classList.add("sticky-col", "sticky-col-1");
    tr.appendChild(tdId);

    // ---- Columnas dinámicas ----
    columnsToShow.forEach((idx, i) => {
      const td = document.createElement("td");
      const val = row[idx] || "";
      td.textContent = val;

      // 🔒 columnas fijas (body)
      if (i === 0) td.classList.add("sticky-col", "sticky-col-2"); // Lote
      if (i === 1) td.classList.add("sticky-col", "sticky-col-3"); // Cant Muestra

      // ❌ errores
      if (row._errors && row._errors.some(e => e.includes(`Columna ${idx+1}`))) {
        if (!val || val.toString().trim() === "") {
          td.style.backgroundColor = "red";
        } else {
          td.style.color = "red";
        }
      }

      tr.appendChild(td);
    });

    // ---- Suma tonalidades ----
    const tdSumaT = document.createElement("td");
    tdSumaT.textContent = row._suma_tonalidades?.toFixed(2) || "";
    if (row._errors && row._errors.some(e => e.includes("Suma tonalidades"))) {
      tdSumaT.style.color = "red";
    }
    tr.appendChild(tdSumaT);

    // ---- Suma calibres ----
    const tdSumaC = document.createElement("td");
    tdSumaC.textContent = row._suma_calibres?.toFixed(2) || "";
    if (row._errors && row._errors.some(e => e.includes("Suma calibres"))) {
      tdSumaC.style.color = "red";
    }
    tr.appendChild(tdSumaC);

    bodyRows.appendChild(tr);
  });

  table.hidden = false;

  // ===============================
  // MOSTRAR TOTAL DE FILAS
  // ===============================
  const totalFilasDiv = document.getElementById("totalFilas");
  if(totalFilasDiv) totalFilasDiv.textContent = `Total filas: ${rows.length}`;
}


  // ===============================
  // FORMATO DE FECHA dd/mm/yyyy → yyyy-mm-dd
  // ===============================
  function formatDate(str){
    const parts = str.split("/");
    if(parts.length!==3) return "";
    const day = parts[0].padStart(2,"0");
    const month = parts[1].padStart(2,"0");
    const year = parts[2];
    return `${year}-${month}-${day}`;
  }

const clearBtn = document.getElementById("clearData");

clearBtn.addEventListener("click", () => {
  // Limpiar tabla
  if (document.getElementById("resultsHeader")) document.getElementById("resultsHeader").innerHTML = "";
  if (document.getElementById("resultsBody")) document.getElementById("resultsBody").innerHTML = "";
  if (document.getElementById("resultsTable")) document.getElementById("resultsTable").hidden = true;

  // Limpiar selects y volver a deshabilitar
  inspectionDateSelect.innerHTML = `<option value="" disabled selected>Selecciona una fecha</option>`;
  inspectionDateSelect.disabled = true;
  updateDateSelect.innerHTML = `<option value="" selected>Se actualizará automáticamente</option>`;
  updateDateSelect.disabled = true;

    // Quitar borde y color rojo del select LMR
  updateDateSelect.style.border = "";
  updateDateSelect.style.color = "";

  // Reset input file
  fileInput.value = "";

  // Deshabilitar botón revisar
  runReviewBtn.disabled = true;

  // Limpiar datos cargados
  rawData = [];

       // ✅ Limpiar total de filas
    const totalFilasDiv = document.getElementById("totalFilas");
    if(totalFilasDiv) totalFilasDiv.textContent = "";

  // Mensaje opcional
  Swal.fire({
    icon: "success",
    title: "Datos limpiados",
    text: "Ya puedes cargar otro Excel.",
    timer: 1500,
    showConfirmButton: false
  });
});



})();
