(function () {
    'use strict';

    const config = window.CTS_SUPABASE_CONFIG || {};
    const hasConfig = Boolean(config.url && config.publishableKey && window.supabase);
    const byId = (id) => document.getElementById(id);
    const setupPanel = byId('setupPanel');
    const loginPanel = byId('loginPanel');
    const editorPanel = byId('editorPanel');
    const loginStatus = byId('loginStatus');
    const editorStatus = byId('editorStatus');
    const productList = byId('productList');
    const bucket = 'catalogo';
    let client = null;
    let products = [];

    if (!hasConfig) {
        setupPanel.hidden = false;
        return;
    }
    client = window.supabase.createClient(config.url, config.publishableKey);

    function escapeHtml(value) {
        return String(value || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
    }

    function slug(value) {
        return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    }

    function parseList(value) {
        return value.split(',').map((part) => part.trim()).filter(Boolean);
    }

    async function loadProducts() {
        const { data, error } = await client.from('products').select('*').order('nombre');
        if (error) throw error;
        products = data || [];
        renderList();
    }

    async function showEditor(user) {
        const { data, error } = await client.from('admin_users').select('user_id').eq('user_id', user.id).maybeSingle();
        if (error || !data) {
            await client.auth.signOut();
            throw new Error('Esta cuenta no está autorizada como administradora.');
        }
        await loadProducts();
        byId('loginLayout').hidden = true;
        loginPanel.hidden = true;
        editorPanel.hidden = false;
    }

    function renderList() {
        if (!products.length) {
            productList.innerHTML = '<p class="admin-hint">Todavía no hay productos. Agrega el primero en el formulario.</p>';
            return;
        }
        productList.innerHTML = products.map((p) => `
            <article class="admin-product">
                <img src="${escapeHtml(p.img)}" alt="">
                <div><strong>${escapeHtml(p.nombre)}</strong><span>${escapeHtml(p.categoria)} · $${Number(p.precio || 0).toLocaleString('es-CO')}</span></div>
                <button type="button" class="btn btn-ghost" data-edit="${escapeHtml(p.id)}">Editar</button>
                <button type="button" class="admin-delete" data-delete="${escapeHtml(p.id)}" aria-label="Eliminar ${escapeHtml(p.nombre)}">Eliminar</button>
            </article>`).join('');
    }

    function fillForm(id) {
        const p = products.find((item) => item.id === id);
        if (!p) return;
        byId('productId').value = p.id;
        byId('productName').value = p.nombre || '';
        byId('productPrice').value = p.precio || '';
        byId('productCategory').value = p.categoria || 'Conjunto';
        byId('productDescription').value = p.descripcion || '';
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

    byId('loginForm').addEventListener('submit', async (event) => {
        event.preventDefault();
        const button = byId('loginBtn');
        button.disabled = true;
        button.textContent = 'Validando acceso…';
        loginStatus.textContent = 'Iniciando sesión…';
        try {
            const { data, error } = await client.auth.signInWithPassword({
                email: byId('loginEmail').value.trim(),
                password: byId('loginPassword').value
            });
            if (error) throw error;
            await showEditor(data.user);
            loginStatus.textContent = '';
        } catch (error) {
            loginStatus.textContent = error.message || 'No se pudo iniciar sesión.';
        } finally {
            button.disabled = false;
            button.innerHTML = 'Entrar al panel <span aria-hidden="true">→</span>';
        }
    });

    byId('logoutBtn').addEventListener('click', async () => {
        await client.auth.signOut();
        byId('loginLayout').hidden = false;
        editorPanel.hidden = true;
        loginPanel.hidden = false;
        editorStatus.textContent = '';
        resetForm();
    });

    byId('togglePassword').addEventListener('click', () => {
        const input = byId('loginPassword');
        const show = input.type === 'password';
        input.type = show ? 'text' : 'password';
        byId('togglePassword').textContent = show ? 'Ocultar' : 'Mostrar';
        byId('togglePassword').setAttribute('aria-label', show ? 'Ocultar contraseña' : 'Mostrar contraseña');
    });

    byId('cancelEditBtn').addEventListener('click', resetForm);

    productList.addEventListener('click', async (event) => {
        const edit = event.target.closest('[data-edit]');
        const remove = event.target.closest('[data-delete]');
        if (edit) fillForm(edit.dataset.edit);
        if (!remove) return;
        const product = products.find((item) => item.id === remove.dataset.delete);
        if (!product || !window.confirm(`¿Eliminar ${product.nombre} del catálogo?`)) return;
        editorStatus.textContent = 'Eliminando producto…';
        const { error } = await client.from('products').delete().eq('id', product.id);
        if (error) { editorStatus.textContent = `No se pudo eliminar. ${error.message}`; return; }
        await loadProducts();
        editorStatus.textContent = 'Producto eliminado.';
    });

    byId('productForm').addEventListener('submit', async (event) => {
        event.preventDefault();
        const name = byId('productName').value.trim();
        const oldId = byId('productId').value;
        const id = oldId || slug(name);
        const previous = products.find((item) => item.id === oldId);
        const file = byId('productImage').files[0];
        if (file && (!/^image\/(jpeg|png|webp)$/.test(file.type) || file.size > 4 * 1024 * 1024)) {
            editorStatus.textContent = 'La foto debe ser JPG, PNG o WebP y pesar máximo 4 MB.';
            return;
        }
        if (!previous && !file) { editorStatus.textContent = 'Selecciona una foto para el producto nuevo.'; return; }

        const button = byId('saveProductBtn');
        button.disabled = true;
        try {
            let imageUrl = previous && previous.img;
            if (file) {
                editorStatus.textContent = 'Subiendo foto…';
                const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
                const path = `${id}/${Date.now()}.${ext}`;
                const { error: uploadError } = await client.storage.from(bucket).upload(path, file, { cacheControl: '3600', upsert: false, contentType: file.type });
                if (uploadError) throw uploadError;
                imageUrl = client.storage.from(bucket).getPublicUrl(path).data.publicUrl;
            }
            editorStatus.textContent = 'Guardando producto…';
            const record = {
                id,
                nombre: name,
                precio: Number(byId('productPrice').value),
                categoria: byId('productCategory').value,
                img: imageUrl,
                descripcion: byId('productDescription').value.trim(),
                talles: parseList(byId('productSizes').value),
                colores: parseList(byId('productColors').value)
            };
            const { error } = await client.from('products').upsert(record, { onConflict: 'id' });
            if (error) throw error;
            await loadProducts();
            resetForm();
            editorStatus.textContent = 'Producto guardado.';
        } catch (error) {
            editorStatus.textContent = `No se pudo guardar. ${error.message}`;
        } finally {
            button.disabled = false;
        }
    });

    (async function restoreSession() {
        loginPanel.hidden = false;
        const { data } = await client.auth.getSession();
        if (!data.session) return;
        try { await showEditor(data.session.user); }
        catch (error) { loginPanel.hidden = false; loginStatus.textContent = error.message; }
    })();
})();
