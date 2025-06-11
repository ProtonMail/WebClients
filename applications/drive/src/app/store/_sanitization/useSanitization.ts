import { useGetAddressKeys } from '@proton/account/addressKeys/hooks';
import { useGetAddresses } from '@proton/account/addresses/hooks';
import { type ModalOwnProps } from '@proton/components';
import {
    queryListNodesWithMissingNodeHashKeys,
    queryListShareAutoRestore,
    querySendNodesWithNewNodeHashKeys,
    querySendShareAutoRestoreStatus,
} from '@proton/shared/lib/api/drive/sanitization';
import { generateNodeHashKey } from '@proton/shared/lib/keys/driveKeys';

import { sendErrorReport } from '../../utils/errorHandling';
import { EnrichedError } from '../../utils/errorHandling/EnrichedError';
import { useDebouncedRequest } from '../_api';
import { useDriveEventManager } from '../_events';
import { useLink } from '../_links';
import { ShareType, type ShareWithKey, useLockedVolume, useShare } from '../_shares';

export const useSanitization = () => {
    const debouncedRequest = useDebouncedRequest();

    const { restoreVolumes } = useLockedVolume();
    const getAddressKeys = useGetAddressKeys();
    const getAddresses = useGetAddresses();
    const driveEventManager = useDriveEventManager();

    const { getShareWithKey } = useShare();
    const { getLinkPrivateKey } = useLink();

    const sendShareAutoRestoreStatus = async (
        abortSignal: AbortSignal,
        shares: { ShareID: string; Reason: string }[]
    ) => {
        if (!shares.length) {
            return;
        }
        await debouncedRequest(querySendShareAutoRestoreStatus({ Shares: shares }), abortSignal);
    };

    const autoRestore = async (showAutoRestoreModal: (props: ModalOwnProps) => void) => {
        const abortSignal = new AbortController().signal;
        const failingShares: { ShareID: string; Reason: string }[] = [];
        const { ShareIDs: shareIds, Code } = await debouncedRequest<{ ShareIDs: string[]; Code: number }>(
            queryListShareAutoRestore(),
            abortSignal
        );

        if (Code !== 1000) {
            sendErrorReport(
                new EnrichedError('Failed during list top level shareIds for the user volume in auto-restore state', {
                    extra: {
                        Code,
                    },
                })
            );
            sendErrorReport(new Error());
        }

        if (!shareIds.length) {
            return;
        }

        let validShares: ShareWithKey[] = [];

        for (const shareId of shareIds) {
            try {
                validShares.push(await getShareWithKey(abortSignal, shareId));
            } catch (e: unknown) {
                const reason = e instanceof Error ? e.message : 'Failed to get share bootstrap';
                failingShares.push({ ShareID: shareId, Reason: reason });
                sendErrorReport(
                    new EnrichedError(
                        'Failed during list top level shareIds for the user volume in auto-restore state',
                        {
                            tags: {
                                shareId,
                            },
                            extra: {
                                e,
                            },
                        }
                    )
                );
            }
        }

        if (!validShares.length) {
            void sendShareAutoRestoreStatus(abortSignal, failingShares);
            return;
        }

        const sharesByVolume = validShares.reduce(
            (volumes, share) => {
                if (!volumes[share.volumeId]) {
                    volumes[share.volumeId] = {
                        defaultShares: [] as ShareWithKey[],
                        photos: [],
                        devices: [],
                    };
                }

                const volume = volumes[share.volumeId];
                if (share.type === ShareType.default) {
                    volume.defaultShares.push(share);
                } else if (share.type === ShareType.photos) {
                    volume.photos.push(share);
                } else if (share.type === ShareType.device) {
                    volume.devices.push(share);
                }

                return volumes;
            },
            {} as Record<
                string,
                {
                    defaultShares: ShareWithKey[];
                    photos: ShareWithKey[];
                    devices: ShareWithKey[];
                }
            >
        );

        // We remove all lockedShares groups that doesn't have defaultShares and we report all shareIds of devices and photos related to it
        const validLockedShares = Object.values(sharesByVolume).filter((volume) => {
            const hasDefaultShares = volume.defaultShares.length > 0;
            if (!hasDefaultShares) {
                const reason = 'No associated default share';
                failingShares.push(
                    ...volume.photos.map((share) => ({ ShareID: share.shareId, Reason: reason })),
                    ...volume.devices.map((share) => ({ ShareID: share.shareId, Reason: reason }))
                );
            }
            return hasDefaultShares;
        });

        if (!validLockedShares.length) {
            void sendShareAutoRestoreStatus(abortSignal, failingShares);
            return;
        }

        try {
            const addresses = await getAddresses();
            const addressesKeys = await Promise.all(
                addresses.map(async (address) => {
                    const addressKeys = await getAddressKeys(address.ID);
                    return {
                        address,
                        keys: addressKeys,
                    };
                })
            );

            const success = await restoreVolumes(abortSignal, {
                preloadedLockedShares: validLockedShares,
                preloadedAddressesKeys: addressesKeys,
            });
            if (!success) {
                throw new Error('Failed to auto restore');
            }
            // Modal to inform user about auto-restore
            showAutoRestoreModal({});
        } catch (e: unknown) {
            const reason = e instanceof Error ? e.message : `Unknown error during auto-restore: ${e}`;
            validLockedShares.forEach((volume) => {
                failingShares.push(
                    ...volume.defaultShares.map((share) => ({ ShareID: share.shareId, Reason: reason })),
                    ...volume.photos.map((share) => ({ ShareID: share.shareId, Reason: reason })),
                    ...volume.devices.map((share) => ({ ShareID: share.shareId, Reason: reason }))
                );
            });
        }

        void sendShareAutoRestoreStatus(abortSignal, failingShares);
    };

    const restoreHashKey = async () => {
        const abortSignal = new AbortController().signal;
        const { NodesWithMissingNodeHashKey: nodesWithMissingNodeHashKey } = await debouncedRequest<{
            NodesWithMissingNodeHashKey: {
                LinkID: string;
                ShareID: string;
                VolumeID: string;
                PGPArmoredEncryptedNodeHashKey: string;
            }[];
            Code: number;
        }>(queryListNodesWithMissingNodeHashKeys(), abortSignal);

        if (!nodesWithMissingNodeHashKey.length) {
            return;
        }

        const nodesWithNewNodeHashKey = await Promise.all(
            nodesWithMissingNodeHashKey.map(async (node) => {
                const privateKey = await getLinkPrivateKey(abortSignal, node.ShareID, node.LinkID);

                const { NodeHashKey } = await generateNodeHashKey(privateKey, privateKey).catch((e) =>
                    Promise.reject(
                        new EnrichedError('Failed to encrypt node hash key during restore hash key process', {
                            tags: {
                                linkId: node.LinkID,
                                shareId: node.ShareID,
                                volumeId: node.VolumeID,
                            },
                            extra: { e },
                        })
                    )
                );
                return { ...node, PGPArmoredEncryptedNodeHashKey: NodeHashKey };
            })
        );

        await debouncedRequest<{
            Code: number;
        }>(querySendNodesWithNewNodeHashKeys({ NodesWithMissingNodeHashKey: nodesWithNewNodeHashKey }), abortSignal);

        const volumeIds = nodesWithMissingNodeHashKey.map((node) => node.VolumeID);
        await driveEventManager.pollEvents.volumes(volumeIds);
    };

    return { autoRestore, restoreHashKey };
};
