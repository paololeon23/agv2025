document.addEventListener("DOMContentLoaded", () => {

    const menuItems = document.querySelectorAll(".menu-item");
    const subItems = document.querySelectorAll(".submenu-item");
    const contentArea = document.querySelector(".dynamic-content");

    // ============================================================================
    // CONFIGURACIÓN CENTRAL DE PÁGINAS
    // ============================================================================
    const PAGES = {
        inicio: {
            html: "inicio/inicio.html",
            js: "inicio/inicio.js"
        },
        columnas: {
            html: "columnas/definicion.html",
            js: "columnas/app.js"
        }
        // Aquí agregarás más módulos
    };

    // ============================================================================
    // LIMPIAR SCRIPTS DINÁMICOS
    // ============================================================================
    function removeDynamicScripts() {
        document.querySelectorAll("script[data-dynamic]").forEach(s => s.remove());
    }

    // ============================================================================
    // FUNCIÓN PARA CARGAR HTML + JS
    // ============================================================================
    async function loadPage(pageName) {

        const page = PAGES[pageName];

        // ⛔ SI LA PÁGINA NO EXISTE → MOSTRAR MENSAJE
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

    // ============================================================================
    // MENÚ ACTIVO
    // ============================================================================
    function highlightMenu(key) {
        menuItems.forEach(m => m.classList.remove("active"));
        subItems.forEach(s => s.classList.remove("active"));

        const mainItem = document.querySelector(`.menu-item[data-content="${key}"]`);
        if (mainItem) mainItem.classList.add("active");
    }

    // ============================================================================
    // CLIC EN MENÚ PRINCIPAL
    // ============================================================================
    menuItems.forEach(item => {
        item.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();

            const key = item.getAttribute("data-content");
            if (!key) return;

            highlightMenu(key);

            // HASH ROUTING
            location.hash = `#/${key}`;
        });
    });

    // ============================================================================
    // CLIC EN SUBMENÚ
    // ============================================================================
    subItems.forEach(sub => {
        sub.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();

            const key = sub.getAttribute("data-content");
            if (!key) return;

            highlightMenu(key);

            location.hash = `#/${key}`;
        });
    });

    // ============================================================================
    // CARGA DESDE HASH
    // ============================================================================
    function loadFromHash() {
        const hash = location.hash.replace("#/", "");

        // ⛔ SI LA PÁGINA NO EXISTE → NO ir a inicio
        if (!PAGES[hash]) {
            highlightMenu(hash); // igual resalta el menú
            loadPage(hash);
            return;
        }

        highlightMenu(hash);
        loadPage(hash);
    }

    // Escuchar cambios en el hash
    window.addEventListener("hashchange", loadFromHash);

    // Carga inicial
    loadFromHash();
});
