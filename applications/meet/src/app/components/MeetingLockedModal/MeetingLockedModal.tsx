import { useContext } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { ModalTwo } from '@proton/components';
import { ModalContext } from '@proton/components/components/modalTwo/Modal';
import lockIcon from '@proton/styles/assets/img/meet/lock-icon.png';

import './MeetingLockedModal.scss';

interface MeetingLockedModalProps {
    onClose: () => void;
}

// Wires the message to the dialog's `id` so it becomes the modal's accessible name. With focus
// moving into the dialog on open, screen readers then announce the locked state, which they
// otherwise miss (the dialog had no accessible name).
const MeetingLockedModalContent = ({ onClose }: MeetingLockedModalProps) => {
    const { id } = useContext(ModalContext);

    return (
        <div className="flex flex-column items-center w-full h-full px-6 pb-6 align-items-center justify-end gap-6">
            <img
                className="w-custom h-custom"
                src={lockIcon}
                alt=""
                style={{ '--w-custom': '7.5rem', '--h-custom': '7.5rem' }}
            />
            <div id={id} className="text-center text-3xl text-semibold">
                {c('Info').t`This meeting is locked. Please contact the host to join.`}
            </div>
            <Button
                className="close-meeting-locked-modal-button rounded-full border-none py-4 w-full"
                onClick={onClose}
                size="large"
            >
                {c('Action').t`Close`}
            </Button>
        </div>
    );
};

export const MeetingLockedModal = ({ onClose }: MeetingLockedModalProps) => {
    return (
        <ModalTwo
            open={true}
            className="shadow-none w-custom h-custom border border-norm"
            rootClassName="blurry-backdrop"
            style={{ '--w-custom': '24.5rem', '--h-custom': '24.5rem' }}
        >
            <MeetingLockedModalContent onClose={onClose} />
        </ModalTwo>
    );
};
