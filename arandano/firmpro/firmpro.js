(() => {

  /* ===============================
     VARIABLES GLOBALES
  =============================== */
  let rawData = [];
  let finalData = [];

  const fileInput = document.getElementById("filePlagasArandano");
  const runBtn = document.getElementById("runReviewPlagasArandano");
  const exportBtn = document.getElementById("exportPlagasArandano");
  const clearBtn = document.getElementById("clearDataPlagasArandano");
  const templateBtn = document.getElementById("downloadTemplate");

  const tbody = document.getElementById("resultsBodyPlagasArandano");
  const tableWrap = document.getElementById("resultsTableFirmproArandano");
  const totalLabel = document.getElementById("totalFilasPlagasArandano");

  /* ===============================
     MAPA VARIEDADES
  =============================== */
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

  /* ===============================
     PLANTILLA
  =============================== */
  templateBtn.addEventListener("click", () => {
    const plantilla = [{
      LOTE: "",
      Acidez: "",
      "Acidez 2": "",
      "Acidez 3": "",
      Brix: "",
      "Brix 2": "",
      "Brix 3": "",
      "SCIOCUP Brix": "",
      "SCIOCUP Brix 2": "",
      "SCIOCUP Brix 3": "",
      "Test Sabor": ""
    }];

    const ws = XLSX.utils.json_to_sheet(plantilla);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Plantilla");

    XLSX.writeFile(wb, "Plantilla_Analisis_Arandano.xlsx");

    Swal.fire("Descargado", "Plantilla lista para llenar", "success");
  });

  /* ===============================
     SUBIR EXCEL
  =============================== */
  fileInput.addEventListener("change", () => {
    runBtn.disabled = false;
    Swal.fire("Archivo cargado", "Ahora puedes procesar", "info");
  });

  /* ===============================
     PROCESAR
  =============================== */
  runBtn.addEventListener("click", async () => {
    if (!fileInput.files.length)
      return Swal.fire("Error", "Sube un Excel primero", "error");

    Swal.fire({ title: "Procesando...", allowOutsideClick: false, didOpen: () => Swal.showLoading() });

    const data = await fileInput.files[0].arrayBuffer();
    const wb = XLSX.read(data, { type: "array" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    rawData = XLSX.utils.sheet_to_json(ws, { defval: "" });
    // ===============================
    // VALIDAR NÚMERO DE COLUMNAS (máx 11)
    // ===============================
    const headers = Object.keys(rawData[0] || {});
    if (headers.length > 11) {
      Swal.fire(
        "Archivo no permitido",
        "Este archivo tiene más de 11 columnas.\n\nDebes usar únicamente la plantilla descargada del sistema.",
        "error"
      );
      return;
    }

    finalData = [];

    rawData.forEach(r => {
      const lote = String(r["LOTE"] || "").trim();
      if (!lote) return;

      const etapa = lote[2];
      const campo = lote[3];
      const codvar = lote.substring(4, 6);
      const map = VAR_MAP[codvar] || ["Desconocida", ""];

      for (let i = 1; i <= 3; i++) {
        finalData.push({
          LOTE: lote,
          VARIEDAD: map[0],
          Genetica: map[1],
          Etapa: etapa,
          Campo: campo,
          "Solidos-Solubles": r[`Brix${i === 1 ? "" : " " + i}`] || "",
          Acidez: r[`Acidez${i === 1 ? "" : " " + i}`] || "",
          SCIOCUP: map[1].toLowerCase().startsWith("driscoll")
            ? (r[`SCIOCUP Brix${i === 1 ? "" : " " + i}`] || "")
            : "",
          "Test De Sabor": r["Test Sabor"] || ""
        });
      }
    });

    finalData.sort((a, b) => a.Etapa - b.Etapa || a.Campo - b.Campo);
    renderTable();
    exportBtn.disabled = false;

    Swal.fire("Listo", "Excel procesado correctamente", "success");
  });

  /* ===============================
     RENDER TABLA
  =============================== */
  function renderTable() {
    tbody.innerHTML = "";
    finalData.forEach(r => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${r.LOTE}</td><td>${r.VARIEDAD}</td><td>${r.Genetica}</td>
        <td>${r.Etapa}</td><td>${r.Campo}</td><td>${r["Solidos-Solubles"]}</td>
        <td>${r.Acidez}</td><td>${r.SCIOCUP}</td><td>${r["Test De Sabor"]}</td>
      `;
      tbody.appendChild(tr);
    });

    tableWrap.style.display = "block";
    totalLabel.textContent = `Total filas: ${finalData.length}`;
  }

  /* ===============================
     EXPORTAR
  =============================== */
  exportBtn.addEventListener("click", () => {
    const ws = XLSX.utils.json_to_sheet(finalData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Resultado");
    XLSX.writeFile(wb, "Analisis_Ordenado.xlsx");
    Swal.fire("Descargado", "Excel final generado", "success");
  });

  /* ===============================
     LIMPIAR
  =============================== */
  clearBtn.addEventListener("click", () => {
    rawData = [];
    finalData = [];
    tbody.innerHTML = "";
    fileInput.value = "";
    tableWrap.style.display = "none";
    runBtn.disabled = true;
    exportBtn.disabled = true;
    totalLabel.textContent = "";

    Swal.fire("Limpio", "Sistema reiniciado", "success");
  });

})();
