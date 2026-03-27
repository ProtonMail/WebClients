import { useEffect } from 'react';

import { useShallow } from 'zustand/react/shallow';

import { Loader, useAppTitle } from '@proton/components';
import { splitNodeUid } from '@proton/drive/index';

import UploadDragDrop from '../../../components/uploads/UploadDragDrop/UploadDragDrop';
import { useDriveDragMoveTarget } from '../../../hooks/drive/useDriveDragMove';
import { useAlbumOnboardingModal } from '../../../modals/AlbumOnboardingModal';
import { useUserSettings } from '../../../store';
import { useDevicesStore } from '../../devices/useDevices.store';
import { FolderViewBreadcrumbs } from '../FolderViewBreadcrumbs';
import { useFolder } from '../useFolder';
import { useFolderStore } from '../useFolder.store';
import { FolderBrowser } from './FolderBrowser';

interface FolderViewProps {
    shareId: string;
    nodeUid: string | undefined;
}

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

    const { layout } = useUserSettings();

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

    const folderBrowser = (
        <FolderBrowser
            activeFolder={activeFolder}
            layout={layout}
            sortedList={sortedItems}
            breadcrumbs={breadcrumbs}
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
