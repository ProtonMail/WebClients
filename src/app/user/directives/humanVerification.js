angular.module('proton.user')
    .directive('humanVerification', (AppModel, User, $state, signupModel, networkActivityTracker, $rootScope, CONSTANTS) => {

        const SELECTOR = {
            FORM_EMAIL: '.humanVerification-formEmail-container',
            FORM_SMS: '.humanVerification-formSms-container',
            BTN_COMPLETE_SETUP: '.humanVerification-completeSetup-create'
        };

        const dispatch = (type, data = {}) => $rootScope.$emit('payments', { type, data });

        /**
         * Build Destination object config,
         * - type: email => Address
         * - type: sms => Phone
         * @param  {String} type
         * @param  {String} value
         * @return {Object}
         */
        const getDestination = (type, value) => {
            const key = (type === 'sms') ? 'Phone' : 'Address';
            return { [key]: value };
        };

        const sendVerificationCode = (Type = '', value = '') => {
            const promise = User.code({
                Username: signupModel.get('username'),
                Type,
                Destination: getDestination(Type, value)
            })
                .then(({ data = {} } = {}) => {
                    if (data.Error) {
                        throw new Error(data.Error);
                    }
                    return data.Code === 1000;
                });
            networkActivityTracker.track(promise);
            return promise;
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
            templateUrl: 'templates/user/humanVerification.tpl.html',
            link(scope, el, { offerType = CONSTANTS.INVITE_MAIL }) {

                const $formSMS = el[0].querySelector(SELECTOR.FORM_SMS);
                const $formEMAIL = el[0].querySelector(SELECTOR.FORM_EMAIL);
                const $btnSetup = el.find(SELECTOR.BTN_COMPLETE_SETUP);

                signupModel.getOptionsVerification(offerType)
                    .then(({ email, captcha, sms, payment }) => {
                        scope.$applyAsync(() => {
                            scope.showEmail = email;
                            scope.showCaptcha = captcha;
                            scope.showSms = sms;
                            scope.showPayment = payment;
                            scope.verificator = getVerificator(scope);
                        });
                    });


                /**
                 * @TODO RFR each form => component + model and remove facepalm boolean
                 */
                const onSubmitSMS = () => {
                    scope.$applyAsync(() => scope.smsSending = true);
                    sendVerificationCode('sms', scope.model.smsVerification)
                        .then((test = false) => {
                            signupModel.set('smsVerificationSent', test);
                            signupModel.set('verificationSent', false);
                            scope.model.smsVerificationSent = test;
                            scope.model.verificationSent = false;
                            scope.smsSending = false;
                        });
                };

                const onSubmitEmail = () => {
                    sendVerificationCode('email', scope.model.emailVerification)
                        .then((test = false) => {
                            scope.model.verificationSent = test;
                            scope.model.smsVerificationSent = false;
                            signupModel.set('smsVerificationSent', false);
                            signupModel.set('verificationSent', test);
                        });
                };

                const onClickCompleteSetup = (e) => {
                    e.preventDefault();
                    dispatch('create.account');
                };

                const unsubscribe = $rootScope.$on('payments', (e, { type, data = {} }) => {
                    if (type === 'donate.submit' && data.action === 'humanVerification') {
                        dispatch('create.account', data);
                    }
                });

                $btnSetup.on('click', onClickCompleteSetup);
                $formSMS.addEventListener('submit', onSubmitSMS);
                $formEMAIL.addEventListener('submit', onSubmitEmail);

                scope.$on('$destroy', () => {
                    $btnSetup.off('click', onClickCompleteSetup);
                    $formSMS.removeEventListener('submit', onSubmitSMS);
                    $formEMAIL.removeEventListener('submit', onSubmitEmail);
                    unsubscribe();
                });
            }
        };

    });
