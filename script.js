// script.js - Supabase version
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_KEY = 'YOUR_SUPABASE_ANON_KEY';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Menu toggle
document.addEventListener('DOMContentLoaded', () => {
  const menuBtn = document.getElementById('menu-toggle');
  const nav = document.getElementById('nav-links') || document.querySelector('.nav-links');
  if (menuBtn && nav) {
    menuBtn.addEventListener('click', () => nav.classList.toggle('active'));
  }
});

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

// ---------- REGISTER ----------
const registerForm = document.getElementById('registerForm');
if (registerForm) {
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fullName = document.getElementById('fullName').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const password = document.getElementById('password').value;

    try {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName, phone } }
      });
      if (signUpError) throw signUpError;

      await supabase.from('clients').insert([{ 
        id: signUpData.user.id, 
        name: fullName, 
        email, 
        phone, 
        balance: 0 
      }]);

      alert('تم إنشاء الحساب بنجاح ✅');
      window.location.href = 'login.html';
    } catch(err) {
      alert('خطأ أثناء التسجيل: ' + err.message);
    }
  });
}

// ---------- LOGIN ----------
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      window.location.href = 'dashboard.html';
    } catch(err) {
      alert('خطأ أثناء تسجيل الدخول: ' + err.message);
    }
  });
}

// ---------- DASHBOARD ----------
if (window.location.pathname.includes('dashboard.html')) {
  supabase.auth.getSession().then(async ({ data: { session } }) => {
    if (!session) { window.location.href = 'login.html'; return; }
    const clientId = session.user.id;

    async function loadClientData() {
      const { data: client } = await supabase.from('clients').select('*').eq('id', clientId).single();
      document.getElementById('clientName').textContent = client.name;
      document.getElementById('clientEmail').textContent = client.email;
      document.getElementById('clientPhone').textContent = client.phone;
      document.getElementById('clientBalance').textContent = (Number(client.balance)||0) + ' USD';

      const { data: txs } = await supabase.from('transactions')
        .select('*').eq('client_id', clientId).order('created_at', { ascending: false });
      const txBody = document.getElementById('txBody');
      txBody.innerHTML = txs.length ? txs.map(tx => `
        <tr>
          <td>${tx.type}</td>
          <td>${tx.amount} ${tx.currency}</td>
          <td>${new Date(tx.created_at).toLocaleString()}</td>
          <td>قيد الانتظار</td>
        </tr>
      `).join('') : '<tr><td colspan="4">لا توجد معاملات بعد</td></tr>';
    }

    await loadClientData();

    // Logout
    document.getElementById('logoutBtn')?.addEventListener('click', async (e) => {
      e.preventDefault();
      await supabase.auth.signOut();
      window.location.href = 'login.html';
    });

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
      await supabase.from('transactions').insert([{
        client_id: clientId,
        type: 'deposit',
        amount,
        currency: 'USDT'
      }]);
      alert('✅ تم تسجيل طلب الإيداع (قيد الانتظار).');
      depositModal.classList.add("hidden");
      loadClientData();
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

      const { data: client } = await supabase.from('clients').select('*').eq('id', clientId).single();
      if (amount > (Number(client.balance) || 0)) { alert('الرصيد غير كافٍ'); return; }

      let details = {};
      if (method === 'bank') {
        details = {
          bankName: document.getElementById('bankName').value,
          iban: document.getElementById('iban').value
        };
      } else if (method === 'crypto') {
        details = { usdtAddress: document.getElementById('usdtAddress').value };
      } else { alert('اختر طريقة السحب'); return; }

      await supabase.from('transactions').insert([{
        client_id: clientId,
        type: 'withdraw',
        amount,
        currency: 'USDT',
        ...details
      }]);
      await supabase.from('clients').update({ balance: client.balance - amount }).eq('id', clientId);

      alert('✅ تم تسجيل طلب السحب (قيد الانتظار).');
      withdrawModal.classList.add("hidden");
      loadClientData();
    };
  });
}
