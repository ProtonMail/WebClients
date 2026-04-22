import { c } from 'ttag';

import { isMobile } from '@proton/shared/lib/helpers/browser';
import warningImg from '@proton/styles/assets/img/meet/warning-icon.svg';

import { ConfirmationModal } from '../ConfirmationModal/ConfirmationModal';

interface EndMeetingWarningModalProps {
    onClose: () => void;
    onConfirm: () => void;
}

export const EndMeetingWarningModal = ({ onClose, onConfirm }: EndMeetingWarningModalProps) => {
    return (
        <ConfirmationModal
            icon={
                <img
                    className="w-custom h-custom"
                    src={warningImg}
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
            title={c('Info').t`End the meeting for everyone?`}
            message={c('Info').t`This will end the meeting for all participants.`}
            primaryText={c('Action').t`End meeting`}
            primaryButtonClass="danger"
            onPrimaryAction={onConfirm}
            secondaryText={c('Action').t`Cancel`}
            secondaryButtonClass="tertiary"
            onSecondaryAction={onClose}
        />
    );
};
