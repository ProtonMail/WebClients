import { useCallback } from 'react';

import { usePreventLeave } from '@proton/components';
import {
    queryCreateShare,
    queryDeleteShare,
    queryMigrateLegacyShares,
    queryUnmigratedShares,
} from '@proton/shared/lib/api/drive/share';
import { getEncryptedSessionKey } from '@proton/shared/lib/calendar/crypto/encrypt';
import { HTTP_STATUS_CODE } from '@proton/shared/lib/constants';
import { uint8ArrayToBase64String } from '@proton/shared/lib/helpers/encoding';
import { generateShareKeys } from '@proton/shared/lib/keys/driveKeys';
import { getDecryptedSessionKey } from '@proton/shared/lib/keys/drivePassphrase';
import chunk from '@proton/utils/chunk';

import { sendErrorReport } from '../../utils/errorHandling';
import { EnrichedError } from '../../utils/errorHandling/EnrichedError';
import { useDebouncedRequest } from '../_api';
import { useDriveEventManager } from '../_events';
import { useLink } from '../_links';
import useLinksState from '../_links/useLinksState';
import useShare from './useShare';

/**
 * useShareActions provides actions for manipulating with individual share.
 */
export default function useShareActions() {
    const { preventLeave } = usePreventLeave();
    const debouncedRequest = useDebouncedRequest();
    const { getLink, getLinkPassphraseAndSessionKey, getLinkPrivateKey } = useLink();
    const { removeLinkForMigration } = useLinksState();
    const { getShareCreatorKeys, getShare, getShareSessionKey } = useShare();
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
                .then(uint8ArrayToBase64String)
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
                .then(uint8ArrayToBase64String)
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
                    Name: 'New Share',
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

    // Migrate old user shares encrypted with AddressPrivateKey with new one encrypted with LinkPrivateKey (NodeKey)
    const migrateShares = useCallback(
        (abortSignal: AbortSignal = new AbortController().signal) =>
            new Promise(async (resolve) => {
                const shareIds = await debouncedRequest<{ ShareIDs: string[] }>(queryUnmigratedShares())
                    .then(({ ShareIDs }) => ShareIDs)
                    .catch((err) => {
                        if (err?.data?.Code === HTTP_STATUS_CODE.NOT_FOUND) {
                            void resolve(undefined);
                            return undefined;
                        }
                        throw err;
                    });
                if (shareIds?.length === 0) {
                    return;
                }
                const shareIdsBatches = chunk(shareIds, 50);
                for (const shareIdsBatch of shareIdsBatches) {
                    let unreadableShareIDs: string[] = [];
                    let passPhraseNodeKeyPackets: { ShareID: string; PassphraseNodeKeyPacket: string }[] = [];

                    for (const shareId of shareIdsBatch) {
                        const share = await getShare(abortSignal, shareId);
                        const [linkPrivateKey, shareSessionKey] = await Promise.all([
                            getLinkPrivateKey(abortSignal, share.shareId, share.rootLinkId).then((linkPrivateKey) => {
                                removeLinkForMigration(share.shareId, share.rootLinkId);
                                return linkPrivateKey;
                            }),
                            getShareSessionKey(abortSignal, share.shareId).catch((e) => {
                                sendErrorReport(
                                    new EnrichedError('Failed to get the share session key during share migration', {
                                        tags: {
                                            shareId: share.shareId,
                                        },
                                        extra: { e },
                                    })
                                );
                                unreadableShareIDs.push(share.shareId);
                            }),
                        ]);

                        if (!shareSessionKey) {
                            break;
                        }

                        await getEncryptedSessionKey(shareSessionKey, linkPrivateKey)
                            .then(uint8ArrayToBase64String)
                            .then((PassphraseNodeKeyPacket) => {
                                passPhraseNodeKeyPackets.push({
                                    ShareID: share.shareId,
                                    PassphraseNodeKeyPacket,
                                });
                            });
                    }
                    await debouncedRequest(
                        queryMigrateLegacyShares({
                            PassphraseNodeKeyPackets: passPhraseNodeKeyPackets,
                            UnreadableShareIDs: unreadableShareIDs.length ? unreadableShareIDs : undefined,
                        })
                    ).catch((err) => {
                        if (err?.data?.Code === HTTP_STATUS_CODE.NOT_FOUND) {
                            return resolve(null);
                        }
                        throw err;
                    });
                }
                return resolve(null);
            }),
        [debouncedRequest, getLinkPrivateKey, getShare, getShareSessionKey]
    );

    return {
        createShare,
        deleteShare,
        migrateShares,
    };
}
