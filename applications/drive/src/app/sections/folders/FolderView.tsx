import { useEffect } from 'react';

import { useShallow } from 'zustand/react/shallow';

import { Loader, Toolbar, useAppTitle } from '@proton/components';
import { splitNodeUid } from '@proton/drive/index';

import { FileBrowserStateProvider } from '../../components/FileBrowser';
import ToolbarRow from '../../components/sections/ToolbarRow/ToolbarRow';
import UploadDragDrop from '../../components/uploads/UploadDragDrop/UploadDragDrop';
import { useDriveDragMoveTarget } from '../../hooks/drive/useDriveDragMove';
import { useAlbumOnboardingModal } from '../../modals/AlbumOnboardingModal';
import { useUserSettings } from '../../store';
import { useControlledSorting } from '../../store/_views/utils';
import { useDeviceStore } from '../devices/devices.store';
import { FolderBrowser } from './FolderBrowser/FolderBrowser';
import { FolderToolbar } from './FolderBrowser/FolderToolbar';
import { FolderViewBreadcrumbs } from './FolderViewBreadcrumbs';
import { useFolder } from './useFolder';
import { useFolderStore } from './useFolder.store';

interface FolderViewProps {
    shareId: string;
    nodeUid: string | undefined;
}

export function FolderView({ shareId, nodeUid }: FolderViewProps) {
    const { albumOnboardingModal } = useAlbumOnboardingModal();
    const { load } = useFolder();

    const {
        isRootFolder,
        folderName,
        permissions,
        items: folderItems,
    } = useFolderStore(
        useShallow((state) => ({
            isRootFolder: state.folder?.isRoot,
            folderName: state.folder?.name,
            permissions: state.permissions,
            items: state.getFolderItems(),
        }))
    );

    useAppTitle(!isRootFolder ? folderName : undefined);
    const { isLoadingDevices } = useDeviceStore(
        useShallow((state) => ({
            isLoadingDevices: state.isLoading,
        }))
    );

    const { layout, sort, changeSort } = useUserSettings();
    const { sortedList, sortParams, setSorting } = useControlledSorting(folderItems, sort, changeSort);
    const sortedUids = sortedList.map((item) => item.uid);
    const browserViewProps = { layout, sortParams, setSorting, sortedList };

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

    const toolbar = splitedNodeUid ? (
        <FolderToolbar
            volumeId={splitedNodeUid.volumeId}
            shareId={shareId}
            linkId={splitedNodeUid.nodeId}
            allSortedItems={sortedList.map((item) => ({
                nodeUid: item.uid,
                mimeType: item.mimeType,
                storageSize: item.size,
            }))}
        />
    ) : (
        <Toolbar className="toolbar--in-container" />
    );

    if (!splitedNodeUid) {
        return <Loader size="medium" className="absolute inset-center" />;
    }

    return (
        <FileBrowserStateProvider itemIds={sortedUids}>
            {albumOnboardingModal}
            {permissions.canEdit ? (
                <UploadDragDrop
                    shareId={shareId}
                    parentLinkId={splitedNodeUid.nodeId}
                    volumeId={splitedNodeUid.volumeId}
                    className="flex flex-column flex-nowrap flex-1"
                    disabled={!permissions.canEdit}
                >
                    <ToolbarRow titleArea={breadcrumbs} toolbar={toolbar} />
                    <FolderBrowser
                        activeFolder={{ volumeId: splitedNodeUid.volumeId, shareId, linkId: splitedNodeUid.nodeId }}
                        {...browserViewProps}
                    />
                </UploadDragDrop>
            ) : (
                <>
                    <ToolbarRow titleArea={breadcrumbs} toolbar={toolbar} />
                    <FolderBrowser
                        activeFolder={{ volumeId: splitedNodeUid.volumeId, shareId, linkId: splitedNodeUid.nodeId }}
                        {...browserViewProps}
                    />
                </>
            )}
        </FileBrowserStateProvider>
    );
}
