import CONFIG from '../../config';
import { getRelativeApiHostname } from '../../core/directives/signupIframe';

function getIframeUrl() {
    const { apiUrl } = CONFIG;
    const url = new URL(apiUrl, window.location.origin);
    url.hostname = getRelativeApiHostname(url.hostname);
    url.pathname = '/core/v4/captcha';
    return url;
}

/* @ngInject */
function captcha(dispatchers) {
    const { dispatcher } = dispatchers(['humanVerification', 'captcha.token']);

    return {
        replace: true,
        templateUrl: require('../../../templates/formUtils/captcha.tpl.html'),
        link(scope, el, { token = 'signup' }) {
            const iframe = el.find('iframe');
            const iframeUrl = getIframeUrl();

            const iframeOrigin = iframeUrl.origin;

            const listener = (event) => {
                if (typeof event.origin === 'undefined' && typeof event.originalEvent.origin === 'undefined') {
                    return;
                }
                const origin = event.origin || event.originalEvent.origin;
                if (origin !== iframeOrigin) {
                    return;
                }

                const data = event.data;

                if (data.type === 'pm_captcha') {
                    dispatcher.humanVerification('captcha', data);
                    dispatcher['captcha.token']('token', data.token);
                }

                if (data.type === 'pm_height') {
                    iframe.height(event.data.height + 40);
                }
            };

            window.addEventListener('message', listener, false);

            iframe[0].src = `${iframeUrl.toString()}?Token=${token}`;

            scope.$on('$destroy', () => {
                window.removeEventListener('message', listener, false);
            });
        }
    };
}
export default captcha;
