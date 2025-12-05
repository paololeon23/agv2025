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
    };

    // ============================================================================
    // LIMPIAR SCRIPTS DINÁMICOS PARA EVITAR ACUMULACIÓN
    // ============================================================================
    function removeDynamicScripts() {
        document.querySelectorAll("script[data-dynamic]").forEach(s => s.remove());
    }

    // ============================================================================
    // FUNCIÓN PRINCIPAL PARA CARGAR (HTML + JS)
    // ============================================================================
    async function loadPage(pageName) {
        const page = PAGES[pageName];
        if (!page) return console.error("Página no encontrada:", pageName);

        // 1️⃣ CARGAR HTML
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
                    <button onclick="location.reload()">Reintentar</button>
                </div>
            `;
            console.error(err);
            return;
        }

        // 2️⃣ LIMPIAR JS ANTIGUO Y CARGAR EL NUEVO
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

        const subItem = document.querySelector(`.submenu-item[data-content="${key}"]`);
        if (subItem) {
            subItem.classList.add("active");
            const parent = subItem.closest(".submenu").previousElementSibling;
            if (parent) parent.classList.add("active");
        }
    }

    // ============================================================================
    // EVENTOS DEL MENÚ PRINCIPAL
    // ============================================================================
    menuItems.forEach(item => {
        item.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();

            const key = item.getAttribute("data-content");
            if (!key) return;

            highlightMenu(key);
            loadPage(key);
            history.pushState({ page: key }, "", `/${key}`);
        });
    });

    // ============================================================================
    // EVENTOS DEL SUBMENÚ
    // ============================================================================
    subItems.forEach(sub => {
        sub.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();

            const key = sub.getAttribute("data-content");
            if (!key) return;

            highlightMenu(key);
            loadPage(key);
            history.pushState({ page: key }, "", `/${key}`);
        });
    });

    // ============================================================================
    // ATRÁS / ADELANTE DEL NAVEGADOR
    // ============================================================================
    window.addEventListener("popstate", (e) => {
        const page = e.state?.page || "inicio";
        highlightMenu(page);
        loadPage(page);
    });

    // ============================================================================
    // DETECTAR RUTA DIRECTA (EJ: /columnas)
    // ============================================================================
    const path = location.pathname.replace("/", "");
    const validPage = PAGES[path] ? path : "inicio";

    highlightMenu(validPage);
    loadPage(validPage);
    history.replaceState({ page: validPage }, "", `/${validPage}`);

});
