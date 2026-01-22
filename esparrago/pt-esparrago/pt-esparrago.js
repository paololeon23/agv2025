/* ============================================================
   MÓDULO: REVISIÓN PT ESPÁRRAGO (PTES) - VERSIÓN DEFINITIVA
   ============================================================ */
(() => {
    const fileInput = document.getElementById("filePTEsparrago");
    const inspectionDateSelect = document.getElementById("inspectionDatePTEsparrago");
    const updateDateSelect = document.getElementById("updateDatePTEsparrago");
    const runReviewBtn = document.getElementById("runReviewPTEsparrago");
    const exportBtn = document.getElementById("exportPTEsparrago");
    const bodyRows = document.getElementById("resultsBodyPTEsparrago");
    const headerRow = document.getElementById("resultsHeaderPTEsparrago");
    const totalFilasDiv = document.getElementById("totalFilasPTEsparrago");

    let rawRows = [];
    let headersOriginal = [];

    // 24 Columnas Visuales según tu requerimiento (Excel-1)
    const VISUAL_COLS_PT = [0, 1, 3, 6, 9, 10, 11, 27, 36, 37, 45, 46, 49, 50, 51, 53, 55, 58, 59, 60, 61, 62, 64, 71];
    
    // BASE DE DATOS INTEGRAL (MERCADO -> CLIENTE -> FORMATO)
    const DB_PESOS = {
        "ASIA": {
            "VALLE FRESH": { "10X500": { min: 515, max: 520, tipo: "ATADO" } },
            "RAT TRADING": { "10X500": { min: 515, max: 520, tipo: "ATADO" } },
            "OMSEM": { "10X500": { min: 515, max: 520, tipo: "ATADO" } }
        },
        "EUROPA": {
            "AEI": { "10X250": { min: 250, max: 255, tipo: "ATADO" }, "20X250": { min: 250, max: 255, tipo: "ATADO" } },
            "BARRIOS & JOULE LTD": { 
                "11X450": { min: 4950, max: 5049, tipo: "CAJA" }, "20X250": { min: 5000, max: 5100, tipo: "CAJA" },
                "25X200": { min: 5000, max: 5100, tipo: "CAJA" }, "24X125": { min: 3000, max: 3060, tipo: "CAJA" }, "40X100": { min: 4080, max: 4160, tipo: "CAJA" }
            },
            "GARCIA MATEO": { 
                "12X250": { min: 250, max: 258, tipo: "ATADO" }, "20X250": { min: 250, max: 258, tipo: "ATADO" },
                "17X300": { min: 300, max: 309, tipo: "ATADO" }, "6X400": { min: 400, max: 412, tipo: "ATADO" }, "8X240": { min: 420, max: 433, tipo: "ATADO" }
            },
            "PAPAGALLO PRODUCE LLC": { "17X300": { min: 300, max: 306, tipo: "ATADO" }, "20X250": { min: 250, max: 255, tipo: "ATADO" } },
            "AMS-EUROPEAN": { "8X420": { min: 420, max: 428, tipo: "ATADO" }, "12X250": { min: 250, max: 255, tipo: "ATADO" } },
            "NATURE’S PRIDE B.V.": { 
                "10X250": { min: 250, max: 255, tipo: "ATADO" }, "20X250": { min: 250, max: 255, tipo: "ATADO" },
                "20X200": { min: 200, max: 204, tipo: "ATADO" }, "11X450": { min: 450, max: 459, tipo: "ATADO" }
            },
            "SPECIAL FRUIT NV": { "10X250": { min: 250, max: 255, tipo: "ATADO" }, "20X250": { min: 250, max: 255, tipo: "ATADO" }, "11X450": { min: 450, max: 459, tipo: "ATADO" } },
            "EDEKA AG FRUCHTKONTOR WEST": { "10X250": { min: 255, max: 260, tipo: "ATADO" } },
            "VERDE IMPORT": { "6X400": { min: 400, max: 408, tipo: "ATADO" }, "10X250": { min: 250, max: 255, tipo: "ATADO" }, "11X450": { min: 450, max: 459, tipo: "ATADO" } },
            "TEBOZA": { "20X200": { min: 200, max: 204, tipo: "ATADO" }, "20X250": { min: 450, max: 459, tipo: "ATADO" }, "11X450": { min: 250, max: 459, tipo: "ATADO" } },
            "COOP TRADING": { "10X250": { min: 250, max: 255, tipo: "ATADO" } },
            "AARTSEN BREDA B.V.": { "11X450": { min: 450, max: 459, tipo: "ATADO" }, "10X250": { min: 250, max: 255, tipo: "ATADO" } },
            "METRO": { "15X325": { min: 4875, max: 4875, tipo: "CAJA" }, "11X450": { min: 5170, max: 5170, tipo: "CAJA" } }
        },
        "USA": {
            "FARM DIRECT SUPPLY LLC": { "11X450": { min: 4950, max: 4960, tipo: "CAJA" } },
            "SQUARE ONE FARMS LLC": { "11X450": { min: 4950, max: 4960, tipo: "CAJA" }, "10X544": { min: 544, max: 545, tipo: "ATADO" } },
            "HARVEST SENSATIONS LLC": { "11X450": { min: 4950, max: 4960, tipo: "CAJA" } },
            "WALMART INC.": { "11X450": { min: 5000, max: 5010, tipo: "CAJA" } },
            "PRIME TIME INTERNATIONAL": { "11X450": { min: 4950, max: 4960, tipo: "CAJA" } },
            "JMB PRODUCE": { "11X450": { min: 4950, max: 4960, tipo: "CAJA" } },
            "ALPINE FRESH": { "11X450": { min: 4950, max: 4960, tipo: "CAJA" } },
            "ALPINE FRESH – SMALL": { "11X450": { min: 450, max: 470, tipo: "ATADO" } },
            "FRUVEG MARKETING INC.": { "11X450": { min: 4950, max: 4960, tipo: "CAJA" }, "15X325": { min: 325, max: 332, tipo: "ATADO" }, "28X453": { min: 450, max: 453, tipo: "ATADO" } },
            "METRO": { "15X325": { min: 4875, max: 4875, tipo: "CAJA" }, "11X450": { min: 5170, max: 5170, tipo: "CAJA" } }
        }
    };

    // --- CARGA DE ARCHIVO ---
    fileInput.addEventListener("change", async e => {
        const file = e.target.files[0];
        if (!file) return;
        const buffer = await file.arrayBuffer();
        const wb = XLSX.read(buffer, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 });

        if (!data[3] || data[3][8]?.toString().trim().toUpperCase() !== "PTES") {
            Swal.fire("Error", "El archivo no es una cartilla PTES válida", "error");
            fileInput.value = ""; return;
        }

        headersOriginal = data[5] || [];
        rawRows = data.slice(6);

        const fechas = [...new Set(rawRows.map(r => r[46]?.toString().trim()))].filter(Boolean);
        inspectionDateSelect.innerHTML = '<option value="" disabled selected>Selecciona Fecha Inspección</option>';
        fechas.forEach(f => inspectionDateSelect.add(new Option(f, f)));
        inspectionDateSelect.disabled = false;
        runReviewBtn.disabled = false; 
    });

    // --- SELECCIÓN DE FECHA ---
    inspectionDateSelect.addEventListener("change", () => {
        const fSel = inspectionDateSelect.value;
        if (fSel) {
            const row = rawRows.find(r => r[46]?.toString().trim() === fSel);
            if (row) {
                const lmr = row[51] || "PENDIENTE";
                updateDateSelect.innerHTML = `<option value="${lmr}">${lmr}</option>`;
            }
        }
    });

        // --- BOTÓN REVISAR PT ESPÁRRAGO (VERSIÓN DINÁMICA CON CLIENTES EN ROJO) ---
        runReviewBtn.addEventListener("click", () => {
            const fSel = inspectionDateSelect.value;
            const STICKY_COLS_PT = [0, 1, 6, 9]; 

            if (!fSel || fSel === "") {
                Swal.fire({ icon: 'warning', title: 'Fecha Requerida', text: 'Selecciona una Fecha de Inspección.' });
                return;
            }

            // 1. Filtrado inicial por fecha
            const filtradas = rawRows.filter(r => r[46]?.toString().trim() === fSel);
            
            // 2. Renderizar Encabezados (Esto limpia automáticamente los selects anteriores)
            headerRow.innerHTML = "";
            VISUAL_COLS_PT.forEach(idx => {
                const th = document.createElement("th");
                
                // Ajuste de anchos según lo conversado
                if (idx === 37) th.style.minWidth = "180px"; 
                if (idx === 49) th.style.minWidth = "89px"; 

                if (idx === 37 || idx === 49) {
                    const titulo = idx === 37 ? "Cliente Esp." : "Formato Asp";
                    const idSel = idx === 37 ? "filterCliente" : "filterFormato";
                    th.innerHTML = `
                        <div style="display: flex; flex-direction: column; gap: 4px; align-items: flex-start;">
                            <span>${titulo}</span>
                            <select id="${idSel}" style="width: 100%; font-size: 11px; color: black; padding: 2px; border-radius: 4px; border: 1px solid #ccc; background: white;">
                                <option value="TODOS">-- TODOS --</option>
                            </select>
                        </div>`;
                } else {
                    th.textContent = headersOriginal[idx] || "Col " + (idx + 1);
                }

                if (STICKY_COLS_PT.includes(idx)) th.classList.add("pt-esparrago-col", `pt-esparrago-col-${idx}`);
                headerRow.appendChild(th);
            });

            // 3. Función de Renderizado
            const renderizarTabla = (dataActual) => {
                bodyRows.innerHTML = "";
                dataActual.forEach(r => {
                    const tr = document.createElement("tr");
                    VISUAL_COLS_PT.forEach(cIdx => {
                        const td = document.createElement("td");
                        let valor = r[cIdx] || "";
                        if (cIdx === 3 && typeof valor === 'number') valor = serialExcelAFecha(valor);
                        td.textContent = valor;
                        if (STICKY_COLS_PT.includes(cIdx)) td.classList.add("pt-esparrago-col", `pt-esparrago-col-${cIdx}`);
                        if (cIdx === 37) td.style.cssText = "min-width: 190px; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;";
                        
                        aplicarValidaciones(td, r, cIdx, valor);
                        tr.appendChild(td);
                    });
                    bodyRows.appendChild(tr);
                });
                totalFilasDiv.innerHTML = `Total registros mostrados : ${dataActual.length}`;
            };

            // 4. Lógica de Filtro Cruzado con Clientes en Rojo
            const ejecutarFiltroCruzado = () => {
                const vCli = document.getElementById("filterCliente").value;
                const vFor = document.getElementById("filterFormato").value;

                const dataFinal = filtradas.filter(r => {
                    const matchCli = vCli === "TODOS" || (r[37] || "").toString().trim() === vCli;
                    const matchFor = vFor === "TODOS" || (r[49] || "").toString().trim() === vFor;
                    return matchCli && matchFor;
                });

                renderizarTabla(dataFinal);
                actualizarOpcionesSelect("filterCliente", 37, vCli, dataFinal, vFor);
                actualizarOpcionesSelect("filterFormato", 49, vFor, dataFinal, vCli);
            };

            const actualizarOpcionesSelect = (id, colIdx, valorActual, dataActual, valorOtroFiltro) => {
                const sel = document.getElementById(id);
                const dataParaUnicos = (valorOtroFiltro === "TODOS") ? filtradas : dataActual;
                const unicos = [...new Set(dataParaUnicos.map(r => (r[colIdx] || "").toString().trim()))].filter(Boolean).sort();
                
                // Obtener clientes registrados en tu DB_PESOS para comparar
                const registrados = Object.values(DB_PESOS).flatMap(m => Object.keys(m));

                sel.innerHTML = '<option value="TODOS">-- TODOS --</option>';
                unicos.forEach(v => {
                    const opt = new Option(v, v);
                    if (v === valorActual) opt.selected = true;

                    // Poner en rojo si el cliente no está en la base de datos de pesos
                    if (id === "filterCliente") {
                        const existe = registrados.some(reg => v.toUpperCase().includes(reg.toUpperCase()));
                        if (!existe) {
                            opt.style.color = "red";
                            opt.textContent = "❌ " + v;
                        }
                    }
                    sel.add(opt);
                });
            };

            // 5. Carga inicial
            renderizarTabla(filtradas);
            actualizarOpcionesSelect("filterCliente", 37, "TODOS", filtradas, "TODOS");
            actualizarOpcionesSelect("filterFormato", 49, "TODOS", filtradas, "TODOS");

            // Listeners de los nuevos selects
            document.getElementById("filterCliente").addEventListener("change", ejecutarFiltroCruzado);
            document.getElementById("filterFormato").addEventListener("change", ejecutarFiltroCruzado);

            exportBtn.disabled = false;
        });

        function serialExcelAFecha(serial) {
        if (!serial || isNaN(serial)) return serial;
        // Ajuste para el sistema de fechas de Excel
        const fecha = new Date(Math.round((serial - 25569) * 86400 * 1000));
        const dia = fecha.getUTCDate().toString().padStart(2, '0');
        const mes = (fecha.getUTCMonth() + 1).toString().padStart(2, '0');
        const anio = fecha.getUTCFullYear();
        return `${dia}/${mes}/${anio}`;
    }

    // --- VALIDACIÓN DE CELDAS ---
    function aplicarValidaciones(td, fila, colIdx, valor) {
        const valStr = (valor || "").toString().trim().toUpperCase();
        const valNum = parseFloat(valor);
        const mercado = (fila[53] || "").toString().trim().toUpperCase();
        const cliente = (fila[37] || "").toString().trim().toUpperCase();
        const formato = (fila[49] || "").toString().trim().toUpperCase().replace(/\s/g, "");
        const embalaje = (fila[71] || "").toString().trim().toUpperCase();
        
        // 1. Definir Calibre (Columna 37 de Excel es índice 36 en JS)
        const calibre = (fila[36] || "").toString().trim().toUpperCase();

        // 2. Vacíos Críticos
        const criticos = [9, 10, 37, 49, 53, 64]; 
        if (criticos.includes(colIdx) && !valStr) {
            td.setAttribute("style", "background-color: #f51700 !important; color: white !important;");
            td.title = "Este campo es obligatorio y está vacío";
            return;
        }

        // --- LÓGICA DE IDENTIFICACIÓN DE CLIENTE Y RANGO ---
        let clienteKey = Object.keys(DB_PESOS[mercado] || {}).find(k => cliente.includes(k));
        
        if (clienteKey === "ALPINE FRESH" && calibre === "SMALL") {
            clienteKey = "ALPINE FRESH – SMALL";
        }

        const infoCliente = DB_PESOS[mercado]?.[clienteKey];
        const rango = infoCliente?.[formato];

        // 3. Cliente vs Formato (Col 50)
        if (colIdx === 49 && infoCliente) {
            if (!rango) {
                td.style.backgroundColor = "yellow";
                td.title = `Formato ${formato} no registrado para ${clienteKey}`;
            }
        }

        // 4. Pesos (59 a 63)
        if (colIdx >= 58 && colIdx <= 62 && !isNaN(valNum)) {
            if (rango) {
                if (valNum < rango.min || valNum > rango.max) {
                    td.style.color = "red";
                    td.style.fontWeight = "bold";

                    if (calibre === "SMALL") {
                        td.title = `Peso incorrecto: El formato ${formato} con Calibre SMALL debe pesar entre ${rango.min}g y ${rango.max}g (Atado)`;
                    } else {
                        td.title = `Peso incorrecto: El formato ${formato} para Calibre ${calibre || 'Estándar'} debe estar entre ${rango.min}g y ${rango.max}g`;
                    }
                }
            }
        }

        // 5. Tipo Embalaje (Col 72)
        if (colIdx === 71 && rango) {
            if (embalaje !== rango.tipo) {
                td.style.color = "red";
                td.style.fontWeight = "bold";
                td.title = `Error de embalaje: Para ${formato} debe ser ${rango.tipo}`;
            }
        }

        // 6. Lote (Columna 10 / idx 9) - LÓGICA FILTRADA
if (colIdx === 9) {
    // Si llegamos aquí es porque valStr TIENE DATA (el return de vacíos de arriba ya filtró)
    
    let msgError = "";

    // PASO 1: Revisar longitud (Si falla, ya no calculamos el Juliano para no perder tiempo)
    if (valStr.length !== 13) {
        msgError = `El lote debe tener exactamente 13 dígitos (Detectados: ${valStr.length})`;
    } 
    // PASO 2: Solo si tiene los 13 dígitos, calculamos y comparamos el Día Juliano
    else {
        const fechaInspeccionStr = (fila[46] || "").toString().trim();
        if (fechaInspeccionStr) {
            const partes = fechaInspeccionStr.split("/");
            if (partes.length === 3) {
                const fechaObj = new Date(partes[2], partes[1] - 1, partes[0]);
                const inicioAnio = new Date(fechaObj.getFullYear(), 0, 0);
                const unDia = 1000 * 60 * 60 * 24;
                
                // Cálculo del día juliano
                const julianoEsperado = Math.floor((fechaObj - inicioAnio) / unDia).toString().padStart(3, '0');
                const julianoEnLote = valStr.slice(-3);

                if (julianoEnLote !== julianoEsperado) {
                    msgError = `Día Juliano incorrecto: Para ${fechaInspeccionStr} debe terminar en ${julianoEsperado}`;
                }
            }
        }
    }

    // Aplicar estilo de error si algo falló en los pasos anteriores
    if (msgError) {
        td.style.color = "red";
        td.style.fontWeight = "bold";
        td.title = msgError;
    }
}

        // 7. Muestra (Columna 11 / idx 10)
        if (colIdx === 10 && valNum < 100) {
            td.style.color = "red";
            td.title = "La muestra mínima es de 100 unidades";
        }
        
        // 8. Destino (Columna 54 / idx 53)
        if (colIdx === 53 && !["USA", "EUROPA", "ASIA"].includes(valStr)) {
            td.style.backgroundColor = "#f51700";
            td.style.color = "white";
            td.title = "Mercado no válido. Solo se permite USA, EUROPA o ASIA";
        }
    }
// --- EXPORTAR CON ORDEN PERSONALIZADO ---
    exportBtn.addEventListener("click", () => {
        const fSel = inspectionDateSelect.value;

        // 1. Filtrar las filas por la fecha seleccionada
        const filasAExportar = rawRows.filter(r => r[46]?.toString().trim() === fSel);

        if (filasAExportar.length === 0) {
            Swal.fire("Aviso", "No hay datos para exportar con la fecha seleccionada", "warning");
            return;
        }

        // 2. DEFINIR EL NUEVO ORDEN DE COLUMNAS (Índices JS = Excel - 1)
        // Pedido: 37, 5, 10, 11, 28, 34, 35, 36, 38, 39... hasta 133
        const nuevoOrdenIndices = [
            36, // Excel 37
            4,  // Excel 5
            9,  // Excel 10
            10, // Excel 11
            27, // Excel 28
            33, // Excel 34
            34, // Excel 35
            35, // Excel 36
            37, // Excel 38
        ];

        // Agregar de corrido desde la columna 39 hasta la 133 (Índices JS 38 hasta 132)
        for (let i = 38; i <= 132; i++) {
            nuevoOrdenIndices.push(i);
        }

        // 3. MAPEAR LOS ENCABEZADOS (Para que el título del Excel coincida con el orden)
        const encabezadosNuevos = nuevoOrdenIndices.map(idx => headersOriginal[idx] || `Col ${idx + 1}`);

        // 4. MAPEAR LOS DATOS
        const matrizDataNuevos = filasAExportar.map(fila => {
            return nuevoOrdenIndices.map(idx => {
                let valor = fila[idx];
                // Si es la columna de fecha (índice 3), la convertimos a formato legible
                if (idx === 3 && typeof valor === 'number') {
                    return serialExcelAFecha(valor);
                }
                return valor === undefined || valor === null ? "" : valor;
            });
        });

        // 5. GENERAR EL ARCHIVO EXCEL
        const ws = XLSX.utils.aoa_to_sheet([encabezadosNuevos, ...matrizDataNuevos]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Revision_PT_Reordenado");

        const timestamp = new Date().getTime().toString().slice(-4);
        XLSX.writeFile(wb, `Reporte_PT_Esparrago_${fSel}_ID${timestamp}.xlsx`);
    });

        const clearBtn = document.getElementById("clearDataPTEsparrago"); // O el ID que uses en tu HTML
    /* ============================================================
    7. LIMPIEZA COMPLETA (ESTILO ARÁNDANOS)
    ============================================================ */
    clearBtn.addEventListener("click", () => {
        limpiarTodoEsparrago();
    });

    function limpiarTodoEsparrago() {
        // --- 1. LIMPIAR DATA INTERNA ---
        rawRows = [];
        headersOriginal = [];

        // --- 2. LIMPIAR INPUT FILE ---
        fileInput.value = "";

        // --- 3. LIMPIAR TABLA (Encabezados y Cuerpo) ---
        headerRow.innerHTML = "";
        bodyRows.innerHTML = "";
        totalFilasDiv.innerHTML = ""; // <--- Eliminado el texto "Esperando revisión"

        // --- 4. RESET SELECTS (CONTENIDO + ESTILOS) ---
        // Fecha Inspección
        inspectionDateSelect.innerHTML = '<option value="" disabled selected>Selecciona una fecha</option>';
        inspectionDateSelect.disabled = true;
        inspectionDateSelect.style.border = "";
        inspectionDateSelect.style.color = "";

        // Fecha LMR (Update Date)
        updateDateSelect.innerHTML = '<option value="" disabled selected>Se actualizará automáticamente</option>';
        updateDateSelect.disabled = true;
        updateDateSelect.style.border = "";
        updateDateSelect.style.color = "";

        // --- 5. RESET BOTONES ---
        runReviewBtn.disabled = true;
        exportBtn.disabled = true;

        // --- 6. ALERTA FINAL ---
        Swal.fire({
            icon: "success",
            title: "Limpieza completa",
            text: "El módulo de Espárrago se limpió correctamente.",
            timer: 1000,
            showConfirmButton: false
        });
    }

})();