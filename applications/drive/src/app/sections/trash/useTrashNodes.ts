import { useCallback } from 'react';

import { useDrive } from '@proton/drive/index';
import { getNodeEntityFromMaybeNode } from '@proton/drive/modules/upload/utils/getNodeEntityFromMaybeNode';

import { useSdkErrorHandler } from '../../utils/errorHandling/useSdkErrorHandler';
import { useTrashStore } from './useTrash.store';

export type SimpleTrashNode = {
    uid: string;
    name: string;
};

export const useTrashNodes = () => {
    const { handleError } = useSdkErrorHandler();
    const { drive } = useDrive();

    const loadTrashNodes = useCallback(
        async (abortSignal: AbortSignal) => {
            const { setLoading, isLoading, setNodes } = useTrashStore.getState();
            if (isLoading) {
                return;
            }

            try {
                setLoading(true);
                let shownErrorNotification = false;
                for await (const trashNode of drive.iterateTrashedNodes(abortSignal)) {
                    try {
                        const { node } = getNodeEntityFromMaybeNode(trashNode);
                        setNodes({ [node.uid]: node });
                    } catch (e) {
                        handleError(e, { showNotification: !shownErrorNotification });
                        shownErrorNotification = true;
                    }
                }
            } catch (e) {
                handleError(e);
            } finally {
                setLoading(false);
            }
        },
        [drive, handleError]
    );

    return {
        loadTrashNodes,
    };
};
