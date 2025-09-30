import { useRef, useState } from 'react';

import { useLocalParticipant } from '@livekit/components-react';
import type { KrispNoiseFilterProcessor } from '@livekit/krisp-noise-filter';
import { KrispNoiseFilter } from '@livekit/krisp-noise-filter';
import { Track } from '@proton-meet/livekit-client';

import { audioQuality } from '../qualityConstants';
import type { SwitchActiveDevice } from '../types';

export const useAudioToggle = (activeMicrophoneDeviceId: string, switchActiveDevice: SwitchActiveDevice) => {
    const [noiseFilter, setNoiseFilter] = useState(true);
    const { isMicrophoneEnabled, localParticipant } = useLocalParticipant();

    const noiseFilterProcessor = useRef<KrispNoiseFilterProcessor | null>(null);
    const audioContext = useRef<AudioContext | null>(null);
    const trackId = useRef<string | null>(null);

    const toggleInProgress = useRef(false);

    const prevEnabled = useRef(false);

    const toggleAudio = async (
        params: {
            isEnabled?: boolean;
            audioDeviceId?: string | null;
            enableNoiseFilter?: boolean;
        } = {}
    ) => {
        const {
            isEnabled = prevEnabled.current,
            audioDeviceId = activeMicrophoneDeviceId,
            enableNoiseFilter = noiseFilter,
        } = params;

        if (toggleInProgress.current || !audioDeviceId) {
            return;
        }

        // In case of unplugging a device LiveKit sets the enabled status to false, but we want to keep the previous state
        prevEnabled.current = isEnabled;

        toggleInProgress.current = true;

        const audio = {
            deviceId: { exact: audioDeviceId as string },
            autoGainControl: true,
            echoCancellation: true,
            noiseSuppression: false,
        };

        try {
            await localParticipant.setMicrophoneEnabled(
                isEnabled && !!audioDeviceId,
                audioDeviceId ? audio : undefined,
                {
                    audioPreset: {
                        maxBitrate: audioQuality,
                    },
                }
            );

            await switchActiveDevice('audioinput', audioDeviceId);

            const audioTrack = [...localParticipant.audioTrackPublications.values()].find(
                (item) => item.kind === Track.Kind.Audio && item.source !== Track.Source.ScreenShare && item.audioTrack
            )?.audioTrack;

            if (!audioTrack) {
                return;
            }

            if (enableNoiseFilter && isEnabled && audioDeviceId) {
                if (trackId.current === audioTrack.id) {
                    await noiseFilterProcessor.current?.setEnabled(true);
                } else {
                    trackId.current = audioTrack.id;

                    noiseFilterProcessor.current = KrispNoiseFilter();
                    // @ts-ignore - webkitAudioContext is not available in all browsers
                    audioContext.current = new (window.AudioContext || window.webkitAudioContext)();

                    await audioTrack?.setAudioContext(audioContext.current);
                    await audioTrack?.setProcessor(noiseFilterProcessor.current);
                }
            } else {
                await noiseFilterProcessor.current?.setEnabled(false);
            }

            setNoiseFilter(enableNoiseFilter);
        } catch (error) {
            throw error;
        } finally {
            toggleInProgress.current = false;
        }
    };

    const toggleNoiseFilter = async () => {
        if (isMicrophoneEnabled) {
            await toggleAudio({
                isEnabled: isMicrophoneEnabled,
                audioDeviceId: activeMicrophoneDeviceId,
                enableNoiseFilter: !noiseFilter,
            });
        } else {
            setNoiseFilter((prev) => !prev);
        }
    };

    return { toggleAudio, noiseFilter, toggleNoiseFilter, isAudioEnabled: isMicrophoneEnabled };
};
