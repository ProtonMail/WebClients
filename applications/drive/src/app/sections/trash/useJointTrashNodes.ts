import { useEffect, useMemo, useState } from 'react';

import { useShallow } from 'zustand/react/shallow';

import { NodeType, useDrive } from '@proton/drive/index';
import { SORT_DIRECTION } from '@proton/shared/lib/constants';

import { type SortField, useSortingWithDefault } from '../../hooks/util/useSorting';
import { useStableDefaultShare } from '../../hooks/util/useStableDefaultShare';
import { handleLegacyError } from '../../utils/errorHandling/useLegacyErrorHandler';
import type { LegacyItem } from '../../utils/sdk/mapNodeToLegacyItem';
import { mapNodeToLegacyItem } from '../../utils/sdk/mapNodeToLegacyItem';
import { useTrashStore } from './useTrash.store';

const DEFAULT_SORT = {
    sortField: 'name' as SortField,
    sortOrder: SORT_DIRECTION.ASC,
};

/**
 * Reads all trash nodes from the store and maps them to the legacy format,
 * using the appropriate SDK instance (drive or photos) based on node type.
 */
export const useJointTrashNodes = () => {
    const {
        drive,
        internal: { photos },
    } = useDrive();
    const { getDefaultShare } = useStableDefaultShare();
    const { storeItems, isLoading } = useTrashStore(
        useShallow((state) => ({ storeItems: state.items, isLoading: state.isLoading }))
    );

    const nodesList = useMemo(() => Array.from(storeItems.values()), [storeItems]);
    const [items, setItems] = useState<LegacyItem[]>([]);

    useEffect(() => {
        let isCancelled = false;

        const convertNodes = async () => {
            try {
                const defaultShare = await getDefaultShare();
                if (!defaultShare) {
                    if (!isCancelled) {
                        setItems([]);
                    }
                    return;
                }
                const mappedItems = await Promise.all(
                    nodesList.map((node) => {
                        const sdk = node.type === NodeType.Photo ? photos : drive;
                        return mapNodeToLegacyItem({ ok: true, value: node }, defaultShare.shareId, sdk);
                    })
                );
                if (!isCancelled) {
                    setItems(mappedItems);
                }
            } catch (error) {
                if (!isCancelled) {
                    handleLegacyError(error);
                }
            }
        };
        void convertNodes();

        return () => {
            isCancelled = true;
        };
    }, [nodesList, drive, photos, getDefaultShare]);

    const { sortedList, sortParams, setSorting } = useSortingWithDefault(items, DEFAULT_SORT);

    return {
        trashNodes: sortedList,
        sortParams,
        setSorting,
        isLoading,
    };
};
