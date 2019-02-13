/* @ngInject */
function codeVerificator(dispatchers, humanVerificationModel, networkActivityTracker, notification) {
    const NEW_CODE_CLASS = 'codeVerificator-new-code';
    const CODE_SENT_CLASS = 'codeVerificator-code-sent';

    return {
        replace: true,
        scope: {
            code: '=',
            codeRetry: '@'
        },
        restrict: 'E',
        templateUrl: require('../../../templates/formUtils/codeVerificator.tpl.html'),
        link(scope, el, { method }) {
            const { on, unsubscribe, dispatcher } = dispatchers(['humanVerification']);

            const focusInput = (name) => {
                scope.$applyAsync(() => {
                    el[0][name].focus();
                });
            };

            focusInput(`${method}Verification`);

            const onSubmit = (e) => {
                // Stop the propagation to the signup form...
                e.preventDefault();
                e.stopPropagation();

                const promise = humanVerificationModel.sendCode(method, scope.contactInformation);
                networkActivityTracker.track(promise);

                // reset code value to avoid getting it back a second time
                scope.$applyAsync(() => (scope.code = ''));
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
                    focusInput('codeValue');
                }

                if (type === 'code.sent.error' && data.method === method && data.errorMessage) {
                    notification.error(data.errorMessage);
                    el[0].classList.remove(CODE_SENT_CLASS);
                }
            });

            const onKeydown = (e) => {
                if (e.key !== 'Enter') {
                    return;
                }

                // No need to use $applyAsync from here, it's done inside HumanVerification
                if (scope.code) {
                    // prevent submit --force
                    e.preventDefault();
                    e.stopPropagation();
                    dispatcher.humanVerification('validate.submit.codeVerification');
                }
            };
            console.log({ method }, scope.codeRetry);
            if (scope.codeRetry === 'true') {
                el[0].classList.add(CODE_SENT_CLASS);
                focusInput('codeValue');
            }

            el.on('keydown', onKeydown);
            el.on('submit', onSubmit);
            el.on('click', onClick);

            scope.$on('$destroy', () => {
                el.off('submit', onSubmit);
                el.off('click', onClick);
                el.off('keydown', onKeydown);
                unsubscribe();
            });
        }
    };
}

export default codeVerificator;
