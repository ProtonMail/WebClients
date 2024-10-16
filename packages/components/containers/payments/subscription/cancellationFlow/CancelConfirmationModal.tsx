import { c } from 'ttag';

import { Button, ButtonLike } from '@proton/atoms';
import Icon from '@proton/components/components/icon/Icon';
import SettingsLink from '@proton/components/components/link/SettingsLink';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import StripedItem from '@proton/components/components/stripedList/StripedItem';
import { StripedList } from '@proton/components/components/stripedList/StripedList';
import type { PLANS } from '@proton/shared/lib/constants';
import { useFlag } from '@proton/unleash';

import type { ConfirmationModal } from './interface';
import useCancellationTelemetry from './useCancellationTelemetry';

interface Props extends ModalProps, ConfirmationModal {
    ctaText: string;
    cancelSubscription: () => void;
    upsellPlan?: PLANS;
}

const CancelConfirmationModal = ({
    ctaText,
    description,
    warningPoints,
    warningTitle,
    cancelSubscription,
    upsellPlan,
    ...modalProps
}: Props) => {
    const { sendCancelModalKeepPlanReport, sendCancelModalConfirmCancelReport } = useCancellationTelemetry();
    const isUpsellEnabled = useFlag('NewCancellationFlowUpsell');

    const handleClick = () => {
        if (!isUpsellEnabled) {
            sendCancelModalConfirmCancelReport();
        }
        cancelSubscription();
    };

    return (
        <ModalTwo {...modalProps} data-testid="cancellation-reminder-confirmation">
            <ModalTwoHeader title={c('Subscription reminder').t`Cancel subscription?`} />
            <ModalTwoContent className="mb-6">
                <div className="flex flex-nowrap flex-row">
                    <div className="shrink-0 mr-2">
                        <Icon name="exclamation-circle-filled" className="color-danger" />
                    </div>
                    <div className="flex-1">{description}</div>
                </div>
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
                <ButtonLike
                    as={SettingsLink}
                    onClick={() => {
                        sendCancelModalKeepPlanReport();
                    }}
                    path="/dashboard"
                    shape="outline"
                    color="weak"
                    className="flex flex-nowrap items-center justify-center"
                >
                    {ctaText}
                </ButtonLike>
                <Button color="danger" data-testid="confirm-cancellation-button" onClick={handleClick}>{c(
                    'Subscription reminder'
                ).t`Cancel subscription`}</Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default CancelConfirmationModal;
