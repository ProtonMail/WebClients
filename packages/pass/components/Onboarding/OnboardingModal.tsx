import type { FC } from 'react';
import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import Step from '@proton/atoms/Stepper/Step';
import Stepper from '@proton/atoms/Stepper/Stepper';
import { type ModalProps, ModalTwoFooter } from '@proton/components';
import Icon from '@proton/components/components/icon/Icon';
import { ModalTwoContent, ModalTwoHeader } from '@proton/components/index';
import { PassModal } from '@proton/pass/components/Layout/Modal/PassModal';
import { wait } from '@proton/shared/lib/helpers/promise';

import { useOnboarding } from './OnboardingProvider';

import './OnboardingModal.scss';

export const OnboardingModal: FC<ModalProps> = ({ size = 'xlarge', ...props }) => {
    const { acknowledge, steps, markCompleted } = useOnboarding();
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(0);

    const currentStep = steps[step];

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
            <Button className="mr-auto" icon pill shape="ghost" onClick={() => onStep(-1)}>
                <Icon name="arrow-left" />
            </Button>
        ) : undefined;

    return (
        <PassModal {...props} onClose={props.onClose} size={size} className="pass-onboarding-modal">
            <ModalTwoHeader actions={backButton} closeButtonProps={{ pill: true, icon: true }} />

            <Stepper activeStep={step}>
                {steps.map((step) => (
                    <Step key={step.key} />
                ))}
            </Stepper>

            <ModalTwoContent>
                {/* height accommodates largest content without layout shifts */}
                <div className="h-custom flex items-center" style={{ '--h-custom': '23rem' }}>
                    <div className="flex flex-column w-full">
                        <div className="flex items-center gap-6 text-left w-full">
                            <div className="flex-1">
                                <p className="text-uppercase text-sm text-bold m-0 mb-3 pass-onboarding-modal--group">
                                    {currentStep.group}
                                </p>
                                <p className="text-4xl text-bold m-0 mb-3">{currentStep.title}</p>
                                <p className="text-weak text-pre-wrap m-0">{currentStep.description}</p>
                            </div>

                            <div className="flex-1">{currentStep.component}</div>
                        </div>
                    </div>
                </div>
            </ModalTwoContent>
            <ModalTwoFooter className="mt-0">
                <div className="flex justify-end w-full">
                    <Button
                        className="mr-auto pass-onboarding-modal--skip"
                        pill
                        shape="ghost"
                        onClick={() => onStep(1)}
                        disabled={loading}
                    >
                        {c('Action').t`Skip`}
                    </Button>

                    <Button pill shape="solid" onClick={onContinue} disabled={loading}>
                        {currentStep.actionText ?? 'Continue'}
                    </Button>
                </div>
            </ModalTwoFooter>
        </PassModal>
    );
};
