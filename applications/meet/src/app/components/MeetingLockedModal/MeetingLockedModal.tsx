import { c } from 'ttag';

import { isMobile } from '@proton/shared/lib/helpers/browser';
import lockIcon from '@proton/styles/assets/img/meet/lock-icon.png';

import { ConfirmationModal } from '../ConfirmationModal/ConfirmationModal';

interface MeetingLockedModalProps {
    onClose: () => void;
}

export const MeetingLockedModal = ({ onClose }: MeetingLockedModalProps) => {
    return (
        <ConfirmationModal
            icon={
                <img
                    className="mx-auto w-custom h-custom"
                    src={lockIcon}
                    alt=""
                    style={
                        isMobile()
                            ? {
                                  '--w-custom': '3rem',
                                  '--h-custom': '3rem',
                              }
                            : {
                                  '--w-custom': '7.5rem',
                                  '--h-custom': '7.5rem',
                              }
                    }
                />
            }
            title={c('Title').t`Meeting locked`}
            message={c('Info').t`Ask the host to unlock it so you can join.`}
            primaryText={c('Action').t`Close`}
            primaryButtonClass="secondary"
            onPrimaryAction={onClose}
            onClose={onClose}
            showCloseButton={false}
        />
    );
};
