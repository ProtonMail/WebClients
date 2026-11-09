import { c } from 'ttag';

import { handleSdkError } from '@proton/drive/legacy/errorHandling';
import { getNodeEntity } from '@proton/drive/legacy/sdkUtils/getNodeEntity';
import { driveMetrics } from '@proton/drive/modules/metrics';
import {
    getFormattedNodeLocation,
    getFormattedNodeLocationUsingHierarchy,
    iterateNodesFromUidsGenerator,
} from '@proton/drive/modules/nodes';
import { type NodeEntity, type ProtonDriveClient, getDrive, getDriveForPhotos } from '@proton/drive/sdk';

import { getSignatureIssues } from '../../../utils/sdk/getSignatureIssues';
import { useSharedByMeStore } from '../useSharedByMe.store';
import { getOldestShareCreationTime } from '../utils/getOldestShareCreationTime';

type Drive = Pick<ProtonDriveClient, 'iterateSharedNodeUids' | 'getSharingInfo' | 'getNode' | 'iterateNodes'>;

const fetchSharedByMeNodes = async (
    abortSignal: AbortSignal,
    drive: Drive,
    getLocation: (node: NodeEntity) => Promise<string>
): Promise<Set<string>> => {
    const { onItemsLoadedToState, onFinished } = driveMetrics.drivePerformance.startDataLoad('sharedByMe');
    const loadedUids = new Set<string>();
    const sharedUidsIterator = drive.iterateSharedNodeUids(abortSignal);
    for await (const sharedByMeMaybeNode of iterateNodesFromUidsGenerator(sharedUidsIterator, drive, {
        signal: abortSignal,
    })) {
        try {
            const { node } = getNodeEntity(sharedByMeMaybeNode);
            const signatureResult = getSignatureIssues(sharedByMeMaybeNode);

            loadedUids.add(node.uid);
            useSharedByMeStore.getState().setSharedByMeItem({
                nodeUid: node.uid,
                name: node.name,
                type: node.type,
                mediaType: node.mediaType,
                activeRevisionUid: node.activeRevision?.uid,
                size: node.activeRevision?.storageSize || node.totalStorageSize,
                parentUid: node.parentUid,
                haveSignatureIssues: !signatureResult.ok,
            });
            onItemsLoadedToState(1);

            void getLocation(sharedByMeMaybeNode).then((location) => {
                useSharedByMeStore.getState().updateSharedByMeItem(node.uid, {
                    location,
                });
            });

            void drive.getSharingInfo(node.uid).then((shareResult) => {
                if (!shareResult) {
                    return;
                }
                const { updateSharedByMeItem } = useSharedByMeStore.getState();
                // TODO: Update or remove that once we figure out what product want in "Created" column
                const oldestCreationTime = getOldestShareCreationTime(shareResult);

                if (shareResult.urlAccess) {
                    updateSharedByMeItem(node.uid, {
                        creationTime: oldestCreationTime,
                        publicLink: {
                            expirationTime: shareResult.urlAccess.expirationTime,
                            numberOfInitializedDownloads: shareResult.urlAccess.numberOfInitializedDownloads,
                            url: shareResult.urlAccess.url,
                        },
                    });
                } else if (oldestCreationTime) {
                    updateSharedByMeItem(node.uid, {
                        creationTime: oldestCreationTime,
                    });
                }
            });
        } catch (e) {
            handleSdkError(e);
        }
    }
    onFinished();
    return loadedUids;
};

export const loadSharedByMeNodes = async (abortSignal: AbortSignal) => {
    const { isLoading, setLoading } = useSharedByMeStore.getState();
    if (isLoading) {
        return;
    }
    setLoading(true);
    try {
        const drive = getDrive();
        const photosDrive = getDriveForPhotos();
        const [driveUids, photosUids] = await Promise.all([
            fetchSharedByMeNodes(abortSignal, drive, (node) => getFormattedNodeLocationUsingHierarchy(drive, node)),
            fetchSharedByMeNodes(abortSignal, photosDrive, (node) => getFormattedNodeLocation(photosDrive, node)),
        ]);
        const allLoadedUids = new Set([...driveUids, ...photosUids]);
        const { cleanupStaleItems } = useSharedByMeStore.getState();
        cleanupStaleItems(allLoadedUids);
    } catch (e) {
        handleSdkError(e, {
            showNotification: true,
            fallbackMessage: c('Error').t`We were not able to load some of your shared items`,
        });
    } finally {
        setLoading(false);
    }
};
