import { useLocalParticipant } from '@livekit/components-react';
import type { LocalTrack } from '@proton-meet/livekit-client';
import { Track } from '@proton-meet/livekit-client';

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

        const audioTrack = [...localParticipant.trackPublications.values()].find(
            (item) => item.kind === Track.Kind.Audio && item.source === Track.Source.Microphone
        )?.track;

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

        if (!isEnabled) {
            await localParticipant.unpublishTrack(audioTrack as LocalTrack);
        }
    };

    return toggleAudio;
};
