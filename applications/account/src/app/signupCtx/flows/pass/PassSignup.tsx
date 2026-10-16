import { useEffect, useRef, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';

import useModalState from '@proton/components/components/modalTwo/useModalState';
import { usePaymentOptimistic } from '@proton/payments-ui/ui/context/PaymentContextOptimistic';
import { CYCLE } from '@proton/payments/core/constants';
import { getAppHref } from '@proton/shared/lib/apps/helper';
import type { GetActiveSessionsResult } from '@proton/shared/lib/authentication/persistedSessionHelper';
import { APPS, SSO_PATHS } from '@proton/shared/lib/constants';
import { replaceUrl } from '@proton/shared/lib/helpers/browser';
import { useFlag } from '@proton/unleash/useFlag';

import { SignupType } from '../../../signup/interfaces';
import { type BaseSignupContextProps, SignupContextProvider, useSignup } from '../../context/SignupContext';
import getAvailablePlansWithCycles from '../../helpers/getAvailablePlansWithCycles';
import { AccessModal } from './components/AccessModal/AccessModal';
import { family, getPassPlusOfferPlan, passLifetime, passPlus, unlimited } from './plans';
import { AccountDetailsStep } from './steps/AccountDetailsStep';
import { CycleSelectorStep } from './steps/CycleSelectorStep';
import { InstallExtensionStep } from './steps/InstallExtensionStep';
import { PaymentStep } from './steps/PaymentStep';
import { RecoveryKitStep } from './steps/RecoveryKitStep';
import { UpgradePlanStep } from './steps/UpgradePlanStep';

enum Step {
    Signup = 'signup',
    RecoveryKit = 'recovery-kit',
    UpgradePlan = 'upgrade-plan',
    CycleSelector = 'cycle-selector',
    Payment = 'payment',
    InstallExtension = 'install-extension',
}

const PassSignup = () => {
    const signup = useSignup();
    const payments = usePaymentOptimistic();
    const history = useHistory();
    const newOnboardingFlag = useFlag('PassAccountNewOnboarding');

    const [step, setStep] = useState<Step>(Step.Signup);
    const [skippedCycle, setSkippedCycle] = useState(false);
    /** Address the account was created with: re-validating the form
     * later in the flow can return a stale value of the email field */
    const signupAddress = useRef('');

    useEffect(() => {
        /**
         * A limitation of the payments context initialisation means we need to
         * check the pricing with the coupon to ensure the UI data is available
         */
        void payments.checkMultiplePlans([getPassPlusOfferPlan(payments.selectedPlan.currency)]);
    }, [payments.selectedPlan.currency]);

    const goToOnboarding = () => {
        if (newOnboardingFlag) {
            history.replace(`${SSO_PATHS.PASS_ACCOUNT_ONBOARDING}?flow=pass_ctx_signup`, {
                email: signupAddress.current,
            });
        } else {
            setStep(Step.InstallExtension);
        }
    };

    return (
        <div className="pass-signup flex h-full overflow-auto">
            {step === Step.Signup && (
                <AccountDetailsStep
                    onContinue={async ({ email, username, domain }) => {
                        signupAddress.current = email || `${username}@${domain}`;
                        await signup.createUser();
                        await signup.setupUser();
                        setStep(Step.RecoveryKit);
                    }}
                />
            )}
            {step === Step.RecoveryKit && <RecoveryKitStep onContinue={async () => setStep(Step.UpgradePlan)} />}
            {step === Step.UpgradePlan && (
                <UpgradePlanStep
                    onContinue={async (payment: boolean, skipCycle = false) => {
                        setSkippedCycle(skipCycle);
                        if (payment) {
                            if (!skipCycle) {
                                return setStep(Step.CycleSelector);
                            }
                            return setStep(Step.Payment);
                        }
                        goToOnboarding();
                    }}
                />
            )}
            {step === Step.CycleSelector && (
                <CycleSelectorStep onContinue={() => setStep(Step.Payment)} onBack={() => setStep(Step.UpgradePlan)} />
            )}
            {step === Step.Payment && (
                <PaymentStep
                    onContinue={async () => {
                        await signup.setupSubscription();
                        goToOnboarding();
                    }}
                    onBack={() => {
                        if (!skippedCycle) {
                            return setStep(Step.CycleSelector);
                        }
                        setStep(Step.UpgradePlan);
                    }}
                />
            )}
            {step === Step.InstallExtension && (
                <InstallExtensionStep
                    onContinue={async () => {
                        await signup.login();
                    }}
                />
            )}
        </div>
    );
};

const availablePlans = getAvailablePlansWithCycles([passPlus, unlimited, family, passLifetime], [CYCLE.YEARLY]);

const PassSignupPage = (props: BaseSignupContextProps) => {
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const [activeSessions, setActiveSessions] = useState<GetActiveSessionsResult>();
    const [accessModalProps, setHasAccessModal, renderAccessModal] = useModalState();

    // check if there is an active session already
    useEffect(() => {
        void (async () => {
            const activeSessions = await props.onGetActiveSessions?.();
            setActiveSessions(activeSessions);
            if (activeSessions?.session) {
                setHasAccessModal(true);
            }
        })();
    }, []);

    const handleGoToApp = () => replaceUrl(getAppHref('', 'proton-pass', activeSessions?.session?.localID));

    return (
        <>
            <SignupContextProvider
                {...props}
                app={APPS.PROTONPASS}
                flowId="pass-generic"
                onLogin={async (session) => {
                    await props.handleLogin({ data: session, flow: 'signup', appIntent: { app: APPS.PROTONPASS } });
                }}
                paymentsDataConfig={{
                    availablePlans,
                    plan: {
                        planIDs: {}, // free only - empty planIDs means free plan
                        currency: undefined,
                        cycle: CYCLE.YEARLY, // free plans still need a cycle value
                        coupon: undefined,
                    },
                    telemetryContext: 'ctx-signup-pass',
                }}
                accountFormDataConfig={{
                    defaultEmail: searchParams.get('email') || '',
                    availableSignupTypes: new Set([SignupType.External, SignupType.Proton]),
                }}
            >
                <PassSignup />
                {renderAccessModal && (
                    <AccessModal
                        {...accessModalProps}
                        onSignOut={async () => setHasAccessModal(false)}
                        onContinue={handleGoToApp}
                    />
                )}
            </SignupContextProvider>
        </>
    );
};

export default PassSignupPage;
