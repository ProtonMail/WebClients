import type { FC, MouseEvent, RefObject } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { c } from 'ttag';

import { ContextMenu } from '@proton/pass/components/ContextMenu/ContextMenu';
import {
    CONTEXT_MENU_SEPARATOR,
    type ContextMenuElement,
    type ContextMenuItem,
} from '@proton/pass/components/ContextMenu/ContextMenuItems';
import { useContextMenu } from '@proton/pass/components/ContextMenu/ContextMenuProvider';
import { useItemsActions } from '@proton/pass/components/Item/ItemActionsProvider';
import { useNavigationActions } from '@proton/pass/components/Navigation/NavigationActions';
import { useItemScope } from '@proton/pass/components/Navigation/NavigationMatches';
import { VaultSelectMode } from '@proton/pass/components/Vault/VaultSelect';
import { isTrashed } from '@proton/pass/lib/items/item.predicates';
import { getItemKey } from '@proton/pass/lib/items/item.utils';
import { itemPinIntent, itemUnpinIntent } from '@proton/pass/store/actions';
import { selectItemWithOptimistic } from '@proton/pass/store/selectors';
import { selectPassPlan } from '@proton/pass/store/selectors';
import type { Item, ItemRevision, Maybe, MaybeNull, UniqueItem } from '@proton/pass/types';
import { UserPassPlan } from '@proton/pass/types/api/plan';
import type { ObfuscatedItemProperty } from '@proton/pass/types/data/obfuscation';

const isEmpty = (value: Maybe<string | ObfuscatedItemProperty>) => {
    if (!value) return true;
    if (typeof value === 'string') return value.length === 0;
    return value.v.length === 0;
};

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
                    copy: item.content.expirationDate,
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
    item: ItemRevision,
    isFreePlan: boolean,
    actions: {
        handleEdit: () => void;
        handleMove: () => void;
        handlePin: () => void;
        handleHistory: () => void;
        handleTrash: () => void;
    }
): ContextMenuItem[] => {
    return !isTrashed(item)
        ? [
              {
                  type: 'button',
                  icon: 'pen',
                  name: c('Action').t`Edit`,
                  action: actions.handleEdit,
              },
              {
                  type: 'button',
                  icon: 'folder-arrow-in',
                  name: c('Action').t`Move to another vault`,
                  action: actions.handleMove,
              },
              {
                  type: 'button',
                  icon: 'pin-angled',
                  name: c('Action').t`Pin`,
                  action: actions.handlePin,
              },
              {
                  type: 'button',
                  icon: 'clock-rotate-left',
                  name: c('Action').t`View history`,
                  action: actions.handleHistory,
                  lock: isFreePlan,
              },
              {
                  type: 'button',
                  icon: 'pass-trash',
                  name: c('Action').t`Move to trash`,
                  action: actions.handleTrash,
              },
          ]
        : [
              /** FIXME: we should be able to restore/delete permanently */
          ];
};

type ConnectedProps = { item: ItemRevision; anchorRef: RefObject<HTMLElement> };

const ConnectedItemsListContextMenu: FC<ConnectedProps> = ({ item, anchorRef }) => {
    const scope = useItemScope();
    const { selectItem } = useNavigationActions();
    const itemActions = useItemsActions();
    const dispatch = useDispatch();
    const isFreePlan = useSelector(selectPassPlan) === UserPassPlan.FREE;

    const id = getItemKey(item);

    const elements: ContextMenuElement[] = useMemo(() => {
        const { itemId, shareId } = item;

        const handleEdit = () => selectItem(shareId, itemId, { view: 'edit', scope });
        const handleMove = () => itemActions.move(item, VaultSelectMode.Writable);
        const handlePin = () => dispatch((item.pinned ? itemUnpinIntent : itemPinIntent)({ shareId, itemId }));
        const handleHistory = () => selectItem(shareId, itemId, { view: 'history', scope });
        const handleTrash = () => itemActions.trash(item);

        const copyBtns: ContextMenuElement[] = getItemCopyButtons(item.data).filter(({ copy }) => !isEmpty(copy));
        const actionBtns = getItemActionButtons(item, isFreePlan, {
            handleEdit,
            handleMove,
            handlePin,
            handleHistory,
            handleTrash,
        });
        const separator = copyBtns.length > 0 && actionBtns.length > 0 ? [CONTEXT_MENU_SEPARATOR] : [];

        return copyBtns.concat(separator, actionBtns);
    }, [item, scope]);

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
    const itemOpened = isOpen(getItemKey(selectedItem));
    const autoClose = !item && itemOpened;

    useEffect(() => {
        if (autoClose) close();
    }, [autoClose]);

    return item && <ConnectedItemsListContextMenu item={item} anchorRef={anchorRef} />;
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
