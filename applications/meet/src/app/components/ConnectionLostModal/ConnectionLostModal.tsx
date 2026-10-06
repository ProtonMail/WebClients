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
            title={c('Info').t`Connection failed`}
            message={c('Info').t`Unable to reconnect to the meeting. Please rejoin or leave.`}
            primaryText={c('Action').t`Leave meeting`}
            primaryButtonClass="danger"
            onPrimaryAction={onLeave}
            secondaryText={c('Action').t`Rejoin meeting`}
            secondaryButtonClass="secondary"
            onSecondaryAction={onRejoin}
        />
    );
};
