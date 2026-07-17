import { useEffect, useRef } from 'react';

import { useMeetSelector } from '@proton/meet/store/hooks';
import { selectParticipantDecryptedNameMap } from '@proton/meet/store/slices/participants/participantsSlice';
import { selectScreenSharingParticipantIdentity } from '@proton/meet/store/slices/screenShareStatusSlice';

import { announcementMessages } from '../messages';
import { useAnnounce } from '../useAnnounce';

export const useScreenShareAnnouncements = () => {
    const announce = useAnnounce();

    const sharingIdentity = useMeetSelector(selectScreenSharingParticipantIdentity);
    const nameMap = useMeetSelector(selectParticipantDecryptedNameMap);

    // undefined until first run so a share already in progress before mount is not re-announced.
    const previousRef = useRef<string | null | undefined>(undefined);

    useEffect(() => {
        const current = sharingIdentity ?? null;

        if (previousRef.current === undefined) {
            previousRef.current = current;
            return;
        }

        const previous = previousRef.current;
        if (current === previous) {
            return;
        }
        previousRef.current = current;

        // A direct hand-off (one sharer replaced by another) reads as a stop followed by a start.
        if (previous) {
            announce(announcementMessages.screenShareStopped(nameMap[previous] || undefined), {
                dedupeKey: `screen-share-stopped-${previous}`,
            });
        }
        if (current) {
            announce(announcementMessages.screenShareStarted(nameMap[current] || undefined), {
                dedupeKey: `screen-share-started-${current}`,
            });
        }
    }, [sharingIdentity, nameMap, announce]);
};
