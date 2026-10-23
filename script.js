/* =========================================================
   LENCERÍA CTS - Lógica en JavaScript
   Archivo: script.js
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {

    /* ---------- 1. SCROLL SUAVE hacia las secciones ---------- */
    document.querySelectorAll('nav a[href^="#"]').forEach((enlace) => {
        enlace.addEventListener('click', (evento) => {
            const id = enlace.getAttribute('href');
            const destino = document.querySelector(id);
            if (destino) {
                evento.preventDefault();
                destino.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    /* ---------- 2. FILTROS DE PRODUCTOS ---------- */
    const botonesFiltros = document.querySelectorAll('.filtro');
    const articulos = document.querySelectorAll('#productos article');

    botonesFiltros.forEach((boton) => {
        boton.addEventListener('click', () => {
            botonesFiltros.forEach((b) => b.classList.remove('activo'));
            boton.classList.add('activo');

            const categoria = boton.dataset.filtro;

            articulos.forEach((articulo) => {
                const categoriaArticulo = articulo.dataset.categoria;
                if (categoria === 'todos' || categoriaArticulo === categoria) {
                    articulo.classList.remove('oculto');
                } else {
                    articulo.classList.add('oculto');
                }
            });
        });
    });

    /* ---------- 3. CARRITO DE COMPRA ---------- */
    let carrito = [];

    const badge = document.getElementById('carrito-badge');
    const total = document.getElementById('carrito-total');
    const btnCarrito = document.getElementById('btn-carrito');

    function renderizarCarrito() {
        badge.textContent = carrito.length;
        const totalPrecio = carrito.reduce((suma, item) => suma + item.precio, 0);
        const formateado = totalPrecio.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });
        total.textContent = 'Carrito: ' + carrito.length + ' productos · $' + formateado;
    }

    function agregarAlCarrito(nombre, precio) {
        carrito.push({ nombre, precio });
        renderizarCarrito();
        alert(nombre + ' agregado al carrito');
    }

    document.querySelectorAll('.btn-comprar').forEach((boton) => {
        boton.addEventListener('click', () => {
            const nombre = boton.dataset.nombre;
            const precio = parseFloat(boton.dataset.precio) || 0;
            agregarAlCarrito(nombre, precio);
        });
    });

    btnCarrito.addEventListener('click', () => {
        const items = carrito.map((item) => '- ' + item.nombre + ' ($' + item.precio + ')').join('\n');
        alert('Tu carrito:\n\n' + (items || 'Tu carrito está vacío') + '\n\nTotal: $' + carrito.reduce((s, i) => s + i.precio, 0));
    });

});
