(() => {
console.log("🫐 Arándanos | Script inicializado");

// ===============================
// DOM
// ===============================
const fileInput = document.getElementById("fileArandano");
const inspectionTypeSelect = document.getElementById("inspectionType");
const inspectionDateSelect = document.getElementById("inspectionDate");
const updateDateSelect = document.getElementById("updateDate");

const runReviewBtn = document.getElementById("runReviewArandano");
const clearBtn = document.getElementById("clearArandano");

const headerRow = document.getElementById("resultsHeader");
const bodyRows = document.getElementById("resultsBody");
const totalFilasDiv = document.getElementById("totalFilas");

// ===============================
// DATA
// ===============================
let rawRows = [];
let headers = [];
let columns = [];

// ===============================
// FILE INPUT (MULTIPLE)
// ===============================
fileInput.addEventListener("change", async e => {
  console.log("📂 Cargando archivos...");

  const files = Array.from(e.target.files);
  if (!files.length) return;

  resetAll();
  rawRows = [];

  for (const file of files) {
    console.log("📄 Archivo:", file.name);

    const buffer = await file.arrayBuffer();
    const wb = XLSX.read(buffer, { type: "array" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    let data = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false });

    data.splice(0, 5); // quitar cabeceras basura
    if (data.length < 2) continue;

    if (!headers.length) {
      headers = data[0];
      initColumns();
    }

    if (headers.length !== 101) {
      Swal.fire("Error", `${file.name} no tiene 101 columnas`, "error");
      return;
    }

    const rows = data.slice(1).filter(r => r.some(v => v !== "" && v !== null));
    rawRows.push(...rows);
  }

  runReviewBtn.disabled = false;
  console.log("✅ Filas cargadas:", rawRows.length);
});

// ===============================
// CARTILLA
// ===============================
inspectionTypeSelect.addEventListener("change", () => {
  const tipo = inspectionTypeSelect.value;

  const fechas = [...new Set(
    rawRows
      .filter(r => (r[1] || "").toUpperCase() === tipo)
      .map(r => formatDate(r[40]))
      .filter(Boolean)
  )];

  fillSelect(inspectionDateSelect, fechas);
  inspectionDateSelect.disabled = false;
});

// ===============================
// FECHA INSPECCIÓN → LMR
// ===============================
inspectionDateSelect.addEventListener("change", () => {
  const tipo = inspectionTypeSelect.value;
  const fecha = inspectionDateSelect.value;

  const rows = rawRows.filter(r =>
    (r[1] || "").toUpperCase() === tipo &&
    formatDate(r[40]) === fecha
  );

  const lmrDates = [...new Set(rows.map(r => formatDate(r[50])).filter(Boolean))];
  fillSelect(updateDateSelect, lmrDates);
  updateDateSelect.disabled = false;
});

// ===============================
// REVISAR (IGUAL QUE UVA)
// ===============================
runReviewBtn.addEventListener("click", () => {
  const tipo = inspectionTypeSelect.value;
  const fecha = inspectionDateSelect.value;

  const rows = rawRows.filter(r =>
    (r[1] || "").toUpperCase() === tipo &&
    formatDate(r[40]) === fecha
  );

  const lmrDates = [...new Set(rows.map(r => formatDate(r[50])).filter(Boolean))];

  Swal.fire({
    icon: lmrDates.length > 1 ? "warning" : "info",
    title: "Revisión iniciada",
    html: `
      <b>Cartilla:</b> ${tipo}<br>
      <b>Fecha inspección:</b> ${fecha}<br>
      <b>LMR:</b> ${lmrDates.join(" / ") || "Sin LMR"}
    `
  });

  renderErrores(rows, tipo);
  totalFilasDiv.textContent = `Total registros inspección: ${rows.length}`;
});

// ===============================
// RENDER TABLA (COMO UVA)
// ===============================
function renderErrores(rows, tipo) {
  headerRow.innerHTML = "";
  bodyRows.innerHTML = "";

  // HEADERS
  columns.forEach((c, i) => {
    const th = document.createElement("th");
    th.textContent = c.header;

    if (i === 0) th.classList.add("sticky-col", "sticky-col-1");
    if (i === 6) th.classList.add("sticky-col", "sticky-col-2");
    if (i === 9) th.classList.add("sticky-col", "sticky-col-3");

    headerRow.appendChild(th);
  });

  // duplicados lote
  const lotes = rows.map(r => r[9]).filter(Boolean);
  const duplicados = lotes.filter((v, i, a) => a.indexOf(v) !== i);

  rows.forEach(row => {
    const errores = detectErrors(row, tipo, duplicados);
    if (!errores.length) return;

    const tr = document.createElement("tr");

    row.forEach((cell, i) => {
      const td = document.createElement("td");
      td.textContent = cell ?? "";

      if (errores.includes(i)) {
        td.style.background = "#ffdddd";
        td.style.color = "red";
      }

      if (i === 0) td.classList.add("sticky-col", "sticky-col-1");
      if (i === 6) td.classList.add("sticky-col", "sticky-col-2");
      if (i === 9) td.classList.add("sticky-col", "sticky-col-3");

      tr.appendChild(td);
    });

    bodyRows.appendChild(tr);
  });
}

// ===============================
// VALIDACIONES (CORE)
// ===============================
function detectErrors(r, tipo, duplicados) {
  const e = [];

  if (!r[9] || r[9].toString().length !== 10 || duplicados.includes(r[9])) e.push(9);

  for (let i = 10; i <= 18; i++) {
    if (i !== 16 && !r[i]) e.push(i);
  }

  if (Number(r[10]) > 505) e.push(10);
  if (formatDate(r[19]) > formatDate(r[40])) e.push(19);

  if (tipo === "MPHA") {
    if ([59,69].includes(Number(r[28]))) e.push(28);
    if ([59,69].includes(Number(r[29]))) e.push(29);
  }

  if (tipo === "MPBA") {
    if (r[28] != 69) e.push(28);
    if (r[29] != 53) e.push(29);
  }

  if (tipo === "MPGA") {
    if (r[28] != 59) e.push(28);
    if (r[29] != 53) e.push(29);
  }

  return e;
}

// ===============================
// INIT COLUMNS
// ===============================
function initColumns() {
  columns = headers.map((h, i) => ({
    id: `col_${i+1}`,
    header: h || `Col ${i+1}`,
    index: i
  }));
}

// ===============================
// UTILIDADES
// ===============================
function resetAll() {
  headerRow.innerHTML = "";
  bodyRows.innerHTML = "";
  totalFilasDiv.textContent = "";
}

function fillSelect(select, values) {
  select.innerHTML = `<option disabled selected>Selecciona</option>`;
  values.forEach(v => {
    const o = document.createElement("option");
    o.value = v;
    o.textContent = v;
    select.appendChild(o);
  });
}

function formatDate(v) {
  if (!v) return "";
  const d = new Date(v);
  if (isNaN(d)) return "";
  return d.toISOString().split("T")[0];
}
})();
