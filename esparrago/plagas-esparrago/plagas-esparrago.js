(() => {
    /* ==========================================================
       CONFIGURACIÓN Y DOM
       ========================================================== */
    const fileInput = document.getElementById("filePlagasEsparrago");
    const inspectionTypeSelect = document.getElementById("inspectionTypePlagasEsparrago");
    const inspectionDateSelect = document.getElementById("inspectionDatePlagasEsparrago");
    const updateDateSelect = document.getElementById("updateDatePlagasEsparrago"); 
    const runReviewBtn = document.getElementById("runReviewPlagasEsparrago");
    const exportBtn = document.getElementById("exportPlagasEsparrago");
    const clearBtn = document.getElementById("clearPlagasEsparrago");

    const headerRow = document.getElementById("resultsHeaderPlagasEsparrago");
    const bodyRows = document.getElementById("resultsBodyPlagasEsparrago");
    const totalFilasDiv = document.getElementById("totalFilasPlagasEsparrago");

    // Índices VISIBLES (Excel - 1)
    const VISIBLE_COLUMNS = [0, 1, 3, 6, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 28, 29, 30, 31, 32, 76, 78];

    let rawDataByCartilla = { IPP: [], ISP: [] };
    let headersByCartilla = { IPP: [], ISP: [] };
    

/* ==========================================================
       CARGA DE ARCHIVOS (ESTILO MEJORADO)
       ========================================================== */
    fileInput.addEventListener("change", async e => {
        // 1. LIMPIAR DATOS PREVIOS ANTES DE PROCESAR LOS NUEVOS

        rawDataByCartilla = { IPP: [], ISP: [] };
        headersByCartilla = { IPP: [], ISP: [] };
        headerRow.innerHTML = "";
        bodyRows.innerHTML = "";
        totalFilasDiv.innerHTML = "";
        inspectionTypeSelect.innerHTML = '<option disabled selected>Selecciona tipo</option>';
        inspectionTypeSelect.disabled = true;
        inspectionDateSelect.innerHTML = '<option disabled selected>Selecciona fecha</option>';
        inspectionDateSelect.disabled = true;
        updateDateSelect.innerHTML = '<option disabled selected>Auto-Fecha</option>';
        updateDateSelect.disabled = true; // También deshabilitar este
        runReviewBtn.disabled = true;
        exportBtn.disabled = true;

        const files = Array.from(e.target.files);
        if (!files.length) return;

        let archivosConError = [];
        let archivosProcesados = 0;

        for (const file of files) {
            try {
                const buffer = await file.arrayBuffer();
                const wb = XLSX.read(buffer, { type: "array" });
                const ws = wb.Sheets[wb.SheetNames[0]];
                const data = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false });

                const fila4 = data[3] || [];
                const cartillaRaw = (fila4[8] || "").toUpperCase().trim();
                const estado = (fila4[13] || "").toUpperCase().trim();

                if ((cartillaRaw === "IPP" || cartillaRaw === "ISP") && estado === "ENVIADA") {
                    headersByCartilla[cartillaRaw] = data[5]; 
                    rawDataByCartilla[cartillaRaw] = data.slice(6); 
                    archivosProcesados++;
                } else {
                    // Diseño bonito para el nombre del archivo con error
                    archivosConError.push(`
                        <div style="padding: 8px; border: 1px solid #ffcccc; background-color: #fff5f5; border-radius: 5px;">
                            <span style="color: #e63946; font-weight: bold; display: block; text-align: center;">${file.name}</span>
                            <small style="color: #666; display: block; text-align: center;">No es cartilla IPP/ISP o no está ENVIADA</small>
                        </div>
                    `);
                }
            } catch (err) { 
                archivosConError.push(`
                    <div style="padding: 8px; border: 1px solid #ffcccc; background-color: #fff5f5; border-radius: 5px;">
                        <span style="color: #e63946; font-weight: bold; display: block; text-align: center;">${file.name}</span>
                        <small style="color: #666; display: block; text-align: center;">Error al leer el contenido del Excel</small>
                    </div>
                `);
            }
        }

        if (archivosConError.length > 0) {
            Swal.fire({
                icon: archivosProcesados > 0 ? "warning" : "error",
                title: archivosProcesados > 0 ? "Carga Parcial" : "Error de Archivos",
                html: `
                    <div style="max-height: 300px; overflow-y: auto;">
                        <p style="text-align: center; margin-bottom: 15px;">Los siguientes archivos no pudieron procesarse:</p>
                        ${archivosConError.join("")}
                    </div>
                `,
                confirmButtonColor: "#0E1B40",
                confirmButtonText: "Entendido"
            });
        } else if (archivosProcesados > 0) {
            Swal.fire({ icon: "success", title: "Carga Completada", text: "Cartillas listas para revisión.", timer: 1500, showConfirmButton: false });
        }

        if (archivosProcesados > 0) {
            actualizarSelectTipo();
        }
    });

    function actualizarSelectTipo() {
        inspectionTypeSelect.innerHTML = `<option disabled selected>Selecciona tipo</option>`;
        let count = 0;
        Object.keys(rawDataByCartilla).forEach(k => {
            if (rawDataByCartilla[k].length > 0) {
                const opt = document.createElement("option");
                opt.value = k; opt.textContent = k;
                inspectionTypeSelect.appendChild(opt);
                count++;
            }
        });
        inspectionTypeSelect.disabled = count === 0;
    }

    inspectionTypeSelect.addEventListener("change", () => {
        const tipo = inspectionTypeSelect.value;
        const data = rawDataByCartilla[tipo];
        const fechas = [...new Set(data.map(r => r[76]).filter(Boolean))];
        
        inspectionDateSelect.innerHTML = `<option disabled selected>Selecciona fecha</option>`;
        fechas.forEach(f => {
            const opt = document.createElement("option");
            opt.value = f; opt.textContent = f;
            inspectionDateSelect.appendChild(opt);
        });
        inspectionDateSelect.disabled = false;
        runReviewBtn.disabled = true;
    });

inspectionDateSelect.addEventListener("change", () => {
    const tipo = inspectionTypeSelect.value;
    const fechaInspec = inspectionDateSelect.value;
    const row = rawDataByCartilla[tipo].find(r => r[76] === fechaInspec);
    
    if (row && row[19]) {
        const rawDate = String(row[19]); // Ejemplo: "20260121"
        
        // Extraemos partes: Año (0-4), Mes (4-6), Día (6-8)
        const yyyy = rawDate.substring(0, 4);
        const mm = rawDate.substring(4, 6);
        const dd = rawDate.substring(6, 8);
        
        const fechaFormateada = `${dd}/${mm}/${yyyy}`;
        
        // El 'value' mantiene el original para procesos internos, 
        // pero el 'textContent' muestra el formato bonito.
        updateDateSelect.innerHTML = `<option value="${rawDate}">${fechaFormateada}</option>`;
        updateDateSelect.disabled = false;
    }
    runReviewBtn.disabled = false;
});

    /* ==========================================================
       PROCESAMIENTO Y RENDERIZADO (VALIDACIONES REQUERIDAS)
       ========================================================== */
    runReviewBtn.addEventListener("click", () => {
        const tipo = inspectionTypeSelect.value;
        const fechaBusqueda = inspectionDateSelect.value;
        if (!fechaBusqueda) return;

        headerRow.innerHTML = "";
        bodyRows.innerHTML = "";

        const dataActual = rawDataByCartilla[tipo].filter(r => r[76] === fechaBusqueda);
        const lotesIPP = rawDataByCartilla.IPP.filter(r => r[76] === fechaBusqueda).map(r => String(r[9] || "").trim()).filter(l => l !== "");
        const lotesISP = rawDataByCartilla.ISP.filter(r => r[76] === fechaBusqueda).map(r => String(r[9] || "").trim()).filter(l => l !== "");

        // Reporte de Duplicados en Swal
        const buscarDuplicados = (arr) => arr.filter((item, index) => arr.indexOf(item) !== index);
        const dupsIPP = [...new Set(buscarDuplicados(lotesIPP))];
        const dupsISP = [...new Set(buscarDuplicados(lotesISP))];

        if (dupsIPP.length > 0 || dupsISP.length > 0) {
            let htmlMsg = "";
            if (dupsIPP.length > 0) htmlMsg += `<b>Duplicados en IPP:</b> ${dupsIPP.join(", ")}<br>`;
            if (dupsISP.length > 0) htmlMsg += `<b>Duplicados en ISP:</b> ${dupsISP.join(", ")}`;
            Swal.fire({ icon: "error", title: "¡Lotes Repetidos!", html: htmlMsg, confirmButtonColor: "#d33" });
        }

        // Render Cabecera
        VISIBLE_COLUMNS.forEach(idx => {
            const th = document.createElement("th");
            th.textContent = headersByCartilla[tipo][idx] || `Col ${idx + 1}`;
            headerRow.appendChild(th);
        });

        // Render Filas con validaciones estrictas
        dataActual.forEach(row => {
            const tr = document.createElement("tr");
            const misDuplicados = (tipo === "IPP") ? dupsIPP : dupsISP;

            VISIBLE_COLUMNS.forEach(idx => {
                const td = document.createElement("td");
                let val = (row[idx] || "").toString().trim();
                td.textContent = val;

                // --- VALIDACIÓN LOTE (Índice 9) ---
                if (idx === 9) {
                    if (val === "") {
                        td.style.backgroundColor = "red";
                        td.title = "ERROR: El campo Lote no puede estar vacío";
                    } else {
                        if (misDuplicados.includes(val)) {
                            td.style.color = "#ff0202"; td.style.fontWeight = "bold";
                            td.title = `ADVERTENCIA: Lote ${val} duplicado en esta cartilla`;
                        }
                        if (tipo === "IPP" && !lotesISP.includes(val)) {
                            td.style.color = "red"; td.title = `LOTE: ${val} se tiene en IPP PERO NO EN ISP`;
                        } else if (tipo === "ISP" && !lotesIPP.includes(val)) {
                            td.style.color = "red"; td.title = `LOTE: ${val} se tiene en ISP PERO NO EN IPP`;
                        }
                    }
                }

                // --- VALIDACIÓN COLUMNA 11 (Índice 10) - VALOR 100 ---
                if (idx === 10) {
                    if (val === "") {
                        td.style.backgroundColor = "red";
                        td.title = "ERROR: El valor no puede estar vacío";
                    } else if (val != "100.00") {
                        td.style.color = "red"; td.style.fontWeight = "bold";
                        td.title = "ERROR: El valor siempre debe ser 100";
                    }
                }

                // --- VALIDACIÓN COLUMNA 30 (Índice 29) - VALOR 53 ---
                if (idx === 29) {
                    if (val === "") {
                        td.style.backgroundColor = "red";
                        td.title = "ERROR: El valor no puede estar vacío";
                    } else if (val != "53") {
                        td.style.color = "red"; td.style.fontWeight = "bold";
                        td.title = "ERROR: El valor debe ser 53";
                    }
                }

                // Otras validaciones obligatorias
                if (idx === 11 && val.toUpperCase() !== "UNIDADES") { td.style.color = "red"; td.title = "Debe decir UNIDADES"; }
                if (idx >= 12 && idx <= 19 && idx !== 16 && !val) { td.style.backgroundColor = "red"; td.title = "Campo obligatorio"; }
                if (idx === 28 && val != "59") { td.style.color = "red"; td.title = "Debe ser 59"; }
                if (idx >= 78 && !val) { td.style.backgroundColor = "red"; td.title = "Campo de plaga obligatorio"; }

                tr.appendChild(td);
            });
            bodyRows.appendChild(tr);
        });

        // Mensajes de Sincronización en el Pie
        let faltantesMensaje = "";
        const soloEnIPP = lotesIPP.filter(l => !lotesISP.includes(l));
        const soloEnISP = lotesISP.filter(l => !lotesIPP.includes(l));
        if (soloEnIPP.length > 0) faltantesMensaje += `<br><span style="color:red; font-size:12px; font-weight:bold;">LOTE : ${soloEnIPP.join(", ")} se tiene en IPP PERO NO EN ISP</span>`;
        if (soloEnISP.length > 0) faltantesMensaje += `<br><span style="color:red; font-size:12px; font-weight:bold;">LOTE : ${soloEnISP.join(", ")} se tiene en ISP PERO NO EN IPP</span>`;

        totalFilasDiv.innerHTML = `<b>Registros mostrados:</b> ${dataActual.length}<br>${faltantesMensaje || '<span style="color:green">✅ Sincronización OK</span>'}`;
        exportBtn.disabled = false;
    });

    /* ==========================================================
       LIMPIEZA Y EXPORTACIÓN
       ========================================================== */
    function limpiarTodoEsparrago() {
        rawDataByCartilla = { IPP: [], ISP: [] };
        headersByCartilla = { IPP: [], ISP: [] };
        fileInput.value = ""; 
        headerRow.innerHTML = "";
        bodyRows.innerHTML = "";
        totalFilasDiv.innerHTML = "";
        inspectionTypeSelect.innerHTML = '<option disabled selected>Selecciona tipo</option>';
        inspectionTypeSelect.disabled = true;
        inspectionDateSelect.innerHTML = '<option disabled selected>Selecciona fecha</option>';
        inspectionDateSelect.disabled = true;
        updateDateSelect.innerHTML = '<option disabled selected>Auto-Fecha</option>';
        runReviewBtn.disabled = true;
        exportBtn.disabled = true;
        Swal.fire({ icon: "success", title: "Módulo Reiniciado", text: "El módulo de plagas se limpió correctamente.", timer: 1000, showConfirmButton: false });
    }

    clearBtn.addEventListener("click", limpiarTodoEsparrago);

   // ==========================================================
// FUNCIÓN DE APOYO PARA GENERAR EL EXCEL (ORDEN ESPECÍFICO)
// ==========================================================
function exportExcelFiltrado(data, nombreArchivo) {
    const tipo = document.getElementById("inspectionTypePlagasEsparrago").value;
    const wsData = [];

    // Definición de rangos solicitados (Índices Excel - 1)
    const rango1 = Array.from({ length: 11 }, (_, i) => i + 9);  // Col 10 a 20 (Índice 9 a 19)
    const rango2 = Array.from({ length: 5 }, (_, i) => i + 28);  // Col 29 a 33 (Índice 28 a 32)
    const rango3 = Array.from({ length: 70 }, (_, i) => i + 33); // Col 34 a 103 (Índice 33 a 102)

    // 1. Cabeceras (usando los headers guardados al cargar el archivo)
    const headers = [
        ...rango1.map(idx => headersByCartilla[tipo][idx] || `Col ${idx + 1}`),
        "VACIO_1",
        ...rango2.map(idx => headersByCartilla[tipo][idx] || `Col ${idx + 1}`),
        "VACIO_2",
        "VACIO_3",
        ...rango3.map(idx => headersByCartilla[tipo][idx] || `Col ${idx + 1}`)
    ];
    wsData.push(headers);

    // 2. Datos
    data.forEach(row => {
        const filaFormateada = [
            ...rango1.map(idx => {
                let val = row[idx] || "";
                // Formatear solo la columna 20 (Índice 19) si viene YYYYMMDD
                if (idx === 19 && val.toString().length === 8) {
                    const y = val.substring(0, 4), m = val.substring(4, 6), d = val.substring(6, 8);
                    return `${d}/${m}/${y}`;
                }
                return val;
            }),
            "", // VACIO_1
            ...rango2.map(idx => row[idx] || ""),
            "", // VACIO_2
            "", // VACIO_3
            ...rango3.map(idx => row[idx] || "")
        ];
        wsData.push(filaFormateada);
    });

    // 3. Generación del archivo con la librería XLSX
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, "Revision_Export");
    XLSX.writeFile(wb, nombreArchivo);
}

// ==========================================================
// LÓGICA DEL BOTÓN EXPORTAR CON SWEETALERT
// ==========================================================
exportBtn.addEventListener("click", () => {
    const tipoActual = inspectionTypeSelect.value; 
    const fechaActual = inspectionDateSelect.value;

    if (!tipoActual || !rawDataByCartilla[tipoActual].length) {
        Swal.fire("Error", "No hay datos cargados para esta cartilla", "error");
        return;
    }

    // Obtener fechas disponibles SOLO de la cartilla actual (IPP o ISP)
    let fechasDisponibles = [
        ...new Set(rawDataByCartilla[tipoActual].map(r => r[76]).filter(Boolean))
    ];

    const renderCards = () => `
        <div class="swal-fechas-container" style="display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; margin-top: 15px;">
            ${fechasDisponibles.map(f => {
                const esLaQueReviso = f === fechaActual;
                return `
                    <div class="swal-fecha-card" style="padding: 8px 12px; border-radius: 20px; background: ${esLaQueReviso ? '#0E1B40' : '#f0f0f0'}; color: ${esLaQueReviso ? 'white' : '#333'}; border: 1px solid #ccc; display: flex; align-items: center; gap: 8px; font-size: 12px;">
                        <span>${f}</span>
                        ${esLaQueReviso ? '' : `<button class="swal-fecha-delete" data-fecha="${f}" style="border: none; background: none; cursor: pointer; color: red; font-weight: bold; padding: 0 4px;">×</button>`}
                    </div>
                `;
            }).join("")}
        </div>
    `;

    Swal.fire({
        title: `Exportar Cartilla ${tipoActual}`,
        html: `
            <div style="text-align:center; font-family: sans-serif;">
                <p>Cartilla activa: <b>${tipoActual}</b></p><br>
                <p>Fecha en revisión: <b>${fechaActual}</b></p>
                <hr style="border: 0; border-top: 1px solid #ffffff; margin: 12px 0;">
                <p style="font-size: 14px; color: #666;">Selecciona fechas de <b>${tipoActual}</b> para exportar:</p>
                ${renderCards()}
            </div>
        `,
        width: 600,
        showCancelButton: true,
        showDenyButton: true,
        confirmButtonColor: "#0E1B40",
        confirmButtonText: "Solo esta fecha",
        denyButtonText: "Unir seleccionadas",
        cancelButtonText: "Cancelar",
        didOpen: () => {
            const container = Swal.getHtmlContainer();
            container.addEventListener("click", e => {
                const btn = e.target.closest(".swal-fecha-delete");
                if (!btn) return;
                const f = btn.dataset.fecha;
                fechasDisponibles = fechasDisponibles.filter(x => x !== f);
                Swal.update({ html: `
                    <div style="text-align:center; font-family: sans-serif;">
                        <p>Cartilla activa: <b>${tipoActual}</b></p>
                        <p>Fecha en revisión: <b>${fechaActual}</b></p>
                        <hr style="border: 0; border-top: 1px solid #eee; margin: 15px 0;">
                        <p style="font-size: 14px; color: #666;">Selecciona fechas de <b>${tipoActual}</b> para exportar:</p>
                        ${renderCards()}
                    </div>
                `});
            });
        }
    }).then(res => {
        if (res.isConfirmed) {
            const dataFinal = rawDataByCartilla[tipoActual].filter(r => r[76] === fechaActual);
            exportExcelFiltrado(dataFinal, `Export_${tipoActual}_${fechaActual.replaceAll("/","-")}.xlsx`);
        } else if (res.isDenied) {
            const dataFinal = rawDataByCartilla[tipoActual].filter(r => fechasDisponibles.includes(r[76]));
            exportExcelFiltrado(dataFinal, `Export_${tipoActual}_Unificado.xlsx`);
        }
    });
});
})();