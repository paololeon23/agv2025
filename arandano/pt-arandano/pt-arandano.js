(() => {

  /* ===============================
     CONSTANTES
  =============================== */
  const CARTILLAS_PERMITIDAS = {
    PTHPAR: "PTHPA",
    PTLPAR: "PTLPA",
    PTBPAR: "PTBPA"
  };

  const COLUMNAS_PERMITIDAS = 97;

    const CALIBRES_MAP = {
        A: "+12mm", Ñ: "+13mm", B: "+14mm", C: "+15mm", D: "+16mm",
        U: "+17mm", K: "+18mm", F: "+19mm", G: "+20mm", H: "+21mm",
        I: "+22mm", T: "+23mm", Q: "+24mm", P: "+10mm", O: "+11mm",
        N: "-12mm", J: "JUMBO", E: "EXTRA JUMBO", S: "SUPER JUMBO", X: "MIXTO",
        M: "MEDIUM", L: "L", R: "R", LL: "NO COMBINADO", Z: "SIN CALIBRAR"
    };

    const CALIBRES_SUBGRUPO = {
        // Regular
        "R1": "+14mm",
        "R2": "+12mm",
        "R3": "+10mm",
        // Mixed
        "M1": "+16mm",
        "M2": "+15mm",
        "M3": "+14mm",
        // Jumbo
        "J1": "+18mm",
        "J2": "+19mm",
        "J3": "+20mm",
        "J4": "+18mm",
        // Super Jumbo
        "SJ1": "+21mm",
        "SJ2": "+22mm",
        "SJ3": "+24mm"
    };

    const CATEGORIAS_FRUTIST = {
    "REGULAR": ["R1", "R2", "R3"],
    "MIXED": ["M1", "M2", "M3"],
    "JUMBO": ["J1", "J2", "J3", "J4"],
    "SUPER JUMBO": ["SJ1", "SJ2", "SJ3"]
};

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

  const COLUMNAS_FRONT = [
    0,1,2,3,6,9,10,11,27,33,
    "CALIBRE_DESC",
    34,38,41,56,57,58,
    "ETAPA_CAMPO",
    "VARIEDAD"
  ];

  const COLUMNAS_EXPORT_EXTRA = [
    "LINEA","FORMATO","ETIQUETA","FECHA COSECHA","TIPO DE BOLSA"
  ];

  const tableSearch = document.getElementById("tableSearch");

  /* ===============================
     DOM
  =============================== */
  const fileInput = document.getElementById("fileArandano");
  const inspectionTypeSelect = document.getElementById("inspectionType");
  const inspectionDateSelect = document.getElementById("inspectionDate");
  const updateDateSelect = document.getElementById("updateDate");
  const runBtn = document.getElementById("runReviewArandano");
  const exportBtn = document.getElementById("exportArandano");
  const clearBtn = document.getElementById("clearArandano");
  const headerRow = document.getElementById("resultsHeader1");
  const bodyRows = document.getElementById("resultsBody");

  /* ===============================
     ESTADO
  =============================== */
  let rawExcel = [];
  let headers = [];
  let dataRows = [];
  let currentCartilla = "";

  /* ===============================
     UTILIDADES
  =============================== */
  const getFechaExcel = v => v ? String(v).trim() : "";

  function extraerTrazabilidad(codigo){
    if(!codigo || codigo.length < 13) return null;
    return {
      año: codigo.charAt(0),
      pais: codigo.charAt(1),
      packing: codigo.substring(2,4),
      productor: codigo.charAt(4),
      sector: {
        etapa: codigo.charAt(5),
        campo: codigo.charAt(6)
      },
      cultivo: codigo.charAt(7),
      variedad: codigo.substring(8,10),
      juliano: codigo.substring(10)
    };
  }

 /* ===============================
   CARGA MÚLTIPLE DE EXCEL
=============================== */
fileInput.addEventListener("change", async e => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    

    rawExcel = [];
    dataRows = [];
    currentCartilla = "";
    const cartillasCargadas = new Set();

    for (const file of files) {
        try {
            const data = await file.arrayBuffer();
            const wb = XLSX.read(data);
            const ws = wb.Sheets[wb.SheetNames[0]];
            const sheetData = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });

            const fila4 = sheetData[3] || [];
            const estado = (fila4[13] || "").toUpperCase().trim();
            const cartillaRaw = (fila4[8] || "").toUpperCase().trim();

            if (!CARTILLAS_PERMITIDAS[cartillaRaw]) {
                Swal.fire(
                    "Cartilla no permitida",
                    `El archivo <b>${file.name}</b> tiene cartilla <b>${cartillaRaw || "DESCONOCIDA"}</b> y no está permitida.`,
                    "error"
                );
                fileInput.value = "";
                return;
            }

            const cartilla = CARTILLAS_PERMITIDAS[cartillaRaw];

            if (cartillasCargadas.has(cartilla)) {
                Swal.fire(
                    "Cartilla duplicada",
                    `El archivo <b>${file.name}</b> tiene cartilla <b>${cartilla}</b> que ya fue cargada.`,
                    "error"
                );
                fileInput.value = "";
                return;
            }
            cartillasCargadas.add(cartilla);

            if (estado !== "ENVIADA") {
                Swal.fire(
                    "Cartilla no enviada",
                    `El archivo <b>${file.name}</b> debe estar en estado ENVIADA.`,
                    "error"
                );
                fileInput.value = "";
                return;
            }

            // --- Eliminar primeras 5 filas ---
            sheetData.splice(0, 5);
            if (!sheetData.length) continue;

            // Guardamos headers solo si no existen
            if (!headers.length) headers = sheetData[0];

            if (sheetData[0].length !== COLUMNAS_PERMITIDAS) {
                Swal.fire(
                    "Columnas incorrectas",
                    `El archivo <b>${file.name}</b> tiene ${sheetData[0].length} columnas. Se requieren ${COLUMNAS_PERMITIDAS}.`,
                    "error"
                );
                fileInput.value = "";
                return;
            }

            // Guardamos filas con info de cartilla
            const filas = sheetData.slice(1).filter(r => r.some(c => c !== ""));
            filas.forEach(r => r.__cartilla = cartilla);
            dataRows.push(...filas);

        } catch (err) {
            console.error("Error leyendo archivo", file.name, err);
            Swal.fire(
                "Error leyendo archivo",
                `Hubo un error al procesar <b>${file.name}</b>.`,
                "error"
            );
            fileInput.value = "";
            return;
        }
    }

    // --- Llenar select de cartillas ---
    inspectionTypeSelect.innerHTML = `<option disabled selected>Seleccione cartilla</option>`;
    Array.from(cartillasCargadas).forEach(c => {
        const opt = document.createElement("option");
        opt.value = c;
        opt.textContent = c;
        inspectionTypeSelect.appendChild(opt);
    });
    inspectionTypeSelect.disabled = false;

    // --- Actualizar fechas automáticamente al seleccionar la primera cartilla ---
    if (cartillasCargadas.size > 0) {
        const primeraCartilla = Array.from(cartillasCargadas)[0];
        inspectionTypeSelect.value = primeraCartilla;
        actualizarFechasPorCartilla(primeraCartilla);
    }
    
});

/* ===============================
   ACTUALIZAR FECHAS POR CARTILLA
=============================== */
function actualizarFechasPorCartilla(cartillaSeleccionada) {
    if (!cartillaSeleccionada) return;

    const filasFiltradas = dataRows.filter(r => r.__cartilla === cartillaSeleccionada);

    const fechas = Array.from(
        new Set(filasFiltradas.map(r => getFechaExcel(r[41])).filter(Boolean))
    );

    inspectionDateSelect.innerHTML =
        `<option disabled selected>Seleccione fecha</option>` +
        fechas.map(f => `<option>${f}</option>`).join("");
    inspectionDateSelect.disabled = false;

    // Limpiar LMR
    updateDateSelect.innerHTML = `<option value="" selected>Se actualizará automáticamente</option>`;
    updateDateSelect.disabled = true;

    runBtn.disabled = true;
}

/* ===============================
   CUANDO CAMBIA CARTILLA
=============================== */
inspectionTypeSelect.addEventListener("change", e => {
    actualizarFechasPorCartilla(e.target.value);
});


  /* ===============================
     FECHA INSPECCIÓN → LMR
  =============================== */
  inspectionDateSelect.addEventListener("change",()=>{
    const f = inspectionDateSelect.value;

    const lmr = [...new Set(
      dataRows.filter(r=>getFechaExcel(r[41])===f).map(r=>getFechaExcel(r[48]))
    )].filter(Boolean);

    updateDateSelect.innerHTML = lmr.map(d=>`<option>${d}</option>`).join("");
    updateDateSelect.disabled = false;

    if(lmr.length > 1) {
    Swal.fire({
        icon: 'warning',
        title: '⚠️ Atención',
        text: `Se detectaron ${lmr.length} fechas LMR distintas para la inspección seleccionada.`,
        confirmButtonText: 'OK'
    });
}

    runBtn.disabled = false;
  });

  function getJulianoFromDate(fecha) {
    if (!fecha) return null;
    const [dd, mm, yyyy] = fecha.split("/").map(Number);
    const fechaObj = new Date(yyyy, mm-1, dd);
    const start = new Date(yyyy, 0, 0);
    const diff = fechaObj - start;
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);
    return String(dayOfYear).padStart(3, "0"); // devuelve 3 dígitos, ej: 335
}

    /* ===============================
        BUSCADOR EN TIEMPO REAL (CORREGIDO)
    =============================== */
    const inputBusqueda = document.getElementById("inputBusquedaTable");
    const containerBusqueda = document.getElementById("containerBuscador");

    // Solo ejecutamos si ambos existen en el HTML
    if (inputBusqueda && containerBusqueda) {
        inputBusqueda.addEventListener("input", () => {
            const searchTerm = inputBusqueda.value.toLowerCase().trim();
            const rows = bodyRows.querySelectorAll("tr");

            rows.forEach(tr => {
                const idText = tr.cells[1]?.textContent.toLowerCase() || "";
                const loteText = tr.cells[6]?.textContent.toLowerCase() || "";

                if (idText.includes(searchTerm) || loteText.includes(searchTerm)) {
                    tr.style.display = ""; 
                } else {
                    tr.style.display = "none"; 
                }
            });
        });
    } else {
        console.error("No se encontró el ID 'inputBusquedaTable' en el HTML.");
    }
    /* ===============================
        RENDER
    =============================== */
    runBtn.addEventListener("click", () => {

        // Al inicio del renderizado de la tabla
        document.getElementById("containerBuscador").style.display = "flex";

        headerRow.innerHTML = "";
        bodyRows.innerHTML = "";

        const fecha = inspectionDateSelect.value;

        // --- Filtramos filas por fecha ---
        const rows = dataRows
            .filter(r => getFechaExcel(r[41]) === fecha);

        // --- 1️⃣ Encabezado: columna Acciones ---
        const thAction = document.createElement("th");
        thAction.textContent = "Acciones";
        headerRow.appendChild(thAction);

        // --- 2️⃣ Encabezados normales ---
        COLUMNAS_FRONT.forEach(c => {
            const th = document.createElement("th");
            th.textContent = typeof c === "number" ? headers[c] : c;
            headerRow.appendChild(th);
        });

        // --- Detectar duplicados de lote ---
        const loteCounts = {};
        rows.forEach(r => {
            const lote = r[9]; // columna lote
            if (!lote) return;
            loteCounts[lote] = (loteCounts[lote] || 0) + 1;
        });

        // --- Marcar duplicados ---
        rows.forEach(r => {
            const lote = r[9];
            if (lote && loteCounts[lote] > 1) {
                r.__duplicado = true; // ahora todas las filas con lote repetido quedan marcadas
            }
        });

        // --- 3️⃣ Filas ---
        rows.forEach((r, rowIndex) => {
            const tr = document.createElement("tr");
            tr.dataset.rowIndex = rowIndex;
            tr.setAttribute("draggable", "true");

            // --- columna drag handle + botones de color ---
            const tdAction = document.createElement("td");
            tdAction.classList.add("drag-handle-td");

            // Usar flexbox para centrar vertical y horizontalmente
            tdAction.style.display = "flex";
            tdAction.style.alignItems = "center";
            tdAction.style.justifyContent = "center";

            // ☰ drag icon
            const dragIcon = document.createElement("span");
            dragIcon.innerHTML = "☰";
            dragIcon.style.cursor = "grab";
            dragIcon.style.display = "flex";
            dragIcon.style.alignItems = "center";
            dragIcon.style.justifyContent = "center";
            tdAction.appendChild(dragIcon);

            // verde
            const greenBtn = document.createElement("div");
            greenBtn.style.width = "20px";
            greenBtn.style.height = "17px";
            greenBtn.style.borderRadius = "50%";
            greenBtn.style.marginLeft = "5px";
            greenBtn.style.display = "inline-block";
            greenBtn.style.cursor = "pointer";
            greenBtn.style.background = "linear-gradient(to right, #afd8af, #afd8af)";
            greenBtn.title = "Color verde";
            greenBtn.addEventListener("click", () => {
                r.__color = "linear-gradient(to right, #afd8af, #afd8af)";
                tr.style.backgroundImage = r.__color;
            });
            tdAction.appendChild(greenBtn);

            // naranja
            const orangeBtn = document.createElement("div");
            orangeBtn.style.width = "20px";
            orangeBtn.style.height = "17px";
            orangeBtn.style.borderRadius = "50%";
            orangeBtn.style.marginLeft = "5px";
            orangeBtn.style.display = "inline-block";
            orangeBtn.style.cursor = "pointer";
            orangeBtn.style.background = "linear-gradient(to right, #ff9900, #ffcc66)";
            orangeBtn.title = "Color naranja";
            orangeBtn.addEventListener("click", () => {
                r.__color = "linear-gradient(to right, #ff9900, #ffcc66)";
                tr.style.backgroundImage = r.__color;
            });
            tdAction.appendChild(orangeBtn);

            // --- BOTÓN COPIAR ERRORES (REPORTE DETALLADO Y COMPLETO) ---
            const copyBtn = document.createElement("div");
            copyBtn.style.cssText = `
                width: 23px; 
                height: 19px; 
                border-radius: 50%; 
                margin-left: 5px; 
                display: inline-flex; 
                align-items: center; 
                justify-content: center; 
                cursor: pointer; 
                background: #25D366; 
                box-shadow: 0 1px 3px rgba(0,0,0,0.2);
            `;
            copyBtn.title = "Copiar reporte de errores detallado";
            copyBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="white" viewBox="0 0 16 16">
            <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.06 3.973L0 16l4.104-1.076a7.863 7.863 0 0 0 3.89.593c4.365 0 7.923-3.559 7.923-7.928a7.858 7.858 0 0 0-2.316-5.563zM7.994 14.52a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z"/>
            </svg>`;

            copyBtn.addEventListener("click", () => {
                // 1. CAPTURA DE DATOS
                const idInspeccion = r[0] || "N/A";      
                const usuario      = r[6] || "No definido"; 
                const lote         = r[9] || "";        
                const cantMuestra  = r[10];             
                const medMuestra   = r[11];             
                const notaCond     = r[27];             
                const calibreAR    = r[33];             
                const cliente      = r[34] ? r[34].toString().trim() : ""; 
                const destino      = r[38];             
                const subGrupo     = r[56];             
                const tPulpa       = r[57];             
                const trazCode     = r[58];             
                
                const esClienteEspecial = (cliente === "THE FRUITIST CO" || cliente === "COSTCO");
                let incidencias = [];

                // --- VALIDACIONES BÁSICAS ---
                if (!cliente) incidencias.push("Cliente no definido");
                if (!lote) incidencias.push("Lote vacío");
                else if (String(lote).length !== 12) incidencias.push(`Lote incorrecto (${String(lote).length} dígitos)`);
                if (r.__duplicado) incidencias.push("Lote duplicado en sistema");

                if (!cantMuestra || Number(cantMuestra) <= 100) incidencias.push("Cantidad muestra insuficiente (≤ 100)");
                if (!medMuestra || medMuestra.toString().toUpperCase() !== "UNIDADES") incidencias.push("Med. Muestra debe ser 'UNIDADES'");
                if (!notaCond) incidencias.push("Falta Nota Condición (Col 28)");

                if (!destino) incidencias.push("Falta Destino");
                else if (cliente === "THE FRUITIST CO" && destino !== "USA") incidencias.push(`Destino ${destino} no permitido para Fruitist`);
                else if (cliente === "COSTCO" && !["USA", "CANADA"].includes(destino)) incidencias.push(`Destino ${destino} no permitido para Costco`);

                // --- LÓGICA DE CALIBRE Y SUBGRUPO (ACTUALIZADA J, M, E) ---
                if (esClienteEspecial) {
                    if (!subGrupo && !calibreAR) {
                        incidencias.push("Falta Calibre AR y Subgrupo (Obligatorios)");
                    } else if (calibreAR && subGrupo) {
                        
                        // Traducimos la letra a nombre completo (J -> JUMBO, E -> SUPER JUMBO)
                        let categoriaReal = CALIBRES_MAP[calibreAR] || calibreAR;
                        
                        // Ajuste para MEDIUM que es MIXED en categorías
                        if (categoriaReal === "MEDIUM") categoriaReal = "MIXED";

                        // Validamos si es una Categoría (Palabras)
                        if (CATEGORIAS_FRUTIST[categoriaReal]) {
                            if (!CATEGORIAS_FRUTIST[categoriaReal].includes(subGrupo)) {
                                incidencias.push(`Subgrupo ${subGrupo} no pertenece a categoría ${categoriaReal}`);
                            }
                        } 
                        // Validamos si es por Milímetros (Letras como K, B, A)
                        else if (CALIBRES_MAP[calibreAR]) {
                            const descAR = CALIBRES_MAP[calibreAR];
                            const mmLetra = parseInt(descAR.replace(/\D/g, ''), 10);
                            const mmSub = CALIBRES_SUBGRUPO[subGrupo] ? parseInt(CALIBRES_SUBGRUPO[subGrupo].replace(/\D/g, ''), 10) : null;
                            
                            if (mmSub && mmLetra !== mmSub) {
                                incidencias.push(`Calibre ${descAR} no coincide con Subgrupo ${subGrupo}`);
                            }
                        }
                    }
                } else if (cliente) {
                    if (!calibreAR) incidencias.push("Falta Calibre AR");
                    if (subGrupo && subGrupo.toUpperCase() !== "N/A" && subGrupo.trim() !== "") {
                        incidencias.push("Cliente regular no debe tener Subgrupo");
                    }
                }

                // T. Pulpa
                const numPulpa = Number(tPulpa);
                if (!tPulpa) incidencias.push("Falta T. Pulpa (Col 58)");
                else if (isNaN(numPulpa) || numPulpa < 1 || numPulpa > 5) incidencias.push(`T. Pulpa fuera de rango (${tPulpa})`);

                // Trazabilidad
                if (!trazCode) {
                    incidencias.push("Trazabilidad vacía");
                } else {
                    const traz = extraerTrazabilidad(trazCode);
                    const julianoFecha = getJulianoFromDate(inspectionDateSelect.value);
                    if (traz && traz.juliano !== julianoFecha) incidencias.push(`Día juliano (${traz.juliano}) no coincide con fecha`);
                    if (trazCode.length > 13) incidencias.push("Trazabilidad excede 13 caracteres");
                    if (traz && !VAR_MAP[traz.variedad]) incidencias.push(`Código variedad (${traz.variedad}) no existe`);
                    
                    const varNombre = traz ? (VAR_MAP[traz.variedad]?.[0] || "") : "";
                    if (varNombre === "Sekoya Pop Orgánica" && trazCode[4] !== "E") incidencias.push("Falta letra 'E' en trazabilidad");
                }

                // --- ACCIÓN: COPIAR ---
                if (incidencias.length === 0) {
                    return Swal.fire({ icon: "info", title: "Fila Correcta", text: "Sin errores.", timer: 1000, showConfirmButton: false });
                }

                const listaIncidencias = incidencias.map(i => `      • ${i}`).join("\n");

                const mensajeFinal = `Usuario: ${usuario}
            • ID: ${idInspeccion}
            • Lote: ${lote}
            • Incidencias:
            ${listaIncidencias}
            • Acción: Corregir inspección por favor.`;

                navigator.clipboard.writeText(mensajeFinal).then(() => {
                    Swal.fire({ 
                        icon: "success", 
                        title: "Copiado", 
                        text: `Se detectaron ${incidencias.length} errores`, 
                        timer: 1000, 
                        showConfirmButton: false 
                    });
                });
            });

            tdAction.appendChild(copyBtn);

            tr.appendChild(tdAction);

            // --- aplicar color existente ---
            if (r.__color) tr.style.backgroundImage = r.__color;

            // aplicar color duplicado si la fila está marcada
            if (r.__duplicado) {
                tr.style.background = "linear-gradient(to right, #ffcccc, #ff9999)";
            }

            // --- trazabilidad ---
            const trazCode = r[58]; 
            const traz = extraerTrazabilidad(trazCode);
            const etapaCampo = traz ? `${traz.sector.etapa}-${traz.sector.campo}` : "";
            const variedad = VAR_MAP[traz?.variedad]?.[0] || "";
            const calibreDesc = CALIBRES_MAP[r[33]] || "";
            const ext = { CALIBRE_DESC: calibreDesc, ETAPA_CAMPO: etapaCampo, VARIEDAD: variedad };

            // --- celdas normales ---
            COLUMNAS_FRONT.forEach(c => {
                const cliente   = r[34]; // col 35 Excel
                const calibreAR = r[33]; // col 34 Excel
                const subGrupo  = r[56]; // col 57 Excel
                const destino   = r[38]; // col 39 Excel
                const esClienteEspecial = cliente === "THE FRUITIST CO" || cliente === "COSTCO";

                // --- CALIBRE_DESC (LÓGICA ACTUALIZADA CON J=JUMBO / M=MIXED) ---
                if (c === "CALIBRE_DESC") {
                    const td = document.createElement("td");
                    let calibreDescVal = "";
                    let colorRojo = false;

                    if (esClienteEspecial) {
                        if (calibreAR) {
                            // 1. OBTENEMOS LA CATEGORÍA REAL (Traducción)
                            // Si calibreAR es "J" -> categoriaReal es "JUMBO"
                            // Si calibreAR es "M" -> categoriaReal es "MEDIUM" (y luego MIXED)
                            let categoriaReal = CALIBRES_MAP[calibreAR] || calibreAR;
                            if (categoriaReal === "MEDIUM") categoriaReal = "MIXED";

                            // 2. VALIDAMOS SI ES CATEGORÍA (JUMBO, MIXED, REGULAR...)
                            if (CATEGORIAS_FRUTIST[categoriaReal]) {
                                calibreDescVal = categoriaReal; 
                                // Ahora validamos con la categoría ya traducida
                                if (!CATEGORIAS_FRUTIST[categoriaReal].includes(subGrupo)) {
                                    colorRojo = true;
                                }
                            } 
                            // 3. VALIDAMOS SI ES POR MILÍMETROS (K, A, B...)
                            else if (CALIBRES_MAP[calibreAR]) {
                                calibreDescVal = CALIBRES_MAP[calibreAR]; 
                                const mmLetra = parseInt(calibreDescVal.replace(/\D/g, ''), 10);
                                const mmSub = CALIBRES_SUBGRUPO[subGrupo] ? parseInt(CALIBRES_SUBGRUPO[subGrupo].replace(/\D/g, ''), 10) : null;
                                if (mmSub && mmLetra !== mmSub) colorRojo = true;
                            } 
                            else {
                                calibreDescVal = calibreAR;
                                colorRojo = true;
                            }
                        } 
                        else if (subGrupo && CALIBRES_SUBGRUPO[subGrupo]) {
                            calibreDescVal = CALIBRES_SUBGRUPO[subGrupo];
                        } 
                        else {
                            calibreDescVal = "";
                            colorRojo = true;
                        }
                    } else {
                        // OTROS CLIENTES: Sigue igual
                        calibreDescVal = CALIBRES_MAP[calibreAR] || "";
                        if (!calibreAR) colorRojo = true;
                    }

                    // --- RENDERIZADO (Se mantiene igual) ---
                    if (colorRojo) {
                        td.innerHTML = "";
                        const texto = String(calibreDescVal || "ERROR");
                        for (let i = 0; i < texto.length; i++) {
                            const span = document.createElement("span");
                            span.textContent = texto[i];
                            span.style.color = "red";
                            span.style.fontWeight = "bold";
                            td.appendChild(span);
                        }
                    } else {
                        td.textContent = calibreDescVal;
                    }

                    tr.appendChild(td);
                    return;
                }

                // --- CELDAS NORMALES ---
                const td = document.createElement("td");
                const val = typeof c === "number"
                    ? (c === 3 && typeof r[c] === "number"
                        ? (() => {
                            const f = new Date(Math.round((r[c] - 25569) * 86400 * 1000));
                            return `${String(f.getUTCDate()).padStart(2,"0")}/${String(f.getUTCMonth()+1).padStart(2,"0")}/${f.getUTCFullYear()}`;
                        })()
                        : r[c])
                    : ext[c];

                td.textContent = val ?? "";

                /* ===============================
                VALIDACIÓN DESTINO
                =============================== */
                if (c === 38 && !destino) td.style.background = "red";
                if (c === 38 && destino && cliente === "THE FRUITIST CO" && destino !== "USA") td.style.color = "red";
                if (c === 38 && destino && cliente === "COSTCO" && destino !== "USA" && destino !== "CANADA") td.style.color = "red";

                /* ===============================
                VALIDACIÓN CLIENTE / SUBGRUPO / CALIBRE
                =============================== */
                if (esClienteEspecial) {
                    if (!subGrupo && !calibreAR) {
                        if (c === 56 || c === 33) td.style.background = "red";
                    }
                } else {
                    if (!calibreAR && c === 33) td.style.background = "red";
                    if (subGrupo && c === 56) td.style.background = "red";
                }

                /* ===============================
                VALIDACIÓN TRAZABILIDAD
                =============================== */
                if (c === 58) {
                    const trazCheck = extraerTrazabilidad(val);
                    const julianoFecha = getJulianoFromDate(inspectionDateSelect.value);

                    if (!val) {
                        td.style.background = "red";
                    } else {
                        if (trazCheck && trazCheck.juliano !== julianoFecha) td.style.color = "red";
                        const variedadCodigo = trazCheck?.variedad;
                        const variedadEsperada = VAR_MAP[variedadCodigo]?.[0];
                        if (variedadEsperada) {
                            const letraCorrectaPorVariedad = {
                                "Sekoya Pop Orgánica": "E",
                                // agrega otras variedades si quieres validar más
                            };
                            const letraEsperada = letraCorrectaPorVariedad[variedadEsperada];
                            if (letraEsperada && val.length >= 5) {
                                let tdHTML = "";
                                for (let i = 0; i < val.length; i++) {
                                    if (i === 4 && val[i] !== letraEsperada) {
                                        tdHTML += `<span style="color:red;font-weight:bold">${val[i]}</span>`;
                                    } else {
                                        tdHTML += val[i];
                                    }
                                }
                                td.innerHTML = tdHTML;
                            }
                        }
                    }
                }

                if (c === 57) {
                    const num = Number(val);

                    if (!val) {
                        // Vacío → fondo rojo, texto vacío
                        td.style.background = "red";
                        td.textContent = "";
                    } else if (isNaN(num) || num <= 0 || num > 5) {
                        // 0, negativo o >5 → letras rojo normal, fondo normal
                        td.innerHTML = "";
                        const span = document.createElement("span");
                        span.textContent = val;
                        span.style.color = "red"; // rojo normal
                        td.appendChild(span);
                    } else {
                        // Valor válido → normal
                        td.textContent = val;
                    }
                }

                /* ===============================
                VALIDACIÓN CANTIDAD / UNIDADES
                =============================== */
                if (c === 10 && (!val || Number(val) <= 100)) td.style.color = !val ? "red" : "red";
                if (c === 11 && !val) td.style.background = "red";

                /* ===============================
                OTROS CAMPOS VACÍOS
                =============================== */
                if ((c === 9  && !val) ||
                    (c === 27 && !val) || 
                    (c === 33 && !val && !esClienteEspecial) || 
                    (c === 34 && !val)) td.style.background = "red";

                /* ===============================
                OTROS TEXTOS INCORRECTOS
                =============================== */
                if (val) {
                    if (c === 9 && val.length !== 12) td.style.color = "red";
                    if (c === 58 && val.length > 13) td.style.color = "red";
                    if (c === 58) {
                        const trazCheck = extraerTrazabilidad(val);
                        if (!VAR_MAP[trazCheck?.variedad]) td.style.color = "red";
                    }
                }

                tr.appendChild(td);
            });

            bodyRows.appendChild(tr);

        });

        // --- 4️⃣ Drag & Drop filas más preciso ---
        let dragRowIndex = null;

        bodyRows.querySelectorAll("tr").forEach(tr => {
            tr.addEventListener("dragstart", e => {
                // Guardamos el índice real que tiene la fila en el array filtrado actualmente
                dragRowIndex = Array.from(bodyRows.children).indexOf(tr);
                tr.style.opacity = "0.5";
            });

            tr.addEventListener("dragover", e => e.preventDefault());

            tr.addEventListener("drop", e => {
                e.preventDefault();
                const dropIndex = Array.from(bodyRows.children).indexOf(tr);
                if (dropIndex === dragRowIndex) return;

                // --- IMPORTANTE: Sincronizar el array de datos filtrados ---
                const fechaSeleccionada = inspectionDateSelect.value;
                // Obtenemos solo las filas de esa fecha
                let filasFiltradas = dataRows.filter(r => getFechaExcel(r[41]) === fechaSeleccionada);
                
                // Movemos el elemento en el array temporal
                const movedRow = filasFiltradas.splice(dragRowIndex, 1)[0];
                filasFiltradas.splice(dropIndex, 0, movedRow);

                // --- Actualizar dataRows global ---
                // Eliminamos las viejas de esa fecha y metemos las nuevas en su lugar
                dataRows = dataRows.filter(r => getFechaExcel(r[41]) !== fechaSeleccionada).concat(filasFiltradas);

                // Re-renderizamos solo el cuerpo para asegurar que el DOM y el Array coincidan 100%
                runBtn.click(); 
            });

            tr.addEventListener("dragend", e => {
                tr.style.opacity = "1";
            });
        });

            exportBtn.disabled = false;
        });

        /* ===============================
        EXPORT CON COLORES → FILTRADO POR FECHA
        =============================== */
        exportBtn.addEventListener("click", () => {
            const fechaSeleccionada = inspectionDateSelect.value;
            const exportHeaders = headers.concat(COLUMNAS_EXPORT_EXTRA);

            // Crear la hoja con los encabezados
            const ws = XLSX.utils.aoa_to_sheet([exportHeaders]);

            // Filtrar filas (dataRows ya está ordenado por el Drag & Drop)
            const rowsAExportar = dataRows.filter(r => getFechaExcel(r[41]) === fechaSeleccionada);

            rowsAExportar.forEach((r, rowIndex) => {
                const rowData = r.concat(["", "", "", "", ""]);
                const actualRowIndex = rowIndex + 1; // +1 por el encabezado
                
                XLSX.utils.sheet_add_aoa(ws, [rowData], { origin: actualRowIndex });

                // --- Lógica de Colores ---
                let fillColor = null;

                if (r.__duplicado) {
                    // Color para lotes duplicados (Rojo suave)
                    fillColor = "FFCCCC";
                } else if (r.__color) {
                    // Colores manuales de los botones
                    if (r.__color.includes("#afd8af")) fillColor = "AFD8AF"; // Verde
                    if (r.__color.includes("#ff9900")) fillColor = "FF9900"; // Naranja
                }

                // Si hay un color que aplicar, recorremos las celdas de la fila
                if (fillColor) {
                    for (let c = 0; c < rowData.length; c++) {
                        const cellRef = XLSX.utils.encode_cell({ r: actualRowIndex, c: c });
                        
                        // Asegurar que la celda existe en el objeto de la hoja
                        if (!ws[cellRef]) ws[cellRef] = { t: 's', v: rowData[c] || "" };
                        
                        // Aplicar estilo SIN bordes
                        ws[cellRef].s = {
                            fill: {
                                patternType: "solid",
                                fgColor: { rgb: fillColor }
                            }
                        };
                    }
                }
            });

            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "PT");
            XLSX.writeFile(wb, `PT_Arandano_${fechaSeleccionada.replace(/\//g, "-")}.xlsx`);

            Swal.fire({
            icon: "success",
            title: "Exportación completa",
            text: `El Excel de Arándanos (${fechaSeleccionada}) se generó correctamente.`
            });
        });


        /* ===============================
        LIMPIAR
        =============================== */
        clearBtn.addEventListener("click", () => {

            const buscador = document.getElementById("inputBusquedaTable");
            document.getElementById("containerBuscador").style.display = "none";
            buscador.value = ""; // Limpia el texto escrito
            // Limpiar tabla
            headerRow.innerHTML = "";
            bodyRows.innerHTML = "";

            // Reset select de tipo de cartilla al estado inicial
            inspectionTypeSelect.innerHTML = `<option value="" selected disabled>Selecciona tipo de cartilla</option>`;
            inspectionTypeSelect.disabled = true;

            // Limpiar selects de fechas
            inspectionDateSelect.innerHTML = `<option value="" disabled selected>Seleccione</option>`;
            inspectionDateSelect.disabled = true;

            updateDateSelect.innerHTML = `<option value="" selected>Se actualizará automáticamente</option>`;
            updateDateSelect.disabled = true;
            updateDateSelect.style.border = "";
            updateDateSelect.style.color = "";

            // Reset input file
            fileInput.value = "";

            // Deshabilitar botones
            runBtn.disabled = true;
            exportBtn.disabled = true;

            // Limpiar datos internos y colores
            rawExcel = [];
            headers = [];
            dataRows.forEach(r => { if(r.__color) delete r.__color; });
            dataRows = [];

            // Mensaje SweetAlert
            Swal.fire({
                icon: "success",
                title: "Datos limpiados",
                text: "Ya puedes cargar otro Excel.",
                timer: 1000,
                showConfirmButton: false
            });
        });


})();
