import { isValidElement, useState } from 'react';

import type { ModalSize } from '@proton/components/components/modalTwo/Modal';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import StepDot from '@proton/components/components/stepDot/StepDot';
import StepDots from '@proton/components/components/stepDots/StepDots';
import { updateFlags, updateWelcomeFlags } from '@proton/shared/lib/api/settings';
import clsx from '@proton/utils/clsx';
import noop from '@proton/utils/noop';
import range from '@proton/utils/range';

import { useApi, useUserSettings, useWelcomeFlags } from '../../hooks';
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
    const [userSettings] = useUserSettings();
    const api = useApi();
    const [welcomeFlags] = useWelcomeFlags();
    let isLastStep = false;

    const [step, setStep] = useState(0);

    const handleNext = () => {
        if (isLastStep) {
            if (welcomeFlags.isWelcomeFlow) {
                // Set generic welcome to true
                api(updateFlags({ Welcomed: 1 })).catch(noop);
            }
            if (!userSettings.WelcomeFlag) {
                // Set product specific welcome to true
                api(updateWelcomeFlags()).catch(noop);
            }
            onDone?.();
            rest?.onClose?.();
            return;
        }
        setStep((step) => step + 1);
    };

    const handleBack = () => {
        setStep((step) => step - 1);
    };

    const displayGenericSteps = welcomeFlags?.hasGenericWelcomeStep || showGenericSteps;
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
