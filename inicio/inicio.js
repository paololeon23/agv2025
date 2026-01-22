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

    // ================================
// 1️⃣ Producción por cultivo (Líneas)
// ================================
const ctxProduccionCultivo = document.getElementById('chartProduccionCultivo');
if(ctxProduccionCultivo){
    new Chart(ctxProduccionCultivo, {
        type: 'line',
        data: {
            labels: ['Arándano', 'Uva', 'Espárrago'],
            datasets: [{
                label: 'Producción (Ton)',
                data: [1280, 670, 90], // tus datos de ejemplo
                backgroundColor: 'rgba(106, 90, 205, 0.2)', // relleno suave
                borderColor: 'rgba(90, 77, 179, 1)',        // línea
                borderWidth: 2,
                fill: true,
                tension: 0.3,  // suaviza la curva
                pointBackgroundColor: [
                    'rgba(106, 90, 205, 1)',
                    'rgba(34, 153, 84, 1)',
                    'rgba(255, 193, 7, 1)'
                ],
                pointRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Toneladas'
                    }
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + context.raw.toLocaleString() + ' Ton';
                        }
                    }
                }
            }
        }
    });
}


    const fundos = ['A9','C5','C6','LN'];
    // ================================
    // 1️⃣ Total de variedades registradas por cultivo
    // ================================
    const ctxVariedadesTotales = document.getElementById('chartVariedadesTotales');
    if(ctxVariedadesTotales){
        new Chart(ctxVariedadesTotales, {
            type: 'bar',
            data: {
                labels: ['Arándano', 'Uva', 'Espárrago'],
                datasets: [{
                    label: 'Variedades registradas',
                    data: [60, 21, 2], // de tu data real
                    backgroundColor: [colors.arandanos.bg, colors.uvas.bg, colors.esparrago.bg],
                    borderColor: [colors.arandanos.border, colors.uvas.border, colors.esparrago.border],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true } }
            }
        });
    }

    // ================================
    // 2️⃣ Orgánico vs Convencional (Arándano)
    // ================================
    const ctxOrganico = document.getElementById('chartOrganico');
    if(ctxOrganico){
        new Chart(ctxOrganico, {
            type: 'doughnut',
            data: {
                labels: ['Convencional', 'Orgánico'],
                datasets: [{
                    data: [51, 9], // de tu data real
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
    // 3️⃣ Uso de líneas de proceso
    // ================================
    const ctxLineas = document.getElementById('chartLineas');
    if(ctxLineas){
        new Chart(ctxLineas, {
            type: 'bar',
            data: {
                labels: [
                    'Arándano BERRY PRO',
                    'HAND PACK',
                    'BULK',
                    'UVA LINEA 1-4',
                    'ESPARRAGO LINEA 1-4'
                ],
                datasets: [{
                    label: 'Líneas activas',
                    data: [10, 8, 6, 4, 4], // ejemplo basado en tu data
                    backgroundColor: [
                        colors.arandanos.bg,
                        colors.arandanos.bg,
                        colors.arandanos.bg,
                        colors.uvas.bg,
                        colors.esparrago.bg
                    ],
                    borderColor: [
                        colors.arandanos.border,
                        colors.arandanos.border,
                        colors.arandanos.border,
                        colors.uvas.border,
                        colors.esparrago.border
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: { y: { beginAtZero: true } }
            }
        });
    }

    // ================================
    // 4️⃣ Distribución de calibres (Arándano)
    // ================================
    const ctxCalibres = document.getElementById('chartCalibres');
    if(ctxCalibres){
        new Chart(ctxCalibres, {
            type: 'bar',
            data: {
                labels: ['+12mm','+14mm','+16mm','+18mm','Jumbo','Super Jumbo','Mixto'],
                datasets: [{
                    label: 'Cantidad de calibres',
                    data: [10,8,6,4,2,2,5], // ejemplo basado en tu data
                    backgroundColor: colors.arandanos.bg,
                    borderColor: colors.arandanos.border,
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: { y: { beginAtZero: true } }
            }
        });
    }

    // ================================
    // 5️⃣ Lotes registrados por tipo
    // ================================
    const ctxLotes = document.getElementById('chartLotes');
    if(ctxLotes){
        new Chart(ctxLotes, {
            type: 'bar',
            data: {
                labels: ['Individual', 'Consolidado', 'Producto terminado'],
                datasets: [{
                    label: 'Cantidad de lotes',
                    data: [36, 15, 20], // ejemplo basado en tu data
                    backgroundColor: [colors.arandanos.bg, colors.uvas.bg, colors.esparrago.bg],
                    borderColor: [colors.arandanos.border, colors.uvas.border, colors.esparrago.border],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: { y: { beginAtZero: true } }
            }
        });
    }

})();
