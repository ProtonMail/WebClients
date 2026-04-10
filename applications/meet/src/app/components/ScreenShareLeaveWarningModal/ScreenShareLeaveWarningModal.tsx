import { c } from 'ttag';

import screenCancelImg from '@proton/styles/assets/img/meet/screen-cancel.png';

import { ConfirmationModal } from '../ConfirmationModal/ConfirmationModal';

interface ScreenShareLeaveWarningModalProps {
    onClose: () => void;
    onConfirm: () => void;
    endingMeeting: boolean;
}

export const ScreenShareLeaveWarningModal = ({
    onClose,
    onConfirm,
    endingMeeting,
}: ScreenShareLeaveWarningModalProps) => {
    const title = endingMeeting ? c('Info').t`End Meeting for everyone?` : c('Info').t`Leave meeting and stop sharing?`;
    const message = endingMeeting
        ? c('Info').t`This will end the meeting for all participants and stop your screen sharing.`
        : c('Info').t`Leaving the meeting will stop your screen sharing.`;
    const primaryText = endingMeeting ? c('Action').t`End meeting` : c('Action').t`Leave meeting`;
    const secondaryText = endingMeeting ? c('Action').t`Cancel` : c('Action').t`Stay in meeting`;

    return (
        <ConfirmationModal
            icon={
                <img
                    className="w-custom h-custom"
                    src={screenCancelImg}
                    alt=""
                    style={{ '--w-custom': '7.5rem', '--h-custom': '7.5rem' }}
                />
            }
            title={title}
            message={message}
            primaryText={primaryText}
            primaryButtonClass="danger"
            onPrimaryAction={onConfirm}
            secondaryText={secondaryText}
            secondaryButtonClass="tertiary"
            onSecondaryAction={onClose}
        />
    );
};
