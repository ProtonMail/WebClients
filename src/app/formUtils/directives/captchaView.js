angular.module('proton.formUtils')
.directive('captchaView', ($httpParamSerializer) => {
    return {
        restrict: 'E',
        templateUrl: 'templates/directives/core/captchaView.tpl.html',
        scope: { callback: '&' },
        link(scope, element, { token }) {
            const iframe = element[0].querySelector('iframe');
            const client = 'web';
            const host = window.location;
            const parameters = $httpParamSerializer({ token, client, host });
            window.addEventListener('message', captchaReceiveMessage, false);
            iframe.onload = captchaSendMessage;
            iframe.src = 'https://secure.protonmail.com/captcha/captcha.html?' + parameters;
            scope.$on('$destroy', () => {
                window.removeEventListener('message', captchaReceiveMessage, false);
            });

            function captchaSendMessage() {
                const message = {
                    type: 'pm_captcha',
                    language: 'en',
                    key: '6LcWsBUTAAAAAOkRfBk-EXkGzOfcSz3CzvYbxfTn'
                };

                iframe.contentWindow.postMessage(message, 'https://secure.protonmail.com');
            }

            function captchaReceiveMessage(event) {
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
                    scope.callback(data.token);
                }

                if (data.type === 'pm_height') {
                    const height = event.data.height + 40;
                    iframe.style.height = `${height}px`;
                }
            }
        }
    };
});
