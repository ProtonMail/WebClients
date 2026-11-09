import { useCallback } from 'react';

import { handleSdkError } from '@proton/drive/legacy/errorHandling';
import { getNodeEntity } from '@proton/drive/legacy/sdkUtils/getNodeEntity';
import { driveMetrics } from '@proton/drive/modules/metrics';
import {
    getFormattedNodeLocation,
    getFormattedNodeLocationFromHierarchy,
    iterateNodesFromUidsGenerator,
} from '@proton/drive/modules/nodes';
import { getDrive, getDriveForPhotos } from '@proton/drive/sdk';

import { getSignatureIssues } from '../../utils/sdk/getSignatureIssues';
import { getRootNode } from '../../utils/sdk/mapNodeToLegacyItem';
import { createTrashItem, useTrashStore } from './useTrash.store';

export const useTrashNodes = () => {
    const loadTrashNodes = useCallback(async (abortSignal: AbortSignal) => {
        const { setLoading, setItem } = useTrashStore.getState();

        try {
            const drive = getDrive();
            setLoading('drive', true);
            let shownErrorNotification = false;
            const { onItemsLoadedToState, onFinished } = driveMetrics.drivePerformance.startDataLoad('trash');
            const trashedUidsIterator = drive.iterateTrashedNodeUids(abortSignal);
            for await (const trashNode of iterateNodesFromUidsGenerator(trashedUidsIterator, drive, {
                signal: abortSignal,
            })) {
                try {
                    const hierarchy = await drive.getNodeHierarchy(trashNode.uid);
                    const location = await getFormattedNodeLocationFromHierarchy(drive, hierarchy);
                    const { node } = getNodeEntity(trashNode);
                    const haveSignatureIssues = !getSignatureIssues(trashNode).ok;
                    setItem(createTrashItem(trashNode, node, location, hierarchy[0], haveSignatureIssues));
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
            const trashedUidsIterator = drive.iterateTrashedNodeUids(abortSignal);
            for await (const trashNode of iterateNodesFromUidsGenerator(trashedUidsIterator, drive, {
                signal: abortSignal,
            })) {
                try {
                    const location = await getFormattedNodeLocation(drive, trashNode);
                    const rootNode = await getRootNode(trashNode, drive);
                    const { node } = getNodeEntity(trashNode);
                    const haveSignatureIssues = !getSignatureIssues(trashNode).ok;
                    setItem(createTrashItem(trashNode, node, location, rootNode, haveSignatureIssues));
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
