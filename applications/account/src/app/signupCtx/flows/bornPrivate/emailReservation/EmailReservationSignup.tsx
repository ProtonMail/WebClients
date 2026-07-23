import { useState } from 'react';
import { useLocation } from 'react-router-dom';

import { CYCLE } from '@proton/payments/core/constants';
import { APPS } from '@proton/shared/lib/constants';

import bornPrivatePage from '../../../../../pages/born-private';
import { SignupType } from '../../../../signup/interfaces';
import { useMetaTags } from '../../../../useMetaTags';
import { SignupContextProvider, useSignup } from '../../../context/SignupContext';
import { type FormData, type ReservedAccount, Steps } from './interface';
import Confirmation from './steps/Confirmation';
import Donation from './steps/Donation';
import EmailReservation from './steps/EmailReservation';
import ParentEmail from './steps/ParentEmail';

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
    useMetaTags(bornPrivatePage());
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);

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
            onLogin={async () => { }}
            onStartAuth={async () => { }}
            onPreSubmit={async () => { }}
            handleLogin={async () => ({ state: 'complete' })}
            loginUrl=""
        >
            <EmailReservationFlow />
        </SignupContextProvider>
    );
};

export default EmailReservationSignup;
