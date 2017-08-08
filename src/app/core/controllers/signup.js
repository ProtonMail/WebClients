angular.module('proton.core')
    .controller('SignupController', (
        $location,
        $log,
        $rootScope,
        $scope,
        $state,
        $stateParams,
        $timeout,
        Address,
        authentication,
        confirmModal,
        cardModel,
        CONSTANTS,
        domains,
        gettextCatalog,
        Key,
        networkActivityTracker,
        notify,
        passwords,
        Payment,
        plans,
        pmcw,
        Reset,
        setupKeys,
        tools,
        url,
        settingsApi,
        User,
        AppModel,
        signupModel,
        paymentUtils
    ) => {
        const unsubscribe = [];

        $scope.keyPhase = CONSTANTS.KEY_PHASE;
        $scope.compatibility = tools.isCompatible();
        $scope.showFeatures = false;
        $scope.filling = true;
        $scope.payment = false;
        $scope.humanityTest = false;
        $scope.creating = false;
        $scope.genNewKeys = false;
        $scope.createUser = false;
        $scope.logUserIn = false;
        $scope.decryptAccessToken = false;
        $scope.setupAccount = false;
        $scope.getUserInfo = false;
        $scope.finishCreation = false;
        $scope.errorPay = false;
        $scope.generating = false;
        $scope.domains = _.map(domains, (value) => ({ label: value, value }));
        $scope.isFromInvitation = AppModel.is('preInvited');

        function initUsername() {
            const URLparams = $location.search();
            const { username = '' } = $stateParams;
            return URLparams.u || username; // NOTE I don't know where the "u" parameter is set
        }

        function initialization() {


            if (plans.length > 0) {
                $scope.plan = _.findWhere(plans, { Name: $stateParams.plan, Cycle: parseInt($stateParams.billing, 10), Currency: $stateParams.currency });

                const { list, selected } = paymentUtils.generateMethods({
                    Cycle: +$stateParams.billing
                });

                $scope.methods = list;
                $scope.method = selected;
            }

            $scope.account = {
                username: initUsername(), // Prepopulate the username if desired
                domain: $scope.domains[0], // Select the first domain
                codeVerification: '', // Initialize verification code
                captcha_token: false, // Initialize captcha token
                smsCodeVerification: '', // Initialize sms verification code
                emailVerification: ''
            };

            // Clear auth data
            authentication.logout(false, authentication.isLoggedIn());
        }

        $scope.createAccount = () => {
            $scope.humanityTest = false;
            $scope.creating = true;

            doCreateUser()
                .then(doLogUserIn)
                .then(doAccountSetup)
                .then(setUserLanguage)
                .then(doGetUserInfo)
                .then(finishRedirect)
                .catch((err) => {
                    let msg = err;

                    if (typeof msg !== 'string') {
                        msg = gettextCatalog.getString('Something went wrong', null, 'Error');
                    }

                    notify({ classes: 'notification-danger', message: err });
                    if (typeof err.verbose === 'undefined') {
                        $scope.signupError = true;
                    }
                });
        };

        $scope.checking = () => {
            if ($scope.account.notificationEmail) {
                saveContinue();
            } else {
                confirmModal.activate({
                    params: {
                        title: gettextCatalog.getString('Warning', null, 'Title'),
                        message: gettextCatalog.getString('Warning: You did not set a recovery email so account recovery is impossible if you forget your password. Proceed without recovery email?', null, 'Warning'),
                        confirm() {
                            saveContinue();
                            confirmModal.deactivate();
                        },
                        cancel() {
                            confirmModal.deactivate();
                            angular.element('#notificationEmail').focus();
                        }
                    }
                });
            }
        };

        function saveContinue() {
            $scope.filling = false;

            // Save variables to prevent extensions/etc
            // from modifying them during setup process
            signupModel.store($scope.account);
            signupModel.set('Type', CONSTANTS.INVITE_MAIL);

            const promise = generateNewKeys()
                .then(() => {
                    $timeout(() => {
                        $scope.genNewKeys = false;

                        if (AppModel.is('preInvited')) {
                            return $scope.createAccount();
                        }

                        if (plans.length > 0) {
                            if (signupModel.optionsHumanCheck('payment')) {
                                $scope.payment = true;
                            } else {
                                $scope.humanityTest = true;
                                const message = gettextCatalog.getString("It currently isn't possible to subscribe to a Paid ProtonMail plan.", null);
                                notify(message);
                            }
                        } else {
                            $scope.humanityTest = true;
                        }
                    }, 2000);
                });
            networkActivityTracker.track(promise);
        }

        function generateNewKeys() {

            $scope.genNewKeys = true;

            let password = signupModel.get('mailboxPassword');

            if ($scope.keyPhase > 2) {
                password = signupModel.get('loginPassword');
            }

            $log.debug('generateKeys');
            return setupKeys.generate([{
                ID: 0,
                Email: signupModel.getEmail()
            }], password)
                .then((result) => {
                // Save for later
                    $scope.setupPayload = result;
                });
        }

        // $scope.chooseCard = () => {
        $scope.choosMethod = (type) => {
            $scope.method = type;
        };

        function verify(method, amount, currency) {
            $scope.errorPay = false;
            const promise = Payment.verify({
                Username: signupModel.get('username'),
                Amount: amount,
                Currency: currency,
                Payment: method
            })
                .then(({ data = {} } = {}) => {
                    if (data.Code === 1000) {
                        signupModel.set('VerifyCode', data.VerifyCode);
                        $scope.payment = false;
                        $rootScope.tempPlan = $scope.plan; // We need to subcribe this user later
                        $rootScope.tempMethod = method; // We save this payment method to save it later
                        return $scope.createAccount();
                    }

                    $scope.errorPay = true;
                    if (data.Error) {
                        // We were unable to successfully charge your card. Please try a different card or contact your bank for assistance.
                        throw new Error(data.Error);
                    }
                });
            networkActivityTracker.track(promise);
        }

        const donate = ({ options = {} }) => {
            const { Payment, Amount, Currency } = options;
            verify(Payment, Amount, Currency);
        };

        $scope.pay = () => {
            const card = cardModel($scope.account.card);
            const method = { Type: 'card', Details: card.details() };

            verify(method, $scope.plan.Amount, $scope.plan.Currency);
        };

        $scope.onPaypalSuccess = (Details) => {
            verify({ Type: 'paypal', Details }, $scope.plan.Amount, $scope.plan.Currency);
        };

        function doCreateUser() {
            $scope.createUser = true;

            return signupModel.createUser($scope.account)
                .then((rep) => {
                // Failed Human verification
                    if (rep.data.Code === 12087) {
                        $scope.creating = false;
                        $scope.humanityTest = true;
                        const err = new Error(rep.data.Error);
                        err.verbose = false;
                        throw err;
                    }
                    return rep;
                });
        }

        function setUserLanguage(data) {
            if ($location.search().language) {
                return settingsApi.setLanguage({ Language: gettextCatalog.getCurrentLanguage() })
                    .then(() => data);
            }
            return data;
        }

        function doLogUserIn(response) {
            if (response.data && response.data.Code === 1000) {
                $scope.logUserIn = true;
                return authentication.loginWithCredentials({
                    Username: signupModel.get('username'),
                    Password: signupModel.get('loginPassword')
                })
                    .then(({ data }) => {
                        authentication.receivedCredentials(data);
                        return authentication.setAuthCookie(data);
                    })
                    .then(() => {
                        $rootScope.isLoggedIn = authentication.isLoggedIn();
                        $rootScope.isLocked = authentication.isLocked();
                        $rootScope.isSecure = authentication.isSecured();
                    });
            }

            return Promise.reject(response.data.Error);
        }

        function doAccountSetup() {
            const errorMessage = gettextCatalog.getString('Something went wrong during address creation', null, 'Error');
            $log.debug('doAccountSetup');

            $scope.setupAccount = true;

            return Address.setup({ Domain: signupModel.getDomain() })
                .then(({ data = {} } = {}) => {
                    if (data.Code === 1000) {
                        // Replace 0 with correct address ID
                        $scope.setupPayload.keys[0].AddressID = data.Address.ID;

                        return setupKeys.setup($scope.setupPayload, signupModel.get('loginPassword'))
                            .then(() => {
                                authentication.savePassword($scope.setupPayload.mailboxPassword);

                                $rootScope.isLoggedIn = authentication.isLoggedIn();
                                $rootScope.isLocked = authentication.isLocked();
                                $rootScope.isSecure = authentication.isSecured();
                            });
                    }
                    return Promise.reject({ message: data.Error || errorMessage });
                })
                .catch((error) => {
                    $state.go('login');
                    notify({ message: error.message, classes: 'notification-danger' });
                    return Promise.reject();
                });
        }

        function doGetUserInfo() {
            $log.debug('getUserInfo');
            $scope.getUserInfo = true;
            return authentication.fetchUserInfo();
        }

        function finishRedirect() {
            $log.debug('finishRedirect');
            $scope.finishCreation = true;

            if (authentication.user.Delinquent < 3) {
                $state.go('secured.inbox', { welcome: CONSTANTS.WIZARD_ENABLED });
            } else {
                $state.go('secured.dashboard');
            }
        }

        unsubscribe.push($rootScope.$on('humanVerification', (e, { type, data = {} }) => {
            if (type === 'captcha') {
                $scope.$applyAsync(() => {
                    $scope.account.captcha_token = data.token;
                });
            }
        }));

        unsubscribe.push($rootScope.$on('payments', (e, { type, data = {} }) => {
            if (type === 'create.account') {
                (data.type !== 'donation') && $scope.createAccount();
                (data.type === 'donation') && donate(data);
            }
        }));

        initialization();
    });
