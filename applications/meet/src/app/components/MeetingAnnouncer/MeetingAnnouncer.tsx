import type { ReactNode } from 'react';
import { useEffect } from 'react';

import { useSetSuspendNonCritical } from '@proton/components/components/liveAnnouncer/useAnnounce';
import { useMeetSelector } from '@proton/meet/store/hooks';
import { selectIsWebsocketReconnecting } from '@proton/meet/store/slices/connectionSlice';

import { useAnnouncementSources } from './announcementSources/useAnnouncementSources';
import { getConnectionPhase } from './announcementSources/useConnectionAnnouncements';
import type { ConnectionAnnouncementState } from './types';

const useSuspendNonCriticalSync = (connectionState: ConnectionAnnouncementState) => {
    const setSuspendNonCritical = useSetSuspendNonCritical();
    const suspendNonCritical = getConnectionPhase(connectionState) !== 'connected';

    useEffect(() => {
        setSuspendNonCritical(suspendNonCritical);
        return () => setSuspendNonCritical(false);
    }, [suspendNonCritical, setSuspendNonCritical]);
};

const AnnouncementSourcesRunner = ({ connectionState }: { connectionState: ConnectionAnnouncementState }) => {
    useSuspendNonCriticalSync(connectionState);
    useAnnouncementSources({ connectionState });
    return null;
};

export type MeetingAnnouncerProps = Omit<ConnectionAnnouncementState, 'isWebsocketReconnecting'> & {
    children: ReactNode;
};

export const MeetingAnnouncer = ({ children, ...connectionState }: MeetingAnnouncerProps) => {
    const isWebsocketReconnecting = useMeetSelector(selectIsWebsocketReconnecting);

    return (
        <>
            <AnnouncementSourcesRunner connectionState={{ ...connectionState, isWebsocketReconnecting }} />
            {children}
        </>
    );
};
