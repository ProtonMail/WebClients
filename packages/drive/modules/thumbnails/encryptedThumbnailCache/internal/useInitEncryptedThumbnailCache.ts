import { useEffect } from 'react';

import type { DecryptedKey } from '@proton/shared/lib/interfaces';

import { initEncryptedThumbnailCache } from './encryptedThumbnailCache';

/**
 * Initialises the encrypted thumbnail cache for the current user. Call once at
 * app bootstrap (where the user is authenticated), alongside the other modules.
 *
 * Provider-bound dependencies (user keys, user id, the feature flag) are passed
 * in by the app so this package stays decoupled from the account/unleash hooks.
 *
 * Takes the reactive user keys (not a getter) so initialisation waits for, and
 * retries once, the keys become available - e.g. on new-user creation, where
 * they are generated after the app first mounts.
 */
export const useInitEncryptedThumbnailCache = ({
    userKeys,
    userId,
    isEnabled,
}: {
    userKeys: DecryptedKey[] | undefined;
    userId: string | undefined;
    isEnabled: boolean;
}) => {
    useEffect(() => {
        if (!isEnabled || !userId || !userKeys?.length) {
            return;
        }
        void initEncryptedThumbnailCache({ userKeys, userId });
    }, [isEnabled, userKeys, userId]);
};
