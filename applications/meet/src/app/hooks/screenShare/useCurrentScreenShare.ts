import { useEffect } from 'react';

import { supportsScreenSharing } from '@livekit/components-core';
import { useRoomContext } from '@livekit/components-react';
import type { RemoteTrackPublication } from 'livekit-client';
import { RoomEvent, Track } from 'livekit-client';
import { c } from 'ttag';

import { useNotifications } from '@proton/app-context/useNotifications';
import { useMeetErrorReporting } from '@proton/meet/hooks/useMeetErrorReporting';
import { useMeetDispatch } from '@proton/meet/store/hooks';
import { showPermissionsModal } from '@proton/meet/store/slices/deviceManagementSlice';
import { PermissionsModalType } from '@proton/meet/store/slices/deviceManagementSlice/types';
import { updateParticipantScreenShare } from '@proton/meet/store/slices/screenShareStatusSlice';
import { isChrome, isMobile, isSafari, isWindows } from '@proton/shared/lib/helpers/browser';
import { isElectronApp } from '@proton/shared/lib/helpers/desktop';
import { useFlag } from '@proton/unleash/useFlag';

import { screenShareQuality } from '../../qualityConstants';
import { findScreenShare } from '../../utils/findScreenShare';
import { useStableCallback } from '../useStableCallback';
import { useScreenShareRoomEvents } from './useScreenShareRoomEvents';
import { useScreenShareTrack } from './useScreenShareTrack';

export function useCurrentScreenShare({
    stopPiP,
    startPiP,
    preparePictureInPicture,
}: {
    stopPiP: () => void;
    startPiP: () => void;
    preparePictureInPicture: () => void;
}) {
    const isMeetEnableScreenShareAudio = useFlag('MeetEnableScreenShareAudio');

    const dispatch = useMeetDispatch();
    const { reportMeetError } = useMeetErrorReporting();

    const notifications = useNotifications();

    const room = useRoomContext();

    const screenShareTrack = useScreenShareTrack();

    const stopScreenShare = useStableCallback(() => {
        stopPiP();
        void room.localParticipant.setScreenShareEnabled(false);
    });

    useScreenShareRoomEvents(() => {
        dispatch(updateParticipantScreenShare(findScreenShare(room)?.participantIdentity ?? null));
    });

    const startScreenShare = useStableCallback(async () => {
        const start = performance.now();
        try {
            const isNotSupported = isMobile() || !supportsScreenSharing();

            if (isNotSupported) {
                notifications.createNotification({
                    type: 'info',
                    text: isMobile()
                        ? c('Error').t`Screen share is not supported on mobile browsers`
                        : c('Error').t`Screen share is not supported on your device`,
                });

                return;
            }

            preparePictureInPicture();

            // In Safari we need to start PiP before setting the screen share to not lose user gesture
            if (isSafari()) {
                startPiP();
            }

            await room.localParticipant.setScreenShareEnabled(
                true,
                {
                    audio:
                        isMeetEnableScreenShareAudio && !(isElectronApp && isWindows())
                            ? {
                                  restrictOwnAudio: true,
                              }
                            : false,
                    systemAudio:
                        isMeetEnableScreenShareAudio && !(isElectronApp && isWindows()) ? 'include' : undefined,
                    selfBrowserSurface: 'exclude',
                    contentHint: 'detail',
                    resolution: {
                        width: screenShareQuality.resolution.width,
                        height: screenShareQuality.resolution.height,
                        frameRate: screenShareQuality.encoding.maxFramerate,
                    },
                },
                { simulcast: false, degradationPreference: 'maintain-resolution' }
            );

            if (!isSafari()) {
                startPiP();
            }
        } catch (err: any) {
            const end = performance.now();
            const arePermissionsBlocked = end - start < 300;

            stopPiP();

            if (
                err.message === 'Permission denied by user' ||
                err.message ===
                    'The request is not allowed by the user agent or the platform in the current context.' ||
                (err.message === 'Could not start video source' && isElectronApp)
            ) {
                if (arePermissionsBlocked && !isChrome() && !isElectronApp) {
                    dispatch(
                        showPermissionsModal({ modal: PermissionsModalType.PERMISSIONS_BLOCKED_SCREEN_SHARE_MODAL })
                    );
                }
                return;
            }

            if (
                err.message === 'The object can not be found here.' ||
                err.message ===
                    'The request is not allowed by the user agent or the platform in the current context, possibly because the user denied permission.'
            ) {
                notifications.createNotification({
                    type: 'error',
                    text: c('Error').t`Please allow screen sharing in your system permissions, then try again`,
                });
            } else {
                notifications.createNotification({
                    type: 'error',
                    text: c('Error').t`Failed to start screen share`,
                });
            }

            reportMeetError(`useCurrentScreenShare.startScreenShare: ${err.message}`, err);
        }
    });

    useEffect(() => {
        if (!screenShareTrack) {
            return;
        }

        screenShareTrack.on('ended', stopPiP);

        return () => {
            screenShareTrack.off('ended', stopPiP);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [screenShareTrack]);

    useEffect(() => {
        const subscribeToExistingScreenShares = () => {
            for (const participant of room.remoteParticipants.values()) {
                for (const publication of participant.trackPublications.values()) {
                    if (publication.kind === Track.Kind.Video && publication.source === Track.Source.ScreenShare) {
                        publication.setSubscribed(true);
                        publication.setEnabled(true);
                    }
                }
            }
        };

        subscribeToExistingScreenShares();

        // Subscribe to new screen shares as they're published
        const handleTrackPublished = (publication: RemoteTrackPublication) => {
            if (publication.kind === Track.Kind.Video && publication.source === Track.Source.ScreenShare) {
                publication.setSubscribed(true);
                publication.setEnabled(true);
            }
        };

        room.on('trackPublished', handleTrackPublished);
        room.on(RoomEvent.Connected, subscribeToExistingScreenShares);
        room.on(RoomEvent.Reconnected, subscribeToExistingScreenShares);

        return () => {
            room.off('trackPublished', handleTrackPublished);
            room.off(RoomEvent.Connected, subscribeToExistingScreenShares);
            room.off(RoomEvent.Reconnected, subscribeToExistingScreenShares);
        };
    }, [room]);

    return {
        stopScreenShare,
        startScreenShare,
    };
}
