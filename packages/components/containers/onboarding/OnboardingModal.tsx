import React, { useEffect, useState } from 'react';
import { c } from 'ttag';
import { updateAddress } from 'proton-shared/lib/api/addresses';
import { updateWelcomeFlags } from 'proton-shared/lib/api/settings';
import { noop } from 'proton-shared/lib/helpers/function';
import { range } from 'proton-shared/lib/helpers/array';

import { StepDots, StepDot, FormModal, Button, PrimaryButton } from '../../components';
import { useApi, useEventManager, useGetAddresses, useLoading, useUser, useWelcomeFlags } from '../../hooks';

import { OnboardingStepProps, OnboardingStepRenderCallback } from './interface';
import OnboardingSetDisplayName from './OnboardingSetDisplayName';
import OnboardingAccessingProtonApps from './OnboardingAccessingProtonApps';
import OnboardingManageAccount from './OnboardingManageAccount';
import OnboardingStep from './OnboardingStep';

interface Props {
    title?: string;
    isLoading?: boolean;
    hasClose?: boolean;
    close?: React.ReactNode;
    submit?: string;
    onSubmit?: () => void;
    onClose?: () => void;
    children?: ((props: OnboardingStepRenderCallback) => JSX.Element)[];
    setWelcomeFlags?: boolean;
    showGenericSteps?: boolean;
    allowClose?: boolean;
    hideDisplayName?: boolean;
}

const OnboardingModal = ({
    children,
    showGenericSteps,
    allowClose = false,
    hideDisplayName,
    setWelcomeFlags = true,
    ...rest
}: Props) => {
    const [user] = useUser();
    const [displayName, setDisplayName] = useState(user.DisplayName || user.Name || '');
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
            onSubmit={hideDisplayName ? handleNext : () => withLoading(handleSetDisplayNameNext())}
        >
            <OnboardingSetDisplayName
                id="onboarding-0"
                displayName={displayName}
                setDisplayName={setDisplayName}
                hideDisplayName={hideDisplayName}
            />
        </OnboardingStep>
    );

    const accessingProtonAppsStep = (
        <OnboardingStep
            title={c('Onboarding Proton').t`Accessing your Proton Apps`}
            submit={c('Action').t`Next`}
            close={c('Action').t`Back`}
            onSubmit={handleNext}
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
        >
            <OnboardingManageAccount id="onboarding-2" />
        </OnboardingStep>
    );

    const hasDisplayNameStep = welcomeFlags?.hasDisplayNameStep;

    const displayGenericSteps = showGenericSteps || hasDisplayNameStep;

    const genericSteps = displayGenericSteps ? [setDisplayNameStep, accessingProtonAppsStep, manageAccountStep] : [];

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

    const hasDots = genericSteps.length > 0 && step < genericSteps.length;

    const isLastStep = steps.length - 1 === step;

    const childStepProps =
        isLastStep && productSteps.length === 0
            ? {
                  ...childStep.props,
                  submit: c('Action').t`Done`,
                  onSubmit: rest?.onClose,
              }
            : childStep.props;

    return (
        <FormModal
            {...rest}
            hasClose={allowClose}
            {...childStepProps}
            footer={
                <>
                    {typeof childStep.props.close === 'string' ? (
                        <Button disabled={childStep.props.loading} onClick={childStep.props.onClose || handleBack}>
                            {childStepProps.close}
                        </Button>
                    ) : (
                        childStep.props.close
                    )}

                    {hasDots && (
                        <StepDots
                            className="absolute centered-absolute-horizontal"
                            onChange={handleChange}
                            value={step}
                        >
                            {range(0, genericSteps.length).map((index) => (
                                <StepDot key={index} aria-controls={`onboarding-${index}`} />
                            ))}
                        </StepDots>
                    )}

                    {typeof childStep.props.submit === 'string' ? (
                        <PrimaryButton loading={childStep.props.loading} type="submit" className="mlauto">
                            {childStepProps.submit}
                        </PrimaryButton>
                    ) : (
                        childStep.props.submit
                    )}
                </>
            }
        >
            {childStep}
        </FormModal>
    );
};

export default OnboardingModal;
