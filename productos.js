/* =========================================================
   LENCERÍA CTS — Catálogo
   - Buscador en tiempo real
   - Filtros por categoría
   - Modal de detalle con talle y color
   - Al agregar: guarda y va a ../carrito/
   ========================================================= */

(async function () {
    'use strict';

    const grid = document.getElementById('productGrid');
    if (!grid) return;

    let productos = window.PRODUCTOS || {};
    const config = window.CTS_SUPABASE_CONFIG || {};
    if (config.url && config.publishableKey && window.supabase) {
        try {
            const client = window.supabase.createClient(config.url, config.publishableKey);
            const { data, error } = await client.from('products').select('*').order('nombre');
            if (error) throw error;
            productos = Object.fromEntries((data || []).map((p) => [p.id, {
                nombre: p.nombre, precio: p.precio, categoria: p.categoria, img: p.img,
                desc: p.descripcion, talles: p.talles || [], colores: p.colores || []
            }]));
        } catch (error) {
            console.error('No se pudo cargar el catálogo de Supabase; se muestran los datos locales.', error);
        }
    }

    const escapar = (valor) => String(valor || '').replace(/[&<>"']/g, (c) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[c]);
    const slugCategoria = (categoria) => {
        const c = String(categoria || '').toLowerCase();
        if (c.includes('pijama')) return 'pijamas';
        if (c.includes('conjunto')) return 'conjuntos';
        return 'encaje';
    };
    const precio = (valor) => '$' + Number(valor || 0).toLocaleString('es-CO');
    grid.innerHTML = Object.entries(productos).map(([id, p], i) => `
        <article class="product-card" data-categoria="${slugCategoria(p.categoria)}" data-id="${escapar(id)}" style="--d:${Math.min(i, 8) * .08}s">
            <div class="card-media" data-open="${escapar(id)}">
                <img src="${escapar(p.img)}" alt="${escapar(p.nombre)}">
                <span class="card-tag">${escapar(p.categoria)}</span>
            </div>
            <div class="card-body">
                <h3>${escapar(p.nombre)}</h3>
                <p class="card-price">${precio(p.precio)}</p>
                <p class="card-desc">${escapar(p.desc)}</p>
                <button class="btn btn-primary add-cart" data-nombre="${escapar(p.nombre)}" data-precio="${Number(p.precio) || 0}" data-img="${escapar(p.img)}">Agregar al carrito</button>
            </div>
        </article>`).join('');

    const cards = [...grid.querySelectorAll('.product-card')];
    const chips = [...document.querySelectorAll('.chip')];
    const buscador = document.getElementById('buscador');

    /* ---------- FILTROS + BÚSQUEDA ---------- */
    let categoriaActual = 'todos';
    let textoActual = '';

    function aplicarFiltros() {
        let visibles = 0;

        cards.forEach((card) => {
            const cat = card.dataset.categoria;
            const nombre = card.querySelector('h3').textContent.toLowerCase();

            const coincideCat = categoriaActual === 'todos' || cat === categoriaActual;
            const coincideTexto = nombre.includes(textoActual);
            const mostrar = coincideCat && coincideTexto;

            card.style.display = mostrar ? '' : 'none';
            if (mostrar) visibles++;
        });

        let vacio = grid.querySelector('.empty');
        if (visibles === 0) {
            if (!vacio) {
                vacio = document.createElement('p');
                vacio.className = 'empty';
                grid.appendChild(vacio);
            }
            vacio.textContent = 'No encontramos productos con esa búsqueda.';
        } else if (vacio) {
            vacio.remove();
        }
    }

    chips.forEach((chip) => {
        chip.addEventListener('click', () => {
            chips.forEach((c) => c.classList.remove('active'));
            chip.classList.add('active');
            categoriaActual = chip.dataset.filtro;
            aplicarFiltros();
        });
    });

    if (buscador) {
        buscador.addEventListener('input', () => {
            textoActual = buscador.value.trim().toLowerCase();
            aplicarFiltros();
        });
    }

    const params = new URLSearchParams(window.location.search);
    const catUrl = params.get('categoria');
    if (catUrl) {
        const chip = chips.find((c) => c.dataset.filtro === catUrl);
        if (chip) chip.click();
    }

    /* ---------- MODAL ---------- */
    const modal = document.getElementById('productModal');
    const modalImg = document.getElementById('modalImg');
    const modalTitle = document.getElementById('modalTitle');
    const modalPrice = document.getElementById('modalPrice');
    const modalDesc = document.getElementById('modalDesc');
    const modalCat = document.getElementById('modalCat');
    const modalTalles = document.getElementById('modalTalles');
    const modalColores = document.getElementById('modalColores');
    const modalAdd = document.getElementById('modalAdd');
    const modalClose = document.getElementById('modalClose');

    let productoActual = null;
    let talleElegido = '';
    let colorElegido = '';

    function marcarOpcion(contenedor, valor) {
        contenedor.querySelectorAll('.opt').forEach((b) => {
            b.classList.toggle('selected', b.dataset.value === valor);
        });
    }

    function abrirModal(id) {
        const p = productos[id];
        if (!p) return;

        productoActual = p;
        talleElegido = p.talles[0] || '';
        colorElegido = p.colores[0] || '';

        modalImg.src = p.img;
        modalImg.alt = 'Conjunto ' + p.nombre;
        modalTitle.textContent = p.nombre;
        modalPrice.textContent = window.CTS.formato(p.precio);
        modalDesc.textContent = p.desc;
        modalCat.textContent = p.categoria;

        modalTalles.innerHTML = p.talles
            .map((t) => `<button type="button" class="opt selected" data-value="${t}">${t}</button>`)
            .join('');

        modalColores.innerHTML = p.colores
            .map((c, i) => `<button type="button" class="opt${i === 0 ? ' selected' : ''}" data-value="${c}">${c}</button>`)
            .join('');

        modalTalles.querySelectorAll('.opt').forEach((b) => {
            b.addEventListener('click', () => {
                talleElegido = b.dataset.value;
                marcarOpcion(modalTalles, talleElegido);
            });
        });

        modalColores.querySelectorAll('.opt').forEach((b) => {
            b.addEventListener('click', () => {
                colorElegido = b.dataset.value;
                marcarOpcion(modalColores, colorElegido);
            });
        });

        modal.classList.add('open');
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    }

    function cerrarModal() {
        modal.classList.remove('open');
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }

    grid.querySelectorAll('[data-open]').forEach((el) => {
        el.addEventListener('click', () => abrirModal(el.dataset.open));
    });

    if (modalClose) modalClose.addEventListener('click', cerrarModal);
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) cerrarModal();
        });
    }

    /* ---------- AGREGAR E IR AL CARRITO ---------- */
    function agregarYIr(id, talle, color) {
        const p = productos[id];
        if (!p) return;

        window.CTS.agregar({
            id,
            nombre: p.nombre,
            precio: p.precio,
            img: p.img,
            talle: talle || '',
            color: color || '',
            cantidad: 1
        });

        window.location.href = '../carrito/';
    }

    if (modalAdd) {
        modalAdd.addEventListener('click', () => {
            const p = productoActual;
            if (!p) return;
            const id = Object.keys(productos).find((k) => productos[k] === p);
            agregarYIr(id, talleElegido, colorElegido);
        });
    }

    // Botón rápido de cada tarjeta: agrega sin talle y te manda a elegirlo
    grid.querySelectorAll('.add-cart').forEach((btn) => {
        btn.addEventListener('click', () => {
            const card = btn.closest('.product-card');
            const id = card ? card.dataset.id : '';
            agregarYIr(id, '', '');
        });
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') cerrarModal();
    });

    /* ---------- ABRIR PRODUCTO DESDE UN ENLACE (?producto=sonya) ---------- */
    const productoUrl = params.get('producto');
    if (productoUrl) abrirModal(productoUrl);
})();
