/* @ngInject */
function codeVerificator(dispatchers, humanVerificationModel, networkActivityTracker, notification, gettextCatalog) {
    const CACHE = {};
    const { on, unsubscribe } = dispatchers(['signup']);
    const CODE_SENT_CLASS = 'codeVerificator-code-sent';
    const DELAY_ACTIVE_RESEND = 30000;

    const I18N = {
        canResend(delay) {
            return gettextCatalog.getString(
                'Please wait {{delay}} second(s) before requesting a new code',
                { delay },
                'Info'
            );
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
            codeRetry: '=',
            method: '@'
        },
        restrict: 'E',
        templateUrl: require('../../../templates/formUtils/codeVerificator.tpl.html'),
        link(scope, el) {
            const { on, unsubscribe, dispatcher } = dispatchers(['humanVerification']);
            const { method } = scope;

            scope.model = { value: '' };

            const CACHE = {
                canSend: false
            };

            /**
             * Activate the resend button only after 30s.
             * as the sms/email can take a few seconds to come, so to prevent the jail
             * we allow the button only after 30s.
             */
            function activateResend() {
                CACHE.canSend = false;
                CACHE.start = Date.now();
                if ('timer' in CACHE) {
                    clearTimeout(CACHE.timer);
                }
                CACHE.timer = setTimeout(() => {
                    CACHE.canSend = true;
                    clearTimeout(CACHE.timer);
                    delete CACHE.timer;
                }, DELAY_ACTIVE_RESEND);
            }

            const focusInput = (name) => {
                scope.$applyAsync(() => {
                    el[0][name].focus();
                });
            };

            const onSubmit = (e) => {
                // Stop the propagation to the signup form...
                e.preventDefault();
                e.stopPropagation();

                // Prevent submit if invalid we can hit the jail
                if (!scope.codeVerificatorForm.$valid) {
                    return;
                }

                activateResend();
                CACHE[method] = scope.model.value;
                const promise = humanVerificationModel.sendCode(method, scope.model.value);
                networkActivityTracker.track(promise);
                // reset code value to avoid getting it back a second time
                scope.$applyAsync(() => (scope.code = ''));
            };

            const sendNewCode = () => {
                onSubmit({
                    preventDefault() {},
                    stopPropagation() {}
                });
            };

            const onClick = ({ target }) => {
                const action = target.getAttribute('data-action');

                if (action === 'sendNewCode') {
                    if (!CACHE.canSend) {
                        // How many seconds before we can send
                        const delay = Math.ceil((DELAY_ACTIVE_RESEND - (Date.now() - CACHE.start)) / 1000);
                        return notification.info(I18N.canResend(delay));
                    }

                    sendNewCode();
                }

                if (action === 'resetCode') {
                    el[0].classList.remove(CODE_SENT_CLASS);
                    delete CACHE[method];
                    scope.$applyAsync(() => {
                        scope.model.value = '';
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
                CACHE[method] = scope.model.value;
            };

            scope.model.value = CACHE[method];
            el[0].classList.add(`codeVerificator-${method}-method`);
            focusInput(`${method}Verification`);

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
