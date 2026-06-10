import { useEffect } from 'react';

import type { GetUserKeys } from './crypto';
import { initEncryptedThumbnailCache } from './encryptedThumbnailCache';

/**
 * Initialises the encrypted thumbnail cache for the current user. Call once at
 * app bootstrap (where the user is authenticated), alongside the other modules.
 *
 * Provider-bound dependencies (user keys, user id, the feature flag) are passed
 * in by the app so this package stays decoupled from the account/unleash hooks.
 */
export const useInitEncryptedThumbnailCache = ({
    getUserKeys,
    userId,
    isEnabled,
}: {
    getUserKeys: GetUserKeys;
    userId: string | undefined;
    isEnabled: boolean;
}) => {
    useEffect(() => {
        if (!isEnabled || !userId) {
            return;
        }
        void initEncryptedThumbnailCache({ getUserKeys, userId });
    }, [isEnabled, getUserKeys, userId]);
};
