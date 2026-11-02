import { getParticipantTileAriaLabel } from './getParticipantTileAriaLabel';

const baseParameters = {
    participantName: 'Alice',
    isHost: false,
    isSpeaking: false,
    isMicrophoneOn: false,
    isCameraOn: false,
};

describe('getParticipantTileAriaLabel', () => {
    it('describes a plain participant with microphone muted and camera off', () => {
        expect(getParticipantTileAriaLabel({ ...baseParameters, participantName: 'Bob' })).toBe(
            'Bob, microphone muted, camera off'
        );
    });

    it('adds host after the name', () => {
        expect(getParticipantTileAriaLabel({ ...baseParameters, isHost: true })).toBe(
            'Alice, host, microphone muted, camera off'
        );
    });

    it('adds speaking when the participant is speaking with the microphone on', () => {
        expect(getParticipantTileAriaLabel({ ...baseParameters, isSpeaking: true, isMicrophoneOn: true })).toBe(
            'Alice, speaking, microphone on, camera off'
        );
    });

    it('does not say speaking when the microphone is muted', () => {
        expect(getParticipantTileAriaLabel({ ...baseParameters, isSpeaking: true, isMicrophoneOn: false })).toBe(
            'Alice, microphone muted, camera off'
        );
    });

    it('orders name, host, speaking, microphone and camera', () => {
        expect(
            getParticipantTileAriaLabel({
                participantName: 'Alice',
                isHost: true,
                isSpeaking: true,
                isMicrophoneOn: true,
                isCameraOn: true,
            })
        ).toBe('Alice, host, speaking, microphone on, camera on');
    });
});
