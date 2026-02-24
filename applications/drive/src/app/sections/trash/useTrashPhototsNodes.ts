import { useCallback } from 'react';

import { useDrive } from '@proton/drive/index';
import { getNodeEntityFromMaybeNode } from '@proton/drive/modules/upload/utils/getNodeEntityFromMaybeNode';

import { handleSdkError } from '../../utils/errorHandling/handleSdkError';
import { useTrashPhotosStore } from './useTrashPhotos.store';

export type SimpleTrashNode = {
    uid: string;
    name: string;
};

export const useTrashPhototsNodes = () => {
    const {
        internal: { photos },
    } = useDrive();

    const loadTrashPhotoNodes = useCallback(
        async (abortSignal: AbortSignal) => {
            const { setLoading, isLoading, setNodes } = useTrashPhotosStore.getState();
            if (isLoading) {
                return;
            }
            try {
                setLoading(true);
                let shownErrorNotification = false;
                for await (const trashNode of photos.iterateTrashedNodes(abortSignal)) {
                    try {
                        const { node } = getNodeEntityFromMaybeNode(trashNode);
                        setNodes({ [node.uid]: node });
                    } catch (e) {
                        handleSdkError(e, { showNotification: !shownErrorNotification });
                        shownErrorNotification = true;
                    }
                }
            } catch (e) {
                handleSdkError(e);
            } finally {
                setLoading(false);
            }
        },
        [photos]
    );

    return {
        loadTrashPhotoNodes,
    };
};
