import type { PrivateKeyReference, SessionKey } from '@proton/crypto';
import { CryptoProxy } from '@proton/crypto';
import { queryShareMeta } from '@proton/shared/lib/api/drive/share';
import type { ShareMeta } from '@proton/shared/lib/interfaces/drive/share';

import { sendErrorReport } from '../../utils/errorHandling';
import { EnrichedError } from '../../utils/errorHandling/EnrichedError';
import { shareMetaToShareWithKey, useDebouncedRequest } from '../_api';
import { integrityMetrics, useDriveCrypto } from '../_crypto';
import { useIsPaid } from '../_user';
import { useDebouncedFunction } from '../_utils';
import type { Share, ShareWithKey } from './interface';
import { getShareTypeString } from './shareType';
import type { ShareKeys } from './useSharesKeys';
import useSharesKeys from './useSharesKeys';
import useSharesState from './useSharesState';

export default function useShare() {
    const isPaid = useIsPaid();
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

    const getShareKeys = async (
        abortSignal: AbortSignal,
        shareId: string,
        linkPrivateKey?: PrivateKeyReference
    ): Promise<ShareKeys> => {
        const keys = sharesKeys.get(shareId);
        if (keys) {
            return keys;
        }

        const share = await getShareWithKey(abortSignal, shareId);

        /**
         * Decrypt the share with linkPrivateKey (NodeKey) if provided and fallback if it failed
         * Fallback will use user's privateKey (retrieved in driveCrypto.decryptSharePassphrase function)
         */
        const decryptSharePassphrase = async (
            fallback: boolean = false
        ): ReturnType<typeof driveCrypto.decryptSharePassphrase> => {
            // TODO: Change the logic when we will migrate to encryption with only link's privateKey
            // If the share passphrase was encrypted with multiple KeyPacket,
            // that mean it was encrypted with link's privateKey and user's privateKey
            const haveMultipleEncryptionKey = await CryptoProxy.getMessageInfo({
                armoredMessage: share.passphrase,
            }).then((messageInfo) => messageInfo.encryptionKeyIDs.length > 1);
            const decryptWithLinkPrivateKey = !!linkPrivateKey && !fallback && haveMultipleEncryptionKey;
            try {
                return await driveCrypto.decryptSharePassphrase(
                    share,
                    decryptWithLinkPrivateKey ? [linkPrivateKey] : undefined
                );
            } catch (e) {
                if (decryptWithLinkPrivateKey) {
                    sendErrorReport(
                        new EnrichedError('Failed to decrypt share passphrase with link privateKey', {
                            tags: { keyId: linkPrivateKey.getKeyID(), shareId },
                            extra: { e },
                        })
                    );
                    return decryptSharePassphrase(true);
                }

                const shareType = getShareTypeString(share);
                const options = {
                    isPaid,
                    createTime: share.createTime,
                };
                integrityMetrics.shareDecryptionError(shareId, shareType, options);

                throw new EnrichedError('Failed to decrypt share passphrase', {
                    tags: {
                        shareId,
                    },
                    extra: {
                        e,
                    },
                });
            }
        };

        const { decryptedPassphrase, sessionKey } = await decryptSharePassphrase();
        const privateKey = await CryptoProxy.importPrivateKey({
            armoredKey: share.key,
            passphrase: decryptedPassphrase,
        }).catch((e) =>
            Promise.reject(
                new EnrichedError('Failed to import share private key', {
                    tags: {
                        shareId,
                    },
                    extra: { e },
                })
            )
        );

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
    const getShareSessionKey = async (
        abortSignal: AbortSignal,
        shareId: string,
        linkPrivateKey?: PrivateKeyReference
    ): Promise<SessionKey> => {
        const keys = await getShareKeys(abortSignal, shareId, linkPrivateKey);
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
     * TODO: Change this function name as it doesn't fetch creator key but your own member keys for that share
     * Also share.adressId can be null
     */
    const getShareCreatorKeys = async (abortSignal: AbortSignal, shareId: string) => {
        const share = await getShareWithKey(abortSignal, shareId);
        const keys = await driveCrypto.getOwnAddressAndPrimaryKeys(share.addressId);

        return keys;
    };

    return {
        getShareWithKey,
        getShare,
        getSharePrivateKey,
        getShareSessionKey,
        getShareCreatorKeys,
        removeShares: sharesState.removeShares,
    };
}
