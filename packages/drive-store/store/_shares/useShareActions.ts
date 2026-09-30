import { usePreventLeave } from '@proton/components';
import { queryCreateShare, queryDeleteShare } from '@proton/shared/lib/api/drive/share';
import { getEncryptedSessionKey } from '@proton/shared/lib/calendar/crypto/encrypt';
import { generateShareKeys } from '@proton/shared/lib/keys/driveKeys';
import { getDecryptedSessionKey } from '@proton/shared/lib/keys/drivePassphrase';

import { EnrichedError } from '../../utils/errorHandling/EnrichedError';
import useDebouncedRequest from '../_api/useDebouncedRequest';
import { useDriveEventManager } from '../_events/useDriveEventManager';
import useLink from '../_links/useLink';
import useShare from './useShare';

/**
 * useShareActions provides actions for manipulating with individual share.
 */
export default function useShareActions() {
    const { preventLeave } = usePreventLeave();
    const debouncedRequest = useDebouncedRequest();
    const { getLink, getLinkPassphraseAndSessionKey, getLinkPrivateKey } = useLink();
    const { getShareCreatorKeys } = useShare();
    const events = useDriveEventManager();

    const createShare = async (abortSignal: AbortSignal, shareId: string, volumeId: string, linkId: string) => {
        const [{ address, privateKey: addressPrivateKey }, { passphraseSessionKey }, link, linkPrivateKey] =
            await Promise.all([
                getShareCreatorKeys(abortSignal, shareId),
                getLinkPassphraseAndSessionKey(abortSignal, shareId, linkId),
                getLink(abortSignal, shareId, linkId),
                getLinkPrivateKey(abortSignal, shareId, linkId),
            ]);

        const [parentPrivateKey, keyInfo] = await Promise.all([
            getLinkPrivateKey(abortSignal, shareId, link.parentLinkId),
            generateShareKeys(linkPrivateKey, addressPrivateKey).catch((e) =>
                Promise.reject(
                    new EnrichedError('Failed to generate share node keys during share creation', {
                        tags: {
                            shareId,
                            volumeId,
                            linkId,
                        },
                        extra: { e },
                    })
                )
            ),
        ]);

        const {
            NodeKey: ShareKey,
            NodePassphrase: SharePassphrase,
            privateKey: sharePrivateKey,
            sessionKey: shareSessionKey,
            NodePassphraseSignature: SharePassphraseSignature,
        } = keyInfo;

        const nameSessionKey = await getDecryptedSessionKey({
            data: link.encryptedName,
            privateKeys: parentPrivateKey,
        }).catch((e) =>
            Promise.reject(
                new EnrichedError('Failed to decrypt link name session key during share creation', {
                    tags: {
                        shareId,
                        volumeId,
                        linkId,
                    },
                    extra: { e },
                })
            )
        );

        if (!nameSessionKey) {
            throw new Error('Could not get name session key during share creation');
        }

        const [PassphraseKeyPacket, NameKeyPacket] = await Promise.all([
            getEncryptedSessionKey(passphraseSessionKey, sharePrivateKey)
                .then((bytes) => bytes.toBase64())
                .catch((e) =>
                    Promise.reject(
                        new EnrichedError('Failed to encrypt link passphrase during share creation', {
                            tags: {
                                shareId,
                                volumeId,
                                linkId,
                            },
                            extra: { e },
                        })
                    )
                ),
            getEncryptedSessionKey(nameSessionKey, sharePrivateKey)
                .then((bytes) => bytes.toBase64())
                .catch((e) =>
                    Promise.reject(
                        new EnrichedError('Failed to encrypt link name during share creation', {
                            tags: {
                                shareId,
                                volumeId,
                                linkId,
                            },
                            extra: { e },
                        })
                    )
                ),
        ]);

        const { Share } = await preventLeave(
            debouncedRequest<{ Share: { ID: string } }>(
                queryCreateShare(volumeId, {
                    AddressID: address.ID,
                    RootLinkID: linkId,
                    ShareKey,
                    SharePassphrase,
                    SharePassphraseSignature,
                    PassphraseKeyPacket,
                    NameKeyPacket,
                })
            )
        );

        await events.pollEvents.volumes(volumeId);

        return {
            shareId: Share.ID,
            addressId: address.ID,
            sessionKey: shareSessionKey,
        };
    };

    const deleteShare = async (
        shareId: string,
        { force, silence }: { force?: boolean; silence?: boolean } = { force: false }
    ): Promise<void> => {
        await preventLeave(debouncedRequest(queryDeleteShare(shareId, { Force: force ? 1 : 0, silence })));
        await events.pollEvents.driveEvents();
    };

    return {
        createShare,
        deleteShare,
    };
}
