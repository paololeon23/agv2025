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
        6,
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
      // Ignorar filas extra arriba del encabezado
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

if (inspectionDates.length) {
  inspectionDateSelect.disabled = false;
  inspectionDateSelect.value = formatDate(inspectionDates[0]); // 👈 asegura selección
  validarLMRDinamico(); // 👈 LLAMADA MANUAL (FIX)
}
          runReviewBtn.disabled = false;
          exportBtnMPUVA.disabled = false; // ✅ habilitar botón export

          inspectionDateSelect.addEventListener('change', () => {
              const selectedInspection = inspectionDateSelect.value;

              // 1. Filtrar filas que coinciden con la fecha de inspección seleccionada
              const matchingRows = rawData.slice(1).filter(r => formatDate(r[50]) === selectedInspection);

              // 2. Extraer las fechas LMR únicas
              const lmrDates = [...new Set(matchingRows.map(r => formatDate(r[69])).filter(Boolean))];

              // 3. Llenar el select con las fechas LMR encontradas
              fillSelect(updateDateSelect, lmrDates);

              // 4. Seleccionar la primera fecha LMR por defecto (formateada para el value)
              if (lmrDates.length > 0) {
                updateDateSelect.value = formatDate(lmrDates[0]);
              }

              // 5. EJECUCIÓN EN TIEMPO REAL: Pintar de rojo y lanzar alerta si es necesario
              validarLMRDinamico();
            });

        };

          reader.readAsArrayBuffer(f);
        });

function validarLMRDinamico() {
    const selectedInspection = inspectionDateSelect.value; // yyyy-mm-dd
    if (!selectedInspection) return;

    // Filtramos las filas del Excel
    const matchingRows = rawData.slice(1).filter(r => formatDate(r[50]) === selectedInspection);
    
    // Obtenemos las fechas LMR tal cual vienen en el Excel (sin formatear a ISO todavía)
    // para contar cuántas fechas reales diferentes hay.
    const lmrDatesOriginales = [...new Set(matchingRows.map(r => r[69]).filter(Boolean))];

    updateDateSelect.style.border = "";
    updateDateSelect.style.color = "";
    updateDateSelect.title = ""; // 🆕 LIMPIAR TOOLTIP

    // Si hay más de una fecha LMR distinta en el Excel para esa inspección:
    if (lmrDatesOriginales.length > 1) {
        updateDateSelect.style.border = "2px solid red";
        updateDateSelect.style.color = "red";
        updateDateSelect.title = `⚠️ Se encontraron ${lmrDatesOriginales.length} fechas LMR distintas`; // 🆕 TOOLTIP

        Swal.fire({
            icon: 'warning',
            title: 'Atención',
            html: `Se han encontrado <b>${lmrDatesOriginales.length}</b> fechas LMR distintas para esta inspección.`,
            confirmButtonText: 'Aceptar'
        });
    }
}

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
           validarLMRDinamico();
          const selectedInspection = inspectionDateSelect.value; 
          const selectedUpdate = updateDateSelect.value; 

          // 1️⃣ Revisar filas sin fecha de inspección
          const filasSinFecha = rawData
            .filter(r => !r[50] || r[50].toString().trim() === "")
            .filter(r => !r[50] || r[50].toString().trim() === "")
            .map(r => ({ id: r[0] || "", lote: r[9] || "" }));

          if (filasSinFecha.length > 0) {
            const lista = filasSinFecha
              .map(f => `<div style="color:red; font-weight:bold; text-align:center; margin-bottom:4px;">
                            ID: ${f.id} | Lote: ${f.lote}
                          </div>`)
              .join("");

            Swal.fire({
              icon: "warning",
              title: "Fila(s) sin fecha de inspección",
              html: lista,
              confirmButtonText: "Confirmar",
              allowOutsideClick: false,
              allowEscapeKey: false
            }).then(() => {
              // al confirmar, continuar con la revisión normal
              procesarFilas(selectedInspection, selectedUpdate);
            });

            return; // no continuar hasta que el usuario confirme
          }

          // 2️⃣ Si no hay filas sin fecha, mostrar info de revisión antes de procesar
          Swal.fire({
            title: 'Revisión de fechas',
            html: `
              <div style="line-height:1.0">
              Se va a revisar:<br><br>
              <b>Fecha inspección:</b> ${formatDateDMY(selectedInspection)}<br><br>
              <b>Fecha LMR:</b> ${formatDateDMY(selectedUpdate)}
              </div>
            `,
            icon: 'info',
            confirmButtonText: 'Continuar'
          }).then(result => {
            if (result.isConfirmed) {
              procesarFilas(selectedInspection, selectedUpdate);
            }
          });
        });

        // ===============================
        // Función para procesar filas después de validar fechas
        // ===============================
        function procesarFilas(selectedInspection, selectedUpdate) {
          const rowsWithErrors = validateRows(selectedInspection, selectedUpdate);
          renderTable(rowsWithErrors);

          if (rowsWithErrors.length === 0) {
            Swal.fire({
              title: '¡Todo correcto!',
              text: 'No se encontraron errores en las filas seleccionadas.',
              icon: 'success'
            });
          }
          exportBtnMPUVA.disabled = false; // ✅ habilitar botón export
        }

        // ===============================
        // VALIDACIONES Y FILTRADO POR FECHAS
        // ===============================
// ============================================================
// VALIDACIONES Y FILTRADO POR FECHAS (Lógica 100% Intacta)
// ============================================================
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

        // --- Lote ---
        const lote = row[9] || "";
        if (lote.length !== 10) {
            errors.push("C10: El lote debe tener 10 caracteres");
        } else if (lotSet.has(lote)) {
            errors.push("C10: Este lote está duplicado en el archivo");
        }
        lotSet.add(lote);

        // --- Vacíos obligatorios (11 al 18) ---
        for (let c = 10; c <= 17; c++) {
            if (!row[c] || row[c].toString().trim() === "") {
                errors.push(`C${c+1}: Campo obligatorio vacío`);
            }
        }

        // --- Valores fijos (29 y 30) ---
        if ((row[28] || "") != "59") errors.push("C29: Debe ser valor 59");
        if ((row[29] || "") != "53") errors.push("C30: Debe ser valor 53");

        // --- Vacíos obligatorios (31 al 33) ---
        for (let c = 30; c <= 32; c++) {
            if (!row[c] || row[c].toString().trim() === "") {
                errors.push(`C${c+1}: Campo obligatorio vacío`);
            }
        }

        // --- Cumplimiento (Columnas específicas) ---
        [38, 54, 65, 68, 88].forEach(c => {
            const val = (row[c] || "").toString().trim().toUpperCase();
            if (val === "" || val === "NO CUMPLE") {
                errors.push(`C${c+1}: El estado es NO CUMPLE`);
            } else if (val !== "CUMPLE") {
                errors.push(`C${c+1}: Valor inválido (Usar CUMPLE)`);
            }
        });

        // --- Cálculos de Tonalidades ---
        const suma_tonalidades = row.slice(55, 65).reduce((a, b) => a + (parseFloat(b) || 0), 0);
        row._suma_tonalidades = suma_tonalidades;
        if (Math.abs(suma_tonalidades - parseFloat(row[10] || 0)) > 0.01) {
            errors.push("SUMA_T: No coincide con Cant. Muestra (C11)");
        }

        // --- Cálculos de Calibres ---
        const suma_calibres = row.slice(133, 138).reduce((a, b) => a + (parseFloat(b) || 0), 0);
        row._suma_calibres = suma_calibres;
        if (Math.abs(suma_calibres - 100) > 0.1) {
            errors.push("SUMA_C: La suma debe ser exactamente 100");
        }

        row._inspectionDate = inspection;
        row._updateDate = update;

        // --- Validación de Fechas ---
        const cosecha = row[19] || "";
        if (cosecha && inspection && new Date(cosecha) > new Date(inspection)) {
            errors.push("C20: Cosecha no puede ser posterior a Inspección");
        }

        // --- Temperatura de Pulpa ---
        const rawPulpa = (row[86] || "").toString().trim();
        const tempPulpa = parseFloat(rawPulpa);

        if (rawPulpa === "") {
            errors.push("C87: Temperatura vacía");
        } else if (isNaN(tempPulpa)) {
            errors.push("C87: Debe ser un número");
        } else if (tempPulpa > 30) {
            errors.push("C87: Temperatura excede los 30°C");
        }

        // --- Registro de Errores en la fila ---
        if (errors.length) {
            row._errors = errors;
            rowsWithErrors.push(row);
        }
    }
    return rowsWithErrors;
}

// ============================================================
// RENDER TABLA (Con Tooltips amigables y conteo final)
// ============================================================
function renderTable(rows) {
    if (!headerRow || !bodyRows) return;
    headerRow.innerHTML = "";
    bodyRows.innerHTML = "";

    if (rows.length) {
        // Headers
        const headers = ["ID"]
            .concat(columnsToShow.map(idx => columns[idx]?.header || `Columna ${idx + 1}`))
            .concat(["Suma Tonalidades", "Suma Calibres"]);

        headers.forEach((h, i) => {
            const th = document.createElement("th");
            th.textContent = h;
            // Columnas fijas
            if (i === 0) th.classList.add("sticky-col", "sticky-col-1");
            if (i === 1) th.classList.add("sticky-col", "sticky-col-2");
            if (i === 2) th.classList.add("sticky-col", "sticky-col-3");
            if (i === 3) th.classList.add("sticky-col", "sticky-col-4");
            headerRow.appendChild(th);
        });

        // Filas de datos
        rows.forEach(row => {
            const tr = document.createElement("tr");

            // ID (Fijo)
            const tdId = document.createElement("td");
            tdId.textContent = row[0] || "";
            tdId.classList.add("sticky-col", "sticky-col-1");
            tr.appendChild(tdId);

            // Columnas del cuerpo
            columnsToShow.forEach((idx, i) => {
                const td = document.createElement("td");
                const val = row[idx] || "";
                td.textContent = val;

                // Estilo sticky
                if (i === 0) td.classList.add("sticky-col", "sticky-col-2");
                if (i === 1) td.classList.add("sticky-col", "sticky-col-3");
                if (i === 2) td.classList.add("sticky-col", "sticky-col-4");

                // --- Lógica de Tooltips (TITLE) ---
                if (row._errors) {
                    const errorMsg = row._errors.find(e => e.startsWith(`C${idx + 1}:`));
                    if (errorMsg) {
                        td.title = `❌ ${errorMsg.split(": ")[1]}`; // 🆕 TOOLTIP CON ICONO
                        if (!val || val.toString().trim() === "") {
                            td.style.backgroundColor = "red";
                        } else {
                            td.style.color = "red";
                        }
                    }
                }
                tr.appendChild(td);
            });

            // Celda Suma Tonalidades
            const tdSumaT = document.createElement("td");
            tdSumaT.textContent = row._suma_tonalidades?.toFixed(2) || "";
            const errT = row._errors?.find(e => e.startsWith("SUMA_T:"));
            if (errT) {
                tdSumaT.style.color = "red";
                tdSumaT.title = `❌ ${errT.split(": ")[1]}`; // 🆕 TOOLTIP CON ICONO
            }
            tr.appendChild(tdSumaT);

            // Celda Suma Calibres
            const tdSumaC = document.createElement("td");
            tdSumaC.textContent = row._suma_calibres?.toFixed(2) || "";
            const errC = row._errors?.find(e => e.startsWith("SUMA_C:"));
            if (errC) {
                tdSumaC.style.color = "red";
                tdSumaC.title = `❌ ${errC.split(": ")[1]}`; // 🆕 TOOLTIP CON ICONO
            }
            tr.appendChild(tdSumaC);

            bodyRows.appendChild(tr);
        });
        table.hidden = false;

    } else {
        // Mensaje cuando no hay errores
        const tr = document.createElement("tr");
        const td = document.createElement("td");
        td.colSpan = columnsToShow.length + 3;
        td.textContent = "No se encontraron errores en esta inspección";
        td.style.textAlign = "center";
        td.style.fontWeight = "bold";
        td.style.padding = "12px";
        td.style.background = "#e8f5e9";
        td.style.color = "#2e7d32";
        tr.appendChild(td);
        bodyRows.appendChild(tr);
        table.hidden = false;
    }

    // --- CONTEO FINAL (Manteniendo tu lógica original) ---
    const totalFilasDiv = document.getElementById("totalFilas");
    if (totalFilasDiv) {
        const selectedInspection = inspectionDateSelect.value;
        const totalPorFecha = rawData.slice(1).filter(r => formatDate(r[50]) === selectedInspection).length;
        totalFilasDiv.textContent = `Total filas: ${totalPorFecha}`;
    }
}


      // ===============================
      // FORMATO DE FECHA dd/mm/yyyy → yyyy-mm-dd
      // ===============================
        function formatDate(str){
            if(!str) return ""; // si es undefined o vacío, retorna ""
            const parts = str.toString().split("/");
            if(parts.length!==3) return "";
            const day = parts[0].padStart(2,"0");
            const month = parts[1].padStart(2,"0");
            const year = parts[2];
            return `${year}-${month}-${day}`;
        }

          function formatNumberToDMY(numStr){
              if(!numStr) return "";
              const str = numStr.toString().padStart(8,"0"); // asegura 8 dígitos
              const year = str.slice(0,4);
              const month = str.slice(4,6);
              const day = str.slice(6,8);
              return `${day}/${month}/${year}`;
          }


      // ===============================
      // BOTÓN DE EXPORTAR EXCEL FILTRADO
      // ===============================
      const exportBtnMPUVA = document.getElementById("exportmpuva");

      exportBtnMPUVA.addEventListener("click", () => {
        if (!rawData.length) return;
        const selectedInspection = inspectionDateSelect.value;
        if (!selectedInspection) {
          Swal.fire("Atención", "Selecciona primero una fecha de inspección", "warning");
          return;
        }
        const rowsToExport = rawData.slice(1).filter(r => formatDate(r[50]) === selectedInspection);
        if (rowsToExport.length === 0) {
          Swal.fire("Atención", "No hay filas para la inspección seleccionada.", "warning");
          return;
        }
        const customOrder = [
          19, 50, 0, 9,10,11,12,13, null, null, 16,17,18, null, 28,29,30,31,32, null, null,
          68,54,38,88,65,86,60,61,62,63,64,55,56,57,58,59,71,67,48,66,49,34,35,40,75,41,85,52,51,83,74,82,81,37,46,44,47,78,87,53,72,76,84,45,79,36,33,39,77,70,80,42,43,73,
          123,124,125,126,127,128,129,130,131,132,133,134,135,136,137,
          106,107,108,109,110,111,112,113,114,115,116,117,118,119,120,121,122,
          89,90,91,92,93,94,95,96,97,98,99,100,101,102,103,104,105,
          null,null,null,null,null,14,15,138,139,140,141,142,143,144,145,146,147,148,149,150,151,152,153,154,155,156,157,158,159,160,161,162,163,164,165,166,167,168,169,170,171
        ];

        const exportArray = [];
        // Encabezados
        const headerRow = customOrder.map(idx => idx === null ? "" : columns[idx]?.header || `Columna ${idx+1}`);
        exportArray.push(headerRow);

        // Filas
        rowsToExport.forEach(row => {
        const newRow = customOrder.map(idx => {
            if (idx === null) return ""; 
            let val = row[idx] || "";
            // Solo columna 20 (idx 19) → formatear a dd/mm/yyyy
            if (idx === 19) val = formatNumberToDMY(val);
            return val;
          });
          exportArray.push(newRow);
        });

        const ws = XLSX.utils.aoa_to_sheet(exportArray);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Filtrado");

        XLSX.writeFile(wb, `MPUVA_Filtrado_${selectedInspection}.xlsx`);

        Swal.fire({
          icon: "success",
          title: "¡Exportado!",
          text: "El Excel filtrado se ha generado correctamente."
        });
      });

    // ===============================
    // BOTÓN DE LIMPIAR
    // ===============================
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
      updateDateSelect.title = ""; // 🆕 LIMPIAR TOOLTIP

      // Reset input file
      fileInput.value = "";

      // Deshabilitar botón revisar
      runReviewBtn.disabled = true;
      exportBtnMPUVA.disabled = true;

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
        timer: 1000,
        showConfirmButton: false
      });
    });

})();