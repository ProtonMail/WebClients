import { useEffect, useState } from 'react';

import type { ModalStateProps } from '@proton/components';
import { getDrive } from '@proton/drive/index';
import useLoading from '@proton/hooks/useLoading';

import { getNodeEntity } from '../../utils/sdk/getNodeEntity';
import { getNodeStorageSize } from '../../utils/sdk/getNodeStorageSize';

export type UseFilesDetailsModalProps = ModalStateProps & {
    nodeUids: string[];
    onClose?: () => void;
};

export function useFilesDetailsModalState({ nodeUids, open, onClose, onExit }: UseFilesDetailsModalProps) {
    const [isLoading, withLoading] = useLoading();
    const [totalSize, setTotalSize] = useState(0);
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        try {
            const fetchNodes = async () => {
                const maybeNodes = await Promise.all(nodeUids.map((uid) => getDrive().getNode(uid)));
                const nodes = maybeNodes.map((mnode) => {
                    const { node } = getNodeEntity(mnode);
                    return node;
                });
                const totalSize = nodes.reduce((acc, node) => getNodeStorageSize(node) + acc, 0);
                setTotalSize(totalSize);
                setHasError(false);
            };
            void withLoading(fetchNodes());
        } catch (e) {
            setHasError(true);
        }
    }, [nodeUids, withLoading]);

    return {
        open,
        onClose,
        onExit,
        isLoading,
        hasError,
        count: nodeUids.length,
        size: totalSize,
    };
}
