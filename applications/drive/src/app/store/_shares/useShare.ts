import { CryptoProxy, PrivateKeyReference, SessionKey } from '@proton/crypto';
import { queryShareMeta } from '@proton/shared/lib/api/drive/share';
import { ShareMeta } from '@proton/shared/lib/interfaces/drive/share';

import { shareMetaToShareWithKey, useDebouncedRequest } from '../_api';
import { useDriveCrypto } from '../_crypto';
import { useDebouncedFunction } from '../_utils';
import { Share, ShareWithKey } from './interface';
import useSharesKeys, { ShareKeys } from './useSharesKeys';
import useSharesState from './useSharesState';

export default function useShare() {
    const debouncedFunction = useDebouncedFunction();
    const debouncedRequest = useDebouncedRequest();
    const driveCrypto = useDriveCrypto();
    const sharesKeys = useSharesKeys();
    const sharesState = useSharesState();

    const fetchShare = async (abortSignal: AbortSignal, shareId: string): Promise<ShareWithKey> => {
        const Share = await debouncedRequest<ShareMeta>({
            ...queryShareMeta(shareId),
            signal: abortSignal,
        });
        return shareMetaToShareWithKey(Share);
    };

    /**
     * getShareWithKey returns share with keys. That is not available after
     * listing user's shares and thus needs extra API call. Use wisely.
     */
    const getShareWithKey = async (abortSignal: AbortSignal, shareId: string): Promise<ShareWithKey> => {
        return debouncedFunction(
            async (abortSignal: AbortSignal) => {
                const cachedShare = sharesState.getShare(shareId);
                if (cachedShare && 'key' in cachedShare) {
                    return cachedShare;
                }

                const share = await fetchShare(abortSignal, shareId);
                sharesState.setShares([share]);
                return share;
            },
            ['getShareWithKey', shareId],
            abortSignal
        );
    };

    /**
     * getShare returns share from cache or it fetches the full share from API.
     */
    const getShare = async (abortSignal: AbortSignal, shareId: string): Promise<Share> => {
        const cachedShare = sharesState.getShare(shareId);
        if (cachedShare) {
            return cachedShare;
        }
        return getShareWithKey(abortSignal, shareId);
    };

    const getShareKeys = async (abortSignal: AbortSignal, shareId: string): Promise<ShareKeys> => {
        const keys = sharesKeys.get(shareId);
        if (keys) {
            return keys;
        }

        const share = await getShareWithKey(abortSignal, shareId);
        const { decryptedPassphrase, sessionKey } = await driveCrypto.decryptSharePassphrase(share);
        const privateKey = await CryptoProxy.importPrivateKey({
            armoredKey: share.key,
            passphrase: decryptedPassphrase,
        });

        sharesKeys.set(shareId, privateKey, sessionKey);
        return {
            privateKey,
            sessionKey,
        };
    };

    /**
     * getSharePrivateKey returns private key used for link private key encryption.
     */
    const getSharePrivateKey = async (abortSignal: AbortSignal, shareId: string): Promise<PrivateKeyReference> => {
        const keys = await getShareKeys(abortSignal, shareId);
        return keys.privateKey;
    };

    /**
     * getShareSessionKey returns session key used for sharing links.
     */
    const getShareSessionKey = async (abortSignal: AbortSignal, shareId: string): Promise<SessionKey> => {
        const keys = await getShareKeys(abortSignal, shareId);
        if (!keys.sessionKey) {
            // This should not happen. All shares have session key, only
            // publicly shared link will not have it, but it is bug if
            // it is needed.
            throw new Error('Share is missing session key');
        }
        return keys.sessionKey;
    };

    /**
     * getShareCreatorKeys returns the share creator address' keys
     */
    const getShareCreatorKeys = async (abortSignal: AbortSignal, shareId: string) => {
        const share = await getShare(abortSignal, shareId);
        const keys = await driveCrypto.getOwnAddressAndPrimaryKeys(share.creator);

        return keys;
    };

    return {
        getShareWithKey,
        getShare,
        getSharePrivateKey,
        getShareSessionKey,
        getShareCreatorKeys,
    };
}
