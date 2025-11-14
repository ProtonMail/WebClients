import { useState } from 'react';

import { APPS } from '@proton/shared/lib/constants';

import { SignupType } from '../../../signup/interfaces';
import { type BaseSignupContextProps, SignupContextProvider } from '../../context/SignupContext';
import Confirmation from './pages/Confirmation';
import EmailReservation from './pages/EmailReservation';
import Verification from './pages/Verification';

enum Step {
    Reserving = 'reserving',
    Verification = 'verification',
    Confirmation = 'confirmation',
}

const FirstEmailReservationFlow = () => {
    const [step] = useState(Step.Reserving);

    return (
        <>
            {step === 'reserving' && <EmailReservation />}

            {/* Might not need this: TBC*/}
            {step === 'verification' && <Verification />}

            {step === 'confirmation' && <Confirmation />}
        </>
    );
};

const FirstEmailReservationFlowSignup = (props: BaseSignupContextProps) => {
    return (
        <SignupContextProvider
            {...props}
            app={APPS.PROTONMAIL}
            flowId="first-email-reservation"
            paymentsDataConfig={undefined}
            onLogin={async (session) => {
                await props.handleLogin({ data: session, flow: 'signup', appIntent: { app: APPS.PROTONMAIL } });
            }}
            accountFormDataConfig={{
                defaultEmail: '',
                availableSignupTypes: new Set([SignupType.Proton]),
            }}
        >
            <FirstEmailReservationFlow />
        </SignupContextProvider>
    );
};

export default FirstEmailReservationFlowSignup;
