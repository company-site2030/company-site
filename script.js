// إعداد Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCFYr3mTYs3BFvtnIcuFEjkSfJV3kPrzXk",
  authDomain: "ads-company-2e012.firebaseapp.com",
  projectId: "ads-company-2e012",
  storageBucket: "ads-company-2e012.appspot.com",
  messagingSenderId: "706203585878",
  appId: "1:706203585878:web:98c58764c1c7f95f1e5af7",
  measurementId: "G-BKSKHM3Z2S"
};

// تفعيل Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// ==========================
// تسجيل مستخدم جديد
// ==========================
const registerForm = document.getElementById("register-form");
if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("name").value;
    const phone = document.getElementById("phone").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
      const userCredential = await auth.createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;

      await db.collection("users").doc(user.uid).set({
        name,
        phone,
        email,
        balance: 0
      });

      alert("تم التسجيل بنجاح ✅");
      window.location.href = "login.html";
    } catch (error) {
      alert("خطأ: " + error.message);
    }
  });
}

// ==========================
// تسجيل الدخول
// ==========================
const loginForm = document.getElementById("login-form");
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    try {
      await auth.signInWithEmailAndPassword(email, password);
      window.location.href = "dashboard.html";
    } catch (error) {
      alert("خطأ: " + error.message);
    }
  });
}

// ==========================
// تحميل بيانات العميل في لوحة التحكم
// ==========================
if (window.location.pathname.includes("dashboard.html")) {
  auth.onAuthStateChanged(async (user) => {
    if (user) {
      const doc = await db.collection("users").doc(user.uid).get();
      if (doc.exists) {
        const data = doc.data();
        document.getElementById("clientName").textContent = data.name;
        document.getElementById("clientEmail").textContent = data.email;
        document.getElementById("clientPhone").textContent = data.phone;
        document.getElementById("clientBalance").textContent = data.balance + " $";
      }
    } else {
      window.location.href = "login.html";
    }
  });
}

// ==========================
// تسجيل الخروج
// ==========================
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    await auth.signOut();
    window.location.href = "login.html";
  });
}

// ==========================
// زر القائمة للجوال
// ==========================
const menuToggle = document.querySelector(".menu-toggle");
const navLinks = document.querySelector(".nav-links");

if (menuToggle) {
  menuToggle.addEventListener("click", () => {
    navLinks.classList.toggle("active");
  });
}
