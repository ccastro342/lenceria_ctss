/* =========================================================
   LENCERÍA CTS — Catálogo
   - Buscador en tiempo real
   - Filtros por categoría
   - Modal de detalle
   ========================================================= */

(function () {
    'use strict';

    /* ---------- DATOS ---------- */
    const productos = {
        sonya: {
            nombre: 'Sonya',
            precio: 55000,
            categoria: 'Encaje',
            img: 'img/2.jpg',
            desc: 'Conjunto de encaje rojo con ligas incluidas. Tela elástica con forro suave. Tallas S a XL.',
            talles: ['S', 'M', 'L', 'XL'],
            colores: ['Negro', 'Vinotinto', 'Rojo']
        },
        irelia: {
            nombre: 'Irelia',
            precio: 50000,
            categoria: 'Conjunto',
            img: 'img/3.jpg',
            desc: 'Conjunto con tiras cruzadas y ligas. Encaje elástico que se adapta al cuerpo. Talla única.',
            talles: ['Única'],
            colores: ['Negro', 'Azul', 'Rojo', 'Verde', 'Rosa', 'Blanco']
        },
        riven: {
            nombre: 'Riven',
            precio: 50000,
            categoria: 'Conjunto',
            img: 'img/4.jpg',
            desc: 'Conjunto de encaje con ligas y detalle de moño. Talla única con tiras regulables.',
            talles: ['Única'],
            colores: ['Negro', 'Rojo', 'Verde', 'Rosa', 'Blanco', 'Azul']
        },
        lilith: {
            nombre: 'Lilith',
            precio: 65000,
            categoria: 'Conjunto',
            img: 'img/5.jpg',
            desc: 'Conjunto con short de encaje y transparencias. Copa con aro y tiras ajustables. Tallas S a XL.',
            talles: ['S', 'M', 'L', 'XL'],
            colores: ['Negro', 'Azul', 'Rojo', 'Blanco', 'Vinotinto']
        },
        xayah: {
            nombre: 'Xayah',
            precio: 65000,
            categoria: 'Pijama',
            img: 'img/6.jpg',
            desc: 'Bata corta en tul con detalles de encaje. Ideal para estar en casa o para regalar. Tallas S a XL.',
            talles: ['S', 'M', 'L', 'XL'],
            colores: ['Negro', 'Rojo', 'Rosa', 'Blanco', 'Azul']
        },
        kayle: {
            nombre: 'Kayle',
            precio: 45000,
            categoria: 'Encaje',
            img: 'img/7.jpg',
            desc: 'Conjunto de tiras cruzadas con encaje burgundy. Talla única adaptable.',
            talles: ['Única'],
            colores: ['Negro', 'Rosa', 'Rojo', 'Blanco', 'Vinotinto']
        }
    };

    const grid = document.getElementById('productGrid');
    if (!grid) return;

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

    /* ---------- FILTRO POR URL (?categoria=encaje) ---------- */
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

    function abrirModal(id) {
        const p = productos[id];
        if (!p) return;

        productoActual = p;
        modalImg.src = p.img;
        modalImg.alt = 'Conjunto ' + p.nombre;
        modalTitle.textContent = p.nombre;
        modalPrice.textContent = window.CTS.formato(p.precio);
        modalDesc.textContent = p.desc;
        modalCat.textContent = p.categoria;

        modalTalles.innerHTML = p.talles.map((t) => `<span class="color-pill">${t}</span>`).join('');
        modalColores.innerHTML = p.colores.map((c) => `<span class="color-pill">${c}</span>`).join('');

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

    if (modalAdd) {
        modalAdd.addEventListener('click', () => {
            if (!productoActual) return;
            window.CTS.agregarAlCarrito({
                nombre: productoActual.nombre,
                precio: productoActual.precio,
                img: productoActual.img
            });
            cerrarModal();
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') cerrarModal();
    });
})();
