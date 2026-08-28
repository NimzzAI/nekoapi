/* NekoAPI — shared front-end utilities */

// Tandai link nav aktif berdasarkan path saat ini (fallback kalau halaman lupa set class="active")
(function highlightActiveNav() {
  const links = document.querySelectorAll('.nav a');
  links.forEach((link) => {
    const href = link.getAttribute('href');
    if (href === window.location.pathname) link.classList.add('active');
  });
})();

// Klik baris endpoint di /docs untuk menyalin URL lengkapnya ke clipboard
document.addEventListener('click', (e) => {
  const row = e.target.closest('.endpoint-row');
  if (!row) return;

  const pathEl = row.querySelector('.endpoint-path');
  if (!pathEl) return;

  const fullUrl = window.location.origin + pathEl.textContent.trim();

  if (navigator.clipboard) {
    navigator.clipboard.writeText(fullUrl).then(() => {
      const original = pathEl.textContent;
      pathEl.textContent = 'Disalin ✓ ' + original;
      setTimeout(() => { pathEl.textContent = original; }, 1200);
    }).catch(() => {});
  }
});

console.log('%cNekoAPI%c — dikembangkan oleh Nimzz', 'font-weight:bold;color:#2B3A67;', 'color:#55585F;');
