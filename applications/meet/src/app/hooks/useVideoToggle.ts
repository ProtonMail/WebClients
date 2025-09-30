import { useRef, useState } from 'react';

import { useLocalParticipant } from '@livekit/components-react';
import { BackgroundBlur, type BackgroundProcessorOptions } from '@livekit/track-processors';
import type { LocalParticipant } from '@proton-meet/livekit-client';
import { type LocalTrack, Track } from '@proton-meet/livekit-client';

import type { SwitchActiveDevice } from '../types';
import { useParticipantResolution } from './useParticipantResolution';

const backgroundProcessorOptions: BackgroundProcessorOptions = {
    assetPaths: {
        tasksVisionFileSet: '/assets/background-blur',
        modelAssetPath: 'assets/background-blur/selfie_segmenter.tflite',
    },
};

const blur = BackgroundBlur(40, undefined, undefined, backgroundProcessorOptions);

const getVideoTrackPublications = (localParticipant: LocalParticipant) => {
    return [...localParticipant.trackPublications.values()].filter(
        (track) => track.kind === Track.Kind.Video && track.source !== Track.Source.ScreenShare
    );
};

export const useVideoToggle = (activeCameraDeviceId: string, switchActiveDevice: SwitchActiveDevice) => {
    const { isCameraEnabled, localParticipant } = useLocalParticipant();

    const [facingMode, setFacingMode] = useState<'environment' | 'user'>('user');
    const [backgroundBlur, setBackgroundBlur] = useState(false);

    const participantResolution = useParticipantResolution();

    const toggleInProgress = useRef(false);

    const prevEnabled = useRef(false);

    const toggleVideo = async (
        params: {
            isEnabled?: boolean;
            videoDeviceId?: string;
            forceUpdate?: boolean;
            facingMode?: 'environment' | 'user';
            enableBlur?: boolean;
        } = {}
    ) => {
        const {
            isEnabled = prevEnabled.current,
            videoDeviceId = activeCameraDeviceId,
            forceUpdate = false,
            facingMode: customFacingMode,
            enableBlur = backgroundBlur,
        } = params;

        if (toggleInProgress.current) {
            return;
        }

        // In case of unplugging a device LiveKit sets the enabled status to false, but we want to keep the previous state
        prevEnabled.current = isEnabled;

        toggleInProgress.current = true;

        const facingModeDependentOptions = customFacingMode
            ? {
                  resolution: participantResolution.resolution,
                  facingMode: customFacingMode ?? facingMode,
              }
            : {
                  deviceId: { exact: videoDeviceId },
                  resolution: participantResolution.resolution,
              };

        // we don't use deviceId when we use facingMode, we just constrain the facingMode and the resolution
        const videoInfo = facingModeDependentOptions;
        const videoPublishInfo = {
            videoEncoding: participantResolution.encoding,
        };

        const currentVideoTrackPublications = getVideoTrackPublications(localParticipant);

        if (forceUpdate || enableBlur) {
            currentVideoTrackPublications.forEach(async (track) => {
                track.track?.stop();
                await localParticipant.unpublishTrack(track.track as LocalTrack);
            });
        }

        await localParticipant.setCameraEnabled(isEnabled, facingModeDependentOptions, videoPublishInfo);
        await switchActiveDevice('videoinput', videoDeviceId as string);

        const newVideoTrack = getVideoTrackPublications(localParticipant)[0]?.track;

        if ((forceUpdate || enableBlur) && isEnabled && videoInfo) {
            if (enableBlur) {
                await newVideoTrack?.setProcessor(blur);
            }

            await localParticipant.publishTrack(newVideoTrack as LocalTrack, {
                source: Track.Source.Camera,
                ...videoPublishInfo,
            });
        } else {
            await newVideoTrack?.stopProcessor();
        }

        setBackgroundBlur(enableBlur);

        toggleInProgress.current = false;
    };

    const handleRotateCamera = async () => {
        const newFacingMode = facingMode === 'environment' ? 'user' : 'environment';
        setFacingMode(newFacingMode);

        const videoTrack = [...localParticipant.trackPublications.values()].find(
            (item) => item.kind === Track.Kind.Video && item.source !== Track.Source.ScreenShare
        )?.track;

        if (videoTrack) {
            await toggleVideo({
                isEnabled: true,
                forceUpdate: true,
                facingMode: newFacingMode,
            });
        }
    };

    const toggleBackgroundBlur = async () => {
        if (isCameraEnabled) {
            await toggleVideo({ isEnabled: isCameraEnabled, enableBlur: !backgroundBlur });
        } else {
            setBackgroundBlur((prev) => !prev);
        }
    };

    return { toggleVideo, handleRotateCamera, backgroundBlur, toggleBackgroundBlur, isVideoEnabled: isCameraEnabled };
};
