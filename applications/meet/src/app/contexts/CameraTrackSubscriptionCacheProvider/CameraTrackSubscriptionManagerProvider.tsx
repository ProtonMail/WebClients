import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { useRoomContext } from '@livekit/components-react';
import type { Participant, TrackPublication } from 'livekit-client';
import { RoomEvent } from 'livekit-client';

import { PAGE_SIZE, SMALL_SCREEN_PAGE_SIZE } from '@proton/meet/constants';
import { useMeetSelector } from '@proton/meet/store/hooks';
import { selectMeetSettings, selectParticipantsWithDisabledVideos } from '@proton/meet/store/slices/settings';
import { isMobile } from '@proton/shared/lib/helpers/browser';

import { useParticipantQuality } from '../../hooks/useParticipantQuality';
import { useStableCallback } from '../../hooks/useStableCallback';
import type { RegisterCameraTrackFn } from '../../utils/subscriptionManagers/CameraTrackSubscriptionManager';
import { CameraTrackSubscriptionManager } from '../../utils/subscriptionManagers/CameraTrackSubscriptionManager';

interface CameraTrackSubscriptionManagerApi {
    register: RegisterCameraTrackFn;
    unregister(publication: TrackPublication | undefined): void;
    removeForcePin(publication: TrackPublication): void;
}

const CameraTrackSubscriptionManagerContext = createContext<CameraTrackSubscriptionManagerApi | null>(null);

const DEFAULT_CAPACITY = 4 * (isMobile() ? SMALL_SCREEN_PAGE_SIZE : PAGE_SIZE);

export const CameraTrackSubscriptionManagerProvider = ({ children }: { children: ReactNode }) => {
    const room = useRoomContext();
    const { disableVideos } = useMeetSelector(selectMeetSettings);
    const participantsWithDisabledVideos = useMeetSelector(selectParticipantsWithDisabledVideos);
    const participantQuality = useParticipantQuality();

    const [manager, setManager] = useState(() => new CameraTrackSubscriptionManager(DEFAULT_CAPACITY, room));

    useEffect(() => {
        manager.setPolicy({ disableVideos, participantsWithDisabledVideos, participantQuality });
    }, [disableVideos, participantsWithDisabledVideos, participantQuality]);

    // Handle room disconnection - destroy cache and create a new one
    useEffect(() => {
        const handleDisconnected = () => {
            manager.destroy();

            const newManager = new CameraTrackSubscriptionManager(DEFAULT_CAPACITY, room);
            newManager.setPolicy({ disableVideos, participantsWithDisabledVideos, participantQuality });
            newManager.setupReconcileLoop();
            setManager(newManager);
        };

        room.on(RoomEvent.Disconnected, handleDisconnected);
        return () => {
            room.off(RoomEvent.Disconnected, handleDisconnected);
        };
    }, [room, disableVideos, participantsWithDisabledVideos, participantQuality]);

    const cleanupManager = useStableCallback(() => {
        manager.destroy();
    });

    // Cleanup on unmount
    useEffect(() => {
        manager.setupReconcileLoop();

        return () => {
            cleanupManager();
        };
    }, []);

    useEffect(() => {
        const handleTrackUnpublished = (publication: TrackPublication, _participant: Participant) => {
            manager.handleTrackUnpublished(publication);
        };

        room.on(RoomEvent.TrackUnpublished, handleTrackUnpublished);
        return () => {
            room.off(RoomEvent.TrackUnpublished, handleTrackUnpublished);
        };
    }, [room]);

    const register = useCallback<RegisterCameraTrackFn>(
        (publication, participantIdentity, forcePin) => {
            manager.register(publication, participantIdentity, forcePin);
        },
        [manager]
    );

    const unregister = useCallback(
        (publication: TrackPublication | undefined) => {
            manager.unregister(publication);
        },
        [manager]
    );

    const removeForcePin = useCallback(
        (publication: TrackPublication) => {
            manager.removeForcePin(publication);
        },
        [manager]
    );

    const value = useMemo<CameraTrackSubscriptionManagerApi>(
        () => ({ register, unregister, removeForcePin }),
        [register, unregister, removeForcePin]
    );

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
