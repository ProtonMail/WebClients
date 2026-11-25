import type { ReactNode } from 'react';

import { c } from 'ttag';

import type { JoinError } from '@proton/meet/store/slices/uiStateSlice';
import { MEET_APP_NAME } from '@proton/shared/lib/constants';
import { isFirefox, isMobile } from '@proton/shared/lib/helpers/browser';
import blockedImg from '@proton/styles/assets/img/meet/blocked-icon.svg';
import lockImg from '@proton/styles/assets/img/meet/lock-icon.png';
import warningImg from '@proton/styles/assets/img/meet/warning-icon.svg';

import { ConfirmationModal } from '../ConfirmationModal/ConfirmationModal';

interface JoinErrorContent {
    image: string;
    getTitle: () => string;
    getMessage: () => ReactNode;
    actions: 'retryOrClose' | 'retryOrLeave' | 'close';
    /** 5rem when not given. */
    getImageSize?: () => string;
}

const getSomethingWentWrongMessage = () => c('Info').t`Something went wrong. Please try again.`;

const getFirefoxPeerConnectionMessage = () => {
    const configPage = <strong key="config-page">about:config</strong>;
    const preference = <strong key="preference">media.peerconnection.enabled</strong>;
    const value = <strong key="value">true</strong>;

    // translator: full sentence is "In Firefox, open about:config and set media.peerconnection.enabled to true." where "about:config", "media.peerconnection.enabled" and "true" are bold and stay in English, as Firefox shows them
    return c('Info').jt`In Firefox, open ${configPage} and set ${preference} to ${value}.`;
};

const getWebRtcUnsupportedMessage = () => (
    <>
        <p className="m-0">
            {c('Info')
                .t`${MEET_APP_NAME} needs WebRTC, which is off or blocked in this browser. Turn it on, turn off extensions that block it, or use another browser.`}
        </p>
        {isFirefox() && <p className="mt-2 mb-0">{getFirefoxPeerConnectionMessage()}</p>}
    </>
);

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
    meetingNotAllowed: {
        image: blockedImg,
        getTitle: () => c('Title').t`Couldn’t start the meeting`,
        getMessage: () => c('Info').t`The host has another meeting in progress.`,
        actions: 'close',
    },
    meetingLocked: {
        image: lockImg,
        getTitle: () => c('Title').t`Meeting locked`,
        getMessage: () => c('Info').t`Ask the host to unlock it so you can join.`,
        actions: 'close',
        getImageSize: () => '7.5rem',
    },
    webRtcUnsupported: {
        image: warningImg,
        getTitle: () => c('Title').t`Browser not supported`,
        getMessage: getWebRtcUnsupportedMessage,
        actions: 'close',
        getImageSize: () => (isMobile() ? '3rem' : '5rem'),
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
    const { image, getTitle, getMessage, actions, getImageSize } = joinErrorContents[joinError];
    const closeText = c('Action').t`Close`;
    const imageSize = getImageSize?.() ?? '5rem';

    const icon = (
        <img
            className="w-custom h-custom"
            src={image}
            alt=""
            style={{ '--w-custom': imageSize, '--h-custom': imageSize }}
        />
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
