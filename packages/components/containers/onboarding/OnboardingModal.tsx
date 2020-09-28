import React, { useEffect, useState } from 'react';
import { c } from 'ttag';
import { updateAddress } from 'proton-shared/lib/api/addresses';
import { updateWelcomeFlags } from 'proton-shared/lib/api/settings';
import { noop } from 'proton-shared/lib/helpers/function';

import { FormModal } from '../../components';
import { useApi, useEventManager, useGetAddresses, useLoading, useWelcomeFlags } from '../../hooks';

import { OnboardingStepProps, OnboardingStepRenderCallback } from './interface';
import OnboardingSetDisplayName from './OnboardingSetDisplayName';
import OnboardingStep from './OnboardingStep';

interface Props {
    title: string;
    isLoading?: boolean;
    hasClose?: boolean;
    close?: React.ReactNode;
    submit?: string;
    onSubmit?: () => void;
    onClose?: () => void;
    children?: ((props: OnboardingStepRenderCallback) => JSX.Element)[];
    setWelcomeFlags?: boolean;
}

const OnboardingModal = ({ children, setWelcomeFlags = true, ...rest }: Props) => {
    const [displayName, setDisplayName] = useState('');
    const [loadingDisplayName, withLoading] = useLoading();
    const getAddresses = useGetAddresses();
    const api = useApi();
    const { call } = useEventManager();
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [welcomeFlags] = useWelcomeFlags();

    const displayNameError = !displayName ? c('Signup error').t`This field is required` : '';

    const handleUpdateWelcomeFlags = async () => {
        if (setWelcomeFlags) {
            return api(updateWelcomeFlags()).catch(noop);
        }
    };

    useEffect(() => {
        if (!welcomeFlags?.hasDisplayNameStep && setWelcomeFlags) {
            handleUpdateWelcomeFlags();
        }
    }, []);

    const setDisplayNameStep = ({ onNext }: OnboardingStepRenderCallback) => {
        const handleNext = async () => {
            setIsSubmitted(true);
            if (displayNameError) {
                return;
            }
            const addresses = await getAddresses();
            const firstAddress = addresses[0];
            // Should never happen.
            if (!firstAddress) {
                handleUpdateWelcomeFlags();
                onNext();
                return;
            }
            await api(updateAddress(firstAddress.ID, { DisplayName: displayName, Signature: firstAddress.Signature }));
            await call();
            handleUpdateWelcomeFlags();
            onNext();
        };
        return (
            <OnboardingStep
                title={c('Onboarding Proton').t`Welcome to privacy`}
                submit={c('Action').t`Next`}
                loading={loadingDisplayName}
                close={null}
                onSubmit={() => withLoading(handleNext())}
            >
                <OnboardingSetDisplayName
                    isSubmitted={isSubmitted}
                    displayNameError={displayNameError}
                    displayName={displayName}
                    setDisplayName={setDisplayName}
                />
            </OnboardingStep>
        );
    };

    const [step, setStep] = useState(0);
    const handleNext = () => {
        setStep((step) => step + 1);
    };

    const childrenSteps = [
        welcomeFlags?.hasDisplayNameStep ? setDisplayNameStep : null,
        ...(Array.isArray(children) ? children : [children]),
    ]
        .map((renderCallback) => {
            if (!renderCallback) {
                return null;
            }
            return renderCallback({
                onNext: handleNext,
                onClose: rest?.onClose,
            });
        })
        .filter((x) => x !== null);

    const childStep = childrenSteps[step];

    if (!React.isValidElement<OnboardingStepProps>(childStep)) {
        throw new Error('Missing step');
    }

    return (
        <FormModal {...rest} hasClose={false} autoFocusClose={false} {...childStep.props}>
            {childStep}
        </FormModal>
    );
};

export default OnboardingModal;
