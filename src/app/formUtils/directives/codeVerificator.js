/* @ngInject */
function codeVerificator(dispatchers, humanVerificationModel, networkActivityTracker, notification) {
    const NEW_CODE_CLASS = 'codeVerificator-new-code';
    const CODE_SENT_CLASS = 'codeVerificator-code-sent';

    return {
        replace: true,
        scope: {
            code: '='
        },
        restrict: 'E',
        templateUrl: require('../../../templates/formUtils/codeVerificator.tpl.html'),
        link(scope, el, { method }) {
            const { on, unsubscribe } = dispatchers(['humanVerification']);

            const onSubmit = () => {
                const promise = humanVerificationModel.sendCode(method, scope.contactInformation);

                networkActivityTracker.track(promise);
            };

            const onClick = ({ target }) => {
                const action = target.getAttribute('data-action');

                if (action === 'sendNewCode') {
                    el[0].classList.add(NEW_CODE_CLASS);
                }
            };

            el[0].classList.add(`codeVerificator-${method}-method`);

            on('humanVerification', (e, { type, data }) => {
                if (type === 'code.sent.success' && data.method === method) {
                    el[0].classList.add(CODE_SENT_CLASS);
                }

                if (type === 'code.sent.error' && data.method === method && data.errorMessage) {
                    notification.error(data.errorMessage);
                }
            });

            el.on('submit', onSubmit);
            el.on('click', onClick);

            scope.$on('$destroy', () => {
                el.off('submit', onSubmit);
                el.off('click', onClick);
                unsubscribe();
            });
        }
    };
}

export default codeVerificator;
