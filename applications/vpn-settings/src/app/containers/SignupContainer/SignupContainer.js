import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Loader, Button, Title } from 'react-components';
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

const SignupState = {
    Plan: 'plan',
    Account: 'account',
    Verification: 'verification',
    Payment: 'payment'
};

// TODO: Flexible urls and plans for reuse between project
const SignupContainer = ({ history, onLogin }) => {
    useEffect(() => {
        document.title = c('Title').t`Sign up - ProtonVPN`;
    }, []);

    const searchParams = new URLSearchParams(history.location.search);
    const [signupState, setSignupState] = useState(SignupState.Plan);
    const historyState = history.location.state || {};
    const invite = historyState.invite;
    const coupon = historyState.coupon;

    const {
        model,
        setModel,
        signup,
        selectedPlan,
        checkPayment,
        signupAvailability,
        getPlanByName,
        isLoading,
        appliedCoupon,
        appliedInvite
    } = useSignup(onLogin, coupon, invite, {
        planName: searchParams.get('plan'),
        cycle: Number(searchParams.get('cycle')),
        currency: searchParams.get('currency')
    });

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

    const handleVerificationDone = async (model, verificationToken) => {
        setModel(model);
        await signup(model, { verificationToken });
    };

    const handlePaymentDone = async (model, paymentParameters) => {
        setModel(model);
        const paymentDetails = await checkPayment(model, paymentParameters);
        await signup(model, { paymentDetails });
    };

    const handleUpgrade = (planName) => {
        setModel({ ...model, planName });
        if (planName !== PLAN.FREE && signupState === SignupState.Verification) {
            setSignupState(SignupState.Payment);
        } else if (planName === PLAN.FREE && signupState === SignupState.Payment) {
            setSignupState(SignupState.Verification);
        }
    };

    const handleExtendCycle = () => setModel({ ...model, cycle: CYCLE.YEARLY });

    const selectedPlanComponent = (
        <div className="ml1 onmobile-ml0 onmobile-mt2 selected-plan">
            <PlanDetails selectedPlan={selectedPlan} cycle={model.cycle} currency={model.currency} />
            <PlanUpsell
                selectedPlan={selectedPlan}
                getPlanByName={getPlanByName}
                onExtendCycle={handleExtendCycle}
                onUpgrade={handleUpgrade}
                cycle={model.cycle}
                currency={model.currency}
            />
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
            <div className="center p2 container-plans-signup">
                <div className="flex flex-nowrap mb1">
                    <div className="flex-item-fluid">
                        <Button onClick={handleBackClick}>
                            {prevStep ? c('Action').t`Back` : c('Action').t`Homepage`}
                        </Button>
                    </div>
                    <div className="w">
                        <Title>{c('Title').t`Sign up`}</Title>
                    </div>
                    <div className="flex-item-fluid alignright">
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
                                onVerificationDone={handleVerificationDone}
                            >
                                {selectedPlanComponent}
                            </VerificationStep>
                        )}

                        {signupState === SignupState.Payment && (
                            <PaymentStep
                                model={model}
                                paymentAmount={selectedPlan.price.total}
                                onPaymentDone={handlePaymentDone}
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
