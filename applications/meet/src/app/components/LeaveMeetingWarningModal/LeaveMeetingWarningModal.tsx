import { c } from 'ttag';

import { isMobile } from '@proton/shared/lib/helpers/browser';
import warningImg from '@proton/styles/assets/img/meet/warning-icon.svg';

import { ConfirmationModal } from '../ConfirmationModal/ConfirmationModal';

interface LeaveMeetingWarningModalProps {
    onClose: () => void;
    onConfirm: () => void;
    isHostOrAdmin: boolean;
}

export const LeaveMeetingWarningModal = ({ onClose, onConfirm, isHostOrAdmin }: LeaveMeetingWarningModalProps) => {
    // We only show a subtitle message if the local participant is host or admin
    const message = isHostOrAdmin ? c('Info').t`You will leave the meeting. Others will continue.` : null;

    return (
        <ConfirmationModal
            icon={
                <img
                    src={warningImg}
                    className="w-custom h-custom mb-2"
                    alt=""
                    style={
                        isMobile()
                            ? {
                                  '--w-custom': '3rem',
                                  '--h-custom': '3rem',
                              }
                            : {
                                  '--w-custom': '5rem',
                                  '--h-custom': '5rem',
                              }
                    }
                />
            }
            title={c('Info').t`Are you sure you want to leave?`}
            message={message}
            primaryText={c('Action').t`Leave meeting`}
            primaryButtonClass="danger"
            onPrimaryAction={onConfirm}
            secondaryText={c('Action').t`Stay in meeting`}
            secondaryButtonClass="secondary"
            onSecondaryAction={onClose}
        />
    );
};
