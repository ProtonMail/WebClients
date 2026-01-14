import { useCallback, useRef } from 'react';

import { useActiveBreakpoint } from '@proton/components';
import { LayoutSetting } from '@proton/shared/lib/interfaces/drive/userSettings';
import clsx from '@proton/utils/clsx';

import usePublicToken from '../../../hooks/drive/usePublicToken';
import { type DecryptedLink, useThumbnailsDownload } from '../../../store';
import type { SortField } from '../../../store/_views/utils/useSorting';
import type { BrowserItemId, SortParams } from '../../FileBrowser';
import FileBrowser, { useContextMenuControls, useItemContextMenu, useSelection } from '../../FileBrowser';
import { DrivePublicContextMenu } from '../../sections/DrivePublic/DrivePublicContextMenu';
import { getSelectedItems } from '../../sections/helpers';
import type { PublicLink } from '../interface';
import {
    getContentLargeScreen,
    getContentSmallScreen,
    getHeaderLargeScreen,
    getHeaderSmallScreen,
} from './CellComponents';
import { SharedFolderPageEmptyView } from './SharedFolderPageEmptyView';

import './FileBrowser.scss';

interface Props {
    folderName: string;
    items: PublicLink[];
    onItemOpen: (item: DecryptedLink) => void;
    openInDocs?: (linkId: string, options?: { redirect?: boolean; download?: boolean; mimeType?: string }) => void;
    isLoading?: boolean;
    sortParams?: SortParams<SortField>;
    setSorting?: (params: SortParams<SortField>) => void;
    canWrite: boolean;
    volumeId: string;
    linkId: string;
}

export function SharedFileBrowser({
    folderName,
    items,
    isLoading,
    sortParams,
    setSorting,
    onItemOpen,
    openInDocs,
    canWrite,
    volumeId,
    linkId,
}: Props) {
    const { viewportWidth } = useActiveBreakpoint();
    const thumbnails = useThumbnailsDownload();
    const selectionControls = useSelection();

    const { token } = usePublicToken();

    const handleItemOpen = useCallback(
        (id: BrowserItemId) => {
            const item = items.find((item) => item.linkId === id);
            if (!item) {
                return;
            }
            onItemOpen?.(item);
        },
        [items]
    );

    const contextMenuAnchorRef = useRef<HTMLDivElement>(null);
    const browserItemContextMenu = useItemContextMenu();
    const browserContextMenu = useContextMenuControls();

    const selectedItems = getSelectedItems(items || [], selectionControls?.selectedItemIds || []);

    const headerCells = viewportWidth['<=small'] ? getHeaderSmallScreen() : getHeaderLargeScreen(canWrite);
    const contentCells = viewportWidth['<=small'] ? getContentSmallScreen() : getContentLargeScreen(canWrite);

    const classname = clsx([
        'flex flex-column flex-nowrap shared-url-file-browser',
        viewportWidth['<=small'] && 'flex-1',
    ]);

    const isListEmpty = items.length === 0 && !isLoading;

    const handleItemRender = useCallback(
        (item: DecryptedLink) => {
            if (item.hasThumbnail && item.activeRevision && !item.cachedThumbnailUrl) {
                thumbnails.addToDownloadQueue(token, item.linkId, item.activeRevision.id);
            }
        },
        [thumbnails, token]
    );

    return (
        <div className={classname}>
            {isListEmpty ? (
                <SharedFolderPageEmptyView volumeId={volumeId} token={token} linkId={linkId} />
            ) : (
                <>
                    <DrivePublicContextMenu
                        isActiveLinkReadOnly={false}
                        shareId={token}
                        selectedLinks={selectedItems}
                        anchorRef={contextMenuAnchorRef}
                        close={browserItemContextMenu.close}
                        isOpen={browserItemContextMenu.isOpen}
                        open={browserItemContextMenu.open}
                        position={browserItemContextMenu.position}
                        openPreview={onItemOpen}
                        openInDocs={openInDocs}
                    />
                    <FileBrowser
                        caption={folderName}
                        headerItems={headerCells}
                        items={items}
                        layout={LayoutSetting.List}
                        loading={isLoading}
                        sortParams={sortParams}
                        Cells={contentCells}
                        onSort={setSorting}
                        onItemOpen={handleItemOpen}
                        onItemRender={handleItemRender}
                        contextMenuAnchorRef={contextMenuAnchorRef}
                        onItemContextMenu={browserItemContextMenu.handleContextMenu}
                        onViewContextMenu={browserContextMenu.handleContextMenu}
                    />
                </>
            )}
        </div>
    );
}
