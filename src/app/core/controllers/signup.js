angular.module('proton.core')
    .controller('SignupController', (
        $location,
        $rootScope,
        $scope,
        $state,
        $stateParams,
        authentication,
        domains,
        gettextCatalog,
        networkActivityTracker,
        notification,
        plans,
        AppModel,
        signupModel,
        signupUserProcess
    ) => {
        const unsubscribe = [];

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
            $scope.plan = _.findWhere(plans, {
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

            const promise = signupUserProcess.generateNewKeys()
                .then(() => {

                    if (AppModel.is('preInvited')) {
                        return createAccount();
                    }

                    if (plans.length) {
                        if (signupModel.optionsHumanCheck('payment')) {
                            return $scope.step = 4;
                        }
                        $scope.step = 3;
                        const message = gettextCatalog.getString("It currently isn't possible to subscribe to a Paid ProtonMail plan.", null);
                        return notification.info(message);
                    }

                    $scope.step = 3;
                });

            networkActivityTracker.track(promise);
        }

        function verify(Payment, Amount, Currency) {
            signupModel.verify({ Payment, Amount, Currency }, $scope.plan)
                .then(createAccount);
        }

        unsubscribe.push($rootScope.$on('payments', (e, { type, data = {} }) => {
            if (type === 'create.account') {
                (data.action !== 'humanVerification') && createAccount();

                if (data.action === 'humanVerification') {
                    const { Payment, Amount, Currency } = data.options;
                    verify(Payment, Amount, Currency);
                }
            }
        }));

        const bindStep = (key, value) => $scope.$applyAsync(() => $scope[key] = value);
        unsubscribe.push($rootScope.$on('signup', (e, { type, data }) => {
            (type === 'chech.humanity') && bindStep('step', 3);
            (type === 'creating') && bindStep('step', 5);
            (type === 'signup.error') && bindStep('signupError', data.value);
            (type === 'goto.step') && bindStep('step', data.value);

            (type === 'userform.submit') && generateUserKeys();
            (type === 'humanform.submit') && createAccount();

            if (type === 'payform.submit') {
                const { method, Amount, Currency } = data.payment;
                verify(method, Amount, Currency);
            }
        }));

        $scope.$on('$destroy', () => {
            unsubscribe.forEach((cb) => cb());
            unsubscribe.length = 0;
        });

    });
