import { useEffect } from 'react';
import { useParams } from 'react-router-dom-v5-compat';

import { useShallow } from 'zustand/react/shallow';

import { Toolbar } from '@proton/components';
import { generateNodeUid } from '@proton/drive/index';
import type { LinkURLType } from '@proton/shared/lib/drive/constants';

import DriveBreadcrumbs from '../../components/DriveBreadcrumbs';
import { FileBrowserStateProvider } from '../../components/FileBrowser';
import { useAlbumOnboardingModal } from '../../components/modals/AlbumOnboardingModal';
import ToolbarRow from '../../components/sections/ToolbarRow/ToolbarRow';
import UploadDragDrop from '../../components/uploads/UploadDragDrop/UploadDragDrop';
import { useActiveShare } from '../../hooks/drive/useActiveShare';
import { useUserSettings } from '../../store';
import { useControlledSorting } from '../../store/_views/utils';
import { useDeviceStore } from '../devices/devices.store';
import { FolderBrowser } from './FolderBrowser/FolderBrowser';
import { FolderToolbar } from './FolderBrowser/FolderToolbar';
import { useFolder } from './useFolder';
import { useFolderStore } from './useFolder.store';

export type DriveSectionRouteProps = { shareId?: string; type?: LinkURLType; linkId?: string };

// SDK-ready counterpart of DriveViewDeprecated
export function FolderView() {
    const [renderAlbumOnboardingModal] = useAlbumOnboardingModal();
    const { activeFolder } = useActiveShare();
    const parentUid = generateNodeUid(activeFolder.volumeId, activeFolder.linkId);
    const { load } = useFolder();

    const { permissions, items: folderItems } = useFolderStore(
        useShallow((state) => ({
            permissions: state.permissions,
            items: state.getFolderItems(),
        }))
    );
    const { isLoadingDevices } = useDeviceStore(
        useShallow((state) => ({
            isLoadingDevices: state.isLoading,
        }))
    );

    const { layout, sort, changeSort } = useUserSettings();
    const { sortedList, sortParams, setSorting } = useControlledSorting(folderItems, sort, changeSort);
    const sortedUids = sortedList.map((item) => item.uid);
    const browserViewProps = { layout, sortParams, setSorting, sortedList };
    const { shareId: activeFolderShareId, linkId: activeFolderLinkId } = activeFolder;
    const { linkId, shareId } = useParams();

    useEffect(() => {
        const ac = new AbortController();

        // Temporary fix while we have to use activeFolder instead of relying on params as the only source of truth
        if (shareId === activeFolderShareId && linkId === activeFolderLinkId && !isLoadingDevices) {
            void load(parentUid, activeFolderShareId, ac);
        }
        return () => {
            ac.abort();
        };
    }, [parentUid, activeFolderLinkId, load, isLoadingDevices, activeFolderShareId, shareId, linkId]);

    const breadcrumbs = activeFolder && <DriveBreadcrumbs activeFolder={activeFolder} />;

    const toolbar = activeFolder ? (
        <FolderToolbar volumeId={activeFolder.volumeId} shareId={activeFolder.shareId} linkId={activeFolder.linkId} />
    ) : (
        <Toolbar className="toolbar--in-container" />
    );

    return (
        <FileBrowserStateProvider itemIds={sortedUids}>
            {renderAlbumOnboardingModal}
            {permissions.canEdit ? (
                <UploadDragDrop
                    shareId={activeFolder.shareId}
                    parentLinkId={activeFolder.linkId}
                    className="flex flex-column flex-nowrap flex-1"
                    disabled={!permissions.canEdit}
                >
                    <ToolbarRow titleArea={breadcrumbs} toolbar={toolbar} />

                    {activeFolder && <FolderBrowser activeFolder={activeFolder} {...browserViewProps} />}
                </UploadDragDrop>
            ) : (
                <>
                    <ToolbarRow titleArea={breadcrumbs} toolbar={toolbar} />
                    {activeFolder && <FolderBrowser activeFolder={activeFolder} {...browserViewProps} />}
                </>
            )}
        </FileBrowserStateProvider>
    );
}
