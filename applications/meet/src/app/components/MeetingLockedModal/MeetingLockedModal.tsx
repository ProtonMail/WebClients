import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { ModalTwo } from '@proton/components';
import lockIcon from '@proton/styles/assets/img/meet/lock-icon.png';

import './MeetingLockedModal.scss';

interface MeetingLockedModalProps {
    onClose: () => void;
}

export const MeetingLockedModal = ({ onClose }: MeetingLockedModalProps) => {
    return (
        <ModalTwo
            open={true}
            className="shadow-none w-custom h-custom"
            rootClassName="blurry-backdrop"
            style={{ '--w-custom': '24.5rem', '--h-custom': '24.5rem' }}
        >
            <div className="flex flex-column items-center w-full h-full px-6 pb-6 align-items-center justify-end gap-6">
                <img
                    className="w-custom h-custom"
                    src={lockIcon}
                    alt=""
                    style={{ '--w-custom': '7.5rem', '--h-custom': '7.5rem' }}
                />
                <div className="text-center text-3xl text-semibold">
                    {c('Info').t`This meeting is locked. Please contact the host to join.`}
                </div>
                <Button
                    className="close-meeting-locked-modal-button rounded-full border-none py-4 w-full"
                    onClick={onClose}
                    size="large"
                >
                    Close
                </Button>
            </div>
        </ModalTwo>
    );
};
