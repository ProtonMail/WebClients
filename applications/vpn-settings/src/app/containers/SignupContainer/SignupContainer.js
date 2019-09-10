import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Loader, Button, Title, useLoading } from 'react-components';
import AccountStep from './AccountStep/AccountStep';
import PlanStep from './PlanStep/PlanStep';
import useSignup from './useSignup';
import { c } from 'ttag';
import VerificationStep from './VerificationStep/VerificationStep';
import PaymentStep from './PaymentStep/PaymentStep';
import { PLAN, VPN_PLANS } from './plans';
import SupportDropdown from '../../components/header/SupportDropdown';
import { CYCLE } from 'proton-shared/lib/constants';
import PlanDetails from './SelectedPlan/PlanDetails';
import PlanUpsell from './SelectedPlan/PlanUpsell';
import useVerification from './VerificationStep/useVerification';

const SignupState = {
    Plan: 'plan',
    Account: 'account',
    Verification: 'verification',
    Payment: 'payment'
};

// TODO: Flexible urls and plans for reuse between project
const SignupContainer = ({ history, onLogin, stopRedirect }) => {
    useEffect(() => {
        document.title = c('Title').t`Sign up - ProtonVPN`;
    }, []);

    const searchParams = new URLSearchParams(history.location.search);
    const [signupState, setSignupState] = useState(SignupState.Plan);
    const [upsellDone, setUpsellDone] = useState(false);
    const [loading, withLoading] = useLoading(false);
    const historyState = history.location.state || {};
    const invite = historyState.invite;
    const coupon = historyState.coupon;

    const handleLogin = (...args) => {
        stopRedirect();
        history.push('/downloads');
        onLogin(...args);
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
        appliedInvite
    } = useSignup(handleLogin, coupon, invite, {
        planName: searchParams.get('plan'),
        cycle: Number(searchParams.get('cycle')),
        currency: searchParams.get('currency')
    });
    const { verify, requestCode } = useVerification();

    const handleSelectPlan = (model, next = false) => {
        setModel(model);
        next && setSignupState(SignupState.Account);
    };

    const handleCreateAccount = async (model) => {
        setModel(model);

        if (selectedPlan.price.total > 0) {
            setSignupState(SignupState.Payment);
        } else if (appliedInvite || appliedCoupon) {
            await signup(model, { invite: appliedInvite, coupon: appliedCoupon });
        } else {
            setSignupState(SignupState.Verification);
        }
    };

    const handleVerification = async (model, code, params) => {
        const verificationToken = await verify(code, params);
        await signup(model, { verificationToken });
        setModel(model);
    };

    const handlePayment = async (model, paymentParameters) => {
        const paymentDetails = await makePayment(model, paymentParameters);
        await signup(model, { paymentDetails });
        setModel(model);
    };

    const handleUpgrade = (planName) => {
        setModel({ ...model, planName });
        setUpsellDone(true);
        if (planName !== PLAN.FREE && signupState === SignupState.Verification) {
            setSignupState(SignupState.Payment);
        } else if (planName === PLAN.FREE && signupState === SignupState.Payment) {
            setSignupState(SignupState.Verification);
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
                    disabled={loading}
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

    const prevStep = {
        [SignupState.Account]: SignupState.Plan,
        [SignupState.Payment]: SignupState.Account,
        [SignupState.Verification]: SignupState.Account
    }[signupState];

    const handleBackClick = () => {
        if (prevStep) {
            setSignupState(prevStep);
        } else {
            history.push('/');
        }
    };

    return (
        <main className="flex flex-item-fluid main-area">
            <div className="center p2 container-plans-signup onmobile-p1">
                <div className="flex flex-nowrap onmobile-flex-wrap mb1">
                    <div className="flex-item-fluid plan-back-button">
                        <Button onClick={handleBackClick}>
                            {prevStep ? c('Action').t`Back` : c('Action').t`Homepage`}
                        </Button>
                    </div>
                    <div className="onmobile-min-w100 onmobile-aligncenter onmobile-mt0-5">
                        <Title>{c('Title').t`Sign up`}</Title>
                    </div>
                    <div className="flex-item-fluid alignright plan-help-button">
                        <SupportDropdown content={c('Action').t`Need help`} />
                    </div>
                </div>
                {isLoading ? (
                    <Loader />
                ) : (
                    <>
                        {signupState === SignupState.Plan && (
                            <PlanStep
                                plans={VPN_PLANS.map((plan) => getPlanByName(plan))}
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
                                onVerify={(...rest) => withLoading(handleVerification(...rest))}
                                requestCode={requestCode}
                            >
                                {selectedPlanComponent}
                            </VerificationStep>
                        )}

                        {signupState === SignupState.Payment && (
                            <PaymentStep
                                model={model}
                                paymentAmount={selectedPlan.price.total}
                                onPay={(...rest) => withLoading(handlePayment(...rest))}
                            >
                                {selectedPlanComponent}
                            </PaymentStep>
                        )}
                    </>
                )}
            </div>
        </main>
    );
};

SignupContainer.propTypes = {
    stopRedirect: PropTypes.func.isRequired,
    onLogin: PropTypes.func.isRequired,
    history: PropTypes.shape({
        push: PropTypes.func.isRequired,
        location: PropTypes.shape({
            search: PropTypes.string.isRequired,
            state: PropTypes.oneOfType([
                PropTypes.shape({
                    selector: PropTypes.string.isRequired,
                    token: PropTypes.string.isRequired
                }),
                PropTypes.shape({
                    Coupon: PropTypes.shape({ Code: PropTypes.string })
                })
            ])
        }).isRequired
    }).isRequired
};

export default SignupContainer;
