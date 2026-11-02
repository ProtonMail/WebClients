import { c } from 'ttag';

interface ParticipantTileAriaLabelParameters {
    participantName: string;
    isHost: boolean;
    isSpeaking: boolean;
    isMicrophoneOn: boolean;
    isCameraOn: boolean;
}

export const getParticipantTileAriaLabel = ({
    participantName,
    isHost,
    isSpeaking,
    isMicrophoneOn,
    isCameraOn,
}: ParticipantTileAriaLabelParameters): string => {
    const labelParts = [participantName];

    if (isHost) {
        // translator: the participant's role in the meeting (a noun), read by screen readers in a comma-separated list after the name, e.g. "Alice, host, speaking, microphone on, camera off"
        labelParts.push(c('Accessibility').t`host`);
    }

    if (isSpeaking && isMicrophoneOn) {
        // translator: the participant is currently speaking, read by screen readers in a comma-separated list after the name, e.g. "Alice, host, speaking, microphone on, camera off"
        labelParts.push(c('Accessibility').t`speaking`);
    }

    labelParts.push(isMicrophoneOn ? c('Accessibility').t`microphone on` : c('Accessibility').t`microphone muted`);
    labelParts.push(isCameraOn ? c('Accessibility').t`camera on` : c('Accessibility').t`camera off`);

    return labelParts.join(', ');
};
