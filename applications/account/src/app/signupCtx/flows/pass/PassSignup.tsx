import { useEffect, useId, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { useTheme } from '@proton/components/containers/themes/ThemeProvider';
import { CYCLE } from '@proton/payments';
import { getAppHref } from '@proton/shared/lib/apps/helper';
import { APPS } from '@proton/shared/lib/constants';
import { replaceUrl } from '@proton/shared/lib/helpers/browser';
import { ThemeTypes } from '@proton/shared/lib/themes/constants';

import { SignupType } from '../../../signup/interfaces';
import { type BaseSignupContextProps, SignupContextProvider } from '../../context/SignupContext';
import { AccountDetailsStep } from './steps/AccountDetailsStep';
import { InstallExtensionStep } from './steps/InstallExtensionStep';
import { PaymentStep } from './steps/PaymentStep';
import { RecoveryKitStep } from './steps/RecoveryKitStep';
import { UpgradePlanStep } from './steps/UpgradePlanStep';

export enum Step {
    Signup = 'signup',
    RecoveryKit = 'recovery-kit',
    UpgradePlan = 'upgrade-plan',
    Payment = 'payment',
    InstallExtension = 'install-extension',
}

const PassSignup = () => {
    const [step, setStep] = useState<Step>(Step.Signup);

    return (
        <main className="pass-signup h-full">
            {step === Step.Signup && <AccountDetailsStep setStep={setStep} />}
            {step === Step.RecoveryKit && <RecoveryKitStep setStep={setStep} />}
            {step === Step.UpgradePlan && <UpgradePlanStep setStep={setStep} />}
            {step === Step.Payment && <PaymentStep setStep={setStep} />}
            {step === Step.InstallExtension && <InstallExtensionStep />}
        </main>
    );
};

const PassSignupPage = (props: BaseSignupContextProps) => {
    const id = useId();
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const theme = useTheme();

    useEffect(() => theme.setTheme(ThemeTypes.Carbon), []);

    return (
        <SignupContextProvider
            {...props}
            app={APPS.PROTONPASS}
            flowId={`pass-flow-${id}`}
            onLogin={(session) => {
                const url = new URL(getAppHref('/', APPS.PROTONPASS, session.localID));
                replaceUrl(url.toString());
            }}
            paymentsDataConfig={{
                availablePlans: [],
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
