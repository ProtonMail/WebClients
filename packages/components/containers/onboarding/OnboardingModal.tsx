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

    let childrenSteps: (JSX.Element | null)[] = [];

    const hasDisplayNameStep = welcomeFlags?.hasDisplayNameStep;

    if (hasDisplayNameStep) {
        childrenSteps = [setDisplayNameStep, accessingProtonAppsStep, manageAccountStep];
    }

    if (children) {
        childrenSteps = [
            ...childrenSteps,
            ...(Array.isArray(children) ? children : [children]).map((renderCallback) => {
                if (!renderCallback) {
                    return null;
                }

                return renderCallback({
                    onNext: handleNext,
                    onBack: handleBack,
                    onClose: rest?.onClose,
                });
            }),
        ];
    }

    const childStep = childrenSteps[step];

    if (!React.isValidElement<OnboardingStepProps>(childStep)) {
        throw new Error('Missing step');
    }

    const isLastStep = childrenSteps.length === step + 1;

    /*
     * The last step of these OnboardingModal steps is assumed to be the app-specific step
     * of the onboarding, and it is also assumed that there is only one such last app-specific step.
     * If there is only a single step prior to that there's no point in showing the dots stepper.
     * So the calculation to determine whether or not dots should display goes:
     *
     * total number of steps - 1 (last, app-specific step)
     * at least 2 left?
     * yes -> are we on the last step?
     * no -> does this onboarding-modal have the display name step?
     * yes -> dots should display
     */
    const atLeastTwoDottableSteps = childrenSteps.length - 1 >= 2;

    const dotsShouldDisplay = !isLastStep && hasDisplayNameStep && atLeastTwoDottableSteps;

    return (
        <FormModal {...rest} hasClose={false} autoFocusClose {...childStep.props}>
            <>
                {childStep}
                {dotsShouldDisplay && (
                    <StepDots className="mt2 flex flex-justify-center" onChange={handleChange} value={step}>
                        {range(0, childrenSteps.length - 1).map((index) => (
                            <StepDot key={index} aria-controls={`onboarding-${index}`} />
                        ))}
                    </StepDots>
                )}
            </>
        </FormModal>
    );
};

export default OnboardingModal;
