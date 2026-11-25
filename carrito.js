/* =========================================================
   LENCERÍA CTS — Página del carrito
   - Elegir talle y color por producto
   - Sumar / restar cantidad
   - Quitar producto
   - Total y finalizar pedido
   ========================================================= */

(function () {
    'use strict';

    const productos = window.PRODUCTOS || {};
    const list = document.getElementById('cartList');
    if (!list) return;

    const sumItems = document.getElementById('sumItems');
    const sumTotal = document.getElementById('sumTotal');
    const checkoutBtn = document.getElementById('checkoutBtn');

    const formato = window.CTS.formato;

    function itemDe(producto) {
        return productos[producto.id] || {
            talles: ['Única'],
            colores: []
        };
    }

    function render() {
        const cart = window.CTS.cart;

        if (!cart.length) {
            list.innerHTML = `
                <div class="empty-cart">
                    <span class="empty-ico">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 8h12l-1 12H7L6 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>
                    </span>
                    <h3>Tu carrito está vacío</h3>
                    <p>Todavía no elegiste nada. Mirá el catálogo y encontrá tu conjunto.</p>
                    <a href="../catalogo/" class="btn btn-primary">Ver catálogo</a>
                </div>`;
        } else {
            list.innerHTML = cart.map((item, i) => {
                const datos = itemDe(item);
                const talles = datos.talles || ['Única'];
                const colores = datos.colores || [];

                const opcionesTalle = [
                    `<option value="" ${item.talle ? '' : 'selected'}>Elegí talle</option>`,
                    ...talles.map((t) => `<option value="${t}" ${item.talle === t ? 'selected' : ''}>${t}</option>`)
                ].join('');

                const opcionesColor = colores.length
                    ? `<select class="opt-select" data-accion="color" data-index="${i}">
                         ${colores.map((c) => `<option value="${c}" ${item.color === c ? 'selected' : ''}>${c}</option>`).join('')}
                       </select>`
                    : '<span class="muted">—</span>';

                return `
                    <article class="cart-row${item.talle ? '' : ' falta-talle'}" data-index="${i}">
                        <div class="cart-row-media">
                            <img src="${item.img}" alt="${item.nombre}">
                        </div>

                        <div class="cart-row-body">
                            <div class="cart-row-top">
                                <div>
                                    <h3>${item.nombre}</h3>
                                    <p class="cart-row-price">${formato(item.precio)} c/u</p>
                                </div>
                                <button class="cart-remove" data-accion="quitar" data-index="${i}" aria-label="Quitar ${item.nombre}">Quitar</button>
                            </div>

                            <div class="cart-row-controls">
                                <label class="control">
                                    <span>Talle</span>
                                    <select class="opt-select" data-accion="talle" data-index="${i}">
                                        ${opcionesTalle}
                                    </select>
                                </label>

                                <label class="control">
                                    <span>Color</span>
                                    ${opcionesColor}
                                </label>

                                <div class="control">
                                    <span>Cantidad</span>
                                    <div class="qty">
                                        <button data-accion="menos" data-index="${i}" aria-label="Restar">−</button>
                                        <span>${item.cantidad}</span>
                                        <button data-accion="mas" data-index="${i}" aria-label="Sumar">+</button>
                                    </div>
                                </div>

                                <div class="control control-total">
                                    <span>Subtotal</span>
                                    <strong>${formato(item.precio * item.cantidad)}</strong>
                                </div>
                            </div>
                        </div>
                    </article>`;
            }).join('');
        }

        const totalProductos = cart.reduce((s, i) => s + i.cantidad, 0);
        const totalPrecio = cart.reduce((s, i) => s + i.precio * i.cantidad, 0);

        if (sumItems) sumItems.textContent = totalProductos;
        if (sumTotal) sumTotal.textContent = formato(totalPrecio);

        window.CTS.renderCount();
    }

    /* ---------- ACCIONES ---------- */
    list.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-accion]');
        if (!btn || btn.tagName === 'SELECT') return;

        const accion = btn.dataset.accion;
        const i = Number(btn.dataset.index);
        const cart = window.CTS.cart;
        if (!cart[i]) return;

        if (accion === 'quitar') {
            cart.splice(i, 1);
        } else if (accion === 'menos') {
            cart[i].cantidad = Math.max(1, cart[i].cantidad - 1);
        } else if (accion === 'mas') {
            cart[i].cantidad += 1;
        }

        window.CTS.guardar();
        render();
    });

    list.addEventListener('change', (e) => {
        const sel = e.target.closest('select[data-accion]');
        if (!sel) return;

        const i = Number(sel.dataset.index);
        const cart = window.CTS.cart;
        if (!cart[i]) return;

        if (sel.dataset.accion === 'talle') cart[i].talle = sel.value;
        if (sel.dataset.accion === 'color') cart[i].color = sel.value;

        window.CTS.guardar();
        render();
    });

    /* ---------- FINALIZAR ---------- */
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            const cart = window.CTS.cart;

            if (!cart.length) {
                alert('Tu carrito está vacío.');
                return;
            }

            const sinTalle = cart.filter((i) => !i.talle);
            if (sinTalle.length) {
                alert('Elegí el talle de: ' + sinTalle.map((i) => i.nombre).join(', '));
                const primera = list.querySelector('.falta-talle');
                if (primera) primera.scrollIntoView({ behavior: 'smooth', block: 'center' });
                return;
            }

            const total = cart.reduce((s, i) => s + i.precio * i.cantidad, 0);
            const detalle = cart
                .map((i) => `• ${i.nombre} (Talle ${i.talle}${i.color ? ', ' + i.color : ''}) x${i.cantidad}`)
                .join('\n');

            alert(
                '¡Gracias por tu pedido!\n\n' +
                detalle +
                '\n\nTotal: ' + formato(total) +
                '\n\nTe contactamos por WhatsApp para coordinar pago y envío.'
            );
        });
    }

    render();
})();
