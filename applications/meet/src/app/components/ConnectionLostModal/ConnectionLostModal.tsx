import { c } from 'ttag';

import { ConfirmationModal } from '../ConfirmationModal/ConfirmationModal';

interface ConnectionLostModalProps {
    onRejoin: () => void;
    onLeave: () => void;
}

export const ConnectionLostModal = ({ onRejoin, onLeave }: ConnectionLostModalProps) => {
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
