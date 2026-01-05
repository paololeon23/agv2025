(() => {
  // ===============================
  // ELEMENTOS DEL DOM
  // ===============================
  const fileInput = document.getElementById("fileFQO");
  const runReviewBtn = document.getElementById("runReviewFQO");
  const exportBtn = document.getElementById("exportFQOuva");
  const clearBtn = document.getElementById("clearDataFQO");

  const resultsHeader = document.getElementById("resultsHeaderFQO");
  const resultsBody = document.getElementById("resultsBodyFQO");
  const totalFilasDiv = document.getElementById("totalFilasFQO");
  const downloadTemplateBtn = document.getElementById("downloadTemplateFQO");

  let rawData = [];
  let excelLoaded = false;

  // ===============================
  // PARSE FECHA (maneja string dd/mm/yyyy, Date o número de Excel)
  // ===============================
  function parseFecha(value) {
    if (!value) return null;

    // Si ya es Date
    if (value instanceof Date) return value;

    // Si es número (Excel date)
    if (typeof value === "number") {
      const fechaBase = new Date(1899, 11, 30); // fecha base Excel
      fechaBase.setDate(fechaBase.getDate() + value);
      return fechaBase;
    }

    // Si es string "dd/mm/yyyy"
    if (typeof value === "string") {
      const partes = value.split("/");
      if (partes.length !== 3) return null;
      const dia = parseInt(partes[0], 10);
      const mes = parseInt(partes[1], 10) - 1;
      const anio = parseInt(partes[2], 10);
      return new Date(anio, mes, dia);
    }

    return null;
  }


  downloadTemplateBtn.addEventListener("click", () => {
    const headers = [
      "Id",
      "Fecha registro",
      "Usuario",
      "Lote",
      "ETAPAS",
      "CAMPOS",
      "VARIEDADES",
      "PRODUCTOR",
      "Cant Muestra",
      "Med Muestra",
      "Tonalidad",
      "Brix Inferior",
      "Brix Medio",
      "Brix Superior",
      "Acidez",
      "Brix Titulación",
      "Peso Muestra (mL)",
      "Gasto Titulación",
      "Acidez Titulación",
      "N° viaje"
    ];

    const ws = XLSX.utils.aoa_to_sheet([headers]);
    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(wb, ws, "Plantilla FQO");

    XLSX.writeFile(wb, "plantilla_FQO.xlsx");

    Swal.fire({
        icon: "success",
        title: "Plantilla descargada",
        timer: 1200,
        showConfirmButton: false
      });
  });


  // ===============================
  // FORMATEAR FECHA dd/mm/yyyy
  // ===============================
  function formatDate(date) {
    if (!(date instanceof Date)) return "";
    const d = String(date.getDate()).padStart(2, "0");
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
  }

  // ===============================
  // SEMANA ISO
  // ===============================
  Date.prototype.getWeek = function() {
    const date = new Date(this.getTime());
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + 4 - (date.getDay() || 7));
    const yearStart = new Date(date.getFullYear(), 0, 1);
    const weekNo = Math.ceil((((date - yearStart) / 86400000) + 1)/7);
    return weekNo;
  };

  // ===============================
  // CARGAR EXCEL
  // ===============================
    fileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (evt) => {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];

        const json = XLSX.utils.sheet_to_json(firstSheet, { defval: "" });

        // ===============================
        // VALIDAR QUE EXISTAN FILAS
        // ===============================
        if (!json.length) {
          Swal.fire("Error", "El Excel está vacío.", "error");
          fileInput.value = "";
          return;
        }

        // ===============================
        // VALIDAR NÚMERO DE COLUMNAS (20)
        // ===============================
        const columnas = Object.keys(json[0]);
        if (columnas.length !== 20) {
          Swal.fire({
            icon: "error",
            title: "Estructura incorrecta",
            html: `
              El archivo tiene <b>${columnas.length} columnas</b>.<br><br>
              El formato <b>FQO</b> debe tener exactamente <b>20 columnas</b>.
            `
          });
          fileInput.value = "";
          return;
        }

        // ===============================
        // VALIDAR SEGUNDA FILA CON DATOS
        // ===============================
        const segundaFila = json[0]; // primer registro real
        const tieneDatos = Object.values(segundaFila).some(
          v => v !== null && v !== undefined && v.toString().trim() !== ""
        );

        if (!tieneDatos) {
          Swal.fire({
            icon: "error",
            title: "Archivo inválido",
            text: "La segunda fila no contiene información."
          });
          fileInput.value = "";
          return;
        }

        // ===============================
        // VALIDAR COLUMNA LOTE
        // ===============================
        if (!columnas.includes("Lote")) {
          Swal.fire({
            icon: "error",
            title: "Columna faltante",
            text: "El archivo no contiene la columna 'Lote'."
          });
          fileInput.value = "";
          return;
        }

        // ===============================
        // VALIDAR LARGO DE LOTE (9)
        // ===============================
        const filasInvalidas = json.filter(row =>
          !row["Lote"] || row["Lote"].toString().trim().length !== 9
        );

        if (filasInvalidas.length > 0) {
          Swal.fire({
            icon: "error",
            title: "Lote inválido",
            html: `
              Se encontraron <b>${filasInvalidas.length}</b> filas<br>
              con <b>Lote distinto de 9 caracteres</b>.
            `
          });
          fileInput.value = "";
          return;
        }

        // ===============================
        // TODO OK
        // ===============================
        rawData = json;
        excelLoaded = true;
        runReviewBtn.disabled = false;

        Swal.fire({
          icon: "success",
          title: "Archivo válido",
          text: "Excel Físico-Químico cargado correctamente",
          timer: 1200,
          showConfirmButton: false
        });
      };

      reader.readAsArrayBuffer(file);
    });

  // ===============================
  // TRANSFORMAR FILA (3 filas)
  // ===============================
  function transformarFila(row, itemBase) {
    const fechaRegistro = parseFecha(row["Fecha registro"]);
    const semana = fechaRegistro ? fechaRegistro.getWeek() : "";
    const fechaCosecha = fechaRegistro ? formatDate(fechaRegistro) : "";

    const base = {
      Semana: semana,
      "Fecha Cosecha ": fechaCosecha, // nota: espacio intencional
      Proveedor: row["PRODUCTOR"],
      "N° VIAJE": row["N° viaje"],
      "Zona Muestreo": "Recepcion",
      Tipo: "Convencional",
      "Parte Baya": "",
      Variedad: row["VARIEDADES"],
      Etapa: row["ETAPAS"],
      Campo: row["CAMPOS"],
      Lote2: "",
      Repetición: "",
      Tonalidad: row["Tonalidad"],
      "Area de Baya": "",
      Observaciones: ""
    };

    const filas = [];

    // INFERIOR
    filas.push({
      Item: itemBase,
      ...base,
      "Area Rac.": "INFERIOR",
      "Solidos Solubles": row["Brix Inferior"],
      Acidez: row["Acidez"],
      "Índice de relación": row["Acidez"] ? (row["Brix Inferior"]/row["Acidez"]).toFixed(2) : "",
      "Acidez Refractómetro": "",
      "Brix titulación": row["Brix Titulación"],
      "Peso muestra (ml) titulación": row["Peso Muestra (mL)"],
      "Gasto Titulacion": row["Gasto Titulación"],
      "Acidez Titulacion": row["Acidez Titulación"],
      "Índice de madurez": ""
    });

    // MEDIO
    filas.push({
      Item: itemBase + 1,
      ...base,
      "Area Rac.": "MEDIO",
      "Solidos Solubles": row["Brix Medio"],
      Acidez: row["Acidez"],
      "Índice de relación": row["Acidez"] ? (row["Brix Medio"]/row["Acidez"]).toFixed(2) : "",
      "Acidez Refractómetro": "",
      "Brix titulación": "",
      "Peso muestra (ml) titulación": "",
      "Gasto Titulacion": "",
      "Acidez Titulacion": "",
      "Índice de madurez": ""
    });

    // SUPERIOR
    filas.push({
      Item: itemBase + 2,
      ...base,
      "Area Rac.": "SUPERIOR",
      "Solidos Solubles": row["Brix Superior"],
      Acidez: row["Acidez"],
      "Índice de relación": row["Acidez"] ? (row["Brix Superior"]/row["Acidez"]).toFixed(2) : "",
      "Acidez Refractómetro": "",
      "Brix titulación": "",
      "Peso muestra (ml) titulación": "",
      "Gasto Titulacion": "",
      "Acidez Titulacion": "",
      "Índice de madurez": ""
    });

    return filas;
  }

  // ===============================
  // GENERAR TABLA
  // ===============================
  runReviewBtn.addEventListener("click", () => {
    if (!excelLoaded) return;

    let itemBase = 1102;
    let todasFilas = [];

    rawData.forEach(row => {
      const filas = transformarFila(row, itemBase);
      todasFilas.push(...filas);
      itemBase += 3;
    });

    const columnasFinales = [
      "Item","Semana","Fecha Cosecha ","Proveedor","N° VIAJE","Zona Muestreo","Tipo","Parte Baya",
      "Variedad","Etapa","Campo","Lote2","Repetición","Tonalidad","Area Rac.","Area de Baya",
      "Solidos Solubles","Acidez","Observaciones","Índice de relación","Acidez Refractómetro",
      "Brix titulación","Peso muestra (ml) titulación","Gasto Titulacion","Acidez Titulacion","Índice de madurez"
    ];

    resultsHeader.innerHTML = "";
    resultsBody.innerHTML = "";

    // Cabecera
    columnasFinales.forEach(col => {
      const th = document.createElement("th");
      th.textContent = col;
      resultsHeader.appendChild(th);
    });

    // Filas
    todasFilas.forEach(fila => {
      const tr = document.createElement("tr");
      columnasFinales.forEach(col => {
        const td = document.createElement("td");
        td.textContent = fila[col] !== undefined ? fila[col] : "";
        tr.appendChild(td);
      });
      resultsBody.appendChild(tr);
    });

    totalFilasDiv.textContent = `Total filas: ${todasFilas.length}`;
    exportBtn.disabled = false;
  });

  // ===============================
  // EXPORTAR
  // ===============================
  exportBtn.addEventListener("click", () => {
    if (!excelLoaded) return;

    const table = document.getElementById("resultsTableFQO");
    const wb = XLSX.utils.table_to_book(table, { sheet: "Resultado" });
    XLSX.writeFile(wb, "resultado_transformado.xlsx");
  });

  // ===============================
  // LIMPIAR
  // ===============================
  clearBtn.addEventListener("click", () => {
    resultsHeader.innerHTML = "";
    resultsBody.innerHTML = "";
    totalFilasDiv.textContent = "";
    fileInput.value = "";
    runReviewBtn.disabled = true;
    exportBtn.disabled = true;
    rawData = [];
    excelLoaded = false;
    Swal.fire({icon:"success", title:"Datos limpiados", text:"Ya puedes cargar otro Excel.", timer:1200, showConfirmButton:false});
  });

})();
