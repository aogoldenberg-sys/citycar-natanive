// ── STATE ──
const state = {
  phone: '',
  selectedCar: 'KIA Rio',
  selectedTariff: 'Городской',
  basePrice: 800,
  extras: 0,
  delivery: false,
  kasko: false,
  driver2: false,
};

// ── TIME ──
function updateTime(){
  const n=new Date();
  document.getElementById('statusTime').textContent=
    n.getHours().toString().padStart(2,'0')+':'+n.getMinutes().toString().padStart(2,'0');
}
setInterval(updateTime,10000); updateTime();

// ── SCREEN NAV ──
function showScreen(id){
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const s = document.getElementById(id);
  if (!s) return;
  s.classList.add('active');
  const vid = s.querySelector('video');
  if (vid) { vid.currentTime = 0; vid.play(); }
  const nav = document.querySelector('.bottom-nav');
  if (id === 's-wizard') {
    if (nav) nav.style.display = 'none';
  } else {
    if (nav) { nav.style.display = ''; nav.style.cssText = ''; }
  }
}

// ── SESSION ──
const SESSION_KEY = 'citycar_session';

function saveSession(phone, name, status) {
  const data = {
    phone: phone || '',
    name: name || '',
    verificationStatus: status || 'guest',
    savedAt: Date.now()
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(data));
}

function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch(e) { return null; }
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

function applySessionToProfile(session) {
  if (!session) return;

  // Имя — новые элементы
  // Обновляем подзаголовок «Личные данные» с реальными данными
  const personalSub = document.getElementById('profile-personal-sub');
  if (personalSub && session) {
    var parts = [];
    if (session.name)  parts.push(session.name.split(' ')[0]);
    if (session.email) parts.push(session.email);
    if (session.birth) parts.push(session.birth);
    personalSub.textContent = parts.length ? parts.join(' · ') : 'ФИО, дата рождения, email';
  }
  const nameDisplayEl = document.getElementById('profile-name-display');
  const nameEl = document.querySelector('.profile-name');
  const displayName = session.name || session.phone || 'Гость';
  if (nameDisplayEl) nameDisplayEl.textContent = displayName;
  if (nameEl && nameEl !== nameDisplayEl) nameEl.textContent = displayName;

  // Аватар — первая буква имени
  const avatarEl = document.getElementById('profile-avatar');
  if (avatarEl) {
    const firstLetter = (session.name || session.phone || 'Г').charAt(0).toUpperCase();
    avatarEl.textContent = firstLetter;
  }

  // Телефон
  const phoneDisplayEl = document.getElementById('profile-phone-display');
  if (phoneDisplayEl && session.phone) phoneDisplayEl.textContent = session.phone;
  document.querySelectorAll('.profile-phone').forEach(el => {
    if (session.phone) el.textContent = session.phone;
  });

  // Статус
  const statusMap = {
    verified: '<span style="font-size:19px">🟢</span><span class="status-verified">Верифицирован</span>',
    rejected:  '<span style="font-size:19px">🔴</span><span style="color:#ef4444">Документы отклонены</span>',
    pending:   '<span style="font-size:19px">🟡</span><span class="status-pending">На проверке документов</span>',
    guest:     '<span style="font-size:19px">⚪</span><span style="color:var(--text2)">Гость</span>'
  };
  const statusHtml = statusMap[session.verificationStatus] || statusMap.guest;
  const statusDisplayEl = document.getElementById('profile-status-display');
  const statusEl = document.querySelector('.profile-status');
  if (statusDisplayEl) statusDisplayEl.innerHTML = statusHtml;
  if (statusEl && statusEl !== statusDisplayEl) statusEl.innerHTML = statusHtml;

  // Подзаголовок личных данных — обновляется выше в блоке FIX 13

  // Подзаголовок документов
  const docsSub = document.getElementById('profile-docs-sub');
  if (docsSub) {
    try {
      const full = JSON.parse(localStorage.getItem('citycar_session') || '{}');
      if (full.pep && full.pep.timestamp) {
        const d = new Date(full.pep.timestamp);
        const dateStr = d.toLocaleDateString('ru-RU');
        docsSub.textContent = 'Подписаны ' + dateStr + ' · ПЭП 63-ФЗ';
      }
    } catch(e) {}
  }

  // Верификационный баннер
  const banner = document.querySelector('[data-banner="verification"]');
  if (banner) {
    if (!session || !session.phone ||
        session.verificationStatus === 'verified' ||
        session.verificationStatus === 'guest') {
      banner.style.display = 'none';
    } else if (session.verificationStatus === 'rejected') {
      banner.style.display = '';
      banner.style.background = 'rgba(239,68,68,0.1)';
      banner.style.borderColor = 'rgba(239,68,68,0.3)';
      const t = banner.querySelector('[data-banner-title]');
      const s = banner.querySelector('[data-banner-sub]');
      if (t) t.textContent = '❌ Документы отклонены';
      const reason = session.rejectionReason || '';
      if (s) s.textContent = reason ? ('Причина: ' + reason) : 'Исправьте документы в разделе «Личные данные»';
    } else if (session.verificationStatus === 'guest') {
      banner.style.display = 'none';
    } else {
      banner.style.display = '';
    }
  }
}

// ── ЛИЧНЫЕ ДАННЫЕ (шторка) ──
function showPersonalDataSheet() {
  let session = {};
  try { session = JSON.parse(localStorage.getItem('citycar_session') || '{}'); } catch(e) {}

  const name    = session.name    || '—';
  const phone   = session.phone   || '—';
  const email   = session.email   || '—';
  const birth   = session.birth   || '—';
  const license = session.license || '—';
  const status  = session.verificationStatus || 'guest';
  const statusLabels = { verified:'✅ Верифицирован', pending:'⏳ На проверке', rejected:'❌ Отклонён', guest:'⚪ Гость' };

  const html = `
    <div style="padding:0 0 16px">
      ${[
        ['👤', 'ФИО', name],
        ['📱', 'Телефон', phone],
        ['📧', 'Email', email],
        ['🎂', 'Дата рождения', birth],
        ['🚗', 'Серия/номер ВУ', license],
        ['🔍', 'Статус', statusLabels[status] || status]
      ].map(([icon, label, val]) => `
        <div style="display:flex;align-items:center;gap:12px;padding:13px 0;border-bottom:1px solid var(--border)">
          <div style="width:36px;height:36px;background:var(--card2);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:19px;flex-shrink:0">${icon}</div>
          <div style="flex:1">
            <div style="font-size:14px;color:var(--text3);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:2px">${label}</div>
            <div style="font-size:14px;color:var(--text1)">${val}</div>
          </div>
        </div>`).join('')}
      <div style="margin-top:16px">
        <button class="btn btn-ghost" onclick="closeSheet('sheet-personal');switchToSetup()">
          ✏️ Обновить данные
        </button>
      </div>
    </div>`;

  const cont = document.getElementById('personal-data-content');
  if (cont) cont.innerHTML = html;
  openSheet('sheet-personal');
}

// ── МОИ ДОКУМЕНТЫ (шторка с историей ПЭП) ──
function showMyDocsSheet() {
  let session = {};
  try { session = JSON.parse(localStorage.getItem('citycar_session') || '{}'); } catch(e) {}

  const pep = session.pep;
  const hasDocs = session.verificationStatus === 'pending' || session.verificationStatus === 'verified';

  let html = '';

  if (session.verificationStatus === 'verified' && !pep) {
    html += '<div style="background:rgba(5,150,105,0.07);border:1px solid rgba(5,150,105,0.25);border-radius:12px;padding:14px;margin-bottom:16px">' +
      '<div style="font-size:12px;color:var(--green);font-weight:600;margin-bottom:4px">✅ Верификация пройдена</div>' +
      '<div style="font-size:12px;color:var(--text2);line-height:1.6">Ваши документы проверены и подтверждены оператором.</div></div>';
  }

  if (pep) {
    const signDate = new Date(pep.timestamp);
    const dateStr  = signDate.toLocaleDateString('ru-RU', { day:'2-digit', month:'long', year:'numeric' });
    const timeStr  = signDate.toLocaleTimeString('ru-RU', { hour:'2-digit', minute:'2-digit' });

    // Блок ПЭП-записи
    html += `
      <div style="background:rgba(5,150,105,0.07);border:1px solid rgba(5,150,105,0.25);border-radius:12px;padding:14px;margin-bottom:16px">
        <div style="font-size:12px;color:var(--green);font-weight:600;margin-bottom:8px">🔐 Документы подписаны · ПЭП 63-ФЗ</div>
        <div style="font-size:12px;color:var(--text2);line-height:1.8">
          📅 Дата: <b>${dateStr}</b> в ${timeStr}<br>
          📱 Телефон: <b>${pep.phone}</b><br>
          🔑 Хэш подписи: <code style="font-size:10px;color:var(--text3)">${pep.hash}</code>
        </div>
      </div>`;

    // Список подписанных документов
    const docNames = {
      'citycar.opentgp.ru/docs/dogovor.pdf': { icon:'📋', name:'Договор аренды ТС', sub:'Условия аренды для физических лиц' },
      'citycar.opentgp.ru/docs/pd.pdf':      { icon:'🔒', name:'Согласие на обработку ПД', sub:'152-ФЗ · Персональные данные' },
      'citycar.opentgp.ru/docs/pravila.pdf': { icon:'📄', name:'Правила пользования', sub:'Условия и ответственность' }
    };

    html += `<div style="font-size:14px;color:var(--text3);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px">Подписанные документы</div>`;
    (pep.docs || []).forEach(url => {
      const doc = docNames[url] || { icon:'📄', name: url, sub: '' };
      html += `
        <div class="doc-item" onclick="openDoc('${url.split('/').pop().replace('.pdf','')}')">
          <div class="doc-icon">${doc.icon}</div>
          <div class="doc-info">
            <div class="doc-name">${doc.name}</div>
            <div class="doc-size">${doc.sub}</div>
          </div>
          <div style="display:flex;flex-direction:column;align-items:flex-end;gap:2px">
            <span style="font-size:10px;color:var(--green)">✓ подписан</span>
            <span class="doc-action">↗</span>
          </div>
        </div>`;
    });
  } else if (hasDocs) {
    html += `
      <div style="background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.2);border-radius:12px;padding:14px;margin-bottom:16px">
        <div style="font-size:12px;color:var(--gold);font-weight:600;margin-bottom:4px">⏳ Документы переданы на проверку</div>
        <div style="font-size:12px;color:var(--text2);line-height:1.5">Запись о подписании отсутствует. Возможно, документы были загружены без электронной подписи.</div>
      </div>`;
  } else {
    html += `
      <div style="text-align:center;padding:30px 0">
        <div style="font-size:40px;margin-bottom:12px">📋</div>
        <div style="font-size:14px;color:var(--text2);margin-bottom:16px">Документы ещё не загружены.<br>Заполните профиль чтобы начать аренду.</div>
        <button class="btn" onclick="closeSheet('sheet-my-docs');switchToSetup()">Заполнить профиль →</button>
      </div>`;
  }

  // Загруженные фото документов (статус)
  if (hasDocs) {
    html += `
      <div style="font-size:14px;color:var(--text3);text-transform:uppercase;letter-spacing:0.5px;margin:16px 0 10px">Загруженные файлы</div>
      ${[
        ['🪪','Паспорт — главная страница','Загружено'],
        ['🪪','Паспорт — страница прописки','Загружено'],
        ['🚗','Водительское удостоверение (лицевая)','Загружено'],
        ['🚗','Водительское удостоверение (обратная)','Загружено']
      ].map(([icon, name, status]) => `
        <div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--border)">
          <div style="font-size:20px">${icon}</div>
          <div style="flex:1;font-size:13px;color:var(--text1)">${name}</div>
          <div style="font-size:14px;color:var(--green)">✓ ${status}</div>
        </div>`).join('')}`;
  }

  const cont = document.getElementById('my-docs-content');
  if (cont) cont.innerHTML = html;
  openSheet('sheet-my-docs');
}

// ── ПРОСМОТР PDF ──
function openDoc(slug) {
  const docs = {
    dogovor: { title:'📋 Договор аренды ТС',           url:'https://citycar.opentgp.ru/app/docs/dogovor.pdf' },
    pd:      { title:'🔒 Политика конфиденциальности', url:'https://citycar.opentgp.ru/app/docs/PD.pdf' },
    pravila: { title:'🚗 Правила пользования',         url:'https://citycar.opentgp.ru/app/docs/dogovor.pdf' }
  };
  const doc = docs[slug];
  if (!doc) return;
  const titleEl  = document.getElementById('doc-view-title');
  const iframeEl = document.getElementById('doc-view-iframe');
  const linkEl   = document.getElementById('doc-view-link');
  if (titleEl)  titleEl.textContent = doc.title;
  if (iframeEl) iframeEl.src        = doc.url;
  if (linkEl)   { linkEl.href = doc.url; }
  // Закрываем список документов и открываем просмотр
  closeSheet('sheet-docs');
  setTimeout(()=>openSheet('sheet-doc-view'), 350);
}

function logout() {
  clearSession();
  state.phone = '';
  showScreen('s-auth');
  showAuthBlock('auth-phone-block');
  document.getElementById('phoneInput').value = '';
  showToastMsg('👋', 'Выход выполнен', 'До свидания!');
}

// ── SPLASH → AUTH или MAIN ──
setTimeout(() => {
  // Проверяем возврат с платёжной страницы T-Bank
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('payment') === 'success') {
    const bId = urlParams.get('booking') || '';
    window.history.replaceState({}, '', window.location.pathname);
    if (bId.startsWith('card_bind_')) {
      showToastMsg('💳', 'Карта привязана!', 'Теперь вы можете оплачивать бронирования');
    } else if (bId) {
      // Сохраняем bookingId в sessionStorage чтобы не потерять после перезагрузки
      try { sessionStorage.setItem('citycar_paid_booking', bId); } catch(_) {}
      // Уведомить оператора
      setTimeout(() => {
        const _sess = loadSession() || {};
        const now = new Date().toLocaleString('ru-RU', {timeZone:'Europe/Moscow'});
        sendTelegramMessage(TG_CHAT_OPERATOR,
`💳 <b>ОПЛАТА ПОДТВЕРЖДЕНА — CityCAR</b>

🆔 Заявка: <code>${bId}</code>
👤 ${_sess.phone || '—'}
🕐 ${now}`);
      }, 1000);
    }
  } else if (urlParams.get('payment') === 'fail') {
    window.history.replaceState({}, '', window.location.pathname);
    showToastMsg('❌', 'Оплата не прошла', 'Попробуйте ещё раз или свяжитесь с оператором');
    try { sessionStorage.removeItem('citycar_paid_booking'); } catch(_) {}
  }

  // Проверяем ссылку сброса пароля из email
  if (urlParams.get('reset') === '1' && urlParams.get('p')) {
    state.phone = decodeURIComponent(urlParams.get('p'));
    showScreen('s-auth');
    showAuthBlock('auth-newpwd-block');
    return;
  }

  const session = loadSession();
  if (session && session.phone) {
    // Восстанавливаем номер телефона в state
    state.phone = session.phone;
    showScreen('s-main');
    setTimeout(() => applySessionToProfile(session), 100);
    // Запускаем realtime listeners
    setTimeout(async () => {
      if (window.listenUserProfile) listenUserProfile(session.phone);
      checkActiveRental();
      // Грузим историю один раз при восстановлении сессии
      preloadBookingHistory();
    }, 500);
  } else {
    showScreen('s-auth');
  }
}, 2000);

// ── AUTH ──

// SHA-256 хэширование пароля
async function sha256(str) {
  const buf = new TextEncoder().encode(str);
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2,'0')).join('');
}

// Форматирование телефона: всегда с +
function authPhoneFormat(el) {
  // Берём только цифры
  let digits = el.value.replace(/\D/g, '');
  // Нормализуем к 11 цифрам начиная с 7
  if (digits.startsWith('8')) digits = '7' + digits.slice(1);
  else if (digits.startsWith('9')) digits = '7' + digits;
  // Ограничиваем до 11 цифр
  digits = digits.slice(0, 11);
  // Форматируем: +7 900 123 45 67
  let v = '';
  if (digits.length === 0) { el.value = ''; return; }
  v = '+' + digits[0];
  if (digits.length > 1) v += ' ' + digits.slice(1, 4);
  if (digits.length > 4) v += ' ' + digits.slice(4, 7);
  if (digits.length > 7) v += ' ' + digits.slice(7, 9);
  if (digits.length > 9) v += ' ' + digits.slice(9, 11);
  el.value = v;
}

// Переключение блоков авторизации
function showAuthBlock(id) {
  ['auth-phone-block','auth-register-block','auth-login-block',
   'auth-reset-block','auth-newpwd-block'].forEach(b => {
    const el = document.getElementById(b);
    if (el) el.style.display = 'none';
  });
  const el = document.getElementById(id);
  if (el) el.style.display = 'block';
}

// Шаг 1: проверка номера в Firestore
async function checkPhone() {
  const rawPhone = document.getElementById('phoneInput').value.trim();
  const p = '+' + rawPhone.replace(/\D/g,''); // убираем пробелы, оставляем цифры с +7
  if (p.replace(/\D/g,'').length < 11) {
    showToastMsg('⚠️','Ошибка','Введите полный номер телефона');
    return;
  }
  state.phone = p;
  const btn = document.getElementById('btn-check-phone');
  if (btn) { btn.disabled = true; btn.textContent = 'Проверяем...'; }
  try {
    const userData = window.getFirestoreUser ? await window.getFirestoreUser(p) : null;
    if (userData && userData.passwordHash) {
      document.getElementById('login-phone-display').textContent = p;
      showAuthBlock('auth-login-block');
      setTimeout(() => document.getElementById('loginPassword').focus(), 200);
    } else {
      document.getElementById('reg-phone-display').textContent = p;
      showAuthBlock('auth-register-block');
      setTimeout(() => document.getElementById('regPassword').focus(), 200);
    }
  } catch(e) {
    // Ошибка Firestore — показываем регистрацию как запасной вариант
    document.getElementById('reg-phone-display').textContent = p;
    showAuthBlock('auth-register-block');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Продолжить →'; }
  }
}

// Шаг 2A: регистрация нового пользователя
async function registerUser() {
  const pwd  = document.getElementById('regPassword').value;
  const pwd2 = document.getElementById('regPassword2').value;
  const email = document.getElementById('regEmail').value.trim();
  if (!/^\d{6,}$/.test(pwd)) {
    showToastMsg('⚠️','Ошибка','Пароль: минимум 6 цифр');
    return;
  }
  if (pwd !== pwd2) {
    showToastMsg('⚠️','Ошибка','Пароли не совпадают');
    return;
  }
  if (!email.includes('@') || !email.includes('.')) {
    showToastMsg('⚠️','Ошибка','Введите корректный email');
    return;
  }
  const btn = document.getElementById('btn-register');
  if (btn) { btn.disabled = true; btn.textContent = 'Сохраняем...'; }
  try {
    const hash = await sha256(pwd);
    if (window.saveUserToFirestore) {
      await window.saveUserToFirestore(state.phone, {
        passwordHash: hash,
        email: email,
        verificationStatus: 'guest',
        bonusPoints:          0,
        totalCoinsEarned:     0,
        firstTripBonusPaid:   false,
        monthlyTrips:         0,
        monthlyTripsMonth:    '',
        totalTrips:           0,
        consecutiveCleanTrips:0
      });
    }
    // Приветственное письмо
    fetch(WORKER_URL + '/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: email, phone: state.phone, type: 'welcome' })
    }).catch(() => {});
    // Telegram уведомление
    const now = new Date().toLocaleString('ru-RU', {timeZone:'Europe/Moscow'});
    sendTelegramMessage(TG_CHAT_OPERATOR,
`🆕 <b>НОВАЯ РЕГИСТРАЦИЯ — CityCAR</b>
📱 Телефон: <b>${state.phone}</b>
📧 Email: ${email}
🕐 ${now}`);
    saveSession(state.phone, '', 'guest');
    enterApp('✅','Добро пожаловать!','Регистрация прошла успешно');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Зарегистрироваться →'; }
  }
}

// Шаг 2B: вход существующего пользователя
async function loginUser() {
  const pwd = document.getElementById('loginPassword').value;
  if (!pwd) { showToastMsg('⚠️','Ошибка','Введите пароль'); return; }
  const btn = document.getElementById('btn-login');
  if (btn) { btn.disabled = true; btn.textContent = 'Проверяем...'; }
  try {
    const hash = await sha256(pwd);
    const userData = window.getFirestoreUser ? await window.getFirestoreUser(state.phone) : null;
    if (!userData || userData.passwordHash !== hash) {
      showToastMsg('❌','Неверный пароль','Попробуйте ещё раз или нажмите «Забыли пароль?»');
      return;
    }
    // Сохраняем ВСЕ поля из Firestore в сессию — не только имя и статус
    const full = {
      phone:              state.phone,
      name:               userData.name               || '',
      email:              userData.email              || '',
      birth:              userData.birth              || '',
      license:            userData.license            || '',
      licenseDate:        userData.licenseDate        || '',
      verificationStatus: userData.verificationStatus || 'guest',
      bonusPoints:        userData.bonusPoints        || 0,
      totalCoinsEarned:   userData.totalCoinsEarned   || 0,
      rebillId:           userData.rebillId           || '',
      cardMasked:         userData.cardMasked         || '',
      savedAt:            Date.now()
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(full));
    const now = new Date().toLocaleString('ru-RU', {timeZone:'Europe/Moscow'});
    sendTelegramMessage(TG_CHAT_OPERATOR,
`📲 <b>ВХОД — CityCAR</b>
📱 Телефон: <b>${state.phone}</b>
🕐 ${now}`);
    enterApp('✅','С возвращением!','Рады видеть вас снова');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Войти →'; }
  }
}

// Открыть форму сброса пароля (с предзаполненным email)
async function showForgotPassword() {
  showAuthBlock('auth-reset-block');
  try {
    if (window.getFirestoreUser) {
      const userData = await window.getFirestoreUser(state.phone);
      if (userData && userData.email) {
        document.getElementById('resetEmail').value = userData.email;
      }
    }
  } catch(e) {}
}

// Отправить письмо со ссылкой для сброса
async function sendResetEmail() {
  const email = document.getElementById('resetEmail').value.trim();
  if (!email.includes('@') || !email.includes('.')) {
    showToastMsg('⚠️','Ошибка','Введите корректный email');
    return;
  }
  const btn = document.getElementById('btn-reset');
  if (btn) { btn.disabled = true; btn.textContent = 'Отправляем...'; }
  try {
    const resp = await fetch(WORKER_URL + '/reset-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: state.phone, email })
    });
    const res = await resp.json();
    if (res.ok) {
      showToastMsg('📧','Письмо отправлено!','Перейдите по ссылке из письма');
      showAuthBlock('auth-login-block');
    } else {
      showToastMsg('⚠️','Ошибка', res.error || 'Не удалось отправить письмо');
    }
  } catch(e) {
    showToastMsg('⚠️','Ошибка','Нет соединения с сервером');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Отправить ссылку →'; }
  }
}

// Установить новый пароль (по ссылке из email)
async function setNewPassword() {
  const pwd  = document.getElementById('newPassword').value;
  const pwd2 = document.getElementById('newPassword2').value;
  if (!/^\d{6,}$/.test(pwd)) {
    showToastMsg('⚠️','Ошибка','Пароль: минимум 6 цифр');
    return;
  }
  if (pwd !== pwd2) {
    showToastMsg('⚠️','Ошибка','Пароли не совпадают');
    return;
  }
  const btn = document.getElementById('btn-newpwd');
  if (btn) { btn.disabled = true; btn.textContent = 'Сохраняем...'; }
  try {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('t');
    const w = params.get('w');
    // Верифицируем токен через Worker
    const resp = await fetch(WORKER_URL + '/verify-reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: state.phone, token, w })
    });
    const res = await resp.json();
    if (!res.ok) {
      showToastMsg('❌','Ссылка устарела','Запросите новую ссылку для сброса пароля');
      showAuthBlock('auth-phone-block');
      return;
    }
    const hash = await sha256(pwd);
    if (window.saveUserToFirestore) {
      await window.saveUserToFirestore(state.phone, { passwordHash: hash });
    }
    // Очищаем URL от параметров сброса
    window.history.replaceState({}, '', window.location.pathname);
    saveSession(state.phone, '', 'guest');
    enterApp('✅','Пароль изменён!','Теперь входите с новым паролем');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Сохранить пароль →'; }
  }
}

// Вернуться к вводу номера
function backToPhone() {
  ['regPassword','regPassword2','loginPassword','resetEmail',
   'newPassword','newPassword2'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  showAuthBlock('auth-phone-block');
}

// Войти в приложение после успешной авторизации
function enterApp(icon, title, msg) {
  showScreen('s-main');
  if (icon) showToastMsg(icon, title, msg);
  setTimeout(() => applySessionToProfile(loadSession()), 100);
  setTimeout(async () => {
    if (window.listenUserProfile) listenUserProfile(state.phone);
    if (window.checkActiveRental) checkActiveRental();
    // Грузим историю один раз при входе
    preloadBookingHistory();
  }, 2000);
  // Push запрашивается только по клику пользователя (кнопка в профиле)
  // Автоматический запрос заблокирован браузерами по требованиям безопасности
}

// ── SETUP ──
let setupStep = 0;
const SETUP_TOTAL = 4; // 0,1,2,3

function isUploaded(type) {
  // Проверяем загружен ли файл — по наличию превью img в upload-box
  const box = document.getElementById('ubox-' + type);
  if (!box) return false;
  return box.querySelector('img') !== null || box.dataset.uploaded === 'true';
}

function setupNext0withAgeCheck() {
  var birth = (document.getElementById('setupBirth') || {}).value || '';
  if (birth.length === 10) {
    var p = birth.split('.');
    var bd = new Date(parseInt(p[2]), parseInt(p[1])-1, parseInt(p[0]));
    var years = Math.floor((new Date() - bd) / 31557600000);
    if (years < 18) {
      showToastMsg('❌','Ограничение','Аренда доступна только с 18 лет');
      return;
    }
  }
  setupNext(0);
}

// ── СТАТИСТИКА ПРОФИЛЯ ──────────────────────────────────────────────────────
async function updateProfileStats() {
  const sess = loadSession() || {};
  const phone = sess.phone;
  const tripsEl = document.getElementById('stat-trips');
  const bonusEl = document.getElementById('stat-bonus');
  const kmEl    = document.getElementById('stat-km');

  // Проверяем штрафы в фоне
  if (phone) setTimeout(checkAndShowFinesBadge, 500);

  // Fallback на кэш из сессии
  const showCached = () => {
    if (tripsEl) tripsEl.textContent = sess.totalTrips || '0';
    if (bonusEl) bonusEl.textContent = (sess.bonusPoints || 0).toLocaleString('ru-RU') + ' 🪙';
    if (kmEl)    kmEl.textContent    = (sess.totalKm || 0) > 0 ? sess.totalKm + ' км' : '0 км';
  };

  if (!phone) { showCached(); return; }
  if (!window._firestoreDB) { showCached(); return; }

  // Используем только уже загруженные данные — без дополнительных запросов к Firebase
  // Бонусы: из onSnapshot кэша (обновляется в реальном времени)
  const cached = window._cachedUserData;
  let bonus     = (cached ? (cached.bonusPoints || 0) : 0) || sess.bonusPoints || 0;
  let totalEver = (cached ? (cached.totalCoinsEarned || 0) : 0) || sess.totalCoinsEarned || bonus;

  // Поездки: из кэша истории (загружается при входе)
  let trips = 0, km = 0;
  if (window._historyCache && window._historyCache.length > 0) {
    window._historyCache.forEach(b => {
      if (b.status === 'done' || b.status === 'finished') {
        trips++;
        km += Number(b.km || 0);
      }
    });
  } else {
    trips = sess.totalTrips || 0;
    km    = sess.totalKm    || 0;
  }

  if (tripsEl) tripsEl.textContent = trips;
  if (bonusEl) bonusEl.textContent = bonus.toLocaleString('ru-RU') + ' 🪙';
  if (kmEl)    kmEl.textContent    = km > 0 ? km.toLocaleString('ru-RU') + ' км' : '0 км';

  if (typeof getLoyaltyLevel === 'function') {
    const lvl = getLoyaltyLevel(totalEver);
    const lvlEl = document.getElementById('profile-loyalty-badge');
    if (lvlEl) { lvlEl.textContent = lvl.icon + ' ' + lvl.label; lvlEl.style.color = lvl.color; }
  }
}

// ── ИСТОРИЯ ПОЕЗДОК ──────────────────────────────────────────────────────────
// loadAndShowHistory → переименована в renderBookingHistory (см. ниже)
async function loadAndShowHistory() {
  return renderBookingHistory();
}

function setupNext(step) {
  // Шаг 1 — паспорт: проверяем хотя бы главную страницу
  if (step === 1) {
    if (!isUploaded('passport-main')) {
      showToastMsg('⚠️','Загрузите паспорт','Сфотографируйте главную страницу паспорта');
      return;
    }
  }
  // Шаг 2 — права: проверяем лицевую сторону
  if (step === 2) {
    if (!isUploaded('license-front')) {
      showToastMsg('⚠️','Загрузите права','Сфотографируйте лицевую сторону водительского удостоверения');
      return;
    }
  }
  // Валидация шага 0
  if (step === 0) {
    const name = (document.getElementById('setupName') || {}).value || '';
    const birth = (document.getElementById('setupBirth') || {}).value || '';
    if (name.trim().split(' ').length < 2) {
      showToastMsg('⚠️', 'Ошибка', 'Введите фамилию и имя');
      return;
    }
    if (!birth.trim()) {
      showToastMsg('⚠️', 'Ошибка', 'Укажите дату рождения');
      return;
    }
  }
  document.getElementById('setup-s' + step).style.display = 'none';
  setupStep = step + 1;
  document.getElementById('setup-s' + setupStep).style.display = 'block';
  document.getElementById('sd' + step).className = 'step-dot done';
  if (setupStep < SETUP_TOTAL) {
    document.getElementById('sd' + setupStep).className = 'step-dot active';
  }
  // Прокрутка вверх
  const scroll = document.querySelector('.setup-scroll');
  if (scroll) scroll.scrollTop = 0;
}

function setupBack(step) {
  document.getElementById('setup-s' + step).style.display = 'none';
  setupStep = step - 1;
  document.getElementById('setup-s' + setupStep).style.display = 'block';
  document.getElementById('sd' + (step - 1)).className = 'step-dot active';
  document.getElementById('sd' + step).className = 'step-dot';
  const scroll = document.querySelector('.setup-scroll');
  if (scroll) scroll.scrollTop = 0;
}

// Шаг 2 → 3: проверяем ВУ через реальный API SpectrumData
function setupCheckFinesAndNext() {
  // Проверка ВУ через SpectrumData занимает до 30 сек — делается оператором в CRM.
  // Здесь просто переходим на следующий шаг без задержки.
  const block = document.getElementById('fines-check-block');
  if (block) {
    block.style.display = 'block';
    block.innerHTML = '<div style="background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.2);border-radius:12px;padding:12px;font-size:12px;color:var(--text2)">✅ Данные сохранены — оператор проверит ВУ и свяжется с вами</div>';
  }
  setTimeout(setupGoToSummary, 600);
}

// Переход на шаг 3 (сводка)
function setupGoToSummary() {
  // Заполняем сводку
  const name    = (document.getElementById('setupName') || {}).value || '—';
  const birth   = (document.getElementById('setupBirth') || {}).value || '—';
  const email   = (document.getElementById('setupEmail') || {}).value || '—';
  const license = (document.getElementById('setupLicenseNum') || {}).value || '—';
  const el = id => { const e = document.getElementById(id); if(e) e.textContent = v; };
  const set = (id, v) => { const e = document.getElementById(id); if(e) e.textContent = v; };
  set('sum-setup-name', name);
  set('sum-setup-birth', birth);
  set('sum-setup-email', email);
  set('sum-setup-license', license);

  // Штрафы на итоговом экране
  const finesWarn = document.getElementById('setup-fines-warning');
  if (finesWarn) {
    if (window._setupFines && window._setupFines.count > 0) {
      finesWarn.style.display = 'block';
      const ft = document.getElementById('setup-fines-text');
      if (ft) ft.innerHTML =
        'Найдено штрафов: <b>' + window._setupFines.count + '</b> на сумму <b>' + window._setupFines.total + ' ₽</b>.<br>' +
        'Аренда не блокируется, но рекомендуем оплатить до поездки. ' +
        '<a href="https://gosuslugi.ru/pay/fines" target="_blank" style="color:var(--blue2)">Оплатить →</a>';
    } else {
      finesWarn.style.display = 'none';
    }
  }
  setupNext(2);
}

function finishSetup() {
  // Сохраняем данные анкеты во временное хранилище (до подписания)
  window._pendingProfile = {
    name:        (document.getElementById('setupName') || {}).value || '',
    email:       (document.getElementById('setupEmail') || {}).value || '',
    license:     (document.getElementById('setupLicenseNum') || {}).value || '',
    licenseDate: (document.getElementById('setupLicenseDate') || {}).value || '',
    birth:       (document.getElementById('setupBirth') || {}).value || '',
    hasFines:    window._setupFines ? true : false,
    finesData:   window._setupFines || null
  };
  // Переходим на экран согласий
  resetConsentScreen();
  showScreen('s-consent');
}

function resetConsentScreen() {
  // Сбрасываем все чекбоксы
  [0,1,2].forEach(i => {
    const cb = document.getElementById('cc-' + i);
    if (cb) { cb.classList.remove('checked'); }
    const card = document.getElementById('cdoc-' + i);
    if (card) card.classList.remove('signed');
    // Закрываем тело документа
    const body = document.getElementById('cdoc-body-' + i);
    const arrow = document.getElementById('cdoc-arrow-' + i);
    if (body) body.classList.remove('open');
    if (arrow) arrow.classList.remove('open');
  });
  window._consentState = [false, false, false];
  updateConsentButton();
}

function toggleConsentDoc(idx) {
  const body  = document.getElementById('cdoc-body-' + idx);
  const arrow = document.getElementById('cdoc-arrow-' + idx);
  if (!body) return;
  const isOpen = body.classList.contains('open');
  body.classList.toggle('open', !isOpen);
  if (arrow) arrow.classList.toggle('open', !isOpen);
}

function toggleConsent(idx) {
  if (!window._consentState) window._consentState = [false, false, false];
  window._consentState[idx] = !window._consentState[idx];
  const cb   = document.getElementById('cc-' + idx);
  const card = document.getElementById('cdoc-' + idx);
  if (cb)   cb.classList.toggle('checked',   window._consentState[idx]);
  if (card) card.classList.toggle('signed',  window._consentState[idx]);
  updateConsentButton();
}

function updateConsentButton() {
  const btn = document.getElementById('consent-submit-btn');
  if (!btn) return;
  const allSigned = window._consentState && window._consentState.every(Boolean);
  btn.disabled = !allSigned;
  btn.style.opacity = allSigned ? '1' : '0.4';
  // Обновляем подпись под кнопкой
  const hint = btn.nextElementSibling;
  if (hint) hint.textContent = allSigned
    ? 'Все документы подписаны — можно продолжить'
    : 'Отметьте все три пункта чтобы продолжить';
}

// Простой текстовый хэш для фиксации версии документов (djb2)
function simpleHash(str) {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
    hash = hash & hash; // 32-bit
  }
  return (hash >>> 0).toString(16);
}

function submitConsents() {
  if (!window._consentState || !window._consentState.every(Boolean)) {
    showToastMsg('⚠️', 'Ошибка', 'Отметьте все три пункта');
    return;
  }

  const now = new Date();
  const ts  = now.toISOString();
  const session = loadSession() || {};
  const phone = session.phone || '—';

  // Строки-идентификаторы документов (URL + дата подписания + телефон)
  const docUrls = [
    'citycar.opentgp.ru/docs/dogovor.pdf',
    'citycar.opentgp.ru/docs/pd.pdf',
    'citycar.opentgp.ru/docs/pravila.pdf'
  ];
  const signPayload = docUrls.map(url => url + '|' + ts + '|' + phone).join('||');
  const signHash = simpleHash(signPayload);

  // Запись ПЭП
  const pepRecord = {
    phone:     phone,
    timestamp: ts,
    hash:      signHash,
    docs:      docUrls,
    method:    'SMS-OTP + checkbox (63-ФЗ ПЭП)'
  };

  // Сохраняем в localStorage
  try {
    const full = JSON.parse(localStorage.getItem('citycar_session') || '{}');
    const profile = window._pendingProfile || {};
    full.name     = profile.name    || full.name || '';
    full.email    = profile.email   || '';
    full.license  = profile.license || '';
    full.birth    = profile.birth   || '';
    full.hasFines = profile.hasFines || false;
    full.finesData = profile.finesData || null;
    full.verificationStatus = 'pending';
    full.pep = pepRecord;
    localStorage.setItem('citycar_session', JSON.stringify(full));
  } catch(e) {}

  // Сохраняем profileData ДО сброса _pendingProfile
  const profileData = window._pendingProfile || {};
  const profileName = profileData.name || session.name || '';

  saveSession(phone, profileName, 'pending');

  // Telegram — отправляем пока profileData ещё не null
  const nowStr = new Date().toLocaleString('ru-RU', {timeZone:'Europe/Moscow'});

  // Результат проверки ВУ через SpectrumData
  const lic = window._licenseCheck || {};
  const licLine = lic.valid === true
    ? `\n✅ ВУ проверено: действительно` + (lic.categories ? `, кат. ${lic.categories}` : '') + (lic.expires ? `, до ${lic.expires}` : '')
    : lic.valid === false
    ? `\n❌ ВУ НЕДЕЙСТВИТЕЛЬНО: ${lic.reason || '—'}`
    : '';
  const nameMismatchLine = lic.nameMismatch
    ? `\n⚠️ ФИО в базе ГИБДД: ${lic.fullName || '—'}`
    : '';

  // OCR результаты
  const ocrL = window._ocrLicense || {};
  const ocrP = window._ocrPassport || {};
  const ocrLicLine  = ocrL.fullName ? `\n🔍 OCR ВУ: ${ocrL.fullName}, ${(ocrL.series||'')} ${(ocrL.number||'')}` : '';
  const ocrPassLine = ocrP.fullName ? `\n🔍 OCR Паспорт: ${ocrP.fullName}, ${(ocrP.series||'')} ${(ocrP.number||'')}` : '';

  // Совпадение ФИО
  const nameMatchLine = (() => {
    const inp = (profileData.name || '').toLowerCase().trim();
    const ocr = (ocrP.fullName || '').toLowerCase().trim();
    if (!ocr || !inp) return '';
    return ocr.indexOf(inp.split(' ')[0]) !== -1
      ? '\n✅ ФИО совпадает (анкета = OCR паспорта)'
      : '\n❌ ФИО НЕ совпадает! Анкета: ' + profileData.name + ' / OCR: ' + ocrP.fullName;
  })();

  sendTelegramMessage(TG_CHAT_OPERATOR,
`📋 <b>НОВЫЙ ПОЛЬЗОВАТЕЛЬ — CityCAR</b>

👤 <b>${profileName || '—'}</b>
📱 ${phone}
📧 ${profileData.email || '—'}
🎂 ${profileData.birth || '—'}
🚗 ВУ: ${profileData.license || '—'}${licLine}${nameMismatchLine}${ocrLicLine}${ocrPassLine}${nameMatchLine}

✍️ Документы подписаны (ПЭП 63-ФЗ)
🔑 Хэш: ${signHash}
🕐 ${nowStr}
📲 Требуется верификация документов`);

  // Собираем URL загруженных фото документов
  const uploadState = window._uploadState || {};
  const passportMain  = (uploadState['passport-main']  && uploadState['passport-main'].url)  || '';
  const passportReg   = (uploadState['passport-reg']   && uploadState['passport-reg'].url)   || '';
  const licenseFront  = (uploadState['license-front']  && uploadState['license-front'].url)  || '';
  const licenseBack   = (uploadState['license-back']   && uploadState['license-back'].url)   || '';

  // Сохраняем в Firestore users
  if (window.saveUserToFirestore) {
    window.saveUserToFirestore(phone, {
      name:               profileName,
      email:              profileData.email   || '',
      license:            profileData.license     || '',
      licenseDate:        profileData.licenseDate || '',
      birth:              profileData.birth    || '',
      passport:           profileData.passport || '',
      hasFines:           profileData.hasFines || false,
      verificationStatus: 'pending',
      pep:                pepRecord,
      createdAt:          new Date().toISOString(),
      passportMain:       passportMain,
      passportReg:        passportReg,
      licenseFront:       licenseFront,
      licenseBack:        licenseBack,
      // Результаты автопроверок
      licenseCheckValid:  lic.valid !== undefined ? String(lic.valid) : '',
      licenseCategories:  lic.categories || '',
      licenseExpires:     lic.expires || '',
      nameMismatch:       lic.nameMismatch ? 'true' : 'false',
      ocrLicenseName:     ocrL.fullName || '',
      ocrPassportName:    ocrP.fullName || '',
      ocrPassportSeries:  ocrP.series   || '',
      ocrPassportNumber:  ocrP.number   || ''
    });
  }

  // listenUserProfile уже запущен при входе в приложение — повторный вызов не нужен

  // Сброс — только после того как всё использовали
  window._setupFines = null;
  window._pendingProfile = null;
  window._licenseCheck = null;
  window._ocrLicense = null;
  window._ocrPassport = null;
  const finesBlock = document.getElementById('fines-check-block');
  if (finesBlock) { finesBlock.style.display = 'none'; finesBlock.innerHTML = ''; }

  // Переходим в приложение
  showScreen('s-main');
  applySessionToProfile(loadSession());
  showToastMsg('✅', 'Документы подписаны!', 'Оператор проверит данные в течение 15 минут.');
}
// ── REAL UPLOAD ──
// Состояние загрузки: { type: { status, url, file } }
window._uploadState = {};

const UPLOAD_LABELS = {
  'passport-main':  'Паспорт — главная страница',
  'passport-reg':   'Паспорт — страница прописки',
  'license-front':  'ВУ — лицевая сторона',
  'license-back':   'ВУ — обратная сторона'
};

function realUpload(type) {
  const inp = document.getElementById('file-input-' + type);
  if (inp) inp.click();
}

function handleFileSelected(input, type) {
  const file = input.files[0];
  if (!file) return;
  input.value = ''; // сбрасываем сразу — повторный выбор того же файла тоже сработает

  // Показываем сжатие
  const box = document.getElementById('ubox-' + type);
  if (box) {
    box.style.borderColor = 'var(--blue2)';
    box.innerHTML = '<div class="upload-icon" style="animation:spin 1s linear infinite">⏳</div><div class="upload-label" style="color:var(--blue2)">Подготовка фото...</div>';
  }

  // Сжимаем фото через Canvas перед отправкой
  compressImage(file, 1600, 0.82, function(compressed) {
    uploadDocToFirebase(type, compressed);
  });
}

// Сжатие изображения через Canvas (макс 1600px, качество 0.82)
function compressImage(file, maxSize, quality, callback) {
  // Если не картинка или уже маленькая — отправляем как есть
  if (!file.type.startsWith('image/') || file.size < 300 * 1024) {
    callback(file);
    return;
  }
  const reader = new FileReader();
  reader.onload = function(e) {
    const img = new Image();
    img.onload = function() {
      let w = img.width, h = img.height;
      if (w > maxSize || h > maxSize) {
        if (w > h) { h = Math.round(h * maxSize / w); w = maxSize; }
        else       { w = Math.round(w * maxSize / h); h = maxSize; }
      }
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      canvas.toBlob(function(blob) {
        if (!blob) { callback(file); return; }
        // Создаём новый File из blob
        const compressed = new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' });
        callback(compressed);
      }, 'image/jpeg', quality);
    };
    img.onerror = function() { callback(file); };
    img.src = e.target.result;
  };
  reader.onerror = function() { callback(file); };
  reader.readAsDataURL(file);
}

async function uploadDocToFirebase(type, file) {
  const box = document.getElementById('ubox-' + type);
  if (!box) return;

  const inp = document.getElementById('file-input-' + type);
  if (inp) inp.value = '';

  box.style.borderColor = 'var(--blue2)';
  box.style.borderStyle = 'dashed';
  box.innerHTML = `
    <div class="upload-icon" style="animation:spin 1s linear infinite">⏳</div>
    <div class="upload-label" style="color:var(--blue2)">Загружаем на сервер...</div>
    <div class="upload-hint">Пожалуйста, подождите</div>`;

  try {
    const session = loadSession() || {};
    const phone = (session.phone || 'unknown').replace(/\D/g, '');
    const ext = (file.name || 'photo').split('.').pop().replace(/heic|heif/i, 'jpg') || 'jpg';
    const fileName = type + '_' + Date.now() + '.jpg';

    const formData = new FormData();
    formData.append('file', file, fileName);
    formData.append('fileName', fileName);
    formData.append('phone', phone);
    formData.append('type', type);

    // Таймаут 60 секунд — iOS на слабом соединении может долго загружать
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    let resp;
    try {
      resp = await fetch('https://citycar-upload.aogoldenberg.workers.dev/', {
        method: 'POST',
        body: formData,
        signal: controller.signal
      });
    } finally {
      clearTimeout(timeoutId);
    }

    if (!resp.ok) {
      let errText = 'HTTP ' + resp.status;
      try { const t = await resp.text(); if (t) errText += ': ' + t.slice(0, 120); } catch(_) {}
      throw new Error(errText);
    }

    let result;
    try {
      result = await resp.json();
    } catch(_) {
      throw new Error('Сервер вернул неверный ответ. Попробуйте ещё раз.');
    }

    if (!result.ok) throw new Error(result.error || 'Upload failed');

    const url = result.url;
    window._uploadState[type] = { status: 'done', url, file };

    try {
      const raw = JSON.parse(localStorage.getItem('citycar_session') || '{}');
      if (!raw.docs) raw.docs = {};
      raw.docs[type] = url;
      localStorage.setItem('citycar_session', JSON.stringify(raw));
    } catch(e) {}

    box.style.borderColor = 'var(--green)';
    box.dataset.uploaded = 'true';
    box.style.borderStyle = 'solid';
    box.innerHTML = `
      <div style="position:relative;width:100%;height:100%">
        <img src="${url}" alt="${UPLOAD_LABELS[type]}"
          style="width:100%;height:140px;object-fit:cover;border-radius:10px;display:block">
        <div style="position:absolute;top:8px;right:8px;background:var(--green);border-radius:20px;padding:3px 10px;font-size:14px;color:#fff;font-weight:600">✓ Загружено</div>
        <div style="font-size:14px;color:var(--text3);margin-top:6px;text-align:center">Нажмите для замены</div>
      </div>`;

    showToastMsg('✅', 'Фото загружено', UPLOAD_LABELS[type]);
    checkAllUploaded();

  } catch(e) {
    let errMsg = e.message || 'Неизвестная ошибка';
    if (e.name === 'AbortError') {
      errMsg = 'Время ожидания истекло. Проверьте интернет и попробуйте снова.';
    } else if (errMsg === 'Failed to fetch' || errMsg === 'Load failed' || errMsg.includes('NetworkError')) {
      errMsg = 'Нет соединения с сервером. Проверьте интернет и попробуйте снова.';
    }

    box.style.borderColor = 'var(--red)';
    box.style.borderStyle = 'dashed';
    box.dataset.uploaded = '';
    box.innerHTML = `
      <div class="upload-icon">❌</div>
      <div class="upload-label" style="color:var(--red)">Ошибка загрузки</div>
      <div class="upload-hint">Нажмите чтобы попробовать снова</div>`;
    showToastMsg('❌', 'Ошибка загрузки', errMsg);
    console.error('[Upload] ' + type + ':', e);
  }
}

// Проверяем что все 4 документа загружены — разблокируем кнопку «Далее»
function checkAllUploaded() {
  const required = ['passport-main', 'passport-reg'];
  const licenseRequired = ['license-front', 'license-back'];
  const step = parseInt(document.querySelector('[id^="setup-s"]:not([style*="display:none"])')?.id?.replace('setup-s','') || '0');
  if (step === 1) {
    const allOk = required.every(t => window._uploadState[t]);
    const btn = document.querySelector('#setup-s1 .btn');
    if (btn) { btn.style.opacity = allOk ? '1' : '0.5'; }
  }
  if (step === 2) {
    const allOk = licenseRequired.every(t => window._uploadState[t]);
    const btn = document.getElementById('btn-setup-s2-next');
    if (btn) { btn.style.opacity = allOk ? '1' : '0.5'; }
  }
}

// Получить все загруженные URLs для Telegram/Firebase
function getUploadedDocs() {
  const result = {};
  Object.entries(window._uploadState).forEach(([type, data]) => {
    if (data.url) result[type] = data.url;
  });
  return result;
}

// ── OCR: распознавание ВУ в фоне ─────────────────────────────────────────────
async function runOcrLicense(imageUrl) {
  try {
    const resp = await fetch('https://citycar-upload.aogoldenberg.workers.dev/ocr-license', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageUrl })
    });
    if (!resp.ok) return;
    const data = await resp.json();
    if (data.ok) {
      window._ocrLicense = data;
      console.log('[OCR License]', data);
      // Если номер ВУ из OCR совпадает с введённым — тихо подтверждаем
      const inputVal = ((document.getElementById('setupLicenseNum') || {}).value || '').replace(/\s/g,'').toUpperCase();
      const ocrSeries = (data.series || '').replace(/\s/g,'').toUpperCase();
      const ocrNumber = (data.number || '').replace(/\s/g,'').toUpperCase();
      const ocrFull   = ocrSeries + ocrNumber;
      const inputFull = inputVal.replace(/[^0-9А-ЯA-Z]/gi,'');
      if (ocrFull && inputFull && ocrFull === inputFull) {
        showToastMsg('✅', 'Данные ВУ совпадают', 'Серия/номер подтверждены по скану');
      } else if (ocrFull && inputFull && ocrFull !== inputFull) {
        showToastMsg('⚠️', 'Проверьте номер ВУ', 'По скану: ' + ocrSeries + ' ' + ocrNumber);
      }
    }
  } catch(e) { console.warn('[OCR License]', e.message); }
}

// ── OCR: распознавание паспорта в фоне ───────────────────────────────────────
async function runOcrPassport(imageUrl) {
  try {
    const resp = await fetch('https://citycar-upload.aogoldenberg.workers.dev/ocr-passport', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageUrl })
    });
    if (!resp.ok) return;
    const data = await resp.json();
    if (data.ok) {
      window._ocrPassport = data;
      console.log('[OCR Passport]', data);
      // Сверяем ФИО из паспорта с тем что пользователь ввёл в анкете
      const inputName = ((document.getElementById('setupName') || {}).value || '').toLowerCase().trim();
      const ocrName   = (data.fullName || '').toLowerCase().trim();
      if (ocrName && inputName && ocrName.indexOf(inputName.split(' ')[0]) !== -1) {
        showToastMsg('✅', 'Паспорт распознан', 'ФИО совпадает с анкетой');
      } else if (ocrName && inputName) {
        showToastMsg('⚠️', 'Проверьте ФИО', 'В паспорте: ' + data.fullName);
      }
    }
  } catch(e) { console.warn('[OCR Passport]', e.message); }
}

// CSS анимация спиннера
if (!document.getElementById('upload-spin-style')) {
  const style = document.createElement('style');
  style.id = 'upload-spin-style';
  style.textContent = '@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }';
  document.head.appendChild(style);
}
function switchToSetup(){
  // Предзаполняем поля анкеты из сессии если данные уже есть
  try {
    const sess = JSON.parse(localStorage.getItem('citycar_session') || '{}');
    if (sess.name)        { const el = document.getElementById('setupName');        if (el && !el.value) el.value = sess.name; }
    if (sess.email)       { const el = document.getElementById('setupEmail');       if (el && !el.value) el.value = sess.email; }
    if (sess.birth)       { const el = document.getElementById('setupBirth');       if (el && !el.value) el.value = sess.birth; }
    if (sess.license)     { const el = document.getElementById('setupLicenseNum');  if (el && !el.value) el.value = sess.license; }
    if (sess.licenseDate) { const el = document.getElementById('setupLicenseDate'); if (el && !el.value) el.value = sess.licenseDate; }
  } catch(e) {}
  showScreen('s-setup');
}


// ── FLEET CATALOG ──
// Данные по умолчанию (fallback если Firestore недоступен)
const FLEET_DEFAULT = [
  {
    id: 'kia', name: 'KIA Rio', class: 'Компактный седан · 2023',
    emoji: '🚗', color: 'linear-gradient(135deg,var(--blue),var(--blue))',
    price: 400, status: 'free',
    specs: ['⚙️ АКПП','❄️ Кондиционер','🎵 Bluetooth','🧳 480 л','⛽ 6.5 л/100'],
    addr: 'ул. Плехановская, 1', lat: 51.6630, lng: 39.1999
  },
  {
    id: 'skoda', name: 'Skoda Rapid', class: 'Лифтбек C-класса · 2023',
    emoji: '🚙', color: 'linear-gradient(135deg,#1a4a7a,var(--blue2))',
    price: 400, status: 'free',
    specs: ['⚙️ АКПП','❄️ Кондиционер','🧳 530 л','⛽ 7 л/100'],
    addr: 'пр. Революции, 30', lat: 51.6720, lng: 39.2090
  },
  {
    id: 'logan', name: 'Renault Logan', class: 'Седан B-класса · 2023',
    emoji: '🏎', color: 'linear-gradient(135deg,#0f3460,#06B6D4)',
    price: 400, status: 'busy', busyUntil: '18:00',
    specs: ['⚙️ МКПП','❄️ Кондиционер','🧳 510 л','⛽ 6 л/100'],
    addr: 'ул. Кольцовская, 24', lat: 51.6580, lng: 39.1850
  }
];

window._fleetData = [];
let _fleetData = window._fleetData;
let _fleetFilter = 'all';

// Загружаем автопарк из Firestore (запускает onSnapshot через startFleetListener)
async function loadFleetCatalog() {
  try {
    // Дополнительное ожидание db на случай если вызов пришёл рано
    let db = window._firestoreDB;
    if (!db) {
      for (let i = 0; i < 30; i++) {
        await new Promise(r => setTimeout(r, 100));
        db = window._firestoreDB;
        if (db) break;
      }
    }
    if (!db) throw new Error('no db');

    // Если данные уже пришли через onSnapshot — сразу рендерим
    if (window._fleetData && window._fleetData.length > 0) {
      _fleetData = window._fleetData;
      renderFleetTab(); renderBookingCars(); renderMapCarsStrip();
      if (typeof refreshMapPlacemarks === 'function') setTimeout(refreshMapPlacemarks, 100);
      _hideSplashAndStart();
      return;
    }

    // Делаем первый быстрый getDocs чтобы не ждать onSnapshot
    const { collection: col, getDocs } =
      await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
    const snap = await getDocs(col(db, 'fleet'));
    if (!snap.empty) {
      window._fleetData = [];
      snap.forEach(d => window._fleetData.push({ id: d.id, ...d.data() }));
      _fleetData = window._fleetData;
    }
    // Если в Firebase пусто — оставляем пустой массив (не показываем хардкод)
  } catch(e) {
    console.warn('[Fleet] loadFleetCatalog:', e.message);
    // При ошибке сети — оставляем что было, не затираем хардкодом
    if (!window._fleetData || !window._fleetData.length) {
      window._fleetData = [];
      _fleetData = [];
    }
  }
  renderFleetTab();
  renderBookingCars();
  renderMapCarsStrip();
  if (typeof refreshMapPlacemarks === 'function') {
    setTimeout(refreshMapPlacemarks, 100);
  }
  // ── ПЕРЕХОД СО СПЛЭША ──
  _hideSplashAndStart();
}

function _hideSplashAndStart() {
  const splash = document.getElementById('s-splash');
  if (!splash || !splash.classList.contains('active')) return; // уже ушли

  // Анимация исчезновения
  splash.style.transition = 'opacity .5s ease';
  splash.style.opacity = '0';
  setTimeout(() => {
    splash.classList.remove('active');
    splash.style.opacity = '';
    splash.style.transition = '';

    // Определяем куда вести пользователя
    const session = loadSession();
    if (session && session.phone && session.verificationStatus !== undefined) {
      showScreen('s-main');
      // Запускаем слушатель профиля
      setTimeout(() => {
        // Единственный слушатель профиля — listenUserProfile (startUserListener дублировал)
        if (window.listenUserProfile) window.listenUserProfile(session.phone);
        checkActiveRental();
      }, 500);
    } else {
      showScreen('s-auth');
    }
  }, 500);
}

function filterFleet(f) {
  _fleetFilter = f;
  ['all','free'].forEach(id => {
    const btn = document.getElementById('ff-' + id);
    if (!btn) return;
    const isActive = id === f;
    btn.style.background = isActive ? 'var(--blue)' : 'transparent';
    btn.style.color = isActive ? '#fff' : 'rgba(255,255,255,0.6)';
    btn.style.border = isActive ? 'none' : '1px solid rgba(255,255,255,0.2)';
  });
  renderFleetTab();
  renderMapCarsStrip();
  refreshMapPlacemarks();
}

function renderFleetTab() {
  const list = document.getElementById('fleet-list');
  const sub  = document.getElementById('fleet-sub');
  if (!list) return;

  let cars = _fleetFilter === 'free'
    ? _fleetData.filter(c => c.status === 'free')
    : _fleetData;

  const total = _fleetData.length;
  const free  = _fleetData.filter(c => c.status === 'free').length;
  if (sub) sub.textContent = `${total} авто · ${free} свободно · Воронеж 24/7`;

  if (cars.length === 0) {
    list.innerHTML = `<div style="text-align:center;padding:60px 20px;color:var(--text2)">
      <div style="font-size:40px;margin-bottom:12px">😴</div>
      <div>Все автомобили заняты</div>
      <div style="font-size:12px;color:var(--text3);margin-top:6px">Попробуйте позже</div>
    </div>`;
    return;
  }

  list.innerHTML = '<div style="display:flex;flex-direction:column;gap:16px;padding:8px 20px 24px">' +
    cars.map(car => {
      const isFree = isCarFree(car);
      const statusTxt = carStatusText(car);
      const badgeHtml = isFree
        ? '<span class="fleet-badge">Свободен</span>'
        : `<span class="fleet-badge busy">${statusTxt || 'Занят'}</span>`;

      var _carPhoto = car.photo || car.photoUrl || car.imageUrl || car.image || (car.photos && car.photos[0]) || null;
      var imgHtml = _carPhoto
        ? '<img class="fleet-car-img" src="' + _carPhoto + '" alt="' + (car.name||'') + '" onerror="this.style.display=\"none\";this.nextElementSibling.style.display=\"flex\"">'
        : '';
      var emojiFb = '<div class="car-emoji-fb" style="display:none;align-items:center;justify-content:center;width:100%;height:100%;font-size:80px">' + (car.emoji || '🚗') + '</div>';

      const specsHtml = (car.specs || []).map(s => `<span class="spec-chip">${s}</span>`).join('');

      const bookable = isCarBookable(car);
      const btnHtml = bookable
        ? `<button class="btn-book" onclick="openBookingWizard('car','${car.name}')">${isFree ? 'Забронировать' : 'Забронировать заранее'}</button>`
        : `<button class="btn-book" style="opacity:0.5;cursor:default">Недоступен</button>`;

      return `
        <div class="fleet-card" onclick="${isFree ? `selectCarAndRoute('${car.id}')` : ''}">
          <div class="fleet-card-header" style="background:${car.color || 'linear-gradient(135deg,var(--blue),var(--blue))'}">
            ${imgHtml}${emojiFb}
            ${badgeHtml}
          </div>
          <div class="fleet-card-body">
            <div class="fleet-card-title">${car.name}</div>
            <div class="fleet-card-class">${car.class || ''}</div>
            ${car.addr ? `<div style="font-size:12px;color:var(--text3);margin-bottom:10px">📍 ${car.addr}</div>` : ''}
            <div class="fleet-specs">${specsHtml}</div>
            <div class="fleet-price-row">
              <div class="fleet-price" id="fleet-price-${car.id || car.name}"></div>
              ${btnHtml}
            </div>
          </div>
        </div>`;
    }).join('') + '</div>';
}

// Выбрать авто + показать маршрут на карте
function selectCarAndRoute(carId) {
  const car = _fleetData.find(c => c.id === carId);
  if (!car || !isCarBookable(car)) return;
  // Переключаем на карту и строим маршрут
  switchTab('map');
  if (window.ymapsReady && car.lat && car.lng) {
    const carCoords = [car.lat, car.lng];
    window._selectedCarCoords = carCoords;
    window._selectedCar = car;
    setTimeout(() => buildRouteToCar(), 300);
  }
}

// Загружаем при старте
window.addEventListener('DOMContentLoaded', () => {
  // Страховка — уходим со сплэша через 8 сек в любом случае
  setTimeout(() => { _hideSplashAndStart(); }, 8000);

  // Ждём пока Firebase-модуль установит window._firestoreDB
  // type="module" выполняется асинхронно — даём до 5 секунд (50 попыток × 100мс)
  let attempts = 0;
  const waitForFirebase = setInterval(() => {
    attempts++;
    if (window._firestoreDB) {
      // Firebase готов — запускаем
      clearInterval(waitForFirebase);
      loadFleetCatalog();
      // Запускаем realtime слушатель автопарка
      if (window.startFleetListener) window.startFleetListener();
    } else if (attempts >= 50) {
      // 5 секунд прошло — Firebase так и не поднялся, показываем пустой список
      clearInterval(waitForFirebase);
      console.warn('[Firebase] _firestoreDB не готов после 5 сек');
      window._fleetData = [];
      _hideSplashAndStart();
    }
  }, 100);
});

// Перезагружаем при переключении на вкладку
const _origSwitchTab = window.switchTab;


// Рендер списка авто в форме бронирования — из _fleetData
function renderBookingCars(preselect) {
  const list = document.getElementById('booking-cars-list');
  if (!list) return;
  // Берём данные — из Firebase если загружены, иначе дефолтные
  const cars = (window._fleetData && window._fleetData.length > 0) 
    ? window._fleetData 
    : FLEET_DEFAULT;
  list.innerHTML = cars.map(car => {
    const isFree    = isCarFree(car);
    const bookable  = isCarBookable(car);
    const statusTxt = carStatusText(car);

    let subText, priceText, cardStyle, cardClick;

    if (isFree) {
      subText   = (car.class || '') + ' · Свободен';
      priceText = '';
      cardStyle = '';
      cardClick = `selectCar('pc-${car.id}','${car.name}')`;
    } else if (bookable) {
      // Можно забронировать заранее — показываем с предупреждением
      subText   = statusTxt || 'Временно недоступен';
      priceText = '';
      cardStyle = 'border-color:rgba(245,158,11,0.4);background:rgba(245,158,11,0.04)';
      cardClick = `selectCar('pc-${car.id}','${car.name}')`;
    } else {
      // Полностью недоступен (нет даты окончания)
      subText   = statusTxt || 'Недоступен';
      priceText = '';
      cardStyle = 'opacity:0.4;cursor:default';
      cardClick = `showToastMsg('🚫','Недоступно','${car.name} временно недоступен')`;
    }

    return `
      <div class="pick-card"
        id="pc-${car.id}"
        onclick="${cardClick}"
        style="${cardStyle}">
        <div class="pick-card-icon">${car.emoji || '🚗'}</div>
        <div class="pick-card-info">
          <div class="pick-card-name">${car.name}</div>
          <div class="pick-card-sub" style="${(!isFree && bookable) ? 'color:var(--gold)' : ''}">${subText}</div>
          <div class="pick-card-price">${priceText}</div>
        </div>
        <div class="radio-dot"></div>
      </div>`;
  }).join('');

  // Преселект если передано имя авто
  if (preselect) {
    const car = cars.find(c => c.name === preselect && isCarBookable(c));
    if (car) selectCar('pc-' + car.id, car.name);
  }
}


// Рендер карточек авто над картой
function renderMapCarsStrip() {
  const strip = document.getElementById('map-cars-strip');
  if (!strip) return;
  const cars = (window._fleetData && window._fleetData.length > 0)
    ? window._fleetData : [];
  if (cars.length === 0) { strip.innerHTML = ''; return; }
  strip.innerHTML = cars
    .filter(c => isCarFree(c))
    .map(c => {
      var cp = c.photo || c.photoUrl || c.imageUrl || c.image || (c.photos && c.photos[0]) || null;
      return `<div class="car-mini" onclick="ymapFlyTo(${c.lat},${c.lng||c.lon},'${c.name}')">
        ${cp ? `<img src="${cp}" style="width:100%;height:60px;object-fit:cover;border-radius:8px 8px 0 0" onerror="this.remove()">` : ''}
        <div class="car-mini-name">${c.emoji||'🚗'} ${c.name}</div>
        <div class="car-mini-info">${c.addr||''}</div>
      </div>`;
    }).join('');
}


// Перерисовываем метки на карте после загрузки данных из Firebase
if (!window._ymapCarPlacemarks) window._ymapCarPlacemarks = [];
function refreshMapPlacemarks() {
  if (!ymapReady || !ymapInstance) return;

  // Удаляем только сохранённые метки авто (не трогаем пользователя и зоны)
  window._ymapCarPlacemarks.forEach(function(p) {
    try { ymapInstance.geoObjects.remove(p); } catch(e) {}
  });
  window._ymapCarPlacemarks = [];

  // Добавляем актуальные и сохраняем ссылки
  getCarsForMap().forEach(function(car) {
    if (!car.lat || !car.lon) return;
    var placemark = new ymaps.Placemark([car.lat, car.lon], {
      balloonContentHeader: car.emoji + ' ' + car.name,
      balloonContentBody: '<div style="font-size:13px;line-height:1.6">' +
        '<b>' + car.addr + '</b><br>' +
        (car.status === 'free'
          ? '<span style="color:var(--green)">✓ Свободна</span>'
          : '<span style="color:#EF4444">✗ Занята</span>') +
        '</div>',
      iconContent: car.emoji
    }, {
      preset: car.status === 'free' ? 'islands#greenStretchyIcon' : 'islands#redStretchyIcon'
    });
    placemark.events.add('click', (function(c) {
      return function() { openCarSheet(c); };
    })(car));
    ymapInstance.geoObjects.add(placemark);
    window._ymapCarPlacemarks.push(placemark); // сохраняем для удаления
  });
}


// ── DATETIME HELPERS для бронирования ──
function initBookDateLimits() {
  const dateEl = document.getElementById('bookDate');
  const timeEl = document.getElementById('bookTime');
  if (!dateEl) return;
  const pad = n => String(n).padStart(2,'0');

  // Ищем выбранное авто
  const carName = state.selectedCar;
  const carData = carName && window._fleetData
    ? window._fleetData.find(c => c.name === carName) : null;

  const availFrom = carData ? carAvailableFrom(carData) : null;
  const minDt = availFrom && availFrom > new Date()
    ? availFrom
    : new Date();

  const minDateStr = minDt.getFullYear()+'-'+pad(minDt.getMonth()+1)+'-'+pad(minDt.getDate());
  dateEl.min = minDateStr;

  // Сегодня — максимальная дата тоже сегодня (не даём выбрать завтра)
  const now = new Date();
  const nowDateStr = now.getFullYear()+'-'+pad(now.getMonth()+1)+'-'+pad(now.getDate());
  // Если авто свободен сейчас — ограничиваем только сегодняшней датой
  if (!availFrom || availFrom <= now) {
    dateEl.max = nowDateStr;
  } else {
    // Авто занят — max = дата когда освободится
    const availDateStr = availFrom.getFullYear()+'-'+pad(availFrom.getMonth()+1)+'-'+pad(availFrom.getDate());
    dateEl.max = availDateStr;
  }

  // Подставляем текущую дату и время (+1 мин) по умолчанию
  const defaultDt = minDt > now ? minDt : new Date(now.getTime() + 60000);
  const defaultDateStr = defaultDt.getFullYear()+'-'+pad(defaultDt.getMonth()+1)+'-'+pad(defaultDt.getDate());
  dateEl.value = defaultDateStr;

  if (timeEl) {
    // Минимум: сейчас +1 мин
    const minTime = new Date(now.getTime() + 60000);
    // Максимум: сейчас +30 мин
    const maxTime = new Date(now.getTime() + 30 * 60000);

    timeEl.value = pad(defaultDt.getHours())+':'+pad(defaultDt.getMinutes());

    if (defaultDateStr === nowDateStr) {
      timeEl.min = pad(minTime.getHours())+':'+pad(minTime.getMinutes());
      timeEl.max = pad(maxTime.getHours())+':'+pad(maxTime.getMinutes());
    } else {
      timeEl.min = '00:00';
      timeEl.max = '23:59';
    }
  }

  // Показываем подсказку если авто недоступен до определённой даты
  let hintEl = document.getElementById('book-date-hint');
  if (availFrom && availFrom > new Date()) {
    if (!hintEl) {
      hintEl = document.createElement('div');
      hintEl.id = 'book-date-hint';
      hintEl.style.cssText = 'font-size:12px;color:var(--gold);padding:6px 10px;border-radius:8px;background:rgba(245,158,11,0.1);margin-top:4px;text-align:center';
      dateEl.parentNode.parentNode.insertAdjacentElement('afterend', hintEl);
    }
    hintEl.textContent = '⚠️ Авто доступен для бронирования с ' + (carData.blockedUntilStr || minDateStr);
    hintEl.style.display = 'block';
  } else if (hintEl) {
    hintEl.style.display = 'none';
  }

  // Показываем подсказку об ограничении времени
  let timeHintEl = document.getElementById('book-time-hint');
  if (!timeHintEl) {
    timeHintEl = document.createElement('div');
    timeHintEl.id = 'book-time-hint';
    timeHintEl.style.cssText = 'font-size:12px;color:var(--text3);padding:4px 10px;margin-top:4px;text-align:center';
    const timeParent = timeEl ? timeEl.parentNode.parentNode : null;
    if (timeParent) timeParent.insertAdjacentElement('afterend', timeHintEl);
  }
  if (timeHintEl) timeHintEl.textContent = '⏱ Старт аренды — от 1 до 30 минут от сейчас';
}

function onBookDateChange() {
  const dateEl = document.getElementById('bookDate');
  const timeEl = document.getElementById('bookTime');
  if (!dateEl || !timeEl) return;
  const today = new Date();
  const pad = n => String(n).padStart(2,'0');
  const todayStr = today.getFullYear()+'-'+pad(today.getMonth()+1)+'-'+pad(today.getDate());
  if (dateEl.value === todayStr) {
    const minTime = new Date(today.getTime() + 1*60000);
    const maxTime = new Date(today.getTime() + 30*60000);
    timeEl.min = pad(minTime.getHours())+':'+pad(minTime.getMinutes());
    timeEl.max = pad(maxTime.getHours())+':'+pad(maxTime.getMinutes());
    if (timeEl.value && timeEl.value < timeEl.min) timeEl.value = '';
    if (timeEl.value && timeEl.value > timeEl.max) timeEl.value = pad(maxTime.getHours())+':'+pad(maxTime.getMinutes());
  } else {
    timeEl.min = '00:00';
    timeEl.max = '23:59';
  }
  const statusEl = document.getElementById('avail-status');
  if (statusEl) statusEl.textContent = '';
  if (timeEl.value) checkAndShowAvailability();
}

function onBookTimeChange() {
  checkAndShowAvailability();
  // Скрываем hint после выбора времени — статус уже показан
  const hintEl = document.getElementById('book-date-hint');
  if (hintEl) hintEl.style.display = 'none';
}

// Показываем статус авто под полями даты
async function checkAndShowAvailability() {
  const dateEl = document.getElementById('bookDate');
  const car = state.selectedCar;
  if (!dateEl || !dateEl.value || !car) return;

  let statusEl = document.getElementById('avail-status');
  if (!statusEl) {
    // Создаём элемент статуса под полями
    const wrap = dateEl.closest('div').parentNode;
    statusEl = document.createElement('div');
    statusEl.id = 'avail-status';
    statusEl.style.cssText = 'font-size:12px;padding:6px 10px;border-radius:8px;margin-top:4px;text-align:center;';
    wrap.insertAdjacentElement('afterend', statusEl);
  }

  statusEl.style.background = 'rgba(255,255,255,0.05)';
  statusEl.textContent = '⏳ Проверяем доступность...';
  statusEl.style.color = 'var(--text3)';

  if (window.checkCarAvailability) {
    const timeEl2 = document.getElementById('bookTime');
    const timeVal = timeEl2?.value || '';
    const available = await window.checkCarAvailability(car, dateEl.value, timeVal);
    const carData2 = (window._fleetData||[]).find(c=>c.name===car);
    if (available) {
      statusEl.style.background = 'rgba(16,185,129,0.1)';
      statusEl.style.color = 'var(--green)';
      const freeNow = !carData2 || isCarFree(carData2);
      statusEl.textContent = freeNow
        ? '✅ ' + car + ' свободен на эту дату'
        : '✅ ' + car + ' — дата после окончания обслуживания, можно бронировать';
    } else {
      statusEl.style.background = 'rgba(239,68,68,0.1)';
      statusEl.style.color = 'var(--red)';
      const until = carData2?.blockedUntilStr || carData2?.busyUntil || null;
      statusEl.textContent = '❌ Авто недоступен на эту дату' + (until ? ' · доступен с ' + until : '');
    }
  }
}


// Авто прямо сейчас свободен (нет блокировки или она истекла)
function isCarFree(car) {
  if (!car) return false;
  if (car.status === 'free') return true;
  if (car.blockedUntil) {
    const until = new Date(car.blockedUntil);
    if (!isNaN(until) && until < new Date()) return true;
  }
  return false;
}

// Авто можно забронировать (сейчас свободен ИЛИ есть конкретная дата окончания блокировки)
function isCarBookable(car) {
  if (!car) return false;
  if (isCarFree(car)) return true;
  // Есть срок блокировки — можно забронировать на дату после него
  if (car.blockedUntil) {
    const until = new Date(car.blockedUntil);
    return !isNaN(until);
  }
  return false;
}

// Текст статуса для показа клиенту
function carStatusText(car) {
  if (isCarFree(car)) return null;
  if (car.status === 'maintenance') {
    return car.blockedUntilStr
      ? 'Обслуживание до ' + car.blockedUntilStr
      : 'На обслуживании';
  }
  if (car.status === 'busy') {
    return 'Занят' + (car.busyUntil ? ' до ' + car.busyUntil : '');
  }
  return 'Недоступен';
}

// Минимальная дата/время для бронирования авто
function carAvailableFrom(car) {
  if (isCarFree(car)) return null; // прямо сейчас
  if (car.blockedUntil) return new Date(car.blockedUntil);
  return null;
}

// ── TAB NAV ──
const tabs=['map','fleet','booking','tariffs','profile'];
function switchTab(t){
  if (t === 'profile') {
    setTimeout(function(){
      if (typeof updateProfileStats === 'function') updateProfileStats();
      if (typeof updatePushMenuStatus === 'function') updatePushMenuStatus();
    }, 300);
  }
  if (t === 'tariffs') {
    setTimeout(function(){ if (typeof loadTariffsForCalc === 'function') loadTariffsForCalc(); }, 100);
  }
  if (t === 'booking') {
    // Рендер всегда из кэша — без запроса к Firebase
    if (typeof renderBookingHistory === 'function') renderBookingHistory();
  }
  // Фикс бага: сбрасываем позицию bottom-nav при переключении вкладок
  const nav = document.querySelector('.bottom-nav');
  if (nav) { nav.style.transform = ''; nav.style.position = ''; nav.style.bottom = ''; }

  tabs.forEach(tab=>{
    document.getElementById('tab-'+tab).classList.remove('active');
    document.getElementById('nb-'+tab).classList.remove('active');
  });
  document.getElementById('tab-'+t).classList.add('active');
  document.getElementById('nb-'+t).classList.add('active');
}

// Внутренний переход на бронирование без проверки (для использования внутри checkBookingAccess)
function switchTabDirect(t){
  tabs.forEach(tab=>{
    document.getElementById('tab-'+tab).classList.remove('active');
    document.getElementById('nb-'+tab).classList.remove('active');
  });
  document.getElementById('tab-'+t).classList.add('active');
  document.getElementById('nb-'+t).classList.add('active');
}

// ── BOOKING ──
let curBookPage=0;
const tariffNames=['Городской','Шопинг','Вечер/Досуг','Сутки','Офисный день','3 суток','Неделя'];

function selectCar(id,name){
  const nextBtn = document.getElementById('btn-cars-next');
  if(nextBtn){nextBtn.disabled=false;nextBtn.style.opacity='1';}
  document.querySelectorAll('.pick-card').forEach(c=>c.classList.remove('selected'));
  document.getElementById(id).classList.add('selected');
  state.selectedCar=name;
}
// ── ДИНАМИЧЕСКИЕ ТАРИФЫ В БРОНИРОВАНИИ ──────────────────────────────────────
// Рендерим тарифы из tcTariffs (уже загружены через loadTariffsForCalc)
// Если ещё не загружены — загружаем сами
let _bookingKmExtra = 0; // доп км выбранные ползунком
let _bookingSelTariffIdx = 0;

function renderBookingTariffList() {
  const list = document.getElementById('tariff-list');
  if (!list) return;

  // Если тарифы не загружены — грузим и ждём
  if (!tcTariffs || tcTariffs.length === 0) {
    list.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text3);font-size:13px">⏳ Загружаем тарифы...</div>';
    loadTariffsForCalc().then(() => renderBookingTariffList());
    return;
  }

  _bookingSelTariffIdx = 0;
  _bookingKmExtra = 0;

  list.innerHTML = tcTariffs.map((t, i) => {
    const meta = [t.hours ? (t.hours + ' ч') : '', t.km ? (t.km + ' км') : ''].filter(Boolean).join(' · ');
    const isFirst = i === 0;
    return `<div class="tariff-row${isFirst ? ' selected' : ''}" id="btr${i}" onclick="selectBookingTariff(${i})" style="cursor:pointer">
      <div class="tariff-row-dot"></div>
      <div class="tariff-row-name">
        ${t.emoji || '🚗'} ${t.name}
        ${t.badge ? `<span style="margin-left:6px;background:#F59E0B;color:#1a1000;font-size:9px;font-weight:600;padding:1px 5px;border-radius:4px">${t.badge}</span>` : ''}
        <br><span style="font-size:10px;font-weight:400;color:var(--text2)">${meta || t.desc || ''}</span>
      </div>
      <div class="tariff-row-price">${t.price.toLocaleString('ru-RU')} ₽</div>
    </div>`;
  }).join('');

  // Выбираем первый тариф по умолчанию
  selectBookingTariff(0);

  // Показываем ползунок км только если у тарифа есть лимит км
  updateBookingKmSlider();
}

function selectBookingTariff(idx) {
  _bookingSelTariffIdx = idx;
  const t = tcTariffs[idx];
  if (!t) return;

  // Сбрасываем ползунок
  _bookingKmExtra = 0;
  const range = document.getElementById('booking-km-range');
  if (range) range.value = 0;
  const lbl = document.getElementById('booking-km-label');
  if (lbl) lbl.textContent = '+0 км · +0 ₽';

  // Стили выбора
  tcTariffs.forEach((_, i) => {
    const el = document.getElementById('btr' + i);
    if (el) el.classList.toggle('selected', i === idx);
  });

  state.basePrice      = t.price;
  state.selectedTariff = t.name;
  state.tarif          = t.name;
  state._tariffKmBase  = t.km || 0;
  // Сохраняем длительность тарифа в минутах
  state.durationMin    = t.hours ? Math.round(t.hours * 60) : (t.minutes || null);

  updateBookingKmSlider();
  updateBookingTotal();
}

function updateBookingKmSlider() {
  const t = tcTariffs[_bookingSelTariffIdx];
  const block = document.getElementById('booking-km-slider-block');
  if (!block) return;
  // Показываем ползунок только если у тарифа есть лимит км
  if (t && t.km > 0) {
    block.style.display = 'block';
  } else {
    block.style.display = 'none';
    _bookingKmExtra = 0;
  }
}

function onBookingKmChange(val) {
  const km = Math.max(0, parseInt(val) || 0);
  // Минимум 5 км если сдвинули
  _bookingKmExtra = km > 0 ? Math.max(km, 5) : 0;
  const cost = _bookingKmExtra * 10;
  const lbl = document.getElementById('booking-km-label');
  if (lbl) lbl.textContent = _bookingKmExtra > 0
    ? `+${_bookingKmExtra} км · +${cost.toLocaleString('ru-RU')} ₽`
    : '+0 км · +0 ₽';
  updateBookingTotal();
}

function updateBookingTotal() {
  const kmCost = _bookingKmExtra * 10;
  const total  = (state.basePrice || 0) + (state.extras || 0) + kmCost;
  state.extraKm   = _bookingKmExtra;
  state.extraKmCost = kmCost;
  const el = document.getElementById('calcTotal');
  if (el) el.textContent = total.toLocaleString('ru-RU') + ' ₽';
}

function selectTariff(idx, price) {
  // Устаревшая функция — переадресуем на новую если есть тарифы из Firebase
  if (tcTariffs && tcTariffs.length > 0) {
    selectBookingTariff(idx);
    return;
  }
  // Фолбэк на статику
  for (let i = 0; i < 7; i++) {
    const el = document.getElementById('tr' + i);
    if (el) el.classList.remove('selected');
  }
  const sel = document.getElementById('tr' + idx);
  if (sel) sel.classList.add('selected');
  state.basePrice = price;
  state.selectedTariff = tariffNames[idx];
  updateBookingTotal();
}

function updateTotal() {
  updateBookingTotal();
}
function toggleOpt(el,type,price){
  const sw=el.querySelector('.toggle-switch');
  sw.classList.toggle('on');
  const isOn=sw.classList.contains('on');
  if(type==='delivery'){state.delivery=isOn;state.extras+=isOn?850:-850;}
  if(type==='kasko'){state.kasko=isOn;state.extras+=isOn?500:-500;}
  updateBookingTotal();
  // Если CityCoins активны — пересчитываем скидку с новой суммой
  if (window._coinsActive) {
    window._coinsActive = false; // сбрасываем и пересчитываем
    toggleCoinsPayment();
  }
}
function selectPay(id){
  ['pay-sbp','pay-card'].forEach(p=>{
    document.getElementById(p).classList.remove('selected');
    const dot=document.getElementById('pd-'+p.split('-')[1]);
    if(dot){dot.style.background='transparent';dot.style.border='2px solid var(--border)';}
  });
  document.getElementById(id).classList.add('selected');
  const key=id.replace('pay-','');
  const dot=document.getElementById('pd-'+key);
  if(dot){dot.style.background='var(--blue)';dot.style.border='none';}
}
function bNext(page) {
  // ШАГ 0 → 1: тариф выбран, переходим к авто
  if (page === 0) {
    if (!state.basePrice && state.tariffType !== 'minute') {
      showToastMsg('📋','Выберите тариф','Выберите тариф чтобы продолжить');
      return;
    }
    // Рендерим список авто
    renderBookingCars(state.selectedCar || '');
    // Если авто уже выбрано (сценарий 2 — через карту/авто) — разблокируем кнопку
    if (state.selectedCar) {
      const btn = document.getElementById('btn-cars-next');
      if (btn) { btn.disabled = false; btn.style.opacity = '1'; }
    }
    const sub = document.getElementById('wizard-subtitle');
    if (sub) sub.textContent = 'Шаг 2 из 3 — выберите авто';
    showBookPage(1);
    return;
  }

  // ШАГ 1 → 2: авто выбрано, переходим к опциям
  if (page === 1) {
    if (!state.selectedCar) {
      showToastMsg('🚗','Выберите авто','Выберите автомобиль чтобы продолжить');
      return;
    }
    const sub = document.getElementById('wizard-subtitle');
    if (sub) sub.textContent = 'Шаг 3 из 3 — опции и дата';
    showBookPage(2);
    return;
  }

  // ШАГ 2 → 3: опции заполнены, переходим к оплате
  if (page === 2) {
    if (!document.getElementById('agreeCheck').checked) {
      showToastMsg('⚠️','Подтвердите','Прочтите и примите условия договора аренды');
      return;
    }
    const d = document.getElementById('bookDate').value.trim();
    const t = document.getElementById('bookTime').value.trim();
    if (!d) { showToastMsg('📅','Укажите дату','Выберите дату начала аренды'); return; }
    if (!t) { showToastMsg('🕐','Укажите время','Выберите время начала аренды'); return; }
    const chosen = new Date(d + 'T' + t);
    const nowMs = Date.now();
    if (chosen < new Date(nowMs - 60000)) {
      showToastMsg('⏰','Некорректное время','Нельзя выбрать время в прошлом');
      return;
    }
    // Проверяем: не более +30 мин от текущего момента (только для сегодняшней даты)
    const todayCheck = new Date();
    const todayStrCheck = todayCheck.getFullYear()+'-'+(todayCheck.getMonth()+1).toString().padStart(2,'0')+'-'+todayCheck.getDate().toString().padStart(2,'0');
    if (d === todayStrCheck && chosen > new Date(nowMs + 31 * 60000)) {
      showToastMsg('⏱','Слишком далеко','Выберите время старта не позже чем через 30 минут');
      return;
    }
    const carData = state.selectedCar && window._fleetData
      ? window._fleetData.find(c => c.name === state.selectedCar) : null;
    if (carData && carData.status === 'maintenance') {
      showToastMsg('🔧','Авто на ТО','Этот автомобиль на техническом обслуживании'); return;
    }
    if (carData && carData.blockedUntil) {
      const blockedEnd = new Date(carData.blockedUntil);
      if (chosen <= blockedEnd) {
        showToastMsg('🔒','Авто недоступен','Выберите дату после ' + (carData.blockedUntilStr || blockedEnd.toLocaleString('ru-RU')));
        return;
      }
    }
    // Заполняем итоговую сводку
    const p = d.split('-');
    const dFmt = p[2] + '.' + p[1] + '.' + p[0];
    const kmCost = (_bookingKmExtra || 0) * 10;
    const isMinutePay = state.tariffType === 'minute';
    const baseForCalc = isMinutePay ? (state.estimateAmount || 0) : (state.basePrice || 0);
    const total  = baseForCalc + (state.extras || 0) + kmCost;
    const sumCar    = document.getElementById('sum-car');
    const sumTariff = document.getElementById('sum-tariff');
    const sumDate   = document.getElementById('sum-date');
    const sumTotal  = document.getElementById('sum-total');
    if (sumCar)    sumCar.textContent    = state.selectedCar || '—';
    if (sumTariff) sumTariff.textContent = state.selectedTariff || state.tarif || '—';
    if (sumDate)   sumDate.textContent   = dFmt + ' ' + t;
    if (sumTotal)  sumTotal.textContent  = total.toLocaleString('ru-RU') + ' ₽';
    if (typeof initCoinsPayBlock === 'function') initCoinsPayBlock();
    const sub = document.getElementById('wizard-subtitle');
    if (sub) sub.textContent = 'Шаг 4 — оплата';
    showBookPage(3);
    return;
  }
}

function bBack(page) {
  if (page <= 0) { closeBookingWizard(); return; }
  showBookPage(page - 1);
  const sub = document.getElementById('wizard-subtitle');
  if (!sub) return;
  if (page === 1) sub.textContent = 'Шаг 1 из 3 — выберите тариф';
  if (page === 2) sub.textContent = 'Шаг 2 из 3 — выберите авто';
  if (page === 3) sub.textContent = 'Шаг 3 из 3 — опции и дата';
}

function showBookPage(n) {
  for (let i = 0; i <= 4; i++) {
    const bp = document.getElementById('bp' + i);
    const bs = document.getElementById('bs' + i);
    if (bp) bp.classList.remove('active');
    if (bs) bs.classList.remove('active', 'done');
  }
  const bpN = document.getElementById('bp' + n);
  if (bpN) bpN.classList.add('active');
  for (let i = 0; i < n; i++) {
    const bs = document.getElementById('bs' + i);
    if (bs) bs.classList.add('done');
  }
  const bsN = document.getElementById('bs' + n);
  if (bsN) bsN.classList.add('active');
  curBookPage = n;
  // Скроллим wizard в начало при смене шага
  const wizBody = document.querySelector('#s-wizard > div[style*="overflow-y"]');
  if (wizBody) wizBody.scrollTop = 0;
}
// ── TELEGRAM CONFIG ──
const TG_CHAT_OPERATOR = '-1003688378054';
// WORKER_URL уже объявлен выше — не переобъявляем (избегаем SyntaxError при дублировании const)
if (typeof WORKER_URL === 'undefined') { var WORKER_URL = 'https://citycar-upload.aogoldenberg.workers.dev'; }

function sendTelegramMessage(chatId, text) {
  fetch(WORKER_URL + '/tg', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: text })
  }).catch(err => console.warn('Telegram error:', err));
}

async function confirmBooking(){
  // Проверяем наличие неоплаченных штрафов
  const finesOk = await checkFinesBeforeBooking();
  if (!finesOk) return;

  const kmCost = (_bookingKmExtra || 0) * 10;
  const isMinuteConfirm = state.tariffType === 'minute';
  const baseConfirm = isMinuteConfirm ? (state.estimateAmount || 0) : (state.basePrice || 0);
  const totalNum = baseConfirm + (state.extras || 0) + kmCost;
  const total = totalNum.toLocaleString('ru-RU') + ' ₽';
  const car   = state.selectedCar   || '—';
  const tarif = state.selectedTariff || state.tarif || '—';
  const dateRaw = document.getElementById('bookDate').value || '';
  const time  = document.getElementById('bookTime').value  || '—';
  const _sessNow = loadSession() || {};
  const phone = _sessNow.phone || state.phone || '—';
  const clientName = _sessNow.name || '—';
  const delivery = state.delivery ? 'Да (+850 ₽)' : 'Нет';
  const kasko    = state.kasko    ? 'Да (+500 ₽)' : 'Нет';
  const now = new Date().toLocaleString('ru-RU', {timeZone:'Europe/Moscow'});

  let date = '—';
  if (dateRaw) { const p=dateRaw.split('-'); date=p[2]+'.'+p[1]+'.'+p[0]; }

  const btn = document.getElementById('btn-pay-booking');
  if (btn) { btn.disabled=true; btn.textContent='Проверяем...'; }

  document.getElementById('success-car').textContent      = car;
  document.getElementById('success-tariff').textContent   = tarif;
  document.getElementById('success-total').textContent    = total;
  const dtEl = document.getElementById('success-datetime');
  if (dtEl) dtEl.textContent = (date||'—') + ' в ' + (time||'—');
  if (btn) { btn.disabled=true; btn.textContent='⏳ Сохраняем заявку...'; }

  const isMinuteTariff = state.tariffType === 'minute';
  const payAmount = isMinuteTariff
    ? (state.estimateAmount || state.ratePerMin * 60) + state.extras
    : totalNum;

  const bookingData = {
    car, tarif,
    date: dateRaw,
    dateStr: date,
    time, phone,
    delivery: state.delivery,
    kasko: state.kasko,
    basePrice: state.basePrice,
    extras: state.extras,
    extraKm: _bookingKmExtra || 0,
    extraKmCost: kmCost,
    total: payAmount,
    createdAtStr: now,
    coinsUsed:       window._coinsToUse || 0,
    tariffType:      state.tariffType || 'package',
    ratePerMin:      state.ratePerMin || null,
    depositAmount:   isMinuteTariff ? (state.depositAmount || 480) : null,
    estimateAmount:  isMinuteTariff ? (state.estimateAmount || null) : null,
    estimateMinutes: isMinuteTariff ? (state.estimateMinutes || null) : null,
    durationMin:     isMinuteTariff
      ? (state.estimateMinutes || null)
      : (state.durationMin || null),
    carId: (window._fleetData||[]).find(c=>c.name===car)?.id || null
  };

  // Сохраняем в Firebase
  let bookingId = null;
  if (window.saveBookingToFirebase) {
    bookingId = await window.saveBookingToFirebase(bookingData);
    // Записываем activeBookingId в users
    if (bookingId && window.saveUserToFirestore) {
      const _sess = loadSession() || {};
      if (_sess.phone) window.saveUserToFirestore(_sess.phone, {
        activeBookingId: bookingId,
        lastBookingDate: new Date().toISOString()
      });
    }
    // Запускаем realtime слушатель заявки (ОДИН раз)
    if (bookingId && window.listenActiveBooking) window.listenActiveBooking(bookingId);
    if (bookingId) state.lastBookingId = bookingId;
  }

  // Короткий номер заявки для показа клиенту (#XXXX — последние 4 символа ID)
  const shortNum = bookingId ? ('#' + bookingId.slice(-4).toUpperCase()) : '#????';
  const numEl = document.getElementById('success-booking-num');
  if (numEl) numEl.textContent = shortNum;

  // ── Инициируем оплату через T-Bank ────────────────────────────────────────
  if (bookingId) {
    if (btn) { btn.disabled=true; btn.textContent='Переходим к оплате...'; }
    // КРИТИЧНО: window.open вызываем СИНХРОННО до await — иначе iOS Safari блокирует
    var payWindow = window.open('', '_blank');
    if (payWindow) {
      payWindow.document.write('<html><body style="font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#f5f5f5"><p style="color:#666">Загружаем T-Bank...</p></body></html>');
    }
    try {
      const email = _sessNow.email || '';
      const totalNum = isMinuteTariff
        ? (state.estimateAmount || state.ratePerMin * 60) + state.extras
        : state.basePrice + state.extras;
      const payDescription = isMinuteTariff
        ? 'Аренда CityCAR: ' + car + ' · Поминутный (' + (state.ratePerMin||8) + ' ₽/мин)'
        : 'Аренда CityCar: ' + car + ' · ' + tarif;
      const payResp = await fetch(WORKER_URL + '/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId,
          amount: totalNum,
          phone,
          description: payDescription,
          email: email || undefined
        })
      });
      const payResult = await payResp.json();
      if (payResult.ok && payResult.paymentUrl) {
        // Уведомление оператору об ожидании оплаты
        sendTelegramMessage(TG_CHAT_OPERATOR,
`🚗 <b>НОВАЯ ЗАЯВКА — CityCAR</b>

📋 <b>Детали брони:</b>
• Автомобиль: <b>${car}</b>
• Тариф: ${tarif}
• Дата: ${date} в ${time}
• Доставка: ${delivery}
• КАСКО: ${kasko}${_bookingKmExtra > 0 ? '\n• Доп. км: +' + _bookingKmExtra + ' км (+' + kmCost.toLocaleString('ru-RU') + ' ₽)' : ''}

👤 <b>Клиент:</b>
• Имя: <b>${clientName}</b>
• Телефон: <b>${phone}</b>
• Статус: ${_sessNow.verificationStatus === 'verified' ? '✅ Верифицирован' : '⏳ На проверке'}

💰 <b>Итого: ${total}</b>
🆔 Заявка: <b>${shortNum}</b> · <code>${bookingId}</code>
💳 Статус оплаты: ⏳ Переход на оплату...

🕐 ${now}`);
        // Перенаправляем уже открытое окно на T-Bank (ios-совместимо)
        if (payWindow && !payWindow.closed) {
          payWindow.location.href = payResult.paymentUrl;
        } else {
          // popup заблокирован браузером — редирект в текущей вкладке
          window.location.href = payResult.paymentUrl;
        }
        // Списываем CityCoins если пользователь выбрал оплату монетами
        if (window._coinsToUse > 0) {
          deductCoinsAfterPayment(window._coinsToUse, phone);
          window._coinsToUse = 0;
        }
        if (btn) { btn.disabled=true; btn.textContent='⏳ Ожидаем оплату...'; }
        return;
      } else {
        if (payWindow && !payWindow.closed) payWindow.close();
        const errText = payResult.error || payResult.details || 'Не удалось инициировать платёж';
        showToastMsg('⚠️','Ошибка оплаты', errText);
        if (btn) { btn.disabled=false; btn.textContent='💳 Оплатить бронирование'; }
        return;
      }
    } catch(e) {
      if (payWindow && !payWindow.closed) payWindow.close();
      console.error('pay error:', e);
      showToastMsg('⚠️','Ошибка','Нет соединения с платёжным сервисом');
      if (btn) { btn.disabled=false; btn.textContent='💳 Оплатить бронирование'; }
      return;
    }
  }

  // Fallback — если оплата не сработала, показываем экран успеха без оплаты
  showBookPage(4);
  const numElFb = document.getElementById('success-booking-num');
  if (numElFb && state.lastBookingId) numElFb.textContent = '#' + state.lastBookingId.slice(-4).toUpperCase();
  const msg =
`🚗 <b>НОВАЯ ЗАЯВКА — CityCAR</b>

📋 <b>Детали брони:</b>
• Автомобиль: <b>${car}</b>
• Тариф: ${tarif}
• Дата: ${date} в ${time}
• Доставка: ${delivery}
• КАСКО: ${kasko}

👤 <b>Клиент:</b>
• Имя: <b>${clientName}</b>
• Телефон: <b>${phone}</b>
• Статус: ${_sessNow.verificationStatus === 'verified' ? '✅ Верифицирован' : '⏳ На проверке'}

💰 <b>Итого: ${total}</b>
🆔 Заявка: <b>${shortNum}</b> · <code>${bookingId||'—'}</code>

🕐 ${now}
📲 Ответьте клиенту в течение 15 минут`;

  sendTelegramMessage(TG_CHAT_OPERATOR, msg);
  showToastMsg('✅', 'Заявка принята!', 'Ожидайте звонок или сообщение в Telegram');
}
function resetBooking(){
  const wasOnSuccess = document.getElementById('bp4') &&
    document.getElementById('bp4').classList.contains('active');
  if (wasOnSuccess) {
    const _sess = loadSession() || {};
    const now = new Date().toLocaleString('ru-RU', {timeZone:'Europe/Moscow'});
    sendTelegramMessage(TG_CHAT_OPERATOR,
`❌ <b>ОТМЕНА ЗАЯВКИ — CityCAR</b>

🚗 ${state.selectedCar || '—'}
📋 ${state.selectedTariff || '—'}

👤 ${_sess.name || '—'} · ${_sess.phone || '—'}

🕐 ${now}`);
  }
  state.extras = 0; state.delivery = false; state.kasko = false;
  state.selectedCar = ''; state.basePrice = 0;
  closeBookingWizard();
  // Небольшая задержка чтобы wizard закрылся
  setTimeout(() => openBookingWizard('tariff'), 200);
}

// ── ИСТОРИЯ БРОНЕЙ ──────────────────────────────────────────────────────────
// ── История броней: один запрос при старте, кэш в памяти на всю сессию ──────
// Повторный запрос делается ТОЛЬКО если явно вызвать refreshBookingHistory()
// (например после завершения поездки). Это исключает лишние чтения Firebase.

async function _fetchAndCacheHistory(phone) {
  const FB_KEY = 'AIzaSyBQvTtF2NfK_Pvbb9qqf3tqqzXXXmrZbDk';
  const FB_PRJ = 'citycar-voronezh-3ed1b';
  // orderBy убран — требует составной индекс в Firestore, без него даёт 400.
  // Сортировка делается на клиенте ниже.
  const resp = await fetch(
    `https://firestore.googleapis.com/v1/projects/${FB_PRJ}/databases/(default)/documents:runQuery?key=${FB_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ structuredQuery: {
        from: [{ collectionId: 'bookings' }],
        where: { fieldFilter: { field: { fieldPath: 'phone' }, op: 'EQUAL', value: { stringValue: phone } } },
        limit: 50
      }})
    }
  );
  if (!resp.ok) throw new Error('HTTP ' + resp.status);
  const results = await resp.json();
  const bookings = (results || [])
    .filter(r => r.document)
    .map(r => {
      const f = r.document.fields || {};
      // Добавлен timestampValue — serverTimestamp() возвращает именно его
      const get = (k) => f[k]?.stringValue || f[k]?.integerValue || f[k]?.booleanValue || f[k]?.timestampValue || '';
      return {
        id:           r.document.name.split('/').pop(),
        car:          get('car'),
        tarif:        get('tarif'),
        date:         get('dateStr') || get('date'),
        time:         get('time'),
        total:        get('total'),
        status:       get('status'),
        createdAt:    get('createdAt') || get('createdAtStr'),
        createdAtStr: get('createdAtStr')
      };
    })
    .sort((a, b) => {
      const da = a.createdAt ? new Date(a.createdAt) : new Date(0);
      const db = b.createdAt ? new Date(b.createdAt) : new Date(0);
      return db - da;
    });
  window._historyCache = bookings;
  window._historyCacheLoaded = true;
  return bookings;
}

// Вызывается один раз при старте приложения (после логина / DOMContentLoaded)
async function preloadBookingHistory() {
  const sess = loadSession();
  const phone = sess?.phone;
  if (!phone || window._historyCacheLoaded) return;
  try {
    await _fetchAndCacheHistory(phone);
  } catch(e) {
    console.warn('[История] preload:', e.message);
    // Даже при ошибке помечаем кэш загруженным — чтобы экран не завис вечно
    window._historyCache = [];
    window._historyCacheLoaded = true;
  }
}

// Явный сброс кэша + перезагрузка — только после поездки
async function refreshBookingHistory() {
  window._historyCache = null;
  window._historyCacheLoaded = false;
  const sess = loadSession();
  const phone = sess?.phone;
  if (!phone) return;
  try { await _fetchAndCacheHistory(phone); } catch(e) { console.warn('[История] refresh:', e.message); }
  // Перерисовываем если вкладка открыта
  renderBookingHistory();
}

// Рендер — всегда из кэша, никогда не делает запрос сам
function renderBookingHistory() {
  const sess = loadSession();
  const phone = sess?.phone;
  const container = document.getElementById('booking-history-list');
  const altCont   = document.getElementById('history-content');
  const target = container || altCont;
  if (!target) return;

  if (!phone) {
    target.innerHTML = '<div style="text-align:center;padding:60px 20px;color:var(--text2)"><div style="font-size:48px;margin-bottom:12px">🔐</div><div style="font-size:15px;font-weight:600">Войдите в аккаунт</div></div>';
    return;
  }

  if (!window._historyCacheLoaded) {
    // Кэш ещё не загружен — показываем загрузку и ждём preload
    target.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text2)">⏳ Загрузка истории...</div>';
    // Если preload почему-то не запустился — запускаем вручную
    if (!window._historyPreloading) {
      window._historyPreloading = true;
      preloadBookingHistory()
        .then(() => { renderBookingHistory(); })
        .catch(() => { renderBookingHistory(); })
        .finally(() => { window._historyPreloading = false; });
    }
    return;
  }

  _renderHistoryFromCache(window._historyCache || [], target, null);
}

function _renderHistoryFromCache(bookings, target, empty) {
  target.querySelectorAll('.history-card').forEach(c => c.remove());
  if (!bookings || !bookings.length) {
    target.innerHTML = '<div style="text-align:center;padding:30px 20px;color:var(--text2)"><div style="font-size:48px;margin-bottom:16px">🚗</div><div style="font-size:15px;font-weight:600;margin-bottom:8px">Поездок пока нет</div><div style="font-size:13px;line-height:1.6">После первой аренды здесь появится история</div></div>';
    if (empty) empty.style.display = 'block';
    return;
  }
  if (empty) empty.style.display = 'none';
  const statusLabel = { new:'⏳ Новая', confirmed:'✅ Подтверждена', active:'🟢 Активна', done:'🏁 Завершена', finished:'🏁 Завершена', cancelled:'❌ Отменена' };
  const statusColor = { new:'var(--text3)', confirmed:'var(--green)', active:'#22C55E', done:'var(--text3)', finished:'var(--text3)', cancelled:'var(--red)' };
  bookings.forEach(b => {
    const card = document.createElement('div');
    card.className = 'history-card';
    card.style.cssText = 'background:var(--card);border:1px solid var(--border);border-radius:14px;padding:14px 16px;margin-bottom:10px';
    const st = b.status || 'new';
    const totalStr = b.total ? (String(b.total).includes('₽') ? b.total : Number(b.total).toLocaleString('ru-RU') + ' ₽') : '—';
    card.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px">
        <div style="font-size:15px;font-weight:600">${b.car || '—'}</div>
        <div style="font-size:12px;font-weight:600;color:${statusColor[st]||'var(--text3)'}">${statusLabel[st]||st}</div>
      </div>
      <div style="font-size:13px;color:var(--text2);margin-bottom:2px">📋 ${b.tarif || '—'}</div>
      <div style="font-size:13px;color:var(--text2);margin-bottom:8px">📅 ${b.date||'—'} ${b.time||''}</div>
      <div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid var(--border);padding-top:8px">
        <div style="font-size:11px;color:var(--text3)">${b.createdAtStr||''}</div>
        <div style="font-size:15px;font-weight:700;color:var(--blue2)">${totalStr}</div>
      </div>`;
    target.appendChild(card);
  });
}
// ══════════════════════════════════════════════════════
// BOOKING WIZARD — полная логика
// ══════════════════════════════════════════════════════

// Сценарий: 'tariff' = через вкладку тарифы, 'car' = через авто/карту
let _wizardMode = 'tariff'; // 'tariff' | 'car'
let _wizardPrevScreen = 's-main';

function openBookingWizard(mode, carName) {
  if (!checkBookingAccess()) return;

  _wizardMode = mode || 'tariff';
  _wizardPrevScreen = 's-main';

  // Сбрасываем состояние wizard
  _bookingKmExtra = 0;
  state.extras = 0;
  state.delivery = false;
  state.kasko = false;
  window._coinsToUse = 0;
  window._coinsActive = false;

  // Сбрасываем toggles (опции)
  document.querySelectorAll('.toggle-switch.on').forEach(sw => sw.classList.remove('on'));
  const agreeCheck = document.getElementById('agreeCheck');
  if (agreeCheck) agreeCheck.checked = false;

  // Инициализируем дату
  initBookDateLimits();

  if (_wizardMode === 'tariff') {
    document.getElementById('bsl0').textContent = 'Тариф';
    document.getElementById('bsl1').textContent = 'Авто';
    document.getElementById('bsl2').textContent = 'Опции';
    document.getElementById('wizard-subtitle').textContent = 'Шаг 1 из 3 — тариф';

    // Синхронизируем выбранный тариф из вкладки Тарифы
    if (tcTariffs && tcTariffs.length > 0 && tcSelIdx >= 0) {
      const t = tcTariffs[tcSelIdx];
      if (t) {
        state.basePrice      = t.price;
        state.selectedTariff = t.name;
        state.tarif          = t.name;
        state._tariffKmBase  = t.km || 0;
        state.tariffType     = 'package';
        // Переносим км-ползунок
        _bookingKmExtra = 0;
      }
    }

    // Синхронизируем ставки поминутного
    const baseRate = Number(document.getElementById('tc-min-rate')?.textContent || 8);
    const waitRate = Number(document.getElementById('tc-wait-rate')?.textContent || 4);
    const wizPack = document.getElementById('wiz-pack-from');
    if (wizPack && tcTariffs && tcTariffs[0]) {
      wizPack.textContent = 'от ' + tcTariffs[0].price.toLocaleString('ru-RU') + ' ₽';
    }
    const wizMinP = document.getElementById('wiz-min-price');
    if (wizMinP) wizMinP.textContent = baseRate + ' ₽/мин';

    renderBookingTariffList();
    showBookPage(0);
    state.selectedCar = '';
    const carsBtn = document.getElementById('btn-cars-next');
    if (carsBtn) { carsBtn.disabled = true; carsBtn.style.opacity = '0.5'; }

  } else {
    // Сценарий 2: выбрали авто → сначала Авто уже выбрано, показываем Тариф
    // Шаги: 0=Тариф, 1=Авто→уже выбран→пропускаем, 2=Опции, 3=Оплата
    // Фактически: 0=Тариф, 1=Авто (подтверждение), 2=Опции, 3=Оплата
    document.getElementById('bsl0').textContent = 'Тариф';
    document.getElementById('bsl1').textContent = 'Авто';
    document.getElementById('bsl2').textContent = 'Опции';
    document.getElementById('wizard-subtitle').textContent = 'Шаг 1 из 3 — тариф';

    if (carName) {
      state.selectedCar = carName;
    }

    // Рендерим тарифы
    renderBookingTariffList();
    showBookPage(0);
  }

  // Показываем wizard экран
  showScreen('s-wizard');
}

function closeBookingWizard() {
  // Фикс бага: при закрытии wizard восстанавливаем позицию bottom-nav
  const nav = document.querySelector('.bottom-nav');
  if (nav) {
    nav.style.transform = '';
    nav.style.position = '';
    nav.style.bottom = '';
  }
  showScreen('s-main');
}

// Переопределяем goToBookingWith через wizard
function goToBookingWith(car) {
  openBookingWizard(car ? 'car' : 'tariff', car);
}

// Поминутный через wizard
function wizBookMinute() {
  if (!checkBookingAccess()) return;
  // Копируем данные поминутного тарифа из главной панели
  const baseRate = Number(document.getElementById('tc-min-rate')?.textContent || 8);
  const waitRate = Number(document.getElementById('tc-wait-rate')?.textContent || 4);
  const sliderVal = document.getElementById('wiz-min-slider')?.value || 60;
  state.tariffType    = 'minute';
  state.ratePerMin    = baseRate;
  state.selectedTariff = 'Поминутный';
  state.tarif          = 'Поминутный';
  state.depositAmount  = null;
  state.basePrice      = null;
  // Если заходим через вкладку тарифов — авто ещё не выбрано, сбрасываем
  if (_wizardMode === 'tariff') {
    state.selectedCar = '';
    const carsBtn = document.getElementById('btn-cars-next');
    if (carsBtn) { carsBtn.disabled = true; carsBtn.style.opacity = '0.5'; }
  }
  // Обновляем шаги: после тарифа — авто
  bNext(0);
}

function tcBookMinute() {
  // Из вкладки тарифы — открываем wizard в поминутном режиме
  if (!checkBookingAccess()) return;
  const baseRate = Number(document.getElementById('tc-min-rate')?.textContent || 8);
  const waitRate = Number(document.getElementById('tc-wait-rate')?.textContent || 4);
  state.tariffType     = 'minute';
  state.ratePerMin     = baseRate;
  state.selectedTariff = 'Поминутный';
  state.tarif          = 'Поминутный';
  state.depositAmount  = null;
  state.basePrice      = null;
  state.estimateAmount = null;
  state.estimateMinutes= null;
  state.extras         = 0;
  state.selectedCar    = '';  // обязательно сбрасываем — авто нужно выбрать
  _wizardMode = 'tariff';
  document.getElementById('bsl0').textContent = 'Тариф';
  document.getElementById('bsl1').textContent = 'Авто';
  document.getElementById('bsl2').textContent = 'Опции';
  initBookDateLimits();
  document.querySelectorAll('.toggle-switch.on').forEach(sw => sw.classList.remove('on'));
  const agreeCheck = document.getElementById('agreeCheck');
  if (agreeCheck) agreeCheck.checked = false;
  const carsBtn = document.getElementById('btn-cars-next');
  if (carsBtn) { carsBtn.disabled = true; carsBtn.style.opacity = '0.5'; }
  renderBookingCars();
  showBookPage(0); // шаг 0 — выбор параметров тарифа
  wizShowTariffType('min'); // показываем минутную панель
  showScreen('s-wizard');
}

// Поминутный слайдер в wizard
function wizSetMinutes(min) {
  const slider = document.getElementById('wiz-min-slider');
  if (slider) slider.value = min;
  // Обновляем стили пресетов — только выбранная активна
  document.querySelectorAll('#wiz-panel-min button[onclick^="wizSetMinutes"]').forEach(btn => {
    const m = parseInt(btn.getAttribute('onclick').match(/\d+/)?.[0]);
    const active = m === min;
    btn.style.borderColor = active ? 'var(--blue2)' : 'var(--border)';
    btn.style.background  = active ? 'rgba(37,99,235,0.06)' : 'var(--bg)';
    btn.style.color       = active ? 'var(--blue2)' : 'var(--text2)';
  });
  wizOnMinSlider(min);
}
function wizOnMinSlider(val) {
  const min = parseInt(val);
  const baseRate = Number(document.getElementById('wiz-min-rate')?.textContent || 8);
  // Прогрессивная ставка
  let rate = baseRate;
  if (min > 180) rate = baseRate * 0.80;
  else if (min > 120) rate = baseRate * 0.85;
  else if (min > 90) rate = baseRate * 0.90;
  else if (min > 60) rate = baseRate * 0.95;
  const total = Math.round(min * rate);
  const totalEl = document.getElementById('wiz-min-total');
  if (totalEl) totalEl.textContent = total.toLocaleString('ru-RU') + ' ₽';
  state.estimateAmount  = total;
  state.estimateMinutes = min;
  state.depositAmount   = null;
  state.basePrice       = null;
}

// Тип тарифа в wizard (пакетный/поминутный)
function wizShowTariffType(type) {
  const packPanel = document.getElementById('wiz-panel-pack');
  const minPanel  = document.getElementById('wiz-panel-min');
  const btnPack   = document.getElementById('wiz-btn-pack');
  const btnMin    = document.getElementById('wiz-btn-min');
  if (type === 'pack') {
    if (packPanel) packPanel.style.display = 'block';
    if (minPanel)  minPanel.style.display  = 'none';
    if (btnPack) { btnPack.style.borderColor = 'var(--blue2)'; btnPack.style.background = 'rgba(37,99,235,0.06)'; }
    if (btnMin)  { btnMin.style.borderColor  = 'var(--border)'; btnMin.style.background  = 'var(--card)'; }
    state.tariffType = 'package';
  } else {
    if (packPanel) packPanel.style.display = 'none';
    if (minPanel)  minPanel.style.display  = 'block';
    if (btnMin)  { btnMin.style.borderColor  = 'var(--blue2)'; btnMin.style.background  = 'rgba(37,99,235,0.06)'; }
    if (btnPack) { btnPack.style.borderColor = 'var(--border)'; btnPack.style.background = 'var(--card)'; }
    state.tariffType = 'minute';
    // Синхронизируем ставки из главной вкладки
    const baseRate = Number(document.getElementById('tc-min-rate')?.textContent || 8);
    const waitRate = Number(document.getElementById('tc-wait-rate')?.textContent || 4);
    const wizMinRate = document.getElementById('wiz-min-rate');
    const wizWaitRate = document.getElementById('wiz-wait-rate');
    if (wizMinRate) wizMinRate.textContent = baseRate;
    if (wizWaitRate) wizWaitRate.textContent = waitRate;
    const steps = [1, 0.95, 0.90, 0.85, 0.80];
    [0,1,2,4].forEach((prog, i) => {
      const el = document.getElementById('wiz-prog-' + prog);
      if (el) el.textContent = (baseRate * steps[i]).toFixed(1).replace('.',',') + ' ₽/мин';
    });
    const wizPackFrom = document.getElementById('wiz-min-price');
    if (wizPackFrom) wizPackFrom.textContent = baseRate + ' ₽/мин';
    // Используем текущее значение слайдера, не сбрасываем на 60
    const slider = document.getElementById('wiz-min-slider');
    const currentVal = slider ? parseInt(slider.value) || 60 : 60;
    wizOnMinSlider(currentVal);
  }
}

// ── Обновляем switchTab — booking теперь просто история, wizard отдельно ──

// ── BOOKING ACCESS GATE ──
function checkBookingAccess() {
  const session = loadSession();

  // Нет сессии вообще — отправляем на авторизацию
  if (!session || !session.phone) {
    showAuthPrompt();
    return false;
  }

  // Гость — профиль не заполнен, запускаем регистрацию
  if (session.verificationStatus === 'guest') {
    showRegistrationPrompt();
    return false;
  }

  // Документы отклонены оператором
  if (session.verificationStatus === 'rejected') {
    // Показываем причину отказа если есть
    const reason = session.rejectionReason || '';
    const reasonBox  = document.getElementById('blocked-reason-box');
    const reasonText = document.getElementById('blocked-reason-text');
    const reasonDef  = document.getElementById('blocked-reason-default');
    if (reasonBox && reasonText) {
      if (reason) {
        reasonBox.style.display = 'block';
        reasonText.textContent = reason;
        if (reasonDef) reasonDef.style.display = 'none';
      } else {
        reasonBox.style.display = 'none';
        if (reasonDef) reasonDef.style.display = 'block';
      }
    }
    showSheet('sheet-booking-blocked');
    return false;
  }

  // pending или verified — пускаем (verified сразу бронирует, pending — с предупреждением)
  if (session.verificationStatus === 'pending') {
    showSheet('sheet-booking-pending');
    return false;
  }

  // verified — полный доступ
  return true;
}

function showAuthPrompt() {
  showToastMsg('🔐', 'Нужна авторизация', 'Войдите по номеру телефона');
  setTimeout(() => showScreen('s-auth'), 800);
}

function showRegistrationPrompt() {
  showSheet('sheet-booking-register');
}

function startRegistrationForBooking() {
  closeAllSheets();
  showScreen('s-setup');
}

function closeAllSheets() {
  document.querySelectorAll('.sheet-overlay').forEach(s => {
    s.classList.remove('visible');
    setTimeout(() => s.style.display='none', 300);
  });
}

// ── TARIFF CALCULATOR ──────────────────────────────────────────────────────
let tcType = 'pack';
let tcSelIdx = 0;
let tcExtras = { delivery: false, kasko: false };
let tcTariffs = []; // загружается из Firebase

// Загрузка тарифов из Firestore
async function loadTariffsForCalc() {
  // Кэш: не более 1 запроса в 30 минут (тарифы меняются редко)
  const now = Date.now();
  if (window._tariffsLastFetch && (now - window._tariffsLastFetch) < 1800000 && tcTariffs.length > 0) {
    tcRenderPackGrid();
    return;
  }
  window._tariffsLastFetch = now;
  try {
    const FB_KEY = 'AIzaSyBQvTtF2NfK_Pvbb9qqf3tqqzXXXmrZbDk';
    const FB_PRJ = 'citycar-voronezh-3ed1b';
    const url = `https://firestore.googleapis.com/v1/projects/${FB_PRJ}/databases/(default)/documents/tariffs?key=${FB_KEY}&pageSize=50`;
    const resp = await fetch(url);
    if (!resp.ok) return;
    const data = await resp.json();
    if (!data.documents) return;
    tcTariffs = data.documents
      .map(doc => {
        const f = doc.fields || {};
        return {
          id:     doc.name.split('/').pop(),
          name:   f.name?.stringValue || '',
          emoji:  f.emoji?.stringValue || '🚗',
          price:  Number(f.price?.integerValue || f.price?.doubleValue || 0),
          hours:  Number(f.hours?.integerValue || f.hours?.doubleValue || 0),
          km:     Number(f.km?.integerValue || f.km?.doubleValue || 0),
          desc:   f.desc?.stringValue || '',
          badge:  f.badge?.stringValue || '',
          active: f.active?.booleanValue !== false
        };
      })
      .filter(t => t.active)
      .sort((a, b) => a.price - b.price);

    // Загружаем поминутный тариф
    const cfgUrl = `https://firestore.googleapis.com/v1/projects/${FB_PRJ}/databases/(default)/documents/config/minuteRate?key=${FB_KEY}`;
    const cfgResp = await fetch(cfgUrl);
    if (cfgResp.ok) {
      const cfgData = await cfgResp.json();
      const f = cfgData.fields || {};
      const base = Number(f.minuteBase?.integerValue || f.minuteBase?.doubleValue || 8);
      const wait = Number(f.minuteWait?.integerValue || f.minuteWait?.doubleValue || 4);
      document.getElementById('tc-min-rate').textContent = base;
      document.getElementById('tc-wait-rate').textContent = wait;
      document.getElementById('tc-min-price').textContent = base + ' ₽/мин';
      // Обновляем прогрессию
      const steps = [1, 0.95, 0.90, 0.85, 0.80];
      steps.forEach((mult, i) => {
        const el = document.getElementById('prog-' + i + '-rate');
        if (el) el.textContent = (base * mult).toFixed(1).replace('.', ',') + ' ₽/мин';
      });
    }

    tcRenderPackGrid();

    // Обновляем минимальную цену в кнопке
    if (tcTariffs.length > 0) {
      document.getElementById('tc-pack-from').textContent = 'от ' + tcTariffs[0].price.toLocaleString('ru-RU') + ' ₽';
    }
  } catch(e) {
    console.warn('[Tariffs] Ошибка загрузки:', e.message);
    tcRenderPackGrid(); // покажем что нет тарифов
  }
}

function tcRenderPackGrid() {
  const grid = document.getElementById('tc-pack-grid');
  if (!grid) return;
  if (!tcTariffs.length) {
    grid.innerHTML = '<div style="grid-column:span 2;text-align:center;padding:20px;color:var(--text3);font-size:13px">Тарифы не загружены</div>';
    return;
  }
  grid.innerHTML = tcTariffs.map((t, i) => {
    const meta = [t.hours ? (t.hours + ' ч') : '', t.km ? (t.km + ' км') : ''].filter(Boolean).join(' · ');
    const isWide = i === tcTariffs.length - 1 && tcTariffs.length % 2 !== 0;
    const isActive = i === tcSelIdx;
    const activeStyle = isActive ? 'border-color:var(--blue2);background:rgba(37,99,235,0.06)' : '';
    return `<div class="tc-pack-card" data-idx="${i}" onclick="tcSelectPack(${i})"
      style="background:var(--card);border:1.5px solid var(--border);border-radius:14px;padding:14px 12px;cursor:pointer;transition:all .15s;position:relative;${isWide ? 'grid-column:span 2' : ''};${activeStyle}">
      ${t.badge ? `<div style="position:absolute;top:-8px;left:10px;background:#F59E0B;color:#1a1000;font-size:10px;font-weight:500;padding:2px 7px;border-radius:6px">${t.badge}</div>` : ''}
      ${isWide ? `
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div>
            <div style="font-size:12px;font-weight:500;color:${isActive ? 'var(--blue2)' : 'var(--text2)'};margin-bottom:2px">${t.emoji} ${t.name}</div>
            <div style="font-size:11px;color:var(--text3)">${meta}</div>
          </div>
          <div style="font-size:19px;font-weight:600;color:var(--text1)">${t.price.toLocaleString('ru-RU')} ₽</div>
        </div>` : `
        <div style="font-size:19px;font-weight:600;color:var(--text1);margin-bottom:2px">${t.price.toLocaleString('ru-RU')} ₽</div>
        <div style="font-size:12px;font-weight:500;color:${isActive ? 'var(--blue2)' : 'var(--text2)'};margin-bottom:4px">${t.emoji} ${t.name}</div>
        <div style="font-size:11px;color:var(--text3)">${meta}</div>`}
    </div>`;
  }).join('');
}

function tcSelectPack(idx) {
  tcSelIdx = idx;
  const t = tcTariffs[idx];
  if (!t) return;
  state.basePrice = t.price;
  state.tarif = t.name;
  // Обновляем стили карточек
  document.querySelectorAll('.tc-pack-card').forEach((el, i) => {
    if (i === idx) {
      el.style.borderColor = 'var(--blue2)';
      el.style.background = 'rgba(37,99,235,0.06)';
    } else {
      el.style.borderColor = 'var(--border)';
      el.style.background = 'var(--card)';
    }
  });
  tcUpdateResult();
}

function tcUpdateResult() {
  const t = tcTariffs[tcSelIdx];
  if (!t) return;
  let ext = 0; const names = [];
  if (tcExtras.delivery) { ext += 850; names.push('Доставка'); }
  if (tcExtras.kasko)    { ext += 500; names.push('КАСКО'); }
  const total = t.price + ext;
  const meta = [t.hours ? (t.hours + ' ч') : '', t.km ? (t.km + ' км') : ''].filter(Boolean).join(' · ');

  document.getElementById('tc-r-name').textContent = t.name;
  document.getElementById('tc-r-meta').textContent = meta || t.desc || '—';
  document.getElementById('calcTotal2').textContent = total.toLocaleString('ru-RU') + ' ₽';

  const extRow = document.getElementById('tc-r-ext-row');
  if (names.length) {
    extRow.style.display = 'flex';
    document.getElementById('tc-r-ext').textContent = names.join(' + ') + ' (+' + ext.toLocaleString('ru-RU') + ' ₽)';
  } else {
    extRow.style.display = 'none';
  }
  document.getElementById('tc-result').style.display = 'block';
  document.getElementById('tc-book-btn').style.display = 'block';

  // Обновляем state для бронирования
  state.extras = ext;
  state.delivery = tcExtras.delivery;
  state.kasko = tcExtras.kasko;
}

function tcShowType(type) {
  tcType = type;
  const btnMin  = document.getElementById('tc-btn-min');
  const btnPack = document.getElementById('tc-btn-pack');
  const panMin  = document.getElementById('tc-panel-min');
  const panPack = document.getElementById('tc-panel-pack');
  if (type === 'min') {
    btnMin.style.borderColor  = 'var(--blue2)';
    btnMin.style.background   = 'rgba(37,99,235,0.06)';
    btnPack.style.borderColor = 'var(--border)';
    btnPack.style.background  = 'var(--card)';
    panMin.style.display  = 'block';
    panPack.style.display = 'none';
    // Инициализируем калькулятор при первом показе
    setTimeout(tcUpdateMinCalc, 50);
  } else {
    btnPack.style.borderColor = 'var(--blue2)';
    btnPack.style.background  = 'rgba(37,99,235,0.06)';
    btnMin.style.borderColor  = 'var(--border)';
    btnMin.style.background   = 'var(--card)';
    panMin.style.display  = 'none';
    panPack.style.display = 'block';
  }
}

function tcToggleExtra(key, price) {
  tcExtras[key] = !tcExtras[key];
  // Обновляем кнопки в обоих панелях
  ['min', 'pack'].forEach(panel => {
    const el = document.getElementById('tc-ex-' + key + '-' + panel);
    if (!el) return;
    if (tcExtras[key]) {
      el.style.borderColor = 'var(--blue2)';
      el.style.background  = 'rgba(37,99,235,0.06)';
      el.querySelector('div:nth-child(2)').style.color = 'var(--blue2)';
    } else {
      el.style.borderColor = 'var(--border)';
      el.style.background  = 'var(--card)';
      el.querySelector('div:nth-child(2)').style.color = 'var(--text2)';
    }
  });
  if (tcType === 'pack') tcUpdateResult();
}

// Обратная совместимость — старые функции
let calcExtras = 0;
const extraActive = { delivery: false, kasko: false };
function calcSelect(idx, price) { tcSelectPack(idx); }
function addExtra(el, price, label) { tcToggleExtra(label.toLowerCase(), price); }

// ── ПОМИНУТНЫЙ КАЛЬКУЛЯТОР ──────────────────────────────────────────────────
const TC_MIN_STEPS = [
  { from:0,   to:60,  mult:1.00 },
  { from:60,  to:90,  mult:0.95 },
  { from:90,  to:120, mult:0.90 },
  { from:120, to:180, mult:0.85 },
  { from:180, to:999, mult:0.80 }
];
let tcMinutes = 60; // текущее выбранное время

function tcCalcCost(min, baseRate) {
  baseRate = baseRate || 8;
  let total = 0, breakdown = [], rem = min;
  for (const s of TC_MIN_STEPS) {
    if (rem <= 0) break;
    const chunk = Math.min(rem, s.to - s.from);
    if (chunk <= 0) continue;
    const rate = baseRate * s.mult;
    total += chunk * rate;
    breakdown.push({ min: chunk, rate, cost: Math.round(chunk * rate) });
    rem -= chunk;
  }
  return { total: Math.round(total), breakdown };
}

function tcFmtMin(m) {
  if (m < 60) return m + ' мин';
  const h = Math.floor(m/60), mm = m%60;
  return h + ' ч' + (mm ? ' ' + mm + ' мин' : '');
}

function tcUpdateMinCalc() {
  const baseRate = parseInt(document.getElementById('tc-min-rate')?.textContent || '8') || 8;
  const min = tcMinutes;
  const { total, breakdown } = tcCalcCost(min, baseRate);

  const totalEl    = document.getElementById('tc-min-total');
  const breakEl    = document.getElementById('tc-min-breakdown');
  const displayEl  = document.getElementById('tc-min-display');
  const hintEl     = document.getElementById('tc-min-hint');

  if (totalEl)   totalEl.textContent   = total.toLocaleString('ru-RU') + ' ₽';
  if (breakEl)   breakEl.textContent   = breakdown.map(b => b.min + ' мин × ' + b.rate.toFixed(1) + ' ₽').join(' + ');
  if (displayEl) displayEl.textContent = min + ' мин';
  if (hintEl)    hintEl.textContent    = '= ' + tcFmtMin(min);

  // Сохраняем в state для бронирования
  state.minuteEstimate  = total;
  state.minuteMinutes   = min;
}

function tcSetMinutes(min) {
  tcMinutes = min;
  const slider = document.getElementById('tc-min-slider');
  if (slider) slider.value = min;
  // Обновляем стили пресетов
  document.querySelectorAll('.min-preset').forEach(btn => {
    const isActive = parseInt(btn.getAttribute('onclick').match(/\d+/)?.[0]) === min;
    btn.style.borderColor = isActive ? 'var(--blue2)' : 'var(--border)';
    btn.style.background  = isActive ? 'rgba(37,99,235,0.06)' : 'var(--bg)';
    btn.style.color       = isActive ? 'var(--blue2)' : 'var(--text2)';
  });
  tcUpdateMinCalc();
}

function tcOnSlider(val) {
  tcMinutes = parseInt(val);
  // Сбрасываем все пресеты
  document.querySelectorAll('.min-preset').forEach(btn => {
    btn.style.borderColor = 'var(--border)';
    btn.style.background  = 'var(--bg)';
    btn.style.color       = 'var(--text2)';
  });
  tcUpdateMinCalc();
}

// ── SHEETS ──
// openSheet перемещён ниже
function showSheet(id){ openSheet(id); }
function closeSheet(id){
  const o=document.getElementById(id);
  if(!o) return;
  o.classList.remove('visible');
  // После анимации полностью убираем overlay чтобы не перехватывал тапы
  setTimeout(()=>{
    o.style.display='none';
    o.style.pointerEvents='none';
  },320);
}
function openSheet(id){
  const o=document.getElementById(id);
  if(!o) return;
  // Сначала сбрасываем все другие шторки
  document.querySelectorAll('.sheet-overlay').forEach(s=>{
    if(s.id!==id && s.classList.contains('visible')){
      s.classList.remove('visible');
      setTimeout(()=>{s.style.display='none';s.style.pointerEvents='none';},320);
    }
  });
  o.style.pointerEvents='';
  o.style.display='flex';
  o.style.alignItems='flex-end';
  requestAnimationFrame(()=>requestAnimationFrame(()=>o.classList.add('visible')));
}
// Текущая выбранная машина для маршрута
let _selectedCar = null;

function openCarSheet(car) {
  // Обратная совместимость: если передана строка (старый вызов)
  if (typeof car === 'string') {
    const found = CARS.find(c => c.name === car);
    car = found || { name: car, price: arguments[1] || '', emoji: '🚗', status: 'free' };
  }
  _selectedCar = car;
  document.getElementById('sheet-car-title').textContent = car.emoji + ' ' + car.name;
  document.getElementById('sheet-car-price').textContent = car.price;
  // Статус авто
  const statusEl = document.getElementById('sheet-car-status');
  if (statusEl) {
    if (car.status === 'free') {
      statusEl.textContent = '✓ Свободна';
      statusEl.style.color = 'var(--green)';
    } else {
      statusEl.textContent = '✗ Занята';
      statusEl.style.color = '#ef4444';
    }
  }
  // Адрес
  const addrEl = document.getElementById('sheet-car-addr');
  if (addrEl) addrEl.textContent = car.addr || '';
  // Фото авто — пробуем загрузить с сервера, fallback на emoji
  const iconEl = document.getElementById('sheet-car-icon');
  if (iconEl) {
    // Читаем фото из Firebase — проверяем все возможные поля
    var photoUrl = car.photo || car.photoUrl || car.imageUrl || car.image || (car.photos && car.photos[0]) || null;
    if (photoUrl) {
      iconEl.dataset.emoji = car.emoji||'🚗';
      iconEl.innerHTML = '<img src="' + photoUrl + '" alt="' + (car.name||'') + '" ' +
        'style="width:100%;height:100%;object-fit:cover;border-radius:50%;" ' +
        'onerror="this.parentNode.textContent=this.parentNode.dataset.emoji;this.remove();">';
    } else {
      iconEl.textContent = car.emoji || '🚗';
    }
  }
  // Кнопка маршрута — показываем только если геолокация доступна
  const routeBtn = document.getElementById('sheet-car-route-btn');
  if (routeBtn) {
    routeBtn.style.display = userCoords ? 'block' : 'none';
  }
  openSheet('sheet-car');
}
function showDocsSheet(){openSheet('sheet-docs')}
function showCardsSheet(){openSheet('sheet-cards')}

// ─── ШТРАФЫ ──────────────────────────────────────────────────────────────────
async function showFinesSheet() {
  openSheet('sheet-fines');
  const cont = document.getElementById('fines-content');
  if (cont) cont.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text2)">⏳ Загрузка...</div>';
  await loadFines();
}

async function loadFines() {
  const sess = loadSession();
  if (!sess || !sess.phone) return;
  const cont = document.getElementById('fines-content');
  if (!cont) return;

  try {
    const FB_KEY = 'AIzaSyBQvTtF2NfK_Pvbb9qqf3tqqzXXXmrZbDk';
    const FB_PRJ = 'citycar-voronezh-3ed1b';

    // Ищем пользователя по телефону
    const qResp = await fetch(
      `https://firestore.googleapis.com/v1/projects/${FB_PRJ}/databases/(default)/documents:runQuery?key=${FB_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          structuredQuery: {
            from: [{ collectionId: 'users' }],
            where: { fieldFilter: { field: { fieldPath: 'phone' }, op: 'EQUAL', value: { stringValue: sess.phone } } },
            limit: 1
          }
        })
      }
    );
    const qData = await qResp.json();
    if (!qData[0] || !qData[0].document) {
      cont.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text2)">Нет данных</div>';
      return;
    }

    const fields = qData[0].document.fields || {};
    // Штрафы хранятся как массив в поле penalties
    const penaltiesField = fields.penalties;
    let fines = [];
    if (penaltiesField && penaltiesField.arrayValue && penaltiesField.arrayValue.values) {
      fines = penaltiesField.arrayValue.values.map(v => {
        const m = v.mapValue ? v.mapValue.fields : {};
        return {
          date:    m.date    ? (m.date.stringValue    || '') : '',
          amount:  m.amount  ? (Number(m.amount.integerValue || m.amount.doubleValue || 0)) : 0,
          reason:  m.reason  ? (m.reason.stringValue  || '') : '',
          paid:    m.paid    ? (m.paid.booleanValue    || false) : false,
          bookingId: m.bookingId ? (m.bookingId.stringValue || '') : ''
        };
      });
    }

    const unpaid = fines.filter(f => !f.paid);
    const paid   = fines.filter(f => f.paid);
    const totalUnpaid = unpaid.reduce((s, f) => s + f.amount, 0);

    // Обновляем бейдж и подпись в меню
    const badge   = document.getElementById('fines-badge');
    const menuSub = document.getElementById('fines-menu-sub');
    if (badge)   badge.style.display   = unpaid.length > 0 ? 'block' : 'none';
    if (menuSub) menuSub.textContent   = unpaid.length > 0
      ? unpaid.length + ' неоплаченных · ' + totalUnpaid.toLocaleString('ru-RU') + ' ₽'
      : 'Нет штрафов';

    if (fines.length === 0) {
      cont.innerHTML = `<div style="text-align:center;padding:40px 20px">
        <div style="font-size:48px;margin-bottom:12px">✅</div>
        <div style="font-size:16px;font-weight:600;margin-bottom:6px">Штрафов нет</div>
        <div style="font-size:13px;color:var(--text2)">Нарушений не зафиксировано</div>
      </div>`;
      return;
    }

    let html = '';

    if (unpaid.length > 0) {
      html += `<div style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.25);border-radius:12px;padding:14px 16px;margin-bottom:16px">
        <div style="font-size:13px;font-weight:600;color:var(--red);margin-bottom:4px">⚠️ Неоплаченные штрафы: ${totalUnpaid.toLocaleString('ru-RU')} ₽</div>
        <div style="font-size:12px;color:var(--text2)">Необходимо погасить перед следующей арендой</div>
      </div>`;
      unpaid.forEach(f => {
        html += _renderFineCard(f, false);
      });
    }

    if (paid.length > 0) {
      html += `<div style="font-size:12px;color:var(--text3);text-transform:uppercase;letter-spacing:1px;margin:16px 0 8px;padding:0 4px">Оплачено</div>`;
      paid.forEach(f => {
        html += _renderFineCard(f, true);
      });
    }

    cont.innerHTML = html;
  } catch(e) {
    console.warn('[Штрафы]', e);
    const cont2 = document.getElementById('fines-content');
    if (cont2) cont2.innerHTML = `<div style="text-align:center;padding:40px 20px;color:var(--text2)">
      <div style="font-size:40px;margin-bottom:12px">⚠️</div>
      <div style="font-size:15px;font-weight:600;margin-bottom:6px">Ошибка загрузки</div>
      <button class="btn btn-ghost" style="margin-top:12px;max-width:200px" onclick="loadFines()">🔄 Повторить</button>
    </div>`;
  }
}

function _renderFineCard(f, isPaid) {
  const color  = isPaid ? 'var(--green)' : 'var(--red)';
  const status = isPaid ? '✅ Оплачен' : '❌ Не оплачен';
  return `<div style="background:var(--card);border:1px solid var(--border);border-radius:14px;padding:14px 16px;margin-bottom:10px">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px">
      <div style="font-size:15px;font-weight:600">${f.reason || 'Штраф'}</div>
      <div style="font-size:15px;font-weight:700;color:${color}">${f.amount.toLocaleString('ru-RU')} ₽</div>
    </div>
    ${f.date ? `<div style="font-size:12px;color:var(--text3);margin-bottom:4px">📅 ${f.date}</div>` : ''}
    ${f.bookingId ? `<div style="font-size:12px;color:var(--text3);margin-bottom:4px">🆔 Аренда: #${f.bookingId.slice(-4).toUpperCase()}</div>` : ''}
    <div style="font-size:12px;font-weight:600;color:${color}">${status}</div>
  </div>`;
}

// Проверяем штрафы при загрузке профиля
async function checkAndShowFinesBadge() {
  const sess = loadSession();
  if (!sess || !sess.phone) return;
  try {
    // Используем кэш из onSnapshot — без запроса к Firebase
    const cached = window._cachedUserData;
    if (!cached) return; // данные ещё не загружены — пропускаем
    const pf = cached.penalties;
    // _cachedUserData — это snap.data(), массив уже распакован Firebase SDK
    if (!pf || !Array.isArray(pf)) return;
    const unpaidCount = pf.filter(v => !v.paid).length;
    const badge = document.getElementById('fines-badge');
    const menuSub = document.getElementById('fines-menu-sub');
    if (badge) badge.style.display = unpaidCount > 0 ? 'block' : 'none';
    if (menuSub) menuSub.textContent = unpaidCount > 0 ? unpaidCount + ' неоплаченных' : 'Нет штрафов';
  } catch(e) { console.warn('[FinesBadge]', e); }
}

// Блокировка бронирования если есть неоплаченные штрафы
async function checkFinesBeforeBooking() {
  const sess = loadSession();
  if (!sess || !sess.phone) return true;
  try {
    // Используем кэш из onSnapshot — без запроса к Firebase
    const cached = window._cachedUserData;
    if (!cached) return true; // нет данных — не блокируем
    const pf = cached.penalties;
    if (!pf || !Array.isArray(pf)) return true;
    const unpaid = pf.filter(v => !v.paid);
    if (unpaid.length > 0) {
      const total = unpaid.reduce((s, v) => s + Number(v.amount || 0), 0);
      showToastMsg('⚠️', 'Есть неоплаченные штрафы', 'Погасите ' + total.toLocaleString('ru-RU') + ' ₽ перед бронированием');
      setTimeout(() => showFinesSheet(), 1500);
      return false; // блокируем
    }
    return true;
  } catch(e) { return true; } // при ошибке не блокируем
}
// ─── CITYCOINS: конфигурация уровней лояльности ─────────────────────────────
window.LOYALTY_LEVELS = [
  { id:'new',      label:'Новый',     min:0,     max:999,    discount:0,  deposit:10000, icon:'⚪', color:'#9AA0B0' },
  { id:'regular',  label:'Постоянный',min:1000,  max:4999,   discount:5,  deposit:8000,  icon:'🟢', color:'#10b981' },
  { id:'reliable', label:'Надёжный',  min:5000,  max:14999,  discount:10, deposit:6000,  icon:'🔵', color:'#3b82f6' },
  { id:'partner',  label:'Партнёр',   min:15000, max:Infinity,discount:15,deposit:4000,  icon:'🥇', color:'#F59E0B' }
];

function getLoyaltyLevel(totalCoins) {
  const lvls = window.LOYALTY_LEVELS;
  for (let i = lvls.length - 1; i >= 0; i--) {
    if (totalCoins >= lvls[i].min) return lvls[i];
  }
  return lvls[0];
}

function _bonusRuleRow(icon, label, value) {
  return '<div style="display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid var(--border)">' +
    '<span style="font-size:13px;color:var(--text2)">' + icon + ' ' + label + '</span>' +
    '<span style="font-size:13px;font-weight:600;color:#F59E0B">' + value + '</span>' +
    '</div>';
}

function showBonusSheet() {
  var sess      = loadSession() || {};
  var coins     = sess.bonusPoints      || 0;
  var totalEver = sess.totalCoinsEarned || coins;
  var level     = getLoyaltyLevel(totalEver);
  var lvls      = window.LOYALTY_LEVELS;
  var nextLevel = lvls.find(function(l){ return l.min > totalEver; });
  var toNext    = nextLevel ? (nextLevel.min - totalEver) : 0;
  var progress  = nextLevel
    ? Math.round(((totalEver - level.min) / (nextLevel.min - level.min)) * 100)
    : 100;

  var sheet = document.getElementById('sheet-bonus');
  if (!sheet) {
    sheet = document.createElement('div');
    sheet.className = 'sheet-overlay';
    sheet.id = 'sheet-bonus';
    sheet.onclick = function(){ closeSheet('sheet-bonus'); };
    var inner = document.createElement('div');
    inner.className = 'sheet';
    inner.onclick = function(e){ e.stopPropagation(); };
    sheet.appendChild(inner);
    document.body.appendChild(sheet);
  }

  var progressBar = nextLevel
    ? ('<div style="margin-top:14px">' +
        '<div style="display:flex;justify-content:space-between;font-size:11px;opacity:0.75;margin-bottom:5px">' +
          '<span>' + level.label + '</span>' +
          '<span>До «' + nextLevel.label + '»: ещё ' + toNext.toLocaleString('ru-RU') + ' 🪙</span>' +
        '</div>' +
        '<div style="background:rgba(255,255,255,0.2);border-radius:99px;height:6px">' +
          '<div style="background:#fff;border-radius:99px;height:6px;width:' + Math.min(progress,100) + '%"></div>' +
        '</div>' +
      '</div>')
    : '<div style="margin-top:10px;font-size:12px;opacity:0.8">🏆 Максимальный уровень! Скидка 15% на все поездки</div>';

  var discountBadge = level.discount > 0
    ? '<div style="font-size:11px;opacity:0.8;margin-top:2px">−' + level.discount + '% на аренду</div>'
    : '';

  var inner2 = sheet.querySelector('.sheet');
  if (inner2) {
    inner2.innerHTML =
      '<div class="sheet-handle"></div>' +
      '<button class="sheet-close-btn" onclick="closeSheet(\'sheet-bonus\')">✕</button>' +
      '<div class="sheet-title">🪙 CityCoins</div>' +
      '<div style="padding:0 16px 28px;overflow-y:auto;max-height:80vh">' +

        // ── Баланс-карточка ──
        '<div style="background:linear-gradient(135deg,#1A4DA0,#0891B2);border-radius:16px;padding:20px;margin-bottom:16px;color:#fff">' +
          '<div style="display:flex;justify-content:space-between;align-items:flex-start">' +
            '<div>' +
              '<div style="font-size:11px;opacity:0.75;letter-spacing:1px;text-transform:uppercase;margin-bottom:4px">Ваш баланс</div>' +
              '<div style="font-size:38px;font-weight:800;line-height:1">' + coins.toLocaleString('ru-RU') + ' 🪙</div>' +
              '<div style="font-size:12px;opacity:0.8;margin-top:4px">= ' + coins.toLocaleString('ru-RU') + ' ₽ скидки</div>' +
            '</div>' +
            '<div style="text-align:right">' +
              '<div style="font-size:24px">' + level.icon + '</div>' +
              '<div style="font-size:14px;font-weight:700;margin-top:2px">' + level.label + '</div>' +
              discountBadge +
            '</div>' +
          '</div>' +
          progressBar +
        '</div>' +

        // ── Уровни лояльности ──
        '<div style="background:var(--card);border-radius:12px;border:1px solid var(--border);padding:14px;margin-bottom:14px">' +
          '<div style="font-size:12px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.8px;margin-bottom:10px">Уровни лояльности</div>' +
          lvls.map(function(l) {
            var active = l.id === level.id;
            return '<div style="display:flex;align-items:center;gap:10px;padding:8px;border-radius:8px;margin-bottom:4px;' +
              (active ? 'background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.3)' : 'opacity:0.55') + '">' +
              '<span style="font-size:18px">' + l.icon + '</span>' +
              '<div style="flex:1">' +
                '<div style="font-size:13px;font-weight:' + (active ? '700' : '500') + '">' + l.label +
                  (active ? ' <span style="font-size:10px;background:#F59E0B;color:#fff;padding:1px 6px;border-radius:99px;vertical-align:middle">ВЫ ЗДЕСЬ</span>' : '') +
                '</div>' +
                '<div style="font-size:11px;color:var(--text3)">' + l.min.toLocaleString('ru-RU') +
                  (l.max === Infinity ? '+' : '–' + l.max.toLocaleString('ru-RU')) + ' монет · залог ' + (l.deposit/1000) + ' 000 ₽' +
                '</div>' +
              '</div>' +
              '<div style="font-size:13px;font-weight:700;color:' + l.color + '">' +
                (l.discount > 0 ? '−' + l.discount + '%' : 'база') +
              '</div>' +
            '</div>';
          }).join('') +
        '</div>' +

        // ── Как начисляются ──
        '<div style="background:var(--card);border-radius:12px;border:1px solid var(--border);padding:14px;margin-bottom:14px">' +
          '<div style="font-size:12px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.8px;margin-bottom:8px">Как начисляются монеты</div>' +
          _bonusRuleRow('💳', 'За каждые 100 ₽ оплаты', '+10 🪙') +
          _bonusRuleRow('🎯', '3 поездки за месяц', '+100 🪙') +
          _bonusRuleRow('🔥', '5 поездок за месяц', '+300 🪙') +
          _bonusRuleRow('🏆', '10 поездок за месяц', '+800 🪙') +
          _bonusRuleRow('🕊️', '5 поездок подряд без штрафов', '+200 🪙') +
          _bonusRuleRow('⭐', 'При регистрации', '+200 🪙') +
          _bonusRuleRow('📅', 'Бронь за 24+ часа', '+30 🪙') +
          _bonusRuleRow('🎂', 'День рождения', '+150 🪙') +
          _bonusRuleRow('👥', 'Привели друга', '+500 🪙') +
        '</div>' +

        // ── Условия списания ──
        '<div style="font-size:12px;color:var(--text3);line-height:1.9;margin-bottom:18px;padding:12px;background:var(--card);border-radius:10px;border:1px solid var(--border)">' +
          '<b style="color:var(--text2)">Условия списания:</b><br>' +
          '• 1 CityСoin = 1 ₽ скидки<br>' +
          '• Максимум 30% стоимости поездки<br>' +
          '• Минимальный баланс для списания: 100 монет<br>' +
          '• Монеты действуют 4 месяца с последней поездки' +
        '</div>' +

        '<button class="btn" onclick="closeSheet(\'sheet-bonus\');openBookingWizard(\'tariff\')">🚗 Забронировать поездку</button>' +
      '</div>';
  }
  openSheet('sheet-bonus');
}

function showHistorySheet(){
  openSheet('sheet-history');
  // Рендер из кэша — без запроса к Firebase
  renderBookingHistory();
}
function showAddCard(){closeSheet('sheet-cards');openSheet('sheet-addcard')}

async function startCardBinding() {
  const btn = document.getElementById('btn-save-card');
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Переходим...'; }
  const sess = loadSession() || {};
  const phone = (sess.phone || state.phone || '').replace(/\D/g,'') || 'unknown';
  if (!sess.phone) {
    showToastMsg('⚠️','Нет сессии','Войдите в аккаунт');
    if (btn) { btn.disabled = false; btn.textContent = '💳 Перейти к привязке карты →'; }
    return;
  }
  try {
    // Инициализируем платёж 1 рубль для привязки карты (Recurrent)
    const resp = await fetch(WORKER_URL + '/pay', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bookingId: 'card_bind_' + phone + '_' + Date.now(),
        amount: 100,
        phone: sess.phone,
        description: 'Привязка карты CityCar (возврат автоматический)',
        email: sess.email || undefined
      })
    });
    const result = await resp.json();
    if (result.ok && result.paymentUrl) {
      window.location.href = result.paymentUrl;
    } else {
      const errMsg = result.error || result.details || 'Нет ответа от сервера';
      console.error('Card bind error:', JSON.stringify(result));
      showToastMsg('❌','Ошибка привязки', errMsg.slice(0,80));
      if (btn) { btn.disabled = false; btn.textContent = '💳 Перейти к привязке карты →'; }
    }
  } catch(e) {
    showToastMsg('❌','Ошибка сети','Проверьте соединение');
    if (btn) { btn.disabled = false; btn.textContent = '💳 Перейти к привязке карты →'; }
  }
}
function showProfileEdit(){showPersonalDataSheet()}

// ── TOAST ──
let toastTimer;
function showToastMsg(icon,title,msg){
  document.getElementById('toastIcon').textContent=icon;
  document.getElementById('toastTitle').textContent=title;
  document.getElementById('toastMsg').textContent=msg;
  const t=document.getElementById('toast');
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>t.classList.remove('show'),3000);
}

// ── YANDEX MAP ──
let ymapInstance = null;
let userPlacemark = null;
let ymapReady = false;

// CARS — динамически из Firebase (заполняется после loadFleetCatalog)
// Геттер который всегда берёт актуальные данные
function getCarsForMap() {
  if (window._fleetData && window._fleetData.length > 0) {
    return window._fleetData.map(c => ({
      id: c.id, name: c.name, emoji: c.emoji || '🚗',
      lat: c.lat, lon: c.lng || c.lon,
      addr: c.addr || '', status: c.status || 'free'
    }));
  }
  return [];
}

function initYmap() {
  ymaps.ready(function() {
    ymapReady = true;
    ymapInstance = new ymaps.Map('ymap', {
      center: [51.6607, 39.2003],
      zoom: 14,
      controls: []
    }, {
      suppressMapOpenBlock: true
    });

    // Dark theme / custom tiles workaround — set dark background
    document.getElementById('ymap').style.background = '#0A0E1A';

    // Add car placemarks из Firebase
    getCarsForMap().forEach(function(car) {
      var carColor = car.status === 'free' ? 'var(--green)' : '#EF4444';
      var placemark = new ymaps.Placemark([car.lat, car.lon], {
        balloonContentHeader: car.emoji + ' ' + car.name,
        balloonContentBody: '<div style="font-size:13px;line-height:1.6">' +
          '<b>' + car.addr + '</b><br>' +
          (car.status === 'free' ? '<span style="color:var(--green)">✓ Свободна</span>' : '<span style="color:#EF4444">✗ Занята</span>') +
          '</div>',
        iconContent: car.emoji
      }, {
        preset: car.status === 'free' ? 'islands#greenStretchyIcon' : 'islands#redStretchyIcon'
      });
      placemark.events.add('click', (function(c) {
        return function() { openCarSheet(c); };
      })(car));
      ymapInstance.geoObjects.add(placemark);
    });

    // Try geolocation on init
    ymapGeolocate();
    // Рисуем метки авто — если данные уже есть, сразу; если нет — через 2с
    refreshMapPlacemarks();
    setTimeout(function() { refreshMapPlacemarks(); }, 2000);

    // Загружаем и рисуем зоны завершения аренды
    loadAndDrawZones();
  });
}

// ─── ЗОНЫ ЗАВЕРШЕНИЯ АРЕНДЫ ──────────────────────────────────────
// Глобальные ссылки на объекты карты (чтобы можно было перерисовать)
var _zonePolygonFree       = null;
var _zonePolygonSurcharge  = null;
var _zoneLegendVisible     = false;

// Координаты зон по умолчанию (из публичного сайта citycar)
// Можно перезаписать из Firestore (config/mapZones)
var DEFAULT_FREE_ZONE = [
  [51.71,39.135],[51.72,39.155],[51.73,39.17],[51.725,39.21],[51.718,39.23],
  [51.705,39.24],[51.695,39.245],[51.685,39.24],[51.675,39.235],[51.665,39.228],
  [51.655,39.215],[51.645,39.2],[51.638,39.185],[51.64,39.165],[51.645,39.148],
  [51.655,39.135],[51.665,39.125],[51.68,39.118],[51.695,39.118],[51.71,39.135]
];
var DEFAULT_SURCHARGE_ZONE = [
  [51.83,39.12],[51.835,39.2],[51.83,39.27],[51.81,39.3],[51.79,39.32],
  [51.76,39.33],[51.73,39.31],[51.71,39.295],[51.7,39.285],[51.69,39.29],
  [51.68,39.295],[51.66,39.285],[51.64,39.265],[51.625,39.24],[51.615,39.21],
  [51.61,39.18],[51.615,39.14],[51.625,39.11],[51.64,39.085],[51.66,39.07],
  [51.68,39.065],[51.7,39.07],[51.72,39.08],[51.75,39.09],[51.78,39.1],
  [51.81,39.105],[51.83,39.12]
];

// Актуальные зоны (обновляются из Firebase)
window._mapZones = {
  freeZone:       DEFAULT_FREE_ZONE,
  surchargeZone:  DEFAULT_SURCHARGE_ZONE,
  surchargeAmount: 300
};

async function loadAndDrawZones() {
  // Сначала рисуем дефолтные — мгновенно
  drawZonePolygons(window._mapZones.freeZone, window._mapZones.surchargeZone);
  drawZoneLegend();

  // Подписываемся на realtime обновления зон из Firebase
  try {
    const { doc, onSnapshot } =
      await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
    const zoneRef = doc(window._firestoreDB, 'config', 'mapZones');
    // Отписываемся от предыдущего listener если был
    if (window._zonesUnsubscribe) window._zonesUnsubscribe();
    window._zonesUnsubscribe = onSnapshot(zoneRef, (snap) => {
      if (!snap.exists()) return;
      const data = snap.data();
      function normalizeZone(arr) {
        if (!arr || arr.length < 3) return null;
        if (Array.isArray(arr[0])) return arr;
        return arr.map(p => [p.lat, p.lng]);
      }
      const fz = normalizeZone(data.freeZone);
      const sz = normalizeZone(data.surchargeZone);
      if (fz) window._mapZones.freeZone = fz;
      if (sz) window._mapZones.surchargeZone = sz;
      if (data.surchargeAmount) window._mapZones.surchargeAmount = data.surchargeAmount;
      drawZonePolygons(window._mapZones.freeZone, window._mapZones.surchargeZone);
      drawZoneLegend();
    }, (e) => {
      console.warn('[Zones] Firebase ошибка:', e);
    });
  } catch(e) {
    console.warn('[Zones] Firebase недоступен, используем зоны по умолчанию', e);
  }
}

function drawZonePolygons(freeCoords, surchargeCoords) {
  if (!ymapReady || !ymapInstance) return;

  // Удаляем старые полигоны
  if (_zonePolygonSurcharge) ymapInstance.geoObjects.remove(_zonePolygonSurcharge);
  if (_zonePolygonFree)      ymapInstance.geoObjects.remove(_zonePolygonFree);

  // Жёлтый полигон (зона с доплатой) — рисуем первым, он снизу
  _zonePolygonSurcharge = new ymaps.Polygon([surchargeCoords], {
    hintContent: 'Зона завершения с доплатой +' + window._mapZones.surchargeAmount + ' ₽'
  }, {
    fillColor:    '#F59E0B',
    fillOpacity:  0.08,
    strokeColor:  '#D97706',
    strokeWidth:  2,
    strokeStyle:  'dash',
    zIndex: 1
  });
  ymapInstance.geoObjects.add(_zonePolygonSurcharge);

  // Зелёный полигон (бесплатная зона) — поверх
  _zonePolygonFree = new ymaps.Polygon([freeCoords], {
    hintContent: 'Бесплатная зона завершения аренды'
  }, {
    fillColor:   '#22C55E',
    fillOpacity: 0.12,
    strokeColor: '#16A34A',
    strokeWidth: 2,
    zIndex: 2
  });
  ymapInstance.geoObjects.add(_zonePolygonFree);
}

function drawZoneLegend() {
  if (_zoneLegendVisible) return;
  _zoneLegendVisible = true;
  const mapWrap = document.querySelector('.map-wrap');
  if (!mapWrap) return;

  const legend = document.createElement('div');
  legend.id = 'zone-legend';
  legend.style.cssText = `
    position:absolute;bottom:8px;left:8px;right:8px;z-index:10;
    background:rgba(10,14,26,0.55);backdrop-filter:blur(6px);
    -webkit-backdrop-filter:blur(6px);
    border:1px solid rgba(255,255,255,0.10);border-radius:10px;
    padding:7px 14px;font-size:11px;color:#fff;pointer-events:none;
    display:flex;align-items:center;gap:14px;flex-wrap:wrap;
  `;
  legend.innerHTML = `
    <span style="opacity:0.55;font-size:10px;letter-spacing:.5px;white-space:nowrap">ЗОНЫ:</span>
    <span><span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:#22C55E;border:1.5px solid #16A34A;vertical-align:middle;margin-right:4px"></span>Бесплатно</span>
    <span><span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:#F59E0B;border:1.5px solid #D97706;vertical-align:middle;margin-right:4px"></span>+${window._mapZones.surchargeAmount} ₽</span>
    <span><span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:#EF4444;border:1.5px solid #B91C1C;vertical-align:middle;margin-right:4px"></span>Запрещено</span>
  `;
  mapWrap.appendChild(legend);
}

// ─── ПРОВЕРКА НАХОЖДЕНИЯ ТОЧКИ В ПОЛИГОНЕ (Ray-casting) ─────────
function pointInPolygon(point, polygon) {
  var x = point[0], y = point[1];
  var inside = false;
  for (var i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    var xi = polygon[i][0], yi = polygon[i][1];
    var xj = polygon[j][0], yj = polygon[j][1];
    var intersect = ((yi > y) !== (yj > y)) &&
                    (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

// Возвращает: 'free' | 'surcharge' | 'forbidden'
function getZoneForPoint(coords) {
  if (!coords) return 'forbidden';
  var zones = window._mapZones;
  if (pointInPolygon(coords, zones.freeZone))      return 'free';
  if (pointInPolygon(coords, zones.surchargeZone)) return 'surcharge';
  return 'forbidden';
}
// ─────────────────────────────────────────────────────────────────

// Координаты пользователя (обновляются при геолокации)
var userCoords = null;
// Текущий маршрут на карте
var activeRoute = null;

function ymapGeolocate() {
  if (!ymapReady) return;
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function(pos) {
      var lat = pos.coords.latitude;
      var lon = pos.coords.longitude;
      userCoords = [lat, lon];
      ymapInstance.setCenter([lat, lon], 15, { duration: 600 });
      if (userPlacemark) ymapInstance.geoObjects.remove(userPlacemark);
      // Синяя пульсирующая точка «Вы здесь»
      userPlacemark = new ymaps.Placemark([lat, lon], {
        hintContent: 'Вы здесь'
      }, {
        preset: 'islands#blueCircleDotIcon',
        iconColor: '#3B82F6'
      });
      ymapInstance.geoObjects.add(userPlacemark);
      showToastMsg('📍', 'Геолокация', 'Ваше местоположение найдено');
      // Если шторка авто открыта — показываем кнопку маршрута
      const routeBtn = document.getElementById('sheet-car-route-btn');
      if (routeBtn) routeBtn.style.display = 'block';
    }, function(err) {
      // fallback — центр Воронежа
      ymapInstance.setCenter([51.6607, 39.2003], 14);
      showToastMsg('📍', 'Геолокация', 'Разрешите доступ к геолокации');
    }, { enableHighAccuracy: true, timeout: 8000 });
  } else {
    ymapInstance.setCenter([51.6607, 39.2003], 14);
  }
}

function buildRouteToCar() {
  if (!_selectedCar || !userCoords || !ymapReady) {
    showToastMsg('⚠️', 'Маршрут', 'Сначала разрешите геолокацию');
    return;
  }
  // Закрываем шторку, переходим на карту
  closeSheet('sheet-car');
  switchTab('map');

  // Удаляем предыдущий маршрут
  if (activeRoute) {
    ymapInstance.geoObjects.remove(activeRoute);
    activeRoute = null;
  }

  var from = userCoords;
  var to   = [_selectedCar.lat, _selectedCar.lon];

  showToastMsg('🗺', 'Строим маршрут', 'До ' + _selectedCar.name + '...');

  ymaps.route([
    { type: 'wayPoint', point: from },
    { type: 'wayPoint', point: to }
  ], {
    routingMode: 'pedestrian',  // пешеходный маршрут до авто
    mapStateAutoApply: true
  }).then(function(route) {
    activeRoute = route;

    // Стиль линии маршрута
    route.getPaths().each(function(path) {
      path.getSegments().each(function(segment) {
        segment.options.set({
          strokeColor: '#3B82F6',
          strokeWidth: 4,
          strokeOpacity: 0.85
        });
      });
    });

    ymapInstance.geoObjects.add(route);

    // Подгоняем карту под маршрут
    ymapInstance.setBounds(route.getBounds(), {
      checkZoomRange: true,
      zoomMargin: 48,
      duration: 600
    });

    // Дистанция и время
    var dist = route.getHumanLength();
    var time = route.getHumanTime();
    showToastMsg('🚶', dist + ' · ' + time, 'Пешком до ' + _selectedCar.name);

    // Кнопка «Отменить маршрут» на карте
    showRouteCancelBtn(_selectedCar.name);

  }).catch(function() {
    showToastMsg('⚠️', 'Маршрут', 'Не удалось построить маршрут');
  });
}

function clearRoute() {
  if (activeRoute && ymapReady) {
    ymapInstance.geoObjects.remove(activeRoute);
    activeRoute = null;
  }
  const btn = document.getElementById('route-cancel-btn');
  if (btn) btn.style.display = 'none';
}

function showRouteCancelBtn(carName) {
  let btn = document.getElementById('route-cancel-btn');
  if (!btn) {
    btn = document.createElement('div');
    btn.id = 'route-cancel-btn';
    btn.style.cssText = 'position:absolute;bottom:90px;left:50%;transform:translateX(-50%);z-index:20;background:#1E2640;border:1px solid rgba(59,130,246,0.4);border-radius:24px;padding:10px 20px;display:flex;align-items:center;gap:8px;cursor:pointer;box-shadow:0 4px 20px rgba(0,0,0,0.4);white-space:nowrap;';
    btn.innerHTML = '<span style="font-size:19px">🔵</span><span style="font-size:13px;color:#fff">Маршрут до ' + carName + '</span><span style="font-size:13px;color:#ef4444;margin-left:8px" onclick="clearRoute()">✕</span>';
    // Нажатие на кнопку — открываем шторку авто
    btn.addEventListener('click', function(e) {
      if (e.target.style.color === 'rgb(239, 68, 68)') return;
      if (_selectedCar) openCarSheet(_selectedCar);
    });
    const mapTab = document.getElementById('tab-map');
    if (mapTab) mapTab.style.position = 'relative';
    const mapContainer = document.getElementById('tab-map');
    if (mapContainer) mapContainer.appendChild(btn);
  } else {
    btn.style.display = 'flex';
    btn.querySelector('span:nth-child(2)').textContent = 'Маршрут до ' + carName;
  }
}

function ymapFlyTo(lat, lon, name) {
  if (!ymapReady) { showToastMsg('🗺','Карта','Карта загружается...'); return; }
  ymapInstance.setCenter([lat, lon], 16, { duration: 500 });
  showToastMsg('🚗', name, 'Метка найдена на карте');
}

function ymapSearch() {
  if (!ymapReady) return;
  var addr = prompt('Введите адрес в Воронеже:');
  if (!addr) return;
  document.getElementById('mapSearchText').textContent = addr;
  ymaps.geocode('Воронеж, ' + addr).then(function(res) {
    var obj = res.geoObjects.get(0);
    if (obj) {
      var coords = obj.geometry.getCoordinates();
      ymapInstance.setCenter(coords, 16, { duration: 500 });
    } else {
      showToastMsg('⚠️','Адрес','Адрес не найден');
    }
  });
}

// Init map when main screen shown (lazy init)
var _origShowScreen = showScreen;
showScreen = function(id) {
  _origShowScreen(id);
  if (id === 's-main' && !ymapReady && typeof ymaps !== 'undefined') {
    setTimeout(initYmap, 300);
  }
};

// Also init if we land on s-main directly
window.addEventListener('load', function() {
  if (typeof ymaps !== 'undefined') {
    setTimeout(initYmap, 800);
  }
});



// ════════════════════════════════════════════════════════════
// АКТИВНАЯ АРЕНДА — состояние и логика
// ════════════════════════════════════════════════════════════

window._activeRental = null;       // данные текущей аренды
window._rentalTimer  = null;       // интервал таймера
window._inspectionPhotos = {};     // фото осмотра { front, back, left, right, salon, odometer }
window._currentInspectionSlot = null;

// Запустить экран активной аренды (вызывается когда статус = active)
function startRentalScreen(booking) {
  window._activeRental = booking;
  window._inspectionPhotos = {};
  window._operatorFinishedHandled = false;
  window._totalPauseMs = 0; // сброс паузы при старте новой аренды
  window._rentalPaused = false;
  window._pauseStartTime = null;

  // Заполняем шапку
  document.getElementById('rental-car-name').textContent   = booking.car || '—';
  document.getElementById('rental-tariff-name').textContent = booking.tarif || '—';
  document.getElementById('rental-addr').textContent        = booking.addr || '—';
  document.getElementById('rental-paid-amount').textContent = (booking.total || 0).toLocaleString('ru-RU') + ' ₽';

  // Время
  const startDT = booking.startedAt ? new Date(booking.startedAt) : new Date();
  // durationMin: для поминутного тарифа — estimateMinutes, для пакетного — durationMin из Firebase
  const durationMin = booking.tariffType === 'minute'
    ? (booking.estimateMinutes || booking.durationMin || 60)
    : (booking.durationMin || 120);
  const paidUntil = booking.paidUntil
    ? new Date(booking.paidUntil)
    : new Date(startDT.getTime() + durationMin * 60000);

  window._activeRental.paidUntilDT = paidUntil;
  window._activeRental.startDT     = startDT;

  const pad = n => String(n).padStart(2,'0');
  document.getElementById('rental-start-time').textContent = pad(startDT.getHours())+':'+pad(startDT.getMinutes());
  document.getElementById('rental-end-time').textContent   = pad(paidUntil.getHours())+':'+pad(paidUntil.getMinutes());
  document.getElementById('rental-paid-until-text').textContent = pad(paidUntil.getHours())+':'+pad(paidUntil.getMinutes());

  // Показываем экран
  const rentalScreen = document.getElementById('screen-rental');
  rentalScreen.classList.add('active');
  rentalScreen.classList.remove('minimized');
  const pill = document.getElementById('rental-nav-pill');
  if (pill) pill.style.display = 'none';

  // Запускаем таймер
  if (window._rentalTimer) clearInterval(window._rentalTimer);
  updateRentalTimer();
  window._rentalTimer = setInterval(updateRentalTimer, 1000);
}

function updateRentalTimer() {
  const rental = window._activeRental;
  if (!rental || !rental.paidUntilDT) return;

  const now      = new Date();
  const paidUntil = rental.paidUntilDT;
  const diffMs   = paidUntil - now;

  const timerEl   = document.getElementById('rental-timer');
  const labelEl   = document.getElementById('rental-timer-label');
  const warnBanner = document.getElementById('rental-warning-banner');
  const pad = n => String(n).padStart(2,'0');

  if (diffMs > 0) {
    // Ещё есть время
    const h = Math.floor(diffMs / 3600000);
    const m = Math.floor((diffMs % 3600000) / 60000);
    const s = Math.floor((diffMs % 60000) / 1000);
    timerEl.textContent = pad(h)+':'+pad(m)+':'+pad(s);

    if (window._rentalPaused) {
      timerEl.className = 'rental-timer';
      timerEl.style.color = 'var(--gold)';
      labelEl.textContent = 'пауза активна · 4 ₽/мин';
    } else {
      timerEl.style.color = '';
      labelEl.textContent = 'осталось оплаченного времени';
      timerEl.className = 'rental-timer';
      if (diffMs < 5 * 60000)       timerEl.classList.add('danger');
      else if (diffMs < 15 * 60000) timerEl.classList.add('warning');
    }

    warnBanner.style.display = (!window._rentalPaused && diffMs < 15 * 60000) ? 'block' : 'none';

  } else {
    // Время вышло — идёт сверхурочно
    const overMs = now - paidUntil;
    const h = Math.floor(overMs / 3600000);
    const m = Math.floor((overMs % 3600000) / 60000);
    const s = Math.floor((overMs % 60000) / 1000);
    timerEl.textContent = '+'+pad(h)+':'+pad(m)+':'+pad(s);
    timerEl.className   = 'rental-timer danger';
    labelEl.textContent = 'сверхурочное время · 300 ₽ / 30 мин';
    warnBanner.style.display = 'block';

    // Каждые 30 минут — уведомление об автосписании
    const overMin = Math.floor(overMs / 60000);
    if (overMin > 0 && overMin % 30 === 0 && (overMs % 60000) < 2000) {
      showToastMsg('💳','Сверхурочное время','Списываем 300 ₽ за следующие 30 минут');
    }
  }
}

// Текущий выбранный вариант продления
window._extendChoice = { idx:0, min:30, price:300 };

function showExtendSheet() {
  // Сбрасываем на первый вариант
  selectExtend(0, 30, 300);
  openSheet('sheet-extend');
}

function selectExtend(idx, min, price) {
  window._extendChoice = { idx, min, price };
  // Снимаем выделение со всех
  [0,1,2,3].forEach(i => {
    const el = document.getElementById('ext-' + i);
    if (el) el.classList.remove('selected');
  });
  const sel = document.getElementById('ext-' + idx);
  if (sel) sel.classList.add('selected');
  // Обновляем кнопку
  const priceBtn = document.getElementById('extend-price-btn');
  if (priceBtn) priceBtn.textContent = price.toLocaleString('ru-RU') + ' ₽';
  // Показываем новое время окончания
  const newTimeEl = document.getElementById('extend-new-time');
  if (newTimeEl && window._activeRental?.paidUntilDT) {
    const pad = n => String(n).padStart(2,'0');
    const newDT = new Date(window._activeRental.paidUntilDT.getTime() + min * 60000);
    newTimeEl.textContent = pad(newDT.getHours()) + ':' + pad(newDT.getMinutes());
  }
}

async function confirmExtend() {
  closeSheet('sheet-extend');
  const { min, price } = window._extendChoice || { min:30, price:300 };
  const rental = window._activeRental;
  if (!rental || !rental.paidUntilDT) return;

  const bookingId = rental.id || '';
  const phone = rental.phone || (loadSession()||{}).phone || '';

  // rebillId берём из памяти, если нет — читаем свежий из Firebase
  let rebillId = rental.rebillId || (loadSession()||{}).rebillId || '';
  if (!rebillId && bookingId && window._firestoreDB) {
    try {
      const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
      const snap = await getDoc(doc(window._firestoreDB, 'bookings', bookingId));
      if (snap.exists()) {
        const bdata = snap.data();
        rebillId = bdata.rebillId || '';
        if (rebillId) rental.rebillId = rebillId;
        if (!phone && bdata.phone) rental.phone = bdata.phone;
      }
    } catch(e) { console.warn('rebillId fetch:', e); }
  }

  if (!rebillId) {
    showToastMsg('⚠️', 'Карта не привязана', 'Для продления необходима привязанная карта. Свяжитесь с оператором.');
    return;
  }

  const btn = document.getElementById('btn-confirm-extend');
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Списываем...'; }

  try {
    const resp = await fetch(WORKER_URL + '/rebill', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rebillId,
        bookingId: bookingId,  // чистый id — Worker сам добавит суффикс для OrderId
        amount: price,
        phone: (rental.phone || (loadSession()||{}).phone || '').replace(/\D/g,''),
        description: 'Продление аренды CityCar · ' + min + ' мин'
      })
    });
    const result = await resp.json();

    if (result.ok) {
      rental.paidUntilDT = new Date(rental.paidUntilDT.getTime() + min * 60000);
      const pad = n => String(n).padStart(2,'0');
      const newUntil = rental.paidUntilDT;
      const timeStr = pad(newUntil.getHours()) + ':' + pad(newUntil.getMinutes());
      document.getElementById('rental-end-time').textContent        = timeStr;
      document.getElementById('rental-paid-until-text').textContent = timeStr;
      if (bookingId && window._firestoreDB) {
        try {
          const { doc, updateDoc } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
          await updateDoc(doc(window._firestoreDB, 'bookings', bookingId), {
            paidUntil: rental.paidUntilDT.toISOString(),
            extendedAt: new Date().toISOString()
          });
        } catch(e) { console.warn('extend firebase:', e); }
      }
      showToastMsg('✅', 'Продлено!', 'Аренда продлена до ' + timeStr + ' · ' + price.toLocaleString('ru-RU') + ' ₽');
    } else {
      showToastMsg('❌', 'Ошибка оплаты', result.error || 'Не удалось списать средства. Проверьте карту.');
    }
  } catch(e) {
    console.error('confirmExtend:', e);
    showToastMsg('❌', 'Ошибка', 'Нет соединения с платёжным сервисом');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = price.toLocaleString('ru-RU') + ' ₽'; }
  }
}


// ─── ПАУЗА ───────────────────────────────────────
window._rentalPaused = false;
window._pauseStartTime = null;
window._pauseRatePerMin = 4; // ₽/мин во время паузы
window._totalPauseMs = 0;    // суммарное время всех пауз за поездку

function toggleRentalPause() {
  if (window._rentalPaused) {
    resumeRental();
  } else {
    showPauseConfirm();
  }
}

function showPauseConfirm() {
  const rental = window._activeRental;
  const normalRate = rental?.ratePerMin || 8.7;

  let overlay = document.getElementById('pause-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'pause-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:9998;background:rgba(0,0,0,0.75);backdrop-filter:blur(4px);display:flex;align-items:flex-end;justify-content:center;padding-bottom:env(safe-area-inset-bottom,0)';
    document.body.appendChild(overlay);
  }
  overlay.innerHTML = `
    <div style="background:var(--card);border-radius:24px 24px 0 0;padding:28px 24px 36px;width:100%;max-width:500px;border-top:1px solid var(--border)">
      <div style="text-align:center;margin-bottom:20px">
        <div style="font-size:52px;margin-bottom:10px">⏸</div>
        <div style="font-size:19px;font-weight:700;margin-bottom:8px">Поставить на паузу</div>
        <div style="font-size:13px;color:var(--text2);line-height:1.7">
          Авто ждёт вас — аренда не завершается.<br>
          Тариф снизится с <b>${normalRate} ₽/мин</b> до <b>4 ₽/мин</b>.<br>
          Максимальное время паузы — <b>12 часов</b>.
        </div>
      </div>
      <div style="background:var(--card2);border-radius:12px;padding:12px 14px;margin-bottom:20px;font-size:13px;color:var(--text2)">
        <div style="margin-bottom:6px">1. Нажмите «Поставить на паузу»</div>
        <div style="margin-bottom:6px">2. Выйдите из авто, двери заблокируются</div>
        <div>3. Для продолжения нажмите «Продолжить» — двери откроются</div>
      </div>
      <button onclick="activatePause()" style="width:100%;padding:15px;background:var(--blue);border:none;border-radius:14px;font-size:16px;font-weight:600;color:#fff;cursor:pointer;margin-bottom:10px">
        ⏸ Поставить на паузу
      </button>
      <button onclick="document.getElementById('pause-overlay').style.display='none'" style="width:100%;padding:15px;background:var(--card2);border:1px solid var(--border);border-radius:14px;font-size:15px;font-weight:600;color:var(--text);cursor:pointer">
        Отмена
      </button>
    </div>`;
  overlay.style.display = 'flex';
}

function activatePause() {
  window._rentalPaused = true;
  window._pauseStartTime = new Date();
  const overlay = document.getElementById('pause-overlay');
  if (overlay) overlay.style.display = 'none';

  const btn = document.getElementById('btn-rental-pause');
  if (btn) {
    btn.textContent = '▶️ Продолжить аренду';
    btn.style.background = 'rgba(234,179,8,0.15)';
    btn.style.borderColor = 'rgba(234,179,8,0.5)';
    btn.style.color = 'var(--gold)';
  }

  // Показываем баннер паузы
  let pauseBanner = document.getElementById('pause-banner');
  if (!pauseBanner) {
    pauseBanner = document.createElement('div');
    pauseBanner.id = 'pause-banner';
    pauseBanner.style.cssText = 'background:rgba(234,179,8,0.1);border:1px solid rgba(234,179,8,0.3);border-radius:12px;padding:12px 16px;margin-top:12px;font-size:13px;color:var(--gold);text-align:center';
    const warnBanner = document.getElementById('rental-warning-banner');
    if (warnBanner && warnBanner.parentNode) warnBanner.parentNode.insertBefore(pauseBanner, warnBanner.nextSibling);
  }
  if (pauseBanner) {
    pauseBanner.style.display = 'block';
    pauseBanner.innerHTML = '⏸ <b>Пауза активна</b> · 4 ₽/мин · Нажмите «Продолжить» для возобновления';
  }

  const rental = window._activeRental || {};
  sendTelegramMessage(TG_CHAT_OPERATOR,
`⏸ <b>ПАУЗА — CityCAR</b>
🚗 ${rental.car || '—'}
🆔 ${rental.id || '—'}
🕐 ${new Date().toLocaleString('ru-RU', {timeZone:'Europe/Moscow'})}`);

  showToastMsg('⏸', 'Пауза активирована', 'Тариф снижен до 4 ₽/мин');
}

async function resumeRental() {
  const pauseStart = window._pauseStartTime || new Date();
  const pauseMs  = new Date() - pauseStart;
  const pauseMin = Math.ceil(pauseMs / 60000);

  window._rentalPaused   = false;
  window._pauseStartTime = null;
  // Накапливаем суммарное время паузы для финального расчёта
  window._totalPauseMs = (window._totalPauseMs || 0) + pauseMs;

  // Продлеваем paidUntilDT на время паузы — таймер «не стёк» пока стояли
  if (window._activeRental && window._activeRental.paidUntilDT) {
    window._activeRental.paidUntilDT = new Date(
      window._activeRental.paidUntilDT.getTime() + pauseMs
    );
    // Обновляем отображение времени окончания
    const pad = n => String(n).padStart(2,'0');
    const newUntil = window._activeRental.paidUntilDT;
    const timeStr  = pad(newUntil.getHours()) + ':' + pad(newUntil.getMinutes());
    const endEl    = document.getElementById('rental-end-time');
    const untilEl  = document.getElementById('rental-paid-until-text');
    if (endEl)   endEl.textContent   = timeStr;
    if (untilEl) untilEl.textContent = timeStr;

    // Сохраняем новый paidUntil в Firebase
    const rental = window._activeRental;
    if (rental.id && window._firestoreDB) {
      try {
        const { doc, updateDoc } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
        await updateDoc(doc(window._firestoreDB, 'bookings', rental.id), {
          paidUntil: rental.paidUntilDT.toISOString()
        });
      } catch(e) { console.warn('pause paidUntil update:', e); }
    }

    // Возврат за паузу НЕ делаем здесь — он учитывается в финальном
    // пересчёте при завершении аренды через _totalPauseMs.
    // Промежуточный возврат при каждом снятии с паузы создаёт проблемы
    // с балансом при множественных паузах за поездку.
    const rental2 = window._activeRental;
    if (rental2) {
      console.log('[Пауза] Снята. Накоплено пауз:', Math.ceil((window._totalPauseMs||0) / 60000) + pauseMin, 'мин');
    }
  }

  const btn = document.getElementById('btn-rental-pause');
  if (btn) {
    btn.textContent = '⏸ Пауза — поставить авто на стоп';
    btn.style.background = 'var(--card)';
    btn.style.borderColor = 'var(--border)';
    btn.style.color = 'var(--text)';
  }

  const pauseBanner = document.getElementById('pause-banner');
  if (pauseBanner) pauseBanner.style.display = 'none';

  const rental3 = window._activeRental || {};
  sendTelegramMessage(TG_CHAT_OPERATOR,
`▶️ <b>ПРОДОЛЖЕНИЕ АРЕНДЫ — CityCAR</b>
🚗 ${rental3.car || '—'}
🆔 ${rental3.id || '—'}
⏸ Пауза: ${pauseMin} мин
🕐 ${new Date().toLocaleString('ru-RU', {timeZone:'Europe/Moscow'})}`);

  showToastMsg('▶️', 'Аренда продолжена', 'Пауза была ' + pauseMin + ' мин');
}
function minimizeRental() {
  const screen = document.getElementById('screen-rental');
  const pill   = document.getElementById('rental-nav-pill');
  if (screen) screen.classList.add('minimized');
  if (pill)   pill.style.display = 'block';
}

function maximizeRental() {
  const screen = document.getElementById('screen-rental');
  const pill   = document.getElementById('rental-nav-pill');
  if (screen) {
    screen.classList.remove('minimized');
  }
  if (pill) pill.style.display = 'none';
}

function callOperator() {
  window.open('tel:+79935976300');
}

// ─── ОСМОТР ───────────────────────────────────────
function startInspection() {
  var zone = getZoneForPoint(userCoords);

  if (zone === 'forbidden') {
    if (!userCoords) {
      showZoneWarning('unknown');
      return;
    }
    // Красная зона: не блокируем, предлагаем позвонить оператору или всё равно завершить
    showZoneWarning('forbidden');
    return;
  }

  if (zone === 'surcharge') {
    showZoneWarning('surcharge', function() {
      window._zoneSurcharge = window._mapZones.surchargeAmount;
      _proceedToInspection();
    });
    return;
  }

  window._zoneSurcharge = 0;
  _proceedToInspection();
}

function _proceedToInspection() {
  document.getElementById('screen-rental').classList.remove('active');
  document.getElementById('screen-inspection').classList.add('active');
  window._inspectionPhotos = {};
  updateInspectionCount();
}

// Модальное предупреждение о зоне
function showZoneWarning(type, onConfirm) {
  var overlay = document.getElementById('zone-warning-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'zone-warning-overlay';
    overlay.style.cssText = `
      position:fixed;inset:0;z-index:9999;
      background:rgba(0,0,0,0.75);backdrop-filter:blur(4px);
      display:flex;align-items:flex-end;justify-content:center;
      padding-bottom:env(safe-area-inset-bottom,0);
    `;
    document.body.appendChild(overlay);
  }

  var cfg = {
    forbidden: {
      icon: '🚫',
      color: '#EF4444',
      title: 'Запрещённая зона',
      text: `Вы находитесь вне разрешённой зоны завершения аренды.<br><br>
<b>Тарифы за завершение вне зоны:</b><br>
до 1 км — <b>2 000 ₽</b><br>
1–5 км — <b>5 000 ₽</b><br>
5–20 км — <b>10 000 ₽</b> + возврат авто<br>
20+ км — <b>20 000 ₽</b> + возврат авто<br><br>
Доплата будет выставлена оператором.`,
      btn1: 'Позвонить оператору',
      btn2: 'Подтвердить завершение',
      onConfirm: function() {
        // Устанавливаем флаг — доплата выставляется оператором вручную
        window._zoneSurcharge = 0;
        window._zoneForbiddenConfirmed = true;
        _proceedToInspection();
      },
      onBtn1: function() {
        document.getElementById('zone-warning-overlay').style.display = 'none';
        window.open('tel:+79935976300');
      }
    },
    surcharge: {
      icon: '⚠️',
      color: '#F59E0B',
      title: 'Зона с доплатой',
      text: 'Вы находитесь в жёлтой зоне. Завершение аренды здесь возможно, но будет начислена доплата <b>+' + window._mapZones.surchargeAmount + ' ₽</b>. Переместитесь в зелёную зону для бесплатного завершения.',
      btn1: 'Отмена — переехать',
      btn2: 'Завершить (+' + window._mapZones.surchargeAmount + ' ₽)',
      onConfirm: onConfirm
    },
    unknown: {
      icon: '📍',
      color: '#3B82F6',
      title: 'Геолокация недоступна',
      text: 'Не удаётся определить ваше местоположение. Убедитесь, что вы находитесь в разрешённой зоне завершения аренды, и разрешите доступ к геолокации.',
      btn1: 'Отмена',
      btn2: 'Всё равно завершить',
      onConfirm: function() {
        window._zoneSurcharge = 0;
        _proceedToInspection();
      }
    }
  };

  var c = cfg[type] || cfg.forbidden;
  overlay.innerHTML = `
    <div style="background:var(--card);border-radius:24px 24px 0 0;padding:28px 24px 36px;width:100%;max-width:500px;
                border-top:1px solid var(--border);animation:slideUp .25s ease">
      <div style="text-align:center;margin-bottom:20px">
        <div style="font-size:52px;margin-bottom:12px">${c.icon}</div>
        <div style="font-size:19px;font-weight:700;color:${c.color};margin-bottom:8px">${c.title}</div>
        <div style="font-size:14px;color:var(--text2);line-height:1.6">${c.text}</div>
      </div>
      ${c.btn2 ? `
      <button id="zone-btn1"
        style="width:100%;padding:14px;border-radius:14px;background:var(--card2);border:1px solid var(--border);
               font-size:15px;font-weight:600;color:var(--text);cursor:pointer;margin-bottom:10px">
        ${c.btn1}
      </button>
      <button id="zone-confirm-btn"
        style="width:100%;padding:14px;border-radius:14px;background:${c.color};border:none;
               font-size:15px;font-weight:600;color:#fff;cursor:pointer;margin-bottom:10px">
        ${c.btn2}
      </button>
      <button onclick="document.getElementById('zone-warning-overlay').style.display='none'"
        style="width:100%;padding:12px;border-radius:14px;background:none;border:none;
               font-size:14px;font-weight:500;color:var(--text3);cursor:pointer">
        ← Вернуться к аренде
      </button>
      ` : `
      <button onclick="document.getElementById('zone-warning-overlay').style.display='none';switchTab('map')"
        style="width:100%;padding:14px;border-radius:14px;background:var(--blue);border:none;
               font-size:15px;font-weight:600;color:#fff;cursor:pointer">
        ${c.btn1}
      </button>
      `}
    </div>
  `;
  overlay.style.display = 'flex';

  if (c.btn2) {
    var btn1El = document.getElementById('zone-btn1');
    if (btn1El) {
      btn1El.addEventListener('click', function() {
        if (c.onBtn1) { c.onBtn1(); }
        else { document.getElementById('zone-warning-overlay').style.display = 'none'; }
      });
    }
    if (c.onConfirm) {
      document.getElementById('zone-confirm-btn').addEventListener('click', function() {
        overlay.style.display = 'none';
        c.onConfirm();
      });
    }
  }
}

function backToRental() {
  document.getElementById('screen-inspection').classList.remove('active');
  document.getElementById('screen-rental').classList.add('active');
}

function takeInspectionPhoto(slot) {
  window._currentInspectionSlot = slot;
  document.getElementById('inspection-file-input').click();
}

function handleInspectionPhoto(input) {
  const file = input.files[0];
  if (!file || !window._currentInspectionSlot) return;
  const slot = window._currentInspectionSlot;
  const reader = new FileReader();
  reader.onload = function(e) {
    window._inspectionPhotos[slot] = e.target.result;
    // Показываем превью
    const cell = document.getElementById('ic-' + slot);
    const img  = document.getElementById('ic-' + slot + '-img');
    if (cell && img) {
      img.src = e.target.result;
      img.style.display = 'block';
      cell.classList.add('done');
    }
    updateInspectionCount();
  };
  reader.readAsDataURL(file);
  input.value = '';
}

function updateInspectionCount() {
  const done  = Object.keys(window._inspectionPhotos).length;
  const countEl = document.getElementById('inspection-count');
  const btnNext  = document.getElementById('btn-inspection-next');
  if (countEl) countEl.textContent = done + ' из 6 фото';
  if (btnNext) {
    const ready = done >= 6;
    btnNext.disabled = !ready;
    btnNext.style.opacity = ready ? '1' : '0.5';
  }
}

async function finishInspection() {
  const rental = window._activeRental;
  if (!rental) return;

  // Отправляем в Telegram оператору
  const now    = new Date();
  const pad    = n => String(n).padStart(2,'0');
  const nowStr = pad(now.getDate())+'.'+pad(now.getMonth()+1)+'.'+now.getFullYear()+' '+pad(now.getHours())+':'+pad(now.getMinutes());

  const zoneFeeNow = window._zoneSurcharge || 0;
  const zoneLabel  = zoneFeeNow > 0 ? `📍 Зона завершения: жёлтая (+${zoneFeeNow} ₽)` : `📍 Зона завершения: зелёная (бесплатно)`;

  sendTelegramMessage(TG_CHAT_OPERATOR,
`🏁 <b>СДАЧА АВТО — CityCAR</b>

🚗 ${rental.car}
📋 ${rental.tarif}
🕐 Начало: ${rental.startDT ? (pad(rental.startDT.getHours())+':'+pad(rental.startDT.getMinutes())) : '—'}
🏁 Сдача: ${nowStr}
${zoneLabel}
💰 Итого: ${calcFinalTotal()} ₽

📸 Фото осмотра: ${Object.keys(window._inspectionPhotos).length} / 6
🆔 Заявка: ${rental.id || '—'}

⚠️ Проверьте состояние авто по фото в следующих сообщениях.`
  );

  // Обновляем статус в Firebase
  if (rental.id && window._firestoreDB) {
    try {
      const { doc, updateDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
      await updateDoc(doc(window._firestoreDB, 'bookings', rental.id), {
        status: 'done',
        endedAt: now.toISOString(),
        totalCharged: calcFinalTotal(),
        zoneSurcharge: zoneFeeNow,
        finishZone: zoneFeeNow > 0 ? 'surcharge' : 'free'
      });
      // Освобождаем авто
      if (rental.carId) {
        await updateDoc(doc(window._firestoreDB, 'fleet', rental.carId), {
          status: 'free', blockedUntil: null, blockedUntilStr: null
        });
      }
    } catch(e) { console.error(e); }
  }

  showFinalScreen();
}

// ─── ФИНАЛЬНЫЙ ЭКРАН ──────────────────────────────
function calcFinalTotal() {
  const rental = window._activeRental;
  if (!rental) return 0;
  const zoneFee  = window._zoneSurcharge || 0;
  // Поминутный: используем реальную стоимость рассчитанную в finishInspection
  if (rental.tariffType === 'minute' && window._minuteActualCost != null) {
    return window._minuteActualCost + zoneFee;
  }
  const prepaid  = rental.total || 0;
  const overtime = calcOvertimeCharge();
  return prepaid + overtime + zoneFee;
}

function calcOvertimeCharge() {
  const rental = window._activeRental;
  if (!rental || !rental.paidUntilDT) return 0;
  const now = new Date();
  if (now <= rental.paidUntilDT) return 0;
  const overMs  = now - rental.paidUntilDT;
  const overMin = Math.ceil(overMs / (30 * 60000)); // кол-во 30-мин блоков
  return overMin * 300;
}

function showFinalScreen() {
  const rental = window._activeRental;
  // Сбрасываем кэш истории — после завершения поездки список должен обновиться
  // Сбрасываем кэш истории — после поездки нужно загрузить свежие данные
  refreshBookingHistory();
  document.getElementById('screen-inspection').classList.remove('active');
  document.getElementById('screen-final').classList.add('active');

  if (!rental) return;
  const pad = n => String(n).padStart(2,'0');
  const now = new Date();

  document.getElementById('final-car').textContent     = rental.car || '—';
  document.getElementById('final-tariff').textContent  = rental.tarif || '—';
  document.getElementById('final-start').textContent   = rental.startDT ? (pad(rental.startDT.getHours())+':'+pad(rental.startDT.getMinutes())) : '—';
  document.getElementById('final-end').textContent     = pad(now.getHours())+':'+pad(now.getMinutes());
  document.getElementById('final-prepaid').textContent = (rental.total||0).toLocaleString('ru-RU')+' ₽';

  // Длительность
  if (rental.startDT) {
    const diffMin = Math.floor((now - rental.startDT) / 60000);
    const dh = Math.floor(diffMin/60), dm = diffMin%60;
    document.getElementById('final-duration').textContent = dh > 0 ? dh+' ч '+dm+' мин' : dm+' мин';
  }

  // Сверхурочные
  const overtime = calcOvertimeCharge();
  if (overtime > 0) {
    document.getElementById('final-overtime-row').style.display = 'flex';
    document.getElementById('final-overtime').textContent = overtime.toLocaleString('ru-RU')+' ₽';
  }

  // Доплата за зону завершения
  const zoneFee = window._zoneSurcharge || 0;
  const zoneRow = document.getElementById('final-zone-row');
  if (zoneRow) {
    if (zoneFee > 0) {
      zoneRow.style.display = 'flex';
      document.getElementById('final-zone-fee').textContent = '+' + zoneFee.toLocaleString('ru-RU') + ' ₽';
    } else {
      zoneRow.style.display = 'none';
    }
  }

  document.getElementById('final-total').textContent = calcFinalTotal().toLocaleString('ru-RU')+' ₽';

  // Начисляем CityCoins за завершённую поездку
  accrueCoinsAfterTrip();

  // Останавливаем таймер
  if (window._rentalTimer) { clearInterval(window._rentalTimer); window._rentalTimer = null; }
}

function setRating(val) {
  const stars = document.querySelectorAll('#rating-stars span');
  stars.forEach((s,i) => { s.style.filter = i < val ? 'none' : 'grayscale(1)'; s.style.transform = i < val ? 'scale(1.1)' : 'scale(1)'; });
  const labels = ['','😞 Плохо','😐 Нормально','🙂 Хорошо','😊 Отлично','🤩 Супер!'];
  document.getElementById('rating-text').textContent = labels[val] || '';
  // TODO: сохранить оценку в Firebase
}

function closeFinalScreen() {
  document.getElementById('screen-final').classList.remove('active');
  document.getElementById('screen-rental').classList.remove('active');
  document.getElementById('screen-inspection').classList.remove('active');
  window._activeRental = null;
  window._zoneSurcharge = 0;
  window._minuteActualCost = null;
  window._totalPauseMs = 0;
  const pill2 = document.getElementById('rental-nav-pill');
  if (pill2) pill2.style.display = 'none';
  switchTab('map');
  // Показываем историю броней
  setTimeout(() => switchTab('booking'), 300);
}

// ═══════════════════════════════════════════════════════════════════════════
// CITYCOINS — НАЧИСЛЕНИЕ ПОСЛЕ ПОЕЗДКИ
// ═══════════════════════════════════════════════════════════════════════════
async function accrueCoinsAfterTrip() {
  const sess = loadSession();
  if (!sess || !sess.phone || !window._firestoreDB) return;

  const rental = window._activeRental;
  if (!rental) return;

  const paidAmount = calcFinalTotal();
  if (paidAmount <= 0) return;

  try {
    const FB_KEY = 'AIzaSyBQvTtF2NfK_Pvbb9qqf3tqqzXXXmrZbDk';
    const FB_PRJ = 'citycar-voronezh-3ed1b';

    // Используем кэш из onSnapshot — без лишнего запроса к Firebase
    let fv;
    let docName;
    if (window._cachedUserData) {
      const cached = window._cachedUserData;
      fv = (f, def) => cached[f] !== undefined ? cached[f] : def;
      docName = `projects/${FB_PRJ}/databases/(default)/documents/users/${sess.phone}`;
    } else {
      // Запасной вариант: читаем из Firebase если кэша нет
      const qResp = await fetch(
        `https://firestore.googleapis.com/v1/projects/${FB_PRJ}/databases/(default)/documents:runQuery?key=${FB_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            structuredQuery: {
              from: [{ collectionId: 'users' }],
              where: { fieldFilter: { field: { fieldPath: 'phone' }, op: 'EQUAL', value: { stringValue: sess.phone } } },
              limit: 1
            }
          })
        }
      );
      const qData = await qResp.json();
      if (!qData[0] || !qData[0].document) return;
      const userDoc = qData[0].document;
      docName = userDoc.name;
      const fields  = userDoc.fields || {};
      fv = (f, def) => {
        if (!fields[f]) return def;
        return fields[f].integerValue !== undefined ? Number(fields[f].integerValue)
             : fields[f].doubleValue  !== undefined ? Number(fields[f].doubleValue)
             : fields[f].stringValue  !== undefined ? fields[f].stringValue
             : fields[f].booleanValue !== undefined ? fields[f].booleanValue
             : def;
      };
    }

    const now      = new Date();
    const nowMonth = now.getFullYear() + '-' + (now.getMonth() + 1);

    const currentBalance    = fv('bonusPoints', 0);
    const totalEver         = fv('totalCoinsEarned', currentBalance);
    const monthlyTrips      = fv('monthlyTrips', 0);
    const monthlyTripsMonth = fv('monthlyTripsMonth', '');
    const totalTrips        = fv('totalTrips', 0);

    const monthTripsActual = (monthlyTripsMonth === nowMonth) ? monthlyTrips : 0;
    const newMonthTrips    = monthTripsActual + 1;
    const newTotalTrips    = totalTrips + 1;

    // ── Начисления по утверждённой таблице ──
    const breakdown = [];

    // 1. Базовое: +10 монет за каждые 100 ₽
    const baseCoins = Math.floor(paidAmount / 100) * 10;
    if (baseCoins > 0) breakdown.push({ reason: 'за оплату ' + paidAmount + ' ₽', coins: baseCoins });

    // 2. 3 поездки в месяце → +100 (1 раз/мес)
    if (monthTripsActual < 3 && newMonthTrips >= 3)
      breakdown.push({ reason: '🎯 3 поездки за месяц', coins: 100 });

    // 3. 5 поездок в месяце → +200 (1 раз/мес)
    if (monthTripsActual < 5 && newMonthTrips >= 5)
      breakdown.push({ reason: '🔥 5 поездок за месяц', coins: 200 });

    // 4. 10 поездок в месяце → +400 (1 раз/мес)
    if (monthTripsActual < 10 && newMonthTrips >= 10)
      breakdown.push({ reason: '🏆 10 поездок за месяц', coins: 400 });

    const totalAccrued = breakdown.reduce((s, b) => s + b.coins, 0);
    const newBalance   = currentBalance + totalAccrued;
    const newTotalEver = totalEver + totalAccrued;

    // ── Сохраняем в Firestore ──
    const updateFields = {
      bonusPoints:       { integerValue: String(newBalance) },
      totalCoinsEarned:  { integerValue: String(newTotalEver) },
      totalTrips:        { integerValue: String(newTotalTrips) },
      monthlyTrips:      { integerValue: String(newMonthTrips) },
      monthlyTripsMonth: { stringValue:  nowMonth },
      lastTripAt:        { stringValue:  now.toISOString() }
    };

    const updateMask = Object.keys(updateFields).map(k => 'updateMask.fieldPaths=' + k).join('&');
    await fetch(
      `https://firestore.googleapis.com/v1/${docName}?${updateMask}&key=${FB_KEY}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: updateFields })
      }
    );

    sess.bonusPoints      = newBalance;
    sess.totalCoinsEarned = newTotalEver;
    try { localStorage.setItem('citycar_session', JSON.stringify(sess)); } catch(_) {}

    // Обновляем кэш немедленно — не ждём onSnapshot
    if (window._cachedUserData) {
      window._cachedUserData.bonusPoints      = newBalance;
      window._cachedUserData.totalCoinsEarned = newTotalEver;
      window._cachedUserData.totalTrips       = newTotalTrips;
    }
    // Обновляем UI профиля немедленно
    const bonusEls = document.querySelectorAll('#stat-bonus, .profile-bonus-balance');
    bonusEls.forEach(el => { if (el) el.textContent = newBalance.toLocaleString('ru-RU') + ' 🪙'; });

    if (totalAccrued > 0) {
      const block = document.getElementById('final-coins-block');
      const amtEl = document.getElementById('final-coins-amount');
      const detEl = document.getElementById('final-coins-detail');
      const balEl = document.getElementById('final-coins-balance');
      if (block) {
        block.style.display = 'block';
        if (amtEl) amtEl.textContent = '+' + totalAccrued.toLocaleString('ru-RU') + ' CityCoins';
        if (detEl) detEl.textContent = breakdown.map(b => b.reason + ' +' + b.coins).join(' · ');
        if (balEl) balEl.textContent = 'Итого на счёте: ' + newBalance.toLocaleString('ru-RU') + ' 🪙';
      }
      showToastMsg('🪙', '+' + totalAccrued + ' CityCoins начислено!', breakdown.map(b => b.reason).join(', '));
    }

    console.log('[CityCoins] Начислено:', totalAccrued, '| Баланс:', newBalance);

  } catch(e) {
    console.warn('[CityCoins] Ошибка начисления:', e.message);
  }
}

// ─── ПРОВЕРКА АКТИВНОЙ АРЕНДЫ ПРИ ЗАГРУЗКЕ ───────
// Если у пользователя есть активная аренда — показываем экран
async function checkActiveRental() {
  const session = loadSession();
  if (!session || !session.phone) return;

  // Ждём пока Firebase инициализируется (до 8 секунд, проверяем каждые 200мс)
  if (!window._firestoreDB) {
    let waited = 0;
    await new Promise(resolve => {
      const iv = setInterval(() => {
        waited += 200;
        if (window._firestoreDB || waited >= 8000) { clearInterval(iv); resolve(); }
      }, 200);
    });
    if (!window._firestoreDB) { console.warn('checkActiveRental: _firestoreDB не инициализирован'); return; }
  }

  try {
    const { query, where, getDocs, collection, orderBy, limit, doc, getDoc } =
      await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');

    // Сначала проверяем sessionStorage — был ли недавний возврат с оплаты
    let paidBookingId = null;
    try { paidBookingId = sessionStorage.getItem('citycar_paid_booking'); } catch(_) {}

    if (paidBookingId) {
      const snap = await getDoc(doc(window._firestoreDB, 'bookings', paidBookingId));
      if (snap.exists()) {
        const data = { id: snap.id, ...snap.data() };
        if (data.status === 'confirmed' || data.status === 'active' || data.paymentStatus === 'paid') {
          try { sessionStorage.removeItem('citycar_paid_booking'); } catch(_) {}
          if (data.status === 'active' && data.startedAt) {
            data.startDT = new Date(data.startedAt);
            data.paidUntilDT = data.paidUntil ? new Date(data.paidUntil) : null;
            startRentalScreen(data);
          } else {
            showBookingPaidScreen(data);
          }
          // Запускаем listener чтобы ловить изменения статуса
          if (window.listenActiveBooking) window.listenActiveBooking(paidBookingId);
          return;
        }
      }
    }

    // Ищем активную аренду (status=active)
    const snapActive = await getDocs(query(
      collection(window._firestoreDB, 'bookings'),
      where('phone', '==', session.phone),
      where('status', '==', 'active'),
      limit(1)
    ));
    if (!snapActive.empty) {
      const d = snapActive.docs[0];
      const data = { id: d.id, ...d.data() };
      if (data.startedAt) data.startDT = new Date(data.startedAt);
      if (data.paidUntil) data.paidUntilDT = new Date(data.paidUntil);
      startRentalScreen(data);
      return;
    }

    // Ищем подтверждённую оплаченную бронь (status=confirmed, paymentStatus=paid)
    const snapConf = await getDocs(query(
      collection(window._firestoreDB, 'bookings'),
      where('phone', '==', session.phone),
      where('status', '==', 'confirmed'),
      limit(1)
    ));
    if (!snapConf.empty) {
      const d = snapConf.docs[0];
      const data = { id: d.id, ...d.data() };
      if (data.paymentStatus === 'paid') {
        showBookingPaidScreen(data);
        if (window.listenActiveBooking) window.listenActiveBooking(data.id);
      }
    }
  } catch(e) { console.error('checkActiveRental:', e); }
}

// Показать экран «Бронь оплачена — начните осмотр»
function showBookingPaidScreen(booking) {
  window._activeRental = booking;
  window._operatorFinishedHandled = false;

  const carEl     = document.getElementById('bpaid-car-name');
  const carEl2    = document.getElementById('bpaid-car-display');
  const tariffEl  = document.getElementById('bpaid-tariff');
  const tariffEl2 = document.getElementById('bpaid-tariff-display');
  const totalEl   = document.getElementById('bpaid-total');
  const dtEl      = document.getElementById('bpaid-datetime');

  const carName  = booking.car || '—';
  const tarif    = booking.tarif || booking.tariffType || '—';
  const total    = (booking.total || 0).toLocaleString('ru-RU') + ' ₽';
  const dateStr  = booking.dateStr || booking.date || '—';
  const timeStr  = booking.time || '—';

  if (carEl)     carEl.textContent     = carName;
  if (carEl2)    carEl2.textContent    = carName;
  if (tariffEl)  tariffEl.textContent  = tarif;
  if (tariffEl2) tariffEl2.textContent = tarif;
  if (totalEl)   totalEl.textContent   = total;
  if (dtEl)      dtEl.textContent      = dateStr + ' ' + timeStr;

  // Скрываем все другие rental-экраны
  ['screen-rental','screen-inspection','screen-pre-inspection','screen-pending-finish','screen-final'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('active');
  });

  document.getElementById('screen-booking-paid').classList.add('active');
}

function hideBookingPaidScreen() {
  document.getElementById('screen-booking-paid').classList.remove('active');
}

// Переход из экрана «Оплачено» к осмотру
function startPreInspectionFromPaid() {
  document.getElementById('screen-booking-paid').classList.remove('active');
  const rental = window._activeRental;
  if (!rental) return;
  // Помечаем как не-preInspectionDone чтобы пройти через осмотр
  rental.preInspectionDone = false;
  startPreInspectionScreen(rental);
}

// Экспортируем в window чтобы можно было вызвать из любого места
window.checkActiveRental = checkActiveRental;

// Вызываем проверку после загрузки Firebase
setTimeout(() => {
  checkActiveRental();
}, 3000);



// ════════════════════════════════════════════════
// БЛОК Б — ОСМОТР ПЕРЕД ПОЕЗДКОЙ
// ════════════════════════════════════════════════

window._preInspectionPhotos = {};
window._currentPreSlot = null;

// Запускается когда оператор нажал «Выдать ключи» (preInspectionReady = true)
function startPreInspectionScreen(booking) {
  window._activeRental = booking;
  window._preInspectionPhotos = {};
  updatePreInspectionCount();
  // Скрываем все rental-экраны кроме pre-inspection
  ['screen-rental','screen-inspection','screen-pending-finish','screen-final'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('active');
  });
  document.getElementById('screen-pre-inspection').classList.add('active');
}

function takePreInspectionPhoto(slot) {
  window._currentPreSlot = slot;
  document.getElementById('pre-inspection-file-input').click();
}

function handlePreInspectionPhoto(input) {
  const file = input.files[0];
  if (!file || !window._currentPreSlot) return;
  const slot = window._currentPreSlot;
  const reader = new FileReader();
  reader.onload = function(e) {
    window._preInspectionPhotos[slot] = e.target.result;
    const cell = document.getElementById('pre-ic-' + slot);
    const img  = document.getElementById('pre-ic-' + slot + '-img');
    if (cell) cell.classList.add('done');
    if (img)  { img.src = e.target.result; img.style.display = 'block'; }
    updatePreInspectionCount();
  };
  reader.readAsDataURL(file);
  input.value = '';
}

function updatePreInspectionCount() {
  const done = Object.keys(window._preInspectionPhotos).length;
  const countEl = document.getElementById('pre-inspection-count');
  const btnSend = document.getElementById('btn-pre-inspection-send');
  if (countEl) countEl.textContent = done + ' из 6 фото';
  if (btnSend) {
    const ready = done >= 6;
    btnSend.disabled = !ready;
    btnSend.style.opacity = ready ? '1' : '0.5';
  }
}

async function sendPreInspectionPhotos() {
  const rental = window._activeRental;
  if (!rental) return;

  const btn = document.getElementById('btn-pre-inspection-send');
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Загружаем фото...'; }

  const pad = n => String(n).padStart(2,'0');
  const now = new Date();
  const nowStr = pad(now.getDate())+'.'+pad(now.getMonth()+1)+'.'+now.getFullYear()+' '+pad(now.getHours())+':'+pad(now.getMinutes());
  const phone = (loadSession()||{}).phone || rental.phone || 'unknown';

  // Загружаем фото в Яндекс S3
  const photoUrls = {};
  const slots = Object.keys(window._preInspectionPhotos);
  for (let i = 0; i < slots.length; i++) {
    const slot = slots[i];
    try {
      const base64 = window._preInspectionPhotos[slot];
      const res = await fetch(base64);
      const blob = await res.blob();
      const formData = new FormData();
      formData.append('file', blob, slot + '.jpg');
      formData.append('fileName', 'pre_' + slot + '_' + Date.now() + '.jpg');
      formData.append('phone', phone);
      const upResp = await fetch(WORKER_URL + '/', { method: 'POST', body: formData });
      if (!upResp.ok) throw new Error('HTTP ' + upResp.status);
      const upResult = await upResp.json();
      if (upResult.ok) photoUrls[slot] = upResult.url;
    } catch(e) { console.error('upload pre photo:', slot, e); }
  }

  // Рассчитываем startedAt и paidUntil
  const startedAt = now.toISOString();
  // Для поминутного тарифа — берём выбранное клиентом время (estimateMinutes)
  // Для пакетного — durationMin из Firebase (записан из tariff.hours при бронировании)
  const durationMin = rental.tariffType === 'minute'
    ? (rental.estimateMinutes || rental.durationMin || 60)
    : (rental.durationMin || 120);
  const paidUntilDT = new Date(now.getTime() + durationMin * 60000);
  const paidUntil = paidUntilDT.toISOString();

  // Сохраняем фото + запускаем аренду в Firebase сразу
  if (rental.id && window._firestoreDB) {
    try {
      const { doc, updateDoc } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
      await updateDoc(doc(window._firestoreDB, 'bookings', rental.id), {
        preInspectionDone: true,
        preInspectionAt: startedAt,
        preInspectionPhotos: photoUrls,
        preInspectionCount: slots.length,
        status: 'active',
        startedAt: startedAt,
        paidUntil: paidUntil
      });
    } catch(e) { console.error('preInspection Firebase:', e); }
  }

  // Уведомление оператору с ссылками на фото (оператор видит, но не блокирует процесс)
  const photoLinks = Object.entries(photoUrls).map(([k,v]) => '📷 ' + k + ': ' + v).join('\n');
  sendTelegramMessage(TG_CHAT_OPERATOR,
`📸 <b>ОСМОТР ПЕРЕД ПОЕЗДКОЙ — CityCAR</b>

🚗 ${rental.car || '—'}
👤 ${rental.clientName || rental.phone || '—'}
📋 ${rental.tarif || '—'}
🕐 ${nowStr}
📸 Фото: ${slots.length} / 6
🆔 Заявка: ${rental.id || '—'}

${photoLinks}

✅ Аренда запущена автоматически`
  );

  // Скрываем экран осмотра — запускаем аренду немедленно
  document.getElementById('screen-pre-inspection').classList.remove('active');
  const updated = {
    ...rental,
    preInspectionDone: true,
    status: 'active',
    startedAt: startedAt,
    startDT: now,
    paidUntil: paidUntil,
    paidUntilDT: paidUntilDT
  };
  window._activeRental = updated;
  showToastMsg('🚗', 'Аренда началась!', 'Хорошей поездки!');
  setTimeout(() => _origStartRentalScreen(updated), 600);
}

// Кнопка отказа от аренды после осмотра
async function refuseAfterInspection() {
  const rental = window._activeRental;
  if (!rental) return;

  const paymentId = rental.paymentId || '';
  const amount = rental.total || 0;

  if (!confirm('Отказаться от аренды? Оплата будет возвращена на карту.')) return;

  const btn = document.getElementById('btn-pre-inspection-refuse');
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Возврат...'; }

  try {
    if (paymentId && amount > 0) {
      const resp = await fetch(WORKER_URL + '/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId: String(paymentId), amount: amount, bookingId: rental.id || '' })
      });
      const result = await resp.json();
      if (!result.ok) {
        showToastMsg('⚠️', 'Ошибка возврата', result.error || 'Обратитесь к оператору');
        if (btn) { btn.disabled = false; btn.textContent = '❌ Отказаться от аренды'; }
        return;
      }
    }

    // Обновляем статус в Firebase
    if (rental.id && window._firestoreDB) {
      try {
        const { doc, updateDoc } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
        await updateDoc(doc(window._firestoreDB, 'bookings', rental.id), {
          status: 'cancelled',
          cancelledAt: new Date().toISOString(),
          cancelReason: 'refused_after_inspection'
        });
        if (rental.carId) {
          await updateDoc(doc(window._firestoreDB, 'fleet', rental.carId), {
            status: 'free', blockedUntil: null, blockedUntilStr: null
          });
        }
      } catch(e) { console.warn('refuse Firebase:', e); }
    }

    sendTelegramMessage(TG_CHAT_OPERATOR,
`❌ <b>ОТКАЗ ОТ АРЕНДЫ — CityCAR</b>

🚗 ${rental.car || '—'}
👤 ${rental.phone || '—'}
🆔 Заявка: ${rental.id || '—'}
💰 Возврат: ${amount} ₽
🕐 ${new Date().toLocaleString('ru-RU', {timeZone:'Europe/Moscow'})}`
    );

    document.getElementById('screen-pre-inspection').classList.remove('active');
    window._activeRental = null;
    showToastMsg('✅', 'Аренда отменена', 'Деньги вернутся на карту в течение 3–5 дней');
    setTimeout(() => switchTab('map'), 1500);
  } catch(e) {
    console.error('refuseAfterInspection:', e);
    showToastMsg('⚠️', 'Ошибка', 'Нет соединения. Позвоните оператору.');
    if (btn) { btn.disabled = false; btn.textContent = '❌ Отказаться от аренды'; }
  }
}

// ════════════════════════════════════════════════
// ЭКРАН ОЖИДАНИЯ (два режима: pre = до аренды, post = после)
// ════════════════════════════════════════════════

window._pendingMode = 'pre'; // 'pre' | 'post'
window._pendingCheckInterval = null;

function showPendingFinishScreen(mode) {
  window._pendingMode = mode;
  const rental = window._activeRental;

  if (mode === 'pre') {
    // Перед поездкой — ждём keysReleased
    document.getElementById('pf-step-photos').querySelector('.preinsp-step-text').textContent = 'Фото отправлены';
    document.getElementById('pf-step-check').querySelector('.preinsp-step-text').textContent = 'Оператор проверяет';
    document.getElementById('pf-step-done').querySelector('.preinsp-step-text').textContent = 'Получите ключи';
    document.getElementById('pf-wait-time').textContent = 'Ожидаем разрешения оператора...';
    document.querySelector('#screen-pending-finish .rental-header-car').textContent = 'Ожидание оператора';
    document.querySelector('#screen-pending-finish .rental-header-tariff').textContent = 'Оператор проверяет фото — оставайтесь рядом';
  } else {
    // После поездки — ждём финального подтверждения
    document.getElementById('pf-step-check').querySelector('.preinsp-step-text').textContent = 'Проверка состояния авто';
    document.getElementById('pf-step-done').querySelector('.preinsp-step-text').textContent = 'Аренда завершена';
    document.getElementById('pf-wait-time').textContent = 'Сравниваем фото до и после...';
    document.querySelector('#screen-pending-finish .rental-header-car').textContent = 'Проверка авто оператором';
    document.querySelector('#screen-pending-finish .rental-header-tariff').textContent = 'Не уходите от автомобиля';
  }

  document.getElementById('screen-pending-finish').classList.add('active');

  // Слушаем Firebase — ждём ответа оператора
  if (rental && rental.id) {
    if (window._pendingCheckInterval) { clearInterval(window._pendingCheckInterval); window._pendingCheckInterval = null; }
    window._pendingCheckInterval = setInterval(async () => {
      try {
        const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
        const snap = await getDoc(doc(window._firestoreDB, 'bookings', rental.id));
        if (!snap.exists()) return;
        const data = snap.data();

        if (mode === 'pre' && data.keysReleased === true) {
          // Оператор выдал ключи — запускаем аренду!
          clearInterval(window._pendingCheckInterval);
          document.getElementById('screen-pending-finish').classList.remove('active');
          // Обновляем данные аренды
          const updated = { ...rental, ...data, id: rental.id };
          if (data.startedAt) updated.startDT = new Date(data.startedAt);
          if (data.paidUntil) updated.paidUntilDT = new Date(data.paidUntil);
          showToastMsg('🚗','Ключи выданы!','Хорошей поездки!');
          setTimeout(() => startRentalScreen(updated), 800);
        }

        if (mode === 'post') {
          if (data.finishApproved === true) {
            clearInterval(window._pendingCheckInterval);
            document.getElementById('screen-pending-finish').classList.remove('active');
            showFinalScreen();
          } else if (data.finishDamage === true) {
            clearInterval(window._pendingCheckInterval);
            document.getElementById('screen-pending-finish').classList.remove('active');
            showToastMsg('⚠️','Зафиксированы повреждения','Оператор свяжется с вами');
            showFinalScreen();
          }
        }
      } catch(e) {}
    }, 10000); // проверяем каждые 10 секунд (было 3 — слишком часто)
  }
}

// ════════════════════════════════════════════════
// ════════════════════════════════════════════════
// Переопределяем startRentalScreen:
// если preInspectionDone = false → сначала осмотр
// ════════════════════════════════════════════════
const _origStartRentalScreen = startRentalScreen;
startRentalScreen = function(booking) {
  if (!booking.preInspectionDone) {
    startPreInspectionScreen(booking);
    return;
  }
  _origStartRentalScreen(booking);
};

// ════════════════════════════════════════════════
// Переопределяем finishInspection (ПОСЛЕ поездки):
// загружаем фото → уведомляем оператора → сразу showFinalScreen
// Оператор видит фото в Telegram, клиент не ждёт его ответа
// ════════════════════════════════════════════════
const _origFinishInspection = finishInspection;
finishInspection = async function() {
  const rental = window._activeRental;
  if (!rental) return;

  const finishBtn = document.getElementById('btn-inspection-next');
  if (finishBtn) { finishBtn.disabled = true; finishBtn.textContent = '⏳ Загружаем фото...'; }

  const pad = n => String(n).padStart(2,'0');
  const now = new Date();
  const nowStr = pad(now.getDate())+'.'+pad(now.getMonth()+1)+'.'+now.getFullYear()+' '+pad(now.getHours())+':'+pad(now.getMinutes());

  // Загружаем фото сдачи в S3
  const postPhotoUrls = {};
  const postPhone = (loadSession()||{}).phone || rental.phone || 'unknown';
  const postSlots = Object.keys(window._inspectionPhotos);
  for (let pi = 0; pi < postSlots.length; pi++) {
    const pslot = postSlots[pi];
    try {
      const b64 = window._inspectionPhotos[pslot];
      const pres = await fetch(b64);
      const pblob = await pres.blob();
      const pfd = new FormData();
      pfd.append('file', pblob, pslot + '.jpg');
      pfd.append('fileName', 'post_' + pslot + '_' + Date.now() + '.jpg');
      pfd.append('phone', postPhone);
      const pup = await fetch(WORKER_URL + '/', { method: 'POST', body: pfd });
      if (!pup.ok) throw new Error('HTTP ' + pup.status);
      const pur = await pup.json();
      if (pur.ok) postPhotoUrls[pslot] = pur.url;
    } catch(e) { console.error('upload post photo:', pslot, e); }
  }

  const finalTotal = calcFinalTotal();
  const zoneFeeNow = window._zoneSurcharge || 0;
  const forbiddenZone = !!window._zoneForbiddenConfirmed;
  window._zoneForbiddenConfirmed = false; // сброс

  const postPhotoLinks = Object.entries(postPhotoUrls).map(([k,v]) => '📷 ' + k + ': ' + v).join('\n');
  sendTelegramMessage(TG_CHAT_OPERATOR,
`🏁 <b>СДАЧА АВТО — CityCAR</b>

🚗 ${rental.car}
📋 ${rental.tarif}
🕐 Начало: ${rental.startDT ? (pad(rental.startDT.getHours())+':'+pad(rental.startDT.getMinutes())) : '—'}
🏁 Сдача: ${nowStr}
📍 Зона: ${forbiddenZone ? '🚫 ЗАПРЕЩЁННАЯ — выставить счёт за доплату!' : (zoneFeeNow > 0 ? 'жёлтая (+' + zoneFeeNow + ' ₽)' : 'зелёная')}
💰 Итого: ${finalTotal} ₽
📸 Фото сдачи: ${postSlots.length} / 6
🆔 Заявка: ${rental.id || '—'}

${postPhotoLinks}`
  );

  // Обновляем статус в Firebase → done сразу
  if (rental.id && window._firestoreDB) {
    try {
      const { doc, updateDoc } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
      await updateDoc(doc(window._firestoreDB, 'bookings', rental.id), {
        status: 'done',
        postInspectionDone: true,
        postInspectionAt: now.toISOString(),
        postInspectionPhotos: postPhotoUrls,
        endedAt: now.toISOString(),
        totalCharged: finalTotal,
        zoneSurcharge: zoneFeeNow,
        finishZone: zoneFeeNow > 0 ? 'surcharge' : 'free'
      });
      if (rental.carId) {
        await updateDoc(doc(window._firestoreDB, 'fleet', rental.carId), {
          status: 'free', blockedUntil: null, blockedUntilStr: null
        });
      }
    } catch(e) { console.error('finishInspection:', e); }
  }

  // ── Финансовый расчёт при завершении ──────────────────────────────────────
  const overtimeCharge = calcOvertimeCharge();
  const extraCharge    = overtimeCharge + zoneFeeNow;
  const payId = rental.paymentId || '';
  const rebillId = rental.rebillId || (loadSession()||{}).rebillId || '';

  // ── ПОМИНУТНЫЙ ТАРИФ: точный пересчёт с учётом пауз ──────────────────────
  if (rental.tariffType === 'minute' && rental.startDT && payId) {
    const activeRate    = rental.ratePerMin || 8.7; // ₽/мин в движении
    const pauseRate     = 4;                         // ₽/мин на паузе

    // Суммарное время паузы (если сейчас ещё на паузе — добавляем текущую)
    let totalPauseMs = window._totalPauseMs || 0;
    if (window._rentalPaused && window._pauseStartTime) {
      totalPauseMs += (now - window._pauseStartTime);
    }

    const totalMs      = now - rental.startDT;
    const activeMs     = Math.max(totalMs - totalPauseMs, 0);
    const activeMin    = Math.ceil(activeMs / 60000);
    const pauseMin     = Math.ceil(totalPauseMs / 60000);

    // Фактическая стоимость: движение + паузы
    const actualCost   = Math.round(activeMin * activeRate + pauseMin * pauseRate);
    const prepaid      = rental.total || 0; // уже оплачено при бронировании
    const diff         = prepaid - actualCost; // >0 → возврат, <0 → доначисление

    console.log('[Поминутный] движение=' + activeMin + 'мин × ' + activeRate +
      ' + пауза=' + pauseMin + 'мин × ' + pauseRate +
      ' = ' + actualCost + ' ₽ | оплачено=' + prepaid + ' ₽ | разница=' + diff);

    // Обновляем totalCharged в Firebase точной суммой
    if (rental.id && window._firestoreDB) {
      try {
        const { doc: d2, updateDoc: upd2 } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
        await upd2(d2(window._firestoreDB, 'bookings', rental.id), {
          totalCharged: actualCost,
          actualMinutes: activeMin,
          pauseMinutes: pauseMin,
          minuteRefund: diff > 0 ? diff : 0,
          minuteExtra:  diff < 0 ? -diff : 0
        });
      } catch(_) {}
    }

    if (diff > 1) {
      // Возврат за неиспользованное время
      try {
        const refResp = await fetch(WORKER_URL + '/refund', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentId: String(payId), amount: diff, bookingId: rental.id })
        });
        const refRes = await refResp.json();
        if (refRes.ok) showToastMsg('💸', 'Возврат ' + diff + ' ₽', 'За неиспользованное время');
        else console.warn('[Поминутный] Возврат не прошёл:', refRes);
      } catch(e) { console.warn('minute refund:', e); }

    } else if (diff < -1 && rebillId) {
      // Доначисление за перерасход времени
      const extraAmt = -diff + zoneFeeNow;
      try {
        await fetch(WORKER_URL + '/rebill', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            rebillId,
            bookingId: rental.id,
            amount: extraAmt,
            phone: (rental.phone || (loadSession()||{}).phone || '').replace(/\D/g,''),
            description: 'Доплата: перерасход времени · CityCar'
          })
        });
      } catch(e) { console.warn('minute extra:', e); }
    }

  } else if (extraCharge > 0 && rebillId && rental.id) {
    // ПАКЕТНЫЙ ТАРИФ: списываем сверхурочные + зону через rebill
    try {
      await fetch(WORKER_URL + '/rebill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rebillId,
          bookingId: rental.id,
          amount: extraCharge,
          phone: (rental.phone || (loadSession()||{}).phone || '').replace(/\D/g,''),
          description: 'Доплата при завершении аренды CityCar'
        })
      });
    } catch(e) { console.warn('finish extra charge:', e); }
  }

  // Для поминутного — сохраняем реальную стоимость для финального экрана
  if (rental.tariffType === 'minute') {
    const aRate = rental.ratePerMin || 8.7;
    let tPauseMs = window._totalPauseMs || 0;
    if (window._rentalPaused && window._pauseStartTime) tPauseMs += (now - window._pauseStartTime);
    const totalMs   = now - rental.startDT;
    const activeMin = Math.ceil(Math.max(totalMs - tPauseMs, 0) / 60000);
    const pauseMin  = Math.ceil(tPauseMs / 60000);
    window._minuteActualCost = Math.round(activeMin * aRate + pauseMin * 4);
  } else {
    window._minuteActualCost = null;
  }

  document.getElementById('screen-inspection').classList.remove('active');
  if (window._rentalTimer) { clearInterval(window._rentalTimer); window._rentalTimer = null; }
  if (window._pendingCheckInterval) { clearInterval(window._pendingCheckInterval); window._pendingCheckInterval = null; }
  showFinalScreen();
};

// phone formatting handled by authPhoneFormat()

// ── PUSH И TELEGRAM УВЕДОМЛЕНИЯ ─────────────────────────────────────────────

// Вызывается напрямую по клику — только так браузер разрешает Notification
window.enablePushNotifications = async function() {
  const label  = document.getElementById('push-menu-label');
  const sub    = document.getElementById('push-menu-sub');
  const status = document.getElementById('push-menu-status');

  // Проверяем текущий статус
  if (Notification.permission === 'granted' && window._fcmToken) {
    showToastMsg('✅','Уведомления уже включены','Push работает');
    return;
  }
  if (Notification.permission === 'denied') {
    showToastMsg('⚠️','Уведомления заблокированы',
      'Разрешите уведомления в настройках браузера для этого сайта');
    return;
  }

  if (sub)    sub.textContent    = 'Запрашиваем разрешение...';
  if (status) status.textContent = '...';

  try {
    // ВАЖНО: requestPermission вызывается СИНХРОННО в обработчике клика
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      if (sub)    sub.textContent    = 'Разрешение отклонено';
      if (status) status.textContent = 'Выкл';
      showToastMsg('⚠️','Разрешение не выдано','Вы можете включить позже в настройках');
      return;
    }

    if (sub) sub.textContent = 'Получаем токен...';

    // Теперь получаем FCM токен
    if (!window._fcmMessaging) {
      if (sub) sub.textContent = 'Firebase недоступен, попробуйте в Chrome';
      return;
    }

    const swReg = window._swRegistration ||
      await navigator.serviceWorker.getRegistration('/app/');
    if (!swReg) {
      if (sub) sub.textContent = 'Service Worker не зарегистрирован';
      return;
    }

    const VAPID = 'BEeoJZwo5HOc0dKfKost7H6mShg3hjE59fyRWR90BXGhdFssONuynP4YrxyHul2RXckqaLnTFFpP3YZTcmMMwYM';
    const { getToken } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging.js');
    const token = await getToken(window._fcmMessaging, {
      vapidKey: VAPID,
      serviceWorkerRegistration: swReg
    });

    if (!token) {
      if (sub) sub.textContent = 'Не удалось получить токен';
      return;
    }

    window._fcmToken = token;
    console.log('[FCM] Токен получен по клику');

    // Сохраняем в Firestore через REST (без конфликтов с импортами)
    const phone = (loadSession() || {}).phone || state.phone;
    if (phone) {
      const FB_KEY = 'AIzaSyBQvTtF2NfK_Pvbb9qqf3tqqzXXXmrZbDk';
      const FB_PRJ = 'citycar-voronezh-3ed1b';
      const qResp = await fetch(
        `https://firestore.googleapis.com/v1/projects/${FB_PRJ}/databases/(default)/documents:runQuery?key=${FB_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            structuredQuery: {
              from: [{ collectionId: 'users' }],
              where: { fieldFilter: {
                field: { fieldPath: 'phone' }, op: 'EQUAL',
                value: { stringValue: phone }
              }},
              limit: 1
            }
          })
        }
      );
      const qData = await qResp.json();
      if (qData[0] && qData[0].document) {
        const docName = qData[0].document.name;
        await fetch(
          `https://firestore.googleapis.com/v1/${docName}?updateMask.fieldPaths=fcmToken&key=${FB_KEY}`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fields: { fcmToken: { stringValue: token } } })
          }
        );
        console.log('[FCM] Токен сохранён в Firestore');
      }
    }

    // Обновляем UI
    if (label)  label.textContent  = 'PUSH-УВЕДОМЛЕНИЯ';
    if (sub)    sub.textContent    = 'Подключены · приходят даже когда приложение закрыто';
    if (status) {
      status.textContent = 'Вкл';
      status.style.color = 'var(--green, #10b981)';
    }
    document.getElementById('push-menu-item').onclick = null;
    showToastMsg('✅','Push-уведомления включены','Будем присылать статусы аренды');

  } catch(e) {
    console.warn('[Push] Ошибка:', e.message);
    if (sub)    sub.textContent    = 'Ошибка: ' + e.message;
    if (status) status.textContent = 'Ошибка';
    showToastMsg('❌','Ошибка Push', e.message);
  }
};

// Подключение Telegram уведомлений
window.connectTelegramNotifications = function() {
  const phone = (loadSession() || {}).phone || state.phone || '';
  const digits = phone.replace(/\D/g, '');
  if (!digits) {
    showToastMsg('⚠️','Нет номера телефона','Войдите в аккаунт');
    return;
  }
  // Открываем бота с параметром номера телефона
  const tgUrl = 'https://t.me/CarRent36_bot?start=' + digits;
  window.open(tgUrl, '_blank');

  const sub    = document.getElementById('tg-notify-sub');
  const status = document.getElementById('tg-notify-status');
  if (sub)    sub.textContent    = 'Нажмите /start в боте и подтвердите';
  if (status) status.textContent = '...';
  showToastMsg('📱','Переходим в Telegram','Нажмите кнопку Старт в боте');
};

// Обновляем статус кнопок при загрузке профиля
function updatePushMenuStatus() {
  const pushStatus = document.getElementById('push-menu-status');
  const pushSub    = document.getElementById('push-menu-sub');
  if (Notification.permission === 'granted' && window._fcmToken) {
    if (pushStatus) { pushStatus.textContent = 'Вкл'; pushStatus.style.color = 'var(--green, #10b981)'; }
    if (pushSub)    pushSub.textContent = 'Подключены';
  } else if (Notification.permission === 'denied') {
    if (pushStatus) pushStatus.textContent = 'Заблокированы';
    if (pushSub)    pushSub.textContent = 'Разрешите в настройках браузера';
  }
}


// ═══════════════════════════════════════════════════════════════════════════
// CITYCOINS — БЛОК ОПЛАТЫ В БРОНИРОВАНИИ
// ═══════════════════════════════════════════════════════════════════════════

// Инициализируем блок CityCoins на шаге оплаты (вызывается при переходе на шаг 3)
function initCoinsPayBlock() {
  const sess  = loadSession() || {};
  const coins = sess.bonusPoints || 0;
  const block = document.getElementById('coins-pay-block');
  const avail = document.getElementById('coins-pay-available');
  if (!block) return;

  window._coinsToUse    = 0;
  window._coinsActive   = false;

  // Сбрасываем кнопку-переключатель
  const dot   = document.getElementById('coins-toggle-dot');
  const label = document.getElementById('coins-toggle-label');
  const btn   = document.getElementById('coins-toggle-btn');
  if (dot)   { dot.style.background = 'transparent'; dot.style.borderColor = '#F59E0B'; }
  if (label) { label.textContent = 'Списать'; label.style.color = 'var(--text2)'; }
  if (btn)   btn.style.borderColor = 'rgba(245,158,11,0.4)';

  const detail = document.getElementById('coins-pay-detail');
  if (detail) detail.style.display = 'none';

  if (coins >= 100) {
    block.style.display = 'block';
    if (avail) avail.textContent = 'Доступно: ' + coins.toLocaleString('ru-RU') + ' 🪙';
  } else {
    block.style.display = 'none';
  }
}

function toggleCoinsPayment() {
  const sess      = loadSession() || {};
  const coins     = sess.bonusPoints || 0;
  const kmCost    = (_bookingKmExtra || 0) * 10;
  const isMinuteCoin = state.tariffType === 'minute';
  const baseForCoin  = isMinuteCoin ? (state.estimateAmount || 0) : (state.basePrice || 0);
  const total     = baseForCoin + (state.extras || 0) + kmCost;
  const maxByRule = Math.floor(total * 0.3);
  const canUse    = Math.min(coins, maxByRule);

  const isActive  = !window._coinsActive;
  window._coinsActive = isActive;

  const detail   = document.getElementById('coins-pay-detail');
  const amtEl    = document.getElementById('coins-pay-amount');
  const discEl   = document.getElementById('coins-pay-discount');
  const payBtn   = document.getElementById('btn-pay-booking');
  const dot      = document.getElementById('coins-toggle-dot');
  const label    = document.getElementById('coins-toggle-label');
  const toggleBtn= document.getElementById('coins-toggle-btn');

  if (isActive && canUse >= 100) {
    window._coinsToUse = canUse;
    // Включаем визуально
    if (dot)   { dot.style.background = '#F59E0B'; dot.style.borderColor = '#F59E0B'; }
    if (label) { label.textContent = 'Активно ✓'; label.style.color = '#F59E0B'; }
    if (toggleBtn) toggleBtn.style.borderColor = '#F59E0B';
    if (detail) detail.style.display = 'block';
    if (amtEl)  amtEl.textContent  = canUse.toLocaleString('ru-RU') + ' 🪙';
    if (discEl) discEl.textContent = '−' + canUse.toLocaleString('ru-RU') + ' ₽';
    if (payBtn) {
      const discounted = Math.max(total - canUse, 0);
      payBtn.textContent = '💳 Оплатить ' + discounted.toLocaleString('ru-RU') + ' ₽';
    }
    // Обновляем итог
    const sumEl = document.getElementById('sum-total');
    if (sumEl) sumEl.textContent = Math.max(total - canUse, 0).toLocaleString('ru-RU') + ' ₽';
  } else {
    window._coinsToUse  = 0;
    window._coinsActive = false;
    if (dot)   { dot.style.background = 'transparent'; dot.style.borderColor = '#F59E0B'; }
    if (label) { label.textContent = 'Списать'; label.style.color = 'var(--text2)'; }
    if (toggleBtn) toggleBtn.style.borderColor = 'rgba(245,158,11,0.4)';
    if (detail) detail.style.display = 'none';
    if (payBtn) payBtn.textContent = '💳 Оплатить бронирование';
    const sumEl = document.getElementById('sum-total');
    if (sumEl) sumEl.textContent = total.toLocaleString('ru-RU') + ' ₽';
  }
}

// Списываем монеты в Firestore после успешной оплаты
async function deductCoinsAfterPayment(coinsUsed, phone) {
  if (!coinsUsed || coinsUsed <= 0 || !phone) return;
  try {
    const FB_KEY = 'AIzaSyBQvTtF2NfK_Pvbb9qqf3tqqzXXXmrZbDk';
    const FB_PRJ = 'citycar-voronezh-3ed1b';
    // docName формируем из phone — без лишнего read
    const docName = `projects/${FB_PRJ}/databases/(default)/documents/users/${encodeURIComponent(phone)}`;
    const curBalance = (window._cachedUserData?.bonusPoints) || (loadSession()?.bonusPoints) || 0;
    const newBalance = Math.max(curBalance - coinsUsed, 0);
    await fetch(
      `https://firestore.googleapis.com/v1/${docName}?updateMask.fieldPaths=bonusPoints&key=${FB_KEY}`,
      {
        method:'PATCH', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ fields:{ bonusPoints:{ integerValue: String(newBalance) } } })
      }
    );
    // Обновляем сессию
    const sess = loadSession() || {};
    sess.bonusPoints = newBalance;
    try { localStorage.setItem('citycar_session', JSON.stringify(sess)); } catch(_) {}
    console.log('[CityCoins] Списано:', coinsUsed, '| Остаток:', newBalance);
  } catch(e) { console.warn('[CityCoins] Ошибка списания:', e.message); }
}
