import { useThumbnail } from '@proton/drive/modules/thumbnails';

import { GridViewItem } from './sections/FileBrowser/GridViewItemLink';
import type { DriveItem, SharedLinkItem, SharedWithMeItem, TrashItem } from './sections/interface';

type GridItem = DriveItem | TrashItem | SharedLinkItem | SharedWithMeItem;

interface GridViewItemWithThumbnailProps {
    item: GridItem & { activeRevisionUid?: string };
}

/**
 * @deprecated This should only be used during FileBrowser migration and with sdk views
 */
export const GridViewItemWithThumbnail = ({ item }: GridViewItemWithThumbnailProps) => {
    const thumbnail = useThumbnail(item.activeRevisionUid);
    return <GridViewItem item={{ ...item, cachedThumbnailUrl: thumbnail?.sdUrl }} />;
};
