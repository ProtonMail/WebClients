import { useCallback, useRef } from 'react';

import { useActiveBreakpoint } from '@proton/components';
import { LayoutSetting } from '@proton/shared/lib/interfaces/drive/userSettings';
import clsx from '@proton/utils/clsx';

import usePublicToken from '../../../hooks/drive/usePublicToken';
import type { DecryptedLink } from '../../../store';
import { useThumbnailsDownload } from '../../../store';
import type { SortField } from '../../../store/_views/utils/useSorting';
import type { BrowserItemId, SortParams } from '../../FileBrowser';
import FileBrowser, { useContextMenuControls, useItemContextMenu, useSelection } from '../../FileBrowser';
import { DrivePublicContextMenu } from '../../sections/DrivePublic/DrivePublicContextMenu';
import { getSelectedItems } from '../../sections/helpers';
import type { PublicLink } from '../interface';
import {
    contentCellsLargeScreen,
    contentCellsSmallScreen,
    headerCellsLargeScreen,
    headerCellsSmallScreen,
} from './CellComponents';
import { EmptyPlaceholder } from './EmptyPlaceholder';

import './FileBrowser.scss';

interface Props {
    folderName: string;
    items: PublicLink[];
    canWrite: boolean;
    onItemOpen: (item: DecryptedLink) => void;
    openInDocs?: (linkId: string) => void;
    isLoading?: boolean;
    sortParams?: SortParams<SortField>;
    setSorting?: (params: SortParams<SortField>) => void;
}

export default function SharedFileBrowser({
    folderName,
    items,
    isLoading,
    sortParams,
    setSorting,
    onItemOpen,
    openInDocs,
    canWrite,
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

    const contentCells = viewportWidth['<=small'] ? contentCellsSmallScreen : contentCellsLargeScreen;
    const headerCells = viewportWidth['<=small'] ? headerCellsSmallScreen : headerCellsLargeScreen;

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
                <EmptyPlaceholder />
            ) : (
                <>
                    {canWrite && (
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
                    )}
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
