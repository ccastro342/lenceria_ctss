/* =========================================================
   LENCERÍA CTS — Lógica compartida
   - Header con scroll
   - Menú móvil
   - Carrito con localStorage
   - Animaciones al hacer scroll (reveal)
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

    // Primera pasada (y de respaldo por si el navegador no dispara scroll)
    revelarVisibles();
    setTimeout(revelarVisibles, 300);

    /* ---------- AÑO EN EL FOOTER ---------- */
    const year = document.getElementById('year');
    if (year) year.textContent = new Date().getFullYear();

    /* ---------- CARRITO ---------- */
    const STORAGE_KEY = 'cts-cart';
    let cart = [];

    try {
        cart = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch (e) {
        cart = [];
    }

    const badge = document.getElementById('cartCount');
    const itemsBox = document.getElementById('cartItems');
    const totalBox = document.getElementById('cartTotal');
    const drawer = document.getElementById('cartDrawer');
    const overlay = document.getElementById('overlay');
    const openBtn = document.getElementById('cartOpen');
    const closeBtn = document.getElementById('cartClose');
    const checkoutBtn = document.getElementById('cartCheckout');

    const formato = (n) => '$' + Number(n).toLocaleString('es-CO');

    function guardar() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
        } catch (e) { /* modo privado */ }
    }

    function render() {
        if (badge) badge.textContent = cart.length;

        if (!itemsBox) return;

        if (!cart.length) {
            itemsBox.innerHTML = '<p class="cart-empty">Tu carrito está vacío.<br>Mirá el catálogo y elegí algo lindo.</p>';
        } else {
            itemsBox.innerHTML = cart.map((item, i) => `
                <div class="cart-item">
                    <img src="${item.img || 'img/1.jpg'}" alt="${item.nombre}">
                    <div class="cart-item-info">
                        <h4>${item.nombre}</h4>
                        <span>${formato(item.precio)}</span>
                    </div>
                    <button class="cart-remove" data-index="${i}" aria-label="Quitar ${item.nombre}">×</button>
                </div>
            `).join('');

            itemsBox.querySelectorAll('.cart-remove').forEach((btn) => {
                btn.addEventListener('click', () => {
                    cart.splice(Number(btn.dataset.index), 1);
                    guardar();
                    render();
                });
            });
        }

        if (totalBox) {
            totalBox.textContent = formato(cart.reduce((s, i) => s + Number(i.precio), 0));
        }
    }

    function abrirCarrito() {
        if (!drawer) return;
        drawer.classList.add('open');
        drawer.setAttribute('aria-hidden', 'false');
        overlay.classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    function cerrarCarrito() {
        if (!drawer) return;
        drawer.classList.remove('open');
        drawer.setAttribute('aria-hidden', 'true');
        overlay.classList.remove('open');
        document.body.style.overflow = '';
    }

    function agregarAlCarrito(producto) {
        cart.push(producto);
        guardar();
        render();
        abrirCarrito();
    }

    if (openBtn) openBtn.addEventListener('click', abrirCarrito);
    if (closeBtn) closeBtn.addEventListener('click', cerrarCarrito);
    if (overlay) overlay.addEventListener('click', cerrarCarrito);

    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            if (!cart.length) {
                alert('Tu carrito está vacío.');
                return;
            }
            const total = cart.reduce((s, i) => s + Number(i.precio), 0);
            alert('¡Gracias por tu pedido!\n\n' + cart.length + ' producto(s)\nTotal: ' + formato(total) +
                  '\n\nTe contactamos por WhatsApp para coordinar el pago y el envío.');
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') cerrarCarrito();
    });

    document.querySelectorAll('.add-cart').forEach((btn) => {
        btn.addEventListener('click', () => {
            agregarAlCarrito({
                nombre: btn.dataset.nombre,
                precio: Number(btn.dataset.precio),
                img: btn.dataset.img || 'img/1.jpg'
            });
        });
    });

    render();

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

    /* ---------- API PÚBLICA (para productos.js) ---------- */
    window.CTS = {
        agregarAlCarrito,
        abrirCarrito,
        formato
    };
})();
