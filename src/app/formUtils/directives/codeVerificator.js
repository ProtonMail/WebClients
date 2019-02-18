/* @ngInject */
function codeVerificator(dispatchers, humanVerificationModel, networkActivityTracker, notification, gettextCatalog) {
    const CACHE = {};
    const { on, unsubscribe } = dispatchers(['signup']);
    const CODE_SENT_CLASS = 'codeVerificator-code-sent';

    const I18N = {
        newCodeSent(email) {
            return gettextCatalog.getString('New code sent to: {{email}}', { email }, 'Success');
        }
    };

    on('signup', (e, { type, data }) => {
        if (type === 'user.finish' && data.value) {
            Object.keys(CACHE).forEach((key) => {
                delete CACHE[key];
            });
            unsubscribe();
        }
    });

    return {
        replace: true,
        scope: {
            code: '=',
            codeRetry: '='
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

            const onSubmit = (e) => {
                // Stop the propagation to the signup form...
                e.preventDefault();
                e.stopPropagation();

                CACHE[method] = scope.contactInformation;
                const promise = humanVerificationModel.sendCode(method, scope.contactInformation);
                networkActivityTracker.track(promise);

                // reset code value to avoid getting it back a second time
                scope.$applyAsync(() => (scope.code = ''));

                e.notifyUser && notification.success(I18N.newCodeSent(scope.contactInformation));
            };

            const sendNewCode = () => {
                onSubmit({
                    preventDefault() {},
                    stopPropagation() {},
                    notifyUser: true
                });
            };

            const onClick = ({ target }) => {
                const action = target.getAttribute('data-action');
                if (action === 'sendNewCode') {
                    sendNewCode();
                }

                if (action === 'resetCode') {
                    el[0].classList.remove(CODE_SENT_CLASS);
                    delete CACHE[method];
                    scope.$applyAsync(() => {
                        scope.contactInformation = '';
                    });
                }
            };

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

            // Store a cache, we destroy it when we complete the signup
            const onChange = () => {
                CACHE[method] = scope.contactInformation;
            };

            scope.contactInformation = CACHE[method];
            el[0].classList.add(`codeVerificator-${method}-method`);
            focusInput(`${method}Verification`);

            // Try only once, if you switch to another option then come back you will see the default component.
            if (scope.codeRetry === method) {
                el[0].classList.add(CODE_SENT_CLASS);
                sendNewCode();
                focusInput('codeValue');
                scope.$applyAsync(() => {
                    scope.codeRetry = '';
                });
            }

            el.on('change', onChange);
            el.on('keydown', onKeydown);
            el.on('submit', onSubmit);
            el.on('click', onClick);

            scope.$on('$destroy', () => {
                el.off('change', onChange);
                el.off('submit', onSubmit);
                el.off('click', onClick);
                el.off('keydown', onKeydown);
                unsubscribe();
            });
        }
    };
}

export default codeVerificator;
