import { c } from 'ttag';

import { Button, ButtonLike } from '@proton/atoms/Button';
import { Href } from '@proton/atoms/Href';
import {
    Icon,
    IconName,
    ModalProps,
    ModalTwo,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
    SettingsLink,
    StripedItem,
    StripedList,
} from '@proton/components/components';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

import { ConfirmationModal } from './interface';

interface Props extends ModalProps, ConfirmationModal {
    ctaText: string;
    cancelSubscription: () => void;
    features: { icon: IconName; text: string }[];
}

const CancelConfirmationModal = ({
    ctaText,
    features,
    description,
    cancelSubscription,
    learnMoreLink,
    ...modalProps
}: Props) => {
    return (
        <ModalTwo {...modalProps} data-testid="cancellation-reminder-confirmation">
            <ModalTwoHeader title={c('Subscription reminder').t`Cancel subscription?`} />
            <ModalTwoContent>
                <p className="m-0 mb-1">{description}</p>
                <Href className="mb-8" href={getKnowledgeBaseUrl(learnMoreLink)}>
                    {c('Link').t`Learn more`}
                </Href>
                <p className="mb-4 mt-6 text-lg text-bold">{c('Subscription reminder')
                    .t`When you cancel, you will lose access to`}</p>
                <StripedList alternate="odd" className="mt-0">
                    {features.map(({ icon, text }) => (
                        <StripedItem key={text} left={<Icon name={icon} className="color-primary" />}>
                            {text}
                        </StripedItem>
                    ))}
                </StripedList>
            </ModalTwoContent>
            <ModalTwoFooter className="flex justify-space-between">
                <Button onClick={cancelSubscription} shape="outline">{c('Subscription reminder')
                    .t`Cancel subscription`}</Button>
                <ButtonLike
                    as={SettingsLink}
                    path="/dashboard"
                    shape="solid"
                    color="norm"
                    className="flex flex-nowrap items-center justify-center"
                >
                    <Icon name="brand-proton-mail-filled-plus" size={5} className="mr-1" />
                    {ctaText}
                </ButtonLike>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default CancelConfirmationModal;
