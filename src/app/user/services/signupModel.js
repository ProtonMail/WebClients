angular.module('proton.user')
    .factory('signupModel', (User, $state, $stateParams, $location, CONSTANTS, Payment, networkActivityTracker, $rootScope) => {

        const CACHE = {};
        const dispatch = (type, data = {}) => $rootScope.$emit('signup', { type, data });

        const get = (key, type = 'model') => {
            const item = angular.copy(CACHE[type]);
            return key ? (item || {})[key] : item;
        };

        const clear = () => {
            _.keys(CACHE).forEach((key) => {
                delete CACHE[key];
            });
        };

        /**
         * Save variables to prevent extensions/etc
         * from modifying them during setup process
         * cf #4869
         */
        const store = (data) => (CACHE.model = angular.copy(data));
        const set = (key, value, type = 'model') => (CACHE[type][key] = angular.copy(value));

        const getEmail = () => {
            const item = get();
            return `${item.username}@${item.domain.value}`;
        };

        const getPassword = () => {
            const { login } = get();
            return login.password;
        };

        const getDomain = () => {
            const item = get('domain');
            return item.value || '';
        };

        const getOptionsVerification = (Type) => {

            if (CACHE.humanCheck) {
                return Promise.resolve(CACHE.humanCheck);
            }

            if ($stateParams.inviteToken) {
                return Promise.resolve({ invitation: true });
            }

            return User.direct(Type)
                .then(({ data = {} } = {}) => {
                    if (data.Direct === 1) {
                        return CACHE.humanCheck = {
                            email: _.contains(data.VerifyMethods, 'email'),
                            captcha: _.contains(data.VerifyMethods, 'captcha'),
                            sms: _.contains(data.VerifyMethods, 'sms'),
                            payment: _.contains(data.VerifyMethods, 'payment')
                        };
                    }

                    if (data.Code === 1000) {
                        window.location.href = CONSTANTS.INVITE_URL;
                        return data;
                    }
                    $state.go('login');
                    return data;
                });
        };

        const optionsHumanCheck = (type) => get(type, 'humanCheck');
        const all = () => CACHE;

        const createUser = (model = {}) => {
            const params = {
                Username: get('username'),
                Email: get('notificationEmail'),
                Type: get('Type'),
                Referrer: $location.search().ref
            };

            if ($stateParams.inviteToken) {
                params.Token = $stateParams.inviteSelector + ':' + $stateParams.inviteToken;
                params.TokenType = 'invite';
            } else if (angular.isDefined(model.captcha_token) && model.captcha_token !== false) {
                params.Token = model.captcha_token;
                params.TokenType = 'captcha';
            } else if (get('VerifyCode')) {
                params.Token = get('VerifyCode');
                params.TokenType = 'payment';
            } else if (get('smsVerificationSent')) {
                params.Token = model.smsCodeVerification;
                params.TokenType = 'sms';
            } else if (get('verificationSent')) {
                params.Token = model.codeVerification;
                params.TokenType = 'email';
            }
            return User.create(params, getPassword());
        };

        /*
            { Amount, Currency, Payment } === data
            $rootScope.tempPlan = $scope.plan; // We need to subcribe this user later
            $rootScope.tempMethod = data.Payment; // We save this payment method to save it later

         */
        function verify(opt, plan) {
            const promise = Payment.verify(_.extend({}, opt, { Username: get('username') }))
                .then(({ data = {} } = {}) => {
                    if (data.Code === 1000) {
                        set('VerifyCode', data.VerifyCode);
                        set('temp.plan', plan);
                        set('temp.method', opt.Payment);
                        return data;
                    }

                    if (data.Error) {
                        // We were unable to successfully charge your card. Please try a different card or contact your bank for assistance.
                        throw new Error(data.Error);
                    }
                })
                .catch((error) => {
                    dispatch('payment.verify.error', { error });
                    throw error;
                });
            networkActivityTracker.track(promise);
            return promise;
        }

        return {
            all, get, set, store, clear,
            getEmail, getDomain, getPassword,
            getOptionsVerification, optionsHumanCheck,
            createUser, verify
        };
    });
