import { useEffect } from 'react';

import { useShallow } from 'zustand/react/shallow';

import { Loader, useAppTitle } from '@proton/components';
import { splitNodeUid } from '@proton/drive/index';
import type { SORT_DIRECTION } from '@proton/shared/lib/constants';

import UploadDragDrop from '../../../components/uploads/UploadDragDrop/UploadDragDrop';
import { useDriveDragMoveTarget } from '../../../hooks/drive/useDriveDragMove';
import { useAlbumOnboardingModal } from '../../../modals/AlbumOnboardingModal';
import { SortField } from '../../../modules/sorting/types';
import { useUserSettings } from '../../../store';
import { SortField as StoredSortField } from '../../../store/_views/utils/useSorting';
import { useDevicesStore } from '../../devices/useDevices.store';
import { FolderViewBreadcrumbs } from '../FolderViewBreadcrumbs';
import { getFolderSortConfig } from '../folder.sorting';
import { useFolder } from '../useFolder';
import { useFolderStore } from '../useFolder.store';
import { FolderBrowser } from './FolderBrowser';

interface FolderViewProps {
    shareId: string;
    nodeUid: string | undefined;
}

const STORED_SORT_FIELD_TO_SORT_FIELD = {
    fileModifyTime: SortField.modificationTime,
    name: SortField.name,
    size: SortField.size,
};

export function FolderView({ shareId, nodeUid }: FolderViewProps) {
    const { albumOnboardingModal } = useAlbumOnboardingModal();
    const { load } = useFolder();

    const { isRootFolder, folderName, permissions, sortedItemUids } = useFolderStore(
        useShallow((state) => ({
            isRootFolder: state.folder?.isRoot,
            folderName: state.folder?.name,
            permissions: state.permissions,
            sortedItemUids: state.sortedItemUids,
        }))
    );

    useAppTitle(!isRootFolder ? folderName : undefined);
    const { isLoadingDevices } = useDevicesStore(
        useShallow((state) => ({
            isLoadingDevices: state.isLoading,
        }))
    );

    const { layout, sort, changeSort } = useUserSettings();
    // Initialize folder sort from user settings on first mount
    useEffect(() => {
        const convertedSortField = STORED_SORT_FIELD_TO_SORT_FIELD[sort.sortField] ?? SortField.modificationTime;
        useFolderStore.getState().setSorting({
            sortField: convertedSortField,
            direction: sort.sortOrder,
            sortConfig: getFolderSortConfig(convertedSortField),
        });
    }, [sort.sortField, sort.sortOrder]);

    useEffect(() => {
        const ac = new AbortController();
        if (!isLoadingDevices && nodeUid) {
            void load(nodeUid, shareId, ac);
        }
        return () => {
            ac.abort();
        };
    }, [shareId, nodeUid, load, isLoadingDevices]);

    const { getHandleItemDrop } = useDriveDragMoveTarget(shareId);
    const breadcrumbs = nodeUid && <FolderViewBreadcrumbs createHandleItemDrop={getHandleItemDrop} nodeUid={nodeUid} />;

    const splitedNodeUid = nodeUid ? splitNodeUid(nodeUid) : undefined;

    const sortedItems = sortedItemUids.map((uid) => useFolderStore.getState().items.get(uid)).filter((item) => !!item);

    if (!splitedNodeUid) {
        return <Loader size="medium" className="absolute inset-center" />;
    }

    const activeFolder = { volumeId: splitedNodeUid.volumeId, shareId, linkId: splitedNodeUid.nodeId };

    function handleSortChange(sortField: SortField, direction: SORT_DIRECTION) {
        let convertedSortField: StoredSortField = StoredSortField.fileModifyTime;
        if (sortField === SortField.name) {
            convertedSortField = StoredSortField.name;
        } else if (sortField === SortField.size) {
            convertedSortField = StoredSortField.size;
        }
        return changeSort({ sortField: convertedSortField, sortOrder: direction });
    }

    const folderBrowser = (
        <FolderBrowser
            activeFolder={activeFolder}
            layout={layout}
            sortedList={sortedItems}
            breadcrumbs={breadcrumbs}
            onSortChange={handleSortChange}
        />
    );

    return (
        <>
            {albumOnboardingModal}
            {permissions.canEdit ? (
                <UploadDragDrop
                    shareId={shareId}
                    parentLinkId={splitedNodeUid.nodeId}
                    volumeId={splitedNodeUid.volumeId}
                    className="flex flex-column flex-nowrap flex-1"
                    disabled={!permissions.canEdit}
                >
                    {folderBrowser}
                </UploadDragDrop>
            ) : (
                folderBrowser
            )}
        </>
    );
}
