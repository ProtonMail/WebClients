import { useFlag } from '@proton/unleash/useFlag';

import { MeetingAnnouncerProvider } from './MeetingAnnouncerContext';
import { useAnnouncementSources } from './announcementSources/useAnnouncementSources';
import { getConnectionPhase } from './announcementSources/useConnectionAnnouncements';
import type { ConnectionAnnouncementState } from './types';

const AnnouncementSourcesRunner = ({ connectionState }: { connectionState: ConnectionAnnouncementState }) => {
    useAnnouncementSources(connectionState);
    return null;
};

export type MeetingAnnouncerProps = ConnectionAnnouncementState;

// Mount once inside the meeting providers (Redux + LiveKit room).
export const MeetingAnnouncer = (props: MeetingAnnouncerProps) => {
    const enableAccessibilityAnnouncements = useFlag('EnableAccessibilityAnnouncements');

    if (!enableAccessibilityAnnouncements) {
        return null;
    }

    // While not steadily connected, suppress non-critical chatter. A recoverable reconnect
    // (e.g. STATE_MISMATCH) clears and repopulates the store while this stays mounted, which
    // would otherwise re-announce every existing participant as a fresh join.
    const suspendNonCritical = getConnectionPhase(props) !== 'connected';

    return (
        <MeetingAnnouncerProvider suspendNonCritical={suspendNonCritical}>
            <AnnouncementSourcesRunner connectionState={props} />
        </MeetingAnnouncerProvider>
    );
};
