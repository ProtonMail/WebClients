import { type FC, useState } from 'react';

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
import { PASS_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import { wait } from '@proton/shared/lib/helpers/promise';

import { useOnboarding } from './OnboardingProvider';

import './OnboardingModal.scss';

export const OnboardingModal: FC<ModalProps> = ({ size = 'xlarge', ...props }) => {
    const [loading, setLoading] = useState(false);
    const [stepIx, setStepIx] = useState(0);
    const { acknowledge } = useOnboarding();

    const steps = [
        /*
        {
            key: 'look-and-feel',
            group: c('Label').t`Personalize`,
            title: c('Label').t`Make it your own.`,
            description: c('Label').t`Choose your preferred look and feel.`,
            actionText: c('Label').t`Select theme`,
        },
        */
        {
            key: 'unlock',
            group: c('Label').t`Security`,
            title: c('Label').t`How to unlock ${PASS_SHORT_APP_NAME}`,
            description: c('Label')
                .t`For security reasons, ${PASS_SHORT_APP_NAME} automatically locks itself after 10 minutes of inactivity.\n\nYou can choose between PIN code, biometrics, or your account password to unlock.`,
            component: (
                <div className="pass-onboarding-modal--lock">
                    <p className="text-bold">{c('Label').t`Unlock with:`}</p>
                    <OnboardingLockSetup />
                </div>
            ),
        },
        {
            key: 'extension',
            group: c('Label').t`Browse faster, smarter`,
            title: c('Label').t`Your passwords. Everywhere.`,
            description: c('Label').t`Get the extension for your browser.`,
            actionText: c('Label').t`Install and continue`,
            component: <img src={onboardingExtension} className="w-full" alt="" />,
            action: () => window.open(PASS_DOWNLOAD_URL, '_blank'),
            skippable: true,
        },
    ];

    const onStepChange = async (offset: number) => {
        const nextIx = stepIx + offset;
        if (nextIx < 0) return;
        if (nextIx > steps.length - 1) {
            setLoading(true);
            await wait(250);
            acknowledge();
            return props.onClose?.();
        }
        setStepIx(nextIx);
    };

    const currentStep = steps[stepIx];

    const onContinueClick = () => {
        currentStep.action?.();
        void onStepChange(1);
    };

    const backButton =
        stepIx > 0 ? (
            <Button className="mr-auto" icon pill shape="ghost" disabled={!stepIx} onClick={() => onStepChange(-1)}>
                <Icon name="arrow-left" />
            </Button>
        ) : undefined;

    return (
        <PassModal {...props} size={size} className="pass-onboarding-modal">
            <ModalTwoHeader actions={backButton} closeButtonProps={{ pill: true, icon: true }} />

            <Stepper activeStep={stepIx}>
                {steps.map((step, ix) => (
                    <Step key={step.key}>{'' + (ix + 1)}</Step>
                ))}
            </Stepper>

            <ModalTwoContent>
                <div className="h-custom flex items-center" style={{ '--h-custom': '20rem' }}>
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
                    {currentStep.skippable && (
                        <Button
                            className="mr-auto pass-onboarding-modal--skip"
                            pill
                            shape="ghost"
                            onClick={() => onStepChange(1)}
                            disabled={loading}
                        >
                            Skip
                        </Button>
                    )}

                    <Button pill shape="solid" onClick={onContinueClick} disabled={loading}>
                        {currentStep.actionText ?? 'Continue'}
                    </Button>
                </div>
            </ModalTwoFooter>
        </PassModal>
    );
};
