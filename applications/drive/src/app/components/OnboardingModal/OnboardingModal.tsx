import React, { useState } from 'react';
import { DialogModal, HeaderModal, InnerModal, FooterModal, Button, PrimaryButton } from 'react-components';
import { noop } from 'proton-shared/lib/helpers/function';
import { c } from 'ttag';
import OnboardingStepInfo from './OnboardingStepInfo';
import OnboardingCompleteInfo from './OnboardingCompleteInfo';

interface Props {
    onClose?: () => void;
    modalTitleID?: string;
}

const OnboardingModal = ({ modalTitleID = 'modalTitle', onClose = noop, ...rest }: Props) => {
    const [currentStep, setCurrentStep] = useState(0);

    const betaText = <strong key="title">{c('BetaText').t`ProtonDrive Beta`}</strong>;
    const steps = [
        {
            text: c('Info').t`Choose to Upload a file`,
            image: 'https://via.placeholder.com/600x300.png',
            info: <OnboardingStepInfo />
        },
        {
            text: c('Info').t`Manage your Files`,
            image: 'https://via.placeholder.com/600x300.png',
            info: <OnboardingStepInfo />
        },
        {
            text: c('Info').t`Switch between Services`,
            image: 'https://via.placeholder.com/600x300.png',
            info: <OnboardingStepInfo />
        },
        { image: 'https://via.placeholder.com/600x300.png', info: <OnboardingCompleteInfo /> }
    ];

    const isLastStep = currentStep === steps.length - 1;
    const step = steps[currentStep];

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
                {c('Title').jt`Welcome to ${betaText}!`}
            </HeaderModal>
            <div className="pm-modalContent">
                <InnerModal>
                    {step.info}
                    <div className="flex flex-justify-center flex-items-center mt1-5 mb1-5 color-primary">
                        {step.text && (
                            <>
                                <span
                                    style={{ width: 35, height: 35 }}
                                    className="bordered rounded50 flex mr1 border-currentColor"
                                >
                                    <div className="center flex flex-items-center ">{currentStep + 1}</div>
                                </span>
                                <strong>{step.text}</strong>
                            </>
                        )}
                    </div>
                    <img className="w100" src={step.image} alt="placeholder" />
                </InnerModal>
                <FooterModal>
                    <Button onClick={onClose}>{c('Action').t`Skip`}</Button>
                    <PrimaryButton onClick={handleNextClick}>
                        {isLastStep ? c('Action').t`Start storing files` : c('Action').t`Next`}
                    </PrimaryButton>
                </FooterModal>
            </div>
        </DialogModal>
    );
};

export default OnboardingModal;
