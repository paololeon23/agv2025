(() => {
    const data1 = [
        { id: 75, codigo: "CUL05", nombre: "Limón", estado: "DISPONIBLE", cultivo: "PE10", empresa: "Agrovisión Perú SAC", mandante: "300" },
        { id: 23, codigo: "12TO", nombre: "TODOS", estado: "INACTIVO", cultivo: "PE10", empresa: "Agrovisión Perú SAC", mandante: "300" },
        { id: 7, codigo: "ap01", nombre: "Apio", estado: "INACTIVO", cultivo: "PE10", empresa: "Agrovisión Perú SAC", mandante: "300" },
        { id: 6, codigo: "ma01", nombre: "Manzana", estado: "INGRESADO", cultivo: "PE10", empresa: "Agrovisión Perú SAC", mandante: "300" },
        { id: 4, codigo: "CUU04", nombre: "UVA", estado: "DISPONIBLE", cultivo: "PE10", empresa: "Agrovisión Perú SAC", mandante: "300" },
        { id: 3, codigo: "CUE03", nombre: "ESPÁRRAGO", estado: "DISPONIBLE", cultivo: "PE10", empresa: "Agrovisión Perú SAC", mandante: "300" },
        { id: 2, codigo: "CUP02", nombre: "PALTA", estado: "DISPONIBLE", cultivo: "PE10", empresa: "Agrovisión Perú SAC", mandante: "300" },
        { id: 1, codigo: "CUA01", nombre: "ARÁNDANO", estado: "DISPONIBLE", cultivo: "PE10", empresa: "Agrovisión Perú SAC", mandante: "300" }
    ];

    const data2 = [
        { id: 1, cod: "DEST", nom: "Inspección de Destino", est: "DISPONIBLE", ec: "PE10", en: "Agrovisión Perú SAC", mid: "300", mdesc: "300", act: true },
        { id: 2, cod: "test", nom: "Inspección Test", est: "DISPONIBLE", ec: "PE10", en: "Agrovisión Perú SAC", mid: "300", mdesc: "300", act: true },
        { id: 3, cod: "MPES", nom: "Materia Prima - ASP", est: "DISPONIBLE", ec: "PE10", en: "Agrovisión Perú SAC", mid: "300", mdesc: "300", act: true },
        { id: 4, cod: "PTES", nom: "Producto Terminado - ASP", est: "DISPONIBLE", ec: "PE10", en: "Agrovisión Perú SAC", mid: "300", mdesc: "300", act: true },
        { id: 5, cod: "MPBAR", nom: "Materia Prima Bulk - Ar", est: "DISPONIBLE", ec: "PE10", en: "Agrovisión Perú SAC", mid: "300", mdesc: "300", act: true },
        { id: 6, cod: "MPGAR", nom: "Materia Prima Granel - Ar", est: "DISPONIBLE", ec: "PE10", en: "Agrovisión Perú SAC", mid: "300", mdesc: "300", act: true },
        { id: 7, cod: "MPHPAR", nom: "Materia Prima HP - Ar", est: "DISPONIBLE", ec: "PE10", en: "Agrovisión Perú SAC", mid: "300", mdesc: "300", act: true },
        { id: 8, cod: "PTBPAR", nom: "PT Bulk de Proceso - Ar", est: "DISPONIBLE", ec: "PE10", en: "Agrovisión Perú SAC", mid: "300", mdesc: "300", act: true },
        { id: 9, cod: "PTHPAR", nom: "PT Hand Packed - Ar", est: "DISPONIBLE", ec: "PE10", en: "Agrovisión Perú SAC", mid: "300", mdesc: "300", act: true },
        { id: 10, cod: "PTLPAR", nom: "PT Línea de Proceso - Ar", est: "DISPONIBLE", ec: "PE10", en: "Agrovisión Perú SAC", mid: "300", mdesc: "300", act: true },
        { id: 11, cod: "IPMPAR", nom: "Inspección Plagas MP - Ar", est: "DISPONIBLE", ec: "PE10", en: "Agrovisión Perú SAC", mid: "300", mdesc: "300", act: true },
        { id: 12, cod: "IPPTAR", nom: "Inspección Plagas PT - Ar", est: "DISPONIBLE", ec: "PE10", en: "Agrovisión Perú SAC", mid: "300", mdesc: "300", act: true },
        { id: 13, cod: "apio01", nom: "Apio", est: "DISPONIBLE", ec: "PE10", en: "Agrovisión Perú SAC", mid: "300", mdesc: "300", act: true },
        { id: 22, cod: "DESTACH", nom: "Inspección de Destino", est: "INACTIVO", ec: "PE10", en: "Agrovisión Perú SAC", mid: "300", mdesc: "300", act: true },
        { id: 37, cod: "TEMPPKGRAND", nom: "TEMPERATURA PK", est: "INACTIVO", ec: "PE10", en: "Agrovisión Perú SAC", mid: "300", mdesc: "300", act: true },
        { id: 48, cod: "GIPTU", nom: "Producto Terminado Uva", est: "DISPONIBLE", ec: "PE10", en: "Agrovisión Perú SAC", mid: "300", mdesc: "300", act: true },
        { id: 153, cod: "TRFQ", nom: "Fisicoquímicos Arándano", est: "INACTIVO", ec: "PE10", en: "Agrovisión Perú SAC", mid: "300", mdesc: "300", act: true },
        { id: 252, cod: "GDUVAEU", nom: "Inspección de Destino EU - GR", est: "DISPONIBLE", ec: "PE10", en: "Agrovisión Perú SAC", mid: "300", mdesc: "300", act: true }
    ];

    const rowsPerPage = 10;
    let filteredData1 = [...data1];
    let filteredData2 = [...data2];

    function renderTable(data, tbodyId, page, type) {
        const tbody = document.getElementById(tbodyId);
        const start = (page - 1) * rowsPerPage;
        const end = start + rowsPerPage;
        const items = data.slice(start, end);

        tbody.innerHTML = items.map(item => {
            if (type === 1) {
                return `<tr><td>${item.id}</td><td>${item.codigo}</td><td>${item.nombre}</td><td><span class="badge status-${item.estado.toLowerCase()}">${item.estado}</span></td><td>${item.cultivo}</td><td>${item.empresa}</td><td>${item.mandante}</td></tr>`;
            } else {
                return `<tr><td>${item.id}</td><td>${item.cod}</td><td>${item.nom}</td><td><span class="badge status-${item.est.toLowerCase()}">${item.est}</span></td><td>${item.ec}</td><td>${item.en}</td><td>${item.mid}</td><td>${item.mdesc}</td><td style="text-align:center"><input type="checkbox" ${item.act ? 'checked' : ''} disabled></td></tr>`;
            }
        }).join('');
    }

    function createPagination(totalItems, currentPage, containerId, callback) {
        const container = document.getElementById(containerId);
        const totalPages = Math.ceil(totalItems / rowsPerPage) || 1; // Evita 0 páginas
        container.innerHTML = "";

        let btnPrev = document.createElement("button");
        btnPrev.innerText = "Ant";
        btnPrev.disabled = currentPage === 1;
        btnPrev.onclick = () => callback(currentPage - 1);
        container.appendChild(btnPrev);

        for (let i = 1; i <= totalPages; i++) {
            let btn = document.createElement("button");
            btn.className = (i === currentPage ? "active" : "");
            btn.innerText = i;
            btn.onclick = () => callback(i);
            container.appendChild(btn);
        }

        let btnNext = document.createElement("button");
        btnNext.innerText = "Sig";
        btnNext.disabled = currentPage === totalPages;
        btnNext.onclick = () => callback(currentPage + 1);
        container.appendChild(btnNext);
    }

    // --- LÓGICA DE BÚSQUEDA ---
    const initTable1 = (p) => { 
        renderTable(filteredData1, 'agvTableBody', p, 1); 
        createPagination(filteredData1.length, p, 'agvPagination1', initTable1); 
    };
    
    const initTable2 = (p) => { 
        renderTable(filteredData2, 'agvGrupoTableBody', p, 2); 
        createPagination(filteredData2.length, p, 'agvPagination2', initTable2); 
    };

    // Escuchar buscador Tabla 1
    document.getElementById('agvSearchInput').addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        filteredData1 = data1.filter(item => 
            item.nombre.toLowerCase().includes(term) || 
            item.codigo.toLowerCase().includes(term)
        );
        initTable1(1); // Reiniciar a la página 1
    });

    // Escuchar buscador Tabla 2
    document.getElementById('agvGrupoSearch').addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        filteredData2 = data2.filter(item => 
            item.nom.toLowerCase().includes(term) || 
            item.cod.toLowerCase().includes(term)
        );
        initTable2(1); // Reiniciar a la página 1
    });

    // Inicializar
    initTable1(1);
    initTable2(1);
})();