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

    cosechaSelect.innerHTML=`<option selected>Se actualizará automáticamente</option>`;
    cosechaSelect.disabled=true;
    cosechaSelect.style.border="";
    cosechaSelect.style.color="";

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
    o.textContent = cosecha || "Se actualizará automáticamente";
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
        Swal.fire("Atención","La fecha de cosecha es mayor que la fecha de inspección","warning");
      } else {
        cosechaSelect.style.border="";
        cosechaSelect.style.color="";
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
      let sheet = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], {header:1, raw:false});

      if(sheet.length<7){
        Swal.fire("Error","Archivo inválido, muy pocas filas","error");
        resetDashboard();
        return;
      }

      sheet.splice(0,5);
      const totalColumns = sheet[0]?.length || 0;
      if(totalColumns !== 105){
        Swal.fire("Error",`Número de columnas incorrecto. Se esperaba 105 pero hay ${totalColumns}`,"error");
        resetDashboard();
        return;
      }

      columns = sheet[0].map((h,i)=>({id:`columna_${i+1}`, header:h, originalIndex:i}));
      rawData = sheet.slice(1).filter(r=>r.some(c=>c));

      const tipo = rawData[0][1]?.toString().trim().toUpperCase();
      if(tipo !== "PMPU"){
        Swal.fire("Error","Archivo no corresponde a Plagas Uva (PMPU)","error");
        resetDashboard();
        return;
      }

      // Formatear columna 19 (fecha cosecha) y 56 (fecha inspección)
      rawData.forEach(r=>{
        r[19] = formatExcelDate(r[19]);
        r[56] = formatExcelDate(r[56]);
      });

      columnsToShow=[0,1,6,9,10,11,12,13,14,15,16,17,18,19,28,29,30,31,32,56];
      for(let i=79;i<105;i++) columnsToShow.push(i);

      const inspectionDates = [...new Set(rawData.map(r=>r[56]).filter(Boolean))];
      inspectionSelect.innerHTML="";
      inspectionDates.forEach(d=>{
        const o = document.createElement("option");
        o.value = d;
        o.textContent = d;
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
  // REVISAR
  // ===============================
  runReviewBtn.addEventListener("click", ()=>{
    if(!excelLoaded || !inspectionSelect.value) return;

    Swal.fire({
      icon:"info",
      title:"Revisión de fechas",
      html:`Se va a revisar:<br>Fecha inspección: ${inspectionSelect.value}<br>Fecha cosecha: ${cosechaSelect.value}`,
      showConfirmButton:true
    });

    processedData = rawData.filter(r=>r[56]===inspectionSelect.value);

    const loteSet = new Set();
    processedData.forEach(r=>{
      r._errorLote=false;
      const lote=(r[9]||"").toString().trim();
      if(lote.length!==10 || loteSet.has(lote)){
        r._errorLote=true;
      }
      loteSet.add(lote);
    });

    renderTable();
    const totalFilasDiv = document.getElementById("totalFilasPlagas");
    if(totalFilasDiv) totalFilasDiv.textContent=`Total filas: ${processedData.length}`;
  });

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
        if(i===9 && r._errorLote) td.style.color="red";
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
    const wsData = [columnsToShow.map(i=>columns[i].header)];
    processedData.forEach(r=>{
      wsData.push(columnsToShow.map(i=>r[i]));
    });
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, "Export");
    XLSX.writeFile(wb, `Export_Plaga_${inspectionSelect.value}.xlsx`);
  });

  // ===============================
  // LIMPIAR
  // ===============================
  clearBtn.addEventListener("click", ()=>{
    resetDashboard();
    Swal.fire({icon:"success", title:"Datos limpiados", text:"Ya puedes cargar otro Excel.", timer:1200, showConfirmButton:false});
  });

  // INIT
  resetDashboard();
})();
