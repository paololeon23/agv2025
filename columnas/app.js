const fileInput = document.getElementById('file');
const jsonFileInput = document.getElementById('jsonFile');
const table = document.getElementById('sheetTable');
const headerRow = document.getElementById('headerRow');
const bodyRows = document.getElementById('bodyRows');
const emptyNote = document.getElementById('emptyNote');

const autoIdsBtn = document.getElementById('autoIds');
const exportJsonBtn = document.getElementById('exportJson');
const downloadXlsxBtn = document.getElementById('downloadXlsx');

const rowsPerPageSelect = document.getElementById("rowsPerPage");

// ===============================
// VARIABLES
// ===============================
let rawData = [];
let columns = [];
let filteredData = [];

let rowsPerPage = 10;   // por defecto
let currentPage = 1;    // inicio en página 1

// ===============================
// LEER EXCEL
// ===============================
fileInput.addEventListener('change', e => {
  const f = e.target.files[0];
  if (!f) return;

  const reader = new FileReader();
  reader.onload = ev => {
    const data = ev.target.result;
    let workbook;

    try {
      workbook = XLSX.read(new Uint8Array(data), { type: 'array' });
    } catch {
      workbook = XLSX.read(data, { type: 'binary' });
    }

    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false });
    if (!json.length) return alert("Archivo vacío");

    rawData = json;
    initColumns();
    currentPage = 1;
    renderTable();
    jsonFileInput.disabled = false;
    downloadXlsxBtn.disabled = false;
    exportJsonBtn.disabled = false;  
  };
  reader.readAsArrayBuffer(f);
});

function initColumns() {
  const headers = rawData[0].map(h => h || "");
  columns = headers.map((h, i) => ({
    id: `columna_${i + 1}`,
    header: h,
    originalIndex: i
  }));
}

// ===============================
// EVENTO SELECTOR FILAS POR PÁGINA
// ===============================
rowsPerPageSelect.addEventListener("change", e => {
  rowsPerPage = parseInt(e.target.value);
  currentPage = 1;
  renderTable();
});

document.getElementById("searchInput").addEventListener("input", e => {
  const search = e.target.value.trim().toLowerCase();

  if (search === "") {
    filteredData = rawData.slice(1); // todas las filas originales
  } else {
    filteredData = rawData.slice(1).filter(row =>
      row.some(cell => (cell + "").toLowerCase().includes(search))
    );
  }

  currentPage = 1;
  renderTable();
});


// ===============================
// RENDER TABLA (CON PAGINACIÓN)
// ===============================
function renderTable() {
  headerRow.innerHTML = "";
  bodyRows.innerHTML = "";

  // Construir encabezados
  columns.forEach((col, idx) => {
    const th = document.createElement("th");
    th.dataset.colIndex = idx;
    th.setAttribute("draggable", "true");

    th.innerHTML = `
      <span class="id-badge">${col.id}</span>
      <input class="header-input" data-idx="${idx}" value="${col.header}">
      <span class="drag-handle">☰</span>
    `;

    headerRow.appendChild(th);

    th.addEventListener("dragstart", dragStart);
    th.addEventListener("dragover", dragOver);
    th.addEventListener("drop", drop);
    th.addEventListener("dragend", dragEnd);
  });

  // ================================
  // PAGINACIÓN
  // ================================
  const start = (currentPage - 1) * rowsPerPage;
  const end = start + rowsPerPage;

  const base = filteredData.length ? filteredData : rawData.slice(1);
  const visibleRows = base.slice(start, end);
  // sin encabezado

visibleRows.forEach(row => {
    const tr = document.createElement("tr");

    columns.forEach(col => {
      const td = document.createElement("td");
      const value = row[col.originalIndex] || "";

      // === TEXTO LARGO CONTROLADO ===
      td.classList.add("dynamic-cell");
      td.textContent = value;
      td.setAttribute("data-full-text", value);

      tr.appendChild(td);
    });

    bodyRows.appendChild(tr);
});

  // actualizar labels de encabezado
  document.querySelectorAll('.header-input').forEach(inp => {
    inp.addEventListener("change", e => {
      const i = Number(e.target.dataset.idx);
      columns[i].header = e.target.value;
    });
  });

  table.hidden = false;
  emptyNote.hidden = true;
  renderPagination();
}

// ===============================
// DRAG & DROP COLUMNAS
// ===============================
let dragStartIndex = null;

function dragStart(e) {
  dragStartIndex = Number(e.currentTarget.dataset.colIndex);
}
function dragOver(e) { e.preventDefault(); }
function drop(e) {
  const dest = Number(e.currentTarget.dataset.colIndex);
  const item = columns.splice(dragStartIndex, 1)[0];
  columns.splice(dest, 0, item);
  renderTable();
}
function dragEnd() { dragStartIndex = null; }

// ===============================
// EXPORT JSON SOLO IDs
// ===============================
exportJsonBtn.addEventListener('click', () => {
  const ids = columns.map(c => c.id);
  const blob = new Blob([JSON.stringify(ids, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "orden_ids.json";
  a.click();
    // 🔔 SWEETALERT DE ÉXITO
  Swal.fire({
    icon: "success",
    title: "json descargado",
    text: "El archivo json reordenado se descargó correctamente.",
    confirmButtonText: "OK",
    timer: 2000
  });
});

// ===============================
// IMPORT JSON DESDE ARCHIVO (CON SWEETALERT)
// ===============================
jsonFileInput.addEventListener('change', e => {
  const f = e.target.files[0];
  if (!f) return;

  // Confirmación antes de aplicar el JSON
  Swal.fire({
    title: "¿Aplicar orden masivo?",
    text: "Se reordenarán todas las columnas según el JSON importado.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
    confirmButtonText: "Sí, aplicar",
    cancelButtonText: "Cancelar"
  }).then(result => {

    if (!result.isConfirmed) {
      e.target.value = ""; // limpia input
      return;
    }

    // Si confirmó → leer JSON
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const arr = JSON.parse(ev.target.result);
        if (!Array.isArray(arr)) throw new Error();

        const map = new Map(columns.map(c => [c.id, c]));
        const newOrder = [];

        arr.forEach(id => {
          if (map.has(id)) newOrder.push(map.get(id));
        });

        columns.forEach(c => {
          if (!newOrder.includes(c)) newOrder.push(c);
        });

        columns = newOrder;
        renderTable();

        Swal.fire(
          "Orden aplicado",
          "Las columnas fueron reordenadas correctamente.",
          "success"
        );

      } catch {
        Swal.fire("Error", "El archivo JSON no es válido.", "error");
      }
    };

    reader.readAsText(f);
  });

});


// ===============================
// DESCARGAR EXCEL REORDENADO
// ===============================
downloadXlsxBtn.addEventListener('click', () => {
  if (!rawData.length) return;

  const out = [];
  out.push(columns.map(c => c.header));

  for (let r = 1; r < rawData.length; r++) {
    const row = rawData[r];
    out.push(columns.map(c => row[c.originalIndex]));
  }

  const ws = XLSX.utils.aoa_to_sheet(out);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Reordenado");
  XLSX.writeFile(wb, "reordenado.xlsx");
  // 🔔 SWEETALERT DE ÉXITO
  Swal.fire({
    icon: "success",
    title: "Excel descargado",
    text: "El archivo reordenado se descargó correctamente.",
    confirmButtonText: "OK",
    timer: 2000
  });
});

// ===============================
// RESTAURAR ORDEN ORIGINAL
// ===============================
autoIdsBtn.addEventListener('click', () => {
  columns.sort((a, b) => a.originalIndex - b.originalIndex);
  renderTable();
});

document.getElementById("clearAll").addEventListener("click", () => {
  Swal.fire({
    title: "¿Limpiar todo?",
    text: "Se recargará la página y se perderán los datos no guardados.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Sí, limpiar",
    cancelButtonText: "Cancelar"
  }).then(result => {
    if (result.isConfirmed) {
      location.reload(); // recarga la página
    }
  });
});


function renderPagination() {
  const paginationContainer = document.getElementById("paginationContainer");
  paginationContainer.innerHTML = "";

  const base = filteredData.length ? filteredData : rawData.slice(1);
  const totalRows = base.length;
  const totalPages = Math.ceil(totalRows / rowsPerPage);

  if (totalPages <= 1) return;

  const ul = document.createElement("ul");
  ul.classList.add("pagination");

  // Bloque visible de páginas
  const maxVisible = 3;
  let startPage = Math.floor((currentPage - 1) / maxVisible) * maxVisible + 1;
  let endPage = Math.min(startPage + maxVisible - 1, totalPages);

  // === Botón Previous («) ===
  const prevLi = document.createElement("li");
  prevLi.classList.add("page-item");
  if (currentPage === 1) prevLi.classList.add("disabled");

  const prevA = document.createElement("a");
  prevA.classList.add("page-link");
  prevA.href = "#";
  prevA.innerHTML = "&laquo;";
  prevA.addEventListener("click", e => {
    e.preventDefault();
    if (currentPage > 1) {
      currentPage--;
      renderTable();
    }
  });

  prevLi.appendChild(prevA);
  ul.appendChild(prevLi);

  // === Botones de páginas visibles ===
  for (let i = startPage; i <= endPage; i++) {
    const li = document.createElement("li");
    li.classList.add("page-item");
    if (i === currentPage) li.classList.add("active");

    const a = document.createElement("a");
    a.classList.add("page-link");
    a.href = "#";
    a.textContent = i;

    a.addEventListener("click", e => {
      e.preventDefault();
      currentPage = i;
      renderTable();
    });

    li.appendChild(a);
    ul.appendChild(li);
  }

  // === Botón Next (») ===
  const nextLi = document.createElement("li");
  nextLi.classList.add("page-item");
  if (currentPage === totalPages) nextLi.classList.add("disabled");

  const nextA = document.createElement("a");
  nextA.classList.add("page-link");
  nextA.href = "#";
  nextA.innerHTML = "&raquo;";
  nextA.addEventListener("click", e => {
    e.preventDefault();
    if (currentPage < totalPages) {
      currentPage++;
      renderTable();
    }
  });

  nextLi.appendChild(nextA);
  ul.appendChild(nextLi);

  paginationContainer.appendChild(ul);
}
