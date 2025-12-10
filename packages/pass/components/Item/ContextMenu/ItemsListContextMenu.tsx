import type { FC, MouseEvent, RefObject } from 'react';
import { useCallback, useEffect, useState } from 'react';
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
    const { isOpen, close } = useContextMenu();
    const { shareId, itemId } = selectedItem;

    const item = useSelector(selectItemWithOptimistic(shareId, itemId));
    const share = useSelector(selectShare(shareId));
    const itemOpened = isOpen(getItemKey(selectedItem));
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
    const { open, isOpen } = useContextMenu();

    /** FIXME: Should check for "item list" context menu type specifically
     * to avoid stale `UniqueItem` state when other menu types are added. */
    const closed = !isOpen();

    useEffect(() => {
        if (closed) setItem(null);
    }, [closed]);

    const onContextMenu = useCallback((event: MouseEvent, item: UniqueItem) => {
        open(event, getItemKey(item));
        setItem(item);
    }, []);

    return { item, onContextMenu };
};
