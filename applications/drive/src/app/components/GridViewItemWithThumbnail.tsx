import { useThumbnailStore } from '../zustand/thumbnails/thumbnails.store';
import type { DriveItem } from './sections/Drive/Drive';
import { GridViewItem } from './sections/FileBrowser/GridViewItemLink';
import type { SharedLinkItem } from './sections/SharedLinks/SharedLinks';
import type { SharedWithMeItem } from './sections/SharedWithMe/SharedWithMe';
import type { TrashItem } from './sections/Trash/Trash';

type GridItem = DriveItem | TrashItem | SharedLinkItem | SharedWithMeItem;

interface GridViewItemWithThumbnailProps {
    item: GridItem & { thumbnailId?: string };
}

/**
 * @deprecated This should only be used during FileBrowser migration and with sdk views
 */
export const GridViewItemWithThumbnail = ({ item }: GridViewItemWithThumbnailProps) => {
    const thumbnail = useThumbnailStore((state) =>
        item.thumbnailId ? state.getThumbnail(item.thumbnailId) : undefined
    );
    return <GridViewItem item={{ ...item, cachedThumbnailUrl: thumbnail?.sdUrl }} />;
};
