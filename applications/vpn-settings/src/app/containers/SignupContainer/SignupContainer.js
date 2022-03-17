import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import {
    Button,
    Title,
    useLoading,
    TextLoader,
    VpnLogo,
    Href,
    FullLoader,
    useApi,
    useMyLocation,
} from '@proton/components';
import { c } from 'ttag';
import { BLACK_FRIDAY, CYCLE } from '@proton/shared/lib/constants';
import { queryAvailableDomains } from '@proton/shared/lib/api/domains';
import AccountStep from './AccountStep/AccountStep';
import PlanStep from './PlanStep/PlanStep';
import useSignup from './useSignup';
import VerificationStep from './VerificationStep/VerificationStep';
import PaymentStep from './PaymentStep/PaymentStep';
import { PLAN, VPN_PLANS, PLAN_BUNDLES } from './plans';
import PlanDetails from './SelectedPlan/PlanDetails';
import PlanUpsell from './SelectedPlan/PlanUpsell';
import useVerification from './VerificationStep/useVerification';
import MobileRedirectionStep from './MobileRedirectionStep/MobileRedirectionStep';
import PublicPage from '../../components/page/PublicPage';
import './SignupContainer.scss';
import VPNSupportDropdown from '../../components/VPNSupportDropdown';

const SignupState = {
    Plan: 'plan',
    Account: 'account',
    Verification: 'verification',
    Payment: 'payment',
    MobileRedirection: 'mobile-redirection',
};

// TODO: Flexible urls and plans for reuse between project
const SignupContainer = ({ match, history, onLogin }) => {
    const searchParams = new URLSearchParams(history.location.search);
    const from = searchParams.get('from');
    const couponCode = searchParams.get('coupon');
    const currency = searchParams.get('currency');
    const billingCycle = Number(searchParams.get('billing'));
    const [myLocation] = useMyLocation();
    const defaultCountry = myLocation?.Country?.toUpperCase();

    const historyState = history.location.state || {};
    const preSelectedPlan = searchParams.get('plan') || historyState.preSelectedPlan;
    const { invite } = historyState;
    const redirectToMobileRef = useRef((from || historyState.from) === 'mobile');
    const coupon =
        historyState.coupon ||
        (couponCode && {
            code: couponCode,
            plan: preSelectedPlan,
            cycle: billingCycle,
        });

    const availablePlans = PLAN_BUNDLES[preSelectedPlan] || VPN_PLANS;

    const normalApi = useApi();
    const silentApi = (config) => normalApi({ ...config, silence: true });

    useEffect(() => {
        silentApi(queryAvailableDomains('signup'));
    }, []);

    useEffect(() => {
        // Always start at plans, or account if plan is preselected
        if (preSelectedPlan) {
            history.replace(`/signup/${SignupState.Account}`, {
                coupon,
                invite,
                preSelectedPlan,
            });
        } else {
            history.replace('/signup', {
                coupon,
                invite,
                from,
                preSelectedPlan,
            });
        }
    }, []);

    const signupState = match.params.step;
    const [upsellDone, setUpsellDone] = useState(false);
    const [creatingAccount, withCreateLoading] = useLoading(false);

    const goToStep = (step) =>
        history.push(`/signup/${step}`, {
            coupon,
            invite,
            preSelectedPlan,
        });

    const handleLogin = (data) => {
        if (redirectToMobileRef.current) {
            return goToStep(SignupState.MobileRedirection);
        }
        return onLogin({ ...data, path: '/downloads' });
    };

    const {
        model,
        setModel,
        signup,
        selectedPlan,
        makePayment,
        signupAvailability,
        getPlanByName,
        isLoading,
        appliedCoupon,
        appliedInvite,
    } = useSignup(
        handleLogin,
        { coupon, invite, availablePlans },
        {
            planName: preSelectedPlan,
            cycle: billingCycle,
            currency,
        }
    );
    const { verify, requestCode } = useVerification();

    const handleSelectPlan = (model, next = false) => {
        setModel(model);
        if (next) {
            goToStep(SignupState.Account);
        }
    };

    const handleCreateAccount = async (model) => {
        setModel(model);

        if (selectedPlan.price.total > 0) {
            goToStep(SignupState.Payment);
        } else if (appliedInvite || appliedCoupon) {
            await withCreateLoading(signup(model, { invite: appliedInvite, coupon: appliedCoupon }));
        } else {
            goToStep(SignupState.Verification);
        }
    };

    const handleVerification = async (model, code, params) => {
        const verificationToken = await verify(code, params);
        await signup(model, { verificationToken });
        setModel(model);
    };

    const handleCaptcha = async (verificationToken) => {
        await signup(model, { verificationToken });
    };

    const handlePayment = async (model, paymentParameters = {}) => {
        const paymentDetails = await makePayment(model, paymentParameters);
        await withCreateLoading(
            signup(model, {
                invite: appliedInvite,
                coupon: appliedCoupon,
                paymentDetails,
                paymentMethodType: paymentParameters.type,
            })
        );
        setModel(model);
    };

    const handleUpgrade = (planName) => {
        setModel({ ...model, planName });
        setUpsellDone(true);
        if (planName !== PLAN.FREE && signupState === SignupState.Verification) {
            goToStep(SignupState.Payment);
        } else if (planName === PLAN.FREE && signupState === SignupState.Payment) {
            goToStep(SignupState.Verification);
        }
    };

    const handleExtendCycle = () => {
        setModel({ ...model, cycle: CYCLE.YEARLY });
        setUpsellDone(true);
    };

    const selectedPlanComponent = (
        <div className="ml2 on-mobile-ml0 flex-item-fluid-auto on-mobile-mt2 selected-plan">
            <PlanDetails selectedPlan={selectedPlan} cycle={model.cycle} currency={model.currency} />
            {!upsellDone && (
                <PlanUpsell
                    selectedPlan={selectedPlan}
                    getPlanByName={getPlanByName}
                    onExtendCycle={handleExtendCycle}
                    onUpgrade={handleUpgrade}
                    cycle={model.cycle}
                    currency={model.currency}
                />
            )}
        </div>
    );

    const isBlackFridayCoupon = appliedCoupon && appliedCoupon.code === BLACK_FRIDAY.COUPON_CODE;
    const homepageUrl = isBlackFridayCoupon ? 'https://protonvpn.com/blackfriday' : 'https://protonvpn.com';

    return (
        <PublicPage title={c('Title').t`Sign up`}>
            <main className="flex flex-item-fluid main-area--no-header main-area-content--padding-fix">
                <div className="center p2 container-plans-signup on-mobile-pl1 on-mobile-pr1 on-mobile-pt1">
                    <div className="flex flex-nowrap flex-align-items-center on-mobile-flex-wrap mb1">
                        <div className="flex-item-fluid plan-back-button relative upper-layer">
                            {!creatingAccount &&
                                (signupState && signupState !== SignupState.Plan && !isBlackFridayCoupon ? (
                                    <Button onClick={() => history.goBack()}>{c('Action').t`Back`}</Button>
                                ) : (
                                    <Href className="button" url={homepageUrl} target="_self">
                                        {isBlackFridayCoupon ? c('Action').t`Back` : c('Action').t`Homepage`}
                                    </Href>
                                ))}
                        </div>
                        <div className="on-mobile-min-w100 on-mobile-text-center on-mobile-mt0-5">
                            <Href url={homepageUrl} target="_self" className="w150p inline-block">
                                <VpnLogo className="fill-primary" />
                            </Href>
                        </div>
                        <div className="flex-item-fluid text-right plan-help-button no-mobile flex flex-justify-end">
                            <VPNSupportDropdown shape="outline" />
                        </div>
                    </div>

                    <Title className="signup-title mt1-5">{c('Title').t`Sign up`}</Title>

                    {isLoading || creatingAccount ? (
                        <div className="text-center mt2">
                            <FullLoader className="color-primary" size={200} />
                            <TextLoader>
                                {isLoading ? c('Info').t`Loading` : c('Info').t`Creating your account`}
                            </TextLoader>
                        </div>
                    ) : (
                        <>
                            {(!signupState || signupState === SignupState.Plan) && (
                                <PlanStep
                                    plans={availablePlans.map((plan) => getPlanByName(plan))}
                                    model={model}
                                    onChangeCycle={(cycle) => setModel({ ...model, cycle })}
                                    onChangeCurrency={(currency) => setModel({ ...model, currency })}
                                    signupAvailability={signupAvailability}
                                    onSelectPlan={handleSelectPlan}
                                />
                            )}
                            {signupState === SignupState.Account && (
                                <AccountStep model={model} onContinue={handleCreateAccount}>
                                    {selectedPlanComponent}
                                </AccountStep>
                            )}
                            {signupState === SignupState.Verification && (
                                <VerificationStep
                                    defaultCountry={defaultCountry}
                                    model={model}
                                    allowedMethods={signupAvailability.allowedMethods}
                                    onVerify={(...rest) => withCreateLoading(handleVerification(...rest))}
                                    onCaptcha={handleCaptcha}
                                    requestCode={requestCode}
                                >
                                    {selectedPlanComponent}
                                </VerificationStep>
                            )}
                            {signupState === SignupState.Payment && (
                                <PaymentStep
                                    model={model}
                                    paymentAmount={selectedPlan.price.total}
                                    onPay={handlePayment}
                                >
                                    {selectedPlanComponent}
                                </PaymentStep>
                            )}
                            {signupState === SignupState.MobileRedirection && <MobileRedirectionStep model={model} />}
                        </>
                    )}
                </div>
            </main>
        </PublicPage>
    );
};

SignupContainer.propTypes = {
    onLogin: PropTypes.func.isRequired,
    match: PropTypes.shape({
        params: PropTypes.shape({
            step: PropTypes.string,
        }),
    }).isRequired,
    history: PropTypes.shape({
        push: PropTypes.func.isRequired,
        goBack: PropTypes.func.isRequired,
        replace: PropTypes.func.isRequired,
        location: PropTypes.shape({
            search: PropTypes.string.isRequired,
            state: PropTypes.oneOfType([
                PropTypes.shape({
                    selector: PropTypes.string.isRequired,
                    token: PropTypes.string.isRequired,
                }),
                PropTypes.shape({
                    Coupon: PropTypes.shape({ Code: PropTypes.string }),
                }),
            ]),
        }).isRequired,
    }).isRequired,
};

export default SignupContainer;
