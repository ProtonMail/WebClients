import type { RefObject } from 'react';
import { type FC } from 'react';
import { useDispatch } from 'react-redux';

import { c } from 'ttag';

import ContextMenuButton from '@proton/components/components/contextMenu/ContextMenuButton';
import ContextSeparator from '@proton/components/components/contextMenu/ContextSeparator';
import { ContextMenu } from '@proton/pass/components/ContextMenu/ContextMenu';
import { useContextMenuClose } from '@proton/pass/components/ContextMenu/ContextMenuProvider';
import { useItemsActions } from '@proton/pass/components/Item/ItemActionsProvider';
import { useNavigationActions } from '@proton/pass/components/Navigation/NavigationActions';
import { useItemScope } from '@proton/pass/components/Navigation/NavigationMatches';
import { VaultSelectMode } from '@proton/pass/components/Vault/VaultSelect';
import { useCopyToClipboard } from '@proton/pass/hooks/useCopyToClipboard';
import { useDeobfuscatedItem } from '@proton/pass/hooks/useDeobfuscatedItem';
import { useOptimisticItem } from '@proton/pass/hooks/useItem';
import { itemPinIntent, itemUnpinIntent } from '@proton/pass/store/actions';
import type { Item } from '@proton/pass/types';

type LoginProps = { login: Item<'login'> };

const LoginContextMenu: FC<LoginProps> = ({ login }) => {
    const close = useContextMenuClose();
    const copyToClipboard = useCopyToClipboard();
    const {
        content: { itemUsername, itemEmail, password },
    } = useDeobfuscatedItem(login);

    const handleCopy = async (value: string) => {
        await copyToClipboard(value);
        close();
    };

    // Prevent adding an empty separator if nothing to copy
    if (!itemUsername && !itemEmail && !password) {
        return null;
    }

    return (
        <>
            {!!itemUsername && (
                <ContextMenuButton
                    icon="user"
                    name={c('Action').t`Copy username`}
                    action={() => handleCopy(itemUsername)}
                />
            )}
            {!!itemEmail && (
                <ContextMenuButton
                    icon="envelope"
                    name={c('Action').t`Copy email`}
                    action={() => handleCopy(itemEmail)}
                />
            )}
            {!!password && (
                <ContextMenuButton icon="key" name={c('Action').t`Copy password`} action={() => handleCopy(password)} />
            )}
            <ContextSeparator />
        </>
    );
};

type NoteProps = { note: Item<'note'> };

const NoteContextMenu: FC<NoteProps> = ({ note: noteItem }) => {
    const close = useContextMenuClose();
    const copyToClipboard = useCopyToClipboard();
    const {
        metadata: { note },
    } = useDeobfuscatedItem(noteItem);

    if (!note) {
        return null;
    }

    const handleCopy = async (value: string) => {
        await copyToClipboard(value);
        close();
    };

    return (
        <>
            <ContextMenuButton icon="key" name={c('Action').t`Copy note content`} action={() => handleCopy(note)} />
            <ContextSeparator />
        </>
    );
};

type CreditCardProps = { creditCard: Item<'creditCard'> };

const CreditCardContextMenu: FC<CreditCardProps> = ({ creditCard }) => {
    const close = useContextMenuClose();
    const copyToClipboard = useCopyToClipboard();
    const {
        content: { cardholderName, number, expirationDate, verificationNumber },
    } = useDeobfuscatedItem(creditCard);

    const handleCopy = async (value: string) => {
        await copyToClipboard(value);
        close();
    };

    // Prevent adding an empty separator if nothing to copy
    if (!cardholderName && !number && !expirationDate && !verificationNumber) {
        return null;
    }

    return (
        <>
            {!!cardholderName && (
                <ContextMenuButton
                    icon="user"
                    name={c('Action').t`Copy name on card`}
                    action={() => handleCopy(cardholderName)}
                />
            )}
            {!!number && (
                <ContextMenuButton
                    icon="credit-card"
                    name={c('Action').t`Copy card number`}
                    action={() => handleCopy(number)}
                />
            )}
            {!!expirationDate && (
                <ContextMenuButton
                    icon="calendar-today"
                    name={c('Action').t`Copy expiration date`}
                    action={() => handleCopy(expirationDate)}
                />
            )}
            {!!verificationNumber && (
                <ContextMenuButton
                    icon="shield"
                    name={c('Action').t`Copy security code`}
                    action={() => handleCopy(verificationNumber)}
                />
            )}
            <ContextSeparator />
        </>
    );
};

type Props = { id: string; shareId: string; itemId: string; anchorRef: RefObject<HTMLElement> };

export const ItemsListContextMenu: FC<Props> = ({ id, shareId, itemId, anchorRef }) => {
    const scope = useItemScope();
    const { selectItem } = useNavigationActions();
    const itemActions = useItemsActions();
    const close = useContextMenuClose();
    const item = useOptimisticItem(shareId, itemId);
    const dispatch = useDispatch();

    if (!item) {
        return null;
    }

    const withClose = (fn: () => void) => () => {
        fn();
        close();
    };

    const handleEdit = withClose(() => selectItem(shareId, itemId, { view: 'edit', scope }));
    const handleMove = withClose(() => itemActions.move(item, VaultSelectMode.Writable));
    const handlePinClick = withClose(() =>
        dispatch((item.pinned ? itemUnpinIntent : itemPinIntent)({ shareId, itemId }))
    );
    const handleTrash = withClose(() => itemActions.trash(item));

    return (
        <ContextMenu id={id} anchorRef={anchorRef}>
            {item.data.type === 'login' && <LoginContextMenu login={item.data} />}
            {item.data.type === 'note' && <NoteContextMenu note={item.data} />}
            {item.data.type === 'creditCard' && <CreditCardContextMenu creditCard={item.data} />}

            <ContextMenuButton icon="pen" name={c('Action').t`Edit`} action={handleEdit} />
            <ContextMenuButton icon="folder-arrow-in" name={c('Action').t`Move to another vault`} action={handleMove} />
            <ContextMenuButton
                icon="pin-angled"
                name={item.pinned ? c('Action').t`Unpin` : c('Action').t`Pin`}
                action={handlePinClick}
            />
            <ContextMenuButton icon="pass-trash" name={c('Action').t`Move to trash`} action={handleTrash} />
        </ContextMenu>
    );
};
