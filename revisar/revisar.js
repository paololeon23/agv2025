(() => {
  const fileInput = document.getElementById('file');
  const reviewColumnsDiv = document.getElementById('reviewColumns');
  const runReviewBtn = document.getElementById('runReview');
  const resultsHeader = document.getElementById('resultsHeader');
  const resultsBody = document.getElementById('resultsBody');

  let rawData = [];
  let primaryKey = null;

  // ===============================
  // 🔎 Detectar tipo de columna
  // ===============================
  function detectColumnType(colIdx, maxScan = 30) {
    for (let i = 1; i < rawData.length && i <= maxScan; i++) {
      const val = rawData[i][colIdx];
      if (val !== null && val !== "") {
        return isNaN(val) ? 'text' : 'number';
      }
    }
    return 'text';
  }

  // ===============================
// 📂 Cargar archivo
// ===============================
fileInput.addEventListener('change', e => {
  const f = e.target.files[0];
  if (!f) return;

  const reader = new FileReader();
  reader.onload = ev => {
    let workbook;
    const data = ev.target.result;

    try {
      workbook = XLSX.read(new Uint8Array(data), { type: 'array' });
    } catch {
      workbook = XLSX.read(data, { type: 'binary' });
    }

    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    rawData = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false });

    if (!rawData.length) {
      alert("Archivo vacío");
      return;
    }

    const headers = rawData[0].map(h => h.toUpperCase());
    if (headers.includes("ID")) primaryKey = headers.indexOf("ID");
    else if (headers.includes("LOTE")) primaryKey = headers.indexOf("LOTE");
    else primaryKey = null;

    // 🧱 Construir columnas
    initReviewColumns();
    updateRunReviewState();

    // 🔓 Habilitar JSON cuando Excel está cargado
    document.getElementById("importJson").disabled = false;
    document.getElementById("exportJson").disabled = false;

    // 🧹 Limpiar resultados anteriores
    resultsHeader.innerHTML = "";
    resultsBody.innerHTML = "";
  };

  reader.readAsArrayBuffer(f);
});

function updateRunReviewState() {
  const excelLoaded = rawData.length > 0;

  const anyChecked = document.querySelectorAll(
    '.review-column input[type=checkbox]:checked'
  ).length > 0;

  runReviewBtn.disabled = !(excelLoaded && anyChecked);
}

  // ===============================
  // 🧱 Construir columnas revisión
  // ===============================
  function initReviewColumns() {
    reviewColumnsDiv.innerHTML = "";
    const headers = rawData[0];

    headers.forEach((h, idx) => {
      const row = document.createElement('div');
      row.className = 'review-column';

      // Revisar
      const colRevisar = document.createElement('div');
      colRevisar.className = 'col revisar';
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.dataset.col = idx;
      colRevisar.appendChild(checkbox);

      // Campo
      const colCampo = document.createElement('div');
      colCampo.className = 'col campo';
      colCampo.textContent = h;

      // Regla
      const colRegla = document.createElement('div');
      colRegla.className = 'col regla';

      const disable = input => {
        input.disabled = true;
        return input;
      };

      if (h.toLowerCase() === "lote") {
        const input = disable(document.createElement('input'));
        input.type = "number";
        input.placeholder = "Longitud";
        input.className = "text-value";
        colRegla.appendChild(input);
      } else {
        const type = detectColumnType(idx);
        if (type === "number") {
          const min = disable(document.createElement('input'));
          min.type = "number";
          min.placeholder = "Min";
          min.className = "min-value";

          const max = disable(document.createElement('input'));
          max.type = "number";
          max.placeholder = "Max";
          max.className = "max-value";

          colRegla.append(min, max);
        } else {
          const txt = disable(document.createElement('input'));
          txt.type = "text";
          txt.placeholder = "Valor permitido";
          txt.className = "text-value";
          colRegla.appendChild(txt);
        }
      }

      // Eliminar 🗑
      const colEliminar = document.createElement('div');
      colEliminar.className = 'col eliminar';
      const del = document.createElement('i');
      del.className = 'fa-solid fa-trash';
      del.addEventListener('click', () => row.remove());
      colEliminar.appendChild(del);

      row.append(colRevisar, colCampo, colRegla, colEliminar);
      reviewColumnsDiv.appendChild(row);

      checkbox.addEventListener('change', () => {
        colRegla.querySelectorAll('input').forEach(inp => {
          inp.disabled = !checkbox.checked;
          if (!checkbox.checked) inp.value = "";
        });
          updateRunReviewState();
      });
    });
  }

  // ===============================
  // ▶ Ejecutar revisión
  // ===============================
  runReviewBtn.addEventListener('click', () => {
    const tableWrap = document.querySelector('.table-wrap');
    tableWrap.style.display = 'block';
    resultsHeader.innerHTML = "";
    resultsBody.innerHTML = "";

    const reviewCols = [...document.querySelectorAll('.review-column')]
      .filter(col => col.querySelector('input[type=checkbox]').checked)
      .map(col => ({
        idx: parseInt(col.querySelector('input').dataset.col),
        col,
        name: col.querySelector('.campo').textContent
      }));

    // ⚠️ Validar reglas vacías
    let invalidRule = false;
    reviewCols.forEach(({ col }) => {
      const inputs = col.querySelectorAll('.regla input');
      if (![...inputs].some(i => i.value.trim() !== "")) {
        invalidRule = true;
      }
    });

    if (invalidRule) {
      Swal.fire({
        title: "Regla incompleta",
        text: "Marcaste una columna para revisar pero no ingresaste ninguna regla.",
        icon: "warning",
        confirmButtonText: "Entendido"
      });
      return;
    }

    if (!reviewCols.length) return;

    // Columnas resultado (PK una sola vez)
    const colsToShow = [];
    if (primaryKey !== null) colsToShow.push(primaryKey);
    colsToShow.push(...reviewCols.map(c => c.idx));
    const uniqueCols = [...new Set(colsToShow)].sort((a, b) => a - b);

    // Header
    uniqueCols.forEach(idx => {
      const th = document.createElement('th');
      th.textContent = rawData[0][idx];
      resultsHeader.appendChild(th);
    });

    let anyError = false;

    rawData.slice(1).forEach(row => {
      const tr = document.createElement('tr');
      let rowHasError = false;
      const errorMap = {};

      reviewCols.forEach(({ idx, col, name }) => {
        const value = (row[idx] || "").toString().trim();
        let error = false;

        const min = col.querySelector('.min-value');
        const max = col.querySelector('.max-value');
        const txt = col.querySelector('.text-value');

        if (name.toLowerCase() === "lote") {
          const len = parseInt(txt.value);
          if (!value || (len && value.length !== len)) error = true;
        } else if (min && max) {
          const v = parseFloat(value);
          if (value === "" || isNaN(v) || v < min.value || v > max.value) error = true;
        } else if (txt) {
          if (value === "" || (txt.value && value.toUpperCase() !== txt.value.toUpperCase())) {
            error = true;
          }
        }

        if (error) {
          rowHasError = true;
          errorMap[idx] = true;
        }
      });

      if (rowHasError) {
        anyError = true;
        uniqueCols.forEach(idx => {
          const td = document.createElement('td');
          td.textContent = row[idx] || "";
          if (errorMap[idx]) td.style.color = "red";
          tr.appendChild(td);
        });
        resultsBody.appendChild(tr);
      }
    });

    if (!anyError) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = uniqueCols.length;
      td.textContent = "Todo correcto, ningún error";
      td.style.color = "green";
      td.style.fontWeight = "bold";
      tr.appendChild(td);
      resultsBody.appendChild(tr);
    }
  });

function exportConfigJSON() {
  const config = {
    pk: primaryKey !== null ? rawData[0][primaryKey] : null,
    rules: []
  };

  document.querySelectorAll('.review-column').forEach(col => {
    const chk = col.querySelector('input[type=checkbox]');
    if (!chk.checked) return;

    const idx = parseInt(chk.dataset.col);
    const min = col.querySelector('.min-value');
    const max = col.querySelector('.max-value');
    const txt = col.querySelector('.text-value');
    const name = col.querySelector('.campo').textContent.toLowerCase();

    if (name === "lote") {
      config.rules.push({ c: idx, t: "length", v: txt.value });
    } else if (min && max) {
      config.rules.push({ c: idx, t: "number", min: min.value, max: max.value });
    } else if (txt) {
      config.rules.push({ c: idx, t: "text", v: txt.value });
    }
  });

  const blob = new Blob(
    [JSON.stringify(config, null, 2)],
    { type: "application/json" }
  );

  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = "revision_config.json";
  a.click();
}

function importConfigJSON(config) {
  document.querySelectorAll('.review-column').forEach(col => {
    const chk = col.querySelector('input[type=checkbox]');
    const idx = parseInt(chk.dataset.col);
    const rule = config.rules.find(r => r.c === idx);

    chk.checked = !!rule;

    col.querySelectorAll('.regla input').forEach(i => {
      i.disabled = !rule;
      i.value = "";
    });

    if (!rule) return;

    if (rule.t === "length") {
      col.querySelector('.text-value').value = rule.v;
    }

    if (rule.t === "number") {
      col.querySelector('.min-value').value = rule.min;
      col.querySelector('.max-value').value = rule.max;
    }

    if (rule.t === "text") {
      col.querySelector('.text-value').value = rule.v;
    }
  });
}


document.getElementById("importJson").addEventListener("change", e => {
  const file = e.target.files[0];
  if (!file) return;

  Swal.fire({
    title: "¿Cargar configuración?",
    text: "Esto reemplazará la configuración actual de revisión",
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Sí, cargar",
    cancelButtonText: "Cancelar"
  }).then(result => {
    if (!result.isConfirmed) {
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const config = JSON.parse(ev.target.result);
        importConfigJSON(config);

        Swal.fire(
          "Configuración cargada",
          "La configuración se aplicó correctamente",
          "success"
        );
      } catch {
        Swal.fire("Error", "JSON inválido", "error");
      }
    };
    reader.readAsText(file);
  });
});

document.getElementById("exportJson")
  .addEventListener("click", exportConfigJSON);


})();
