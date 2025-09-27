/* script.js (كامل بعد التعديلات)
   - menu toggle
   - Firebase init (Auth + Firestore) using compat v8
   - register/login/dashboard logic
   - deposit/withdraw + transactions
*/

// 1) Menu toggle (يشتغل على الجوال واللابتوب)
document.addEventListener('DOMContentLoaded', () => {
  const menuBtn = document.getElementById('menu-toggle');
  const nav = document.getElementById('nav-links') || document.querySelector('.nav-links');
  if (menuBtn && nav) {
    menuBtn.addEventListener('click', () => {
      nav.classList.toggle('active');
    });
  }
});

// 2) Firebase (v8 compat)
(function(){
  const firebaseConfig = {
    apiKey: "AIzaSyCFYr3mTYs3BFvtnIcuFEjkSfJV3kPrzXk",
    authDomain: "ads-company-2e012.firebaseapp.com",
    projectId: "ads-company-2e012",
    storageBucket: "ads-company-2e012.appspot.com",
    messagingSenderId: "706203585878",
    appId: "1:706203585878:web:98c58764c1c7f95f1e5af7",
    measurementId: "G-BKSKHM3Z2S"
  };

  function loadScript(src){ 
    return new Promise(res => { 
      const s=document.createElement('script'); 
      s.src=src; 
      s.onload=res; 
      document.head.appendChild(s); 
    }); 
  }

  async function initFirebaseAndApp(){
    await loadScript('https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js');
    await loadScript('https://www.gstatic.com/firebasejs/8.10.0/firebase-auth.js');
    await loadScript('https://www.gstatic.com/firebasejs/8.10.0/firebase-firestore.js');

    if (!window.firebase.apps || !window.firebase.apps.length){
      firebase.initializeApp(firebaseConfig);
    }
    const auth = firebase.auth();
    const db = firebase.firestore();

    // ---------- Registration ----------
    const registerForm = document.getElementById('registerForm');
    if (registerForm){
      registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fullName = document.getElementById('fullName')?.value 
          || document.getElementById('name')?.value 
          || document.getElementById('fullname')?.value 
          || "";
        const email = document.getElementById('email').value.trim();
        const phone = document.getElementById('phone')?.value.trim() 
          || document.getElementById('phoneNumber')?.value.trim() 
          || "";
        const password = document.getElementById('password').value;

        try {
          const userCred = await auth.createUserWithEmailAndPassword(email, password);
          const user = userCred.user;
          await user.updateProfile({ displayName: fullName });

          await db.collection('users').doc(user.uid).set({
            name: fullName,
            email,
            phone,
            balance: 0,
            transactions: []
          });

          window.location.href = 'dashboard.html';
        } catch(err){
          alert('خطأ أثناء التسجيل: ' + err.message);
        }
      });
    }

    // ---------- Login ----------
    const loginForm = document.getElementById('loginForm');
    if (loginForm){
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;
        try {
          await auth.signInWithEmailAndPassword(email, password);
          window.location.href = 'dashboard.html';
        } catch(err){
          alert('خطأ أثناء تسجيل الدخول: ' + err.message);
        }
      });
    }

    // ---------- Dashboard logic ----------
    if (window.location.pathname.includes('dashboard.html')){
      auth.onAuthStateChanged(async (user) => {
        if (!user) { window.location.href = 'login.html'; return; }
        try {
          const docRef = db.collection('users').doc(user.uid);
          const snap = await docRef.get();
          if (!snap.exists){
            await docRef.set({ 
              name: user.displayName || '', 
              email: user.email || '', 
              phone: user.phoneNumber || '', 
              balance: 0, 
              transactions: [] 
            });
          }
          const data = (await docRef.get()).data();

          document.getElementById('clientName').textContent = data.name || 'مستخدم';
          document.getElementById('clientEmail').textContent = data.email || '';
          document.getElementById('clientPhone').textContent = data.phone || '';
          document.getElementById('clientBalance').textContent = (Number(data.balance)||0) + ' $';

          const txBody = document.getElementById('txBody');
          if (data.transactions && data.transactions.length){
            txBody.innerHTML = '';
            data.transactions.slice().reverse().forEach(tx => {
              const tr = document.createElement('tr');
              tr.innerHTML = `<td>${tx.type}</td><td>${tx.amount} $</td><td>${tx.date}</td><td>${tx.status||'—'}</td>`;
              txBody.appendChild(tr);
            });
          } else {
            txBody.innerHTML = '<tr><td colspan="4">لا توجد عمليات بعد</td></tr>';
          }

          const depositBtn = document.getElementById('depositBtn');
          depositBtn.addEventListener('click', async () => {
            const addr = '0x7F8125C197B845E1F0682A9846B94A11cA9d9743';
            const amountStr = prompt('أدخل مبلغ الإيداع (USDT):');
            const amount = parseFloat(amountStr);
            if (!amount || isNaN(amount) || amount <= 0) { alert('المبلغ غير صالح'); return; }
            const confirmCopy = confirm('يرجى تحويل المبلغ إلى عنوان الشركة:\n' + addr + '\n\nهل تريد نسخ العنوان الآن؟');
            if (confirmCopy && navigator.clipboard){
              try { 
                await navigator.clipboard.writeText(addr); 
                alert('تم نسخ العنوان ✅'); 
              } catch(e){ 
                alert('فشل النسخ — انسخ العنوان يدوياً:\n' + addr); 
              }
            } else {
              alert('تأكد من تحويلك ثم اضغط موافق لإرسال الطلب (سيكون بالحالة: قيد الانتظار).');
            }
            await docRef.update({ 
              transactions: firebase.firestore.FieldValue.arrayUnion({ 
                type:'إيداع', 
                amount: amount, 
                date: new Date().toLocaleString(), 
                status: 'قيد الانتظار' 
              })
            });
            alert('✅ تم إرسال إشعار الإيداع كطلب (قيد الانتظار).');
            location.reload();
          });

          const withdrawBtn = document.getElementById('withdrawBtn');
          withdrawBtn.addEventListener('click', async () => {
            const addr = prompt('أدخل عنوان محفظتك (USDT ERC20) للسحب:');
            if (!addr) return;
            const amountStr = prompt('أدخل المبلغ المطلوب سحبه (USDT):');
            const amount = parseFloat(amountStr);
            if (!amount || isNaN(amount) || amount <= 0) { alert('المبلغ غير صالح'); return; }
            if (amount > (Number(data.balance) || 0)) { alert('الرصيد غير كافٍ'); return; }

            await docRef.update({
              balance: (Number(data.balance) || 0) - amount,
              transactions: firebase.firestore.FieldValue.arrayUnion({ 
                type:'سحب', 
                amount: amount, 
                date: new Date().toLocaleString(), 
                status: 'قيد الانتظار', 
                address: addr 
              })
            });
            alert('✅ تم تسجيل طلب السحب (قيد الانتظار). سنعالج الطلب خلال أقرب وقت.');
            location.reload();
          });

          document.getElementById('logoutBtn')?.addEventListener('click', async (e) => {
            e.preventDefault();
            await auth.signOut();
            window.location.href = 'login.html';
          });

        } catch(err){
          console.error(err);
          alert('حدث خطأ أثناء تحميل بيانات الحساب: ' + err.message);
        }
      });
    }

    window._fb = { auth, db };
  }

  initFirebaseAndApp();
})();
