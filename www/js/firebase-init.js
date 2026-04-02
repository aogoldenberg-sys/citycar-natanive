  import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
  import { getFirestore, collection, addDoc, serverTimestamp, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
  import { getStorage as _getStorage } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";
  import { getMessaging, getToken, onMessage } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging.js";

  const firebaseConfig = {
    apiKey: "AIzaSyBQvTtF2NfK_Pvbb9qqf3tqqzXXXmrZbDk",
    authDomain: "citycar-voronezh-3ed1b.firebaseapp.com",
    projectId: "citycar-voronezh-3ed1b",
    storageBucket: "citycar-voronezh-3ed1b.firebasestorage.app",
    messagingSenderId: "990092376409",
    appId: "1:990092376409:web:bec66e81fff5902d59f448"
  };

  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  window._firestoreDB = db; // делаем доступным глобально
  window._firebaseStorage = _getStorage(app); // Storage глобально

  // ── Service Worker + Push уведомления ──────────────────────────────────────
  const VAPID_KEY = 'BEeoJZwo5HOc0dKfKost7H6mShg3hjE59fyRWR90BXGhdFssONuynP4YrxyHul2RXckqaLnTFFpP3YZTcmMMwYM';
  const _WORKER_URL_LOCAL = 'https://citycar-upload.aogoldenberg.workers.dev';

  // Регистрируем Service Worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/app/sw.js', { scope: '/app/' })
      .then(reg => {
        console.log('[SW] Зарегистрирован:', reg.scope);
        window._swRegistration = reg;
      })
      .catch(err => console.warn('[SW] Ошибка регистрации:', err));

    // Слушаем сообщения от SW (например, клик по уведомлению)
    navigator.serviceWorker.addEventListener('message', e => {
      if (e.data && e.data.type === 'PUSH_CLICK') {
        // Пользователь кликнул по уведомлению — можно обработать навигацию
        console.log('[Push] Клик по уведомлению, bookingId:', e.data.bookingId);
      }
    });
  }

  // Инициализируем FCM Messaging
  let _fcmMessaging = null;
  try {
    _fcmMessaging = getMessaging(app);
    window._fcmMessaging = _fcmMessaging;
  window._fcmGetToken = getToken;   // экспорт для enablePushNotifications

    // Слушаем push пока приложение открыто (foreground)
    onMessage(_fcmMessaging, payload => {
      console.log('[FCM] Foreground push:', payload);
      const n = payload.notification || {};
      if (window.showToastMsg) {
        showToastMsg('🔔', n.title || 'CityCAR', n.body || '');
      }
    });

    // Автоматически восстанавливаем FCM токен если разрешение уже выдано
    // Ждём готовности Service Worker через событие, не таймаут
    if (Notification.permission === 'granted') {
      const autoRestorePush = async () => {
        try {
          // Ждём пока SW зарегистрируется (может занять до 3 сек)
          let swReg = window._swRegistration;
          if (!swReg) {
            for (let i = 0; i < 10; i++) {
              await new Promise(r => setTimeout(r, 500));
              swReg = window._swRegistration || await navigator.serviceWorker.getRegistration('/app/');
              if (swReg) break;
            }
          }
          if (!swReg) { console.warn('[FCM] SW не готов для авто-восстановления'); return; }
          const VAPID_KEY = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBXF7Wv3c4QjBe6QdM5X2oFD8Cb0';
          const token = await getToken(_fcmMessaging, {
            vapidKey: VAPID_KEY,
            serviceWorkerRegistration: swReg
          });
          if (token) {
            window._fcmToken = token;
            console.log('[FCM] Токен восстановлен автоматически');
            // Обновляем токен в Firestore если пользователь залогинен
            try {
              const sess = JSON.parse(localStorage.getItem('citycar_session') || '{}');
              if (sess.phone) {
                const FB_KEY = 'AIzaSyBQvTtF2NfK_Pvbb9qqf3tqqzXXXmrZbDk';
                const FB_PRJ = 'citycar-voronezh-3ed1b';
                const qUrl = `https://firestore.googleapis.com/v1/projects/${FB_PRJ}/databases/(default)/documents:runQuery?key=${FB_KEY}`;
                const qResp = await fetch(qUrl, {
                  method: 'POST', headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ structuredQuery: { from: [{ collectionId: 'users' }], where: { fieldFilter: { field: { fieldPath: 'phone' }, op: 'EQUAL', value: { stringValue: sess.phone } } }, limit: 1 } })
                });
                const qData = await qResp.json();
                if (qData[0] && qData[0].document) {
                  const docName = qData[0].document.name;
                  await fetch(`https://firestore.googleapis.com/v1/${docName}?updateMask.fieldPaths=fcmToken&key=${FB_KEY}`, {
                    method: 'PATCH', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ fields: { fcmToken: { stringValue: token } } })
                  });
                }
              }
            } catch(e2) {}
            if (typeof updatePushMenuStatus === 'function') updatePushMenuStatus();
          }
        } catch(e) {
          console.warn('[FCM] Авто-восстановление токена:', e.message);
        }
      };
      // Запускаем через 1 сек после загрузки
      setTimeout(autoRestorePush, 1000);
    }
  } catch(e) {
    console.warn('[FCM] Messaging недоступен:', e.message);
  }

  // Глобальная функция запроса разрешения и сохранения FCM токена
  // Вызывается после входа — с задержкой чтобы не мешать запросу геолокации
  window.requestPushPermission = async function(userPhone) {
    if (!_fcmMessaging || !userPhone) return;
    try {
      // Если разрешение уже есть — не спрашиваем снова
      let permission = Notification.permission;
      if (permission === 'default') {
        permission = await Notification.requestPermission();
      }
      if (permission !== 'granted') {
        console.log('[Push] Разрешение не получено:', permission);
        return;
      }

      const swReg = window._swRegistration ||
        await navigator.serviceWorker.getRegistration('/app/');
      if (!swReg) return;

      const token = await getToken(_fcmMessaging, {
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: swReg
      });
      if (!token) return;
      console.log('[FCM] Токен получен');

      // Сохраняем fcmToken напрямую через Firestore REST API
      // (избегаем конфликта переменных с импортами выше)
      const phone = userPhone.trim();
      const FB_KEY = 'AIzaSyBQvTtF2NfK_Pvbb9qqf3tqqzXXXmrZbDk';
      const FB_PRJ = 'citycar-voronezh-3ed1b';
      const qUrl   = `https://firestore.googleapis.com/v1/projects/${FB_PRJ}/databases/(default)/documents:runQuery?key=${FB_KEY}`;
      const qResp  = await fetch(qUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          structuredQuery: {
            from: [{ collectionId: 'users' }],
            where: { fieldFilter: { field: { fieldPath: 'phone' }, op: 'EQUAL', value: { stringValue: phone } } },
            limit: 1
          }
        })
      });
      const qData = await qResp.json();
      if (qData[0] && qData[0].document) {
        const docName = qData[0].document.name;
        const pUrl = `https://firestore.googleapis.com/v1/${docName}?updateMask.fieldPaths=fcmToken&key=${FB_KEY}`;
        await fetch(pUrl, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fields: { fcmToken: { stringValue: token } } })
        });
        console.log('[FCM] Токен сохранён в Firestore');
      }
      window._fcmToken = token;
    } catch(e) {
      console.warn('[Push] Ошибка получения токена:', e.message);
    }
  };

  // Запускаем realtime слушатель изменений автопарка
  setTimeout(() => { if (window.startFleetListener) window.startFleetListener(); }, 1500);

  // Глобальная функция сохранения заявки в Firebase

  // ── USERS FIRESTORE ──────────────────────────────────────

  // Слушать изменения профиля (verificationStatus, activeBookingId)
  window._userUnsubscribe = null;
  window.listenUserProfile = async function(phone) {
    if (!phone) return;
    // Защита от повторного вызова для того же телефона
    if (window._currentUserListener === phone && window._userUnsubscribe) {
      console.log('[User] Already listening to', phone);
      return;
    }
    window._currentUserListener = phone;
    if (window._userUnsubscribe) window._userUnsubscribe(); // отписываемся от предыдущего
    try {
      const { doc, onSnapshot } =
        await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
      const ref = doc(db, 'users', phone);
      window._userUnsubscribe = onSnapshot(ref, (snap) => {
        if (!snap.exists()) return;
        const data = snap.data();
        window._cachedUserData = data; // кэш — используется в accrueCoinsAfterTrip
        // Обновляем localStorage и UI
        try {
          const session = JSON.parse(localStorage.getItem('citycar_session') || '{}');
          const oldStatus = session.verificationStatus;
          if (data.verificationStatus) session.verificationStatus = data.verificationStatus;
          if (data.name)    session.name    = data.name;
          if (data.email)   session.email   = data.email;
          if (data.birth)   session.birth   = data.birth;
          if (data.license) session.license = data.license;
          if (data.bonusPoints       !== undefined) session.bonusPoints      = data.bonusPoints;
          if (data.totalCoinsEarned  !== undefined) session.totalCoinsEarned = data.totalCoinsEarned;
          if (data.totalTrips        !== undefined) session.totalTrips        = data.totalTrips;
          if (data.rebillId)   session.rebillId   = data.rebillId;
          if (data.cardMasked) session.cardMasked = data.cardMasked;
          localStorage.setItem('citycar_session', JSON.stringify(session));

          // Если статус изменился — обновить UI профиля
          if (oldStatus !== data.verificationStatus) {
            applySessionToProfile(loadSession());
            // Уведомить пользователя об изменении
            if (data.verificationStatus === 'verified' && oldStatus !== 'verified') {
              showToastMsg('✅', 'Верификация пройдена!', 'Теперь вы можете бронировать автомобили');
            } else if (data.verificationStatus === 'rejected') {
              // Сохраняем причину отказа в сессию
              const reason = data.rejectionReason || data.rejection_reason || '';
              try {
                const sess2 = JSON.parse(localStorage.getItem('citycar_session') || '{}');
                sess2.rejectionReason = reason;
                localStorage.setItem('citycar_session', JSON.stringify(sess2));
              } catch(e) {}
              showToastMsg('❌', 'Документы не приняты', reason || 'Исправьте и загрузите повторно');
            }
          }

          // Если появился activeBookingId — слушаем заявку
          if (data.activeBookingId && data.activeBookingId !== window._listeningBookingId) {
            listenActiveBooking(data.activeBookingId);
          }
        } catch(e) {}
      });
    } catch(e) { console.error('listenUserProfile:', e); window._currentUserListener = null; }
  };

  // Слушать активную заявку (ждём status = active)
  window._bookingUnsubscribe = null;
  window._listeningBookingId = null;
  window.listenActiveBooking = async function(bookingId) {
    if (window._bookingUnsubscribe) window._bookingUnsubscribe();
    window._listeningBookingId = bookingId;
    try {
      const { doc, onSnapshot } =
        await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
      const ref = doc(db, 'bookings', bookingId);
      window._bookingUnsubscribe = onSnapshot(ref, (snap) => {
        if (!snap.exists()) return;
        const data = { id: snap.id, ...snap.data() };

        // Оператор нажал "Старт" → запускаем экран аренды
        if (data.status === 'active' && data.startedAt) {
          if (window._activeRental?.id !== bookingId) {
            data.startDT     = new Date(data.startedAt);
            data.paidUntilDT = data.paidUntil ? new Date(data.paidUntil) : null;
            // Скрываем экран «Оплачено» если был открыт
            const bpaid = document.getElementById('screen-booking-paid');
            if (bpaid) bpaid.classList.remove('active');
            startRentalScreen(data);
            showToastMsg('🚗', 'Аренда началась!', 'Счётчик времени запущен');
          }
        }

        // Оператор завершил аренду принудительно → показываем финальный экран
        if (data.status === 'done' && window._activeRental?.id === bookingId) {
          if (window._activeRental && !window._operatorFinishedHandled) {
            window._operatorFinishedHandled = true;
            if (window._rentalTimer) { clearInterval(window._rentalTimer); window._rentalTimer = null; }
            if (window._pendingCheckInterval) { clearInterval(window._pendingCheckInterval); window._pendingCheckInterval = null; }
            ['screen-rental','screen-inspection','screen-pre-inspection','screen-pending-finish','screen-booking-paid'].forEach(id => {
              const el = document.getElementById(id);
              if (el) el.classList.remove('active');
            });
            showToastMsg('🏁', 'Аренда завершена', 'Оператор завершил аренду');
            setTimeout(() => showFinalScreen(), 800);
          }
        }

        // Заявка подтверждена
        if (data.status === 'confirmed') {
          showToastMsg('✅', 'Бронь подтверждена!', 'Оператор ожидает вас у автомобиля');
        }

        // Заявка отклонена
        if (data.status === 'cancelled') {
          showToastMsg('❌', 'Заявка отклонена', 'Обратитесь к оператору');
          window._bookingUnsubscribe && window._bookingUnsubscribe();
          window._listeningBookingId = null;
        }
      });
    } catch(e) { console.error('listenActiveBooking:', e); }
  };


  window.saveBookingToFirebase = async function(bookingData) {
    try {
      const docRef = await addDoc(collection(db, "bookings"), {
        ...bookingData,
        createdAt: serverTimestamp(),
        status: "new"
      });
      console.log("✅ Заявка сохранена в Firebase:", docRef.id);
      return docRef.id;
    } catch (e) {
      console.error("❌ Ошибка Firebase:", e);
      return null;
    }
  };

  // ─── USERS FIRESTORE ──────────────────────────────────
  // Сохранить/обновить пользователя в Firestore
  window.saveUserToFirestore = async function(phone, data) {
    if (!phone) return;
    try {
      const { doc, setDoc, serverTimestamp } =
        await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
      const ref = doc(db, 'users', phone);
      await setDoc(ref, {
        ...data,
        phone,
        updatedAt: serverTimestamp()
      }, { merge: true });
      console.log('✅ users сохранён:', phone);
    } catch(e) { console.error('saveUserToFirestore:', e); }
  };

  // Получить данные пользователя из Firestore (для авторизации)
  window.getFirestoreUser = async function(phone) {
    try {
      const { doc, getDoc } =
        await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
      const snap = await getDoc(doc(db, 'users', phone));
      if (!snap.exists()) return null;
      return snap.data();
    } catch(e) { console.error('getFirestoreUser:', e); return null; }
  };

  // startUserListener удалён — дублировал listenUserProfile (см. выше)

  // Realtime слушатель активной заявки
  // startBookingListener удалён — дублировал listenActiveBooking (onSnapshot на тот же bookings-doc)
  // Используйте window.listenActiveBooking(bookingId) вместо него.

  // Проверка доступности авто на выбранные даты
  window.checkCarAvailability = async function(carName, date, time) {
    try {
      const carData = (window._fleetData||[]).find(c=>c.name===carName);
      // Проверяем только явную блокировку со сроком (maintenance/blockReason)
      // status='busy' = сейчас в аренде, но будущие бронирования не блокируем
      if (carData && carData.status === 'maintenance') {
        return false; // На ТО — недоступен
      }
      if (carData && carData.blockedUntil) {
        const blockedEnd = new Date(carData.blockedUntil);
        const timeVal = time || document.getElementById('bookTime')?.value || '00:00';
        const chosenDT = new Date(date + 'T' + timeVal);
        if (chosenDT <= blockedEnd) return false;
      }
      // Проверяем есть ли подтверждённые бронирования на эту дату
      const _db = window._firestoreDB;
      if (!_db) return true; // Firebase не готов — разрешаем
      const { query: q, where, getDocs: gd, collection: col2 } =
        await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
      const snap = await gd(q(
        col2(_db, 'bookings'),
        where('car', '==', carName),
        where('date', '==', date),
        where('status', 'in', ['confirmed','active'])
      ));
      return snap.empty;
    } catch(e) {
      console.warn('checkCarAvailability error:', e);
      return true; // При ошибке — разрешаем (не блокируем зря)
    }
  };

  // Смена статуса авто в Firestore (вызывается из CRM при подтверждении)
  window.updateCarStatus = async function(carId, newStatus) {
    try {
      const { doc, updateDoc } =
        await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
      await updateDoc(doc(db, 'fleet', carId), { status: newStatus });
      // Обновляем локальный кеш
      if (window._fleetData) {
        const car = window._fleetData.find(c => c.id === carId);
        if (car) car.status = newStatus;
        if (typeof refreshMapPlacemarks === 'function') refreshMapPlacemarks();
        if (typeof renderFleetTab === 'function') renderFleetTab();
      }
      return true;
    } catch(e) {
      console.error('updateCarStatus error:', e);
      return false;
    }
  };

  // Смена статуса заявки
  window.updateBookingStatus = async function(bookingId, newStatus) {
    try {
      const { doc, updateDoc } =
        await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
      await updateDoc(doc(db, 'bookings', bookingId), {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
      return true;
    } catch(e) {
      return false;
    }
  };

  // Realtime слушатель — обновляем статусы авто в реальном времени
  // Realtime слушатель автопарка через onSnapshot — обновляется мгновенно из CRM
  window.startFleetListener = async function() {
    // Если уже подписаны — не создаём повторно
    if (window._fleetUnsubscribe) return;
    try {
      const { collection: col3, onSnapshot } =
        await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
      window._fleetUnsubscribe = onSnapshot(col3(db, 'fleet'), (snap) => {
        if (snap.empty) return;
        window._fleetData = [];
        snap.forEach(d => window._fleetData.push({ id: d.id, ...d.data() }));
        _fleetData = window._fleetData;
        window._fleetCatalogFetched = Date.now();
        if (typeof renderFleetTab === 'function') renderFleetTab();
        if (typeof renderMapCarsStrip === 'function') renderMapCarsStrip();
        if (typeof refreshMapPlacemarks === 'function') refreshMapPlacemarks();
        if (typeof renderBookingCars === 'function') renderBookingCars();
      }, (err) => {
        console.warn('[Fleet] onSnapshot ошибка:', err.message);
        window._fleetUnsubscribe = null; // сбросить чтобы можно было переподключиться
      });
    } catch(e) {
      console.warn('[Fleet] startFleetListener:', e.message);
    }
  };
