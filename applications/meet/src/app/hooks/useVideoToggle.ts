import { useRef, useState } from 'react';

import { useLocalParticipant } from '@livekit/components-react';
import { type LocalTrack, Track } from '@proton-meet/livekit-client';

import { useParticipantResolution } from './useParticipantResolution';

export const useVideoToggle = (setIsVideoEnabled: (isEnabled: boolean) => void) => {
    const [facingMode, setFacingMode] = useState<'environment' | 'user'>('user');
    const { localParticipant } = useLocalParticipant();
    const participantResolution = useParticipantResolution();

    const toggleInProgress = useRef(false);

    const toggleVideo = async ({
        isEnabled,
        videoDeviceId,
        forceUpdate = false,
        facingMode: customFacingMode,
    }: {
        isEnabled: boolean;
        videoDeviceId: string;
        forceUpdate?: boolean;
        facingMode?: 'environment' | 'user';
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

        if (forceUpdate && isEnabled) {
            await localParticipant.unpublishTrack(videoTrack as LocalTrack);

            await localParticipant.setCameraEnabled(
                !!videoInfo,
                videoInfo ? videoInfo : undefined,
                isEnabled ? videoPublishInfo : undefined
            );
        } else {
            await localParticipant.setCameraEnabled(
                !!videoInfo,
                videoInfo ? videoInfo : undefined,
                isEnabled ? videoPublishInfo : undefined
            );
        }

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

    return { toggleVideo, handleRotateCamera };
};
