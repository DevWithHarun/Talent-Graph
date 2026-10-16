(function(){
  // Firestore internal assertion IDs that are recoverable connection glitches,
  // not real app errors. Suppressing these prevents false crash alerts.
  var P = [
    'INTERNAL ASSERTION FAILED',
    'ID: ca9',   // WebChannel stream reset
    'ID: b815',  // Unexpected state after stream reset cascade
    'FIRESTORE_INTERNAL',
  ];

  function matches(s) {
    return P.some(function(p) { return String(s).indexOf(p) !== -1; });
  }

  // Suppress console.error spam from Firebase SDK internals.
  var origError = console.error.bind(console);
  console.error = function() {
    var msg = Array.prototype.join.call(arguments, ' ');
    if (matches(msg)) {
      console.warn('[TG] Firebase internal (suppressed):', msg.slice(0, 120));
      return;
    }
    origError.apply(console, arguments);
  };

  // Prevent uncaught window errors from Firebase internals crashing the page.
  window.addEventListener('error', function(ev) {
    if (matches(ev.message)) {
      ev.stopImmediatePropagation();
      ev.preventDefault();
    }
  }, true);

  // Prevent unhandled promise rejections from Firebase internals.
  window.addEventListener('unhandledrejection', function(ev) {
    var msg = (ev.reason && ev.reason.message) || String(ev.reason || '');
    if (matches(msg)) ev.preventDefault();
  });
})();
