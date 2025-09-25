// Robust menu + small Firebase hooks (menu-focused)
// ضع هذا في ملف script.js (غير المحتوى القديم بالكامل)

(function(){
  // ---- MENU TOGGLE (robust, works even لو العناصر بأسماء مختلفة) ----
  document.addEventListener('DOMContentLoaded', () => {
    // หา جميع عناصر القائمة (menu-toggle) بغض النظر عن id أو class
    const toggles = Array.from(document.querySelectorAll('.menu-toggle, [id="menu-toggle"], [data-role="menu-toggle"]'));

    if (toggles.length === 0) {
      console.warn('menu-toggle: لم أجد أي عنصر .menu-toggle أو #menu-toggle. تأكد من وجود زر ☰ في الهيدر.');
    }

    toggles.forEach(toggle => {
      // حاول إيجاد العنصر nav-links في نفس header أو nav
      const container = toggle.closest('header') || toggle.closest('nav') || document;
      let navLinks = container.querySelector('.nav-links') || document.querySelector('.nav-links');

      if (!navLinks) {
        console.warn('menu-toggle: لم أجد .nav-links مرتبطة بهذا الزر. تحقق من HTML (ضع .nav-links داخل header أو nav).', toggle);
        return;
      }

      // Accessibility attributes
      toggle.setAttribute('role', 'button');
      toggle.setAttribute('tabindex', '0');
      toggle.setAttribute('aria-controls', navLinks.id || 'navlinks');
      toggle.setAttribute('aria-expanded', navLinks.classList.contains('active') ? 'true' : 'false');

      // Toggle function
      function toggleMenu() {
        const isActive = navLinks.classList.toggle('active');
        toggle.setAttribute('aria-expanded', isActive ? 'true' : 'false');
        // منع السحب/تمرير الخلفية عند فتح القائمة
        document.body.style.overflow = isActive ? 'hidden' : '';
      }

      // Click + keyboard
      toggle.addEventListener('click', (e) => { e.stopPropagation(); toggleMenu(); });
      toggle.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') { e.preventDefault(); toggleMenu(); }
      });

      // إغلاق القائمة عند الضغط على أي رابط داخلها
      navLinks.querySelectorAll('a').forEach(a => {
        a.addEventListener('click', () => {
          navLinks.classList.remove('active');
          toggle.setAttribute('aria-expanded', 'false');
          document.body.style.overflow = '';
        });
      });

      // إغلاق القائمة عند الضغط خارجها
      document.addEventListener('click', (ev) => {
        if (!navLinks.classList.contains('active')) return;
        // لو النقر خارج الحاوية، اقفل
        if (!container.contains(ev.target)) {
          navLinks.classList.remove('active');
          toggle.setAttribute('aria-expanded', 'false');
          document.body.style.overflow = '';
        }
      });

      // منع تداخل اللمس (touch) — بعض الأجهزة تحتاج هذا
      document.addEventListener('touchstart', (ev) => {
        if (!navLinks.classList.contains('active')) return;
        if (!container.contains(ev.target)) {
          navLinks.classList.remove('active');
          toggle.setAttribute('aria-expanded', 'false');
          document.body.style.overflow = '';
        }
      }, {passive: true});
    });
  });

  // ---- small debug helper (يمكنك حذفها لاحقاً) ----
  window.__menuDebug = () => {
    console.log('toggles:', document.querySelectorAll('.menu-toggle, #menu-toggle'));
    console.log('nav-links:', document.querySelectorAll('.nav-links'));
  };

})();
