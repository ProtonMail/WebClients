import _ from 'lodash';

import { getPlansCount, getPlansMap } from '../../../helpers/paymentHelper';

/* @ngInject */
function SignupController(
    $location,
    $scope,
    $stateParams,
    authentication,
    dispatchers,
    domains,
    gettextCatalog,
    networkActivityTracker,
    notification,
    subscriptionInfo,
    PaymentCache,
    AppModel,
    giftCodeModel,
    signupModel,
    translator,
    signupUserProcess
) {
    const I18N = translator(() => ({
        validGiftCode: gettextCatalog.getString('Gift code applied', null, 'Success'),
        invalidGiftCode: gettextCatalog.getString('Invalid gift code', null, 'Error')
    }));

    const { on, unsubscribe, dispatcher } = dispatchers(['signup']);

    /**
     * Get all the necessary payment information needed.
     * @param {Array} planNames
     * @param {String} coupon
     * @param {Number} cycle
     * @param {String} currency
     * @param {String} giftCode
     * @returns {Promise}
     */
    const getPaymentInfo = async ({ planNames = [], coupon, cycle, currency, giftCode }) => {
        const plansMap = getPlansMap(await PaymentCache.plans());
        const planIds = getPlansCount(plansMap, planNames);
        const plans = planNames.map((name) => plansMap[name]);

        const payment = await PaymentCache.valid({
            PlanIDs: planIds,
            Currency: currency,
            Cycle: cycle,
            CouponCode: coupon,
            GiftCode: giftCode
        });

        return { payment, plans, planIds };
    };

    const STATE = {
        // If the user is subscribing to a plan, already make a request for the payment info so it's ready
        paymentPromise: subscriptionInfo ? getPaymentInfo(subscriptionInfo) : undefined
    };

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
        smsCodeVerification: '', // Initialize sms verification code,
        login: {
            confirmation: '',
            password: ''
        },
        confirmationType: ''
    };

    authentication.logout(false, authentication.isLoggedIn());

    const setStep = (step) => {
        $scope.$applyAsync(() => {
            $scope.step = step;
        });
    };

    const createAccount = () => {
        setStep(5);
        signupUserProcess.createAccount($scope.account);
    };

    const generateUserKeys = async () => {
        await networkActivityTracker.track(signupUserProcess.generateNewKeys());

        if (AppModel.is('preInvited')) {
            return createAccount();
        }

        // No cached payment promise means we're not trying to sign up for a paid plan.
        if (!STATE.paymentPromise) {
            return setStep(3);
        }

        if (!signupModel.optionsHumanCheck('payment')) {
            setStep(3);
            const message = gettextCatalog.getString(
                "It currently isn't possible to subscribe to a Paid ProtonMail plan.",
                null,
                'Info'
            );
            notification.info(message);
            return;
        }

        try {
            const { payment, plans, planIds } = await STATE.paymentPromise;

            delete STATE.paymentPromise;

            signupModel.set('temp.planIds', planIds);
            signupModel.set('temp.payment', payment);

            $scope.$applyAsync(() => {
                $scope.payment = payment;
                $scope.plans = plans;
                $scope.step = 4;
            });
        } catch (e) {
            delete STATE.paymentPromise;
            // If the payment call fails, go to step 3 instead.
            setStep(3);
        }
    };

    const onSubmitUserForm = (data) => {
        signupModel.store(data);
        setStep(2);
        generateUserKeys();
    };

    const onSubmitGiftCode = async (giftCode = '') => {
        if (!giftCode || !giftCodeModel.isValid(giftCode)) {
            return notification.error(I18N.invalidGiftCode);
        }

        // If already fetching, ignore
        if (STATE.paymentPromise) {
            return;
        }

        try {
            STATE.paymentPromise = getPaymentInfo({
                ...subscriptionInfo,
                giftCode
            });

            const { payment } = await networkActivityTracker.track(STATE.paymentPromise);

            if (payment.Gift) {
                notification.success(I18N.validGiftCode);
                dispatcher.signup('gift.applied', payment);
            }

            signupModel.set('temp.payment', payment);

            $scope.$applyAsync(() => {
                $scope.payment = payment;
            });
        } catch (e) {
            delete STATE.paymentPromise;
        }
    };

    function verify(options) {
        signupModel.verify(options).then(createAccount);
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

    const invalidCheckHuman = () => {
        bindStep('step', 3);
        $scope.$applyAsync(() => {
            const { smsCodeVerification, emailCodeVerification } = $scope.account;

            const value = (smsCodeVerification && 'sms') || (emailCodeVerification && 'email');
            $scope.account.confirmationType = value || '';

            // Reset to disable the submit button
            $scope.account.emailCodeVerification = '';
            $scope.account.smsCodeVerification = '';
        });
    };

    on('signup', (e, { type, data }) => {
        type === 'chech.humanity' && invalidCheckHuman();
        type === 'creating' && bindStep('step', 5);
        type === 'signup.error' && bindStep('signupError', data.value);
        type === 'goto.step' && bindStep('step', data.value);

        type === 'userform.submit' && onSubmitUserForm(data);
        type === 'humanform.submit' && createAccount(data);
        type === 'giftcode.submit' && onSubmitGiftCode(data);

        type === 'payform.submit' && verify(data);
    });

    $scope.$on('$destroy', () => {
        unsubscribe();
    });
}
export default SignupController;
