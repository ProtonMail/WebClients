import { IFRAME_SECURE_ORIGIN } from '../../constants';

/* @ngInject */
function captcha($rootScope, url, $httpParamSerializer) {
    const APP_HOST = url.host();

    // Change this to our captcha key, configurable in Angular?
    const captchaMessage = {
        type: 'pm_captcha',
        language: 'en',
        key: '6LcWsBUTAAAAAOkRfBk-EXkGzOfcSz3CzvYbxfTn'
    };

    // FIX ME - Bart. Jan 18, 2016. Mon 2:29 PM.
    const captchaReceiveMessage = ($iframe) => (event) => {
        if (typeof event.origin === 'undefined' && typeof event.originalEvent.origin === 'undefined') {
            return;
        }

        // For Chrome, the origin property is in the event.originalEvent object.
        const origin = event.origin || event.originalEvent.origin;

        // Change window.location.origin to wherever this is hosted ( 'https://secure.protonmail.com:443' )
        if (origin !== IFRAME_SECURE_ORIGIN) {
            return;
        }

        const data = event.data;

        if (data.type === 'pm_captcha') {
            $rootScope.$emit('humanVerification', {
                type: 'captcha',
                data
            });
        }

        if (data.type === 'pm_height') {
            $iframe.height(event.data.height + 40);
        }
    };

    return {
        replace: true,
        templateUrl: require('../../../templates/formUtils/captcha.tpl.html'),
        link(scope, el, { token = 'signup' }) {
            const iframe = el.find('iframe');
            const listener = captchaReceiveMessage(iframe);
            const parameters = $httpParamSerializer({ token, client: 'web', host: APP_HOST });

            // Change window.location.origin to wherever this is hosted ( 'https://secure.protonmail.com:443' )
            window.captchaSendMessage = () => {
                iframe[0].contentWindow.postMessage(captchaMessage, IFRAME_SECURE_ORIGIN);
            };

            iframe[0].onload = window.captchaSendMessage;
            iframe[0].src = 'https://secure.protonmail.com/captcha/captcha.html?' + parameters;

            window.addEventListener('message', listener, false);

            scope.$on('$destroy', () => {
                window.removeEventListener('message', listener, false);
            });
        }
    };
}
export default captcha;
