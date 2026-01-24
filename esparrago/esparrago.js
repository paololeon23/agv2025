(() => {
    /* ============================================================
       1. REFERENCIAS AL DOM Y VARIABLES GLOBALES
       ============================================================ */
    const fileInput = document.getElementById("fileEsparrago");
    const inspectionDateSelect = document.getElementById("inspectionDateEsparrago");
    const updateDateSelect = document.getElementById("updateDateEsparrago");
    const runReviewBtn = document.getElementById("runReviewEsparrago");
    const headerRow = document.getElementById("resultsHeaderEsparrago");
    const bodyRows = document.getElementById("resultsBodyEsparrago");
    const totalFilasDiv = document.getElementById("totalFilasEsparrago");
    const exportBtn = document.getElementById("exportEsparrago");
    const clearBtn = document.getElementById("clearDataEsparrago");

    let rawRows = [];
    let headersOriginal = [];
    
    // Índices JS (Base 0) del orden solicitado
    const VISUAL_COLS = [
        0, 1, 3, 6, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 
        27, 28, 29, 30, 31, 32, 33, 38,                        
        47, 48, 51, 56, 57,                                    
        45, 52, 54, 71, 72, 73,                                 
        46, 53, 55, 70, 74, 75,                                 
        76, 79,                                                 
        80, 81, 82, 83                                          
    ];

    // Definimos las columnas que queremos fijas (Excel 1, 2, 7, 10 -> JS 0, 1, 6, 9)
    const STICKY_COLUMNS_ESPARRAGO = [0, 1, 6, 9];

    /* ============================================================
       2. EVENTO: CARGA DE ARCHIVO
       ============================================================ */
    fileInput.addEventListener("change", async e => {
        const file = e.target.files[0];
        if (!file) return;

        const buffer = await file.arrayBuffer();
        const wb = XLSX.read(buffer, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false });

        // Validación Fila 4 Excel (índice 3)
        const fila4 = data[3] || [];
        const cartilla = (fila4[8] || "").toUpperCase().trim(); 
        const estado = (fila4[13] || "").toUpperCase().trim();   

        if (cartilla !== "MPES" || estado !== "ENVIADA") {
            Swal.fire("Error", "El archivo debe ser MPES y estar ENVIADA", "error");
            fileInput.value = ""; return;
        }

        headersOriginal = data[5]; 
        data.splice(0, 5); // Borrar decorativos
        rawRows = data.slice(1); // Datos reales

        cargarFechasInspeccion();
        runReviewBtn.disabled = false;
    });

    /* ============================================================
       3. SELECTORES: INSPECCIÓN Y LMR (DATA TAL CUAL)
       ============================================================ */
    function cargarFechasInspeccion() {
        const valoresRaw = rawRows.map(r => (r[48] || "").toString().trim()).filter(Boolean);
        const valoresUnicos = [...new Set(valoresRaw)];
        
        inspectionDateSelect.innerHTML = '<option value="" disabled selected>Selecciona una fecha</option>';
        valoresUnicos.forEach(v => {
            const o = document.createElement("option");
            o.value = v; o.textContent = v;
            inspectionDateSelect.appendChild(o);
        });
        inspectionDateSelect.disabled = false;
    }

    // Llenado automático de Fecha LMR al cambiar Inspección
    inspectionDateSelect.addEventListener("change", () => {
        const selectedVal = inspectionDateSelect.value;
        const filasCoincidentes = rawRows.filter(r => (r[48] || "").toString().trim() === selectedVal);
        
        // Col 58 Excel -> índice 57
        const lmrDates = [...new Set(filasCoincidentes.map(r => (r[57] || "").toString().trim()).filter(Boolean))];

        updateDateSelect.innerHTML = "";
        
        if (lmrDates.length > 0) {
            // Llenamos el select
            lmrDates.forEach(d => {
                const o = document.createElement("option");
                o.value = d; o.textContent = d;
                updateDateSelect.appendChild(o);
            });

            // --- ESTA ES LA MEJORA QUE SOLICITAS ---
            if (lmrDates.length > 1) {
                // Si hay más de una fecha LMR para esa inspección: ROJO
                updateDateSelect.style.border = "2px solid red";
                updateDateSelect.style.color = "red";
                
                Swal.fire({
                    icon: "warning",
                    title: "Atención",
                    html: `Se han encontrado <b>${lmrDates.length}</b> fechas LMR diferentes para esta inspección.<br>Verifica con supervisión.`,
                    confirmButtonText: "Entendido"
                });
            } else {
                // Si es única, resetear estilos
                updateDateSelect.style.border = "";
                updateDateSelect.style.color = "";
            }
        } else {
            updateDateSelect.innerHTML = '<option value="">Sin Fecha LMR</option>';
            updateDateSelect.style.border = "";
            updateDateSelect.style.color = "";
        }
        updateDateSelect.disabled = false;
    });

    /* ============================================================
       4. RENDERIZADO DE TABLA (CON SUMAS AL FINAL)
       ============================================================ */
    runReviewBtn.addEventListener("click", () => {
        const selectedVal = inspectionDateSelect.value;
        // VALIDACIÓN: Si no hay fecha seleccionada
            if (!selectedVal || selectedVal === "") {
                Swal.fire({
                    icon: "error",
                    title: "Falta fecha de inspección",
                    text: "Debes seleccionar una fecha de inspección antes de ejecutar la revisión.",
                    confirmButtonText: "Aceptar"
                });
                return; // Detiene la ejecución
            }

            const filteredRows = rawRows.filter(r => (r[48] || "").toString().trim() === selectedVal);
            renderTabla(filteredRows, selectedVal);
        });

    function renderTabla(rows, valInspeccion) {
        headerRow.innerHTML = "";
        bodyRows.innerHTML = "";

        // Headers Solicitados
        VISUAL_COLS.forEach(idx => {
            const th = document.createElement("th");
            th.textContent = headersOriginal[idx] || `Col ${idx + 1}`;

            // Si la columna actual está en nuestra lista de fijas
            if (STICKY_COLUMNS_ESPARRAGO.includes(idx)) {
                th.classList.add("esparrago-col", `esparrago-col-${idx}`);
            }

            headerRow.appendChild(th);
        });

        // Headers Sumas (Al final)
        ["SUMA CALIBRES", "SUMA TURIONES"].forEach(text => {
            const th = document.createElement("th");
            th.textContent = text; th.style.background = "#e3f2fd";
            headerRow.appendChild(th);
        });

        rows.forEach(r => {
            const tr = document.createElement("tr");
            
            // Celdas de datos
            VISUAL_COLS.forEach(c => {
                const td = document.createElement("td");
                const val = (r[c] || "").toString().trim();
                td.textContent = val;

                // Aplicar clase sticky si corresponde
                if (STICKY_COLUMNS_ESPARRAGO.includes(c)) {
                    td.classList.add("esparrago-col", `esparrago-col-${c}`);
                }

                aplicarValidaciones(td, r, c, val, valInspeccion);
                tr.appendChild(td);
            });

            // Celdas de Sumas (Al final)
            const sumaCal = sumarColumnas(r, [46, 53, 55, 70, 74, 75]);
            tr.appendChild(crearCeldaCalculada(sumaCal, r[10]));

            const sumaTur = sumarColumnas(r, [80, 81, 82, 83]);
            tr.appendChild(crearCeldaCalculada(sumaTur, r[10]));

            bodyRows.appendChild(tr);
        });

        totalFilasDiv.textContent = `Total registros inspección: ${rows.length}`;
        exportBtn.disabled = false;
    }

    /* ============================================================
       5. HELPERS Y VALIDACIONES
       ============================================================ */
    function aplicarValidaciones(td, r, c, val, valInsp) {
        const nVal = Number(val);
        
        // Validación Cosecha vs Inspección
        if (c === 47) {
            const fCos = parseExcelDateISO(val);
            const fIns = parseExcelDateISO(valInsp);
            if (fCos && fIns && fCos > fIns) td.style.color = "red";
        }
        
        // Lote (Col 10)
// Lote (Col 10 -> índice 9)
if (c === 9) {
    if (!val || val.trim() === "") {
        td.style.setProperty("background-color", "#ff0000", "important");
        td.style.setProperty("color", "white", "important");
    } else if (val.length !== 10) {
        td.style.setProperty("color", "red", "important");
    }
}


        // Peso (Col 11)
        if (c === 10 && (nVal < 2000 || nVal > 3000)) td.style.color = "red";

        // Rangos
        const rangos = { 45: 42, 52: 64, 54: 34, 71: 10, 72: 19, 73: 25 };
        if (rangos[c] && nVal > rangos[c]) td.style.color = "red";
    }

    function sumarColumnas(row, indices) {
        return indices.reduce((acc, curr) => acc + (Number(row[curr]) || 0), 0);
    }

    function crearCeldaCalculada(suma, comparador) {
        const td = document.createElement("td");
        td.textContent = suma;
        td.style.fontWeight = "bold";
        if (suma !== Number(comparador)) td.style.color = "red";
        return td;
    }

    function parseExcelDateISO(v) {
        if (!v) return null;
        const s = v.toString().trim();
        if (/^\d{8}$/.test(s)) return `${s.slice(0,4)}-${s.slice(4,6)}-${s.slice(6,8)}`;
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) {
            const [d,m,y] = s.split("/"); return `${y}-${m}-${d}`;
        }
        const d = new Date(v);
        return isNaN(d.getTime()) ? null : d.toISOString().split("T")[0];
    }

/* ============================================================
   6. EXPORTAR (FILTRADO POR FECHA SELECCIONADA)
   ============================================================ */
exportBtn.addEventListener("click", () => {
    const fechaSeleccionada = inspectionDateSelect.value;

    if (!fechaSeleccionada) {
        Swal.fire("Error", "Primero debes seleccionar una fecha y revisar los datos", "error");
        return;
    }

    // 1. Filtrar solo las filas que coinciden con la fecha de inspección seleccionada
    const filasAExportar = rawRows.filter(r => (r[48] || "").toString().trim() === fechaSeleccionada);

    if (filasAExportar.length === 0) {
        Swal.fire("Aviso", "No hay datos para exportar con la fecha seleccionada", "warning");
        return;
    }

    // 2. Definir el mapa de columnas (Basado en tu lista)
    // null = columna vacía en el Excel de salida
    const indicesExcel = [
        0,                 // Col 1
        null, null, null, null, // Vacíos (2, 3, 4, 5)
        9, 10, 12,         // Col 10, 11, 13
        null,              // Vacío (Col en medio)
        13, 14, 15, 16, 17, 18, // Col 14, 15, 16, 17, 18, 19
        null,              // Vacío
        27, 28,            // Col 28, 29
        null,              // Vacío
        29,                // Col 30
        null        // Vacíos hasta llegar a la 33
    ];

    // 3. Agregar correlativo: Desde Col 33 hasta 146 (Índices JS 32 hasta 145)
    for (let i = 32; i <= 145; i++) {
        indicesExcel.push(i);
    }

    // 4. Mapear los datos de las filas filtradas
    const matrixFinal = filasAExportar.map(fila => {
        return indicesExcel.map(idx => (idx === null ? "" : (fila[idx] || "")));
    });

    // 5. Preparar los encabezados (Mapear headersOriginal con el mismo orden)
    const encabezadosMapeados = indicesExcel.map(idx => (idx === null ? "" : (headersOriginal[idx] || "")));

    // 6. Generar el archivo
    const ws = XLSX.utils.aoa_to_sheet([encabezadosMapeados, ...matrixFinal]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data_Export");

    XLSX.writeFile(wb, `Reporte_Esparrago_${fechaSeleccionada}.xlsx`);
});

    /* ============================================================
       7. LIMPIEZA COMPLETA (ESTILO ARÁNDANOS)
       ============================================================ */
    clearBtn.addEventListener("click", () => {
        limpiarTodoEsparrago();
    });

    function limpiarTodoEsparrago() {
        // --- LIMPIAR DATA ---
        rawRows = [];
        headersOriginal = [];

        // --- LIMPIAR INPUT FILE ---
        fileInput.value = "";

        // --- LIMPIAR TABLA ---
        headerRow.innerHTML = "";
        bodyRows.innerHTML = "";
        totalFilasDiv.textContent = "";

        // --- RESET SELECTS (CONTENIDO + ESTILOS) ---
        // Fecha Inspección
        inspectionDateSelect.innerHTML = '<option value="" disabled selected>Selecciona una fecha</option>';
        inspectionDateSelect.disabled = true;
        inspectionDateSelect.style.border = "";
        inspectionDateSelect.style.color = "";

        // Fecha LMR
        updateDateSelect.innerHTML = '<option value="" disabled selected>Se actualizará automáticamente</option>';
        updateDateSelect.disabled = true;
        updateDateSelect.style.border = "";
        updateDateSelect.style.color = "";

        // --- RESET BOTONES ---
        runReviewBtn.disabled = true;
        exportBtn.disabled = true;

        // --- ALERTA FINAL ---
        Swal.fire({
            icon: "success",
            title: "Limpieza completa",
            text: "El módulo de Espárrago se limpió correctamente.",
            timer: 1000,
            showConfirmButton: false
        });
    }

})();