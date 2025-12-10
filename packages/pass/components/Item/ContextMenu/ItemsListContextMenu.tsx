import type { FC, MouseEvent, RefObject } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import { useBulkSelection } from '@proton/pass/components/Bulk/BulkSelectionState';
import { useContextMenu } from '@proton/pass/components/ContextMenu/ContextMenuProvider';
import { BulkItemsContextMenu } from '@proton/pass/components/Item/ContextMenu/BulkItemsContextMenu';
import { ItemContextMenu } from '@proton/pass/components/Item/ContextMenu/ItemContextMenu';
import { getItemKey } from '@proton/pass/lib/items/item.utils';
import { selectItemWithOptimistic, selectShare } from '@proton/pass/store/selectors';
import type { MaybeNull, UniqueItem } from '@proton/pass/types';

type Props = UniqueItem & { anchorRef: RefObject<HTMLElement> };

/** NOTE: A context menu can remain open after its item is removed or updated.
 * This component handles graceful failures while keeping fresh data available. */
export const ItemsListContextMenu: FC<Props> = ({ anchorRef, ...selectedItem }) => {
    const { close, state } = useContextMenu();
    const { shareId, itemId } = selectedItem;

    const item = useSelector(selectItemWithOptimistic(shareId, itemId));
    const share = useSelector(selectShare(shareId));
    const itemOpened = state?.id === getItemKey(selectedItem);
    const autoClose = !item && itemOpened;
    const bulk = useBulkSelection();
    const isBulk = bulk.count > 0;

    useEffect(() => {
        if (autoClose) close();
    }, [autoClose]);

    return (
        <>
            {!isBulk && item && share && <ItemContextMenu item={item} share={share} anchorRef={anchorRef} />}
            {isBulk && item && <BulkItemsContextMenu item={item} bulk={bulk.selection} anchorRef={anchorRef} />}
        </>
    );
};

export const useItemContextMenu = () => {
    const [item, setItem] = useState<MaybeNull<UniqueItem>>(null);
    const { open, state } = useContextMenu();
    const closed = !state?.id;

    useEffect(() => {
        if (closed) setItem(null);
    }, [closed]);

    const onContextMenu = useCallback((event: MouseEvent, item: UniqueItem) => {
        open(event, getItemKey(item));
        setItem(item);
    }, []);

    return useMemo(() => ({ item, onContextMenu }), [item]);
};
