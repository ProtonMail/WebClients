import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { useTheme } from '@proton/components/containers/themes/ThemeProvider';
import { useModalState } from '@proton/components/index';
import { CYCLE } from '@proton/payments';
import { usePaymentOptimistic } from '@proton/payments/ui';
import { getAppHref } from '@proton/shared/lib/apps/helper';
import type { GetActiveSessionsResult } from '@proton/shared/lib/authentication/persistedSessionHelper';
import { APPS } from '@proton/shared/lib/constants';
import { replaceUrl } from '@proton/shared/lib/helpers/browser';
import { ThemeTypes } from '@proton/shared/lib/themes/constants';

import { SignupType } from '../../../signup/interfaces';
import { type BaseSignupContextProps, SignupContextProvider, useSignup } from '../../context/SignupContext';
import getAvailablePlansWithCycles from '../../helpers/getAvailablePlansWithCycles';
import { AccessModal } from './components/AccessModal/AccessModal';
import { family, getPassPlusOfferPlan, passLifetime, passPlus, unlimited } from './plans';
import { AccountDetailsStep } from './steps/AccountDetailsStep';
import { InstallExtensionStep } from './steps/InstallExtensionStep';
import { PaymentStep } from './steps/PaymentStep';
import { RecoveryKitStep } from './steps/RecoveryKitStep';
import { UpgradePlanStep } from './steps/UpgradePlanStep';

enum Step {
    Signup = 'signup',
    RecoveryKit = 'recovery-kit',
    UpgradePlan = 'upgrade-plan',
    Payment = 'payment',
    InstallExtension = 'install-extension',
}

const PassSignup = () => {
    const signup = useSignup();
    const payments = usePaymentOptimistic();

    const [step, setStep] = useState<Step>(Step.Signup);

    useEffect(() => {
        /**
         * A limitation of the payments context initialisation means we need to
         * check the pricing with the coupon to ensure the UI data is available
         */
        void payments.checkMultiplePlans([getPassPlusOfferPlan(payments.currency)]);
    }, []);

    return (
        <main className="pass-signup flex h-full overflow-auto">
            {step === Step.Signup && (
                <AccountDetailsStep
                    onContinue={async () => {
                        await signup.createUser();
                        await signup.setupUser();
                        setStep(Step.RecoveryKit);
                    }}
                />
            )}
            {step === Step.RecoveryKit && <RecoveryKitStep onContinue={async () => setStep(Step.UpgradePlan)} />}
            {step === Step.UpgradePlan && (
                <UpgradePlanStep
                    onContinue={async (payment: boolean) => {
                        if (payment) {
                            return setStep(Step.Payment);
                        }
                        setStep(Step.InstallExtension);
                    }}
                />
            )}
            {step === Step.Payment && (
                <PaymentStep
                    onContinue={async () => {
                        await signup.setupSubscription();
                        setStep(Step.InstallExtension);
                    }}
                    onBack={() => setStep(Step.UpgradePlan)}
                />
            )}
            {step === Step.InstallExtension && (
                <InstallExtensionStep
                    onContinue={async () => {
                        await signup.login();
                    }}
                />
            )}
        </main>
    );
};

const availablePlans = getAvailablePlansWithCycles([passPlus, unlimited, family, passLifetime], [CYCLE.YEARLY]);

const PassSignupPage = (props: BaseSignupContextProps) => {
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const theme = useTheme();
    const [activeSessions, setActiveSessions] = useState<GetActiveSessionsResult>();
    const [accessModalProps, setHasAccessModal, renderAccessModal] = useModalState();

    useEffect(() => theme.setTheme(ThemeTypes.Carbon), []);

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
    );
};

export default PassSignupPage;
