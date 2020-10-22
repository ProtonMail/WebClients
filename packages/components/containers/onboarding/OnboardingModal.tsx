import React, { useEffect, useState } from 'react';
import { c } from 'ttag';
import { updateAddress } from 'proton-shared/lib/api/addresses';
import { updateWelcomeFlags } from 'proton-shared/lib/api/settings';
import { noop } from 'proton-shared/lib/helpers/function';
import { range } from 'proton-shared/lib/helpers/array';

import { StepDots, StepDot, FormModal } from '../../components';
import { useApi, useEventManager, useGetAddresses, useLoading, useUser, useWelcomeFlags } from '../../hooks';

import { OnboardingStepProps, OnboardingStepRenderCallback } from './interface';
import OnboardingSetDisplayName from './OnboardingSetDisplayName';
import OnboardingAccessingProtonApps from './OnboardingAccessingProtonApps';
import OnboardingManageAccount from './OnboardingManageAccount';
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
    const [user] = useUser();
    const [displayName, setDisplayName] = useState(user.Name || '');
    const [loadingDisplayName, withLoading] = useLoading();
    const getAddresses = useGetAddresses();
    const api = useApi();
    const { call } = useEventManager();
    const [welcomeFlags] = useWelcomeFlags();

    const handleUpdateWelcomeFlags = async () => {
        if (setWelcomeFlags) {
            return api(updateWelcomeFlags()).catch(noop);
        }
    };

    useEffect(() => {
        if (!welcomeFlags?.hasDisplayNameStep) {
            handleUpdateWelcomeFlags();
        }
    }, []);

    const [step, setStep] = useState(0);

    const handleNext = () => {
        setStep((step) => step + 1);
    };

    const handleBack = () => {
        setStep((step) => step - 1);
    };

    const handleChange = (step: number) => {
        setStep(step);
    };

    const handleSetDisplayNameNext = async () => {
        const addresses = await getAddresses();
        const firstAddress = addresses[0];
        // Should never happen.
        if (!firstAddress) {
            handleUpdateWelcomeFlags();
            handleNext();
            return;
        }
        await api(updateAddress(firstAddress.ID, { DisplayName: displayName, Signature: firstAddress.Signature }));
        await call();
        handleUpdateWelcomeFlags();
        handleNext();
    };

    const setDisplayNameStep = (
        <OnboardingStep
            title={c('Onboarding Proton').t`Welcome to privacy`}
            submit={c('Action').t`Next`}
            loading={loadingDisplayName}
            close={null}
            onSubmit={() => withLoading(handleSetDisplayNameNext())}
        >
            <OnboardingSetDisplayName id="onboarding-0" displayName={displayName} setDisplayName={setDisplayName} />
        </OnboardingStep>
    );

    const accessingProtonAppsStep = (
        <OnboardingStep
            title={c('Onboarding Proton').t`Accessing your Proton Apps`}
            submit={c('Action').t`Next`}
            close={c('Action').t`Back`}
            onSubmit={handleNext}
            onClose={handleBack}
        >
            <OnboardingAccessingProtonApps id="onboarding-1" />
        </OnboardingStep>
    );

    const manageAccountStep = (
        <OnboardingStep
            title={c('Onboarding Proton').t`Manage Your Proton Account`}
            submit={c('Action').t`Next`}
            close={c('Action').t`Back`}
            onSubmit={handleNext}
            onClose={handleBack}
        >
            <OnboardingManageAccount id="onboarding-2" />
        </OnboardingStep>
    );

    const hasDisplayNameStep = welcomeFlags?.hasDisplayNameStep;

    const genericSteps = hasDisplayNameStep ? [setDisplayNameStep, accessingProtonAppsStep, manageAccountStep] : [];

    const productSteps = children
        ? (Array.isArray(children) ? children : [children])
              .map(
                  (renderCallback) =>
                      renderCallback?.({
                          onNext: handleNext,
                          onBack: handleBack,
                          onClose: rest?.onClose,
                      }) ?? null
              )
              .filter((x) => x !== null)
        : [];

    const steps = [...genericSteps, ...productSteps];

    const childStep = steps[step];

    if (!React.isValidElement<OnboardingStepProps>(childStep)) {
        throw new Error('Missing step');
    }

    const hasDots = genericSteps.length && step < genericSteps.length;

    return (
        <FormModal {...rest} hasClose={false} autoFocusClose {...childStep.props}>
            <>
                {childStep}
                {hasDots && (
                    <StepDots className="mt2 flex flex-justify-center" onChange={handleChange} value={step}>
                        {range(0, genericSteps.length).map((index) => (
                            <StepDot key={index} aria-controls={`onboarding-${index}`} />
                        ))}
                    </StepDots>
                )}
            </>
        </FormModal>
    );
};

export default OnboardingModal;
