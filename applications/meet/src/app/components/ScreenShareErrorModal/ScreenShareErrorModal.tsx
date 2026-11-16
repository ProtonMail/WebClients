import type { ReactNode } from 'react';

import { c } from 'ttag';

import screenCancelImg from '@proton/styles/assets/img/meet/screen-cancel.png';
import warningImg from '@proton/styles/assets/img/meet/warning-icon.svg';

import type { ScreenShareError } from '../../hooks/screenShare/useCurrentScreenShare';
import { ConfirmationModal } from '../ConfirmationModal/ConfirmationModal';

interface ScreenShareErrorContent {
    image: string;
    imageSize: string;
    getTitle: () => string;
    getMessage: () => ReactNode;
    canRetry: boolean;
}

const getScreenRecordingOffMessage = () => {
    const settingsPath = (
        <strong key="settings-path">
            {
                // translator: "System Settings", "Privacy & Security" and "Screen Recording" are Apple's names for the macOS settings. Use Apple's names in your language.
                c('Info').t`System Settings → Privacy & Security → Screen Recording`
            }
        </strong>
    );

    // translator: full sentence is "Turn on Firefox in System Settings → Privacy & Security → Screen Recording. Then restart Firefox and rejoin the call." where the settings path is bold
    return c('Info').jt`Turn on Firefox in ${settingsPath}. Then restart Firefox and rejoin the call.`;
};

const screenShareErrorContents: Record<ScreenShareError, ScreenShareErrorContent> = {
    screenRecordingOff: {
        image: screenCancelImg,
        imageSize: '7.5rem',
        getTitle: () => c('Title').t`Firefox can’t record your screen`,
        getMessage: getScreenRecordingOffMessage,
        canRetry: false,
    },
    nothingToShare: {
        image: screenCancelImg,
        imageSize: '7.5rem',
        getTitle: () => c('Title').t`No screen or window found`,
        getMessage: () => c('Info').t`Open the window you want to share, then try again.`,
        canRetry: true,
    },
    failed: {
        image: warningImg,
        imageSize: '5rem',
        getTitle: () => c('Title').t`Screen share failed`,
        getMessage: () => c('Info').t`Something went wrong. Please try again.`,
        canRetry: true,
    },
};

interface ScreenShareErrorModalProps {
    error: ScreenShareError;
    onRetry: () => void;
    onClose: () => void;
}

export const ScreenShareErrorModal = ({ error, onRetry, onClose }: ScreenShareErrorModalProps) => {
    const { image, imageSize, getTitle, getMessage, canRetry } = screenShareErrorContents[error];
    const closeText = c('Action').t`Close`;

    return (
        <ConfirmationModal
            icon={
                <img
                    className="w-custom h-custom"
                    src={image}
                    alt=""
                    style={{ '--w-custom': imageSize, '--h-custom': imageSize }}
                />
            }
            title={getTitle()}
            message={getMessage()}
            primaryText={canRetry ? c('Action').t`Try again` : closeText}
            primaryButtonClass={canRetry ? 'secondary' : 'tertiary'}
            onPrimaryAction={canRetry ? onRetry : onClose}
            secondaryText={closeText}
            secondaryButtonClass="tertiary"
            onSecondaryAction={canRetry ? onClose : undefined}
            showCloseButton={false}
            onClose={onClose}
        />
    );
};
