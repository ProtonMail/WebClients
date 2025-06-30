import { type FC, useEffect } from 'react';

import { c, msgid } from 'ttag';

import { Alert } from '@proton/components';
import { useBulkSelectionAliasCount } from '@proton/pass/components/Bulk/BulkSelectionState';
import {
    ConfirmationPrompt,
    type ConfirmationPromptHandles,
} from '@proton/pass/components/Confirmation/ConfirmationPrompt';
import { WithVault } from '@proton/pass/components/Vault/WithVault';
import { useMemoSelector } from '@proton/pass/hooks/useMemoSelector';
import { getBulkSelectionCount } from '@proton/pass/lib/items/item.utils';
import { selectBulkHasSecureLinks, selectBulkHasSharedItems } from '@proton/pass/store/selectors';
import type { BulkSelectionDTO } from '@proton/pass/types';
import noop from '@proton/utils/noop';

export const ConfirmTrashManyItems: FC<ConfirmationPromptHandles & { selected: BulkSelectionDTO }> = ({
    selected,
    onCancel,
    onConfirm,
}) => {
    const trashedItemsCount = getBulkSelectionCount(selected);
    const aliasCount = useBulkSelectionAliasCount();

    return (
        <ConfirmationPrompt
            danger
            onCancel={onCancel}
            onConfirm={onConfirm}
            title={c('Title').ngettext(
                msgid`Move ${trashedItemsCount} item to trash?`,
                `Move ${trashedItemsCount} items to trash?`,
                trashedItemsCount
            )}
            message={
                <div className="flex gap-y-4">
                    {aliasCount > 0 && (
                        <Alert className="mb-4" type="error">
                            {c('Warning').t`Aliases in trash will continue forwarding emails.`}
                        </Alert>
                    )}

                    {c('Warning').ngettext(
                        msgid`Are you sure you want to move ${trashedItemsCount} item to trash?`,
                        `Are you sure you want to move ${trashedItemsCount} items to trash?`,
                        trashedItemsCount
                    )}
                </div>
            }
        />
    );
};

export const ConfirmMoveManyItems: FC<
    ConfirmationPromptHandles & {
        selected: BulkSelectionDTO;
        shareId: string;
    }
> = ({ selected, shareId, onCancel, onConfirm }) => {
    const hasSecureLinks = useMemoSelector(selectBulkHasSecureLinks, [selected]);
    const hasSharedItems = useMemoSelector(selectBulkHasSharedItems, [selected]);
    const count = getBulkSelectionCount(selected);

    /** Auto-confirm on mount if no warnings should
     * be shown in the confirmation prompt */
    const autoConfirm = !(hasSecureLinks || hasSharedItems);
    useEffect(autoConfirm ? onConfirm : noop, []);

    return (
        !autoConfirm && (
            <WithVault shareId={shareId} onFallback={onCancel}>
                {({ content: { name: vaultName } }) => (
                    <ConfirmationPrompt
                        onConfirm={onConfirm}
                        onCancel={onCancel}
                        title={c('Title').ngettext(
                            msgid`Move ${count} item to ${vaultName}`,
                            `Move ${count} items to ${vaultName}`,
                            count
                        )}
                        message={
                            <div className="flex gap-y-4">
                                {hasSharedItems && (
                                    <Alert type="error">
                                        {c('Warning')
                                            .t`Some items are currently shared. Moving them to another vault will remove access for all other users.`}
                                    </Alert>
                                )}

                                {hasSecureLinks &&
                                    c('Info').ngettext(
                                        msgid`Moving an item to another vault will erase its secure links.`,
                                        `Moving items to another vault will erase their secure links.`,
                                        count
                                    )}
                            </div>
                        }
                    />
                )}
            </WithVault>
        )
    );
};

export const ConfirmDeleteManyItems: FC<ConfirmationPromptHandles & { selected: BulkSelectionDTO }> = ({
    selected,
    onConfirm,
    onCancel,
}) => {
    const deletedItemsCount = getBulkSelectionCount(selected);
    const aliasCount = useBulkSelectionAliasCount();
    const hasSharedItems = useMemoSelector(selectBulkHasSharedItems, [selected]);

    return (
        <ConfirmationPrompt
            danger
            onCancel={onCancel}
            onConfirm={onConfirm}
            title={c('Title').ngettext(
                msgid`Delete ${deletedItemsCount} item?`,
                `Delete ${deletedItemsCount} items?`,
                deletedItemsCount
            )}
            message={
                <div className="flex gap-y-4">
                    {hasSharedItems && (
                        <Alert type="error">
                            {c('Warning')
                                .t`Some items are currently shared. Deleting them will remove access for all other users.`}
                        </Alert>
                    )}

                    {aliasCount > 0 && (
                        <Alert type="error">
                            {c('Title').ngettext(
                                msgid`You’re about to permanently delete ${aliasCount} alias.`,
                                `You’re about to permanently delete ${aliasCount} aliases.`,
                                aliasCount
                            )}{' '}
                            {c('Title').ngettext(
                                msgid`Please note that once deleted, the alias can't be restored.`,
                                `Please note that once once deleted, the aliases can't be restored.`,
                                aliasCount
                            )}
                        </Alert>
                    )}

                    {c('Warning').ngettext(
                        msgid`Are you sure you want to permanently delete ${deletedItemsCount} item?`,
                        `Are you sure you want to permanently delete ${deletedItemsCount} items?`,
                        deletedItemsCount
                    )}
                </div>
            }
            confirmText={c('Action').ngettext(
                msgid`Understood, I will never need it`,
                `Understood, I will never need them`,
                deletedItemsCount
            )}
        />
    );
};
