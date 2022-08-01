import { useCallback, useEffect, useState } from 'react';

import { LayoutSetting } from '@proton/shared/lib/interfaces/drive/userSettings';

import { DecryptedLink, useDownload } from '../../store';
import { SortField } from '../../store/_views/utils/useSorting';
import { isTransferActive } from '../../utils/transfer';
import FileBrowser, { BrowserItemId, SortParams } from '../FileBrowser';
import { contentCells, headerCells } from './cells';
import { PublicLink } from './interface';

interface Props {
    folderName: string;
    items: DecryptedLink[];
    isLoading?: boolean;
    sortParams?: SortParams<SortField>;
    setSorting?: (params: SortParams<SortField>) => void;
    onItemOpen?: (item: DecryptedLink) => void;
}

export default function SharedFileBrowser({ folderName, items, isLoading, sortParams, setSorting, onItemOpen }: Props) {
    const { downloads, getDownloadsLinksProgresses } = useDownload();
    const [fileBrowserItems, setFileBrowserItems] = useState<PublicLink[]>([]);

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

    const updateFileBrowserItems = () => {
        const linksProgresses = getDownloadsLinksProgresses();

        setFileBrowserItems(
            items.map((item) => {
                const progress = linksProgresses[item.linkId];
                const total = item.isFile ? item.size : progress?.total;
                const percent = (() => {
                    if (progress === undefined || total === undefined) {
                        return 0;
                    }
                    if (total === 0) {
                        return 100;
                    }
                    return Math.round((100 / total) * progress.progress);
                })();
                return {
                    id: item.linkId,
                    ...item,
                    progress: !progress
                        ? undefined
                        : {
                              total,
                              progress: progress.progress,
                              percent,
                              isFinished: percent === 100,
                          },
                    itemRowStyle: !progress
                        ? undefined
                        : {
                              background: `linear-gradient(90deg, var(--interaction-norm-minor-2) ${percent}%, var(--background-norm) ${percent}%)`,
                          },
                };
            })
        );
    };

    // Enrich link date with download progress. Downloads changes only when
    // status changes, not the progress, so if download is active, it needs
    // to run in interval until download is finished.
    useEffect(() => {
        updateFileBrowserItems();

        if (!downloads.some(isTransferActive)) {
            // Progresses are not handled by state and might be updated
            // without notifying a bit after downloads state is changed.
            const id = setTimeout(updateFileBrowserItems, 500);
            return () => {
                clearTimeout(id);
            };
        }

        const id = setInterval(updateFileBrowserItems, 500);
        return () => {
            clearInterval(id);
        };
    }, [items, downloads]);

    return (
        <>
            <FileBrowser
                caption={folderName}
                headerItems={headerCells}
                items={fileBrowserItems}
                layout={LayoutSetting.List}
                loading={isLoading}
                sortParams={sortParams}
                Cells={contentCells}
                onSort={setSorting}
                onItemOpen={handleItemOpen}
            />
        </>
    );
}
