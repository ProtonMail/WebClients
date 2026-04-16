import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

import accounts from './assets/images/img-accounts.svg';
import envelopeAddress from './assets/images/img-envelope-address.svg';
import { CallToActionBanner } from './components/CallToActionBanner';

interface Props {
    onKeepPlan: () => void;
    onContinueCancelling: () => void;
}

export const DifferentAccountContent = ({ onKeepPlan, onContinueCancelling }: Props) => {
    const cards = [
        {
            image: accounts,
            title: c('Title').t`Already have multiple accounts?`,
            description: c('Description')
                .t`You can merge addresses into one main ${BRAND_NAME} account using our support guide.`,
            ctaText: c('Link').t`Learn how`,
            ctaHref: getKnowledgeBaseUrl('/combine-accounts'),
        },
        {
            image: envelopeAddress,
            title: c('Title').t`Create new addresses easily`,
            description: c('Description')
                .t`Add extra addresses to your account or use Hide My Email aliases to keep your inbox private.`,
            ctaText: c('Link').t`Manage addresses`,
            ctaHref: '/mail/identity-addresses',
        },
    ];

    return (
        <>
            <ModalTwoHeader title={c('Title').t`Use one account for all your addresses`} titleClassName="text-4xl" />
            <ModalTwoContent>
                <p className="color-norm">
                    {c('Description')
                        .t`You can manage multiple ${BRAND_NAME} addresses from a single account, without switching. Aliases and address management tools help keep everything in one inbox.`}
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
                    {c('Action').t`Keep current plan`}
                </Button>
                <Button color="danger" onClick={onContinueCancelling}>
                    {c('Action').t`Continue cancelling`}
                </Button>
            </ModalTwoFooter>
        </>
    );
};
