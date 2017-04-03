angular.module('proton.core')
.factory('brick', () => {
    let listener;
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = 'https://secure.protonmail.com/paymentwall.html';
    iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin');
    function getFingerprint(callback) {
        iframe.onload = sendMessage(callback);
        document.body.appendChild(iframe);
    }
    function sendMessage(callback) {
        listener = (event) => fingerprintReceived(event, callback);
        return () => {
            const message = { action: 'getFingerprint' };
            window.addEventListener('message', listener, false);
            iframe.contentWindow.postMessage(message, 'https://secure.protonmail.com');
        };
    }
    function fingerprintReceived(event, callback) {
        // For Chrome, the origin property is in the event.originalEvent object.
        const origin = event.origin || event.originalEvent.origin;
        // Change window.location.origin to wherever this is hosted ( 'https://secure.protonmail.com:443' )
        if (origin !== 'https://secure.protonmail.com') {
            return;
        }
        window.removeEventListener('message', listener);
        document.body.removeChild(iframe);
        callback(event.data);
    }
    return { getFingerprint };
});
