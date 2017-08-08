angular.module('proton.user')
    .factory('signupModel', (User, $state, $stateParams, $location, CONSTANTS) => {

        const CACHE = {};

        const get = (key, type = 'model') => {
            const item = angular.copy(CACHE[type]);
            return key ? item[key] : item;
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
            return User.create(params, get('loginPassword'));
        };

        return {
            all, get, set, store,
            getEmail, getDomain, getOptionsVerification, optionsHumanCheck,
            createUser
        };
    });
