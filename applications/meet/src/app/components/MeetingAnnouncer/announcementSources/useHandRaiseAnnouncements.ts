import { useEffect, useRef } from 'react';

import { useMeetSelector } from '@proton/meet/store/hooks';
import { selectRaisedHands } from '@proton/meet/store/slices/chatAndReactionsSlice';
import { selectParticipantDecryptedNameMap } from '@proton/meet/store/slices/meetingInfo';

import { announcementMessages } from '../messages';
import { useAnnounce } from '../useAnnounce';

export const useHandRaiseAnnouncements = () => {
    const announce = useAnnounce();

    const raisedHands = useMeetSelector(selectRaisedHands);
    const nameMap = useMeetSelector(selectParticipantDecryptedNameMap);

    // null until first run so hands raised before mount are not re-announced.
    const previousRef = useRef<Set<string> | null>(null);

    useEffect(() => {
        const current = new Set(raisedHands);

        if (previousRef.current === null) {
            previousRef.current = current;
            return;
        }

        const previous = previousRef.current;
        for (const identity of raisedHands) {
            if (!previous.has(identity)) {
                announce(announcementMessages.handRaised(nameMap[identity]), {
                    dedupeKey: `hand-raised-${identity}`,
                });
            }
        }

        for (const identity of previous) {
            if (!current.has(identity)) {
                announce(announcementMessages.handLowered(nameMap[identity]), {
                    dedupeKey: `hand-lowered-${identity}`,
                });
            }
        }

        previousRef.current = current;
    }, [raisedHands, nameMap, announce]);
};
