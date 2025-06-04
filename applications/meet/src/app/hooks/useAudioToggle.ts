import { useLocalParticipant } from '@livekit/components-react';

import { audioQualityDetails } from '../qualityConstants';
import { useQualityLevel } from './useQualityLevel';

export const useAudioToggle = () => {
    const quality = useQualityLevel();

    const { localParticipant } = useLocalParticipant();

    const bitrate = audioQualityDetails[quality];

    const toggleAudio = async ({ isEnabled, audioDeviceId }: { isEnabled: boolean; audioDeviceId: string }) => {
        const audio = isEnabled
            ? {
                  deviceId: { exact: audioDeviceId },
                  autoGainControl: true,
                  echoCancellation: true,
                  noiseSuppression: true,
              }
            : false;
        await localParticipant.setMicrophoneEnabled(!!audio, typeof audio !== 'boolean' ? audio : undefined, {
            audioPreset: {
                maxBitrate: bitrate,
            },
        });
    };

    return toggleAudio;
};
