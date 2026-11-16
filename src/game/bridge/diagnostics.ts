/** Source fragment: assembled in order; shares its parent factory scope. */
export const diagnosticsScript = `    function setStatus(message) {
      document.getElementById('status').textContent = message;
    }
    function reportError(error) {
      const message = error && error.message ? error.message : String(error);
      setStatus('ERROR: ' + message);
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({type: 'error', message: message}));
      }
    }
    window.addEventListener('error', function(event) {
      if (event.message) reportError(event.message);
    });
    window.addEventListener('unhandledrejection', function(event) {
      reportError(event.reason || 'Unhandled promise rejection');
    });

`;
