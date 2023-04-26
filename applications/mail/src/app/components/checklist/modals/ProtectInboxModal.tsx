import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Href } from '@proton/atoms/Href';
import { ModalStateProps, ModalTwo, ModalTwoHeader, StepDot, StepDots } from '@proton/components/components';
import ModalContent from '@proton/components/components/modalTwo/ModalContent';
import { MAIL_APP_NAME } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import blockEmails from '@proton/styles/assets/img/illustrations/checklist-block-emails.svg';
import fullyEncrypted from '@proton/styles/assets/img/illustrations/checklist-fully-encrypted.svg';
import trackingProtection from '@proton/styles/assets/img/illustrations/checklist-tracking-protection.svg';
import range from '@proton/utils/range';

import { useGetStartedChecklist } from 'proton-mail/containers/onboardingChecklist/provider/GetStartedChecklistProvider';

interface ProtectInboxStepProps {
    img: string;
    title: string;
    description: string;
    knowledgeBaseLink?: string;
}

const getProtectInboxState = (): ProtectInboxStepProps[] => {
    return [
        {
            img: trackingProtection,
            title: c('Get started checklist instructions').t`Email tracking protection`,
            knowledgeBaseLink: '/email-tracker-protection',
            description: c('Get started checklist instructions')
                .t`${MAIL_APP_NAME} blocks known trackers commonly found in newsletters and promotional email, preventing senders from spying on you.`,
        },
        {
            img: blockEmails,
            title: c('Get started checklist instructions').t`Block unwanted emails`,
            knowledgeBaseLink: '/block-sender',
            description: c('Get started checklist instructions')
                .t`${MAIL_APP_NAME} blocks spam and unwanted emails so you can focus on what matters. With one-click unsubscribe, you can control what shows up in your inbox.`,
        },
        {
            img: fullyEncrypted,
            title: c('Get started checklist instructions').t`Fully-encrypted emails`,
            description: c('Get started checklist instructions')
                .t`We use end-to-end encryption and zero-access encryption to ensure that only you can read your emails. We cannot read or give anyone else access to your emails.`,
        },
    ];
};

const ProtectInboxStep = ({ img, title, description, knowledgeBaseLink }: ProtectInboxStepProps) => {
    return (
        <div>
            <img src={img} alt="" className="w100 h-custom" style={{ '--h-custom': '15rem' }} />
            {/* Avoid text jumping when changing step, fixed height ensure proper display of the text */}
            <div className="mb-0 mt-2 h-custom min-h10e">
                <h1 className="text-bold text-2xl mt-4">{title}</h1>
                <p className="m-0">{description}</p>
                {knowledgeBaseLink && (
                    <Href href={getKnowledgeBaseUrl(knowledgeBaseLink)}>{c('Get started checklist instructions')
                        .t`Learn more`}</Href>
                )}
            </div>
        </div>
    );
};

const ProtectInboxModal = (props: ModalStateProps) => {
    const [step, setStep] = useState(0);
    const { markItemsAsDone, items } = useGetStartedChecklist();

    const protectedItems = getProtectInboxState();
    const isLastStep = step === protectedItems.length - 1;

    const handleNext = () => {
        if (isLastStep) {
            if (!items.has('ProtectInbox')) {
                markItemsAsDone('ProtectInbox');
            }
            props.onClose();
            return;
        }

        setStep((current) => current + 1);
    };

    return (
        <ModalTwo {...props} size="small">
            <ModalTwoHeader />
            <ModalContent>
                <ProtectInboxStep {...protectedItems[step]} />

                <div className="flex flex-justify-space-between mt-4">
                    <Button onClick={() => setStep((current) => current - 1)} disabled={step === 0}>{c('Action')
                        .t`Previous`}</Button>
                    <Button onClick={handleNext} color="norm">
                        {isLastStep ? c('Action').t`Done` : c('Action').t`Next`}
                    </Button>
                </div>

                <div className="text-center">
                    <StepDots value={step}>
                        {range(0, protectedItems.length).map((index) => (
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
            </ModalContent>
        </ModalTwo>
    );
};

export default ProtectInboxModal;
