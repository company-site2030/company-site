// script.js (Supabase)
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://zadripguedfnhlwqyzeu.supabase.co';
const SUPABASE_KEY = 'sb_publishable_zcquzxNSLHOxWdEzBbrAng_x2I0pluj';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Toggle menu
document.getElementById('menu-toggle')?.addEventListener('click', () => {
  document.getElementById('nav-links')?.classList.toggle('active');
});

// Helper functions
function showAlert(msg) { alert(msg); }
function formatAmount(amount) { return Number(amount).toFixed(2) + ' $'; }

// ----- REGISTER -----
const registerForm = document.getElementById('registerForm');
if (registerForm) {
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('fullName').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const password = document.getElementById('password').value;

    // Sign up user
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ email, password });
    if (signUpError) return showAlert('خطأ أثناء التسجيل: ' + signUpError.message);

    // Insert into clients table
    const { error: insertError } = await supabase.from('clients').insert([{
      id: signUpData.user.id,
      name, email, phone, balance: 0
    }]);
    if (insertError) return showAlert('خطأ أثناء حفظ البيانات: ' + insertError.message);

    showAlert('✅ تم إنشاء الحساب بنجاح');
    window.location.href = 'login.html';
  });
}

// ----- LOGIN -----
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({ email, password });
    if (loginError) return showAlert('خطأ أثناء تسجيل الدخول: ' + loginError.message);

    window.location.href = 'dashboard.html';
  });
}

// ----- DASHBOARD -----
if (window.location.pathname.includes('dashboard.html')) {
  async function loadDashboard() {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) { window.location.href = 'login.html'; return; }

    // Get client data
    const { data: clientData, error: clientError } = await supabase.from('clients')
      .select('*').eq('id', user.id).single();
    if (clientError) return showAlert('خطأ أثناء تحميل البيانات: ' + clientError.message);

    document.getElementById('clientName').textContent = clientData.name || '--';
    document.getElementById('clientEmail').textContent = clientData.email || '--';
    document.getElementById('clientPhone').textContent = clientData.phone || '--';
    document.getElementById('clientBalance').textContent = formatAmount(clientData.balance || 0);

    // Load transactions
    const { data: transactions, error: txError } = await supabase.from('transactions')
      .select('*').eq('client_id', user.id).order('created_at', { ascending: false });
    const txBody = document.getElementById('txBody');
    if (txError) return showAlert('خطأ أثناء تحميل المعاملات: ' + txError.message);

    if (!transactions.length) {
      txBody.innerHTML = '<tr><td colspan="4">لا توجد معاملات بعد</td></tr>';
    } else {
      txBody.innerHTML = '';
      transactions.forEach(tx => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${tx.type}</td>
          <td>${formatAmount(tx.amount)}</td>
          <td>${new Date(tx.created_at).toLocaleString()}</td>
          <td>${tx.status || '—'}</td>
        `;
        txBody.appendChild(tr);
      });
    }

    // Logout
    document.getElementById('logoutBtn')?.addEventListener('click', async () => {
      await supabase.auth.signOut();
      window.location.href = 'login.html';
    });

    // Deposit
    const depositBtn = document.getElementById('depositBtn');
    const depositModal = document.getElementById('depositModal');
    const closeDeposit = document.getElementById('closeDeposit');
    const confirmDeposit = document.getElementById('confirmDeposit');

    depositBtn.onclick = () => depositModal.classList.remove('hidden');
    closeDeposit.onclick = () => depositModal.classList.add('hidden');
    confirmDeposit.onclick = async () => {
      const amount = parseFloat(document.getElementById('depositAmount').value);
      if (!amount || amount <= 0) return showAlert('أدخل مبلغ صحيح');

      const { error } = await supabase.from('transactions').insert([{
        client_id: user.id,
        type: 'إيداع',
        amount,
        currency: 'USDT',
        status: 'قيد الانتظار'
      }]);
      if (error) return showAlert('خطأ أثناء إضافة الإيداع: ' + error.message);

      showAlert('✅ تم إرسال الإيداع (قيد الانتظار)');
      location.reload();
    };

    // Withdraw
    const withdrawBtn = document.getElementById('withdrawBtn');
    const withdrawModal = document.getElementById('withdrawModal');
    const closeWithdraw = document.getElementById('closeWithdraw');
    const confirmWithdraw = document.getElementById('confirmWithdraw');

    withdrawBtn.onclick = () => withdrawModal.classList.remove('hidden');
    closeWithdraw.onclick = () => withdrawModal.classList.add('hidden');
    confirmWithdraw.onclick = async () => {
      const amount = parseFloat(document.getElementById('withdrawAmount').value);
      const method = document.getElementById('withdrawMethod').value;
      if (!amount || amount <= 0) return showAlert('أدخل مبلغ صحيح');

      if (amount > clientData.balance) return showAlert('الرصيد غير كافٍ');

      let details = {};
      if (method === 'bank') {
        details = { bankName: document.getElementById('bankName').value, iban: document.getElementById('iban').value };
      } else if (method === 'crypto') {
        details = { usdtAddress: document.getElementById('usdtAddress').value };
      } else return showAlert('اختر طريقة السحب');

      const { error } = await supabase.from('transactions').insert([{
        client_id: user.id,
        type: 'سحب',
        amount,
        currency: 'USDT',
        status: 'قيد الانتظار',
        ...details
      }]);
      if (error) return showAlert('خطأ أثناء السحب: ' + error.message);

      // Update balance locally
      await supabase.from('clients').update({ balance: clientData.balance - amount }).eq('id', user.id);

      showAlert('✅ تم تسجيل طلب السحب (قيد الانتظار)');
      location.reload();
    };
  }

  loadDashboard();
}
