import { useRef, useState } from 'react';

import { useLocalParticipant } from '@livekit/components-react';
import type { KrispNoiseFilterProcessor } from '@livekit/krisp-noise-filter';
import { KrispNoiseFilter, isKrispNoiseFilterSupported } from '@livekit/krisp-noise-filter';
import { Track } from 'livekit-client';

import { DEFAULT_DEVICE_ID } from '../constants';
import { audioQuality } from '../qualityConstants';
import type { SwitchActiveDevice } from '../types';
import { isAudioSessionAvailable, restoreIOSAudioQuality, setAudioSessionType } from '../utils/ios-audio-session';

const isAdvancedNoiseFilterSupported = isKrispNoiseFilterSupported();

export const useAudioToggle = (
    activeMicrophoneDeviceId: string,
    switchActiveDevice: SwitchActiveDevice,
    initialAudioState: boolean,
    systemDefaultMicrophone: MediaDeviceInfo
) => {
    const [noiseFilter, setNoiseFilter] = useState(isAdvancedNoiseFilterSupported);
    const { isMicrophoneEnabled, localParticipant } = useLocalParticipant();

    const noiseFilterProcessor = useRef<KrispNoiseFilterProcessor | null>(null);
    const audioContext = useRef<AudioContext | null>(null);
    const trackId = useRef<string | null>(null);

    const toggleInProgress = useRef(false);

    const prevEnabled = useRef<boolean | null>(null);

    const toggleAudio = async (
        params: {
            isEnabled?: boolean;
            audioDeviceId?: string | null;
            enableNoiseFilter?: boolean;
            preserveCache?: boolean;
        } = {}
    ) => {
        const {
            isEnabled = prevEnabled.current ?? initialAudioState,
            audioDeviceId = activeMicrophoneDeviceId,
            enableNoiseFilter = noiseFilter,
            preserveCache,
        } = params;

        const deviceId = audioDeviceId === DEFAULT_DEVICE_ID ? systemDefaultMicrophone.deviceId : audioDeviceId;

        if (toggleInProgress.current || !deviceId) {
            return;
        }

        // In case of unplugging a device LiveKit sets the enabled status to false, but we want to keep the previous state
        prevEnabled.current = isEnabled;

        toggleInProgress.current = true;

        // On iOS Safari, we need to let the system decide which device to use by not specifying a deviceId constraint.
        // The audioSession workaround will ensure the correct external device (AirPods, wired headset) is selected.
        const useIOSWorkaround = isAudioSessionAvailable();

        const audio = {
            ...(useIOSWorkaround ? {} : { deviceId: { exact: deviceId as string } }),
            autoGainControl: true,
            echoCancellation: true,
            noiseSuppression: enableNoiseFilter,
        };

        try {
            // Apply iOS Safari audioSession workaround before enabling microphone
            // This ensures the correct device is selected and audio routing is correct
            if (useIOSWorkaround && isEnabled) {
                setAudioSessionType('auto');
            }

            await localParticipant.setMicrophoneEnabled(isEnabled && !!deviceId, deviceId ? audio : undefined, {
                audioPreset: {
                    maxBitrate: audioQuality,
                },
            });

            if (useIOSWorkaround) {
                if (isEnabled) {
                    setAudioSessionType('play-and-record');
                } else {
                    restoreIOSAudioQuality();
                }
            }

            await switchActiveDevice({
                deviceType: 'audioinput',
                deviceId,
                isSystemDefaultDevice: audioDeviceId === DEFAULT_DEVICE_ID,
                preserveDefaultDevice: !!preserveCache,
            });

            const audioTrack = [...localParticipant.audioTrackPublications.values()].find(
                (item) => item.kind === Track.Kind.Audio && item.source !== Track.Source.ScreenShare && item.audioTrack
            )?.audioTrack;

            if (!audioTrack) {
                return;
            }

            if (enableNoiseFilter && isEnabled && audioDeviceId && isAdvancedNoiseFilterSupported) {
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
