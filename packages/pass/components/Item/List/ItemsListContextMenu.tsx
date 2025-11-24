import type { FC, MouseEvent, RefObject } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import { pipe } from 'imask/esm/masked/pipe';
import { c } from 'ttag';

import { ContextMenu } from '@proton/pass/components/ContextMenu/ContextMenu';
import {
    CONTEXT_MENU_SEPARATOR,
    type ContextMenuElement,
    type ContextMenuItem,
} from '@proton/pass/components/ContextMenu/ContextMenuItems';
import { useContextMenu } from '@proton/pass/components/ContextMenu/ContextMenuProvider';
import { expDateMask } from '@proton/pass/components/Form/Field/masks/credit-card';
import type { ItemActions } from '@proton/pass/hooks/items/useItemActions';
import { useItemActions } from '@proton/pass/hooks/items/useItemActions';
import type { ItemState } from '@proton/pass/hooks/items/useItemState';
import { useItemState } from '@proton/pass/hooks/items/useItemState';
import { getItemKey } from '@proton/pass/lib/items/item.utils';
import { selectItemWithOptimistic, selectShare } from '@proton/pass/store/selectors';
import type { Item, ItemRevision, Maybe, MaybeNull, Share, UniqueItem } from '@proton/pass/types';
import type { ObfuscatedItemProperty } from '@proton/pass/types/data/obfuscation';
import { formatExpirationDateMMYY } from '@proton/pass/utils/time/expiration-date';

const isEmpty = (value: Maybe<string | ObfuscatedItemProperty>) => {
    if (!value) return true;
    if (typeof value === 'string') return value.length === 0;
    return value.v.length === 0;
};

const formatExpirationCopy = (content: string) => pipe(formatExpirationDateMMYY(content), expDateMask);

const getItemCopyButtons = (item: Item): ContextMenuItem[] => {
    switch (item.type) {
        case 'login':
            return [
                { type: 'button', icon: 'user', name: c('Action').t`Copy username`, copy: item.content.itemUsername },
                { type: 'button', icon: 'envelope', name: c('Action').t`Copy email`, copy: item.content.itemEmail },
                { type: 'button', icon: 'key', name: c('Action').t`Copy password`, copy: item.content.password },
            ];
        case 'creditCard':
            return [
                {
                    type: 'button',
                    icon: 'user',
                    name: c('Action').t`Copy name on card`,
                    copy: item.content.cardholderName,
                },
                {
                    type: 'button',
                    icon: 'credit-card',
                    name: c('Action').t`Copy card number`,
                    copy: item.content.number,
                },
                {
                    type: 'button',
                    icon: 'calendar-today',
                    name: c('Action').t`Copy expiration date`,
                    copy: formatExpirationCopy(item.content.expirationDate),
                },
                {
                    type: 'button',
                    icon: 'shield',
                    name: c('Action').t`Copy security code`,
                    copy: item.content.verificationNumber,
                },
            ];
        case 'note':
            return [{ type: 'button', icon: 'key', name: c('Action').t`Copy note content`, copy: item.metadata.note }];
        default:
            return [];
    }
};

const getItemActionButtons = (
    { isTrashed, isPinned, isReadOnly, canHistory, canTogglePinned, canMove }: ItemState,
    { onEdit, onMove, onPin, onHistory, onTrash }: ItemActions
): ContextMenuItem[] => {
    return isTrashed
        ? [
              /** FIXME: we should be able to restore/delete permanently */
          ]
        : [
              {
                  type: 'button',
                  icon: 'pen',
                  name: c('Action').t`Edit`,
                  action: onEdit,
                  lock: isReadOnly,
              },
              {
                  type: 'button',
                  icon: 'folder-arrow-in',
                  name: c('Action').t`Move to another vault`,
                  action: onMove,
                  lock: !canMove,
              },
              {
                  type: 'button',
                  icon: isPinned ? 'pin-angled-slash' : 'pin-angled',
                  name: isPinned ? c('Action').t`Unpin item` : c('Action').t`Pin item`,
                  action: onPin,
                  lock: !canTogglePinned,
              },
              {
                  type: 'button',
                  icon: 'clock-rotate-left',
                  name: c('Action').t`View history`,
                  action: onHistory,
                  lock: !canHistory,
              },
              {
                  type: 'button',
                  icon: 'pass-trash',
                  name: c('Action').t`Move to trash`,
                  action: onTrash,
                  lock: isReadOnly,
              },
          ];
};

type ConnectedProps = { item: ItemRevision; share: Share; anchorRef: RefObject<HTMLElement> };

const ConnectedItemsListContextMenu: FC<ConnectedProps> = ({ item, share, anchorRef }) => {
    const id = getItemKey(item);

    const itemState = useItemState(item, share);
    const itemActions = useItemActions(item);

    const elements: ContextMenuElement[] = useMemo(() => {
        const copyBtns: ContextMenuElement[] = getItemCopyButtons(item.data).filter(({ copy }) => !isEmpty(copy));
        const actionBtns = getItemActionButtons(itemState, itemActions);
        const separator = copyBtns.length > 0 && actionBtns.length > 0 ? [CONTEXT_MENU_SEPARATOR] : [];

        return copyBtns.concat(separator, actionBtns);
    }, [item, itemState, itemActions]);

    return (
        <ContextMenu
            key={id} // Force recreate on item change to recompute size
            id={id}
            anchorRef={anchorRef}
            elements={elements}
        />
    );
};

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

    useEffect(() => {
        if (autoClose) close();
    }, [autoClose]);

    return item && share && <ConnectedItemsListContextMenu item={item} share={share} anchorRef={anchorRef} />;
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
