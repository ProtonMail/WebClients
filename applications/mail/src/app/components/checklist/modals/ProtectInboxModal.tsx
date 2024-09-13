import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Href } from '@proton/atoms/Href';
import type { ModalStateProps } from '@proton/components';
import { ModalTwo, ModalTwoHeader, StepDot, StepDots } from '@proton/components';
import ModalContent from '@proton/components/components/modalTwo/ModalContent';
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
            title: c('Get started checklist instructions').t`Protection from trackers`,
            knowledgeBaseLink: '/email-tracker-protection',
            description: c('Get started checklist instructions')
                .t`We stop advertisers and data collectors from profiling you.`,
        },
        {
            img: blockEmails,
            title: c('Get started checklist instructions').t`Block unsavory senders`,
            knowledgeBaseLink: '/block-sender',
            description: c('Get started checklist instructions')
                .t`Block email communications from scammers permanently.`,
        },
        {
            img: fullyEncrypted,
            title: c('Get started checklist instructions').t`For your eyes only`,
            description: c('Get started checklist instructions')
                .t`Encryption so strong, only you and intended recipients can view your emails.`,
        },
    ];
};

const ProtectInboxStep = ({ img, title, description, knowledgeBaseLink }: ProtectInboxStepProps) => {
    return (
        <div>
            <img src={img} alt="" className="w-full h-custom" style={{ '--h-custom': '15rem' }} />
            {/* Avoid text jumping when changing step, fixed height ensure proper display of the text */}
            <div className="mb-0 mt-2 h-custom min-h-custom" style={{ '--min-h-custom': '5em' }}>
                <h1 className="text-bold text-2xl mt-4">{title}</h1>
                <span className="m-0">{description}</span>{' '}
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

    const handleClose = () => {
        if (isLastStep && !items.has('ProtectInbox')) {
            markItemsAsDone('ProtectInbox');
        }

        props.onClose();
    };

    return (
        <ModalTwo {...props} size="small" onClose={handleClose}>
            <ModalTwoHeader />
            <ModalContent>
                <ProtectInboxStep {...protectedItems[step]} />

                <div className="flex justify-space-between mt-4">
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
