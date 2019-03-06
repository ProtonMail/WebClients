/* @ngInject */
function codeVerificator(dispatchers, humanVerificationModel, networkActivityTracker, notification, gettextCatalog) {
    const CACHE = {};
    const { on, unsubscribe } = dispatchers(['signup']);
    const CODE_SENT_CLASS = 'codeVerificator-code-sent';

    const I18N = {
        newCodeSent(email) {
            return gettextCatalog.getString('Code sent to: {{email}}', { email }, 'Success');
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

                CACHE[method] = scope.model.value;
                const promise = humanVerificationModel.sendCode(method, scope.model.value);
                networkActivityTracker.track(promise);

                // reset code value to avoid getting it back a second time
                scope.$applyAsync(() => (scope.code = ''));
                notification.success(I18N.newCodeSent(scope.model.value));
            };

            const onClick = ({ target }) => {
                const action = target.getAttribute('data-action');

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
