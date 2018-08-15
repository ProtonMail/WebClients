/* @ngInject */
function captchaView($httpParamSerializer, dispatchers, url) {
    return {
        restrict: 'E',
        templateUrl: require('../../../templates/formUtils/captchaView.tpl.html'),
        link(scope, element, { token }) {
            const { dispatcher } = dispatchers(['captcha.token']);
            const iframe = element[0].querySelector('iframe');
            const client = 'web';
            const host = url.host();
            const parameters = $httpParamSerializer({ token, client, host });
            window.addEventListener('message', receiveMessage, false);
            iframe.src = 'https://secure.protonmail.com/captcha/captcha.html?' + parameters;
            scope.$on('$destroy', () => {
                window.removeEventListener('message', receiveMessage, false);
            });

            function receiveMessage(event) {
                const { origin, originalEvent, data } = event;

                if (typeof origin === 'undefined' && typeof originalEvent.origin === 'undefined') {
                    return;
                }

                // For Chrome, the origin property is in the event.originalEvent object.
                const source = origin || originalEvent.origin;

                // Change window.location.origin to wherever this is hosted ( 'https://secure.protonmail.com:443' )
                if (source !== 'https://secure.protonmail.com') {
                    return;
                }

                if (data.type === 'pm_captcha') {
                    dispatcher['captcha.token'](data.token);
                }

                if (data.type === 'pm_height') {
                    const height = event.data.height + 40;
                    iframe.style.height = `${height}px`;
                }
            }
        }
    };
}
export default captchaView;
