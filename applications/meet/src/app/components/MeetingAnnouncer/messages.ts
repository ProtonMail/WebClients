import { c } from 'ttag';

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

    mutedByHost: () => c('Accessibility announcement').t`You have been muted by the host`,

    cameraDisabledByHost: () => c('Accessibility announcement').t`Your camera has been turned off by the host`,

    newChatMessage: (message: string, name?: string) =>
        name
            ? c('Accessibility announcement').t`${name} says: ${message}`
            : c('Accessibility announcement').t`New chat message: ${message}`,

    connectionLost: () => c('Accessibility announcement').t`Connection lost. Reconnecting…`,

    reconnected: () => c('Accessibility announcement').t`Reconnected to the meeting`,

    disconnected: () => c('Accessibility announcement').t`You have been disconnected from the meeting`,
};
