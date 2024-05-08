import { c } from 'ttag';

import { Button, ButtonLike } from '@proton/atoms/Button';
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

import { ConfirmationModal } from './interface';

interface Props extends ModalProps, ConfirmationModal {
    ctaText: string;
    ctaKeepIcon: IconName;
    cancelSubscription: () => void;
}

const CancelConfirmationModal = ({
    ctaText,
    ctaKeepIcon,
    description,
    warningPoints,
    warningTitle,
    cancelSubscription,
    ...modalProps
}: Props) => {
    return (
        <ModalTwo {...modalProps} data-testid="cancellation-reminder-confirmation">
            <ModalTwoHeader title={c('Subscription reminder').t`Cancel subscription?`} />
            <ModalTwoContent>
                <p className="m-0 mb-1">{description}</p>
                <p className="mb-4 mt-6 text-lg text-bold">{warningTitle}</p>
                <StripedList alternate="odd" className="mt-0">
                    {warningPoints.map((text) => (
                        <StripedItem key={text} left={<Icon name="cross-big" className="color-danger" />}>
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
                    <Icon name={ctaKeepIcon} size={5} className="mr-1" />
                    {ctaText}
                </ButtonLike>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default CancelConfirmationModal;
