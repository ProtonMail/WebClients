import { c } from 'ttag';

import type { JoinError } from '@proton/meet/store/slices/uiStateSlice';
import { MEET_APP_NAME } from '@proton/shared/lib/constants';
import blockedImg from '@proton/styles/assets/img/meet/blocked-icon.svg';
import warningImg from '@proton/styles/assets/img/meet/warning-icon.svg';

import { ConfirmationModal } from '../ConfirmationModal/ConfirmationModal';

interface JoinErrorContent {
    image: string;
    getTitle: () => string;
    getMessage: () => string;
    actions: 'retryOrClose' | 'retryOrLeave' | 'close';
}

const getSomethingWentWrongMessage = () => c('Info').t`Something went wrong. Please try again.`;

const joinErrorContents: Record<JoinError, JoinErrorContent> = {
    joinFailed: {
        image: warningImg,
        getTitle: () => c('Title').t`Couldn’t join the meeting`,
        getMessage: getSomethingWentWrongMessage,
        actions: 'retryOrClose',
    },
    startFailed: {
        image: warningImg,
        getTitle: () => c('Title').t`Couldn’t start the meeting`,
        getMessage: getSomethingWentWrongMessage,
        actions: 'retryOrClose',
    },
    meetingOutdated: {
        image: warningImg,
        getTitle: () => c('Title').t`Meeting out of date`,
        getMessage: () => c('Info').t`Ask the host to end the meeting, refresh ${MEET_APP_NAME} and start it again.`,
        actions: 'close',
    },
    deviceClock: {
        image: warningImg,
        getTitle: () => c('Title').t`Incorrect date and time`,
        getMessage: () => c('Info').t`Set your device’s date and time to update automatically, then try again.`,
        actions: 'close',
    },
    wrongPassword: {
        image: warningImg,
        getTitle: () => c('Title').t`Incorrect meeting password`,
        getMessage: () => c('Info').t`Check that you copied the full meeting link and try again.`,
        actions: 'close',
    },
    connectionFailed: {
        image: blockedImg,
        getTitle: () => c('Title').t`Connection failed`,
        getMessage: () =>
            c('Info').t`Check your internet connection and try again. If that doesn’t work, try another browser.`,
        actions: 'retryOrLeave',
    },
};

interface JoinErrorModalProps {
    joinError: JoinError;
    onRetry: () => void;
    onClose: () => void;
    /** Leave is offered only when this is given. */
    onLeave?: () => void;
}

export const JoinErrorModal = ({ joinError, onRetry, onClose, onLeave }: JoinErrorModalProps) => {
    const { image, getTitle, getMessage, actions } = joinErrorContents[joinError];
    const closeText = c('Action').t`Close`;

    const icon = (
        <img className="w-custom h-custom" src={image} alt="" style={{ '--w-custom': '5rem', '--h-custom': '5rem' }} />
    );

    if (actions === 'close') {
        return (
            <ConfirmationModal
                icon={icon}
                title={getTitle()}
                message={getMessage()}
                primaryText={closeText}
                primaryButtonClass="secondary"
                onPrimaryAction={onClose}
                showCloseButton={false}
                onClose={onClose}
            />
        );
    }

    const isLeave = actions === 'retryOrLeave';

    return (
        <ConfirmationModal
            icon={icon}
            title={getTitle()}
            message={getMessage()}
            primaryText={c('Action').t`Try again`}
            primaryButtonClass="secondary"
            onPrimaryAction={onRetry}
            secondaryText={isLeave ? c('Action').t`Leave` : closeText}
            secondaryButtonClass="tertiary"
            onSecondaryAction={isLeave ? onLeave : onClose}
            showCloseButton={false}
            onClose={onClose}
        />
    );
};
