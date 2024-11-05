import type { FC, ReactNode } from 'react';
import { useMemo, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import Step from '@proton/atoms/Stepper/Step';
import Stepper from '@proton/atoms/Stepper/Stepper';
import { type ModalProps, ModalTwoFooter } from '@proton/components';
import Icon from '@proton/components/components/icon/Icon';
import { ModalTwoContent, ModalTwoHeader } from '@proton/components/index';
import onboardingExtension from '@proton/pass/assets/desktop-onboarding/onboarding-extension.svg';
import { PassModal } from '@proton/pass/components/Layout/Modal/PassModal';
import { OnboardingLockSetup } from '@proton/pass/components/Onboarding/OnboardingLockSetup';
import { PASS_DOWNLOAD_URL } from '@proton/pass/constants';
import { prop } from '@proton/pass/utils/fp/lens';
import { not } from '@proton/pass/utils/fp/predicates';
import { PASS_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import { wait } from '@proton/shared/lib/helpers/promise';

import { useOnboarding } from './OnboardingProvider';

import './OnboardingModal.scss';

type OnboardingStep = {
    action?: () => void;
    actionText?: string;
    component?: ReactNode;
    description: ReactNode;
    group: string;
    hidden?: boolean;
    key: string;
    title: string;
};

export const OnboardingModal: FC<ModalProps> = ({ size = 'xlarge', ...props }) => {
    const { acknowledge } = useOnboarding();
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(0);

    const steps = useMemo<OnboardingStep[]>(
        () =>
            [
                {
                    actionText: c('Label').t`Select theme`,
                    description: c('Label').t`Choose your preferred look and feel.`,
                    group: c('Label').t`Personalize`,
                    hidden: true,
                    key: 'look-and-feel',
                    title: c('Label').t`Make it your own.`,
                },
                {
                    component: (
                        <div className="pass-onboarding-modal--lock">
                            <p className="text-bold mt-0">{c('Label').t`Unlock with:`}</p>
                            <OnboardingLockSetup />
                        </div>
                    ),
                    description: (
                        <>
                            {c('Label')
                                .t`For security reasons, ${PASS_SHORT_APP_NAME} automatically locks itself after 10 minutes of inactivity.`}
                            <br />
                            {c('Label')
                                .t`You can choose between PIN code, biometrics, or your account password to unlock.`}
                        </>
                    ),
                    group: c('Label').t`Security`,
                    key: 'unlock',
                    title: c('Label').t`How to unlock ${PASS_SHORT_APP_NAME}`,
                },
                {
                    action: () => window.open(PASS_DOWNLOAD_URL, '_blank'),
                    actionText: c('Label').t`Install and continue`,
                    component: <img src={onboardingExtension} className="w-full" alt="" />,
                    description: c('Label').t`Get the extension for your browser.`,
                    group: c('Label').t`Browse faster, smarter`,
                    key: 'extension',
                    title: c('Label').t`Your passwords. Everywhere.`,
                },
            ].filter(not(prop('hidden'))),
        []
    );

    const currentStep = steps[step];

    const onComplete = () => {
        setLoading(true);
        acknowledge();
        void wait(250).then(props.onClose);
    };

    const onStep = (offset: number) =>
        step + offset < steps.length ? setStep(Math.max(0, step + offset)) : onComplete();

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
        <PassModal {...props} onClose={onComplete} size={size} className="pass-onboarding-modal">
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
