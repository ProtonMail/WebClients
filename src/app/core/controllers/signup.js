import _ from 'lodash';

/* @ngInject */
function SignupController(
    $location,
    $scope,
    $state,
    $stateParams,
    authentication,
    dispatchers,
    domains,
    gettextCatalog,
    networkActivityTracker,
    notification,
    plans,
    AppModel,
    signupModel,
    signupUserProcess
) {
    const I18N = {
        success: gettextCatalog.getString('Gift code applied', null, 'Success')
    };

    const { on, unsubscribe } = dispatchers();

    // NOTE I don't know where the "u" parameter is set
    const initUsername = () => $location.search().u || $stateParams.username || '';

    /*
        1 === user form
        2 === keys generator
        3 === humanity test
        4 === payment
        5 === creating
     */
    $scope.step = 1;
    $scope.plans = plans;
    $scope.domains = _.map(domains, (value) => ({ label: value, value }));
    $scope.isFromInvitation = AppModel.is('preInvited');

    $scope.account = {
        username: initUsername(), // Prepopulate the username if desired
        domain: $scope.domains[0], // Select the first domain
        codeVerification: '', // Initialize verification code
        captcha_token: false, // Initialize captcha token
        smsCodeVerification: '', // Initialize sms verification code
        emailVerification: ''
    };

    authentication.logout(false, authentication.isLoggedIn());

    if (plans.length) {
        $scope.plan = _.find(plans, {
            Name: $stateParams.plan,
            Cycle: parseInt($stateParams.billing, 10),
            Currency: $stateParams.currency
        });
    }

    // Clear auth data
    const createAccount = () => {
        $scope.step = 5;
        return signupUserProcess.createAccount($scope.account);
    };

    function generateUserKeys() {
        $scope.step = 2;

        const promise = signupUserProcess.generateNewKeys().then(() => {
            $scope.$applyAsync(() => {
                if (AppModel.is('preInvited')) {
                    return createAccount();
                }

                if (plans.length) {
                    if (signupModel.optionsHumanCheck('payment')) {
                        return ($scope.step = 4);
                    }
                    $scope.step = 3;
                    const message = gettextCatalog.getString("It currently isn't possible to subscribe to a Paid ProtonMail plan.", null);
                    return notification.info(message);
                }

                $scope.step = 3;
            });
        });

        networkActivityTracker.track(promise);
    }

    function verify({ Payment, Amount, Currency, GiftCode, Credit }) {
        signupModel.verify({ Payment, Amount, Currency, GiftCode, Credit }, $scope.plan).then(createAccount);
    }

    function applyGift(opt) {
        signupModel.applyGiftCode(opt).then((data) => {
            notification.success(I18N.success);
            return data;
        });
    }

    on('payments', (e, { type, data = {} }) => {
        if (type === 'create.account') {
            data.action !== 'humanVerification' && createAccount();

            if (data.action === 'humanVerification') {
                const { Payment, Amount, Currency } = data.options;
                verify({ Payment, Amount, Currency });
            }
        }
    });

    const bindStep = (key, value) => $scope.$applyAsync(() => ($scope[key] = value));

    on('signup', (e, { type, data }) => {
        type === 'chech.humanity' && bindStep('step', 3);
        type === 'creating' && bindStep('step', 5);
        type === 'signup.error' && bindStep('signupError', data.value);
        type === 'goto.step' && bindStep('step', data.value);

        type === 'userform.submit' && generateUserKeys();
        type === 'humanform.submit' && createAccount();

        type === 'apply.gift' && applyGift(data);

        if (type === 'payform.submit') {
            const { method, Amount, Currency, GiftCode, Credit } = data.payment;
            verify({ Payment: method, Amount, Currency, GiftCode, Credit });
        }
    });

    $scope.$on('$destroy', () => {
        unsubscribe();
    });
}
export default SignupController;
