(() => {
  "use strict";

  /* ===============================
     🔹 ELEMENTOS DEL DOM
  =============================== */
  const fileInput = document.getElementById("fileDestino");
  const destinationTypeSelect = document.getElementById("destinationType");
  const destinationDateSelect = document.getElementById("destinationDate");
  const destinationUpdateDateSelect = document.getElementById("destinationUpdateDate");
  const contenedorSelect = document.getElementById("destinocontenedor"); // ✅ NUEVO
  const runReviewBtn = document.getElementById("runReviewDestino");
  const exportBtn = document.getElementById("exportDestino");
  const clearBtn = document.getElementById("clearDestino");

  const headerRow = document.getElementById("destinationResultsHeader");
  const bodyRows = document.getElementById("destinationResultsBody");
  const totalFilasDiv = document.getElementById("destinationTotalFilas");

  /* ===============================
     🔹 VARIABLES GLOBALES
  =============================== */
  let rawRows = [];
  let headersByDestino = {};
  let columnsByDestino = {};
  let destinoStatus = { DESAEU: false, DESAUS: false, DESACH: false };

  /* ===============================
     🔹 CONFIGURACIÓN DE CARTILLAS
  =============================== */
  const CARTILLAS_CONFIG = {
    DESAEU: {
      nombre: "DESAEU",
      columnas: 110,
      columnaInspeccion: 26, // Col 27 Excel
      columnaArribo: 25,      // Col 26 Excel
      columnaContenedor: 101, // Col 102 Excel = 101 JS ✅ NUEVO
      columnasTexto: [8, 9, 94, 98, 99, 102, 105, 106, 108, 109],
      columnasFecha: [3, 4, 25, 26, 103]
    },
    DESAUS: {
      nombre: "DESAUS",
      columnas: 129,
      columnaInspeccion: 39, // Col 40 Excel
      columnaArribo: 38, // Col 39 Excel
      columnaContenedor: 120, // Col 121 Excel = 120 JS ✅ NUEVO
      columnasTexto: [8, 9, 38, 39, 113, 116, 117, 118, 121, 124, 125, 127, 128],
      columnasFecha: [3, 4, 38, 39, 122]
    },
    DESACH: {
      nombre: "DESACH",
      columnas: 109,
      columnaInspeccion: 25, // Col 26 Excel
      columnaArribo: 24,      // Col 25 Excel
      columnaContenedor: 100, // Col 101 Excel = 100 JS
      columnasTexto: [8, 9, 94, 97, 98, 101, 105, 107, 108],
      columnasFecha: [3, 4, 24, 25, 102]
    }
  };

  /* ===============================
     🔹 INICIALIZAR SELECT2 (después de cargar DOM)
  =============================== */
$(document).ready(function() {
  $('#destinocontenedor').select2({
    placeholder: "Seleccionar contenedor(es)",
    allowClear: true,
    closeOnSelect: false,
    width: '100%',

    // 🔴 OCULTA EL BUSCADOR
    minimumResultsForSearch: -1,

    language: {
      noResults: function() {
        return "No se encontraron contenedores";
      }
    }
  });
});


  /* ===============================
     🔹 EVENTO: CARGA DE ARCHIVOS
  =============================== */
  fileInput.addEventListener("change", async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    // ❌ VALIDAR: Máximo 3 archivos
    if (files.length > 3) {
      Swal.fire(
        "Demasiados archivos",
        "Solo se permiten <b>3 archivos Excel</b> como máximo (DESAEU, DESAUS y DESACH).",
        "error"
      );
      fileInput.value = "";
      return;
    }

    // 🔄 Resetear variables
    rawRows = [];
    headersByDestino = {};
    columnsByDestino = {};
    destinoStatus = { DESAEU: false, DESAUS: false, DESACH: false };
    resetAll();

    const destinosCargados = new Set();

    for (const file of files) {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false });

      /* ===== 📋 VALIDAR FILA 4 (cartilla y estado) ===== */
      const fila4 = data[3] || [];
      const estado = (fila4[13] || "").toUpperCase().trim();
      const cartillaRaw = (fila4[8] || "").toUpperCase().trim();

      const CARTILLAS_PERMITIDAS = {
        DESAEU: "DESAEU",
        DESAUS: "DESAUS",
        DESACH: "DESACH"
      };

      const destino = CARTILLAS_PERMITIDAS[cartillaRaw];

      // ❌ CARTILLA NO PERMITIDA
      if (!destino) {
        Swal.fire(
          "Destino no válido",
          `El destino <b>${cartillaRaw || "DESCONOCIDO"}</b> no está permitido.<br>
          Solo se aceptan: <b>DESAEU, DESAUS, DESACH</b>.`,
          "error"
        );
        fileInput.value = "";
        return;
      }

      // ❌ CARTILLA DUPLICADA
      if (destinosCargados.has(destino)) {
        Swal.fire(
          "Destino duplicado",
          `El destino <b>${destino}</b> ya fue cargado.<br>
          No se permiten destinos repetidos.`,
          "error"
        );
        fileInput.value = "";
        return;
      }

      destinosCargados.add(destino);

      // ❌ ESTADO INCORRECTO
      if (estado !== "ENVIADA") {
        Swal.fire(
          "Estado incorrecto",
          `El destino <b>${destino}</b> debe estar en estado <b>ENVIADA</b>.`,
          "error"
        );
        fileInput.value = "";
        return;
      }

      /* ===== 🗑️ ELIMINAR PRIMERAS 5 FILAS ===== */
      data.splice(0, 5);
      if (data.length < 2) continue;

      /* ===== 📊 HEADERS Y COLUMNAS POR DESTINO ===== */
      headersByDestino[destino] = data[0];
      columnsByDestino[destino] = data[0].map((h, i) => ({
        id: `columna_${i + 1}`,
        header: h || "",
        originalIndex: i
      }));

      // ❌ VALIDAR: NÚMERO DE COLUMNAS SEGÚN CARTILLA
      const columnasEsperadas = CARTILLAS_CONFIG[destino].columnas;
      if (headersByDestino[destino].length !== columnasEsperadas) {
        Swal.fire(
          "Estructura incorrecta",
          `El archivo de <b>${destino}</b> tiene <b>${headersByDestino[destino].length}</b> columnas.<br>
          Se requieren <b>${columnasEsperadas} columnas exactas</b>.`,
          "error"
        );
        fileInput.value = "";
        return;
      }

      /* ===== 📦 FILTRAR FILAS: Solo con data en columna 7 (índice 6 en JS) ===== */
      const filas = data.slice(1).filter(r => r[6]); // Solo filas con dato en col 7 Excel (6 JS)
      
      if (filas.length) destinoStatus[destino] = true;

      // ✅ LIMPIAR TODOS LOS ESPACIOS DE TODAS LAS CELDAS
      rawRows.push(...filas.map(fila => {
        const filaLimpia = fila.map(celda => {
          if (celda === null || celda === undefined) return celda;
          return String(celda).trim();
        });
        return { ...filaLimpia, _cartilla: destino };
      }));

    }

    cargarSelectDestinos();
    mostrarResumenDestinos();
    runReviewBtn.disabled = false;
  });

  /* ===============================
     🔹 CARGAR SELECT DE DESTINOS
  =============================== */
  function cargarSelectDestinos() {
    destinationTypeSelect.innerHTML = `<option disabled selected>Selecciona destino</option>`;
    destinationTypeSelect.disabled = true;

    Object.entries(destinoStatus).forEach(([k, v]) => {
      if (v) {
        const o = document.createElement("option");
        o.value = k;
        o.textContent = k;
        destinationTypeSelect.appendChild(o);
      }
    });

    destinationTypeSelect.disabled = false;
  }

  /* ===============================
     🔹 MOSTRAR RESUMEN DE DESTINOS
  =============================== */
  function mostrarResumenDestinos() {
    let html = `
      <div style="text-align:center;line-height:1.8">
        ${Object.entries(destinoStatus).map(([k, v]) =>
          `${v ? "🟢" : "🔴"} <b>${k}</b>: ${v ? "Tiene data" : "No tiene data"}`
        ).join("<br>")}
      </div>
    `;

    Swal.fire({
      icon: "info",
      title: "Resumen de destinos",
      html,
      confirmButtonText: "Aceptar"
    });
  }

  /* ===============================
     🔹 EVENTO: DESTINO → FECHAS DE INSPECCIÓN
  =============================== */
  destinationTypeSelect.addEventListener("change", () => {
    const destino = destinationTypeSelect.value;
    const config = CARTILLAS_CONFIG[destino];

    // 📅 Obtener fechas únicas de inspección según cartilla
    const fechas = [...new Set(
      rawRows
        .filter(r => r._cartilla === destino)
        .map(r => parseExcelDateISO(r[config.columnaInspeccion]))
        .filter(Boolean)
    )];

    fillSelectWithFormat(destinationDateSelect, fechas);
    destinationDateSelect.disabled = false;

    // 🔄 Limpiar contenedores al cambiar destino
    $('#destinocontenedor').empty().trigger('change');
    contenedorSelect.disabled = true;
  });

  /* ===============================
     🔹 EVENTO: FECHA INSPECCIÓN → CONTENEDORES + FECHA ARRIBO
  =============================== */
  destinationDateSelect.addEventListener("change", () => {
    const destino = destinationTypeSelect.value;
    const config = CARTILLAS_CONFIG[destino];
    const fechaInspeccionISO = destinationDateSelect.value;

    // ✅ 📦 CARGAR CONTENEDORES ÚNICOS PARA ESA FECHA
    const contenedores = [...new Set(
      rawRows
        .filter(r => 
          r._cartilla === destino &&
          parseExcelDateISO(r[config.columnaInspeccion]) === fechaInspeccionISO
        )
        .map(r => r[config.columnaContenedor])
        .filter(Boolean) // Solo contenedores con valor
    )].sort();

    // 🔄 Limpiar y llenar select de contenedores
    $('#destinocontenedor').empty().trigger('change');
    
    contenedores.forEach(cont => {
      const option = new Option(cont, cont, false, false);
      $('#destinocontenedor').append(option);
    });

    $('#destinocontenedor').trigger('change');
    contenedorSelect.disabled = false;

    // ✅ 📅 CARGAR FECHA(S) DE ARRIBO AUTOMÁTICAS
    const arriboFechas = rawRows
      .filter(r => 
        r._cartilla === destino &&
        parseExcelDateISO(r[config.columnaInspeccion]) === fechaInspeccionISO
      )
      .map(r => parseExcelDateISO(r[config.columnaArribo]))
      .filter(Boolean);

    const unique = [...new Set(arriboFechas)];

    destinationUpdateDateSelect.innerHTML = "";

    if (unique.length === 1) {
      const o = document.createElement("option");
      o.value = unique[0];
      o.textContent = formatISOToDMY(unique[0]);
      destinationUpdateDateSelect.appendChild(o);
      destinationUpdateDateSelect.style.border = "";
      destinationUpdateDateSelect.style.color = "";
    } else if (unique.length > 1) {
      // ⚠️ Múltiples fechas de arribo
      unique.forEach(fecha => {
        const o = document.createElement("option");
        o.value = fecha;
        o.textContent = formatISOToDMY(fecha);
        destinationUpdateDateSelect.appendChild(o);
      });

      destinationUpdateDateSelect.style.border = "2px solid red";
      destinationUpdateDateSelect.style.color = "red";

      Swal.fire({
        icon: "warning",
        title: "Múltiples fechas de arribo",
        html: `
          <div style="line-height:1.6; text-align:left">
            Se detectaron <b>${unique.length}</b> fechas de arribo diferentes para esta inspección:<br><br>
            ${unique.map(f => `• ${formatISOToDMY(f)}`).join("<br>")}<br>
          </div>
        `,
        confirmButtonText: "Entendido"
      });
    } else {
      const o = document.createElement("option");
      o.value = "";
      o.textContent = "Sin fecha de arribo";
      destinationUpdateDateSelect.appendChild(o);
    }
  });

  /* ===============================
     🔹 EVENTO: EJECUTAR REVISIÓN
  =============================== */
  runReviewBtn.addEventListener("click", () => {
    const destino = destinationTypeSelect.value;

    // ❌ SIN DESTINO
    if (!destino || !destinoStatus[destino]) {
      Swal.fire(
        "Sin destino",
        "Debes seleccionar un destino válido.",
        "warning"
      );
      return;
    }

    // ❌ SIN FECHA DE INSPECCIÓN
    const fechaInspeccionISO = destinationDateSelect.value;
    if (!fechaInspeccionISO) {
      Swal.fire(
        "Falta fecha de inspección",
        "Debes seleccionar una <b>fecha de inspección</b>.",
        "warning"
      );
      return;
    }

    const config = CARTILLAS_CONFIG[destino];

    // ✅ FILTRAR FILAS POR DESTINO Y FECHA DE INSPECCIÓN
    let rows = rawRows.filter(r => 
      r._cartilla === destino &&
      parseExcelDateISO(r[config.columnaInspeccion]) === fechaInspeccionISO
    );

    // ✅ 📦 FILTRAR POR CONTENEDORES SELECCIONADOS (SI HAY)
    const contenedoresSeleccionados = $('#destinocontenedor').val() || [];
    
    if (contenedoresSeleccionados.length > 0) {
      rows = rows.filter(r => contenedoresSeleccionados.includes(r[config.columnaContenedor]));
    }

    const selectedInspection = fechaInspeccionISO;
    const selectedArribo = destinationUpdateDateSelect.value;

    Swal.fire({
      title: "Revisión de fechas",
      html: `
        <div style="line-height:1.9">
          Se va a revisar:<br>  
          <b>Cartilla:</b> ${destino}<br>
          <b>Fecha inspección:</b> ${formatISOToDMY(selectedInspection)}<br>
          <b>Fecha arribo WH:</b> ${selectedArribo ? formatISOToDMY(selectedArribo) : "No especificada"}<br>
          ${contenedoresSeleccionados.length ? 
            `<b>Contenedores:</b> ${contenedoresSeleccionados.join(", ")}` : 
            "<b>Todos los contenedores</b>"}
        </div>
      `,
      icon: "info",
      showCancelButton: true,
      confirmButtonText: "Continuar",
      cancelButtonText: "Cancelar"
    }).then(result => {
      if (result.isConfirmed) {
        validarYRender(rows, destino, fechaInspeccionISO);
      }
    });
  });

  /* ===============================
     🔹 VALIDAR Y RENDERIZAR TABLA
  =============================== */
  function validarYRender(rows, destino, fechaInspeccionISO) {
    headerRow.innerHTML = "";
    bodyRows.innerHTML = "";

    const headers = headersByDestino[destino];
    const columns = columnsByDestino[destino];

    const STICKY_COLUMNS = [0, 6, 8, 9]; // ID, col 7, pallet, lote

    // ===============================
    // 🔍 DETECTAR DUPLICADOS (PALLET + LOTE)
    // ===============================
    const palletLoteCombinaciones = {};
    rows.forEach(r => {
      const pallet = r[8] || ""; // col 9 Excel
      const lote = r[9] || "";   // col 10 Excel
      const key = `${pallet}|${lote}`;
      if (pallet && lote) {
        palletLoteCombinaciones[key] = (palletLoteCombinaciones[key] || 0) + 1;
      }
    });

    const duplicados = Object.entries(palletLoteCombinaciones)
      .filter(([_, v]) => v > 1)
      .map(([k]) => k);

    // ===============================
    // 📋 FILAS CON ERROR
    // ===============================
    const filasParaMostrar = rows.filter(r =>
      filaTieneError(r, destino, fechaInspeccionISO, duplicados)
    );

    // ===============================
    // 🖼️ RENDERIZAR TABLA
    // ===============================
    if (filasParaMostrar.length) {
      // HEADERS
      headers.forEach((h, i) => {
        const th = document.createElement("th");
        th.textContent = h;
        th.title = obtenerTituloColumna(i, destino);

        if (STICKY_COLUMNS.includes(i)) {
          th.classList.add("destino-col", `destino-col-${i}`);
        }

        headerRow.appendChild(th);
      });

      // FILAS
      filasParaMostrar.forEach(r => {
        const tr = document.createElement("tr");

        columns.forEach(col => {
          const c = col.originalIndex;
          const td = document.createElement("td");
          let val = r[c] ?? "";

          // 🧹 LIMPIAR ESPACIOS EN TODAS LAS CELDAS
          val = String(val).trim();

          td.textContent = val;

          // Reset estilos
          td.style.background = "#fff";
          td.style.color = "#000";

          // 🔒 Columnas fijas
          if (STICKY_COLUMNS.includes(c)) {
            td.classList.add("destino-col", `destino-col-${c}`);
          }

          // 🔴 FONDO ROJO → Celdas vacías obligatorias
          const esCeldaVacia = celdaVaciaObligatoria(c, val, destino);
          if (esCeldaVacia) {
            td.style.background = "red";
            td.style.color = "white";
          }

          // 🔴 TEXTO ROJO → Valor incorrecto
          const esValorIncorrecto = celdaValorIncorrecto(r, c, val, destino, fechaInspeccionISO, duplicados);
          if (esValorIncorrecto) {
            td.style.color = "red";
            td.style.fontWeight = "bold";
          }

          // 💡 TOOLTIP solo si hay error
          const tieneError = esCeldaVacia || esValorIncorrecto;
          if (tieneError) {
            td.title = obtenerTituloColumna(c, destino, true);
          }

          tr.appendChild(td);
        });

        bodyRows.appendChild(tr);
      });
    } else {
      // ✅ SIN ERRORES
      const tr = document.createElement("tr");
      const td = document.createElement("td");

      td.colSpan = headers.length;
      td.textContent = "No se encontraron errores en esta inspección";
      td.style.textAlign = "center";
      td.style.fontWeight = "bold";
      td.style.padding = "20px";
      td.style.background = "#e8f5e9";
      td.style.color = "#2e7d32";
      td.style.fontSize = "16px";

      tr.appendChild(td);
      bodyRows.appendChild(tr);
    }

    // ===============================
    // 📊 TOTAL DE REGISTROS
    // ===============================
    if (totalFilasDiv) {
      totalFilasDiv.textContent = `Total registros inspección: ${rows.length}`;
    }

    // ===============================
    // 🎉 ALERTAS FINALES
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
        title: "⚠️ Pallets y lotes duplicados",
        html: `
          <div style="text-align:left;line-height:1.6">
            Se encontraron <b>${duplicados.length}</b> combinaciones duplicadas de Pallet + Lote:<br><br>
            ${duplicados.slice(0, 10).map(d => {
              const [pallet, lote] = d.split("|");
              return `• Pallet: <b>${pallet}</b> | Lote: <b>${lote}</b>`;
            }).join("<br>")}
            ${duplicados.length > 10 ? `<br><br>...y ${duplicados.length - 10} más.` : ""}
          </div>
        `,
        confirmButtonText: "Entendido"
      });
    }

    exportBtn.disabled = false;
  }

  /* ===============================
     🔹 OBTENER TÍTULO DE COLUMNA (TOOLTIPS)
  =============================== */
  function obtenerTituloColumna(c, destino, tieneError = false) {
    if (!tieneError) return "";

    // ===== VALIDACIONES COMUNES (hasta col 12 Excel = 11 JS) =====
    const titlesComunes = {
      8: "Debe tener 12 dígitos",
      9: "Debe tener 10 dígitos",
      10: "Debe ser entre 500-505 gramos",
      11: "Debe ser 'GRAMOS'"
    };

    if (c <= 11 && titlesComunes[c]) {
      return titlesComunes[c];
    }

    // ===== VALIDACIONES ESPECÍFICAS POR CARTILLA =====
    if (destino === "DESAEU") {
      return obtenerTituloColumnaDESAEU(c);
    } else if (destino === "DESAUS") {
      return obtenerTituloColumnaDESAUS(c);
    } else if (destino === "DESACH") {
      return obtenerTituloColumnaDESACH(c);
    }

    return "";
  }

  /* ===============================
     🔹 TÍTULOS ESPECÍFICOS: DESAEU
  =============================== */
  function obtenerTituloColumnaDESAEU(c) {
    const titles = {
      12: "Debe ser entre 0-1.8 (permite vacío)",
      16: "Debe ser entre 0-19.5 (permite vacío)",
      18: "Debe ser 'NOT'",
      25: "Debe ser menor o igual a fecha de inspección",
      26: "Fecha de inspección",
      32: "Debe ser mayor a 0",
      47: "Campo obligatorio",
      50: "Debe ser entre 0-5"
    };

    // Columnas 34-44 Excel (33-43 JS): deben estar vacías
    if (c >= 33 && c <= 43) {
      return "Debe estar vacío";
    }

    // Columnas 55-94 Excel (54-93 JS): obligatorias
    if (c >= 54 && c <= 93) {
      return "Campo obligatorio";
    }

    // Columnas 95-110 Excel (94-109 JS): obligatorias sin espacios
    if (c >= 94 && c <= 109) {
      return "Campo obligatorio (sin espacios)";
    }

    return titles[c] || "";
  }

  /* ===============================
     🔹 TÍTULOS ESPECÍFICOS: DESAUS
  =============================== */
  function obtenerTituloColumnaDESAUS(c) {
    const titles = {
      12: "Debe ser entre 0-1.8",
      14: "Campo obligatorio",
      15: "Debe ser entre 0-19.5",
      17: "Debe ser entre 0-34",
      18: "Debe ser entre 0-34",
      19: "Campo obligatorio",
      20: "Campo obligatorio",
      21: "Campo obligatorio",
      23: "Debe ser 'CUMPLE'",
      24: "Debe ser 'CUMPLE'",
      38: "Debe ser menor o igual a fecha de inspección",
      39: "Fecha de inspección",
      59: "Campo obligatorio"
    };

    // Columnas 64-113 Excel (63-112 JS): obligatorias
    if (c >= 63 && c <= 112) {
      return "Campo obligatorio";
    }

    // Columnas 114-129 Excel (113-128 JS): obligatorias sin espacios
    if (c >= 113 && c <= 128) {
      return "Campo obligatorio (sin espacios)";
    }

    return titles[c] || "";
  }

  /* ===============================
     🔹 TÍTULOS ESPECÍFICOS: DESACH
  =============================== */
  function obtenerTituloColumnaDESACH(c) {
    const titles = {
      12: "Debe ser entre 0-1.8 (permite vacío)",
      15: "Campo obligatorio",
      16: "Debe ser entre 0-19.5 (permite vacío)",
      18: "Campo obligatorio",
      24: "Debe ser menor o igual a fecha de inspección",
      25: "Fecha de inspección",
      29: "Campo obligatorio",
      32: "Campo obligatorio",
      47: "Campo obligatorio",
      49: "Debe ser entre 0-34",
      50: "Debe ser entre 0-34"
    };

    // Columnas 55-94 Excel (54-93 JS): obligatorias
    if (c >= 54 && c <= 93) {
      return "Campo obligatorio";
    }

    // Columnas 95-106 Excel (94-105 JS): obligatorias sin espacios
    if (c >= 94 && c <= 105) {
      return "Campo obligatorio (sin espacios)";
    }

    return titles[c] || "";
  }

  /* ===============================
     🔹 FILA TIENE ERROR
  =============================== */
  function filaTieneError(r, destino, fechaInspeccionISO, duplicados) {
    // ===== VALIDACIONES COMUNES (hasta col 12 Excel) =====
    
    // ❌ Col 9 (Pallet): debe tener 12 dígitos
    if (!r[8] || r[8].length !== 12) return true;

    // ❌ Col 10 (Lote): debe tener 10 dígitos
    if (!r[9] || r[9].length !== 10) return true;

    // ❌ Pallet + Lote duplicados
    const key = `${r[8]}|${r[9]}`;
    if (duplicados.includes(key)) return true;

    // ❌ Col 11: debe ser 500-505
    if (!r[10] || +r[10] < 500 || +r[10] > 505) return true;

    // ❌ Col 12: debe ser "GRAMOS"
    if (!r[11] || r[11].toUpperCase() !== "GRAMOS") return true;

    // ===== VALIDACIONES ESPECÍFICAS POR CARTILLA =====
    if (destino === "DESAEU") {
      return filaTieneErrorDESAEU(r, fechaInspeccionISO, duplicados);
    } else if (destino === "DESAUS") {
      return filaTieneErrorDESAUS(r, fechaInspeccionISO, duplicados);
    } else if (destino === "DESACH") {
      return filaTieneErrorDESACH(r, fechaInspeccionISO, duplicados);
    }

    return false;
  }

  /* ===============================
     🔹 VALIDACIONES ESPECÍFICAS: DESAEU
  =============================== */
  function filaTieneErrorDESAEU(r, fechaInspeccionISO, duplicados) {
    // ❌ Col 13: debe ser 0-1.8 (permite vacío)
    if (r[12] && (+r[12] < 0 || +r[12] > 1.8)) return true;

    // ❌ Col 17: debe ser 0-19.5 (permite vacío)
    if (r[16] && (+r[16] < 0 || +r[16] > 19.5)) return true;

    // ❌ Col 19: debe ser "NOT"
    if (!r[18] || r[18].toUpperCase() !== "NOT") return true;

    // ❌ Col 26 (Fecha Arribo) debe ser <= Col 27 (Fecha Inspección)
    const fechaArribo = parseExcelDateISO(r[25]);
    const fechaInspeccion = parseExcelDateISO(r[26]);
    if (fechaArribo && fechaInspeccion && fechaArribo > fechaInspeccion) return true;

    // ❌ Col 33: debe ser > 0
    if (!r[32] || +r[32] <= 0) return true;

    // ❌ Col 34-44: deben estar vacías
    for (let c = 33; c <= 43; c++) {
      if (r[c]) return true;
    }

    // ❌ Col 48: debe estar llena
    if (!r[47]) return true;

    // ❌ Col 51: debe ser 0-5
    if (!r[50] || +r[50] < 0 || +r[50] > 5) return true;

    // ❌ Col 55-94: deben estar llenas
    for (let c = 54; c <= 93; c++) {
      if (!r[c]) return true;
    }

    // ❌ Col 95-110: deben estar llenas (sin espacios)
    for (let c = 94; c <= 109; c++) {
      const val = String(r[c] || "").trim();
      if (!val) return true;
    }

    return false;
  }

  /* ===============================
     🔹 VALIDACIONES ESPECÍFICAS: DESAUS
  =============================== */
  function filaTieneErrorDESAUS(r, fechaInspeccionISO, duplicados) {
    // ✅ Col 13: SI EXISTE dato → validar rango 0-1.8
    if (r[12] !== undefined && r[12] !== null && r[12] !== "" && (+r[12] < 0 || +r[12] > 1.8)) return true;

    // ❌ Col 15: debe tener dato
    if (!r[14]) return true;

    // ✅ Col 16: SI EXISTE dato → validar rango 0-19.5
    if (r[15] !== undefined && r[15] !== null && r[15] !== "" && (+r[15] < 0 || +r[15] > 19.5)) return true;

    // ❌ Col 18: debe ser 0-34 (NO permite vacío)
    if (!r[17] || +r[17] < 0 || +r[17] > 34) return true;

    // ❌ Col 19: debe ser 0-34 (NO permite vacío)
    if (!r[18] || +r[18] < 0 || +r[18] > 34) return true;

    // ❌ Col 20: debe tener dato
    if (!r[19]) return true;

    // ❌ Col 21: debe tener dato
    if (!r[20]) return true;

    // ❌ Col 22: debe tener dato
    if (!r[21]) return true;

    // ❌ Col 24-25: deben ser "CUMPLE"
    if (!r[23] || r[23].toUpperCase() !== "CUMPLE") return true;
    if (!r[24] || r[24].toUpperCase() !== "CUMPLE") return true;

    // ❌ Col 39 (Fecha Arribo) debe ser <= Col 40 (Fecha Inspección)
    const fechaArribo = parseExcelDateISO(r[38]);
    const fechaInspeccion = parseExcelDateISO(r[39]);
    if (fechaArribo && fechaInspeccion && fechaArribo > fechaInspeccion) return true;

    // ❌ Col 60: debe tener dato
    if (!r[59]) return true;

    // ❌ Col 64-113: deben estar llenas
    for (let c = 63; c <= 112; c++) {
      if (!r[c]) return true;
    }

    // ❌ Col 114-129: deben estar llenas (sin espacios)
    for (let c = 113; c <= 128; c++) {
      const val = String(r[c] || "").trim();
      if (!val) return true;
    }

    return false;
  }

  /* ===============================
     🔹 VALIDACIONES ESPECÍFICAS: DESACH
  =============================== */
  function filaTieneErrorDESACH(r, fechaInspeccionISO, duplicados) {
    // ✅ Col 13 Excel (12 JS): SI EXISTE dato → validar rango 0-1.8
    if (r[12] !== undefined && r[12] !== null && r[12] !== "" && (+r[12] < 0 || +r[12] > 1.8)) return true;

    // ❌ Col 16 Excel (15 JS): debe tener dato
    if (!r[15]) return true;

    // ✅ Col 17 Excel (16 JS): SI EXISTE dato → validar rango 0-19.5
    if (r[16] !== undefined && r[16] !== null && r[16] !== "" && (+r[16] < 0 || +r[16] > 19.5)) return true;

    // ❌ Col 19 Excel (18 JS): debe tener dato
    if (!r[18]) return true;

    // ❌ Col 25 Excel (24 JS): Fecha Arribo debe ser <= Col 26 Excel (25 JS): Fecha Inspección
    const fechaArribo = parseExcelDateISO(r[24]);
    const fechaInspeccion = parseExcelDateISO(r[25]);
    if (fechaArribo && fechaInspeccion && fechaArribo > fechaInspeccion) return true;

    // ❌ Col 30 Excel (29 JS): debe tener dato
    if (!r[29]) return true;

    // ❌ Col 33 Excel (32 JS): debe tener dato
    if (!r[32]) return true;

    // ❌ Col 48 Excel (47 JS): debe tener dato
    if (!r[47]) return true;

    // ❌ Col 50 Excel (49 JS): debe ser 0-34 (NO permite vacío)
    if (!r[49] || +r[49] < 0 || +r[49] > 34) return true;

    // ❌ Col 51 Excel (50 JS): debe ser 0-34 (NO permite vacío)
    if (!r[50] || +r[50] < 0 || +r[50] > 34) return true;

    // ❌ Col 55-94 Excel (54-93 JS): deben estar llenas
    for (let c = 54; c <= 93; c++) {
      if (!r[c]) return true;
    }

    // ❌ Col 95-106 Excel (94-105 JS): deben estar llenas (sin espacios)
    for (let c = 94; c <= 105; c++) {
      const val = String(r[c] || "").trim();
      if (!val) return true;
    }

    return false;
  }

  /* ===============================
     🔹 CELDA VACÍA OBLIGATORIA
  =============================== */
  function celdaVaciaObligatoria(c, val, destino) {
    if (val) return false;

    // ===== COLUMNAS COMUNES =====
    if (c === 8 || c === 9 || c === 10 || c === 11) return true;

    // ===== ESPECÍFICAS POR CARTILLA =====
    if (destino === "DESAEU") {
      return (
        c === 18 ||
        c === 32 ||
        c === 47 ||
        c === 50 ||
        (c >= 54 && c <= 93) ||
        (c >= 94 && c <= 109)
      );
    } else if (destino === "DESAUS") {
      return (
        // c === 12 NO → permite vacío
        c === 14 ||
        // c === 15 NO → permite vacío
        c === 17 ||
        c === 18 ||
        c === 19 ||
        c === 20 ||
        c === 21 ||
        c === 23 ||
        c === 24 ||
        c === 59 ||
        (c >= 63 && c <= 112) ||
        (c >= 113 && c <= 128)
      );
    } else if (destino === "DESACH") {
      return (
        // c === 12 NO → permite vacío
        c === 15 || // Col 16 Excel
        // c === 16 NO → permite vacío
        c === 18 || // Col 19 Excel
        c === 29 || // Col 30 Excel
        c === 32 || // Col 33 Excel
        c === 47 || // Col 48 Excel
        c === 49 || // Col 50 Excel
        c === 50 || // Col 51 Excel
        (c >= 54 && c <= 93) || // Col 55-94 Excel
        (c >= 94 && c <= 105)   // Col 95-106 Excel
      );
    }

    return false;
  }

  /* ===============================
     🔹 CELDA CON VALOR INCORRECTO
  =============================== */
  function celdaValorIncorrecto(r, c, val, destino, fechaInspeccionISO, duplicados) {
    if (!val) return false;

    // ===== VALIDACIONES COMUNES =====
    
    // ❌ Col 9: 12 dígitos
    if (c === 8 && val.length !== 12) return true;

    // ❌ Col 10: 10 dígitos
    if (c === 9 && val.length !== 10) return true;

    // ❌ Pallet + Lote duplicados
    if ((c === 8 || c === 9) && duplicados.includes(`${r[8]}|${r[9]}`)) return true;

    // ❌ Col 11: 500-505
    if (c === 10 && (+val < 500 || +val > 505)) return true;

    // ❌ Col 12: "GRAMOS"
    if (c === 11 && val.toUpperCase() !== "GRAMOS") return true;

    // ===== ESPECÍFICAS POR CARTILLA =====
    if (destino === "DESAEU") {
      return celdaValorIncorrectoDESAEU(r, c, val);
    } else if (destino === "DESAUS") {
      return celdaValorIncorrectoDESAUS(r, c, val);
    } else if (destino === "DESACH") {
      return celdaValorIncorrectoDESACH(r, c, val);
    }

    return false;
  }

  /* ===============================
     🔹 VALIDAR VALOR INCORRECTO: DESAEU
  =============================== */
  function celdaValorIncorrectoDESAEU(r, c, val) {
    // ❌ Col 13: 0-1.8
    if (c === 12 && (+val < 0 || +val > 1.8)) return true;

    // ❌ Col 17: 0-19.5
    if (c === 16 && (+val < 0 || +val > 19.5)) return true;

    // ❌ Col 19: "NOT"
    if (c === 18 && val.toUpperCase() !== "NOT") return true;

    // ❌ Fecha Arribo > Fecha Inspección
    if (c === 25) {
      const fechaArribo = parseExcelDateISO(val);
      const fechaInspeccion = parseExcelDateISO(r[26]);
      if (fechaArribo && fechaInspeccion && fechaArribo > fechaInspeccion) return true;
    }

    // ❌ Col 33: debe ser > 0
    if (c === 32 && +val <= 0) return true;

    // ❌ Col 34-44: deben estar vacías
    if (c >= 33 && c <= 43 && val) return true;

    // ❌ Col 51: 0-5
    if (c === 50 && (+val < 0 || +val > 5)) return true;

    return false;
  }

  /* ===============================
     🔹 VALIDAR VALOR INCORRECTO: DESAUS
  =============================== */
  function celdaValorIncorrectoDESAUS(r, c, val) {
    // ❌ Col 13: 0-1.8 (solo si existe dato)
    if (c === 12 && (+val < 0 || +val > 1.8)) return true;

    // ❌ Col 16: 0-19.5 (solo si existe dato)
    if (c === 15 && (+val < 0 || +val > 19.5)) return true;

    // ❌ Col 18: 0-34
    if (c === 17 && (+val < 0 || +val > 34)) return true;

    // ❌ Col 19: 0-34
    if (c === 18 && (+val < 0 || +val > 34)) return true;

    // ❌ Col 24-25: "CUMPLE"
    if (c === 23 && val.toUpperCase() !== "CUMPLE") return true;
    if (c === 24 && val.toUpperCase() !== "CUMPLE") return true;

    // ❌ Fecha Arribo > Fecha Inspección
    if (c === 38) {
      const fechaArribo = parseExcelDateISO(val);
      const fechaInspeccion = parseExcelDateISO(r[39]);
      if (fechaArribo && fechaInspeccion && fechaArribo > fechaInspeccion) return true;
    }

    return false;
  }

  /* ===============================
     🔹 VALIDAR VALOR INCORRECTO: DESACH
  =============================== */
  function celdaValorIncorrectoDESACH(r, c, val) {
    // ❌ Col 13 Excel (12 JS): 0-1.8 (solo si existe dato)
    if (c === 12 && (+val < 0 || +val > 1.8)) return true;

    // ❌ Col 17 Excel (16 JS): 0-19.5 (solo si existe dato)
    if (c === 16 && (+val < 0 || +val > 19.5)) return true;

    // ❌ Col 50 Excel (49 JS): 0-34
    if (c === 49 && (+val < 0 || +val > 34)) return true;

    // ❌ Col 51 Excel (50 JS): 0-34
    if (c === 50 && (+val < 0 || +val > 34)) return true;

    // ❌ Fecha Arribo > Fecha Inspección
    if (c === 24) { // Col 25 Excel
      const fechaArribo = parseExcelDateISO(val);
      const fechaInspeccion = parseExcelDateISO(r[25]); // Col 26 Excel
      if (fechaArribo && fechaInspeccion && fechaArribo > fechaInspeccion) return true;
    }

    return false;
  }

  /* ===============================
     🔹 EXPORTAR EXCEL
  =============================== */
  exportBtn.addEventListener("click", () => {
    const destino = destinationTypeSelect.value;
    const config = CARTILLAS_CONFIG[destino];
    const fechaInspeccionISO = destinationDateSelect.value;

    // ✅ Filtrar por destino y fecha
    let rows = rawRows.filter(r => 
      r._cartilla === destino &&
      parseExcelDateISO(r[config.columnaInspeccion]) === fechaInspeccionISO
    );

    // ✅ 📦 Filtrar por contenedores seleccionados (si hay)
    const contenedoresSeleccionados = $('#destinocontenedor').val() || [];
    
    if (contenedoresSeleccionados.length > 0) {
      rows = rows.filter(r => contenedoresSeleccionados.includes(r[config.columnaContenedor]));
    }

    if (!rows.length) {
      Swal.fire("Sin data", "No hay registros para exportar", "warning");
      return;
    }

    Swal.fire({
      icon: "info",
      title: "Exportación Destinos",
      html: `
        <b>Cartilla:</b> ${destino}<br><br>
        <b>Fecha inspección:</b> ${formatISOToDMY(fechaInspeccionISO)}<br><br>
        ${contenedoresSeleccionados.length ? 
          `<b>Contenedores:</b> ${contenedoresSeleccionados.join(", ")}<br><br>` : 
          "<b>Todos los contenedores</b><br><br>"}
        <b>Total registros:</b> ${rows.length}
      `,
      confirmButtonText: "Exportar"
    }).then(res => {
      if (!res.isConfirmed) return;
      generarExcelDestino(rows, destino, fechaInspeccionISO, contenedoresSeleccionados);
    });
  });

  /* ===============================
     🔹 GENERAR EXCEL (SIN TOCAR COLUMNAS PROTEGIDAS)
  =============================== */
  function generarExcelDestino(rows, destino, fechaInspeccionISO, contenedoresSeleccionados) {

    const config = CARTILLAS_CONFIG[destino];
    const headers = headersByDestino[destino];
    const formattedDate = formatISOToDMY(fechaInspeccionISO);

    // 🔒 columnas que NO se modifican
    const PROTEGIDAS = new Set([
      ...(config.columnasTexto || []),
      ...(config.columnasFecha || [])
    ]);

    const exportArray = [headers];

    rows.forEach(r => {
      const row = headers.map((_, i) => {

        // ✅ SIEMPRE LIMPIAR ESPACIOS (incluso en protegidas)
        let val = r[i] ?? "";
        val = String(val).trim();

        // 🔒 Columnas protegidas: devolver como texto limpio
        if (PROTEGIDAS.has(i)) {
          return val;
        }

        // 🔢 Otras columnas: intentar numérico
        const num = parseFloat(val);
        return isNaN(num) ? val : num;
      });

      exportArray.push(row);
    });

    const ws = XLSX.utils.aoa_to_sheet(exportArray);

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, destino);
    
    // 📦 Incluir contenedores en nombre de archivo si hay filtro
    const contenedorSuffix = contenedoresSeleccionados.length > 0 ? 
      `_${contenedoresSeleccionados.join("_")}` : "";
    
    XLSX.writeFile(wb, `${destino}_${formattedDate}${contenedorSuffix}.xlsx`);

    Swal.fire("Éxito", "Excel exportado correctamente", "success");
  }

  /* ===============================
     🔹 LIMPIAR TODO
  =============================== */
  clearBtn.addEventListener("click", () => {
    limpiarTodoDestino();
  });

  function limpiarTodoDestino() {
    // Data
    rawRows = [];
    headersByDestino = {};
    columnsByDestino = {};
    destinoStatus = { DESAEU: false, DESAUS: false, DESACH: false };

    // Input
    fileInput.value = "";

    // Tabla
    headerRow.innerHTML = "";
    bodyRows.innerHTML = "";
    totalFilasDiv.textContent = "";

    // Selects
    destinationTypeSelect.innerHTML = `<option value="" disabled selected>Selecciona destino</option>`;
    destinationTypeSelect.disabled = true;
    destinationTypeSelect.style.border = "";
    destinationTypeSelect.style.color = "";

    destinationDateSelect.innerHTML = `<option value="" disabled selected>Selecciona fecha</option>`;
    destinationDateSelect.disabled = true;
    destinationDateSelect.style.border = "";
    destinationDateSelect.style.color = "";

    destinationUpdateDateSelect.innerHTML = `<option value="" disabled selected>Auto-Fecha</option>`;
    destinationUpdateDateSelect.disabled = true;
    destinationUpdateDateSelect.style.border = "";
    destinationUpdateDateSelect.style.color = "";

    // ✅ Limpiar select de contenedores
    $('#destinocontenedor').empty().trigger('change');
    contenedorSelect.disabled = true;

    // Botones
    runReviewBtn.disabled = true;
    exportBtn.disabled = true;

    Swal.fire({
      icon: "success",
      title: "Limpieza completa",
      text: "El módulo de Destinos se limpió correctamente.",
      timer: 1500,
      showConfirmButton: false
    });
  }

  /* ===============================
     🔹 UTILIDADES
  =============================== */
  function resetAll() {
    headerRow.innerHTML = "";
    bodyRows.innerHTML = "";
    totalFilasDiv.textContent = "";

    destinationTypeSelect.innerHTML = `<option value="" disabled selected>Selecciona destino</option>`;
    destinationTypeSelect.value = "";
    destinationTypeSelect.disabled = true;

    destinationDateSelect.innerHTML = `<option value="" disabled selected>Selecciona fecha</option>`;
    destinationDateSelect.value = "";
    destinationDateSelect.disabled = true;

    destinationUpdateDateSelect.innerHTML = `<option value="" disabled selected>Auto-Fecha</option>`;
    destinationUpdateDateSelect.value = "";
    destinationUpdateDateSelect.disabled = true;

    // ✅ Limpiar contenedores
    $('#destinocontenedor').empty().trigger('change');
    contenedorSelect.disabled = true;
  }

  /* ===============================
     🔹 Fechas - llenar select
  =============================== */
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
    if (!iso) return "";
    const [y, m, d] = iso.split("-");
    return `${d}-${m}-${y}`;
  }

  function parseExcelDateISO(v) {
    if (!v) return "";
    // Formato 20251110 → 2025-11-10
    if (/^\d{8}$/.test(v)) return `${v.slice(0, 4)}-${v.slice(4, 6)}-${v.slice(6, 8)}`;
    // Formato 10/11/2025 → 2025-11-10
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(v)) {
      const [d, m, y] = v.split("/");
      return `${y}-${m}-${d}`;
    }
    const d = new Date(v);
    return isNaN(d) ? "" : d.toISOString().split("T")[0];
  }

})();