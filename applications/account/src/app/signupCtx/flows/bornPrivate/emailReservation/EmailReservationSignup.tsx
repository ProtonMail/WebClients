import { useState } from 'react';
import { Redirect, useLocation } from 'react-router-dom';

import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import type { ChallengeResult } from '@proton/components';
import { CYCLE } from '@proton/payments/core/constants';
import { APPS, SSO_PATHS } from '@proton/shared/lib/constants';
import { useFlagsStatus } from '@proton/unleash/proxy';
import { useFlag } from '@proton/unleash/useFlag';

import { SignupType } from '../../../../signup/interfaces';
import { SignupContextProvider, useSignup } from '../../../context/SignupContext';
import Confirmation from './steps/Confirmation';
import Donation from './steps/Donation';
import EmailReservation from './steps/EmailReservation';
import ParentEmail from './steps/ParentEmail';

export interface ReservedAccount {
    username: string;
    domain: string;
    payload: ChallengeResult;
}

export interface FormData {
    parentEmail: string;
    reservedAccount: ReservedAccount | null;
    activationCode: string;
}

export enum Steps {
    Reservation = 1,
    ParentEmail = 2,
    Donation = 3,
    Confirmation = 4,
}

export const TOTAL_STEPS = 3;

const EmailReservationFlow = () => {
    const [step, setStep] = useState<number>(Steps.Reservation);
    const [formData, setFormData] = useState<FormData>({
        parentEmail: '',
        reservedAccount: null,
        activationCode: '', // Essentially the user's password
    });
    const signup = useSignup();

    const onReservationContinue = async () => {
        if (await signup.accountForm.getIsValid({ passwords: false })) {
            const accountData = await signup.accountForm.getValidAccountData({ passwords: false });
            signup.submitAccountData(accountData);
            setFormData((prev) => ({
                ...prev,
                reservedAccount: {
                    username: accountData.username,
                    domain: accountData.domain,
                    payload: accountData.payload,
                },
            }));
            setStep(Steps.ParentEmail);
        }
    };

    const onParentEmailContinue = (email: string) => {
        setFormData((prev) => ({ ...prev, parentEmail: email }));
        setStep(Steps.Donation);
    };

    const onDonationContinue = (activationCode: string) => {
        setFormData((prev) => ({ ...prev, activationCode }));
        setStep(Steps.Confirmation);
    };

    const onBack = () => {
        if (step === Steps.ParentEmail) {
            setStep(Steps.Reservation);
        } else if (step === Steps.Donation) {
            setStep(Steps.ParentEmail);
        }
    };

    return (
        <>
            {step === Steps.Reservation && <EmailReservation onContinue={onReservationContinue} />}
            {step === Steps.ParentEmail && (
                <ParentEmail defaultEmail={formData.parentEmail} onBack={onBack} onContinue={onParentEmailContinue} />
            )}
            {step === Steps.Donation && formData.reservedAccount && (
                <Donation
                    formData={formData as FormData & { reservedAccount: ReservedAccount }}
                    onBack={onBack}
                    onDonationSuccess={onDonationContinue}
                />
            )}
            {step === Steps.Confirmation && formData.reservedAccount && (
                <Confirmation
                    reservedEmail={`${formData.reservedAccount.username}@${formData.reservedAccount.domain}`}
                    activationCode={formData.activationCode}
                />
            )}
        </>
    );
};

const EmailReservationSignup = () => {
    const location = useLocation();
    const { flagsReady } = useFlagsStatus();
    const isBornPrivateReservationEnabled = useFlag('BornPrivateReservation');
    const searchParams = new URLSearchParams(location.search);

    if (!flagsReady) {
        return (
            <div className="flex items-center justify-center h-full w-full">
                <CircleLoader size="large" />
            </div>
        );
    }

    if (!isBornPrivateReservationEnabled) {
        return <Redirect to={SSO_PATHS.LOGIN} />;
    }

    return (
        <SignupContextProvider
            app={APPS.PROTONMAIL}
            flowId="reservation"
            productParam={APPS.PROTONMAIL}
            paymentsDataConfig={{
                availablePlans: [],
                plan: {
                    planIDs: {}, // free only - empty planIDs means free plan
                    currency: undefined,
                    cycle: CYCLE.YEARLY, // free plans still need a cycle value
                    coupon: undefined,
                },
                telemetryContext: 'ctx-email-reservation',
            }}
            accountFormDataConfig={{
                defaultEmail: searchParams.get('email') || '',
                availableSignupTypes: new Set([SignupType.Proton]),
            }}
            // Reserved accounts cannot log in until activation is completed using the activation code.
            // Login will be enabled in a separate activation flow.
            onLogin={async () => {}}
            onStartAuth={async () => {}}
            onPreSubmit={async () => {}}
            handleLogin={async () => ({ state: 'complete' })}
            loginUrl=""
        >
            <EmailReservationFlow />
        </SignupContextProvider>
    );
};

export default EmailReservationSignup;
