import { useCallback, useEffect, useState } from 'react';

import type { ModalStateProps } from '@proton/components';
import { getDrive } from '@proton/drive';
import type { useSharingModal } from '@proton/drive/modules/sharingModal';

import { directoryTreeFactory } from '../../modules/directoryTree';
import { getNodeUidFromTreeItemId } from '../../modules/directoryTree/helpers';
import type { DirectoryTreeItem } from '../../statelessComponents/DirectoryTree/DirectoryTree';
import { handleSdkError } from '../../utils/errorHandling/handleSdkError';

export type SelectLinkToShareModalInnerProps = {
    showSharingModal: ReturnType<typeof useSharingModal>['showSharingModal'];
};

export type UseSelectLinkToShareModalStateProps = ModalStateProps & SelectLinkToShareModalInnerProps;

const ABSTRACT_ROOT_TYPES = new Set(['files-root', 'devices-root', 'shares-root']);

/**
 * Creates isolated directory tree state for this modal.
 * Each modal instance maintains its own tree state independent of other sections.
 */
const useSelectLinkToShareDirectoryTree = directoryTreeFactory();

export const useSelectLinkToShareModalState = ({
    onClose,
    showSharingModal,
    ...modalProps
}: UseSelectLinkToShareModalStateProps) => {
    const [directoryTreeLoading, setDirectoryTreeLoading] = useState(true);

    const { initializeTree, toggleExpand, treeRoots } = useSelectLinkToShareDirectoryTree('selectLinkToShareModal', {
        hideSharedWithMe: true,
    });

    useEffect(() => {
        setDirectoryTreeLoading(true);
        initializeTree()
            .then(() => setDirectoryTreeLoading(false))
            .catch(handleSdkError);
    }, [initializeTree, handleSdkError]);

    const [selectedTreeId, setSelectedTreeId] = useState<string>();
    const selectedNodeUid = selectedTreeId ? getNodeUidFromTreeItemId(selectedTreeId) : undefined;

    const handleSelect = useCallback((treeItemId: string, item: DirectoryTreeItem) => {
        if (!ABSTRACT_ROOT_TYPES.has(item.type)) {
            setSelectedTreeId(treeItemId);
        }
    }, []);

    if (directoryTreeLoading) {
        return { loaded: false as const };
    }

    const handleSubmit = async () => {
        if (!selectedNodeUid) {
            return;
        }
        // We don't have tree for photos section so this will only be used with standard drive
        showSharingModal({ nodeUid: selectedNodeUid, drive: getDrive() });
        onClose();
    };

    return {
        loaded: true as const,
        treeRoots,
        toggleExpand,
        selectedTreeId,
        selectedNodeUid,
        handleSelect,
        handleSubmit,
        onClose,
        ...modalProps,
    };
};
