import { c } from 'ttag';

import { type ProtonDriveClient, getDrive, getDriveForPhotos } from '@proton/drive';

import { handleSdkError } from '../../../utils/errorHandling/handleSdkError';
import { getNodeEntity } from '../../../utils/sdk/getNodeEntity';
import { getFormattedNodeLocation } from '../../../utils/sdk/getNodeLocation';
import { getSignatureIssues } from '../../../utils/sdk/getSignatureIssues';
import { useSharedByMeStore } from '../useSharedByMe.store';
import { getOldestShareCreationTime } from '../utils/getOldestShareCreationTime';

type Drive = Pick<ProtonDriveClient, 'iterateSharedNodes' | 'getSharingInfo' | 'getNode' | 'iterateNodes'>;

const fetchSharedByMeNodes = async (abortSignal: AbortSignal, drive: Drive) => {
    for await (const sharedByMeMaybeNode of drive.iterateSharedNodes(abortSignal)) {
        try {
            const { node } = getNodeEntity(sharedByMeMaybeNode);
            const signatureResult = getSignatureIssues(sharedByMeMaybeNode);

            useSharedByMeStore.getState().setSharedByMeItem({
                nodeUid: node.uid,
                name: node.name,
                type: node.type,
                mediaType: node.mediaType,
                thumbnailId: node.activeRevision?.uid || node.uid,
                size: node.activeRevision?.storageSize || node.totalStorageSize,
                parentUid: node.parentUid,
                haveSignatureIssues: !signatureResult.ok,
            });

            void getFormattedNodeLocation(drive, sharedByMeMaybeNode).then((location) => {
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

                if (shareResult.publicLink) {
                    updateSharedByMeItem(node.uid, {
                        creationTime: oldestCreationTime,
                        publicLink: {
                            expirationTime: shareResult.publicLink.expirationTime,
                            numberOfInitializedDownloads: shareResult.publicLink.numberOfInitializedDownloads,
                            url: shareResult.publicLink.url,
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
};

export const loadSharedByMeNodes = async (abortSignal: AbortSignal) => {
    const { isLoading, setLoading } = useSharedByMeStore.getState();
    if (isLoading) {
        return;
    }
    setLoading(true);
    try {
        await Promise.all([
            fetchSharedByMeNodes(abortSignal, getDrive()),
            fetchSharedByMeNodes(abortSignal, getDriveForPhotos()),
        ]);
    } catch (e) {
        handleSdkError(e, {
            showNotification: true,
            fallbackMessage: c('Error').t`We were not able to load some of your shared items`,
        });
    } finally {
        setLoading(false);
    }
};
