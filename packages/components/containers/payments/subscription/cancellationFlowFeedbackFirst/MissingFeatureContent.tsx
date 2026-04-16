import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Href } from '@proton/atoms/Href/Href';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { getBlogURL } from '@proton/shared/lib/helpers/url';
import bell from '@proton/styles/assets/img/illustrations/bell.svg';
import inkPen from '@proton/styles/assets/img/illustrations/ink-pen.svg';
import clsx from '@proton/utils/clsx';

interface Props {
    onKeepPlan: () => void;
    onContinueCancelling: () => void;
}

export const MissingFeatureContent = ({ onKeepPlan, onContinueCancelling }: Props) => {
    const cards = [
        {
            image: inkPen,
            title: c('Missing feature').t`Submit your ideas`,
            description: c('Missing feature')
                .t`Request a feature or vote on ideas from other users in our feedback forum.`,
            ctaText: c('Missing feature').t`Request a feature`,
            ctaHref: 'https://protonmail.uservoice.com/',
        },
        {
            image: bell,
            title: c('Missing feature').t`Check out the latest product updates`,
            description: c('Missing feature').t`See how ${BRAND_NAME} apps are evolving with your feedback.`,
            ctaText: c('Missing feature').t`Explore the latest news`,
            ctaHref: getBlogURL('/product-updates'),
        },
    ];

    return (
        <>
            <ModalTwoHeader title={c('Missing feature').t`Make your voice heard`} titleClassName="text-4xl" />
            <ModalTwoContent>
                <p className="color-norm">
                    {c('Missing feature')
                        .t`Your feedback helps us improve. Whether you've spotted a bug, want a new feature, or think something could work differently, we'd love to hear from you.`}
                </p>

                <div className="border border-weak rounded-lg overflow-hidden mt-8">
                    {cards.map(({ image, title, description, ctaText, ctaHref }, index) => {
                        return (
                            <div
                                key={title}
                                className={clsx(
                                    'flex flex-wrap items-center gap-4 p-6',
                                    index !== 0 && 'border-top border-weak'
                                )}
                            >
                                {image && <img src={image} alt="" width={56} height={56} />}
                                <div className="flex flex-column flex-1">
                                    <p className="text-bold m-0">{title}</p>
                                    <p className="color-weak m-0">{description}</p>
                                </div>
                                <Href
                                    href={ctaHref}
                                    className="text-no-decoration hover:text-underline text-no-wrap text-lg w-full pl-custom md:pl-0 md:w-auto md:ml-auto"
                                    style={{ '--pl-custom': '4.5rem' }}
                                >
                                    {ctaText}
                                </Href>
                            </div>
                        );
                    })}
                </div>
            </ModalTwoContent>
            <ModalTwoFooter className="flex justify-end gap-2">
                <Button shape="outline" color="weak" onClick={onKeepPlan}>
                    {c('Missing feature').t`Keep current plan`}
                </Button>
                <Button color="danger" onClick={onContinueCancelling}>
                    {c('Missing feature').t`Continue cancelling`}
                </Button>
            </ModalTwoFooter>
        </>
    );
};
