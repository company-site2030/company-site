// script.js - Supabase Version
const SUPABASE_URL = 'https://zadripguedfnhlwqyzeu.supabase.co';
const SUPABASE_KEY = 'sb_publishable_zcquzxNSLHOxWdEzBbrAng_x2I0pluj';
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Menu toggle
document.addEventListener('DOMContentLoaded', () => {
  const menuBtn = document.getElementById('menu-toggle');
  const nav = document.getElementById('nav-links');
  if (menuBtn && nav) {
    menuBtn.addEventListener('click', () => nav.classList.toggle('active'));
  }
});

// REGISTER
const registerForm = document.getElementById('registerForm');
if (registerForm) {
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('fullName').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const password = document.getElementById('password').value;

    // Signup user
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ email, password });
    if (signUpError) return alert('خطأ أثناء التسجيل: ' + signUpError.message);

    // Create client record
    const { error: insertError } = await supabase.from('clients').insert([{ 
      id: signUpData.user.id,
      name,
      email,
      phone,
      balance: 0
    }]);
    if (insertError) return alert('خطأ أثناء حفظ البيانات: ' + insertError.message);

    alert('تم إنشاء الحساب ✅');
    window.location.href = 'dashboard.html';
  });
}

// LOGIN
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return alert('خطأ أثناء تسجيل الدخول: ' + error.message);

    window.location.href = 'dashboard.html';
  });
}

// DASHBOARD
async function loadDashboard() {
  const user = supabase.auth.user();
  if (!user) { window.location.href = 'login.html'; return; }

  // Fetch client data
  const { data: clients, error } = await supabase.from('clients').select('*').eq('id', user.id).single();
  if (error) return alert('خطأ في تحميل البيانات: ' + error.message);

  document.getElementById('clientName').textContent = clients.name || '--';
  document.getElementById('clientEmail').textContent = clients.email || '--';
  document.getElementById('clientPhone').textContent = clients.phone || '--';
  document.getElementById('clientBalance').textContent = (clients.balance || 0) + ' USDT';

  // Load transactions
  const { data: txs } = await supabase.from('transactions').select('*').eq('client_id', user.id).order('created_at', { ascending: false });
  const txBody = document.getElementById('txBody');
  if (!txs || txs.length === 0) {
    txBody.innerHTML = '<tr><td colspan="4">لا توجد معاملات بعد</td></tr>';
  } else {
    txBody.innerHTML = '';
    txs.forEach(tx => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${tx.type}</td><td>${tx.amount} USDT</td><td>${new Date(tx.created_at).toLocaleString()}</td><td>${tx.status||'—'}</td>`;
      txBody.appendChild(tr);
    });
  }

  // Deposit modal
  const depositBtn = document.getElementById('depositBtn');
  const depositModal = document.getElementById('depositModal');
  const closeDeposit = document.getElementById('closeDeposit');
  const confirmDeposit = document.getElementById('confirmDeposit');

  depositBtn.onclick = () => depositModal.classList.remove('hidden');
  closeDeposit.onclick = () => depositModal.classList.add('hidden');
  confirmDeposit.onclick = async () => {
    const amount = parseFloat(document.getElementById('depositAmount').value);
    if (!amount || amount <= 0) return alert('أدخل مبلغ صحيح');

    const { error: txError } = await supabase.from('transactions').insert([{
      client_id: user.id,
      type: 'deposit',
      amount,
      currency: 'USDT',
      created_at: new Date().toISOString(),
      status: 'قيد الانتظار'
    }]);
    if (txError) return alert('خطأ أثناء تسجيل الإيداع: ' + txError.message);

    alert('تم إرسال طلب الإيداع ✅');
    location.reload();
  };

  // Withdraw modal
  const withdrawBtn = document.getElementById('withdrawBtn');
  const withdrawModal = document.getElementById('withdrawModal');
  const closeWithdraw = document.getElementById('closeWithdraw');
  const confirmWithdraw = document.getElementById('confirmWithdraw');

  withdrawBtn.onclick = () => withdrawModal.classList.remove('hidden');
  closeWithdraw.onclick = () => withdrawModal.classList.add('hidden');
  confirmWithdraw.onclick = async () => {
    const amount = parseFloat(document.getElementById('withdrawAmount').value);
    const method = document.getElementById('withdrawMethod').value;
    if (!amount || amount <= 0) return alert('أدخل مبلغ صحيح');

    if (amount > clients.balance) return alert('الرصيد غير كافٍ');
    if (!method) return alert('اختر طريقة السحب');

    const details = method === 'bank' ? {
      bankName: document.getElementById('bankName').value,
      iban: document.getElementById('iban').value
    } : { usdtAddress: document.getElementById('usdtAddress').value };

    const { error: txError } = await supabase.from('transactions').insert([{
      client_id: user.id,
      type: 'withdraw',
      amount,
      currency: 'USDT',
      created_at: new Date().toISOString(),
      status: 'قيد الانتظار',
      ...details
    }]);
    if (txError) return alert('خطأ أثناء تسجيل السحب: ' + txError.message);

    // Update balance immediately (optional)
    await supabase.from('clients').update({ balance: clients.balance - amount }).eq('id', user.id);

    alert('تم تسجيل طلب السحب ✅');
    location.reload();
  };

  // Logout
  document.getElementById('logoutBtn')?.addEventListener('click', async (e) => {
    e.preventDefault();
    await supabase.auth.signOut();
    window.location.href = 'login.html';
  });
}

// Run dashboard loader if on dashboard page
if (window.location.pathname.includes('dashboard.html')) {
  loadDashboard();
}

// Helpers
function copyAddress() {
  const address = document.getElementById('depositAddress').textContent;
  navigator.clipboard.writeText(address);
  alert('تم نسخ العنوان ✅');
}
function pasteAddress() {
  navigator.clipboard.readText().then(text => document.getElementById('usdtAddress').value = text);
}
