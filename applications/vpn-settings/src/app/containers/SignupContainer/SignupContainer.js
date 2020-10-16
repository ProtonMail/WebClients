import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { Button, Title, useLoading, TextLoader, VpnLogo, Href, FullLoader, SupportDropdown } from 'react-components';
import { c } from 'ttag';
import { CYCLE } from 'proton-shared/lib/constants';
import { checkCookie } from 'proton-shared/lib/helpers/cookies';
import AccountStep from './AccountStep/AccountStep';
import PlanStep from './PlanStep/PlanStep';
import useSignup from './useSignup';
import VerificationStep from './VerificationStep/VerificationStep';
import PaymentStep from './PaymentStep/PaymentStep';
import { PLAN, VPN_PLANS, BEST_DEAL_PLANS, PLAN_BUNDLES } from './plans';
import PlanDetails from './SelectedPlan/PlanDetails';
import PlanUpsell from './SelectedPlan/PlanUpsell';
import useVerification from './VerificationStep/useVerification';
import MobileRedirectionStep from './MobileRedirectionStep/MobileRedirectionStep';
import PublicPage from '../../components/page/PublicPage';
import './SignupContainer.scss';

const SignupState = {
    Plan: 'plan',
    Account: 'account',
    Verification: 'verification',
    Payment: 'payment',
    MobileRedirection: 'mobile-redirection',
};

const BRAVE_COOKIE = '1397';
const BESTDEAL_COOKIE = 'bestdeal';

// TODO: Flexible urls and plans for reuse between project
const SignupContainer = ({ match, history, onLogin }) => {
    const searchParams = new URLSearchParams(history.location.search);
    const from = searchParams.get('from');
    const couponCode = searchParams.get('coupon');
    const currency = searchParams.get('currency');
    const billingCycle = Number(searchParams.get('billing'));

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

    const hasCookieOffer = checkCookie('offer', BESTDEAL_COOKIE) || checkCookie('offer', BRAVE_COOKIE);
    const availablePlans =
        hasCookieOffer && !redirectToMobileRef.current ? BEST_DEAL_PLANS : PLAN_BUNDLES[preSelectedPlan] || VPN_PLANS;

    useEffect(() => {
        // Always start at plans, or account if plan is preselected
        if (preSelectedPlan && from === 'pricing') {
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
        <div className="ml2 onmobile-ml0 flex-item-fluid-auto onmobile-mt2 selected-plan">
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

    const isBlackFridayCoupon = appliedCoupon && appliedCoupon.code === 'BF2019';
    const homepageUrl = isBlackFridayCoupon ? 'https://protonvpn.com/blackfriday' : 'https://protonvpn.com';

    return (
        <PublicPage title={c('Title').t`Sign up`}>
            <main className="flex flex-item-fluid main-area--noHeader main-area-content--paddingFix">
                <div className="center p2 container-plans-signup onmobile-pl1 onmobile-pr1 onmobile-pt1">
                    <div className="flex flex-nowrap flex-items-center onmobile-flex-wrap mb1">
                        <div className="flex-item-fluid plan-back-button">
                            {!creatingAccount &&
                                (signupState && signupState !== SignupState.Plan && !isBlackFridayCoupon ? (
                                    <Button onClick={() => history.goBack()}>{c('Action').t`Back`}</Button>
                                ) : (
                                    <Href className="pm-button" url={homepageUrl} target="_self">
                                        {isBlackFridayCoupon ? c('Action').t`Back` : c('Action').t`Homepage`}
                                    </Href>
                                ))}
                        </div>
                        <div className="onmobile-min-w100 onmobile-aligncenter onmobile-mt0-5">
                            <Href url={homepageUrl} target="_self" className="w150p inbl">
                                <VpnLogo className="fill-primary" />
                            </Href>
                        </div>
                        <div className="flex-item-fluid alignright plan-help-button">
                            <SupportDropdown className="inline-flex" content={c('Action').t`Need help`} />
                        </div>
                    </div>

                    <Title className="signup-title mt1-5">{c('Title').t`Sign up`}</Title>

                    {isLoading || creatingAccount ? (
                        <div className="aligncenter mt2">
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
                                    model={model}
                                    allowedMethods={signupAvailability.allowedMethods}
                                    onVerify={(...rest) => withCreateLoading(handleVerification(...rest))}
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
