document.addEventListener("DOMContentLoaded", () => {

    const menuItems = document.querySelectorAll(".menu-item");
    const subItems = document.querySelectorAll(".submenu-item");
    const contentArea = document.querySelector(".dynamic-content");
    const pageTitleDiv = document.querySelector(".page-title"); // título dinámico

    // ====================================================================
    // CONFIGURACIÓN CENTRAL DE PÁGINAS
    // ====================================================================
    const PAGES = {
        inicio: {
            html: "inicio/inicio.html",
            js: "inicio/inicio.js",
            title: "Agrovision Perú"
        },
        columnas: {
            html: "columnas/definicion.html",
            js: "columnas/app.js",
            title: "Ordenar Columnas"
        },
        revisar: {
            html: "revisar/revisar.html",
            js: "revisar/revisar.js",
            title: "Revision"
        },
        mpuva: {
            html: "uva/uva.html",
            js: "uva/uva.js",
            title: "Materia Prima Uva"
        },
        ptuva: {
            html: "uva/ptuva/ptuva.html",
            js: "uva/ptuva/ptuva.js",
            title: "Producto Terminado Uva"
        },
        plagasuva: {
            html: "uva/plagasuva/plagasuva.html",
            js: "uva/plagasuva/plagasuva.js",
            title: "Plagas Uva"
        },
        fqouva: {
            html: "uva/fqouva/fqouva.html",
            js: "uva/fqouva/fqouva.js",
            title: "Fisico Quimicos de Uva"
        },
        mparandano: {
            html: "arandano/arandano.html",
            js: "arandano/arandano.js",
            title: "Materia Prima Arándano"
        },
        plagasarandano: {
            html: "arandano/plagas-arandano/plagas-arandano.html",
            js: "arandano/plagas-arandano/plagas-arandano.js",
            title: "Plagas Arándano"
        },
        ptarandano: {
            html: "arandano/pt-arandano/pt-arandano.html",
            js: "arandano/pt-arandano/pt-arandano.js",
            title: "Producto Terminado Arándano"
        },
        firmproarandano: {
            html: "arandano/firmpro/firmpro.html",
            js: "arandano/firmpro/firmpro.js",
            title: "Firmpro Arándano"
        },
        mpesparrago: {
            html: "esparrago/esparrago.html",
            js: "esparrago/esparrago.js",
            title: "Materia Prima Espárrago"
        },
        ptesparrago: {
            html: "esparrago/pt-esparrago/pt-esparrago.html",
            js: "esparrago/pt-esparrago/pt-esparrago.js",
            title: "Producto Terminado Espárrago"
        },
        plagasesparrago: {
            html: "esparrago/plagas-esparrago/plagas-esparrago.html",
            js: "esparrago/plagas-esparrago/plagas-esparrago.js",
            title: "Plagas Espárrago"
        },
        agvchile: {
            html: "trazabilidad/chile/chile.html",
            js: "trazabilidad/chile/chile.js",
            title: "Trazabilidad Chile"
        },
        agvperu: {
            html: "trazabilidad/peru/peru.html",
            js: "trazabilidad/peru/peru.js",
            title: "Trazabilidad Perú"
        },
        chilecartilla: {
            html: "trazabilidad/cartilla/cartilla.html",
            js: "trazabilidad/cartilla/cartilla.js",
            title: "Cartillas Chile"
        }


    };

    // ====================================================================
    // LIMPIAR SCRIPTS DINÁMICOS
    // ====================================================================
    function removeDynamicScripts() {
        document.querySelectorAll("script[data-dynamic]").forEach(s => s.remove());
    }

    // 2. Modifica la carga inicial al final del archivo:
    function initApp() {
        const currentHash = location.hash.replace("#/", "");
        
        if (!currentHash || currentHash === "") {
            // Si no hay hash, forzamos inicio y el menú ya estará abierto por el HTML
            location.hash = "#/inicio"; 
            loadPage("inicio");
            highlightMenu("inicio");
        } else {
            // Si ya hay un hash (por un reload), la función lo cargará y expandirá el menú correspondiente
            loadFromHash();
        }
    }

    initApp();

    // ====================================================================
// LÓGICA DEL BUSCADOR
// ====================================================================
const searchInput = document.querySelector('.search-box input');
const allMenuItems = document.querySelectorAll('.menu-item');
const allSubmenuItems = document.querySelectorAll('.submenu-item');

searchInput.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase().trim();

    // 1. Filtrar Submenu Items
    allSubmenuItems.forEach(sub => {
        const text = sub.textContent.toLowerCase();
        const isMatch = text.includes(term);
        sub.style.display = isMatch ? "flex" : "none";
    });

    // 2. Filtrar Menu Items Principales
    allMenuItems.forEach(item => {
        const text = item.querySelector('span').textContent.toLowerCase();
        const isParentMatch = text.includes(term);
        
        // Verificar si es un padre y si alguno de sus hijos coincide
        const hasVisibleChildren = item.classList.contains('has-submenu') && 
            Array.from(item.nextElementSibling.querySelectorAll('.submenu-item'))
                 .some(sub => sub.style.display !== "none");

        if (isParentMatch || hasVisibleChildren) {
            item.style.display = "flex";
            
            // Si hay coincidencia en hijos, expandir el menú automáticamente
            if (hasVisibleChildren && term !== "") {
                item.nextElementSibling.classList.add('active-submenu');
                const arrow = item.querySelector('.submenu-arrow');
                if (arrow) {
                    arrow.classList.remove('fa-chevron-right');
                    arrow.classList.add('fa-chevron-down');
                }
            }
        } else {
            item.style.display = "none";
            // Ocultar el submenu si el padre no es visible
            if (item.classList.contains('has-submenu')) {
                item.nextElementSibling.classList.remove('active-submenu');
            }
        }

        // Si el buscador se limpia, restauramos el estado (cerramos submenús no activos)
        if (term === "") {
            // Aquí puedes llamar a tu función de highlight actual para restaurar
            const currentKey = location.hash.replace("#/", "");
            highlightMenu(currentKey);
        }
    });
});

    // ====================================================================
    // FUNCIÓN PARA CARGAR HTML + JS
    // ====================================================================
    async function loadPage(pageName) {
        const page = PAGES[pageName];

        // actualizar título
        pageTitleDiv.textContent = page?.title || "En Construcción";

        if (!page) {
            contentArea.innerHTML = `
                <div style="padding:25px;">
                    <h2 style="color:#333; margin-bottom:10px;">🚧 En Construcción</h2>
                    <p style="font-size:16px; color:#555;">
                        Se está trabajando en esta sección.
                    </p>
                </div>
            `;
            removeDynamicScripts();
            return;
        }

        // 1️⃣ Cargar HTML
        try {
            const res = await fetch(page.html);
            if (!res.ok) throw new Error("No se pudo cargar el HTML");
            const html = await res.text();
            contentArea.innerHTML = html;
        } catch (err) {
            contentArea.innerHTML = `
                <div style="padding:20px;">
                    <h2>Error cargando ${pageName}</h2>
                    <p>${err.message}</p>
                </div>
            `;
            console.error(err);
            return;
        }

        // 2️⃣ Cargar JS dinámico
        removeDynamicScripts();

        if (page.js) {
            const script = document.createElement("script");
            script.src = `${page.js}?v=${Date.now()}`;
            script.dataset.dynamic = "true";
            document.body.appendChild(script);
        }
    }

    // ====================================================================
    // FUNCIONES DE MENÚ
    // ====================================================================
function highlightMenu(key) {

    // 1️⃣ Reset total
    menuItems.forEach(m => m.classList.remove("active"));
    subItems.forEach(s => s.classList.remove("active"));

    document.querySelectorAll(".submenu").forEach(sm => {
        sm.classList.remove("active-submenu");
    });

    document.querySelectorAll(".submenu-arrow").forEach(ar => {
        ar.classList.remove("fa-chevron-down");
        ar.classList.add("fa-chevron-right");
    });

    // 2️⃣ Item normal
    const mainItem = document.querySelector(`.menu-item[data-content="${key}"]`);
    if (mainItem) {
        mainItem.classList.add("active");
        return;
    }

    // 3️⃣ SubItem
    const subItem = document.querySelector(`.submenu-item[data-content="${key}"]`);
    if (!subItem) return;

    subItem.classList.add("active");

    // 4️⃣ Padre + submenu
    const submenu = subItem.closest(".submenu");
    const parent = submenu?.previousElementSibling;

    if (parent) parent.classList.add("active");
    if (submenu) submenu.classList.add("active-submenu");

    // 5️⃣ Flecha
    const arrow = parent?.querySelector(".submenu-arrow");
    if (arrow) {
        arrow.classList.remove("fa-chevron-right");
        arrow.classList.add("fa-chevron-down");
    }
}


    // ====================================================================
    // TOGGLE SUBMENÚ + CLICK MENÚ PRINCIPAL
    // ====================================================================
menuItems.forEach(item => {
    item.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();

        const key = item.getAttribute("data-content");
        if (!key) return;

        const isSubmenuParent = item.classList.contains("has-submenu");
        const submenu = item.nextElementSibling;

        // ============================================================
        // CASE 1: El item está dentro del submenu (submenu-item)
        // ============================================================
        if (!isSubmenuParent && item.classList.contains("submenu-item")) {

            // Quitar activos
            menuItems.forEach(i => i.classList.remove("active"));
            document.querySelectorAll(".submenu").forEach(s => s.classList.remove("active-submenu"));
            document.querySelectorAll(".submenu-arrow").forEach(ar => {
                ar.classList.remove("fa-chevron-down");
                ar.classList.add("fa-chevron-right");
            });

            // Activar subItem
            item.classList.add("active");

            // Activar su padre
            const parent = item.closest(".submenu")?.previousElementSibling;
            if (parent) parent.classList.add("active");

            // Abrir submenu del padre
            const submenuParent = item.closest(".submenu");
            const arrow = parent?.querySelector(".submenu-arrow");

            submenuParent.classList.add("active-submenu");

            if (arrow) {
                arrow.classList.remove("fa-chevron-right");
                arrow.classList.add("fa-chevron-down");
            }

        }
        // ============================================================
        // CASE 2: Click en item padre (has-submenu)
        // ============================================================
        else if (isSubmenuParent) {

            const isOpen = submenu.classList.contains("active-submenu");

            // Primero cerramos TODO
            menuItems.forEach(i => i.classList.remove("active"));
            document.querySelectorAll(".submenu").forEach(s => s.classList.remove("active-submenu"));
            document.querySelectorAll(".submenu-arrow").forEach(ar => {
                ar.classList.remove("fa-chevron-down");
                ar.classList.add("fa-chevron-right");
            });

            // Si estaba abierto → lo cerramos solamente
            if (!isOpen) {
                item.classList.add("active");
                submenu.classList.add("active-submenu");

                const arrow = item.querySelector(".submenu-arrow");
                if (arrow) {
                    arrow.classList.remove("fa-chevron-right");
                    arrow.classList.add("fa-chevron-down");
                }
            }
        }
        // ============================================================
        // CASE 3: Item normal sin submenu
        // ============================================================
        else {
            menuItems.forEach(i => i.classList.remove("active"));
            document.querySelectorAll(".submenu").forEach(s => s.classList.remove("active-submenu"));
            document.querySelectorAll(".submenu-arrow").forEach(ar => {
                ar.classList.remove("fa-chevron-down");
                ar.classList.add("fa-chevron-right");
            });

            item.classList.add("active");
        }

        // Cambiar hash → solo si NO es submenu padre
        if (!isSubmenuParent) {
            location.hash = `#/${key}`;
        }
    });
});


    // ====================================================================
    // CLICK SUBMENÚ
    // ====================================================================
    subItems.forEach(sub => {
        sub.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();

            const key = sub.getAttribute("data-content");
            if (!key) return;

            highlightMenu(key);

            // actualizar hash → esto dispara loadFromHash
            location.hash = `#/${key}`;
        });
    });

    // ====================================================================
    // CARGAR DESDE HASH
    // ====================================================================
    function loadFromHash() {
        const hash = location.hash.replace("#/", "");
        if (!hash) return;

        highlightMenu(hash);
        loadPage(hash);
    }

    window.addEventListener("hashchange", loadFromHash);

    // Carga inicial
    if (!location.hash || location.hash === "#/") {
        location.hash = "#/inicio";
    } else {
        loadFromHash();
    }

const jCard = document.getElementById("jooleanoCard");

let lastDay = null;

function updateJooleanoCard() {
    const today = new Date();
    const dia = today.getDate();
    const mes = String(today.getMonth() + 1).padStart(2, "0");
    const anio = today.getFullYear();

    const jooleano = String(dia).padStart(3, "0");

    // Solo actualizamos si cambió el día
    if (dia !== lastDay) {
        jCard.textContent = `${dia}/${mes}/${anio}  - Juliano = ${jooleano}`;
        lastDay = dia;
    }
}

// Actualizar al cargar
updateJooleanoCard();

// Revisar cada minuto si cambió el día
setInterval(updateJooleanoCard, 60000);

    
});
