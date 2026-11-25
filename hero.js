/* =========================================================
   LENCERÍA CTS — Hero
   El logo grande abre el conjunto de temporada en un modal.
   ========================================================= */

(function () {
    'use strict';

    const abridor = document.getElementById('seasonOpen');
    const modal = document.getElementById('seasonModal');
    const cerrarBtn = document.getElementById('seasonClose');

    if (!abridor || !modal || !cerrarBtn) return;

    let focoAnterior = null;

    function abrir() {
        focoAnterior = document.activeElement;
        modal.classList.add('open');
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        cerrarBtn.focus();
    }

    function cerrar() {
        modal.classList.remove('open');
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        const volver = focoAnterior && focoAnterior !== document.body ? focoAnterior : abridor;
        if (volver) volver.focus();
    }

    abridor.addEventListener('click', abrir);
    cerrarBtn.addEventListener('click', cerrar);

    modal.addEventListener('click', (e) => {
        if (e.target === modal) cerrar();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('open')) cerrar();
    });
})();
