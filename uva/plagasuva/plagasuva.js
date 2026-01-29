(() => {
  // ===============================
  // ELEMENTOS DOM
  // ===============================
      const fileInput = document.getElementById("filePlagas");
      const runReviewBtn = document.getElementById("runReviewPlagas");
      const clearBtn = document.getElementById("clearDataPlagas");
      const exportBtn = document.getElementById("exportPlagasuva");

      const inspectionSelect = document.getElementById("inspectionDatePlagas");
      const cosechaSelect = document.getElementById("cosechaDatePlagas");

      const resultsHeader = document.getElementById("resultsHeaderPlagas");
      const resultsBody = document.getElementById("resultsBodyPlagas");
      const resultsTable = document.getElementById("resultsTablePlagas");

      if(!fileInput || !inspectionSelect || !cosechaSelect || !runReviewBtn || !exportBtn){
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
    function formatExcelDate(str){
      if(!str) return "";
      str = str.toString().trim();
      if(/^\d{8}$/.test(str)){
          const y = str.slice(0,4), m = str.slice(4,6), d = str.slice(6,8);
          return `${d}/${m}/${y}`;
      }
      if(/\d{1,2}\/\d{1,2}\/\d{4}/.test(str)){
          const parts = str.split("/");
          const [d,m,y] = parts;
          return `${d.padStart(2,"0")}/${m.padStart(2,"0")}/${y}`;
      }
      return "";
    }

    // ===============================
    // RESET DASHBOARD
    // ===============================
    function resetDashboard(){
      rawData = [];
      processedData = [];
      columns = [];
      excelLoaded = false;

      resultsHeader.innerHTML="";
      resultsBody.innerHTML="";
      resultsTable.hidden=true;

      inspectionSelect.innerHTML=`<option disabled selected>Selecciona una fecha</option>`;
      inspectionSelect.disabled=true;

      cosechaSelect.innerHTML=`<option selected>Auto-Fecha</option>`;
      cosechaSelect.disabled=true;
      cosechaSelect.style.border="";
      cosechaSelect.style.color="";
      cosechaSelect.title=""; // 🆕 LIMPIAR TOOLTIP

      runReviewBtn.disabled=true;
      exportBtn.disabled=true;
      fileInput.value="";

      const totalFilasDiv = document.getElementById("totalFilasPlagas");
      if(totalFilasDiv) totalFilasDiv.textContent="";
    }
    // ===============================
    // SINCRONIZAR FECHAS
    // ===============================
    function syncFechas(){
      if(!excelLoaded) return;
      const sel = inspectionSelect.value;
      if(!sel) return;

      const matchingRows = rawData.filter(r => r[56] === sel);
      if(!matchingRows.length) {
        cosechaSelect.value = "";
        return;
      }

      const cosecha = matchingRows[0][19] || "";
      cosechaSelect.innerHTML = "";
      const o = document.createElement("option");
      o.value = cosecha;
      o.textContent = cosecha || "Auto-Fecha";
      cosechaSelect.appendChild(o);
      cosechaSelect.value = cosecha;
      cosechaSelect.disabled = true; // siempre disabled

      // Validación cosecha <= inspección
      if(cosecha){
        const [d1,m1,y1] = sel.split("/").map(Number);
        const [d2,m2,y2] = cosecha.split("/").map(Number);
        const fechaIns = new Date(y1,m1-1,d1);
        const fechaCosecha = new Date(y2,m2-1,d2);

        if(fechaCosecha > fechaIns){
          cosechaSelect.style.border="2px solid red";
          cosechaSelect.style.color="red";
          cosechaSelect.title=`❌ Fecha de cosecha (${cosecha}) es mayor que fecha de inspección (${sel})`; // 🆕 TOOLTIP
          Swal.fire("Atención","La fecha de cosecha es mayor que la fecha de inspección","warning");
        } else {
          cosechaSelect.style.border="";
          cosechaSelect.style.color="";
          cosechaSelect.title=""; // 🆕 LIMPIAR TOOLTIP
        }
      }
    }

    inspectionSelect.addEventListener("change", syncFechas);

    // ===============================
    // CARGAR EXCEL
    // ===============================
    fileInput.addEventListener("change", e=>{
      const file = e.target.files[0];
      if(!file) return;

      const reader = new FileReader();
      reader.onload = ev=>{
        const wb = XLSX.read(new Uint8Array(ev.target.result), {type:"array"});
        let sheet = XLSX.utils.sheet_to_json(
          wb.Sheets[wb.SheetNames[0]],
          {header:1, raw:false}
        );

        if(sheet.length < 7){
          Swal.fire("Error","Archivo inválido, muy pocas filas","error");
          resetDashboard();
          return;
        }

        sheet.splice(0,5);

        const totalColumns = sheet[0]?.length || 0;
        if(totalColumns !== 105){
          Swal.fire(
            "Error",
            `Número de columnas incorrecto. Se esperaba 105 pero hay ${totalColumns}`,
            "error"
          );
          resetDashboard();
          return;
        }

        columns = sheet[0].map((h,i)=>({
          id:`columna_${i+1}`,
          header:h,
          originalIndex:i
        }));

        rawData = sheet.slice(1).filter(r => r.some(c => c !== null && c !== ""));

        const tipo = rawData[0][1]?.toString().trim().toUpperCase();
        if(tipo !== "PMPU"){
          Swal.fire("Error","Archivo no corresponde a Plagas Uva (PMPU)","error");
          resetDashboard();
          return;
        }

        // Formatear fechas
        rawData.forEach(r=>{
          r[19] = formatExcelDate(r[19]); // fecha cosecha (Excel 20)
          r[56] = formatExcelDate(r[56]); // fecha inspección (Excel 57)
        });

        columnsToShow = [
          0,1,6,
          9,10,11,12,13,14,15,16,17,18,19,
          28,29,30,31,32,
          56
        ];
        for(let i=79;i<=104;i++) columnsToShow.push(i);

        const inspectionDates = [...new Set(
          rawData.map(r=>r[56]).filter(v=>v)
        )];

        inspectionSelect.innerHTML="";
        inspectionDates.forEach(d=>{
          const o=document.createElement("option");
          o.value=d;
          o.textContent=d;
          inspectionSelect.appendChild(o);
        });

        if(inspectionDates.length){
          inspectionSelect.value = inspectionDates[0];
        }

        inspectionSelect.disabled = inspectionDates.length === 0;
        excelLoaded = true;
        runReviewBtn.disabled = inspectionDates.length === 0;

        syncFechas();
      };
      reader.readAsArrayBuffer(file);
    });

    // ===============================
    // COLUMNAS A REVISAR (0-based)
    // ===============================
    const columnasARevisar = [
      ...Array.from({length:9},(_,i)=>i+10),   // 11–19
      19,                                     // 20
      ...Array.from({length:5},(_,i)=>i+28),   // 29–33
      29,                                     // 30 fijo
      56,                                     // 57 obligatorio
      58,                                     // 59 fijo
      ...Array.from({length:26},(_,i)=>i+79)   // 80–105
    ];

// ===============================
// REVISAR
// ===============================
runReviewBtn.addEventListener("click", () => {
  if (!excelLoaded || !inspectionSelect.value) return;

  // ===============================
  // 1️⃣ CHEQUEAR FILAS SIN FECHA INSPECCIÓN
  // ===============================
  const filasSinFecha = rawData
    .filter(r => !r[56] || r[56].toString().trim() === "")
    .map(r => ({
      id: r[0] || "",
      lote: r[9] || ""
    }));

  if (filasSinFecha.length > 0) {
    const lista = filasSinFecha
          .map(f => `
      <div style="color:red; font-weight:bold; text-align:center; margin-bottom:4px;"> Revisar:
        ID: ${f.id} - Lote: ${f.lote}
      </div>
    `)
      .join("<br>");

    Swal.fire({
      icon: "warning",
      title: "Fila(s) sin fecha de inspección",
      html: `<div style="text-align:left">${lista}</div>`,
      confirmButtonText: "Confirmar",
      allowOutsideClick: false,
      allowEscapeKey: false
    }).then(() => {
      // ===============================
      // 2️⃣ CONTINUAR CON LA REVISIÓN NORMAL
      // ===============================
      procesarTodoExcel();
    });

    return; // esperar confirmación
  }

  // Si no hay filas sin fecha, procesar normalmente
  procesarTodoExcel();
});

// ===============================
// FUNCION PARA PROCESAR TODO EL EXCEL
// ===============================
function procesarTodoExcel() {
  processedData = rawData.filter(r => r[56] === inspectionSelect.value);

  const isEmpty = v =>
    v === null ||
    v === undefined ||
    (typeof v === "string" && v.trim() === "");

  // ===============================
  // 2️⃣ CONTAR LOTES
  // ===============================
  const loteCount = {};
  processedData.forEach(r => {
    const lote = (r[9] || "").toString().trim();
    if (!lote) return;
    loteCount[lote] = (loteCount[lote] || 0) + 1;
  });

  // ===============================
  // 3️⃣ VALIDACIONES
  // ===============================
  processedData.forEach(row => {
    row._errorLote = false;
    row._errors = [];

    const addError = (i, msg) => {
      row._errors.push(`Columna ${i + 1}: ${msg}`);
    };

    const lote = (row[9] || "").toString().trim();
    if (isEmpty(lote)) {
      row._errorLote = true;
      addError(9, "Lote vacío");
    } else if (lote.length !== 10) {
      row._errorLote = true;
      addError(9, `Lote debe tener 10 caracteres (actual: ${lote.length})`);
    } else if (loteCount[lote] > 1) {
      row._errorLote = true;
      addError(9, "Lote duplicado");
    }

    for (let i = 10; i <= 18; i++) {
      if (i === 16) continue; // 🔹 Excluir columna 17 Excel
      if (isEmpty(row[i])) addError(i, "Campo obligatorio vacío");
    }

    const parseDate = d => {
      if (isEmpty(d)) return null;
      const [dd, mm, yy] = d.toString().split("/").map(Number);
      return new Date(yy, mm - 1, dd);
    };

    const f20 = parseDate(row[19]);
    const f57 = parseDate(row[56]);

    if (f20 && f57 && f20 > f57) addError(19, "Fecha cosecha debe ser ≤ fecha inspección");

    for (let i = 28; i <= 32; i++) {
      if (isEmpty(row[i])) addError(i, "Campo obligatorio vacío");
    }

    if (isEmpty(row[28]) || row[28].toString().trim() !== "59") addError(28, "Debe ser valor 59");
    if (isEmpty(row[29]) || row[29].toString().trim() !== "53") addError(29, "Debe ser valor 53");

    for (let i = 79; i <= 104; i++) {
      if (i === 92) continue;
      if (isEmpty(row[i])) addError(i, "Campo obligatorio vacío");
    }
  });

  renderTable();

  // Mostrar total de filas filtradas POR FECHA
  const totalFilasDiv = document.getElementById("totalFilasPlagas");
  if (totalFilasDiv) {
    totalFilasDiv.textContent = `Total registros válidos: ${processedData.length}`;
  }

}

    // ===============================
    // RENDER TABLA
    // ===============================
    function renderTable(){
      resultsHeader.innerHTML="";
      resultsBody.innerHTML="";

      columnsToShow.forEach(i=>{
        const th = document.createElement("th");
        th.textContent = columns[i].header;
        resultsHeader.appendChild(th);
      });

      processedData.forEach(r=>{
        const tr = document.createElement("tr");
        columnsToShow.forEach(i=>{
          const td = document.createElement("td");
          let val = r[i]||"";
          if(i===19 || i===56) val=formatExcelDate(val);
          td.textContent=val;
          
          // LOTE (columna 10 Excel)
          if (i === 9 && r._errorLote) {
            const errorMsg = r._errors.find(e => e.startsWith("Columna 10:"));
            if (errorMsg) {
              td.title = `❌ ${errorMsg.split(": ")[1]}`; // 🆕 TOOLTIP
              if (!val || val.toString().trim() === "") {
                // VACÍO → fondo rojo + texto blanco
                td.style.backgroundColor = "red";
                td.style.color = "white";
              } else {
                // NO vacío pero inválido ( <10, >10 o duplicado )
                td.style.color = "red";
              }
            }
          }

          // OTRAS VALIDACIONES
          if (columnasARevisar.includes(i) && r._errors) {
            const errorMsg = r._errors.find(e => e.startsWith(`Columna ${i + 1}:`));
            if (errorMsg) {
              td.title = `❌ ${errorMsg.split(": ")[1]}`; // 🆕 TOOLTIP
              if (!val || val.toString().trim() === "") {
                td.style.backgroundColor = "red";
                td.style.color = "white";
              } else {
                td.style.color = "red";
              }
            }
          }
          tr.appendChild(td);
        });
        resultsBody.appendChild(tr);
      });

      resultsTable.hidden=false;
      exportBtn.disabled=false;
    }

// ===============================
// EXPORTAR
// ===============================
    exportBtn.addEventListener("click", ()=>{
      if(!processedData.length) return;

      let fechasSeleccionadas = [...new Set(rawData.map(r=>r[56]).filter(Boolean))];

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
        width: 620,
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

            // nunca eliminar la fecha en revisión
            if (f === inspectionSelect.value) return;

            fechasSeleccionadas = fechasSeleccionadas.filter(x => x !== f);

            Swal.update({
              html: `
                <div style="text-align:center">
                  <b>Fecha en revisión:</b>
                  ${inspectionSelect.value}<br><br>
                  <b>Fechas a unir</b>
                  ${renderCards()}
                </div>
              `
            });
          });
        }


      }).then(res=>{
        // SOLO FECHA ACTUAL
        if(res.isConfirmed){
          exportExcelFiltrado(
            processedData,
            `Export_Plaga_${inspectionSelect.value}.xlsx`
          );
        }

        // FECHAS UNIDAS
        if(res.isDenied){
          const dataUnida = rawData.filter(r=>fechasSeleccionadas.includes(r[56]));
          exportExcelFiltrado(
            dataUnida,
            "Export_Plaga_Fechas_Unidas.xlsx"
          );
        }
      });
    });

    function exportExcelFiltrado(data, nombreArchivo){
      const wsData = [];

      const toNumberExcept = (val, excelCol)=>{
        if(excelCol === 10 || excelCol === 19) return val;
        const n = Number(val);
        return val === "" || isNaN(n) ? val : n;
      };

      wsData.push([
        ...Array.from({length:10}, (_,i)=>columns[i+9].header),
        columns[19].header,
        "",
        ...Array.from({length:5}, (_,i)=>columns[i+28].header),
        "", "",
        ...columns.slice(33).map(c=>c.header)
      ]);

      data.forEach(r=>{
        wsData.push([
          ...Array.from({length:10}, (_,i)=>toNumberExcept(r[i+9], i+10)),
          formatExcelDate(r[19]),
          "",
          ...Array.from({length:5}, (_,i)=>toNumberExcept(r[i+28], i+29)),
          "", "",
          ...r.slice(33).map((v,i)=>toNumberExcept(v, i+34))
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
  clearBtn.addEventListener("click", ()=>{
    resetDashboard();
    Swal.fire({icon:"success", title:"Datos limpiados", text:"Ya puedes cargar otro Excel.", timer:1000, showConfirmButton:false});
  });

  // INIT
  resetDashboard();
})();