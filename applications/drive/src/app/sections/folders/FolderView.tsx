import { useEffect } from 'react';

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
import { FolderBrowser } from './FolderBrowser/FolderBrowser';
import { FolderToolbar } from './FolderBrowser/FolderToolbar';
import { useFolder } from './useFolder';
import { useFolderStore } from './useFolder.store';

export type DriveSectionRouteProps = { shareId?: string; type?: LinkURLType; linkId?: string };

export function FolderView() {
    const [renderAlbumOnboardingModal] = useAlbumOnboardingModal();
    const { activeFolder } = useActiveShare();
    const parentUid = generateNodeUid(activeFolder.volumeId, activeFolder.linkId);
    const { load } = useFolder();
    const { permissions, itemUids } = useFolderStore(
        useShallow((state) => ({
            itemUids: state.getItemUids(),
            permissions: state.permissions,
        }))
    );

    useEffect(() => {
        const ac = new AbortController();
        void load(parentUid, activeFolder.shareId, ac);

        return () => {
            ac.abort();
        };
    }, [parentUid, activeFolder, load]);

    const breadcrumbs = activeFolder && <DriveBreadcrumbs activeFolder={activeFolder} />;

    const toolbar = activeFolder ? (
        <FolderToolbar volumeId={activeFolder.volumeId} shareId={activeFolder.shareId} linkId={activeFolder.linkId} />
    ) : (
        <Toolbar className="toolbar--in-container" />
    );

    return (
        <FileBrowserStateProvider itemIds={itemUids}>
            {renderAlbumOnboardingModal}
            {permissions.canEdit ? (
                <UploadDragDrop
                    shareId={activeFolder.shareId}
                    parentLinkId={activeFolder.linkId}
                    className="flex flex-column flex-nowrap flex-1"
                    disabled={!permissions.canEdit}
                >
                    <ToolbarRow titleArea={breadcrumbs} toolbar={toolbar} />

                    {activeFolder && <FolderBrowser activeFolder={activeFolder} />}
                </UploadDragDrop>
            ) : (
                <>
                    <ToolbarRow titleArea={breadcrumbs} toolbar={toolbar} />
                    {activeFolder && <FolderBrowser activeFolder={activeFolder} />}
                </>
            )}
        </FileBrowserStateProvider>
    );
}
