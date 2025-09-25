// ✅ Firebase إعداد
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } 
  from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } 
  from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCFYr3mTYs3BFvtnIcuFEjkSfJV3kPrzXk",
  authDomain: "ads-company-2e012.firebaseapp.com",
  projectId: "ads-company-2e012",
  storageBucket: "ads-company-2e012.appspot.com",
  messagingSenderId: "706203585878",
  appId: "1:706203585878:web:98c58764c1c7f95f1e5af7",
  measurementId: "G-BKSKHM3Z2S"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ✅ القائمة (٣ شخطات للجوال)
const menuToggle = document.getElementById("menu-toggle");
const navLinks = document.getElementById("nav-links");

if (menuToggle) {
  menuToggle.addEventListener("click", () => {
    navLinks.classList.toggle("active");
  });
}

// ✅ تسجيل مستخدم جديد
const registerForm = document.getElementById("register-form");
if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("name").value;
    const phone = document.getElementById("phone").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // حفظ بيانات إضافية في Firestore
      await setDoc(doc(db, "users", user.uid), {
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

// ✅ تسجيل الدخول
const loginForm = document.getElementById("login-form");
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      window.location.href = "dashboard.html"; // بعد الدخول يروح للوحة التحكم
    } catch (error) {
      alert("خطأ: " + error.message);
    }
  });
}

// ✅ عرض بيانات المستخدم في لوحة التحكم
async function loadDashboard() {
  const user = auth.currentUser;
  if (user) {
    const docRef = doc(db, "users", user.uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      document.getElementById("user-name").textContent = data.name;
      document.getElementById("user-phone").textContent = data.phone;
      document.getElementById("user-balance").textContent = data.balance + " $";
    }
  }
}

// ✅ تسجيل الخروج
const logoutBtn = document.getElementById("logout");
if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    await signOut(auth);
    window.location.href = "login.html";
  });
}

// ✅ تشغيل لوحة التحكم بعد الدخول
window.addEventListener("load", () => {
  if (window.location.pathname.includes("dashboard.html")) {
    loadDashboard();
  }
});
