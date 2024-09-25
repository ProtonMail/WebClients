import { useCallback } from 'react';

import { useActiveBreakpoint } from '@proton/components';
import { LayoutSetting } from '@proton/shared/lib/interfaces/drive/userSettings';
import clsx from '@proton/utils/clsx';

import usePublicToken from '../../../hooks/drive/usePublicToken';
import type { DecryptedLink } from '../../../store';
import { useThumbnailsDownload } from '../../../store';
import type { SortField } from '../../../store/_views/utils/useSorting';
import type { BrowserItemId, SortParams } from '../../FileBrowser';
import FileBrowser from '../../FileBrowser';
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
    isLoading?: boolean;
    sortParams?: SortParams<SortField>;
    setSorting?: (params: SortParams<SortField>) => void;
    onItemOpen?: (item: DecryptedLink) => void;
}

export default function SharedFileBrowser({ folderName, items, isLoading, sortParams, setSorting, onItemOpen }: Props) {
    const { viewportWidth } = useActiveBreakpoint();
    const thumbnails = useThumbnailsDownload();

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

    const contentCells = viewportWidth['<=small'] ? contentCellsSmallScreen : contentCellsLargeScreen;
    const headerCells = viewportWidth['<=small'] ? headerCellsSmallScreen : headerCellsLargeScreen;

    const classname = clsx([
        'flex flex-column flex-nowrap shared-url-file-browser',
        viewportWidth['<=small'] && 'flex-1',
    ]);

    const isListEmpty = items.length === 0 && !isLoading;

    const handleItemRender = (item: DecryptedLink) => {
        if (item.hasThumbnail && item.activeRevision && !item.cachedThumbnailUrl) {
            thumbnails.addToDownloadQueue(token, item.linkId, item.activeRevision.id);
        }
    };

    return (
        <div className={classname}>
            {isListEmpty ? (
                <EmptyPlaceholder />
            ) : (
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
                />
            )}
        </div>
    );
}
