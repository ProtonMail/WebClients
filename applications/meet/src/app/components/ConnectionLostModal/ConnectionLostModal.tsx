import { c } from 'ttag';

import { TelemetryMeetActionsEvents, sendMeetActionsEvent } from '@proton/meet/telemetry/meetTelemetry';

import { useSendOnce } from '../../telemetry/useSendOnce';
import { ConfirmationModal } from '../ConfirmationModal/ConfirmationModal';

interface ConnectionLostModalProps {
    onRejoin: () => void;
    onLeave: () => void;
}

export const ConnectionLostModal = ({ onRejoin, onLeave }: ConnectionLostModalProps) => {
    useSendOnce(() => sendMeetActionsEvent(TelemetryMeetActionsEvents.connection_lost_modal_shown));

    return (
        <ConfirmationModal
            icon={null} // If connection is lost, there is a high chance this icon won't even load
            title={c('Info').t`Connection lost`}
            message={c('Info').t`Reconnecting didn’t work. Check your internet connection, then rejoin.`}
            primaryText={c('Action').t`Rejoin meeting`}
            primaryButtonClass="secondary"
            onPrimaryAction={onRejoin}
            secondaryText={c('Action').t`Leave meeting`}
            secondaryButtonClass="tertiary"
            onSecondaryAction={onLeave}
        />
    );
};
