(function () {
    'use strict';

    const owner = 'ccastro342';
    const repo = 'lenceria_ctss';
    const branch = 'main';
    const dataPath = 'productos-data.js';
    let token = '';
    let products = { ...(window.PRODUCTOS || {}) };
    let dataSha = '';

    const byId = (id) => document.getElementById(id);
    const loginPanel = byId('loginPanel');
    const editorPanel = byId('editorPanel');
    const loginStatus = byId('loginStatus');
    const editorStatus = byId('editorStatus');
    const productList = byId('productList');

    async function github(path, options) {
        const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
            ...options,
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/vnd.github+json',
                'X-GitHub-Api-Version': '2022-11-28',
                ...(options && options.headers)
            }
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.message || `GitHub respondió ${response.status}.`);
        return result;
    }

    async function getSha(path) {
        const file = await github(`${path}?ref=${branch}`);
        return file.sha;
    }

    async function saveFile(path, content, message, sha) {
        return github(path, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message, content, sha, branch })
        });
    }

    function encodeBase64(text) {
        return btoa(unescape(encodeURIComponent(text)));
    }

    function renderList() {
        const entries = Object.entries(products);
        if (!entries.length) {
            productList.innerHTML = '<p class="admin-hint">Todavía no hay productos. Agrega el primero en el formulario.</p>';
            return;
        }
        productList.innerHTML = entries.map(([id, p]) => `
            <article class="admin-product">
                <img src="../${String(p.img || '').replace(/^\.\.\//, '')}" alt="">
                <div><strong>${escapeHtml(p.nombre)}</strong><span>${escapeHtml(p.categoria)} · $${Number(p.precio || 0).toLocaleString('es-CO')}</span></div>
                <button type="button" class="btn btn-ghost" data-edit="${escapeHtml(id)}">Editar</button>
                <button type="button" class="admin-delete" data-delete="${escapeHtml(id)}" aria-label="Eliminar ${escapeHtml(p.nombre)}">Eliminar</button>
            </article>`).join('');
    }

    function escapeHtml(value) {
        return String(value || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
    }

    function fillForm(id) {
        const p = products[id];
        if (!p) return;
        byId('productId').value = id;
        byId('productName').value = p.nombre || '';
        byId('productPrice').value = p.precio || '';
        byId('productCategory').value = p.categoria || 'Conjunto';
        byId('productDescription').value = p.desc || '';
        byId('productSizes').value = (p.talles || []).join(', ');
        byId('productColors').value = (p.colores || []).join(', ');
        byId('productImage').value = '';
        byId('formTitle').textContent = `Editar ${p.nombre}`;
        byId('saveProductBtn').textContent = 'Guardar cambios';
        byId('cancelEditBtn').hidden = false;
        byId('productForm').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function resetForm() {
        byId('productForm').reset();
        byId('productId').value = '';
        byId('formTitle').textContent = 'Agregar producto';
        byId('saveProductBtn').textContent = 'Guardar producto';
        byId('cancelEditBtn').hidden = true;
    }

    function parseList(value) {
        return value.split(',').map((part) => part.trim()).filter(Boolean);
    }

    function slug(value) {
        return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    }

    byId('loginForm').addEventListener('submit', async (event) => {
        event.preventDefault();
        token = byId('githubToken').value.trim();
        loginStatus.textContent = 'Verificando permisos…';
        try {
            dataSha = await getSha(dataPath);
            loginPanel.hidden = true;
            editorPanel.hidden = false;
            byId('githubToken').value = '';
            renderList();
        } catch (error) {
            token = '';
            loginStatus.textContent = `No se pudo conectar. Revisa que el token tenga acceso de escritura al repositorio. ${error.message}`;
        }
    });

    byId('logoutBtn').addEventListener('click', () => {
        token = '';
        products = { ...(window.PRODUCTOS || {}) };
        editorPanel.hidden = true;
        loginPanel.hidden = false;
        editorStatus.textContent = '';
        loginStatus.textContent = 'Sesión desconectada.';
        resetForm();
    });

    byId('cancelEditBtn').addEventListener('click', resetForm);

    productList.addEventListener('click', async (event) => {
        const edit = event.target.closest('[data-edit]');
        const remove = event.target.closest('[data-delete]');
        if (edit) fillForm(edit.dataset.edit);
        if (remove) {
            const id = remove.dataset.delete;
            if (!window.confirm(`¿Eliminar ${products[id].nombre} del catálogo?`)) return;
            delete products[id];
            try {
                editorStatus.textContent = 'Guardando catálogo…';
                const result = await saveFile(dataPath, encodeBase64(`/* Catálogo editable desde el panel de administración */\nwindow.PRODUCTOS = ${JSON.stringify(products, null, 4)};\n`), `Eliminar producto ${id}`, dataSha);
                dataSha = result.content.sha;
                renderList();
                editorStatus.textContent = 'Producto eliminado. La publicación en GitHub Pages ya comenzó.';
            } catch (error) {
                products = { ...(window.PRODUCTOS || {}) };
                renderList();
                editorStatus.textContent = `No se pudo guardar. ${error.message}`;
            }
        }
    });

    byId('productForm').addEventListener('submit', async (event) => {
        event.preventDefault();
        const name = byId('productName').value.trim();
        const id = byId('productId').value || slug(name);
        if (!id) { editorStatus.textContent = 'Escribe un nombre válido.'; return; }
        const file = byId('productImage').files[0];
        if (file && (!/^image\/(jpeg|png|webp)$/.test(file.type) || file.size > 4 * 1024 * 1024)) {
            editorStatus.textContent = 'La foto debe ser JPG, PNG o WebP y pesar máximo 4 MB.';
            return;
        }
        if (!products[id] && !file) {
            editorStatus.textContent = 'Selecciona una foto para el producto nuevo.';
            return;
        }
        const button = byId('saveProductBtn');
        button.disabled = true;
        try {
            let imagePath = products[id] && products[id].img;
            if (file) {
                editorStatus.textContent = 'Subiendo foto…';
                const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
                const path = `img/catalogo-${id}-${Date.now()}.${ext}`;
                const base64 = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(String(reader.result).split(',')[1]);
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                });
                await saveFile(path, base64, `Subir foto para ${name}`);
                imagePath = `../${path}`;
            }
            products[id] = {
                nombre: name,
                precio: Number(byId('productPrice').value),
                categoria: byId('productCategory').value,
                img: imagePath,
                desc: byId('productDescription').value.trim(),
                talles: parseList(byId('productSizes').value),
                colores: parseList(byId('productColors').value)
            };
            editorStatus.textContent = 'Guardando producto…';
            const result = await saveFile(dataPath, encodeBase64(`/* Catálogo editable desde el panel de administración */\nwindow.PRODUCTOS = ${JSON.stringify(products, null, 4)};\n`), `Actualizar producto ${name}`, dataSha);
            dataSha = result.content.sha;
            renderList();
            resetForm();
            editorStatus.textContent = 'Producto guardado. La publicación en GitHub Pages ya comenzó.';
        } catch (error) {
            editorStatus.textContent = `No se pudo guardar. ${error.message}`;
        } finally {
            button.disabled = false;
        }
    });
})();
