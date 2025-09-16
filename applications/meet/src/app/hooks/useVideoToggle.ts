import { useRef, useState } from 'react';

import { useLocalParticipant } from '@livekit/components-react';
import { BackgroundBlur, type BackgroundProcessorOptions } from '@livekit/track-processors';
import { type LocalTrack, Track, createLocalVideoTrack } from '@proton-meet/livekit-client';

import { useParticipantResolution } from './useParticipantResolution';

const backgroundProcessorOptions: BackgroundProcessorOptions = {
    assetPaths: {
        tasksVisionFileSet: '/assets/background-blur',
        modelAssetPath: 'assets/background-blur/selfie_segmenter.tflite',
    },
};

const blur = BackgroundBlur(40, undefined, undefined, backgroundProcessorOptions);

export const useVideoToggle = (setIsVideoEnabled: (isEnabled: boolean) => void) => {
    const [facingMode, setFacingMode] = useState<'environment' | 'user'>('user');
    const [backgroundBlur, setBackgroundBlur] = useState(false);

    const { localParticipant } = useLocalParticipant();
    const participantResolution = useParticipantResolution();

    const toggleInProgress = useRef(false);

    const toggleVideo = async ({
        isEnabled,
        videoDeviceId,
        forceUpdate = false,
        facingMode: customFacingMode,
        enableBlur = backgroundBlur,
    }: {
        isEnabled: boolean;
        videoDeviceId: string;
        forceUpdate?: boolean;
        facingMode?: 'environment' | 'user';
        enableBlur?: boolean;
    }) => {
        if (toggleInProgress.current) {
            return;
        }

        toggleInProgress.current = true;

        // we don't use deviceId when we use facingMode, we just constrain the facingMode and the resolution
        const videoInfo = isEnabled
            ? facingMode
                ? {
                      resolution: participantResolution.resolution,
                      facingMode: customFacingMode ?? facingMode,
                  }
                : {
                      deviceId: { exact: videoDeviceId },
                      resolution: participantResolution.resolution,
                  }
            : false;
        const videoPublishInfo = {
            videoEncoding: participantResolution.encoding,
        };

        const videoTrack = [...localParticipant.trackPublications.values()].find(
            (item) => item.kind === Track.Kind.Video && item.source !== Track.Source.ScreenShare
        )?.track;

        if ((forceUpdate || (enableBlur ?? backgroundBlur)) && isEnabled && videoInfo) {
            await localParticipant.unpublishTrack(videoTrack as LocalTrack);

            const newVideoTrack = await createLocalVideoTrack(videoInfo);

            if (enableBlur) {
                await newVideoTrack.setProcessor(blur);
            }

            await localParticipant.publishTrack(newVideoTrack, {
                source: Track.Source.Camera,
                ...videoPublishInfo,
            });
        } else {
            await videoTrack?.stopProcessor();

            await localParticipant.setCameraEnabled(
                !!videoInfo,
                videoInfo ? videoInfo : undefined,
                isEnabled ? videoPublishInfo : undefined
            );
        }

        setBackgroundBlur(enableBlur);

        setIsVideoEnabled(isEnabled);

        toggleInProgress.current = false;
    };

    const handleRotateCamera = async () => {
        const newFacingMode = facingMode === 'environment' ? 'user' : 'environment';
        setFacingMode(newFacingMode);

        const videoTrack = [...localParticipant.trackPublications.values()].find(
            (item) => item.kind === Track.Kind.Video && item.source !== Track.Source.ScreenShare
        )?.track;

        if (videoTrack) {
            const currentVideoDeviceId = videoTrack.mediaStreamTrack.getSettings().deviceId;
            if (currentVideoDeviceId) {
                await toggleVideo({
                    isEnabled: true,
                    forceUpdate: true,
                    videoDeviceId: currentVideoDeviceId,
                    facingMode: newFacingMode,
                });
            }
        }
    };

    const toggleBackgroundBlur = async ({
        isEnabled,
        videoDeviceId,
    }: {
        isEnabled: boolean;
        videoDeviceId: string;
    }) => {
        if (isEnabled) {
            await toggleVideo({ isEnabled: isEnabled, videoDeviceId: videoDeviceId, enableBlur: !backgroundBlur });
        } else {
            setBackgroundBlur((prev) => !prev);
        }
    };

    return { toggleVideo, handleRotateCamera, backgroundBlur, toggleBackgroundBlur };
};
