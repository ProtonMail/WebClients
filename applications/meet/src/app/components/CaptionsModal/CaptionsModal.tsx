import { c } from 'ttag';

import { isMobile } from '@proton/shared/lib/helpers/browser';
import closedCaptionsImg from '@proton/styles/assets/img/meet/closed-captions.svg';

import { ConfirmationModal } from '../ConfirmationModal/ConfirmationModal';

interface CaptionsModalProps {
    onClose: () => void;
    onConfirm: () => void;
}

export const CaptionsModal = ({ onClose, onConfirm }: CaptionsModalProps) => {
    return (
        <ConfirmationModal
            icon={
                <img
                    src={closedCaptionsImg}
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
            title={c('Info').t`Turn on live captions?`}
            message={c('Info')
                .t`To create live captions, the captioning service needs access to the meeting audio. Captions are only visible to you and are not saved.`}
            primaryText={c('Action').t`Enable captions`}
            primaryButtonClass="primary"
            onPrimaryAction={onConfirm}
            secondaryText={c('Action').t`Cancel`}
            secondaryButtonClass="secondary"
            onSecondaryAction={onClose}
            onClose={onClose}
        />
    );
};
