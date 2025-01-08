import { type FC } from 'react';

import { c } from 'ttag';

import {
    ConfirmationPrompt,
    type ConfirmationPromptHandles,
} from '@proton/pass/components/Confirmation/ConfirmationPrompt';
import { ConfirmDeleteAlias } from '@proton/pass/components/Item/Actions/ConfirmAliasActions';
import { WithVault } from '@proton/pass/components/Vault/WithVault';
import { useMemoSelector } from '@proton/pass/hooks/useMemoSelector';
import { isAliasItem } from '@proton/pass/lib/items/item.predicates';
import { selectItemSecureLinks } from '@proton/pass/store/selectors';
import type { ItemMoveIntent, ItemRevision } from '@proton/pass/types';

export const ConfirmDeleteItem: FC<ConfirmationPromptHandles & { item: ItemRevision }> = (props) =>
    isAliasItem(props.item.data) ? (
        <ConfirmDeleteAlias {...props} />
    ) : (
        <ConfirmationPrompt
            {...props}
            danger
            title={c('Title').t`Delete this item?`}
            message={c('Warning').t`Are you sure you want to permanently delete this item?`}
        />
    );

export const ConfirmMoveItem: FC<ConfirmationPromptHandles & ItemMoveIntent> = ({
    itemId,
    shareId,
    onCancel,
    onConfirm,
}) => {
    const secureLinks = useMemoSelector(selectItemSecureLinks, [shareId, itemId]);
    const hasLinks = Boolean(secureLinks.length);

    return (
        <WithVault shareId={shareId} onFallback={onCancel}>
            {({ content: { name: vaultName } }) => (
                <ConfirmationPrompt
                    onConfirm={onConfirm}
                    onCancel={onCancel}
                    title={c('Title').t`Move item to "${vaultName}"`}
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
