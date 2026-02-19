import { useEffect, useMemo, useState } from 'react';

import { useShallow } from 'zustand/react/shallow';

import { useDrive } from '@proton/drive/index';
import { SORT_DIRECTION } from '@proton/shared/lib/constants';

import { type SortField, useSortingWithDefault } from '../../hooks/util/useSorting';
import { useStableDefaultShare } from '../../hooks/util/useStableDefaultShare';
import { handleLegacyError } from '../../utils/errorHandling/useLegacyErrorHandler';
import type { LegacyItem } from '../../utils/sdk/mapNodeToLegacyItem';
import { mapNodeToLegacyItem } from '../../utils/sdk/mapNodeToLegacyItem';
import { useTrashStore } from './useTrash.store';
import { useTrashPhotosStore } from './useTrashPhotos.store';

const DEFAULT_SORT = {
    sortField: 'name' as SortField,
    sortOrder: SORT_DIRECTION.ASC,
};

/**
 * Joins nodes from useTrashStore (driveSDK) and from useTrashPhotosStore (photoSDK) into a single array
 * after converting them to legacyItems
 */
export const useJointTrashNodes = () => {
    const {
        drive,
        internal: { photos },
    } = useDrive();
    const { getDefaultShare } = useStableDefaultShare();
    const { driveTrashNodes, driveLoading } = useTrashStore(
        useShallow((state) => ({ driveTrashNodes: state.trashNodes, driveLoading: state.isLoading }))
    );
    const { photoTrashNodes, photoLoading } = useTrashPhotosStore(
        useShallow((state) => ({ photoTrashNodes: state.trashNodes, photoLoading: state.isLoading }))
    );

    const driveNodesList = useMemo(() => Object.values(driveTrashNodes), [driveTrashNodes]);
    const photoNodesList = useMemo(() => Object.values(photoTrashNodes), [photoTrashNodes]);
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
                const driveItems = await Promise.all(
                    driveNodesList.map((node) =>
                        mapNodeToLegacyItem({ ok: true, value: node }, defaultShare.shareId, drive)
                    )
                );
                const photoItems = await Promise.all(
                    photoNodesList.map((node) =>
                        mapNodeToLegacyItem({ ok: true, value: node }, defaultShare.shareId, photos)
                    )
                );
                if (!isCancelled) {
                    setItems([...driveItems, ...photoItems]);
                }
            } catch (error) {
                if (!isCancelled) {
                    handleLegacyError(error);
                }
            }
        };
        void convertNodes();

        return () => {
            // Prevent state updates from async operations that complete after the component
            // unmounts or dependencies change, avoiding race conditions between drive and photo stores.
            isCancelled = true;
        };
    }, [driveNodesList, photoNodesList, drive, photos, getDefaultShare]);

    const { sortedList, sortParams, setSorting } = useSortingWithDefault(items, DEFAULT_SORT);

    return {
        trashNodes: sortedList,
        sortParams,
        setSorting,
        isLoading: driveLoading || photoLoading,
    };
};
