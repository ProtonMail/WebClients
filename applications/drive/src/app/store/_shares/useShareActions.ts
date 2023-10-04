import { usePreventLeave } from '@proton/components';
import { queryCreateShare, queryDeleteShare } from '@proton/shared/lib/api/drive/share';
import { getEncryptedSessionKey } from '@proton/shared/lib/calendar/crypto/encrypt';
import { uint8ArrayToBase64String } from '@proton/shared/lib/helpers/encoding';
import { generateNodeKeys } from '@proton/shared/lib/keys/driveKeys';
import { getDecryptedSessionKey } from '@proton/shared/lib/keys/drivePassphrase';

import { useDebouncedRequest } from '../_api';
import { useLink } from '../_links';
import useShare from './useShare';

/**
 * useShareActions provides actions for manipulating with individual share.
 */
export default function useShareActions() {
    const { preventLeave } = usePreventLeave();
    const debouncedRequest = useDebouncedRequest();
    const { getLink, getLinkPassphraseAndSessionKey, getLinkPrivateKey } = useLink();
    const { getShareCreatorKeys } = useShare();

    const createShare = async (abortSignal: AbortSignal, shareId: string, volumeId: string, linkId: string) => {
        const [{ address, privateKey: addressPrivateKey }, { passphraseSessionKey }, link] = await Promise.all([
            getShareCreatorKeys(abortSignal, shareId),
            getLinkPassphraseAndSessionKey(abortSignal, shareId, linkId),
            getLink(abortSignal, shareId, linkId),
        ]);

        const [parentPrivateKey, keyInfo] = await Promise.all([
            getLinkPrivateKey(abortSignal, shareId, link.parentLinkId),
            generateNodeKeys(addressPrivateKey).catch((e) =>
                Promise.reject(
                    new Error('Failed to generate share node keys during share creation', {
                        cause: {
                            e,
                            shareId,
                            volumeId,
                            linkId,
                        },
                    })
                )
            ),
        ]);

        const {
            NodeKey: ShareKey,
            NodePassphrase: SharePassphrase,
            privateKey: sharePrivateKey,
            NodePassphraseSignature: SharePassphraseSignature,
        } = keyInfo;

        const nameSessionKey = await getDecryptedSessionKey({
            data: link.encryptedName,
            privateKeys: parentPrivateKey,
        }).catch((e) =>
            Promise.reject(
                new Error('Failed to decrypt link name session key during share creation', {
                    cause: {
                        e,
                        shareId,
                        volumeId,
                        linkId,
                    },
                })
            )
        );

        if (!nameSessionKey) {
            throw new Error('Could not get name session key during share creation');
        }

        const [PassphraseKeyPacket, NameKeyPacket] = await Promise.all([
            getEncryptedSessionKey(passphraseSessionKey, sharePrivateKey)
                .then(uint8ArrayToBase64String)
                .catch((e) =>
                    Promise.reject(
                        new Error('Failed to encrypt link passphrase during share creation', {
                            cause: {
                                e,
                                shareId,
                                volumeId,
                                linkId,
                            },
                        })
                    )
                ),
            getEncryptedSessionKey(nameSessionKey, sharePrivateKey)
                .then(uint8ArrayToBase64String)
                .catch((e) =>
                    Promise.reject(
                        new Error('Failed to encrypt link name during share creation', {
                            cause: {
                                e,
                                shareId,
                                volumeId,
                                linkId,
                            },
                        })
                    )
                ),
        ]);

        const { Share } = await preventLeave(
            debouncedRequest<{ Share: { ID: string } }>(
                queryCreateShare(volumeId, {
                    AddressID: address.ID,
                    RootLinkID: linkId,
                    Name: 'New Share',
                    ShareKey,
                    SharePassphrase,
                    SharePassphraseSignature,
                    PassphraseKeyPacket,
                    NameKeyPacket,
                })
            )
        );

        return {
            shareId: Share.ID,
            sessionKey: keyInfo.sessionKey,
        };
    };

    const deleteShare = async (shareId: string): Promise<void> => {
        await preventLeave(debouncedRequest(queryDeleteShare(shareId)));
    };

    return {
        createShare,
        deleteShare,
    };
}
