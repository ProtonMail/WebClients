import { c } from 'ttag';

import warningImg from '@proton/styles/assets/img/meet/warning-icon.png';

import { ConfirmationModal } from '../ConfirmationModal/ConfirmationModal';

interface LeaveMeetingWarningModalProps {
    onClose: () => void;
    onConfirm: () => void;
}

export const LeaveMeetingWarningModal = ({ onClose, onConfirm }: LeaveMeetingWarningModalProps) => {
    return (
        <ConfirmationModal
            icon={
                <img
                    src={warningImg}
                    className="w-custom h-custom mb-2"
                    alt=""
                    style={{ '--w-custom': '7.5rem', '--h-custom': '7.5rem' }}
                />
            }
            title={c('Info').t`Are you sure you want to leave?`}
            primaryText={c('Action').t`Leave meeting`}
            primaryButtonClass="danger"
            onPrimaryAction={onConfirm}
            secondaryText={c('Action').t`Stay in meeting`}
            secondaryButtonClass="secondary"
            onSecondaryAction={onClose}
        />
    );
};
