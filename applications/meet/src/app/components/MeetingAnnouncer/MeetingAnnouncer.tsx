import type { ReactNode } from 'react';
import { useEffect } from 'react';

import { useSetSuspendNonCritical } from '@proton/components/components/liveAnnouncer/useAnnounce';

import type { ConnectionStatus } from '../../hooks/useConnectionStatus/useConnectionStatus';
import { useAnnouncementSources } from './announcementSources/useAnnouncementSources';

const useSuspendNonCriticalSync = (suspendNonCritical: boolean) => {
    const setSuspendNonCritical = useSetSuspendNonCritical();

    useEffect(() => {
        setSuspendNonCritical(suspendNonCritical);
        return () => setSuspendNonCritical(false);
    }, [suspendNonCritical, setSuspendNonCritical]);
};

const AnnouncementSourcesRunner = ({ connectionPhase }: { connectionPhase: ConnectionStatus['phase'] }) => {
    useSuspendNonCriticalSync(connectionPhase !== 'connected');
    useAnnouncementSources({ connectionPhase });
    return null;
};

interface MeetingAnnouncerProps {
    connectionStatus: ConnectionStatus;
    children: ReactNode;
}

export const MeetingAnnouncer = ({ connectionStatus, children }: MeetingAnnouncerProps) => {
    return (
        <>
            <AnnouncementSourcesRunner connectionPhase={connectionStatus.phase} />
            {children}
        </>
    );
};
