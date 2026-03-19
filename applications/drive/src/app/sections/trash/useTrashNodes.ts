import { useCallback } from 'react';

import { getDrive, getDriveForPhotos } from '@proton/drive/index';
import { getNodeEntityFromMaybeNode } from '@proton/drive/modules/upload/utils/getNodeEntityFromMaybeNode';

import { driveMetrics } from '../../modules/metrics';
import { handleSdkError } from '../../utils/errorHandling/handleSdkError';
import { getFormattedNodeLocation } from '../../utils/sdk/getNodeLocation';
import { getSignatureIssues } from '../../utils/sdk/getSignatureIssues';
import { createTrashItem, useTrashStore } from './useTrash.store';

export const useTrashNodes = () => {
    const loadTrashNodes = useCallback(async (abortSignal: AbortSignal) => {
        const { setLoading, setItem } = useTrashStore.getState();

        try {
            const drive = getDrive();
            setLoading('drive', true);
            let shownErrorNotification = false;
            const { onItemsLoadedToState, onFinished } = driveMetrics.drivePerformance.startDataLoad('trash');
            for await (const trashNode of drive.iterateTrashedNodes(abortSignal)) {
                try {
                    const location = await getFormattedNodeLocation(drive, trashNode);
                    const { node } = getNodeEntityFromMaybeNode(trashNode);
                    const haveSignatureIssues = !getSignatureIssues(trashNode).ok;
                    setItem(await createTrashItem(node, location, drive, haveSignatureIssues));
                    onItemsLoadedToState(1);
                } catch (e) {
                    handleSdkError(e, { showNotification: !shownErrorNotification });
                    shownErrorNotification = true;
                }
            }
            onFinished();
        } catch (e) {
            handleSdkError(e);
        } finally {
            setLoading('drive', false);
        }
    }, []);

    const loadTrashPhotoNodes = useCallback(async (abortSignal: AbortSignal) => {
        const { setLoading, setItem } = useTrashStore.getState();
        try {
            const drive = getDriveForPhotos();
            setLoading('photos', true);
            let shownErrorNotification = false;
            for await (const trashNode of drive.iterateTrashedNodes(abortSignal)) {
                try {
                    const location = await getFormattedNodeLocation(drive, trashNode);
                    const { node } = getNodeEntityFromMaybeNode(trashNode);
                    const haveSignatureIssues = !getSignatureIssues(trashNode).ok;
                    setItem(await createTrashItem(node, location, drive, haveSignatureIssues));
                } catch (e) {
                    handleSdkError(e, { showNotification: !shownErrorNotification });
                    shownErrorNotification = true;
                }
            }
        } catch (e) {
            handleSdkError(e);
        } finally {
            setLoading('photos', false);
        }
    }, []);

    return {
        loadTrashNodes,
        loadTrashPhotoNodes,
    };
};
