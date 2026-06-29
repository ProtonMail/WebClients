import type { ReactNode } from 'react';
import { useEffect } from 'react';

import { useFlag } from '@proton/unleash/useFlag';

import { useAnnouncementSources } from './announcementSources/useAnnouncementSources';
import { getConnectionPhase } from './announcementSources/useConnectionAnnouncements';
import type { ConnectionAnnouncementState } from './types';
import { useSetSuspendNonCritical } from './useAnnounce';

const useSuspendNonCriticalSync = (connectionState: ConnectionAnnouncementState) => {
    const setSuspendNonCritical = useSetSuspendNonCritical();
    const suspendNonCritical = getConnectionPhase(connectionState) !== 'connected';

    useEffect(() => {
        setSuspendNonCritical(suspendNonCritical);
        return () => setSuspendNonCritical(false);
    }, [suspendNonCritical, setSuspendNonCritical]);
};

const AnnouncementSourcesRunner = ({
    connectionState,
    isUsingTurnRelay,
}: {
    connectionState: ConnectionAnnouncementState;
    isUsingTurnRelay: boolean;
}) => {
    useSuspendNonCriticalSync(connectionState);
    useAnnouncementSources({ connectionState, isUsingTurnRelay });
    return null;
};

export type MeetingAnnouncerProps = ConnectionAnnouncementState & {
    isUsingTurnRelay: boolean;
    children: ReactNode;
};

// Drives the announcement sources and connection-based suspension for the meeting subtree. The
// provider itself is mounted higher up (see MeetingAnnouncerProvider in WrappedProtonMeetContainer).
export const MeetingAnnouncer = ({ isUsingTurnRelay, children, ...connectionState }: MeetingAnnouncerProps) => {
    const enableAccessibilityAnnouncements = useFlag('EnableAccessibilityAnnouncements');

    if (!enableAccessibilityAnnouncements) {
        return <>{children}</>;
    }

    return (
        <>
            <AnnouncementSourcesRunner connectionState={connectionState} isUsingTurnRelay={isUsingTurnRelay} />
            {children}
        </>
    );
};
