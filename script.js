// Firebase إعداد
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// تسجيل حساب جديد
const registerForm = document.getElementById("registerForm");
if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fullname = document.getElementById("fullname").value;
    const email = document.getElementById("email").value;
    const phone = document.getElementById("phone").value;
    const password = document.getElementById("password").value;

    try {
      const userCredential = await auth.createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;
      await db.collection("users").doc(user.uid).set({
        fullname,
        email,
        phone,
        balance: 0,
        transactions: []
      });
      alert("تم إنشاء الحساب بنجاح ✅");
      window.location.href = "login.html";
    } catch (error) {
      alert("خطأ: " + error.message);
    }
  });
}

// تسجيل الدخول
const loginForm = document.getElementById("loginForm");
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
