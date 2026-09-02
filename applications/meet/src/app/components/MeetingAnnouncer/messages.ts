import { c } from 'ttag';

import { BRAND_NAME } from '@proton/shared/lib/constants';

export const announcementMessages = {
    participantJoined: (name?: string) =>
        name
            ? c('Accessibility announcement').t`${name} joined the meeting`
            : c('Accessibility announcement').t`A participant joined the meeting`,

    participantLeft: (name?: string) =>
        name
            ? c('Accessibility announcement').t`${name} left the meeting`
            : c('Accessibility announcement').t`A participant left the meeting`,

    handRaised: (name?: string) =>
        name
            ? c('Accessibility announcement').t`${name} raised their hand`
            : c('Accessibility announcement').t`A participant raised their hand`,

    handLowered: (name?: string) =>
        name
            ? c('Accessibility announcement').t`${name} lowered their hand`
            : c('Accessibility announcement').t`A participant lowered their hand`,

    reaction: (emoji: string, name?: string) =>
        name
            ? c('Accessibility announcement').t`${name} reacted with ${emoji}`
            : c('Accessibility announcement').t`A participant reacted with ${emoji}`,

    recordingStarted: () => c('Accessibility announcement').t`Now starting recording`,

    // Remote recordings: carries the consent context, since that modal is silenced for screen readers.
    recordingStartedWithConsent: () =>
        c('Accessibility announcement')
            .t`Recording started. By continuing in the meeting, you acknowledge and consent to being recorded.`,

    // Joining a meeting that is already being recorded; consent context is included since the modal won't appear.
    recordingAlreadyInProgress: () =>
        c('Accessibility announcement')
            .t`This meeting is being recorded. By joining, you acknowledge and consent to being recorded.`,

    recordingStopped: () => c('Accessibility announcement').t`Recording stopped`,

    recordingSaved: () => c('Accessibility announcement').t`Recording saved`,

    mutedByHost: () => c('Accessibility announcement').t`You have been muted by the host`,

    cameraDisabledByHost: () => c('Accessibility announcement').t`Your camera has been turned off by the host`,

    newChatMessage: (message: string, name?: string) =>
        name
            ? c('Accessibility announcement').t`${name} says: ${message}`
            : c('Accessibility announcement').t`New chat message: ${message}`,

    chatMessageContent: (message: string, name?: string) =>
        name ? c('Accessibility announcement').t`${name}: ${message}` : message,

    connectionLost: () => c('Accessibility announcement').t`Connection lost. Reconnecting…`,

    reconnected: () => c('Accessibility announcement').t`Reconnected to the meeting`,

    disconnected: () => c('Accessibility announcement').t`You have been disconnected from the meeting`,

    screenShareStarted: (name?: string) =>
        name
            ? c('Accessibility announcement').t`Screen share started by ${name}`
            : c('Accessibility announcement').t`Screen share started`,

    screenShareStopped: (name?: string) =>
        name
            ? c('Accessibility announcement').t`Screen share stopped by ${name}`
            : c('Accessibility announcement').t`Screen share stopped`,

    // Meeting end countdown (free-tier limit / hard expiry). Distinct strings per threshold avoid
    // run-time plural handling and read more naturally to screen readers.
    meetingEndingIn10Minutes: () => c('Accessibility announcement').t`The meeting will end in 10 minutes`,

    meetingEndingIn5Minutes: () => c('Accessibility announcement').t`The meeting will end in 5 minutes`,

    meetingEndingIn1Minute: () => c('Accessibility announcement').t`The meeting will end in 1 minute`,

    meetingEndingIn15Seconds: () => c('Accessibility announcement').t`The meeting will end in 15 seconds`,

    // Auto-close (you are the only participant). The first message carries the reason since the
    // following thresholds are kept terse.
    autoCloseDisplayed: () =>
        c('Accessibility announcement')
            .t`You are the only participant. The meeting will close in 2 minutes unless someone joins.`,

    autoCloseIn1Minute: () => c('Accessibility announcement').t`The meeting will close in 1 minute`,

    autoCloseIn30Seconds: () => c('Accessibility announcement').t`The meeting will close in 30 seconds`,

    autoCloseIn15Seconds: () => c('Accessibility announcement').t`The meeting will close in 15 seconds`,

    backgroundBlurApplied: () => c('Accessibility announcement').t`Blurred background applied`,

    protonDarkBackgroundApplied: () => c('Accessibility announcement').t`Dark ${BRAND_NAME} background applied`,

    protonLightBackgroundApplied: () => c('Accessibility announcement').t`Light ${BRAND_NAME} background applied`,

    cityBackgroundApplied: () => c('Accessibility announcement').t`European city background applied`,

    officeBackgroundApplied: () => c('Accessibility announcement').t`Blurred office background applied`,

    libraryBackgroundApplied: () => c('Accessibility announcement').t`Library background applied`,

    mountainBackgroundApplied: () => c('Accessibility announcement').t`Mountain landscape background applied`,

    beachBackgroundApplied: () => c('Accessibility announcement').t`Beach landscape background applied`,

    customBackgroundApplied: () => c('Accessibility announcement').t`Your own background applied`,

    customBackgroundRemoved: () => c('Accessibility announcement').t`Background removed`,

    backgroundEffectCleared: () => c('Accessibility announcement').t`Background effect turned off`,

    turnRelayActive: () =>
        c('Accessibility announcement')
            .t`Connected via TURN relay mode due to network restrictions. This may increase latency and affect call quality.`,
};
