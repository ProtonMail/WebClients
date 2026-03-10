import { useCallback } from 'react';

import { getDrive, getDriveForPhotos } from '@proton/drive/index';
import { getNodeEntityFromMaybeNode } from '@proton/drive/modules/upload/utils/getNodeEntityFromMaybeNode';

import { handleSdkError } from '../../utils/errorHandling/handleSdkError';
import { useTrashStore } from './useTrash.store';

export const useTrashNodes = () => {
    const loadTrashNodes = useCallback(async (abortSignal: AbortSignal) => {
        const { setLoading, setItem } = useTrashStore.getState();

        try {
            setLoading('drive', true);
            let shownErrorNotification = false;
            for await (const trashNode of getDrive().iterateTrashedNodes(abortSignal)) {
                try {
                    const { node } = getNodeEntityFromMaybeNode(trashNode);
                    setItem(node);
                } catch (e) {
                    handleSdkError(e, { showNotification: !shownErrorNotification });
                    shownErrorNotification = true;
                }
            }
        } catch (e) {
            handleSdkError(e);
        } finally {
            setLoading('drive', false);
        }
    }, []);

    const loadTrashPhotoNodes = useCallback(async (abortSignal: AbortSignal) => {
        const { setLoading, setItem } = useTrashStore.getState();
        try {
            setLoading('photos', true);
            let shownErrorNotification = false;
            for await (const trashNode of getDriveForPhotos().iterateTrashedNodes(abortSignal)) {
                try {
                    const { node } = getNodeEntityFromMaybeNode(trashNode);
                    setItem(node);
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
