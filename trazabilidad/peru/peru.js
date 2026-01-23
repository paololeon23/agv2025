(() => {
    const peDataMaster = {
        year: { "1": "2021", "2": "2022", "3": "2023", "4": "2024", "5": "2025", "6": "2026", "7": "2027", "8": "2028", "9": "2029" },
        country: { "A": "PERÚ", "I": "CHILE" },
        packing: {
            "49": "PROCESADORA TORRE BLANCA S.A.",
            "50": "PACKING DEL CARMEN S.A.C.",
            "51": "PROCESADORA DEL FRIO S.A.C.",
            "18": "BROOM FRIO HOLDING MORROPE"
        },
        grower: {
            "A": "AGRICOLA CRIZOL S.A.C.",
            "B": "AGRICOLA SAN PABLO S.A.C.",
            "C": "SUR NATURAL S.A.C.",
            "D": "CULTIVOS ORGANICOS SAC",
            "E": "MAZUCCELLI",
            "F": "FUNDO LAS LOMAS S.A.C.",
            "G": "INVERSIONES YARABAMBA S.A.C.",
            "H": "INKAS BERRIES S.A.C.",
            "I": "AGROEXTIENDE"
        },
        crop: { "1": "BLUEBERRY (ARÁNDANO)", "A": "CHERRY (CEREZA)" },
        variety: {
            "01": "VENTURA", "02": "EMERALD", "12": "JUPITER BLUE", "13": "BIANCA BLUE", "14": "ATLAS BLUE",
            "16": "SEKOYA BEAUTY", "17": "KIRRA", "18": "SEKOYA POP", "19": "ARANA", "20": "STELLA BLUE",
            "B8": "SEKOYA FIESTA"
        }
    };

    const getPeJulianDate = (dayNum, year) => {
        const date = new Date(year, 0); 
        date.setDate(dayNum);
        return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'long' }).toUpperCase();
    };

    const peInput = document.getElementById('pe-traceInput');
    const peBtnProcess = document.getElementById('pe-btnProcess');
    const peBtnClear = document.getElementById('pe-btnClearTrace');
    const peDetailsBox = document.getElementById('pe-detailsBox');

    const processPeCode = () => {
        const val = peInput.value.trim().toUpperCase();

        if (val.length < 13) {
            Swal.fire({
                icon: "warning",
                title: "Código Perú Incompleto",
                text: "Ingrese los 13 caracteres reglamentarios.",
                timer: 2000,
                showConfirmButton: false,
                toast: true,
                position: 'top-end'
            });
            return;
        }

        const p = {
            y: val.substring(0, 1), c: val.substring(1, 2), pk: val.substring(2, 4),
            g: val.substring(4, 5), s: val.substring(5, 7), cr: val.substring(7, 8),
            v: val.substring(8, 10), j: val.substring(10, 13)
        };

        // Pintar Cuadritos
        document.getElementById('pe-val-year').textContent = p.y;
        document.getElementById('pe-val-country').textContent = p.c;
        document.getElementById('pe-val-packing').textContent = p.pk;
        document.getElementById('pe-val-grower').textContent = p.g;
        document.getElementById('pe-val-sector').textContent = p.s;
        document.getElementById('pe-val-crop').textContent = p.cr;
        document.getElementById('pe-val-variety').textContent = p.v;
        document.getElementById('pe-val-julian').textContent = p.j;

        const fullYear = peDataMaster.year[p.y] || "---";
        const varietyKey = (p.cr === "A") ? "C" + p.v : p.v;

        // Pintar Detalles
        document.getElementById('pe-det-year').innerText = fullYear;
        document.getElementById('pe-det-country').innerText = peDataMaster.country[p.c] || "PERÚ";
        document.getElementById('pe-det-packing').innerText = peDataMaster.packing[p.pk] || "DESCONOCIDO";
        document.getElementById('pe-det-grower').innerText = peDataMaster.grower[p.g] || "DESCONOCIDO";
        document.getElementById('pe-det-sector').innerText = "SECTOR " + p.s;
        document.getElementById('pe-det-crop').innerText = peDataMaster.crop[p.cr] || "DESCONOCIDO";
        document.getElementById('pe-det-variety').innerText = peDataMaster.variety[varietyKey] || "DESCONOCIDA";
        document.getElementById('pe-det-julian').innerText = `${p.j} (${getPeJulianDate(parseInt(p.j), parseInt(fullYear))})`;

        peDetailsBox.style.display = "block";

        Swal.fire({
            icon: "success",
            title: "Procesado Perú",
            text: "Datos de origen Perú actualizados.",
            timer: 1500,
            showConfirmButton: false,
            toast: true,
            position: 'top-end'
        });
    };

    peBtnProcess.addEventListener('click', processPeCode);
    peInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') processPeCode(); });
    
    peBtnClear.addEventListener('click', () => {
        peInput.value = "";
        document.querySelectorAll('.pe-val').forEach(box => box.textContent = "-");
        peDetailsBox.style.display = "none";

        Swal.fire({
            icon: "success",
            title: "Limpieza completa",
            text: "Módulo Perú reseteado correctamente.",
            timer: 1500,
            showConfirmButton: false,
            toast: true,
            position: 'top-end'
        });
    });
})();