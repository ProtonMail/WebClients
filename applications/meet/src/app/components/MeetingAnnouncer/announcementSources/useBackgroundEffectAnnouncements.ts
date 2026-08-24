import { useEffect, useRef } from 'react';

import { useMediaManagementContext } from '../../../contexts/MediaManagementProvider/MediaManagementContext';
import type { BackgroundEffect } from '../../../utils/virtualBackgrounds/virtualBackgrounds';
import { announcementMessages } from '../messages';
import { useAnnounce } from '../useAnnounce';

const getMessage = (effect: BackgroundEffect) => {
    switch (effect) {
        case 'none':
            return announcementMessages.backgroundEffectCleared();
        case 'blur':
            return announcementMessages.backgroundBlurApplied();
        case 'proton':
            return announcementMessages.protonBackgroundApplied();
        case 'office':
            return announcementMessages.officeBackgroundApplied();
        case 'mountain':
            return announcementMessages.mountainBackgroundApplied();
        case 'abstract':
            return announcementMessages.abstractBackgroundApplied();
        case 'beach':
            return announcementMessages.beachBackgroundApplied();
        case 'coffee':
            return announcementMessages.coffeeBackgroundApplied();
    }
};

export const useBackgroundEffectAnnouncements = () => {
    const { appliedBackgroundEffect } = useMediaManagementContext();
    const announce = useAnnounce();

    const previousEffectRef = useRef<BackgroundEffect | null>(null);

    useEffect(() => {
        const previousEffect = previousEffectRef.current;
        previousEffectRef.current = appliedBackgroundEffect;

        if (previousEffect === null || previousEffect === appliedBackgroundEffect) {
            return;
        }

        announce(getMessage(appliedBackgroundEffect));
    }, [appliedBackgroundEffect, announce]);
};
