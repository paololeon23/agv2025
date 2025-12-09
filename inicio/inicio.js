(() => {

    // ================================
    // 🔵 KPIs
    // ================================
    const kpis = {
        production: 1280,
        clients: 42,
        workers: 320,
        exports: 670
    };

    document.getElementById("kpi-production").textContent = kpis.production.toLocaleString();
    document.getElementById("kpi-clients").textContent = kpis.clients.toLocaleString();
    document.getElementById("kpi-workers").textContent = kpis.workers.toLocaleString();
    document.getElementById("kpi-exports").textContent = kpis.exports.toLocaleString();

    // ================================
    // 🎨 Colores definidos
    // ================================
    const colors = {
        arandanos: { bg: 'rgba(106, 90, 205, 0.3)', border: 'rgba(90, 77, 179, 1)' },
        uvas: { bg: 'rgba(39, 174, 96, 0.3)', border: 'rgba(34, 153, 84, 1)' },
        esparrago: { bg: 'rgba(255, 193, 7, 0.3)', border: 'rgba(255, 193, 7, 1)' }
    };

    const fundos = ['A9','C5','C6','LN'];

    // ================================
    // 1️⃣ Comparación de fundos
    // ================================
    const ctxFondos = document.getElementById('chartFondos');
    if(ctxFondos){
        new Chart(ctxFondos, {
            type: 'bar',
            data: {
                labels: fundos,
                datasets: [
                    {
                        label: 'Arándanos (kg)',
                        data: [400, 320, 280, 250],
                        backgroundColor: colors.arandanos.bg,
                        borderColor: colors.arandanos.border,
                        borderWidth: 1
                    },
                    {
                        label: 'Uvas (kg)',
                        data: [180, 150, 120, 100],
                        backgroundColor: colors.uvas.bg,
                        borderColor: colors.uvas.border,
                        borderWidth: 1
                    },
                    {
                        label: 'Espárragos (kg)',
                        data: [90, 80, 60, 50],
                        backgroundColor: colors.esparrago.bg,
                        borderColor: colors.esparrago.border,
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: { duration: 1200 },
                scales: { y: { beginAtZero: true } }
            }
        });
    }

    // ================================
    // 2️⃣ Variedades más exportadas (doughnut)
    // ================================
    const ctxVariedades = document.getElementById('chartVariedades');
    if(ctxVariedades){
        new Chart(ctxVariedades, {
            type: 'doughnut',
            data: {
                labels: ['Secoya', 'POP', 'Beauty', 'Red Globe'],
                datasets: [{
                    data: [250, 180, 300, 220],
                    backgroundColor: [
                        colors.arandanos.bg,
                        colors.arandanos.bg,
                        colors.arandanos.bg,
                        colors.uvas.bg
                    ],
                    borderColor: [
                        colors.arandanos.border,
                        colors.arandanos.border,
                        colors.arandanos.border,
                        colors.uvas.border
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position:'bottom' } }
            }
        });
    }

    // ================================
    // 3️⃣ Variedades orgánicas (doughnut)
    // ================================
    const ctxVarOrg = document.getElementById('chartVariedadesOrg');
    if(ctxVarOrg){
        new Chart(ctxVarOrg, {
            type: 'doughnut',
            data: {
                labels: ['Jack Salute', 'Sweet Orgánica'],
                datasets: [{
                    data: [120, 150],
                    backgroundColor: [colors.arandanos.bg, colors.uvas.bg],
                    borderColor: [colors.arandanos.border, colors.uvas.border],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position:'bottom' } }
            }
        });
    }

    // ================================
    // 4️⃣ Sanidad por fundo
    // ================================
    const ctxSanidad = document.getElementById('chartSanidad');
    if(ctxSanidad){
        new Chart(ctxSanidad, {
            type: 'bar',
            data: {
                labels: fundos,
                datasets: [{
                    label: 'Sanidad (%)',
                    data: [95, 90, 85, 92],
                    backgroundColor: [
                        colors.arandanos.bg,
                        colors.arandanos.bg,
                        colors.arandanos.bg,
                        colors.uvas.bg
                    ],
                    borderColor: [
                        colors.arandanos.border,
                        colors.arandanos.border,
                        colors.arandanos.border,
                        colors.uvas.border
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: { duration: 1200 },
                scales: { y: { beginAtZero: true, max: 100 } }
            }
        });
    }

    // ================================
    // 5️⃣ Cliente / país con mayor exportación
    // ================================
    const ctxClientes = document.getElementById('chartClientesPais');
    if(ctxClientes){
        new Chart(ctxClientes, {
            type: 'bar',
            data: {
                labels: ['EEUU', 'Países Bajos', 'Alemania', 'Canadá', 'China'],
                datasets: [{
                    label: 'Toneladas exportadas',
                    data: [220, 180, 150, 120, 90],
                    backgroundColor: [
                        colors.arandanos.bg,
                        colors.uvas.bg,
                        colors.esparrago.bg,
                        colors.uvas.bg,
                        colors.arandanos.bg
                    ],
                    borderColor: [
                        colors.arandanos.border,
                        colors.uvas.border,
                        colors.esparrago.border,
                        colors.uvas.border,
                        colors.arandanos.border
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: { duration: 1200 },
                scales: { y: { beginAtZero: true } }
            }
        });
    }

    // ================================
    // 6️⃣ Acidez y Brix de uva y arándano
    // ================================
    const ctxAcidezBrix = document.getElementById('chartAcidezBrix');
    if(ctxAcidezBrix){
        new Chart(ctxAcidezBrix, {
            type: 'bar',
            data: {
                labels: ['Arándano', 'Uva'],
                datasets: [
                    {
                        label: 'Acidez (%)',
                        data: [0.35, 0.42],
                        backgroundColor: [colors.arandanos.bg, colors.uvas.bg],
                        borderColor: [colors.arandanos.border, colors.uvas.border],
                        borderWidth: 1
                    },
                    {
                        label: 'Brix (%)',
                        data: [12, 15],
                        backgroundColor: [colors.arandanos.bg, colors.uvas.bg],
                        borderColor: [colors.arandanos.border, colors.uvas.border],
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: { duration: 1200 },
                scales: { y: { beginAtZero: true } }
            }
        });
    }

})();
