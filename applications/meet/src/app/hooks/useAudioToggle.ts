import { useLocalParticipant } from '@livekit/components-react';

import { audioQuality } from '../qualityConstants';

export const useAudioToggle = () => {
    const { localParticipant } = useLocalParticipant();

    const toggleAudio = async ({ isEnabled, audioDeviceId }: { isEnabled: boolean; audioDeviceId: string | null }) => {
        const audio = {
            deviceId: { exact: audioDeviceId as string },
            autoGainControl: true,
            echoCancellation: true,
            noiseSuppression: true,
        };

        await localParticipant.setMicrophoneEnabled(
            isEnabled && !!audioDeviceId,
            audioDeviceId ? audio : undefined,
            isEnabled
                ? {
                      audioPreset: {
                          maxBitrate: audioQuality,
                      },
                  }
                : undefined
        );
    };

    return toggleAudio;
};
