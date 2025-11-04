import { useThumbnailStore } from '../zustand/thumbnails/thumbnails.store';
import { GridViewItem } from './sections/FileBrowser/GridViewItemLink';
import type { DriveItem, SharedLinkItem, SharedWithMeItem, TrashItem } from './sections/interface';

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
