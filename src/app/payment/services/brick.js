import { IFRAME_SECURE_ORIGIN } from '../../constants';

/* @ngInject */
function brick() {
    let listener;
    const iframe = document.createElement('IFRAME');

    iframe.style.display = 'none';
    iframe.src = `${IFRAME_SECURE_ORIGIN}/paymentwall.html`;
    iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin');

    function getFingerprint(callback = angular.noop) {
        iframe.onload = sendMessage(callback);
        document.body.appendChild(iframe);
    }

    function sendMessage(callback) {
        listener = (event) => fingerprintReceived(event, callback);
        return () => {
            const message = { action: 'getFingerprint' };
            window.addEventListener('message', listener, false);
            iframe.contentWindow.postMessage(message, IFRAME_SECURE_ORIGIN);
        };
    }
    function fingerprintReceived(event, callback) {
        // For Chrome, the origin property is in the event.originalEvent object.
        const origin = event.origin || event.originalEvent.origin;
        // Change window.location.origin to wherever this is hosted ( 'https://secure.protonmail.com:443' )
        if (origin !== IFRAME_SECURE_ORIGIN) {
            return;
        }
        window.removeEventListener('message', listener);
        document.body.removeChild(iframe);
        callback(event.data);
    }
    return { getFingerprint };
}
export default brick;
