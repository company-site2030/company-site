/* script.js (معدل)
   - menu toggle
   - Firebase init
   - register/login/dashboard logic
   - deposit/withdraw + transactions مع المودالات
*/

document.addEventListener('DOMContentLoaded', () => {
  const menuBtn = document.getElementById('menu-toggle');
  const nav = document.getElementById('nav-links') || document.querySelector('.nav-links');
  if (menuBtn && nav) {
    menuBtn.addEventListener('click', () => {
      nav.classList.toggle('active');
    });
  }
});

// Firebase init
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

    // Registration
    const registerForm = document.getElementById('registerForm');
    if (registerForm){
      registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fullName = document.getElementById('fullName')?.value || "";
        const email = document.getElementById('email').value.trim();
        const phone = document.getElementById('phone')?.value.trim() || "";
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

    // Login
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

    // Dashboard
    if (window.location.pathname.includes('dashboard.html')){
      auth.onAuthStateChanged(async (user) => {
        if (!user) { window.location.href = 'login.html'; return; }
        const docRef = db.collection('users').doc(user.uid);
        let data;
        try {
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
          data = (await docRef.get()).data();

          // Fill user info
          document.getElementById('clientName').textContent = data.name || 'مستخدم';
          document.getElementById('clientEmail').textContent = data.email || '';
          document.getElementById('clientPhone').textContent = data.phone || '';
          document.getElementById('clientBalance').textContent = (Number(data.balance)||0) + ' $';

          // Transactions
          const txBody = document.getElementById('txBody');
          if (data.transactions && data.transactions.length){
            txBody.innerHTML = '';
            data.transactions.slice().reverse().forEach(tx => {
              const tr = document.createElement('tr');
              tr.innerHTML = `<td>${tx.type}</td><td>${tx.amount} $</td><td>${tx.date}</td><td>${tx.status||'—'}</td>`;
              txBody.appendChild(tr);
            });
          }

          // Deposit
          const depositBtn = document.getElementById('depositBtn');
          const depositModal = document.getElementById('depositModal');
          const closeDeposit = document.getElementById('closeDeposit');
          const confirmDeposit = document.getElementById('confirmDeposit');
          depositBtn.onclick = () => depositModal.classList.remove("hidden");
          closeDeposit.onclick = () => depositModal.classList.add("hidden");
          confirmDeposit.onclick = async () => {
            const amount = parseFloat(document.getElementById('depositAmount').value);
            if (!amount || amount <= 0) { alert('أدخل مبلغ صحيح'); return; }
            await docRef.update({ 
              transactions: firebase.firestore.FieldValue.arrayUnion({ 
                type:'إيداع', 
                amount, 
                date: new Date().toLocaleString(), 
                status: 'قيد الانتظار' 
              })
            });
            alert('✅ تم إرسال إشعار الإيداع (قيد الانتظار).');
            location.reload();
          };

          // Withdraw
          const withdrawBtn = document.getElementById('withdrawBtn');
          const withdrawModal = document.getElementById('withdrawModal');
          const closeWithdraw = document.getElementById('closeWithdraw');
          const confirmWithdraw = document.getElementById('confirmWithdraw');
          withdrawBtn.onclick = () => withdrawModal.classList.remove("hidden");
          closeWithdraw.onclick = () => withdrawModal.classList.add("hidden");

          confirmWithdraw.onclick = async () => {
            const amount = parseFloat(document.getElementById('withdrawAmount').value);
            const method = document.getElementById('withdrawMethod').value;
            if (!amount || amount <= 0) { alert('أدخل مبلغ صحيح'); return; }
            if (amount > (Number(data.balance)||0)) { alert('الرصيد غير كافٍ'); return; }

            let details = {};
            if (method === 'bank'){
              details = {
                bankName: document.getElementById('bankName').value,
                iban: document.getElementById('iban').value
              };
            } else if (method === 'crypto'){
              details = { usdtAddress: document.getElementById('usdtAddress').value };
            } else {
              alert('اختر طريقة السحب'); return;
            }

            await docRef.update({
              balance: (Number(data.balance) || 0) - amount,
              transactions: firebase.firestore.FieldValue.arrayUnion({ 
                type:'سحب', 
                amount, 
                date: new Date().toLocaleString(), 
                status: 'قيد الانتظار',
                method,
                ...details
              })
            });
            alert('✅ تم تسجيل طلب السحب (قيد الانتظار).');
            location.reload();
          };

          // Logout
          document.getElementById('logoutBtn')?.addEventListener('click', async (e) => {
            e.preventDefault();
            await auth.signOut();
            window.location.href = 'login.html';
          });

        } catch(err){
          console.error(err);
          alert('خطأ أثناء تحميل البيانات: ' + err.message);
        }
      });
    }

    window._fb = { auth, db };
  }

  initFirebaseAndApp();
})();

// Helpers
function copyAddress() {
  const address = document.getElementById("depositAddress").textContent;
  navigator.clipboard.writeText(address);
  alert("تم نسخ العنوان ✅");
}
function pasteAddress() {
  navigator.clipboard.readText().then(text => {
    document.getElementById("usdtAddress").value = text;
  });
}
