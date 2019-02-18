import { PRODUCT_TYPE } from '../../constants';

/* @ngInject */
function humanVerification(AppModel, User, $state, signupModel, networkActivityTracker, dispatchers) {
    const SELECTOR = {
        FORM_EMAIL: '.humanVerification-formEmail-container',
        FORM_SMS: '.humanVerification-formSms-container',
        BTN_COMPLETE_SETUP: '.humanVerification-completeSetup-create'
    };

    const getVerificator = (scope) => {
        if (scope.showCaptcha) {
            return 'captcha';
        }
        if (scope.showEmail) {
            return 'email';
        }
        if (scope.showSms) {
            return 'sms';
        }
    };

    return {
        replace: true,
        scope: {
            model: '='
        },
        templateUrl: require('../../../templates/user/humanVerification.tpl.html'),
        link(scope, el, { offerType = PRODUCT_TYPE.MAIL }) {
            const { on, unsubscribe, dispatcher } = dispatchers(['payments']);

            const dispatchHelper = (type, data) => dispatcher.payments(type, data);

            const $btnSetup = el.find(SELECTOR.BTN_COMPLETE_SETUP);

            // ლ(ಠ益ಠლ because checkbox will rewrite the type... --force
            scope.model.confirmationType &&
                setTimeout(() => {
                    scope.$applyAsync(() => {
                        scope.verificator = scope.model.confirmationType;
                    });
                }, 500);

            signupModel.getOptionsVerification(offerType).then(({ email, captcha, sms, payment }) => {
                scope.$applyAsync(() => {
                    scope.showEmail = email;
                    scope.showCaptcha = captcha;
                    scope.showSms = sms;
                    scope.showPayment = payment;
                    scope.verificator = getVerificator(scope);
                });
            });

            const onClickCompleteSetup = (e) => {
                e.preventDefault();
                scope.$applyAsync(() => {
                    // reset as we try to send again
                    scope.model.confirmationType = '';
                    dispatchHelper('create.account');
                });
            };

            on('payments', (e, { type, data = {} }) => {
                if (type === 'donate.submit' && data.action === 'humanVerification') {
                    dispatchHelper('create.account', data);
                }
            });

            on('humanVerification', (e, { type, data = {} }) => {
                if (type === 'validate.submit.codeVerification') {
                    return onClickCompleteSetup({ preventDefault() {} });
                }

                if (type !== 'captcha') {
                    return;
                }
                scope.$applyAsync(() => {
                    scope.model.captcha_token = data.token;
                });
            });

            $btnSetup.on('click', onClickCompleteSetup);

            scope.$on('$destroy', () => {
                $btnSetup.off('click', onClickCompleteSetup);
                unsubscribe();
            });
        }
    };
}
export default humanVerification;
