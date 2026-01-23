const data = [
    { id: 190, codigo: "DAUS", nombre: "Inspección Destino Arándano - USA", estado: "DISPONIBLE", emp: "CH01 - Agrovision Chile", mandante: "600", activo: true },
    { id: 191, codigo: "DAEU", nombre: "Inspección de Destino EU - PF", estado: "DISPONIBLE", emp: "CH01 - Agrovision Chile", mandante: "600", activo: true },
    { id: 233, codigo: "MPAGR", nombre: "Materia Prima Granel - Ar", estado: "DISPONIBLE", emp: "CH01 - Agrovision Chile", mandante: "600", activo: true },
    { id: 234, codigo: "MPAHP", nombre: "Materia Prima HP - Ar", estado: "DISPONIBLE", emp: "CH01 - Agrovision Chile", mandante: "600", activo: true },
    { id: 235, codigo: "MPABK", nombre: "Materia Prima Bulk - Ar", estado: "DISPONIBLE", emp: "CH01 - Agrovision Chile", mandante: "600", activo: true },
    { id: 236, codigo: "GPTLPA", nombre: "PT Línea de Proceso - Ar", estado: "DISPONIBLE", emp: "CH01 - Agrovision Chile", mandante: "600", activo: true },
    { id: 237, codigo: "GPTHPA", nombre: "PT Hand Packed - Ar", estado: "DISPONIBLE", emp: "CH01 - Agrovision Chile", mandante: "600", activo: true },
    { id: 238, codigo: "GPTBKA", nombre: "PT Bulk de Proceso - Ar", estado: "DISPONIBLE", emp: "CH01 - Agrovision Chile", mandante: "600", activo: true },
    { id: 241, codigo: "GMPCGR", nombre: "Materia Prima Granel - Ch", estado: "DISPONIBLE", emp: "CH01 - Agrovision Chile", mandante: "600", activo: true },
    { id: 244, codigo: "GPTCGR", nombre: "PT Línea de Proceso - Ch", estado: "DISPONIBLE", emp: "CH01 - Agrovision Chile", mandante: "600", activo: true },
    { id: 245, codigo: "GIARFQ", nombre: "Inspección FQO Arándano", estado: "DISPONIBLE", emp: "CH01 - Agrovision Chile", mandante: "600", activo: true },
    { id: 249, codigo: "GDCHUSA", nombre: "Destino USA - Ch", estado: "DISPONIBLE", emp: "CH01 - Agrovision Chile", mandante: "600", activo: true },
    { id: 250, codigo: "GDCHEU", nombre: "Inspección de Destino EU - Ch", estado: "DISPONIBLE", emp: "CH01 - Agrovision Chile", mandante: "600", activo: true },
    { id: 256, codigo: "GDAEUBK", nombre: "Inspección de Destino EU - Bulk", estado: "DISPONIBLE", emp: "CH01 - Agrovision Chile", mandante: "600", activo: true }
];

const tableBody = document.getElementById('tableBody');
const searchInput = document.getElementById('searchInput');

function renderTable(filterText = "") {
    tableBody.innerHTML = "";
    
    const filteredData = data.filter(item => 
        item.nombre.toLowerCase().includes(filterText.toLowerCase()) ||
        item.codigo.toLowerCase().includes(filterText.toLowerCase()) ||
        item.id.toString().includes(filterText)
    );

    filteredData.forEach(item => {
        const row = `
            <tr>
                <td><span class="tag-cat">${item.id}</span></td>
                <td><span class="badge-code">${item.codigo}</span></td>
                <td><span class="desc-text">${item.nombre}</span></td>
                <td><b style="color: #28a745;">${item.estado}</b></td>
                <td>${item.emp}</td>
                <td>${item.mandante}</td>
                <td><input type="checkbox" ${item.activo ? 'checked' : ''} disabled></td>
            </tr>
        `;
        tableBody.innerHTML += row;
    });
}

// Escuchar el buscador
searchInput.addEventListener('input', (e) => {
    renderTable(e.target.value);
});

// Carga inicial
renderTable();