import { useCallback } from 'react';

import { useShallow } from 'zustand/react/shallow';

import { usePreventLeave } from '@proton/components';
import { queryPhotosVolumeMigrate, queryPhotosVolumeMigrationState } from '@proton/shared/lib/api/drive/photos';
import {
    queryCreateShare,
    queryDeleteShare,
    queryMigrateLegacyShares,
    queryUnmigratedShares,
} from '@proton/shared/lib/api/drive/share';
import { queryGetDriveVolume } from '@proton/shared/lib/api/drive/volume';
import { getEncryptedSessionKey } from '@proton/shared/lib/calendar/crypto/encrypt';
import { HTTP_STATUS_CODE } from '@proton/shared/lib/constants';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';
import { uint8ArrayToBase64String } from '@proton/shared/lib/helpers/encoding';
import { type PhotoMigrationPayload } from '@proton/shared/lib/interfaces/drive/photos';
import type { DriveVolume } from '@proton/shared/lib/interfaces/drive/volume';
import { type GetDriveVolumeResult, VolumeType } from '@proton/shared/lib/interfaces/drive/volume';
import { generateShareKeys } from '@proton/shared/lib/keys/driveKeys';
import { getDecryptedSessionKey } from '@proton/shared/lib/keys/drivePassphrase';
import chunk from '@proton/utils/chunk';

import { sendErrorReport } from '../../utils/errorHandling';
import { EnrichedError } from '../../utils/errorHandling/EnrichedError';
import { useSharesStore } from '../../zustand/share/shares.store';
import { useDebouncedRequest } from '../_api';
import { useDriveEventManager } from '../_events';
import { useLink } from '../_links';
import useLinksState from '../_links/useLinksState';
import { useVolumesState } from '../_volumes';
import { ShareType } from './interface';
import useDefaultShare from './useDefaultShare';
import useShare from './useShare';

export enum SHOULD_MIGRATE_PHOTOS_STATUS {
    NO_PHOTOS_SHARE = 'no-photos-share',
    NEED_MIGRATION = 'need-migration',
    MIGRATION_IN_PROGRESS = 'migration-in-progress',
    MIGRATED = 'migrated',
}

const MIGRATION_CHECK_INTERVAL = 10000;

/**
 * useShareActions provides actions for manipulating with individual share.
 */
export default function useShareActions() {
    const { preventLeave } = usePreventLeave();
    const debouncedRequest = useDebouncedRequest();
    const { getLink, getLinkPassphraseAndSessionKey, getLinkPrivateKey } = useLink();
    const { removeLinkForMigration } = useLinksState();
    const volumesState = useVolumesState();
    const { getShareCreatorKeys, getShare, getShareSessionKey } = useShare();
    const events = useDriveEventManager();
    const { getDefaultPhotosShare } = useDefaultShare();
    const { clearDefaultPhotosSharePromise, removeShares, getDefaultPhotosShareId, shares } = useSharesStore(
        useShallow((state) => ({
            clearDefaultPhotosSharePromise: state.clearDefaultPhotosSharePromise,
            removeShares: state.removeShares,
            getDefaultPhotosShareId: state.getDefaultPhotosShareId,
            shares: state.shares,
        }))
    );

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

    const checkMigrationState = useCallback(
        async (silence: boolean = false) => {
            const result = await debouncedRequest<PhotoMigrationPayload & { Code: number }>({
                ...queryPhotosVolumeMigrationState(),
                silence,
            });
            if (result.Code === 1002) {
                return { isMigrating: true };
            }
            // If we receive a result with OldVolumeID and NewVolumeID, migration is complete
            if (result.OldVolumeID && result.NewVolumeID) {
                const { Volume } = await debouncedRequest<GetDriveVolumeResult>(
                    queryGetDriveVolume(result.NewVolumeID)
                );
                volumesState.setVolumeShareIds(Volume.VolumeID, [Volume.Share.ShareID]);
                clearDefaultPhotosSharePromise();
                const oldPhotosShareId = getDefaultPhotosShareId();
                if (oldPhotosShareId) {
                    removeShares([oldPhotosShareId]);
                }
                return { Volume, isMigrating: false };
            }
        },
        [debouncedRequest, volumesState, clearDefaultPhotosSharePromise, getDefaultPhotosShareId, removeShares]
    );

    const startMigration = useCallback(async () => {
        try {
            await debouncedRequest(queryPhotosVolumeMigrate());
        } catch (e: unknown) {
            const error = e as {
                data?: { Code: number };
            };
            if (error?.data?.Code !== API_CUSTOM_ERROR_CODES.ALREADY_EXISTS) {
                throw e;
            }
        }
    }, [debouncedRequest]);

    const shouldMigratePhotos = useCallback(async (): Promise<SHOULD_MIGRATE_PHOTOS_STATUS> => {
        const lockedOldPhotoShares = Object.values(shares).filter(
            (share) => share.isLocked && share.type == ShareType.photos && share.volumeType !== VolumeType.Photos
        );
        if (lockedOldPhotoShares.length > 0) {
            return SHOULD_MIGRATE_PHOTOS_STATUS.NEED_MIGRATION;
        }

        // Force=true to re-fetch the share in case recovery happened and there is new photo share.
        const photosShare = await getDefaultPhotosShare(undefined, true);
        if (!photosShare) {
            try {
                const migrationState = await checkMigrationState(true);
                return migrationState?.isMigrating
                    ? SHOULD_MIGRATE_PHOTOS_STATUS.MIGRATION_IN_PROGRESS
                    : SHOULD_MIGRATE_PHOTOS_STATUS.NO_PHOTOS_SHARE;
            } catch {
                // silence 422 here
                return SHOULD_MIGRATE_PHOTOS_STATUS.NO_PHOTOS_SHARE;
            }
        }
        return photosShare.volumeType === VolumeType.Photos
            ? SHOULD_MIGRATE_PHOTOS_STATUS.MIGRATED
            : SHOULD_MIGRATE_PHOTOS_STATUS.NEED_MIGRATION;
    }, [checkMigrationState, getDefaultPhotosShare, shares]);

    const migratePhotos = useCallback(
        (skipStartMigration: boolean = false) =>
            new Promise<{ shareId: string; volumeId: string }>(async (resolve, reject) => {
                if (!skipStartMigration) {
                    await startMigration();
                }
                let intervalId: ReturnType<typeof setInterval> | undefined;
                const resolveIfEndMigration = (migrationState?: { Volume?: DriveVolume; isMigrating?: boolean }) => {
                    if (migrationState?.Volume) {
                        resolve({
                            shareId: migrationState.Volume.Share.ShareID,
                            volumeId: migrationState.Volume.VolumeID,
                        });
                        clearInterval(intervalId);
                    }
                };
                try {
                    // Start checking migration state
                    const state = await checkMigrationState();
                    resolveIfEndMigration(state);
                    // Check at specific interval if migration is done
                    intervalId = setInterval(async () => {
                        const state = await checkMigrationState();
                        resolveIfEndMigration(state);
                    }, MIGRATION_CHECK_INTERVAL);
                } catch (error) {
                    clearInterval(intervalId);
                    reject(error);
                }
            }),
        [checkMigrationState, startMigration]
    );

    return {
        createShare,
        deleteShare,
        migrateShares,
        migratePhotos,
        shouldMigratePhotos,
    };
}
