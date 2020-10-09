import { OpenPGPKey } from 'pmcrypto';
import { VERIFICATION_STATUS } from 'proton-shared/lib/mail/constants';
import { useCallback } from 'react';

import { updateMessageCache, useMessageCache } from '../../containers/MessageProvider';

export const useTrustSigningPublicKey = (localID: string) => {
    const messageCache = useMessageCache();

    return useCallback(
        async (key: OpenPGPKey) => {
            const pinnedKeys = messageCache.get(localID)?.senderPinnedKeys || [];
            updateMessageCache(messageCache, localID, {
                verificationStatus: VERIFICATION_STATUS.SIGNED_AND_VALID,
                senderPinnedKeys: [key, ...pinnedKeys],
                senderVerified: true
            });
        },
        [localID]
    );
};

// if the attached public key signs the message, use the hook above
export const useTrustAttachedPublicKey = (localID: string) => {
    const messageCache = useMessageCache();

    return useCallback(
        async (key: OpenPGPKey) => {
            const pinnedKeys = messageCache.get(localID)?.senderPinnedKeys || [];
            updateMessageCache(messageCache, localID, {
                senderPinnedKeys: [key, ...pinnedKeys],
                senderVerified: true
            });
        },
        [localID]
    );
};
