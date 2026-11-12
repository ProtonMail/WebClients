import { useEffect, useRef } from 'react';

import { AnnouncementPriority } from '@proton/components/components/liveAnnouncer/types';
import { useAnnounce } from '@proton/components/components/liveAnnouncer/useAnnounce';

import { useCaptionsAvailability } from '../../../hooks/captions/useCaptionsAvailability';
import { useLiveCaptionsFeatureEnabled } from '../../../hooks/captions/useLiveCaptionsFeatureEnabled';
import { announcementMessages } from '../messages';

export const useCaptionsAvailabilityAnnouncements = () => {
    const isFeatureEnabled = useLiveCaptionsFeatureEnabled();
    const { isCaptionsDisabled } = useCaptionsAvailability();
    const announce = useAnnounce();

    const previousIsDisabledRef = useRef<boolean | null>(null);
    const announcementCountRef = useRef(0);

    useEffect(() => {
        if (!isFeatureEnabled) {
            return;
        }

        const previousIsDisabled = previousIsDisabledRef.current;
        previousIsDisabledRef.current = isCaptionsDisabled;

        if (previousIsDisabled === null || previousIsDisabled === isCaptionsDisabled) {
            return;
        }

        announce(
            isCaptionsDisabled
                ? announcementMessages.liveCaptionsDisabledByHost()
                : announcementMessages.liveCaptionsAllowedByHost(),
            { dedupeKey: `live-captions-host-${++announcementCountRef.current}`, priority: AnnouncementPriority.High }
        );
    }, [isFeatureEnabled, isCaptionsDisabled, announce]);
};
