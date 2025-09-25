const firebaseConfig = {"apiKey": "AIzaSyCFYr3mTYs3BFvtnIcuFEjkSfJV3kPrzXk", "authDomain": "ads-company-2e012.firebaseapp.com", "projectId": "ads-company-2e012", "storageBucket": "ads-company-2e012.firebasestorage.app", "messagingSenderId": "706203585878", "appId": "1:706203585878:web:98c58764c1c7f95f1e5af7", "measurementId": "G-BKSKHM3Z2S"};


firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Navigation toggle
document.addEventListener('DOMContentLoaded', ()=> {
  const menuToggle = document.getElementById('menuToggle') || document.getElementById('menuToggle2') || document.getElementById('menuToggle3') || document.getElementById('menuToggle4');
  const navLinks = document.getElementById('navLinks') || document.getElementById('navLinks2') || document.getElementById('navLinks3') || document.getElementById('navLinks4');
  if(menuToggle){
    menuToggle.addEventListener('click', ()=>{ 
      navLinks.classList.toggle('active'); 
      document.body.style.overflow = navLinks.classList.contains('active') ? 'hidden' : '';
    });
  }

  const navAnchors = document.querySelectorAll('.nav-links a');
  navAnchors.forEach(a=> a.addEventListener('click', ()=>{ if(navLinks) { navLinks.classList.remove('active'); document.body.style.overflow = ''; }}));

  // Contact form (local only)
  const contactForm = document.getElementById('contactForm');
  if(contactForm){ contactForm.addEventListener('submit', (e) => { e.preventDefault(); alert('تم إرسال رسالتك! سنراجعها قريبًا.'); contactForm.reset(); }); }

  // Register form
  const reg = document.getElementById('registerForm');
  if(reg){ reg.addEventListener('submit', async (e)=>{ e.preventDefault();
      const name = document.getElementById('rname').value.trim();
      const email = document.getElementById('remail').value.trim();
      const phone = document.getElementById('rphone').value.trim();
      const password = document.getElementById('rpassword').value;
      if(!name||!email||!phone||!password){ alert('اكمل جميع الحقول'); return; }
      try{ const uc = await auth.createUserWithEmailAndPassword(email, password);
           const uid = uc.user.uid;
           await db.collection('users').doc(uid).set({ name, email, phone, balance: 0 });
           alert('تم إنشاء الحساب بنجاح!');
           window.location.href = 'dashboard.html';
      }catch(err){ alert(err.message); }
  }); }

  // Login form
  const login = document.getElementById('loginForm');
  if(login){ login.addEventListener('submit', async (e)=>{ e.preventDefault();
      const email = document.getElementById('lemail').value.trim();
      const password = document.getElementById('lpassword').value;
      try{ await auth.signInWithEmailAndPassword(email, password); window.location.href = 'dashboard.html'; }catch(err){ alert(err.message); }
  }); }

  // Dashboard actions (only if dashboard present)
  const logoutBtn = document.getElementById('logoutBtn');
  if(logoutBtn){ logoutBtn.addEventListener('click', ()=>{ auth.signOut(); window.location.href = 'index.html'; }); }

  const showDeposit = document.getElementById('showDeposit');
  const showWithdraw = document.getElementById('showWithdraw');
  const depositPanel = document.getElementById('depositPanel');
  const withdrawPanel = document.getElementById('withdrawPanel');
  if(showDeposit) showDeposit.addEventListener('click', ()=>{ depositPanel.classList.remove('hidden'); withdrawPanel.classList.add('hidden'); });
  if(showWithdraw) showWithdraw.addEventListener('click', ()=>{ withdrawPanel.classList.remove('hidden'); depositPanel.classList.add('hidden'); });

  const copyBtn = document.getElementById('copyAddr');
  if(copyBtn){ copyBtn.addEventListener('click', ()=>{ navigator.clipboard.writeText('0x7F8125C197B845E1F0682A9846B94A11cA9d9743'); alert('تم نسخ العنوان'); }); }

  const sendWithdraw = document.getElementById('sendWithdraw');
  if(sendWithdraw) sendWithdraw.addEventListener('click', async ()=>{ 
      const addr = document.getElementById('withdrawAddr').value.trim();
      const amount = parseFloat(document.getElementById('withdrawAmount').value);
      const user = auth.currentUser;
      if(!user){ alert('يجب تسجيل الدخول'); return; }
      if(!addr || !amount || amount<=0){ alert('أدخل عنوان وقيمة صحيحة'); return; }
      try{ await db.collection('withdrawRequests').add({ userId: user.uid, address: addr, amount, date: new Date(), status: 'pending' }); alert('تم إرسال طلب السحب'); document.getElementById('withdrawAddr').value=''; document.getElementById('withdrawAmount').value=''; loadWithdraws(user.uid); }catch(err){ alert(err.message); }
  });

  // auth listener
  auth.onAuthStateChanged(async user => { 
    if(!user) return;
    // If on dashboard page, load user data
    const onDashboard = document.getElementById('uName')!==null;
    if(onDashboard){ 
      const doc = await db.collection('users').doc(user.uid).get();
      const data = doc.exists?doc.data():{};
      document.getElementById('uName').innerText = data.name||'مستخدم';
      document.getElementById('uEmail').innerText = data.email||user.email;
      document.getElementById('uPhone').innerText = data.phone||'-';
      document.getElementById('uBalance').innerText = (data.balance!=null)?data.balance:0;
      loadWithdraws(user.uid);
    }
  });

  // load withdraws for dashboard
  async function loadWithdraws(uid){ 
    const tbody = document.getElementById('withdrawTable');
    if(!tbody) return;
    tbody.innerHTML='';
    const snap = await db.collection('withdrawRequests').where('userId','==',uid).orderBy('date','desc').get();
    if(snap.empty){ tbody.innerHTML='<tr><td colspan="5">لا توجد طلبات</td></tr>'; return; }
    let i=1;
    snap.forEach(doc=>{ const d=doc.data(); const date = d.date && d.date.toDate ? d.date.toDate().toLocaleString('ar-EG') : ''; tbody.innerHTML += `<tr><td>${i++}</td><td style="word-break:break-all">${d.address}</td><td>${d.amount}</td><td>${date}</td><td>${d.status}</td></tr>`; });
  }

});
