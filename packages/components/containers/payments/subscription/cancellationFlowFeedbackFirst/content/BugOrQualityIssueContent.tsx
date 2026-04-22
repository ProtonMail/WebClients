import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import lifeRing from '@proton/styles/assets/img/illustrations/life-ring.svg';
import stethoscope from '@proton/styles/assets/img/illustrations/stethoscope.svg';

import { CallToActionBanner } from '../components/CallToActionBanner';

interface Props {
    onKeepPlan: () => void;
    onContinueCancelling: () => void;
}

export const BugOrQualityIssueContent = ({ onKeepPlan, onContinueCancelling }: Props) => {
    const cards = [
        {
            image: stethoscope,
            title: c('Title').t`Troubleshoot your issue`,
            description: c('Description').t`Most issues can be solved in a few minutes with our step-by-step guides.`,
            ctaText: c('Link').t`Visit our support site`,
            ctaHref: getKnowledgeBaseUrl('/mail'),
        },
        {
            image: lifeRing,
            title: c('Title').t`Get direct support`,
            description: c('Description').t`Still need help? Our support team is here for you.`,
            ctaText: c('Link').t`Contact support`,
            ctaHref: getKnowledgeBaseUrl('/contact'),
        },
    ];

    return (
        <>
            <ModalTwoHeader title={c('Title').t`Get help with an issue`} titleClassName="text-4xl" />
            <ModalTwoContent>
                <p className="color-norm">
                    {c('Get help')
                        .t`Many issues can be resolved quickly with our help guides. If you need more support, our team is here to help.`}
                </p>

                <div className="border border-weak rounded-lg overflow-hidden mt-8">
                    {cards.map(({ image, title, description, ctaText, ctaHref }, index) => {
                        return (
                            <CallToActionBanner
                                key={title}
                                image={image}
                                title={title}
                                description={description}
                                ctaText={ctaText}
                                ctaHref={ctaHref}
                                index={index}
                            />
                        );
                    })}
                </div>
            </ModalTwoContent>
            <ModalTwoFooter className="flex justify-end gap-2">
                <Button shape="outline" color="weak" onClick={onKeepPlan}>
                    {c('Get help').t`Keep current plan`}
                </Button>
                <Button color="danger" onClick={onContinueCancelling}>
                    {c('Get help').t`Continue cancelling`}
                </Button>
            </ModalTwoFooter>
        </>
    );
};
