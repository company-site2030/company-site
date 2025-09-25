const menuToggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');
const links = document.querySelectorAll('.nav-links a');

menuToggle.addEventListener('click', () => {
  navLinks.classList.toggle('active');
});

links.forEach(link => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('active');
  });
});

// التعامل مع الفورمات
document.addEventListener("DOMContentLoaded", () => {
  const forms = document.querySelectorAll("form");
  
  forms.forEach(form => {
    form.addEventListener("submit", (e) => {
      e.preventDefault(); // يمنع إعادة تحميل الصفحة
      alert("✅ تم إرسال البيانات بنجاح!");
      form.reset(); // يمسح البيانات من الفورم بعد الإرسال
    });
  });
});
