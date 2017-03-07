angular.module('proton.core')
.controller('SignupController', (
    $http,
    $httpParamSerializer,
    $location,
    $log,
    $q,
    $rootScope,
    $scope,
    $state,
    $stateParams,
    $timeout,
    $window,
    Address,
    authentication,
    confirmModal,
    CONSTANTS,
    direct,
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
    User
) => {
    let childWindow;
    let accountCopy;
    const currentYear = new Date().getFullYear();
    // Change this to our captcha key, configurable in Angular?
    const captchaMessage = {
        type: 'pm_captcha',
        language: 'en',
        key: '6LcWsBUTAAAAAOkRfBk-EXkGzOfcSz3CzvYbxfTn'
    };
    $scope.keyPhase = CONSTANTS.KEY_PHASE;
    $scope.card = {};
    $scope.donationCard = {};
    $scope.donationCurrencies = [
        { label: 'USD', value: 'USD' },
        { label: 'EUR', value: 'EUR' },
        { label: 'CHF', value: 'CHF' }
    ];
    $scope.donationDetails = { amount: 5, currency: $scope.donationCurrencies[1] };
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
    $scope.verifyCode = false;
    $scope.errorPay = false;
    $scope.approvalURL = false;
    $scope.generating = false;
    $scope.paypalNetworkError = false;
    $scope.maxPW = CONSTANTS.LOGIN_PW_MAX_LEN;
    $scope.method = 'card';
    $scope.months = _.range(1, 13);
    $scope.years = _.range(currentYear, currentYear + 12);
    $scope.domains = _.map(domains, (domain) => ({ label: domain, value: domain }));
    $scope.signup = { verificationSent: false, smsVerificationSent: false };

    // FIX ME - Bart. Jan 18, 2016. Mon 2:29 PM.
    function captchaReceiveMessage(event) {
        if (typeof event.origin === 'undefined' && typeof event.originalEvent.origin === 'undefined') {
            return;
        }

        // For Chrome, the origin property is in the event.originalEvent object.
        const origin = event.origin || event.originalEvent.origin;

        // Change window.location.origin to wherever this is hosted ( 'https://secure.protonmail.com:443' )
        if (origin !== 'https://secure.protonmail.com') {
            return;
        }

        const data = event.data;

        if (data.type === 'pm_captcha') {
            $scope.$applyAsync(() => {
                $scope.account.captcha_token = data.token;
            });
        }

        if (data.type === 'pm_height') {
            $('#pm_captcha').height(event.data.height + 40);
        }
    }

    function initUsername() {
        const URLparams = $location.search();
        const { username = '' } = $stateParams;
        return URLparams.u || username; // NOTE I don't know where the "u" parameter is set
    }

    function initialization() {
        // direct comes from the resolve in route, sometimes
        if (direct) {
            const { VerifyMethods = [] } = direct;
            // determine what activation methods to show
            $scope.showEmail = _.contains(VerifyMethods, 'email');
            $scope.showCaptcha = _.contains(VerifyMethods, 'captcha');
            $scope.showSms = _.contains(VerifyMethods, 'sms');
            $scope.showPayment = _.contains(VerifyMethods, 'payment');
        }

        if (plans.length > 0) {
            $scope.plan = _.findWhere(plans, { Name: $stateParams.plan, Cycle: parseInt($stateParams.billing, 10), Currency: $stateParams.currency });
            $scope.paypalSupport = parseInt($stateParams.billing, 10) === 12 && !tools.isIE11;  // IE11 doesn't support PayPal
        }

        $scope.account = {
            username: initUsername(), // Prepoppulate the username if from an invite link
            domain: $scope.domains[0], // Select the first domain
            codeVerification: '', // Initialize verification code
            captcha_token: false, // Initialize captcha token
            smsCodeVerification: '', // Initialize sms verification code
            emailVerification: ''
        };

        $scope.readOnlyUsername = $scope.account.username.length > 0; // username is initialize by signupModel

        // Clear auth data
        authentication.logout(false, authentication.isLoggedIn());

        // Captcha
        window.addEventListener('message', captchaReceiveMessage, false);

        // Change window.location.origin to wherever this is hosted ( 'https://secure.protonmail.com:443' )
        window.captchaSendMessage = () => {
            const iframe = document.getElementById('pm_captcha');
            iframe.contentWindow.postMessage(captchaMessage, 'https://secure.protonmail.com');
        };
    }

    $scope.initHumanityTest = () => {
        if ($scope.showCaptcha) {
            $scope.verificator = 'captcha';
            $scope.setIframeSrc();
        } else if ($scope.showEmail) {
            $scope.verificator = 'email';
        } else if ($scope.showSms) {
            $scope.verificator = 'sms';
        }
    };

    $scope.setIframeSrc = () => {
        const iframe = document.getElementById('pm_captcha');
        const parameters = $httpParamSerializer({ token: 'signup', client: 'web', host: url.host() });
        iframe.onload = window.captchaSendMessage;
        iframe.src = 'https://secure.protonmail.com/captcha/captcha.html?' + parameters;
    };

    $scope.sendVerificationCode = () => {
        const promise = User.code({
            Username: accountCopy.username,
            Type: 'email',
            Destination: { Address: $scope.account.emailVerification }
        }).then(({ data = {} } = {}) => {
            if (data.Error) {
                throw new Error(data.Error);
            }
            if (data.Code === 1000) {
                $scope.signup.verificationSent = true;
            }
        });
        networkActivityTracker.track(promise);
    };

    $scope.sendSmsVerificationCode = () => {
        $scope.smsSending = true;
        const promise = User.code({
            Username: accountCopy.username,
            Type: 'sms',
            Destination: { Phone: $scope.account.smsVerification }
        }).then(({ data = {} } = {}) => {
            $scope.smsSending = false;
            if (data.Error) {
                throw new Error(data.Error);
            }
            if (data.Code === 1000) {
                $scope.signup.smsVerificationSent = true;
            }
        });
        networkActivityTracker.track(promise);
    };

    $scope.createAccount = () => {
        $scope.humanityTest = false;
        $scope.creating = true;

        doCreateUser()
        .then(doLogUserIn)
        .then(doAccountSetup)
        .then(doGetUserInfo)
        .then(finishRedirect)
        .catch((err) => {
            let msg = err;

            if (typeof msg !== 'string') {
                msg = gettextCatalog.getString('Something went wrong', null, 'Error');
            }

            notify({ classes: 'notification-danger', message: err });
            $scope.signupError = true;
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
        accountCopy = angular.copy($scope.account);

        networkActivityTracker.track(
            generateNewKeys()
            .then(() => {
                $timeout(() => {
                    $scope.genNewKeys = false;

                    if ($rootScope.preInvited) {
                        $scope.createAccount();
                    } else if (plans.length > 0) {
                        if ($scope.showPayment) {
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
            })
        );
    }

    function generateNewKeys() {

        $scope.genNewKeys = true;

        let mbpw = accountCopy.mailboxPassword;

        if ($scope.keyPhase > 2) {
            mbpw = accountCopy.loginPassword;
        }

        $log.debug('generateKeys');

        const email = accountCopy.username + '@' + accountCopy.domain.value;
        return setupKeys.generate([{ ID: 0, Email: email }], mbpw)
        .then((result) => {
            // Save for later
            $scope.setupPayload = result;
        });
    }

    $scope.chooseCard = () => {
        $scope.method = 'card';
    };

    $scope.choosePaypal = () => {
        $scope.method = 'paypal';

        if ($scope.approvalURL === false) {
            $scope.initPaypal();
        }
    };

    $scope.initPaypal = () => {
        $scope.paypalNetworkError = false;

        Payment.paypal({
            Amount: $scope.plan.Amount,
            Currency: $scope.plan.Currency
        }).then((result) => {
            if (result.data && result.data.Code === 1000) {
                if (result.data.ApprovalURL) {
                    $scope.approvalURL = result.data.ApprovalURL;
                }
            } else if (result.data.Code === 22802) {
                $scope.paypalNetworkError = true;
            } else if (result.data && result.data.Error) {
                notify({ message: result.data.Error, classes: 'notification-danger' });
            }
        });
    };

    function verify(method, amount, currency) {
        $scope.errorPay = false;

        networkActivityTracker.track(
            Payment.verify({
                Username: accountCopy.username,
                Amount: amount,
                Currency: currency,
                Payment: method
            })
            .then((result) => {
                if (result.data && result.data.Code === 1000) {
                    $scope.verifyCode = result.data.VerifyCode;
                    $scope.payment = false;
                    $rootScope.tempPlan = $scope.plan; // We need to subcribe this user later
                    $rootScope.tempMethod = method; // We save this payment method to save it later
                    $scope.createAccount();
                } else if (result.data && result.data.Error) {
                    notify({ message: result.data.Error, classes: 'notification-danger' }); // We were unable to successfully charge your card. Please try a different card or contact your bank for assistance.
                    $scope.errorPay = true;
                } else {
                    $scope.errorPay = true;
                }
            })
        );
    }

    $scope.selectAmount = (amount) => {
        $scope.donationDetails.otherAmount = null;
        $scope.donationDetails.amount = amount;
    };

    $scope.onFocusOtherAmount = () => {
        $scope.donationDetails.amount = null;
    };

    $scope.donate = () => {
        const { number, month, year, fullname, cvc, zip } = $scope.donationCard;
        const country = $scope.donationCard.country.value;
        const amount = ($scope.donationDetails.otherAmount || $scope.donationDetails.amount) * 100; // Don't be afraid
        const currency = $scope.donationDetails.currency.value;
        const method = {
            Type: 'card',
            Details: {
                Number: number,
                ExpMonth: month,
                ExpYear: (year.length === 2) ? '20' + year : year,
                CVC: cvc,
                Name: fullname,
                Country: country,
                ZIP: zip
            }
        };
        verify(method, amount, currency);
    };

    function receivePaypalMessage(event) {
        const origin = event.origin || event.originalEvent.origin; // For Chrome, the origin property is in the event.originalEvent object.

        if (origin !== 'https://secure.protonmail.com') {
            return;
        }

        const paypalObject = event.data;

        // we need to capitalize some stuff
        if (paypalObject.payerID && paypalObject.paymentID) {
            paypalObject.PayerID = paypalObject.payerID;
            paypalObject.PaymentID = paypalObject.paymentID;

            // delete unused
            delete paypalObject.payerID;
            delete paypalObject.paymentID;
        }

        const method = { Type: 'paypal', Details: paypalObject };

        verify(method, $scope.plan.Amount, $scope.plan.Currency);
        childWindow.close();
        window.removeEventListener('message', receivePaypalMessage, false);
    }

    $scope.openPaypalTab = () => {
        childWindow = window.open($scope.approvalURL, 'PayPal');
        window.addEventListener('message', receivePaypalMessage, false);
    };

    $scope.pay = () => {
        const { number, month, year, fullname, cvc, zip } = $scope.card;
        const country = $scope.card.country.value;
        const method = {
            Type: 'card',
            Details: {
                Number: number,
                ExpMonth: month,
                ExpYear: (year.length === 2) ? '20' + year : year,
                CVC: cvc,
                Name: fullname,
                Country: country,
                ZIP: zip
            }
        };

        verify(method, $scope.plan.Amount, $scope.plan.Currency);
    };

    function doCreateUser() {
        $scope.createUser = true;

        const params = {
            Username: accountCopy.username,
            Email: accountCopy.notificationEmail,
            Referrer: $location.search().ref
        };

        if ($stateParams.inviteToken) {
            params.Token = $stateParams.inviteToken;
            params.TokenType = 'invite';
        } else if (angular.isDefined($scope.account.captcha_token) && $scope.account.captcha_token !== false) {
            params.Token = $scope.account.captcha_token;
            params.TokenType = 'captcha';
        } else if ($scope.verifyCode) {
            params.Token = $scope.verifyCode;
            params.TokenType = 'payment';
        } else if ($scope.signup.smsVerificationSent !== false) {
            params.Token = $scope.account.smsCodeVerification;
            params.TokenType = 'sms';
        } else if ($scope.signup.verificationSent !== false) {
            params.Token = $scope.account.codeVerification;
            params.TokenType = 'email';
        }

        return User.create(params, accountCopy.loginPassword);
    }

    function doLogUserIn(response) {
        if (response.data && response.data.Code === 1000) {
            $scope.logUserIn = true;
            return authentication.loginWithCredentials({
                Username: accountCopy.username,
                Password: accountCopy.loginPassword
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

        return Address.setup({ Domain: accountCopy.domain.value })
        .then(({ data = {} } = {}) => {
            if (data.Code === 1000) {
                // Replace 0 with correct address ID
                $scope.setupPayload.keys[0].AddressID = data.Address.ID;

                return setupKeys.setup($scope.setupPayload, accountCopy.loginPassword)
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

    initialization();
});
