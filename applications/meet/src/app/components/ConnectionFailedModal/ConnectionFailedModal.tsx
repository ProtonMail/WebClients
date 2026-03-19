import { c } from 'ttag';

import { ConfirmationModal } from '../ConfirmationModal/ConfirmationModal';

interface ConnectionFailedModalProps {
    onTryAgain: () => void;
    onLeave?: () => void;
    showLeaveButton?: boolean;
}

export const ConnectionFailedModal = ({ onTryAgain, onLeave, showLeaveButton = true }: ConnectionFailedModalProps) => {
    return (
        <ConfirmationModal
            title={c('Info').t`Connection failed`}
            message={c('Info').t`Please try again or try another browser`}
            primaryText={c('Action').t`Try again`}
            primaryButtonClass="danger"
            onPrimaryAction={onTryAgain}
            secondaryText={c('Action').t`Leave`}
            secondaryButtonClass="secondary"
            onSecondaryAction={showLeaveButton && onLeave ? onLeave : undefined}
        />
    );
};
