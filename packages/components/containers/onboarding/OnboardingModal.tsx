import { isValidElement, useState } from 'react';

import { useWelcomeFlags } from '@proton/account';
import type { ModalSize } from '@proton/components/components/modalTwo/Modal';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import StepDot from '@proton/components/components/stepDot/StepDot';
import StepDots from '@proton/components/components/stepDots/StepDots';
import clsx from '@proton/utils/clsx';
import range from '@proton/utils/range';

import type { OnboardingStepComponent, OnboardingStepProps } from './interface';
import useGenericSteps from './useGenericSteps';

import './OnboardingModal.scss';

interface Props {
    children?: OnboardingStepComponent[];
    className?: string;
    extraProductStep?: OnboardingStepComponent[];
    genericSteps?: Partial<Record<'discoverAppsStep' | 'setupThemeStep' | 'organizationStep', OnboardingStepComponent>>;
    hideDiscoverApps?: boolean;
    /** Some onboarding modals need custom dimension / margins */
    hideOrganizationSetup?: boolean;
    modalClassname?: string;
    modalContentClassname?: string;
    onClose?: () => void;
    onDone?: () => void;
    onExit?: () => void;
    showGenericSteps?: boolean;
    size?: ModalSize;
    stepDotClassName?: string;
}

const OnboardingModal = ({
    children,
    extraProductStep,
    genericSteps,
    hideDiscoverApps = false,
    hideOrganizationSetup = false,
    modalClassname,
    modalContentClassname = 'm-8',
    onDone,
    showGenericSteps,
    size = 'small',
    stepDotClassName,
    ...rest
}: Props) => {
    const { welcomeFlags } = useWelcomeFlags();
    // Using useState so that isReplay is only updated when the modal closes, not when welcomeFlags change.
    const [isReplay] = useState(welcomeFlags.isReplay);
    let isLastStep = false;

    const [step, setStep] = useState(0);

    const handleNext = () => {
        if (isLastStep) {
            onDone?.();
            rest?.onClose?.();
            return;
        }
        setStep((step) => step + 1);
    };

    const handleBack = () => {
        setStep((step) => step - 1);
    };

    const displayGenericSteps = welcomeFlags.hasGenericWelcomeStep || isReplay || showGenericSteps;
    const genericStepsComponents = useGenericSteps({
        onNext: handleNext,
        onBack: handleBack,
        hideDiscoverApps,
        hideOrganizationSetup,
        genericSteps,
    });

    const productSteps = children
        ? (Array.isArray(children) ? children : [children]).map(
              (renderCallback) =>
                  renderCallback?.({
                      onNext: handleNext,
                      onBack: handleBack,
                      displayGenericSteps,
                  }) ?? null
          )
        : [];

    const extraSteps = extraProductStep
        ? (Array.isArray(extraProductStep) ? extraProductStep : [extraProductStep]).map(
              (renderCallback) =>
                  renderCallback?.({
                      onNext: handleNext,
                      onBack: handleBack,
                      displayGenericSteps,
                  }) ?? null
          )
        : [];

    const steps = [...productSteps, ...(displayGenericSteps ? genericStepsComponents : []), ...extraSteps].filter(
        Boolean
    );
    isLastStep = steps.length - 1 === step;
    const childStep = steps[step];
    const displayDots = steps.length > 1 && step < steps.length;

    if (!steps.length) {
        rest?.onClose?.();
    }

    if (!isValidElement<OnboardingStepProps>(childStep)) {
        throw new Error('Missing step');
    }

    return (
        <ModalTwo {...rest} size={size} className={clsx('onboarding-modal', modalClassname)}>
            <ModalTwoContent className={modalContentClassname}>
                {childStep}
                {displayDots ? (
                    <div className="text-center">
                        <StepDots value={step} ulClassName={clsx('mb-0', stepDotClassName)}>
                            {range(0, steps.length).map((index) => (
                                <StepDot
                                    active={index === step}
                                    key={index}
                                    index={index}
                                    aria-controls={`onboarding-${index}`}
                                    onClick={() => {
                                        setStep(index);
                                    }}
                                />
                            ))}
                        </StepDots>
                    </div>
                ) : null}
            </ModalTwoContent>
        </ModalTwo>
    );
};

export default OnboardingModal;
