import { useEffect, useRef } from 'react';

import { useMeetSelector } from '@proton/meet/store/hooks';
import { selectParticipantDecryptedNameMap } from '@proton/meet/store/slices/meetingInfo';

import { RAISE_HAND_EMOJI } from '../../../constants';
import { announcementMessages } from '../messages';
import { useAnnounce } from '../useAnnounce';

// Raise-hand reactions are excluded; they are handled by useHandRaiseAnnouncements.
export const useReactionAnnouncements = () => {
    const announce = useAnnounce();

    const activeReactions = useMeetSelector((state) => state.meetingChatAndReactions.activeReactions);
    const nameMap = useMeetSelector(selectParticipantDecryptedNameMap);

    // identity -> last announced timestamp; null until first run so existing reactions are not re-announced.
    const seenRef = useRef<Map<string, number> | null>(null);

    useEffect(() => {
        if (seenRef.current === null) {
            seenRef.current = new Map(
                Object.entries(activeReactions).map(([identity, reaction]) => [identity, reaction.timestamp])
            );
            return;
        }

        const seen = seenRef.current;
        for (const [identity, reaction] of Object.entries(activeReactions)) {
            if (seen.get(identity) === reaction.timestamp) {
                continue;
            }
            seen.set(identity, reaction.timestamp);

            if (reaction.emoji === RAISE_HAND_EMOJI) {
                continue;
            }

            announce(announcementMessages.reaction(reaction.emoji, nameMap[identity]), {
                dedupeKey: `reaction-${identity}-${reaction.timestamp}`,
            });
        }
    }, [activeReactions, nameMap, announce]);
};
