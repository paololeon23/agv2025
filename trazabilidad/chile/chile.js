(() => {
    // DATA COMPLETA EXTRAÍDA DE TUS IMÁGENES (SIN RECORTES)
    const dataMaster = {
        year: { "1": "2021", "2": "2022", "3": "2023", "4": "2024", "5": "2025", "6": "2026", "7": "2027", "8": "2028", "9": "2029" },
        country: { "I": "CHILE", "A": "PERU" },
        packing: {
            "18": "BROOM FRIO HOLDING MORROPE", "26": "FRUTOS LA AGUADA S.A.", "29": "SOUTH ORGANIC FRUIT S.A.",
            "30": "TRUCAO SERVICE SPA", "44": "PACKING SAN JAVIER S.A.", "49": "PROCESADORA TORRE BLANCA S.A.",
            "50": "PACKING DEL CARMEN S.A.C.", "51": "PROCESADORA DEL FRIO S.A.C.", "55": "ZURGROUP SERVICE SPA"
        },
        grower: {
            "A": "AGRICOLA CRIZOL S.A.C.", "B": "AGRICOLA SAN PABLO S.A.C.", "C": "SUR NATURAL S.A.C.",
            "D": "CULTIVOS ORGANICOS SAC", "E": "MAZUCCELLI", "F": "FUNDO LAS LOMAS S.A.C.",
            "G": "INVERSIONES YARABAMBA S.A.C.", "H": "INKAS BERRIES S.A.C.", "I": "AGROEXTIENDE",
            "J": "RVR AGRO S.R.L.", "K": "AGRICOLA ALPAMAYO S.A.", "L": "ICA BLUEBERRIES SAC",
            "M": "CONSORCIO DE PRODUCTORES DE FRUTA S.A.", "N": "AGRICOLA LOS ARANDANOS DE JUNQUILLO LTDA",
            "O": "AGRICOLA LOS BRONCES DE CAUQUENES LTDA", "P": "SOCIEDAD AGRICOLA LOS ARANDANO LTDA",
            "Q": "AGRICOLA TRUCAO S.A.", "R": "AGRICOLA HUERTO LA BRISA SPA", "S": "AGRICOLA CENTRO-SUR SPA",
            "T": "AGRICOLA DIGUILLIN LTDA", "U": "AGRICOLA SANTA JOSEFINA SPA", "V": "CARLOS MENDEZ CADIZ",
            "W": "COMERCIALIZADORA DON GERMAN SPA", "X": "SOCIEDAD AGRICOLA Y GANADERA PUQUELAHUE LTDA",
            "Y": "SOCIEDAD FRUTICOLA ALCADA LTDA", "Z": "AGROINDUSTRIAL VALLE FRIO S.A.", "0": "FRUTOS LA AGUADA S.A.",
            "1": "SOCIEDAD AGRICOLA CATO S.A.", "2": "ALVARO GATICA PEREZ", "3": "JOSE IGNACIO LEON VELILLA",
            "4": "AGRICOLA FORESTAL Y GANADERA LOS AROMOS LTDA", "5": "AGRICOLA LOS HUALLES LTDA",
            "6": "ROLANDO LEON VELILLA", "7": "SUCESION ANA MERCEDES RODRIGUEZ ACUÑA",
            "8": "JOSE MANUEL MONTECINOS PIÑA", "9": "FUNDO SAN SEBASTIAN", "@": "FUNDO VILLA ESTELA", "$": "PARCELA MAITENES 6"
        },
        crop: { "1": "BLUEBERRY (ARÁNDANO)", "A": "CHERRY (CEREZA)" },
        variety: {
            "01": "VENTURA", "02": "EMERALD", "12": "JUPITER BLUE", "13": "BIANCA BLUE", "14": "ATLAS BLUE",
            "16": "SEKOYA BEAUTY", "17": "KIRRA", "18": "SEKOYA POP", "19": "ARANA", "20": "STELLA BLUE",
            "59": "DRAPER", "60": "SEKOYA CRUNCH", "61": "SEKOYA GRANDE", "71": "AURORA", "72": "BLUECROP",
            "73": "BLUE GOLD", "74": "BLUE RIBBON", "75": "BRIGITTA", "76": "BRIGHTWELL", "77": "CAMELIA",
            "78": "CARGO", "79": "CIELO", "80": "COOPER", "81": "CORONA", "82": "DAYBREAK", "83": "DAZZLE",
            "84": "DUKE", "85": "ECHO", "86": "ELLIOT", "87": "EUREKA", "88": "EUREKA SUNRISE", "89": "EUREKA SUNSET",
            "90": "FIRST BLUSH", "91": "INITIO", "92": "JEWELL", "93": "LEGACY", "94": "LIBERTY", "95": "MASENA",
            "96": "MISTY", "97": "OCHLOCKONEE", "98": "ONEAL", "99": "OZARKBLUE", "A0": "PEACH BLUE",
            "A1": "POWDER BLUE", "A2": "ROBUST", "A3": "ROCIO", "A4": "STAR", "A5": "SUZI BLUE", "A6": "TIFBLUE",
            "A7": "TOP SHELF", "A8": "TWILIGHT", "A9": "VIOLETA", "B2": "APOLO", "B3": "DUKE RED", "B4": "RIDLEY",
            "B5": "RIDLEY 1812", "B6": "RIDLEY 4507", "B7": "RIDLEY 4514", "B8": "SEKOYA FIESTA", "C5": "MATIAS",
            "C6": "ABRIL", "C7": "ALESSIA", "C8": "EMERALD ORGANICO",
            "C01": "I+D", "C02": "LAPINS", "C03": "REGINA", "C04": "SANTINA", "C05": "FINAL 12.1", "C06": "FINAL 13.1",
            "C07": "SONATA", "C08": "BING", "C09": "SWEETHEART", "C10": "KORDIA", "C11": "SKEENA", "C12": "VAN",
            "C13": "ROYAL DAWN", "C14": "SYMPHONY", "C15": "RAINIER"
        }
    };

    // Helper: Convertir Día Juliano a Fecha legible
    const getJulianDate = (dayNum, year) => {
        const date = new Date(year, 0); 
        date.setDate(dayNum);
        const opciones = { day: '2-digit', month: 'long' };
        return date.toLocaleDateString('es-ES', opciones).toUpperCase();
    };

    const input = document.getElementById('traceInput');
    const btnProcess = document.getElementById('btnProcess');
    const btnClear = document.getElementById('btnClearTrace');
    const detailsBox = document.getElementById('detailsBox');

    const processCode = () => {
        const val = input.value.trim().toUpperCase();

        if (val.length < 13) {
            Swal.fire({
                icon: "warning",
                title: "Código incompleto",
                text: "El código debe tener exactamente 13 caracteres.",
                timer: 2000,
                showConfirmButton: false,
                toast: true,
                position: 'top-end'
            });
            return;
        }

        const parts = {
            year: val.substring(0, 1),
            country: val.substring(1, 2),
            packing: val.substring(2, 4),
            grower: val.substring(4, 5),
            sector: val.substring(5, 7),
            crop: val.substring(7, 8),
            variety: val.substring(8, 10),
            julian: val.substring(10, 13)
        };

        // 1. Asignar a cuadritos
        document.getElementById('val-year').textContent = parts.year;
        document.getElementById('val-country').textContent = parts.country;
        document.getElementById('val-packing').textContent = parts.packing;
        document.getElementById('val-grower').textContent = parts.grower;
        document.getElementById('val-sector').textContent = parts.sector;
        document.getElementById('val-crop').textContent = parts.crop;
        document.getElementById('val-variety').textContent = parts.variety;
        document.getElementById('val-julian').textContent = parts.julian;

        // 2. Obtener Traducciones
        const fullYear = dataMaster.year[parts.year] || "---";
        const varietyKey = (parts.crop === "A") ? "C" + parts.variety : parts.variety;
        const julianLabel = getJulianDate(parseInt(parts.julian), parseInt(fullYear));

        // 3. Llenar cuadro de detalles
        document.getElementById('det-year').innerText = fullYear;
        document.getElementById('det-country').innerText = dataMaster.country[parts.country] || "DESCONOCIDO";
        document.getElementById('det-packing').innerText = dataMaster.packing[parts.packing] || "NO REGISTRADO";
        document.getElementById('det-grower').innerText = dataMaster.grower[parts.grower] || "NO REGISTRADO";
        document.getElementById('det-sector').innerText = "SECTOR " + parts.sector;
        document.getElementById('det-crop').innerText = dataMaster.crop[parts.crop] || "DESCONOCIDO";
        document.getElementById('det-variety').innerText = dataMaster.variety[varietyKey] || "DESCONOCIDA";
        document.getElementById('det-julian').innerText = `${parts.julian} (${julianLabel})`;

        // Mostrar detalles
        if(detailsBox) detailsBox.style.display = "block";

        Swal.fire({
            icon: "success",
            title: "Código procesado",
            text: "Desglose de trazabilidad generado correctamente.",
            timer: 1500,
            showConfirmButton: false,
            toast: true,
            position: 'top-end'
        });
    };

    btnProcess.addEventListener('click', processCode);
    input.addEventListener('keypress', (e) => { if (e.key === 'Enter') processCode(); });
    
    btnClear.addEventListener('click', () => {
        input.value = "";
        document.querySelectorAll('.box-value').forEach(box => box.textContent = "-");
        if(detailsBox) detailsBox.style.display = "none";

        Swal.fire({
            icon: "success",
            title: "Limpieza completa",
            text: "El módulo de trazabilidad se limpió correctamente.",
            timer: 1500,
            showConfirmButton: false,
            toast: true,
            position: 'top-end'
        });
    });

})();