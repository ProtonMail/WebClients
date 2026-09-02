import { useEffect, useRef } from 'react';

import type { BackgroundEffect } from '@proton/meet/store/slices/backgroundSlice';
import { isCustomBackgroundEffect } from '@proton/meet/utils/customBackgrounds';

import { useAppliedBackgroundEffect } from '../../../contexts/BackgroundEffects/useAppliedBackgroundEffect';
import { announcementMessages } from '../messages';
import { useAnnounce } from '../useAnnounce';

const getMessage = (effect: BackgroundEffect) => {
    if (isCustomBackgroundEffect(effect)) {
        return announcementMessages.customBackgroundApplied();
    }

    switch (effect) {
        case 'none':
            return announcementMessages.backgroundEffectCleared();
        case 'blur':
            return announcementMessages.backgroundBlurApplied();
        case 'protonDark':
            return announcementMessages.protonDarkBackgroundApplied();
        case 'protonLight':
            return announcementMessages.protonLightBackgroundApplied();
        case 'office':
            return announcementMessages.officeBackgroundApplied();
        case 'library':
            return announcementMessages.libraryBackgroundApplied();
        case 'mountain':
            return announcementMessages.mountainBackgroundApplied();
        case 'beach':
            return announcementMessages.beachBackgroundApplied();
    }
};

export const useBackgroundEffectAnnouncements = () => {
    const appliedBackgroundEffect = useAppliedBackgroundEffect();
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
