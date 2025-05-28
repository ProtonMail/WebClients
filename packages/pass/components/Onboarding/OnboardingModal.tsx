import { type FC, useEffect, useState } from 'react';

import { c } from 'ttag';

import { Button, Step, Stepper } from '@proton/atoms';
import { type ModalProps, ModalTwoFooter } from '@proton/components';
import { ModalTwoContent, ModalTwoHeader } from '@proton/components';
import Icon from '@proton/components/components/icon/Icon';
import { PassIconLogo } from '@proton/pass/components/Layout/Logo/PassIconLogo';
import { PassModal } from '@proton/pass/components/Layout/Modal/PassModal';
import { wait } from '@proton/shared/lib/helpers/promise';
import clsx from '@proton/utils/clsx';
import noop from '@proton/utils/noop';

import { useOnboarding } from './OnboardingProvider';

import './OnboardingModal.scss';

export const OnboardingModal: FC<ModalProps> = ({ size = 'xlarge', ...props }) => {
    const { acknowledge, steps, markCompleted, completed } = useOnboarding();
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(Math.min(completed.length, steps.length - 1));

    const { component: Component = noop, description: Description = noop, ...currentStep } = steps[step] ?? {};

    const onComplete = () => {
        setLoading(true);
        acknowledge();
        void wait(250).then(props.onClose);
    };

    const onStep = (offset: 1 | -1) => {
        if (offset === 1) markCompleted(steps[step].key);

        const nextStep = step + offset;
        if (nextStep < steps.length) setStep(Math.max(0, nextStep));
        else onComplete();
    };

    const onContinue = () => {
        currentStep.action?.();
        onStep(1);
    };

    const backButton =
        step > 0 ? (
            <Button className="mr-auto z-1" icon pill shape="ghost" onClick={() => onStep(-1)}>
                <Icon name="arrow-left" />
            </Button>
        ) : undefined;

    useEffect(() => {
        setStep((curr) => (curr > steps.length - 1 ? steps.length - 1 : curr));
    }, [steps]);

    return (
        <PassModal
            {...props}
            onClose={props.onClose}
            size={size}
            className={clsx(
                'pass-onboarding-modal',
                currentStep.withHeader && 'pass-onboarding-modal-header-background'
            )}
        >
            <ModalTwoHeader
                actions={backButton}
                closeButtonProps={{ pill: true, icon: true }}
                title={
                    currentStep.withHeader && (
                        <div className="absolute top-0 left-custom" style={{ '--left-custom': '100px' }}>
                            <PassIconLogo />
                        </div>
                    )
                }
            />

            {steps.length > 1 && (
                <Stepper activeStep={step} className="z-1">
                    {steps.map((step) => (
                        <Step key={step.key} />
                    ))}
                </Stepper>
            )}

            <ModalTwoContent>
                {/* height accommodates largest content without layout shifts */}
                <div className="h-custom flex items-center gap-6 text-left w-full" style={{ '--h-custom': '23rem' }}>
                    <div className="flex-1">
                        {currentStep.group && (
                            <p className="text-uppercase text-sm text-bold m-0 mb-3 pass-onboarding-modal--group">
                                {currentStep.group}
                            </p>
                        )}
                        <p className="text-4xl text-bold m-0 mb-3">{currentStep.title}</p>
                        <div className="color-weak text-pre-wrap m-0">
                            <Description />
                        </div>
                    </div>

                    <div className="flex-1">
                        <Component />
                    </div>
                </div>
            </ModalTwoContent>
            <ModalTwoFooter className="mt-0">
                <div className="flex justify-end w-full">
                    {steps.length > 1 && (
                        <Button
                            className="mr-auto pass-onboarding-modal--skip"
                            pill
                            shape="ghost"
                            onClick={() => onStep(1)}
                            disabled={loading}
                        >
                            {c('Action').t`Skip`}
                        </Button>
                    )}

                    <Button
                        className={currentStep.actionClassName}
                        pill
                        shape="solid"
                        onClick={onContinue}
                        disabled={loading}
                    >
                        {currentStep.actionText ?? c('Action').t`Continue`}
                    </Button>
                </div>
            </ModalTwoFooter>
        </PassModal>
    );
};
