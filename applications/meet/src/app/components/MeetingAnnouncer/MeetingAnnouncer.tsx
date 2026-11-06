import type { ReactNode } from 'react';
import { useEffect } from 'react';

import { LiveAnnouncerProvider } from '@proton/components/components/liveAnnouncer/LiveAnnouncerProvider';
import { useSetSuspendNonCritical } from '@proton/components/components/liveAnnouncer/useAnnounce';
import { useMeetSelector } from '@proton/meet/store/hooks';
import { selectIsWebsocketReconnecting } from '@proton/meet/store/slices/connectionSlice';
import { useFlag } from '@proton/unleash/useFlag';

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

// Mount once around the meeting subtree (inside the Redux + LiveKit room providers). When the
// accessibility flag is off, no context is provided so `useAnnounce` becomes a no-op.
export const MeetingAnnouncerProvider = ({ children }: { children: ReactNode }) => {
    const enableAccessibilityAnnouncements = useFlag('EnableAccessibilityAnnouncements');

    if (!enableAccessibilityAnnouncements) {
        return <>{children}</>;
    }

    return <LiveAnnouncerProvider>{children}</LiveAnnouncerProvider>;
};

export type MeetingAnnouncerProps = Omit<ConnectionAnnouncementState, 'isWebsocketReconnecting'> & {
    children: ReactNode;
};

// Drives the announcement sources and connection-based suspension for the meeting subtree. The
// provider itself is mounted higher up (see MeetingAnnouncerProvider in WrappedProtonMeetContainer).
export const MeetingAnnouncer = ({ children, ...connectionState }: MeetingAnnouncerProps) => {
    const enableAccessibilityAnnouncements = useFlag('EnableAccessibilityAnnouncements');
    const isWebsocketReconnecting = useMeetSelector(selectIsWebsocketReconnecting);

    if (!enableAccessibilityAnnouncements) {
        return <>{children}</>;
    }

    return (
        <>
            <AnnouncementSourcesRunner connectionState={{ ...connectionState, isWebsocketReconnecting }} />
            {children}
        </>
    );
};
