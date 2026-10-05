import { useCallback } from 'react';

import { useMeetSelector } from '@proton/meet/store/hooks';
import { selectUserId } from '@proton/meet/store/slices/userSlice';
import { getItem, setItem } from '@proton/shared/lib/helpers/storage';

const getCaptionsConsentSkippedStorageKey = (userId?: string) =>
    userId ? `user.${userId}.captionsConsentSkipped` : 'guest.captionsConsentSkipped';

export const useCaptionsConsentSkipped = () => {
    const userId = useMeetSelector(selectUserId);
    const storageKey = getCaptionsConsentSkippedStorageKey(userId);

    const isConsentSkipped = useCallback(() => getItem(storageKey) === 'true', [storageKey]);

    const skipConsent = useCallback(() => setItem(storageKey, 'true'), [storageKey]);

    return { isConsentSkipped, skipConsent };
};
