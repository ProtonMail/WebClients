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
    paymentPlans,
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
    $scope.domains = _.map(domains, (value) => ({ label: value, value }));
    $scope.isFromInvitation = AppModel.is('preInvited');

    $scope.account = {
        username: initUsername(), // Prepopulate the username if desired
        domain: $scope.domains[0], // Select the first domain
        emailCodeVerification: '', // Initialize verification code
        captcha_token: false, // Initialize captcha token
        smsCodeVerification: '' // Initialize sms verification code
    };

    authentication.logout(false, authentication.isLoggedIn());

    if (paymentPlans) {
        const { plans, payment } = paymentPlans;
        $scope.plans = plans;
        $scope.payment = payment;
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

                if ($scope.payment) {
                    if (signupModel.optionsHumanCheck('payment')) {
                        return ($scope.step = 4);
                    }
                    $scope.step = 3;
                    const message = gettextCatalog.getString(
                        "It currently isn't possible to subscribe to a Paid ProtonMail plan.",
                        null,
                        'Info'
                    );
                    return notification.info(message);
                }

                $scope.step = 3;
            });
        });

        networkActivityTracker.track(promise);
    }

    function verify(options) {
        signupModel.verify(options, $scope.plans, $scope.payment).then(createAccount);
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
                verify(data.options);
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

        type === 'payform.submit' && verify(data);
    });

    $scope.$on('$destroy', () => {
        unsubscribe();
    });
}
export default SignupController;
