import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef } from 'react';

import { useRoomContext } from '@livekit/components-react';
import type { Participant, RemoteTrackPublication, TrackPublication } from 'livekit-client';
import { RoomEvent } from 'livekit-client';

import { isMobile } from '@proton/shared/lib/helpers/browser';

import { PAGE_SIZE, SMALL_SCREEN_PAGE_SIZE } from '../../constants';
import { useParticipantQuality } from '../../hooks/useParticipantQuality';
import { useStuckTrackMonitor } from '../../hooks/useStuckTrackMonitor';
import { useMeetSelector } from '../../store/hooks';
import { selectMeetSettings, selectParticipantsWithDisabledVideos } from '../../store/slices/settings';
import { checkVideoTrackStats } from '../../utils/checkVideoTrackStats';
import type { RegisterCameraTrackFn } from './CameraTrackSubscriptionCache';
import { CameraTrackSubscriptionCache } from './CameraTrackSubscriptionCache';

interface CameraTrackSubscriptionCacheApi {
    register: RegisterCameraTrackFn;
    unregister(publication: TrackPublication | undefined): void;
}

const CameraTrackSubscriptionCacheContext = createContext<CameraTrackSubscriptionCacheApi | null>(null);

const DEFAULT_CAPACITY = 4 * (isMobile() ? SMALL_SCREEN_PAGE_SIZE : PAGE_SIZE);
const STUCK_CAMERA_CHECK_INTERVAL_MS = 7000;
const MIN_EXPECTED_FRAMES = 1;

export const CameraTrackSubscriptionCacheProvider = ({ children }: { children: ReactNode }) => {
    const room = useRoomContext();
    const { disableVideos } = useMeetSelector(selectMeetSettings);
    const participantsWithDisabledVideos = useMeetSelector(selectParticipantsWithDisabledVideos);
    const participantQuality = useParticipantQuality();

    const cacheRef = useRef<CameraTrackSubscriptionCache>(new CameraTrackSubscriptionCache(DEFAULT_CAPACITY));

    useEffect(() => {
        cacheRef.current.setPolicy({ disableVideos, participantsWithDisabledVideos, participantQuality });
    }, [disableVideos, participantsWithDisabledVideos, participantQuality]);

    // Handle room disconnection - destroy cache and create a new one
    useEffect(() => {
        const handleDisconnected = () => {
            cacheRef.current?.destroy();
            cacheRef.current = new CameraTrackSubscriptionCache(DEFAULT_CAPACITY);
            cacheRef.current.setPolicy({ disableVideos, participantsWithDisabledVideos, participantQuality });
        };

        room.on(RoomEvent.Disconnected, handleDisconnected);
        return () => {
            room.off(RoomEvent.Disconnected, handleDisconnected);
        };
    }, [room, disableVideos, participantsWithDisabledVideos, participantQuality]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            cacheRef.current?.destroy();
        };
    }, []);

    const resetVideoTrack = useCallback(async (publication: RemoteTrackPublication) => {
        await cacheRef.current?.resetQueueManagedVideoTrack(publication);
    }, []);

    useStuckTrackMonitor({
        checkIntervalMs: STUCK_CAMERA_CHECK_INTERVAL_MS,
        minExpectedDelta: MIN_EXPECTED_FRAMES,
        getTracksToMonitor: () => cacheRef.current?.getQueueManagedTracksToMonitor() ?? [],
        checkTrackStats: checkVideoTrackStats,
        resetTrack: resetVideoTrack,
    });

    useEffect(() => {
        const handleTrackUnpublished = (publication: TrackPublication, _participant: Participant) => {
            cacheRef.current?.handleTrackUnpublished(publication);
        };

        room.on(RoomEvent.TrackUnpublished, handleTrackUnpublished);
        return () => {
            room.off(RoomEvent.TrackUnpublished, handleTrackUnpublished);
        };
    }, [room]);

    const register = useCallback<RegisterCameraTrackFn>((publication, participantIdentity) => {
        cacheRef.current.register(publication, participantIdentity);
    }, []);

    const unregister = useCallback((publication: TrackPublication | undefined) => {
        cacheRef.current?.unregister(publication);
    }, []);

    const value = useMemo<CameraTrackSubscriptionCacheApi>(() => ({ register, unregister }), [register, unregister]);

    return (
        <CameraTrackSubscriptionCacheContext.Provider value={value}>
            {children}
        </CameraTrackSubscriptionCacheContext.Provider>
    );
};

export const useCameraTrackSubscriptionCache = () => {
    const ctx = useContext(CameraTrackSubscriptionCacheContext);
    if (!ctx) {
        throw new Error('useCameraTrackSubscriptionCache must be used within CameraTrackSubscriptionCacheProvider');
    }
    return ctx;
};
