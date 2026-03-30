import { PassCrypto } from '@proton/pass/lib/crypto';
import { PassCryptoShareError } from '@proton/pass/lib/crypto/utils/errors';
import type { Maybe, ShareGetResponse, ShareKeyResponse, ShareManager } from '@proton/pass/types';

/** Check if share can be opened with available keys - either from existing
 * `shareManager` or provided `encryptedShareKeys` matched against
 * - user keys for normal shares
 * - address keys and groups keys for group shares */
export const canOpenShare = (
    encryptedShare: ShareGetResponse,
    encryptedShareKeys: Maybe<ShareKeyResponse[]>,
    shareManager: Maybe<ShareManager>,
    groupPublicKeys: Maybe<string[]>
): boolean => {
    if (!encryptedShareKeys) {
        if (!shareManager) throw new PassCryptoShareError('Missing share manager');
        return shareManager.isActive();
    }

    if (encryptedShareKeys.length === 0) throw new PassCryptoShareError('Empty share keys');

    /** With group shares, we can't rely on UserKeyID which is useless
     * but we can check that we have keys for the target addressId and groupId */
    if (encryptedShare.GroupID) {
        const { addresses } = PassCrypto.getContext();
        const addressKeys = addresses?.find((address) => address.ID === encryptedShare.AddressID)?.Keys;
        return !!(addressKeys?.length && groupPublicKeys?.length);
    }

    const { userKeys } = PassCrypto.getContext();
    const latestKey = encryptedShareKeys.reduce((acc, curr) => (curr.KeyRotation > acc.KeyRotation ? curr : acc));
    return userKeys?.some(({ ID }) => ID === latestKey.UserKeyID) || false;
};
