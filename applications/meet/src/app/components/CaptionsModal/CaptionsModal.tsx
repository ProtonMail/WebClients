import { useState } from 'react';

import { c } from 'ttag';

import Checkbox from '@proton/components/components/input/Checkbox';
import { isMobile } from '@proton/shared/lib/helpers/browser';
import liveCaptionsImg from '@proton/styles/assets/img/meet/live-captions.svg';

import { ConfirmationModal } from '../ConfirmationModal/ConfirmationModal';

interface CaptionsModalProps {
    onClose: () => void;
    onConfirm: (dontShowAgain: boolean) => void;
}

export const CaptionsModal = ({ onClose, onConfirm }: CaptionsModalProps) => {
    const [dontShowAgain, setDontShowAgain] = useState(false);

    return (
        <ConfirmationModal
            icon={
                <img
                    src={liveCaptionsImg}
                    className="w-custom h-custom mb-2"
                    alt=""
                    style={
                        isMobile()
                            ? {
                                  '--w-custom': '3rem',
                                  '--h-custom': '3rem',
                              }
                            : {
                                  '--w-custom': '4rem',
                                  '--h-custom': '4rem',
                              }
                    }
                />
            }
            title={c('Info').t`Show live captions?`}
            message={c('Info')
                .t`The captioning service uses meeting audio. Captions are visible only to you and aren’t saved.`}
            primaryText={c('Action').t`Show captions`}
            primaryButtonClass="primary"
            onPrimaryAction={() => onConfirm(dontShowAgain)}
            secondaryText={c('Action').t`Not now`}
            secondaryButtonClass="tertiary"
            onSecondaryAction={onClose}
            onClose={onClose}
            buttonsLayout="row"
            footer={
                <Checkbox
                    id="captions-modal-dont-show-again"
                    checked={dontShowAgain}
                    onChange={(e) => setDontShowAgain(e.target.checked)}
                    className="mt-2"
                >
                    <span className="color-weak ml-2">{c('Label').t`Don’t show this message again`}</span>
                </Checkbox>
            }
        />
    );
};
