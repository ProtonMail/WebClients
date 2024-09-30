import { type FC } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import {
    ConfirmationPrompt,
    type ConfirmationPromptHandles,
} from '@proton/pass/components/Confirmation/ConfirmationPrompt';
import { ConfirmDeleteAlias } from '@proton/pass/components/Item/Actions/ConfirmAliasActions';
import { WithVault } from '@proton/pass/components/Vault/WithVault';
import { isAliasItem } from '@proton/pass/lib/items/item.predicates';
import { selectItemSecureLinks } from '@proton/pass/store/selectors';
import type { ItemRevision } from '@proton/pass/types';

export const ConfirmDeleteItem: FC<ConfirmationPromptHandles & { item: ItemRevision }> = (props) =>
    isAliasItem(props.item.data) ? (
        <ConfirmDeleteAlias {...props} />
    ) : (
        <ConfirmationPrompt
            {...props}
            open
            danger
            title={c('Title').t`Delete this item?`}
            message={c('Warning').t`Are you sure you want to permanently delete this item?`}
        />
    );

export const ConfirmMoveItem: FC<
    ConfirmationPromptHandles & {
        item: ItemRevision;
        shareId: string;
    }
> = ({ item, shareId, onCancel, onConfirm }) => {
    const hasLinks = Boolean(useSelector(selectItemSecureLinks(item.shareId, item.itemId)).length);

    return (
        <WithVault shareId={shareId} onFallback={onCancel}>
            {({ content: { name: vaultName } }) => (
                <ConfirmationPrompt
                    open
                    onConfirm={onConfirm}
                    onCancel={onCancel}
                    title={c('Title').t`Move item to "${vaultName}"?`}
                    message={
                        hasLinks
                            ? c('Info').t`Moving an item to another vault will erase its history and all secure links.`
                            : c('Info').t`Moving an item to another vault will erase its history.`
                    }
                />
            )}
        </WithVault>
    );
};
