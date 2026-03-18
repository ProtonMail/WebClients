import { useState } from 'react';
import { Redirect, useHistory, useLocation } from 'react-router-dom';

import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import { SSO_PATHS } from '@proton/shared/lib/constants';
import { useFlagsStatus } from '@proton/unleash/proxy';
import { useFlag } from '@proton/unleash/useFlag';

import { type MetaTags, useMetaTags } from '../../../../useMetaTags';
import type { ActivationFormState } from '../activation/ActivationForm';
import RecoveryConfirmation from './steps/RecoveryConfirmation';
import RecoveryEmail from './steps/RecoveryEmail';
import RecoveryVerificationCode from './steps/RecoveryVerificationCode';

export enum Steps {
    RecoveryEmail = 1,
    RecoveryOTP = 2,
    RecoveryConfirmation = 3,
}

interface RecoveryLocationState {
    reservedEmail?: string;
    activationFormState?: ActivationFormState;
}

interface RecoveryState {
    reservedEmail: string;
    parentEmail: string;
}

interface RecoveryProps {
    metaTags: MetaTags;
}

const Recovery = ({ metaTags }: RecoveryProps) => {
    useMetaTags(metaTags);
    const location = useLocation<RecoveryLocationState>();
    const history = useHistory();
    const { flagsReady } = useFlagsStatus();
    const isBornPrivateActivationRecoveryEnabled = useFlag('BornPrivateActivationRecovery');
    const initialReservedEmail = location.state?.reservedEmail || '';
    const activationFormState = location.state?.activationFormState;

    const [step, setStep] = useState<Steps>(Steps.RecoveryEmail);
    const [recoveryState, setRecoveryState] = useState<RecoveryState>({
        reservedEmail: initialReservedEmail,
        parentEmail: '',
    });

    if (!flagsReady) {
        return (
            <div className="flex items-center justify-center h-full w-full">
                <CircleLoader size="large" />
            </div>
        );
    }

    if (!isBornPrivateActivationRecoveryEnabled) {
        return <Redirect to={SSO_PATHS.LOGIN} />;
    }

    const handleContinueFromEmail = (reservedEmail: string, parentEmail: string) => {
        setRecoveryState((prev) => {
            return { ...prev, reservedEmail, parentEmail };
        });
        setStep(Steps.RecoveryOTP);
    };

    const handleContinueFromOTP = () => {
        setStep(Steps.RecoveryConfirmation);
    };

    const handleBackToEmail = () => {
        setStep(Steps.RecoveryEmail);
    };

    const handleBackToActivation = () => {
        history.push({
            pathname: SSO_PATHS.BORN_PRIVATE_ACTIVATE,
            state: { formState: activationFormState },
        });
    };

    return (
        <>
            {step === Steps.RecoveryEmail && (
                <RecoveryEmail
                    reservedEmail={recoveryState.reservedEmail}
                    onContinue={handleContinueFromEmail}
                    onBack={handleBackToActivation}
                />
            )}
            {step === Steps.RecoveryOTP && (
                <RecoveryVerificationCode
                    reservedEmail={recoveryState.reservedEmail}
                    parentEmail={recoveryState.parentEmail}
                    onContinue={handleContinueFromOTP}
                    onBack={handleBackToEmail}
                />
            )}
            {step === Steps.RecoveryConfirmation && <RecoveryConfirmation />}
        </>
    );
};

export default Recovery;
