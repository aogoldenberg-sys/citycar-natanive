// ── CLEANUP: отписка от всех Firebase listeners при закрытии страницы ──
window.addEventListener('beforeunload', function() {
  if (window._userUnsubscribe)    { window._userUnsubscribe();    window._userUnsubscribe    = null; }
  if (window._bookingUnsubscribe) { window._bookingUnsubscribe(); window._bookingUnsubscribe = null; }
  if (window._zonesUnsubscribe)   { window._zonesUnsubscribe();   window._zonesUnsubscribe   = null; }
  if (window._fleetInterval)      { clearInterval(window._fleetInterval); window._fleetInterval = null; }
  if (window._fleetUnsubscribe)   { window._fleetUnsubscribe();   window._fleetUnsubscribe   = null; }
  if (window._rentalTimer)        { clearInterval(window._rentalTimer);   window._rentalTimer   = null; }
  if (window._pendingCheckInterval) { clearInterval(window._pendingCheckInterval); window._pendingCheckInterval = null; }
  window._currentUserListener = null;
  window._fleetIntervalInitialized = false;
});
