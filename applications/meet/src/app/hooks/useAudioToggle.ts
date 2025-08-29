import { useLocalParticipant } from '@livekit/components-react';

import { audioQualityDetails } from '../qualityConstants';
import { useQualityLevel } from './useQualityLevel';

export const useAudioToggle = () => {
    const quality = useQualityLevel();

    const { localParticipant } = useLocalParticipant();

    const bitrate = audioQualityDetails[quality];

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
                          maxBitrate: bitrate,
                      },
                  }
                : undefined
        );
    };

    return toggleAudio;
};
