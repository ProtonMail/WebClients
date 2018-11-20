import _ from 'lodash';
import { INVITE_URL } from '../../constants';

/* @ngInject */
function signupModel(User, $state, $stateParams, $location, dispatchers, Payment, networkActivityTracker) {
    const CACHE = {};
    const { dispatcher } = dispatchers(['signup']);
    const dispatch = (type, data = {}) => dispatcher.signup(type, data);

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
                    return (CACHE.humanCheck = {
                        email: _.includes(data.VerifyMethods, 'email'),
                        captcha: _.includes(data.VerifyMethods, 'captcha'),
                        sms: _.includes(data.VerifyMethods, 'sms'),
                        payment: _.includes(data.VerifyMethods, 'payment')
                    });
                }

                window.location.href = INVITE_URL;
                return data;
            })
            .catch((err) => {
                $state.go('login');
                throw err;
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
        } else if (get('emailVerificationSent')) {
            params.Token = model.emailCodeVerification;
            params.TokenType = 'email';
        }
        return User.create(params, getPassword());
    };

    /*
            { Amount, Currency, Payment } === data
            $rootScope.tempPlan = $scope.plan; // We need to subcribe this user later
            $rootScope.tempMethod = data.Payment; // We save this payment method to save it later

         */
    function verify(opt, plans, payment) {
        const promise = Payment.verify({ ...opt, Username: get('username') })
            .then(({ VerifyCode }) => {
                set('VerifyCode', VerifyCode);
                set('temp.plans', plans);
                set('temp.payment', payment);
                set('temp.method', opt.Payment);
            })
            .catch(({ data = {} } = {}) => {
                // We were unable to successfully charge your card. Please try a different card or contact your bank for assistance.
                if (data.Error) {
                    dispatch('payment.verify.error', { error: data.Error });
                    throw new Error(data.Error);
                }
            });

        networkActivityTracker.track(promise);

        return promise;
    }

    function applyGiftCode(opt) {
        const promise = Payment.validateVerify(_.extend({}, opt, { Username: get('username') })).then(
            ({ data = {} } = {}) => {
                dispatch('gift.applied', data);
                return data;
            }
        );

        networkActivityTracker.track(promise);

        return promise;
    }

    return {
        all,
        get,
        set,
        store,
        clear,
        getEmail,
        getDomain,
        getPassword,
        getOptionsVerification,
        optionsHumanCheck,
        createUser,
        verify,
        applyGiftCode
    };
}
export default signupModel;
