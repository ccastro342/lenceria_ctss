/* =========================================================
   LENCERÍA CTS — Lógica compartida
   - Header con scroll
   - Menú móvil
   - Carrito (localStorage) con talle, color y cantidad
   - Animaciones al hacer scroll
   - Formulario de contacto
   ========================================================= */

(function () {
    'use strict';

    /* ---------- HEADER ---------- */
    const header = document.getElementById('siteHeader');
    if (header) {
        const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 10);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
    }

    /* ---------- MENÚ MÓVIL ---------- */
    const nav = document.getElementById('nav');
    const menuBtn = document.getElementById('menuBtn');

    if (menuBtn && nav) {
        menuBtn.addEventListener('click', () => {
            const abierto = nav.classList.toggle('open');
            menuBtn.textContent = abierto ? '×' : '☰';
            menuBtn.setAttribute('aria-expanded', String(abierto));
        });

        nav.querySelectorAll('a').forEach((a) => {
            a.addEventListener('click', () => {
                nav.classList.remove('open');
                menuBtn.textContent = '☰';
            });
        });
    }

    /* ---------- REVEAL AL SCROLL ---------- */
    const revealElements = [...document.querySelectorAll('.reveal')];

    function revelarVisibles() {
        const alto = window.innerHeight || document.documentElement.clientHeight;
        revealElements.forEach((el) => {
            if (el.classList.contains('is-visible')) return;
            const rect = el.getBoundingClientRect();
            if (rect.top < alto * 0.9) el.classList.add('is-visible');
        });
    }

    window.addEventListener('scroll', revelarVisibles, { passive: true });
    window.addEventListener('resize', revelarVisibles);
    window.addEventListener('load', revelarVisibles);
    revelarVisibles();
    setTimeout(revelarVisibles, 300);

    /* ---------- AÑO EN EL FOOTER ---------- */
    const year = document.getElementById('year');
    if (year) year.textContent = new Date().getFullYear();

    /* ---------- CARRITO ---------- */
    const STORAGE_KEY = 'cts-cart';

    function normalizar(item) {
        return {
            id: item.id || '',
            nombre: item.nombre || 'Producto',
            precio: Number(item.precio) || 0,
            img: item.img || 'img/1.jpg',
            talle: item.talle || '',
            color: item.color || '',
            cantidad: Math.max(1, Number(item.cantidad) || 1)
        };
    }

    let cart = [];
    try {
        cart = (JSON.parse(localStorage.getItem(STORAGE_KEY)) || []).map(normalizar);
    } catch (e) {
        cart = [];
    }

    function guardar() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
        } catch (e) { /* modo privado */ }
    }

    function contar() {
        return cart.reduce((s, i) => s + i.cantidad, 0);
    }

    function renderCount() {
        document.querySelectorAll('.cart-count').forEach((el) => {
            el.textContent = contar();
        });
    }

    function agregar(item) {
        const nuevo = normalizar(item);
        const igual = cart.find(
            (x) => x.id === nuevo.id && x.talle === nuevo.talle && x.color === nuevo.color
        );

        if (igual) {
            igual.cantidad += nuevo.cantidad;
        } else {
            cart.push(nuevo);
        }

        guardar();
        renderCount();
    }

    const formato = (n) => '$' + Number(n).toLocaleString('es-CO');

    renderCount();

    /* ---------- API PÚBLICA ---------- */
    window.CTS = {
        agregar,
        guardar,
        contar,
        renderCount,
        formato,
        STORAGE_KEY,
        get cart() { return cart; }
    };

    /* ---------- FORMULARIO DE CONTACTO ---------- */
    const form = document.getElementById('contactForm');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const nota = document.getElementById('formNote');
            const nombre = form.querySelector('#nombre').value.trim();

            if (nota) {
                nota.textContent = '¡Gracias' + (nombre ? ', ' + nombre : '') + '! Te respondemos a la brevedad.';
                nota.style.color = 'var(--wine)';
            }
            form.reset();
        });
    }
})();
