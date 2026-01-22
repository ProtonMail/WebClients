import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef } from 'react';

import { useRoomContext } from '@livekit/components-react';
import type { Participant, TrackPublication } from 'livekit-client';
import { RoomEvent } from 'livekit-client';

import { isMobile } from '@proton/shared/lib/helpers/browser';

import { PAGE_SIZE, SMALL_SCREEN_PAGE_SIZE } from '../../constants';
import { useParticipantQuality } from '../../hooks/useParticipantQuality';
import { useMeetSelector } from '../../store/hooks';
import { selectMeetSettings, selectParticipantsWithDisabledVideos } from '../../store/slices/settings';
import type { RegisterCameraTrackFn } from '../../utils/subscriptionManagers/CameraTrackSubscriptionManager';
import { CameraTrackSubscriptionManager } from '../../utils/subscriptionManagers/CameraTrackSubscriptionManager';

interface CameraTrackSubscriptionManagerApi {
    register: RegisterCameraTrackFn;
    unregister(publication: TrackPublication | undefined): void;
}

const CameraTrackSubscriptionManagerContext = createContext<CameraTrackSubscriptionManagerApi | null>(null);

const DEFAULT_CAPACITY = 4 * (isMobile() ? SMALL_SCREEN_PAGE_SIZE : PAGE_SIZE);

export const CameraTrackSubscriptionManagerProvider = ({ children }: { children: ReactNode }) => {
    const room = useRoomContext();
    const { disableVideos } = useMeetSelector(selectMeetSettings);
    const participantsWithDisabledVideos = useMeetSelector(selectParticipantsWithDisabledVideos);
    const participantQuality = useParticipantQuality();

    const managerRef = useRef(new CameraTrackSubscriptionManager(DEFAULT_CAPACITY, room));

    useEffect(() => {
        managerRef.current.setPolicy({ disableVideos, participantsWithDisabledVideos, participantQuality });
    }, [disableVideos, participantsWithDisabledVideos, participantQuality]);

    // Handle room disconnection - destroy cache and create a new one
    useEffect(() => {
        const handleDisconnected = () => {
            managerRef.current?.destroy();
            managerRef.current = new CameraTrackSubscriptionManager(DEFAULT_CAPACITY, room);
            managerRef.current.setPolicy({ disableVideos, participantsWithDisabledVideos, participantQuality });
        };

        room.on(RoomEvent.Disconnected, handleDisconnected);
        return () => {
            room.off(RoomEvent.Disconnected, handleDisconnected);
        };
    }, [room, disableVideos, participantsWithDisabledVideos, participantQuality]);

    // Cleanup on unmount
    useEffect(() => {
        managerRef.current?.setupReconcileLoop();
        return () => {
            managerRef.current?.destroy();
        };
    }, []);

    useEffect(() => {
        const handleTrackUnpublished = (publication: TrackPublication, _participant: Participant) => {
            managerRef.current?.handleTrackUnpublished(publication);
        };

        room.on(RoomEvent.TrackUnpublished, handleTrackUnpublished);
        return () => {
            room.off(RoomEvent.TrackUnpublished, handleTrackUnpublished);
        };
    }, [room]);

    const register = useCallback<RegisterCameraTrackFn>((publication, participantIdentity) => {
        managerRef.current.register(publication, participantIdentity);
    }, []);

    const unregister = useCallback((publication: TrackPublication | undefined) => {
        managerRef.current?.unregister(publication);
    }, []);

    const value = useMemo<CameraTrackSubscriptionManagerApi>(() => ({ register, unregister }), [register, unregister]);

    return (
        <CameraTrackSubscriptionManagerContext.Provider value={value}>
            {children}
        </CameraTrackSubscriptionManagerContext.Provider>
    );
};

export const useCameraTrackSubscriptionManager = () => {
    const ctx = useContext(CameraTrackSubscriptionManagerContext);
    if (!ctx) {
        throw new Error('useCameraTrackSubscriptionManager must be used within CameraTrackSubscriptionManagerProvider');
    }
    return ctx;
};
