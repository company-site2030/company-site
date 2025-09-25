// القائمة في الجوال
const menuToggle = document.getElementById('menu-toggle');
const navLinks = document.querySelector('.nav-links');

if (menuToggle) {
  menuToggle.addEventListener('click', () => {
    navLinks.classList.toggle('active');
  });
}

// تسجيل
const registerForm = document.getElementById('registerForm');
if (registerForm) {
  registerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    alert('تم التسجيل بنجاح! (للتجربة فقط)');
  });
}

// تسجيل الدخول
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    alert('تم تسجيل الدخول بنجاح! (للتجربة فقط)');
  });
}
