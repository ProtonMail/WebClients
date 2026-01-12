import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useLocalParticipant, useRoomContext } from '@livekit/components-react';
import { useKrispNoiseFilter } from '@livekit/components-react/krisp';
import { isKrispNoiseFilterSupported } from '@livekit/krisp-noise-filter';
import { ConnectionState, RoomEvent, Track } from 'livekit-client';
import throttle from 'lodash/throttle';

import { DEFAULT_DEVICE_ID } from '../constants';
import { audioQuality } from '../qualityConstants';
import type { SwitchActiveDevice } from '../types';
import { isAudioSessionAvailable, setAudioSessionType } from '../utils/ios-audio-session';

const isAdvancedNoiseFilterSupported = isKrispNoiseFilterSupported();

export const useAudioToggle = (
    activeMicrophoneDeviceId: string,
    switchActiveDevice: SwitchActiveDevice,
    initialAudioState: boolean,
    systemDefaultMicrophone: MediaDeviceInfo
) => {
    const { isMicrophoneEnabled, localParticipant } = useLocalParticipant();

    const [initialNoiseFilterState, setInitialNoiseFilterState] = useState(true);

    const { isNoiseFilterEnabled, setNoiseFilterEnabled } = useKrispNoiseFilter();

    const toggleInProgress = useRef(false);
    const currentDeviceId = useRef<string | null>(null);

    const room = useRoomContext();

    useEffect(() => {
        const activateNoiseFilter = async () => {
            if (isAdvancedNoiseFilterSupported && initialNoiseFilterState) {
                await setNoiseFilterEnabled(true);
            }
        };
        room.on(RoomEvent.Connected, activateNoiseFilter);

        return () => {
            room.off(RoomEvent.Connected, activateNoiseFilter);
        };
    }, [room, initialNoiseFilterState]);

    const getCurrentPublication = useCallback(() => {
        return [...room.localParticipant.audioTrackPublications.values()].find(
            (item) =>
                item.kind === Track.Kind.Audio &&
                item.source !== Track.Source.ScreenShare &&
                item.source !== Track.Source.ScreenShareAudio &&
                item.audioTrack
        );
    }, [room]);

    const toggleAudio = useCallback(
        async (
            params: {
                isEnabled?: boolean;
                audioDeviceId?: string | null;
                preserveCache?: boolean;
            } = {}
        ) => {
            // Get current mute state from the actual track (more reliable than a ref)
            const currentAudioPublication = getCurrentPublication();
            const currentMuteState = currentAudioPublication?.isMuted ?? !initialAudioState;

            const {
                isEnabled = !currentMuteState, // Use actual track state, fallback to initialAudioState if no track exists yet
                audioDeviceId = activeMicrophoneDeviceId,
                preserveCache,
            } = params;

            const deviceId = audioDeviceId === DEFAULT_DEVICE_ID ? systemDefaultMicrophone.deviceId : audioDeviceId;

            if (toggleInProgress.current || !deviceId) {
                return;
            }

            toggleInProgress.current = true;

            // On iOS Safari, we need to let the system decide which device to use by not specifying a deviceId constraint.
            // The audioSession workaround will ensure the correct external device (AirPods, wired headset) is selected.
            const useIOSWorkaround = isAudioSessionAvailable();

            const audio = {
                ...(useIOSWorkaround ? {} : { deviceId: { exact: deviceId as string } }),
                echoCancellation: { ideal: true },
                autoGainControl: { ideal: true },
                noiseSuppression: isAdvancedNoiseFilterSupported ? false : isNoiseFilterEnabled,
                channelCount: { ideal: 1 },
            };

            try {
                // Get existing audio track and publication
                const audioPublication = getCurrentPublication();
                const audioTrack = audioPublication?.audioTrack;

                // Check if we're just toggling mute state (not changing devices or noise filter settings)
                const isDeviceChanging = currentDeviceId.current !== deviceId;
                const isJustTogglingMute = audioTrack && !isDeviceChanging;

                if (isJustTogglingMute) {
                    // Fast path: just mute/unmute the existing track
                    if (isEnabled) {
                        await audioTrack.unmute();
                    } else {
                        await audioTrack.mute();
                    }
                } else {
                    // Need to recreate track (device change, noise filter change, or no track exists)
                    // Apply iOS Safari audioSession workaround before enabling microphone
                    // This ensures the correct device is selected and audio routing is correct
                    if (useIOSWorkaround) {
                        setAudioSessionType('auto');
                    }

                    // Always create and publish the track (even if we want it muted)
                    // This keeps iOS audio playback working and enables fast unmute
                    await localParticipant.setMicrophoneEnabled(true, audio, {
                        audioPreset: {
                            maxBitrate: audioQuality,
                        },
                    });

                    if (useIOSWorkaround) {
                        setAudioSessionType('play-and-record');
                    }

                    currentDeviceId.current = deviceId;

                    // Now mute/unmute the newly created track based on desired state
                    const newAudioPublication = [...localParticipant.audioTrackPublications.values()].find(
                        (item) => item.kind === Track.Kind.Audio && item.source !== Track.Source.ScreenShare
                    );
                    const newAudioTrack = newAudioPublication?.audioTrack;

                    if (newAudioTrack) {
                        if (isEnabled) {
                            await newAudioTrack.unmute();
                        } else {
                            await newAudioTrack.mute();
                        }
                    }
                }

                await switchActiveDevice({
                    deviceType: 'audioinput',
                    deviceId,
                    isSystemDefaultDevice: audioDeviceId === DEFAULT_DEVICE_ID,
                    preserveDefaultDevice: !!preserveCache,
                });

                const currentAudioTrack = [...localParticipant.audioTrackPublications.values()].find(
                    (item) =>
                        item.kind === Track.Kind.Audio && item.source !== Track.Source.ScreenShare && item.audioTrack
                )?.audioTrack;

                if (!currentAudioTrack) {
                    return;
                }
            } catch (error) {
                throw error;
            } finally {
                toggleInProgress.current = false;
            }
        },
        [
            activeMicrophoneDeviceId,
            initialAudioState,
            localParticipant,
            isNoiseFilterEnabled,
            switchActiveDevice,
            getCurrentPublication,
        ]
    );

    const toggleNoiseFilter = async () => {
        if (room.state === ConnectionState.Connected) {
            await setNoiseFilterEnabled(!isNoiseFilterEnabled);
        } else {
            setInitialNoiseFilterState((prev) => !prev);
        }
    };

    // Check actual mute state, not just publication state
    const audioPublication = [...localParticipant.audioTrackPublications.values()].find(
        (item) => item.kind === Track.Kind.Audio && item.source !== Track.Source.ScreenShare
    );

    // If track exists but is muted, we're effectively "disabled"
    const isAudioEnabled = isMicrophoneEnabled && !audioPublication?.isMuted;

    const throttledToggleAudio = useMemo(
        () => throttle(toggleAudio, 750, { leading: true, trailing: true }),
        [toggleAudio]
    );

    return {
        toggleAudio: throttledToggleAudio,
        noiseFilter: room.state === ConnectionState.Connected ? isNoiseFilterEnabled : initialNoiseFilterState,
        toggleNoiseFilter,
        isAudioEnabled,
    };
};
