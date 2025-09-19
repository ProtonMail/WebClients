import { type FC, useCallback } from 'react';

import { VirtualGrid } from 'proton-authenticator/app/components/Layout/Grid/VirtualGrid';
import type { GridDefinition } from 'proton-authenticator/app/components/Layout/Grid/hooks/useGridConfig';
import type { OnGridReorder } from 'proton-authenticator/app/components/Layout/Grid/hooks/useGridSort';
import type { Item as DatabaseItem } from 'proton-authenticator/lib/db/entities/items';
import { useAppSelector } from 'proton-authenticator/store/utils';

import { prop } from '@proton/pass/utils/fp/lens';

import { Item } from './Item';

const GRID_DEFINITION: GridDefinition = {
    initialWidth: window.innerWidth - 48,
    itemHeight: 130,
    gap: 12,
    columns: {
        0: 1,
        600: 2,
        1200: 3,
        1800: 4,
        2400: 5,
    },
};

type Props = {
    items: DatabaseItem[];
    search?: string;
    onEdit: (item: DatabaseItem) => void;
    onDelete: (item: DatabaseItem) => void;
    onReorder: (item: DatabaseItem, beforeId?: string, afterId?: string) => void;
};

export const ItemsGrid: FC<Props> = ({ items, search, onEdit, onDelete, onReorder }) => {
    const { animateCodes, digitStyle, hideCodes } = useAppSelector(prop('settings'));
    const syncState = useAppSelector(({ auth }) => auth.syncState);
    const loading = syncState === 'loading';

    /** Validate reorder operation to prevent mixing synced and non-synced items.
     * - Block moving synced item between non-synced items
     * - Block moving non-synced item between synced items
     * - Accept reordering within same sync status group
     * - Accept moving to list boundaries where sync status matches expected position */
    const handleReorder = useCallback<OnGridReorder<DatabaseItem>>(
        (item: DatabaseItem, { before, after, first, last }) => {
            const itemSync = Boolean(item.syncMetadata);
            const beforeSync = before && Boolean(before.syncMetadata);
            const afterSync = after && Boolean(after.syncMetadata);
            const firstSync = first && Boolean(first.syncMetadata);
            const lastSync = last && Boolean(last.syncMetadata);

            const valid = (() => {
                if (!before) return firstSync === itemSync; /** Moving to start */
                if (!after) return lastSync === itemSync; /** Moving to end */
                if (beforeSync === afterSync) return beforeSync === itemSync; /** Same group */
                return (beforeSync === itemSync) !== (afterSync === itemSync); /** Group boundary */
            })();

            if (!valid) return false;

            onReorder(item, before?.id, after?.id);
            return true;
        },
        [onReorder, items]
    );

    return (
        <VirtualGrid
            className="items-grid h-full max-h-full overflow-auto px-6 pb-3"
            definition={GRID_DEFINITION}
            disabled={loading || items.length <= 1}
            items={items}
            onReorder={handleReorder}
            renderGridItem={(item) => (
                <Item
                    key={item.id}
                    animateCodes={animateCodes}
                    digitStyle={digitStyle}
                    disabled={loading}
                    hideCodes={hideCodes}
                    item={item}
                    search={search}
                    syncing={syncState !== 'off' && !item.syncMetadata}
                    onDelete={onDelete}
                    onEdit={onEdit}
                />
            )}
        />
    );
};
