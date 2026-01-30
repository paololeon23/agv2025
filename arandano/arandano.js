(() => {

    /* ===============================
      DOM
    =============================== */
    const fileInput = document.getElementById("fileArandano");
    const inspectionTypeSelect = document.getElementById("inspectionType");
    const inspectionDateSelect = document.getElementById("inspectionDate");
    const updateDateSelect = document.getElementById("updateDate");
    const runReviewBtn = document.getElementById("runReviewArandano");

    const headerRow = document.getElementById("resultsHeader");
    const bodyRows = document.getElementById("resultsBody");
    const totalFilasDiv = document.getElementById("totalFilas");

    const notificationIcon = document.getElementById("notificationIcon");
    const notificationCount = document.getElementById("notificationCount");

    const clearBtnArandano = document.getElementById("clearArandano");

    // ===============================
    // BOTÓN EXPORTAR ARÁNDANOS
    // ===============================
    const exportBtnArandano = document.getElementById("exportArandano");

    /* ===============================
      DATA
    =============================== */
    let rawRows = [];
    let headersByCartilla = {};
    let columnsByCartilla = {};
    let notificationErrors = [];
    let cartillaStatus = { MPHA:false, MPBA:false, MPGA:false };

    /* ===============================
      FILE INPUT
    =============================== */
    fileInput.addEventListener("change", async e => {
      const files = Array.from(e.target.files);
      if (!files.length) return;

      /* ❌ MÁXIMO 3 ARCHIVOS */
      if (files.length > 3) {
        Swal.fire(
          "Demasiados archivos",
          "Solo se permiten <b>3 cartillas</b> como máximo (MPHA, MPBA y MPGA).",
          "error"
        );
        fileInput.value = "";
        return;
      }

      rawRows = [];
      headersByCartilla = {};
      columnsByCartilla = {};
      cartillaStatus = { MPHA:false, MPBA:false, MPGA:false };
      resetAll();
      // Limpieza extra por si antes hubo LMR doble
      inspectionDateSelect.style.border = "";
      inspectionDateSelect.style.color = "";
      updateDateSelect.style.border = "";
      updateDateSelect.style.color = "";
      inspectionDateSelect.value = "";
      updateDateSelect.value = "";
      inspectionDateSelect.innerHTML = `<option value="" disabled selected>Selecciona</option>`;
      updateDateSelect.innerHTML = `<option value="" disabled selected>Se actualizará automáticamente</option>`;


      const cartillasCargadas = new Set();

      for (const file of files) {
        const buffer = await file.arrayBuffer();
        const wb = XLSX.read(buffer, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false });

        /* ===== VALIDAR FILA 4 ===== */
        const fila4 = data[3] || [];
        const estado = (fila4[13] || "").toUpperCase().trim();
        const cartillaRaw = (fila4[8] || "").toUpperCase().trim();

        const CARTILLAS_PERMITIDAS = {
          MPBAR: "MPBA",
          MPGAR: "MPGA",
          MPHPAR: "MPHA"
        };

        const cartilla = CARTILLAS_PERMITIDAS[cartillaRaw];

        /* ❌ CARTILLA NO PERMITIDA */
        if (!cartilla) {
          Swal.fire(
            "Cartilla no válida",
            `La cartilla <b>${cartillaRaw || "DESCONOCIDA"}</b> no está permitida.<br>
            Solo se aceptan: <b>MPHA, MPBA y MPGA</b>.`,
            "error"
          );
          fileInput.value = "";
          return;
        }

        /* ❌ CARTILLA DUPLICADA */
        if (cartillasCargadas.has(cartilla)) {
          Swal.fire(
            "Cartilla duplicada",
            `La cartilla <b>${cartilla}</b> ya fue cargada.<br>
            No se permiten cartillas repetidas.`,
            "error"
          );
          fileInput.value = "";
          return;
        }

        cartillasCargadas.add(cartilla);

        /* ❌ ESTADO INCORRECTO */
        if (estado !== "ENVIADA") {
          Swal.fire(
            "Estado incorrecto",
            `La cartilla <b>${cartilla}</b> debe estar en estado <b>ENVIADA</b>.`,
            "error"
          );
          fileInput.value = "";
          return;
        }

        /* ===== ELIMINAR 5 FILAS ===== */
        data.splice(0, 5);
        if (data.length < 2) continue;

        /* ===== HEADERS POR CARTILLA ===== */
        headersByCartilla[cartilla] = data[0];
        columnsByCartilla[cartilla] = data[0].map((h, i) => ({
          id: `columna_${i + 1}`,
          header: h || "",
          originalIndex: i
        }));

        /* ❌ VALIDAR 101 COLUMNAS */
        if (headersByCartilla[cartilla].length !== 101) {
          Swal.fire(
            "Estructura incorrecta",
            `El archivo de <b>${cartilla}</b> tiene <b>${headersByCartilla[cartilla].length}</b> columnas.<br>
            Se requieren <b>101 columnas</b>.`,
            "error"
          );
          fileInput.value = "";
          return;
        }

        /* ===== FILAS ===== */
        const filas = data.slice(1);
        if (filas.length) cartillaStatus[cartilla] = true;

        rawRows.push(...filas);
      }

      cargarSelectCartillas();
      setNotification(detectarFechasInspeccionFaltantes());
      mostrarResumenCartillas();
      runReviewBtn.disabled = false;
    });

    /* ===============================
      INICIALIZAR COLUMNAS (ESTILO UVA)
    =============================== */
    function initColumns() {
      columns = headers.map((h, i) => ({
        id: `columna_${i + 1}`,
        header: h || "",
        originalIndex: i
      }));
    }

    /* ===============================
      SELECT DINÁMICO
    =============================== */
    function cargarSelectCartillas() {
      inspectionTypeSelect.innerHTML = `<option disabled selected>Selecciona tipo</option>`;
      inspectionTypeSelect.disabled = true;

      Object.entries(cartillaStatus).forEach(([k,v]) => {
        if (v) {
          const o = document.createElement("option");
          o.value = k;
          o.textContent = k;
          inspectionTypeSelect.appendChild(o);
        }
      });

      inspectionTypeSelect.disabled = false;
    }

      /* ===============================
        SWEETALERT RESUMEN
      =============================== */
      function mostrarResumenCartillas() {
        let html = `
          <div style="text-align:center;line-height:1.0">
            ${Object.entries(cartillaStatus).map(([k,v]) =>
              `${v ? "🟢" : "🔴"} <b>${k}</b> : ${v ? "Tiene data" : "No tiene data"}`
            ).join("<br><br>")}
          </div>
        `;

        Swal.fire({
          icon: "info",
          title: "Resumen de cartillas",
          html,
          confirmButtonText: "Aceptar"
        });
      }

      /* ===============================
        CARTILLA → FECHAS
      =============================== */
      inspectionTypeSelect.addEventListener("change", () => {
        const tipo = inspectionTypeSelect.value;

        const fechas = [...new Set(
          rawRows
            .filter(r => (r[1] || "").toUpperCase() === tipo)
            .map(r => parseExcelDateISO(r[40]))
            .filter(Boolean)
        )];

        fillSelectWithFormat(inspectionDateSelect, fechas);
        inspectionDateSelect.disabled = false;
      });

      /* ===============================
        FECHA → LMR (AUTOMÁTICO CON MAYORÍA)
      =============================== */
      inspectionDateSelect.addEventListener("change", () => {
        const tipo = inspectionTypeSelect.value;
        const fechaISO = inspectionDateSelect.value;

        const lmrDates = rawRows
          .filter(r =>
            (r[1] || "").toUpperCase() === tipo &&
            parseExcelDateISO(r[40]) === fechaISO
          )
          .map(r => parseExcelDateISO(r[50]))
          .filter(Boolean);

        const unique = [...new Set(lmrDates)];
        
        // 🔍 DETECTAR FECHA MAYORITARIA
        const conteo = {};
        lmrDates.forEach(f => {
          conteo[f] = (conteo[f] || 0) + 1;
        });

        const fechaMayoritaria = Object.entries(conteo)
          .sort((a, b) => b[1] - a[1])[0]?.[0];

        updateDateSelect.innerHTML = "";

        if (fechaMayoritaria) {
          const o = document.createElement("option");
          o.value = fechaMayoritaria;
          o.textContent = formatISOToDMY(fechaMayoritaria);
          updateDateSelect.appendChild(o);
        }

        // ⚠️ ALERTA SI HAY MÚLTIPLES FECHAS
        if (unique.length > 1) {
          updateDateSelect.style.border = "2px solid red";
          updateDateSelect.style.color = "red";

          const detalles = Object.entries(conteo)
            .map(([fecha, count]) => 
              `${formatISOToDMY(fecha)}: <b>${count} registros</b> ${fecha === fechaMayoritaria ? '(MAYORITARIA)' : ''}`
            )
            .join("<br>");

          Swal.fire({
            icon: "warning",
            title: "Múltiples fechas LMR detectadas",
            html: `
              <div style="line-height:1.6; text-align:left">
                Se detectaron <b>${unique.length}</b> fechas LMR diferentes:<br><br>
                ${detalles}<br><br>
                Se usará la fecha mayoritaria. Las filas con fechas minoritarias se marcarán como error.
              </div>
            `,
            confirmButtonText: "Entendido"
          });
        } else {
          updateDateSelect.style.border = "";
          updateDateSelect.style.color = "";
        }
      });

      /* =============================== 
      NOTIFICACION
      =============================== */
      notificationIcon.addEventListener("click", () => {
        if (!notificationErrors.length) return;

        Swal.fire({
          icon: "warning",
          title: "Falta fecha de inspección",
          html: `
            <div style="text-align:left; max-height:300px; overflow:auto">
              ${notificationErrors.map(e =>
                `• <b>ID:</b> ${e.id} &nbsp; <b>Lote:</b> ${e.lote}`
              ).join("<br>")}
            </div>
          `,
          confirmButtonText: "Aceptar"
        });
      });

      function setNotification(errors) {
      notificationErrors = errors;

        if (errors.length > 0) {
          notificationIcon.classList.remove("ok");
          notificationIcon.classList.add("error");
          notificationCount.textContent = errors.length;

          notificationIcon.style.pointerEvents = "auto";
        } else {
          notificationIcon.classList.remove("error");
          notificationIcon.classList.add("ok");
          notificationCount.textContent = "0";

          notificationIcon.style.pointerEvents = "none";
        }

        // 🔔 SIEMPRE visible
        notificationCount.style.display = "block";
      }


        function detectarFechasInspeccionFaltantes() {
          return rawRows
            .filter(r => !parseExcelDateISO(r[40]))
            .map(r => ({
              id: r[0] || "",
              lote: r[9] || ""
            }));
        }

      /* ===============================
        RUN REVIEW
      =============================== */
      runReviewBtn.addEventListener("click", () => {
        const tipo = inspectionTypeSelect.value;

        /* ❌ SIN CARTILLA */
        if (!tipo || !cartillaStatus[tipo]) {
          Swal.fire(
            "Sin cartilla",
            "Debes seleccionar una cartilla válida.",
            "warning"
          );
          return;
        }

        /* ❌ SIN FECHA DE INSPECCIÓN */
        const fechaISO = inspectionDateSelect.value;

        const fechasValidas = Array.from(inspectionDateSelect.options)
          .map(o => o.value)
          .filter(Boolean);

        if (!fechaISO || !fechasValidas.includes(fechaISO)) {
            Swal.fire(
              "Falta fecha de inspección",
              "Debes seleccionar una <b>fecha de inspección</b> antes de ejecutar.",
              "warning"
            );
            return;
        }

      const rows = rawRows.filter(r =>
        (r[1] || "").toUpperCase() === tipo &&
        parseExcelDateISO(r[40]) === fechaISO
      );

      const selectedInspection = fechaISO;
      const selectedUpdate = updateDateSelect.value;

      Swal.fire({
        title: 'Revisión de fechas',
        html: `
          <div style="line-height:1.0">
            Se va a revisar:<br><br>
            <b>Fecha inspección:</b> ${formatISOToDMY(selectedInspection)}<br><br>
            <b>Fecha LMR (mayoritaria):</b> ${formatISOToDMY(selectedUpdate)}
          </div>
        `,
        icon: 'info',
        showCancelButton: true,
        confirmButtonText: 'Continuar',
        cancelButtonText: 'Cancelar'
      }).then(result => {
        if (result.isConfirmed) {
          validarYRender(rows, tipo, fechaISO);
        }
      });
    });


      /* ===============================
        VALIDAR Y RENDER (CON DUPLICADOS Y FECHA LMR)
      =============================== */
      function validarYRender(rows, tipo, fechaISO) {
        headerRow.innerHTML = "";
        bodyRows.innerHTML = "";

        // ✅ Usar headers y columns de la cartilla seleccionada
        const headers = headersByCartilla[tipo];
        const columns = columnsByCartilla[tipo];

        const STICKY_COLUMNS = [0, 1, 6, 9];

        // ===============================
        // DETECTAR FECHA LMR MAYORITARIA
        // ===============================
        const lmrDates = rows
          .map(r => parseExcelDateISO(r[50]))
          .filter(Boolean);

        const conteoLMR = {};
        lmrDates.forEach(f => {
          conteoLMR[f] = (conteoLMR[f] || 0) + 1;
        });

        const fechaLMRMayoritaria = Object.entries(conteoLMR)
          .sort((a, b) => b[1] - a[1])[0]?.[0];

        // ===============================
        // DETECTAR LOTES DUPLICADOS
        // ===============================
        const lotesTotales = {};
        rows.forEach(r => {
          const lote = r[9] || "";
          if (lote) lotesTotales[lote] = (lotesTotales[lote] || 0) + 1;
        });

        const duplicados = Object.entries(lotesTotales)
          .filter(([_, v]) => v > 1)
          .map(([k]) => k);

        // ===============================
        // FILAS A MOSTRAR
        // ===============================
        const filasParaMostrar = rows.filter(
          r => filaTieneError(r, tipo, fechaISO, fechaLMRMayoritaria) || duplicados.includes(r[9])
        );

        // ===============================
        // RENDER FILAS
        // ===============================
            if (filasParaMostrar.length) {

              // ===============================
              // HEADERS (solo si hay errores)
              // ===============================
              headers.forEach((h, i) => {
                const th = document.createElement("th");
                th.textContent = h;

                // 💡 AGREGAR TITLE CON EXPLICACIÓN
                th.title = obtenerTituloColumna(i, tipo);

                if (STICKY_COLUMNS.includes(i)) {
                  th.classList.add("arandano-col", `arandano-col-${i}`);
                }

                headerRow.appendChild(th);
              });

              // RENDER FILAS
              filasParaMostrar.forEach(r => {
                const tr = document.createElement("tr");

                columns.forEach(col => {
                  const c = col.originalIndex;
                  const td = document.createElement("td");
                  const val = r[c] ?? "";
                  td.textContent = val;

                  // Reset estilos
                  td.style.background = "#fff";
                  td.style.color = "#000";

                  // 🔒 columnas fijas
                  if (STICKY_COLUMNS.includes(c)) {
                    td.classList.add("arandano-col", `arandano-col-${c}`);
                  }

                  // 🔴 FONDO ROJO → SOLO VACÍOS obligatorios
                  const esCeldaVacia = celdaVaciaObligatoria(c, val, tipo);
                  if (esCeldaVacia) {
                    td.style.background = "red";
                  }

                  // 🔴 TEXTO ROJO → valor incorrecto
                  const esValorIncorrecto = celdaValorIncorrecto(r, c, val, tipo, fechaISO, duplicados, fechaLMRMayoritaria);
                  if (esValorIncorrecto) {
                    td.style.color = "red";
                  }

                  // 💡 AGREGAR TITLE SOLO SI HAY ERROR
                  const tieneError = esCeldaVacia || esValorIncorrecto;
                  td.title = obtenerTituloColumna(c, tipo, tieneError);

                  tr.appendChild(td);
                });

                bodyRows.appendChild(tr);
              });
            } else {
              // ===============================
              // MENSAJE CUANDO NO HAY ERRORES
              // ===============================
              const tr = document.createElement("tr");
              const td = document.createElement("td");

              td.colSpan = headers.length;
              td.textContent = "No se encontraron errores en esta inspección";
              td.style.textAlign = "center";
              td.style.fontWeight = "bold";
              td.style.padding = "12px";
              td.style.background = "#e8f5e9";
              td.style.color = "#2e7d32";

              tr.appendChild(td);
              bodyRows.appendChild(tr);
            }

        // ===============================
        // TOTAL FILAS POR INSPECCIÓN
        // ===============================
        if (totalFilasDiv) {
          totalFilasDiv.textContent = `Total registros inspección: ${rows.length}`;
        }

        // ===============================
        // ALERTAS
        // ===============================
        if (!filasParaMostrar.length) {
          Swal.fire({
            icon: "success",
            title: "Todo correcto",
            text: "No se encontraron errores en la inspección."
          });
        } else if (duplicados.length) {
          Swal.fire({
            icon: "error",
            title: "Lotes duplicados",
            text: `Lotes duplicados: ${duplicados.join(", ")}`
          });
        }

        exportBtnArandano.disabled = false;
      }


          // ===================================================
          // OBTENER TITLE PARA COLUMNAS (TOOLTIPS) - SOLO EN ERROR
          // ===================================================
          function obtenerTituloColumna(c, tipo, tieneError) {
            // ❌ Si no hay error, no mostrar title
            if (!tieneError) return "";

            const titles = {
              9: "Debe tener 10 caracteres",
              10: "No debe superar 505",
              18: "Campo obligatorio",
              19: "Debe coincidir con fecha de inspección",
              21: "Debe estar vacío",
              22: "Debe estar vacío",
              23: "Debe estar vacío",
              24: "Debe estar vacío",
              25: "Debe estar vacío",
              26: "Debe estar vacío",
              28: tipo === "MPHA" ? "No debe ser 59 ni 69" : 
                  tipo === "MPBA" ? "Debe ser 69" : 
                  tipo === "MPGA" ? "Debe ser 59" : "",
              29: (tipo === "MPBA" || tipo === "MPGA") ? "Debe ser 53" : "",
              33: "Debe ser 'CUMPLE'",
              46: "Debe ser 'CUMPLE'",
              48: "Debe ser 'CUMPLE'",
              49: "Debe ser 'CUMPLE'",
              50: "Debe coincidir con fecha mayoritaria",
              58: "Entre 15-37°C. Diferencia con pulpa máx 11°",
              59: "Entre 15-37°C. Diferencia con ambiente máx 11°",
              60: "Debe ser 'CUMPLE'"
            };

            // Columnas vacías obligatorias
            if ((c >= 10 && c <= 18 && c !== 16) || 
                (c >= 30 && c <= 32) || 
                (c >= 63 && c <= 100)) {
              return "Campo obligatorio";
            }

            return titles[c] || "";
          }


          // ===================================================
          // FILA CON ERROR (LÓGICA ACTUALIZADA)
          // ===================================================
          function filaTieneError(r, tipo, fechaISO, fechaLMRMayoritaria) {

            if (!r[9] || r[9].length !== 10) return true;

            for (let c = 10; c <= 18; c++) {
              if (c === 16) continue;
              if (!r[c]) return true;
            }

            if (r[10] && +r[10] > 505) return true;

            // 🆕 VALIDAR: Fecha Cosecha (col 19 JS) = Fecha Inspección (col 40 JS)
            const fechaCosecha = parseExcelDateISO(r[19]);
            if (!fechaCosecha || fechaCosecha !== fechaISO) return true;

            if (!r[28]) return true;
            if (
              (tipo === "MPHA" && ["59", "69"].includes(r[28])) ||
              (tipo === "MPBA" && r[28] !== "69") ||
              (tipo === "MPGA" && r[28] !== "59")
            ) return true;

            if ((tipo === "MPBA" || tipo === "MPGA") && r[29] !== "53") return true;

            for (let c = 30; c <= 32; c++) {
              if (!r[c]) return true;
            }

            for (const c of [33, 46, 48, 49, 60]) {
              if (!r[c] || r[c].toUpperCase() !== "CUMPLE") return true;
            }

            // 🔴 FECHA LMR: vacía o minoritaria
            const fechaLMR = parseExcelDateISO(r[50]);
            if (!fechaLMR || fechaLMR !== fechaLMRMayoritaria) return true;

            // 👉 COLUMNAS EXCEL 59–60
            const tempAmbiente = parseFloat(r[58]) || 0;
            const tempPulpa = parseFloat(r[59]) || 0;

            // ❌ rango válido 15–37
            if (tempAmbiente < 15 || tempAmbiente > 37) return true;
            if (tempPulpa < 15 || tempPulpa > 37) return true;

            // ❌ diferencia máxima 11
            if (Math.abs(tempPulpa - tempAmbiente) > 11) return true;

            for (let c = 63; c <= 100; c++) {
              if (!r[c]) return true;
            }

            // ❌ COLUMNAS 22–27 deben estar VACÍAS
            for (let c = 21; c <= 26; c++) {
              if (r[c]) return true;
            }

            return false;
          }

        // ===================================================
        // CELDA VACÍA → FONDO ROJO
        // ===================================================
        function celdaVaciaObligatoria(c, val, tipo) {
          if (val) return false;

          return (
            c === 9 ||
            (c >= 10 && c <= 18 && c !== 16) ||
            c === 19 ||
            c === 28 ||
            (c === 29 && (tipo === "MPBA" || tipo === "MPGA")) ||
            (c >= 30 && c <= 32) ||
            [33, 46, 48, 49, 60].includes(c) ||
            c === 50 ||
            // 👉 COLUMNAS EXCEL 59–60
            [58, 59].includes(c) ||
            (c >= 63 && c <= 100)
          );
        }

        // ===================================================
        // CELDA CON VALOR INCORRECTO → TEXTO ROJO
        // ===================================================
        function celdaValorIncorrecto(r, c, val, tipo, fechaISO, duplicados, fechaLMRMayoritaria) {
          if (!val) return false;

          if (c === 9 && val.length !== 10) return true;
          if (c === 9 && duplicados.includes(val)) return true;

          if (c === 10 && +val > 505) return true;

          // 🆕 VALIDAR: Fecha Cosecha debe = Fecha Inspección
          if (c === 19 && parseExcelDateISO(val) !== fechaISO) return true;

          if (c === 28) {
            if (
              (tipo === "MPHA" && ["59", "69"].includes(val)) ||
              (tipo === "MPBA" && val !== "69") ||
              (tipo === "MPGA" && val !== "59")
            ) return true;
          }

          if ((tipo === "MPBA" || tipo === "MPGA") && c === 29 && val !== "53") return true;

          if ([33, 46, 48, 49, 60].includes(c) && val.toUpperCase() !== "CUMPLE") return true;

            // 🔴 FECHA LMR MINORITARIA → TEXTO ROJO
          if (c === 50 && parseExcelDateISO(val) !== fechaLMRMayoritaria) return true;

         // 👉 COLUMNAS 59–60: validar rango por celda
          if ([58, 59].includes(c) && (Number(val) < 15 || Number(val) > 37)) return true;

          // 👉 diferencia (visual)
          if (c === 58 || c === 59) {
            const tA = Number(r[58]);
            const tP = Number(r[59]);
            if (Math.abs(tP - tA) > 11) return true;
          }

          // ❌ COLUMNAS 22–27 deben estar vacías
          if (c >= 21 && c <= 26 && val) return true;

          return false;
        }

        /* ===============================
          UTILS
        =============================== */
        function resetAll() {
          headerRow.innerHTML = "";
          bodyRows.innerHTML = "";
          totalFilasDiv.textContent = "";

          /* CARTILLA */
          inspectionTypeSelect.innerHTML =
            `<option value="" disabled selected>Selecciona tipo</option>`;
          inspectionTypeSelect.value = "";
          inspectionTypeSelect.disabled = true;

          /* FECHA INSPECCIÓN */
          inspectionDateSelect.innerHTML =
            `<option value="" disabled selected>Selecciona</option>`;
          inspectionDateSelect.value = "";
          inspectionDateSelect.disabled = true;

              /* FECHA LMR */
          updateDateSelect.innerHTML =
            `<option value="" disabled selected>Se actualizará automáticamente</option>`;
          updateDateSelect.value = "";
          updateDateSelect.disabled = true;

          // 🔔 resetear campana
          setNotification([]);
        }


        function fillSelectWithFormat(select, valuesISO) {
          select.innerHTML = `<option value="" disabled selected>Selecciona</option>`;
          select.value = "";

          valuesISO.forEach(v => {
            const o = document.createElement("option");
            o.value = v;
            o.textContent = formatISOToDMY(v);
            select.appendChild(o);
          });
        }


        function formatISOToDMY(iso) {
          const [y,m,d] = iso.split("-");
          return `${d}-${m}-${y}`;
        }

        function parseExcelDateISO(v) {
          if (!v) return "";
          // Formato 20251110 → 2025-11-10
          if (/^\d{8}$/.test(v)) return `${v.slice(0,4)}-${v.slice(4,6)}-${v.slice(6,8)}`;
          // Formato 10/11/2025 → 2025-11-10
          if (/^\d{2}\/\d{2}\/\d{4}$/.test(v)) {
            const [d,m,y] = v.split("/");
            return `${y}-${m}-${d}`;
          }
          const d = new Date(v);
          return isNaN(d) ? "" : d.toISOString().split("T")[0];
        }


        // ===============================
        // ORDEN ESPECIAL MPGA (JS index PURO)
        // ===============================
        const ORDER_MPGAR = [
          0,1,2,3,4,5,6,7,8,9,
          10,11,12,13,14,15,16,17,18,19,
          20,21,22,23,24,25,26,27,28,29,
          30,31,32,33,34,35,36,37,38,39,
          40,41,42,43,44,45,46,47,48,49,
          50,51,52,53,54,55,56,57,58,59,
          60,61,62,63,64,
          78,65,66,67,68,
          81,69,70,79,71,
          72,73,74,75,76,
          80,77,82,83,
          97,84,85,86,87,
          100,88,89,98,90,
          91,92,93,94,95,
          99,96
        ];

      // ===============================
      // CLICK EXPORTAR
      // ===============================
      exportBtnArandano.addEventListener("click", () => {
        const fechaISO = inspectionDateSelect.value;
        if (!fechaISO) {
          Swal.fire("Atención", "Selecciona una fecha de inspección", "warning");
          return;
        }

        const rowsByCartilla = {
          MPGA: rawRows.filter(r =>
            (r[1] || "").toUpperCase() === "MPGA" &&
            parseExcelDateISO(r[40]) === fechaISO
          ),
          MPHA: rawRows.filter(r =>
            (r[1] || "").toUpperCase() === "MPHA" &&
            parseExcelDateISO(r[40]) === fechaISO
          ),
          MPBA: rawRows.filter(r =>
            (r[1] || "").toUpperCase() === "MPBA" &&
            parseExcelDateISO(r[40]) === fechaISO
          )
        };

        const totalRows =
          rowsByCartilla.MPGA.length +
          rowsByCartilla.MPHA.length +
          rowsByCartilla.MPBA.length;

        if (!totalRows) {
          Swal.fire("Sin data", "No hay registros para la fecha seleccionada", "warning");
          return;
        }

        Swal.fire({
          icon: "info",
          title: "Exportación Arándanos",
          html: `
            <b>Fecha inspección:</b> ${formatISOToDMY(fechaISO)}<br><br>
            MPGA: ${rowsByCartilla.MPGA.length}<br>
            MPHA: ${rowsByCartilla.MPHA.length}<br>
            MPBA: ${rowsByCartilla.MPBA.length}<br><br>
            <b>Total registros:</b> ${totalRows}
          `,
          confirmButtonText: "Exportar"
        }).then(res => {
          if (!res.isConfirmed) return;
          generarExcelArandano(rowsByCartilla, fechaISO);
        });
      });

      // ===============================
      // GENERAR EXCEL ARÁNDANOS (FORMATO NUMÉRICO)
      // ===============================
      function generarExcelArandano(data, fechaISO) {

        const exportArray = [];
        const mergeRanges = [];
        const separatorRows = [];
        const headerRows = [];
        const formattedDate = formatISOToDMY(fechaISO);

        // 🔢 COLUMNAS QUE NO SE CONVIERTEN A NUMÉRICO (JS index)
        const COLUMNAS_TEXTO = [3, 4, 9, 18, 19, 40, 50];

        // ===== ESTILO SEPARADOR
        const separatorStyle = {
          fill: { fgColor: { rgb: "E7F3FF" } },
          font: { bold: true },
          alignment: { horizontal: "left", vertical: "center" }
        };

        // ===== ESTILO ENCABEZADOS
        const headerStyle = {
          font: { bold: true },
          alignment: { horizontal: "center", vertical: "center" }
        };

        // ===============================
        // SEPARADOR
        // ===============================
        const addSeparator = (title, length) => {
          const row = new Array(length).fill("");
          row[0] = `---------- DATA : ${title} ----------`;
          exportArray.push(row);

          const rowIndex = exportArray.length - 1;
          separatorRows.push(rowIndex);

          mergeRanges.push({
            s: { r: rowIndex, c: 0 },
            e: { r: rowIndex, c: length - 1 }
          });
        };

        // ===============================
        // ENCABEZADOS
        // ===============================
        const addHeader = (headers, columns, order = null) => {
          exportArray.push(
            (order || headers.map((_, i) => i))
              .map(i => columns[i]?.header || "")
          );

          headerRows.push(exportArray.length - 1);
        };

        // ===============================
        // FILAS DE DATA (CON FORMATO NUMÉRICO)
        // ===============================
        const addRows = (rows, headers, order = null) => {
          rows.forEach(r => {
            const row = (order || headers.map((_, i) => i)).map(i => {
              let val = r[i] ?? "";

              // 📅 FORMATEAR FECHAS (COLUMNAS DE TEXTO)
              if (i === 40 || i === 50) {
                return formatISOToDMY(parseExcelDateISO(val));
              }

              // 📝 MANTENER COMO TEXTO
              if (COLUMNAS_TEXTO.includes(i)) {
                return String(val);
              }

              // 🔢 CONVERTIR A NUMÉRICO
              const num = parseFloat(val);
              return isNaN(num) ? val : num;
            });

            exportArray.push(row);
          });
        };

        // ===== MPGA (ORDEN ESPECIAL)
        if (data.MPGA.length) {
          const h = headersByCartilla.MPGA;
          const c = columnsByCartilla.MPGA;
          addSeparator("MPGA", h.length);
          addHeader(h, c, ORDER_MPGAR);
          addRows(data.MPGA, h, ORDER_MPGAR);
        }

        // ===== MPHA
        if (data.MPHA.length) {
          const h = headersByCartilla.MPHA;
          const c = columnsByCartilla.MPHA;
          addSeparator("MPHA", h.length);
          addHeader(h, c);
          addRows(data.MPHA, h);
        }

        // ===== MPBA
        if (data.MPBA.length) {
          const h = headersByCartilla.MPBA;
          const c = columnsByCartilla.MPBA;
          addSeparator("MPBA", h.length);
          addHeader(h, c);
          addRows(data.MPBA, h);
        }

        // ===============================
        // CREAR HOJA
        // ===============================
        const ws = XLSX.utils.aoa_to_sheet(exportArray);

        // ===== aplicar estilo separadores
        separatorRows.forEach(r => {
          const ref = XLSX.utils.encode_cell({ r, c: 0 });
          if (ws[ref]) ws[ref].s = separatorStyle;
        });

        // ===== aplicar estilo encabezados
        headerRows.forEach(r => {
          exportArray[r].forEach((_, c) => {
            const ref = XLSX.utils.encode_cell({ r, c });
            if (ws[ref]) ws[ref].s = headerStyle;
          });
        });

        // ===== filtros (solo primera fila de encabezados)
        if (headerRows.length) {
          ws["!autofilter"] = {
            ref: XLSX.utils.encode_range({
              s: { r: headerRows[0], c: 0 },
              e: { r: headerRows[0], c: exportArray[headerRows[0]].length - 1 }
            })
          };

          // ===== ancho automático de columnas
          ws["!cols"] = exportArray[headerRows[0]].map(h => ({
            wch: Math.max(12, String(h).length + 2)
          }));
        }

        // ===== merges
        if (!ws["!merges"]) ws["!merges"] = [];
        ws["!merges"].push(...mergeRanges);

        // ===============================
        // EXPORTAR
        // ===============================
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Arandanos");
        XLSX.writeFile(wb, `ARANDANOS_${formattedDate}.xlsx`);

        Swal.fire({
          icon: "success",
          title: "Exportación completa",
          text: `El Excel de Arándanos (${formattedDate}) se generó correctamente.`
        });
      }

      clearBtnArandano.addEventListener("click", () => {
        limpiarTodoArandano();
      });

      function limpiarTodoArandano() {

        // ===============================
        // LIMPIAR DATA
        // ===============================
        rawRows = [];
        headersByCartilla = {};
        columnsByCartilla = {};
        cartillaStatus = { MPHA:false, MPBA:false, MPGA:false };
        notificationErrors = [];

        // ===============================
        // LIMPIAR INPUT FILE
        // ===============================
        fileInput.value = "";

        // ===============================
        // LIMPIAR TABLA
        // ===============================
        headerRow.innerHTML = "";
        bodyRows.innerHTML = "";
        totalFilasDiv.textContent = "";

        // ===============================
        // RESET SELECTS (CONTENIDO + ESTILOS)
        // ===============================
        inspectionTypeSelect.innerHTML =
          `<option value="" disabled selected>Selecciona tipo</option>`;
        inspectionTypeSelect.disabled = true;
        inspectionTypeSelect.classList.remove("error", "invalid", "disabled-select");
        inspectionTypeSelect.style.border = "";
        inspectionTypeSelect.style.color = "";

        inspectionDateSelect.innerHTML =
          `<option value="" disabled selected>Selecciona</option>`;
        inspectionDateSelect.disabled = true;
        inspectionDateSelect.classList.remove("error", "invalid", "disabled-select");
        inspectionDateSelect.style.border = "";
        inspectionDateSelect.style.color = "";

        updateDateSelect.innerHTML =
          `<option value="" disabled selected>Se actualizará automáticamente</option>`;
        updateDateSelect.disabled = true;
        updateDateSelect.classList.remove("error", "invalid", "disabled-select");
        updateDateSelect.style.border = "";
        updateDateSelect.style.color = "";

        // ===============================
        // RESET BOTONES
        // ===============================
        runReviewBtn.disabled = true;
        exportBtnArandano.disabled = true;

        // ===============================
        // RESET VISUAL NOTIFICACIONES (SUAVE)
        // ===============================
        notificationErrors = [];

        notificationCount.textContent = "0";
        notificationCount.classList.add("visible");

        notificationIcon.classList.remove("has-error", "error");
        notificationIcon.classList.add("ok");

        // ===============================
        // ALERTA FINAL
        // ===============================
        Swal.fire({
          icon: "success",
          title: "Limpieza completa",
          text: "El módulo de Arándanos se limpió correctamente.",
          timer: 1000,
          showConfirmButton: false
        });
      }


})();