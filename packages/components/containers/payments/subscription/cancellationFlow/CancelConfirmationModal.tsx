import { c } from 'ttag';

import { Button, ButtonLike } from '@proton/atoms';
import { StripedItem, StripedList } from '@proton/components';
import type { ModalProps } from '@proton/components/components';
import {
    Icon,
    ModalTwo,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
    SettingsLink,
} from '@proton/components/components';

import type { ConfirmationModal } from './interface';
import useCancellationTelemetry from './useCancellationTelemetry';

interface Props extends ModalProps, ConfirmationModal {
    ctaText: string;
    cancelSubscription: () => void;
}

const CancelConfirmationModal = ({
    ctaText,
    description,
    warningPoints,
    warningTitle,
    cancelSubscription,
    ...modalProps
}: Props) => {
    const { sendCancelModalKeepPlanReport, sendCancelModalConfirmCancelReport } = useCancellationTelemetry();

    return (
        <ModalTwo {...modalProps} data-testid="cancellation-reminder-confirmation">
            <ModalTwoHeader title={c('Subscription reminder').t`Cancel subscription?`} />
            <ModalTwoContent className="mb-6">
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
                <Button
                    shape="outline"
                    data-testid="confirm-cancellation-button"
                    onClick={() => {
                        sendCancelModalConfirmCancelReport();
                        cancelSubscription();
                    }}
                >{c('Subscription reminder').t`Cancel subscription`}</Button>
                <ButtonLike
                    as={SettingsLink}
                    onClick={() => {
                        sendCancelModalKeepPlanReport();
                    }}
                    path="/dashboard"
                    shape="solid"
                    color="norm"
                    className="flex flex-nowrap items-center justify-center"
                >
                    <Icon name="upgrade" size={5} className="mr-1" />
                    {ctaText}
                </ButtonLike>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default CancelConfirmationModal;
