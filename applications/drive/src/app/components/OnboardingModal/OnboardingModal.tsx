import React, { useState, useMemo } from 'react';
import { DialogModal, HeaderModal, InnerModal, FooterModal, Button, PrimaryButton } from 'react-components';
import { noop } from 'proton-shared/lib/helpers/function';
import { c } from 'ttag';
import OnboardingStepInfo from './OnboardingStepInfo';
import OnboardingCompleteInfo from './OnboardingCompleteInfo';

import feedbackImage from './pd-onboarding-feedback.png';
import welcomeImage from './pd-onboarding-welcome.png';

interface Props {
    onClose?: () => void;
    modalTitleID?: string;
}

interface Step {
    image: string;
    info: JSX.Element;
    header?: string;
}

const OnboardingModal = ({ modalTitleID = 'onboardingModal', onClose = noop, ...rest }: Props) => {
    const [currentStep, setCurrentStep] = useState(0);

    // Workaround to fix modal flickering, while re-rendering content.
    useMemo(
        () =>
            [welcomeImage, feedbackImage].map((src: string) => {
                const image = new Image();
                image.src = src;
                return image;
            }),
        []
    );

    const betaText = <strong key="title">{c('BetaText').t`ProtonDrive Beta`}</strong>;
    const defaultHeader = c('Title').jt`Welcome to ${betaText}!`;

    const steps: Step[] = [
        {
            image: welcomeImage,
            info: <OnboardingStepInfo />
        },
        {
            image: feedbackImage,
            info: <OnboardingCompleteInfo />,
            header: c('Title').t`Like the product?`
        }
    ];

    const isFirstStep = currentStep === 0;
    const isLastStep = currentStep === steps.length - 1;
    const step = steps[currentStep];

    const handleBackClick = () => {
        if (isFirstStep) {
            onClose();
        } else {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleNextClick = () => {
        if (isLastStep) {
            onClose();
        } else {
            setCurrentStep(currentStep + 1);
        }
    };

    return (
        <DialogModal modalTitleID={modalTitleID} onClose={onClose} {...rest}>
            <HeaderModal modalTitleID={modalTitleID} onClose={onClose} className="aligncenter">
                {step.header || defaultHeader}
            </HeaderModal>
            <div className="pm-modalContent">
                <InnerModal>
                    {step.info}
                    <figure className="bordered-container no-scroll">
                        <img
                            className="w100"
                            src={step.image}
                            alt={
                                isFirstStep
                                    ? c('info').t`Protont Drive interface`
                                    : c('info').t`Location of report bug button`
                            }
                        />
                    </figure>
                </InnerModal>
                <FooterModal>
                    <Button onClick={handleBackClick}>
                        {isFirstStep ? c('Action').t`Skip tutorial` : c('Action').t`Back`}
                    </Button>
                    <PrimaryButton onClick={handleNextClick}>
                        {isLastStep ? c('Action').t`Start storing files` : c('Action').t`Next`}
                    </PrimaryButton>
                </FooterModal>
            </div>
        </DialogModal>
    );
};

export default OnboardingModal;
