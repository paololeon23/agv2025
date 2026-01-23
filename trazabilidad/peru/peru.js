(() => {
    const peDataMaster = {
        year: { "1": "2021", "2": "2022", "3": "2023", "4": "2024", "5": "2025", "6": "2026", "7": "2027", "8": "2028", "9": "2029" },
        country: { "A": "PERÚ", "I": "CHILE" },
        packing: {
            "01": "AGROVISION PACKING GRANDE",
            "02": "AGROVISION PACKING ESPARRAGO",
            "03": "AGROVISION PACKING A9 (CHICO)",
            "04": "FRUSAN",
            "05": "FRUTOSA",
            "06": "AIB",
            "07": "EMERGENT COLD",
            "08": "GREENWAY",
            "09": "PHOENIX FOODS",
            "10": "AGRO EMPAQUES",
            "11": "IPAFRUT (EMPACADORA DE FRUTOS TROPICALES)",
            "16": "EL PARQUE",
            "18": "BROOM FRIO HOLDING MORROPE",
            "21": "HFE BERRIES PERU",
            "48": "AQU ANQA"
        },
        grower: {
            "A": "AGROVISION PERU S.A.C.",
            "B": "INVERSIONES HEFEI S.A.C.",
            "C": "ARENA VERDE S.A.C.-LOTE CENTRO",
            "D": "DANPER TRUJILLO S.A.C.",
            "E": "ARENA VERDE S.A.C.-LOTE NORTE",
            "F": "FRUSAN AGRO S.A.C.",
            "G": "ARENA VERDE S.A.C.-SAN RICARDO",
            "H": "AGRICOLA CHAPI S.A./CORPORACION AGRICOLA OLMOS S.A.",
            "I": "AGROINDUSTRIAS AIB S.A",
            "J": "PLANTACIONES DEL SOL S.A.C",
            "K": "INVERSIONES MOSQUETA S.A.C.",
            "L": "BOMAREA S.R.L.",
            "M": "INVERSIONES PIRONA S.A.C.",
            "N": "AGRICOLA PAMPA BAJA S.A.C.",
            "O": "AGRO NORTE CORP S.A.C.",
            "P": "EXPORTADORA EL PARQUE PERU SAC",
            "Q": "BERRY HARVEST S.A",
            "R": "GREENWAY S.A.",
            "S": "PROCESOS AGROINDUSTRIALES S.A.",
            "T": "AQU ANQA S.A.C."
        },
        crop: {
            "1": "BLUEBERRY",
            "2": "ASPARAGUS",
            "3": "GRAPES",
            "4": "AVOCADO",
            "5": "LEMON",
            "6": "PITAHAYE",
            "7": "KAKI",
            "8": "RASPBERRY",
            "9": "BLACKBERRY",
            "A": "CHERRY",
            "B": "AGUAYMANTO",
            "C": "MACADAMIA"
        },
        variety: {
            "01": "VENTURA",
            "02": "EMERALD",
            "03": "BILOXI",
            "04": "SPRINGHIGH",
            "05": "SNOWCHASER",
            "06": "MÁGICA",
            "07": "BELLA",
            "08": "BONITA",
            "09": "JULIETA",
            "10": "ZILA",
            "11": "MAGNIFICA",
            "12": "JUPITER BLUE",
            "13": "BIANCA BLUE",
            "14": "ATLAS BLUE",
            "15": "BILOXI ORGÁNICO",
            "16": "SEKOYA BEAUTY",
            "17": "KIRRA",
            "18": "SEKOYA POP",
            "19": "ARANA",
            "20": "STELLA BLUE",
            "21": "TERRAPIN",
            "22": "PLA BLUE-MALIBU",
            "23": "PLA BLUE-MADEIRA",
            "24": "PLA BLUE-MASIRAH",
            "25": "MIXTO",
            "26": "ROSITA",
            "27": "ATLAS BLUE ORGÁNICO",
            "28": "ARANA ORGÁNICO",
            "29": "STELLA BLUE ORGÁNICO",
            "30": "KIRRA ORGÁNICO",
            "31": "REGINA",
            "32": "I+D",
            "33": "MAGNUS",
            "34": "RAYMI ORGÁNICO",
            "35": "MANILA",
            "36": "FCM17-132",
            "37": "FCM15-005",
            "38": "FCM15-003",
            "39": "COLOSUS",
            "40": "FCM14-057",
            "41": "AZRA",
            "42": "RAVEN",
            "43": "AVANTI",
            "44": "MERLIAH",
            "45": "RAYMI",
            "46": "PATRECIA",
            "47": "WAYNE",
            "48": "BOBOLINK",
            "49": "SEKOYA POP ORGÁNICA",
            "50": "ROSITA ORGÁNICA",
            "51": "MEGAONE",
            "52": "KEECRISP",
            "53": "MEGACRISP",
            "54": "MEGAEARLY",
            "55": "MEGAGEM",
            "56": "MEGAGRAND",
            "57": "MEGASTAR",
            "58": "VENTURA ORGÁNICO",
            "62": "FCM15-000",
            "63": "FCM15-010",
            "64": "FCM-17010",
            "65": "VALENTINA",
            "67": "ALBUS (FL 11-051)",
            "68": "FALCO (FL 17-141)",
            "69": "FL-11-158",
            "70": "FL-10-179",
            "B8": "SEKOYA FIESTA",
            "B9": "FL 19-006",
            "C0": "FCE15-087",
            "C1": "FCE18-012",
            "C2": "FCE18-015",
            "C3": "FL09-279",
            "C4": "FL12-236"
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