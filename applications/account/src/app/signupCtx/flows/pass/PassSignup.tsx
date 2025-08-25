import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { useTheme } from '@proton/components/containers/themes/ThemeProvider';
import { CYCLE } from '@proton/payments';
import { getAppHref } from '@proton/shared/lib/apps/helper';
import { APPS } from '@proton/shared/lib/constants';
import { replaceUrl } from '@proton/shared/lib/helpers/browser';
import { ThemeTypes } from '@proton/shared/lib/themes/constants';

import { SignupType } from '../../../signup/interfaces';
import { type BaseSignupContextProps, SignupContextProvider, useSignup } from '../../context/SignupContext';
import getAvailablePlansWithCycles from '../../helpers/getAvailablePlansWithCycles';
import { family, passLifetime, passPlus, unlimited } from './plans';
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
    const [step, setStep] = useState<Step>(Step.Signup);

    const accountCreation = async () => {
        await signup.createUser();
        await signup.setupUser();
    };

    return (
        <main className="pass-signup flex min-h-full">
            {step === Step.Signup && <AccountDetailsStep onContinue={() => setStep(Step.UpgradePlan)} />}
            {step === Step.UpgradePlan && (
                <UpgradePlanStep
                    onContinue={async (payment: boolean) => {
                        if (payment) {
                            return setStep(Step.Payment);
                        }
                        await accountCreation();
                        setStep(Step.RecoveryKit);
                    }}
                />
            )}
            {step === Step.Payment && (
                <PaymentStep
                    onContinue={async () => {
                        await accountCreation();
                        setStep(Step.RecoveryKit);
                    }}
                    onBack={() => setStep(Step.UpgradePlan)}
                />
            )}
            {step === Step.RecoveryKit && <RecoveryKitStep onContinue={() => setStep(Step.InstallExtension)} />}
            {step === Step.InstallExtension && <InstallExtensionStep />}
        </main>
    );
};

const availablePlans = getAvailablePlansWithCycles([passPlus, unlimited, family, passLifetime], [CYCLE.YEARLY]);

const PassSignupPage = (props: BaseSignupContextProps) => {
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const theme = useTheme();

    useEffect(() => theme.setTheme(ThemeTypes.Carbon), []);

    return (
        <SignupContextProvider
            {...props}
            app={APPS.PROTONPASS}
            flowId="pass-generic"
            onLogin={async (session) => {
                const url = new URL(getAppHref('/', APPS.PROTONPASS, session.localID));
                replaceUrl(url.toString());
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
        </SignupContextProvider>
    );
};

export default PassSignupPage;
