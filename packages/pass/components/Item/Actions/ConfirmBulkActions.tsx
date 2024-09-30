import { type FC } from 'react';
import { useSelector } from 'react-redux';

import { c, msgid } from 'ttag';

import { Alert } from '@proton/components';
import { useBulkSelect } from '@proton/pass/components/Bulk/BulkSelectProvider';
import {
    ConfirmationPrompt,
    type ConfirmationPromptHandles,
} from '@proton/pass/components/Confirmation/ConfirmationPrompt';
import { WithVault } from '@proton/pass/components/Vault/WithVault';
import { getCountOfBulkSelectionDTO } from '@proton/pass/lib/items/item.utils';
import { selectSecureLinksByItems } from '@proton/pass/store/selectors';
import type { BulkSelectionDTO } from '@proton/pass/types';

export const ConfirmTrashManyItems: FC<ConfirmationPromptHandles & { selected: BulkSelectionDTO }> = ({
    selected,
    onCancel,
    onConfirm,
}) => {
    const trashedItemsCount = getCountOfBulkSelectionDTO(selected);
    const { aliasCount } = useBulkSelect();

    return (
        <ConfirmationPrompt
            open
            danger
            onCancel={onCancel}
            onConfirm={onConfirm}
            title={c('Title').ngettext(
                msgid`Trash ${trashedItemsCount} item?`,
                `Trash ${trashedItemsCount} items?`,
                trashedItemsCount
            )}
            message={
                <>
                    {aliasCount > 0 && (
                        <Alert className="mb-4" type="error">
                            {c('Warning').t`Aliases in trash will continue forwarding emails.`}
                        </Alert>
                    )}
                    <span>
                        {c('Warning').ngettext(
                            msgid`Are you sure you want to move ${trashedItemsCount} item to trash?`,
                            `Are you sure you want to move ${trashedItemsCount} items to trash?`,
                            trashedItemsCount
                        )}
                    </span>
                </>
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
    const hasLinks = Boolean(useSelector(selectSecureLinksByItems(selected)).length);
    const count = getCountOfBulkSelectionDTO(selected);

    return (
        <WithVault shareId={shareId} onFallback={onCancel}>
            {({ content: { name: vaultName } }) => (
                <ConfirmationPrompt
                    open
                    onConfirm={onConfirm}
                    onCancel={onCancel}
                    title={c('Title').ngettext(
                        msgid`Move ${count} item to ${vaultName}`,
                        `Move ${count} items to ${vaultName}`,
                        count
                    )}
                    message={
                        hasLinks
                            ? c('Info').ngettext(
                                  msgid`Moving an item to another vault will erase its history and all secure links.`,
                                  `Moving items to another vault will erase their history and all secure links.`,
                                  count
                              )
                            : c('Info').ngettext(
                                  msgid`Moving an item to another vault will erase its history.`,
                                  `Moving items to another vault will erase their history.`,
                                  count
                              )
                    }
                />
            )}
        </WithVault>
    );
};

export const ConfirmDeleteManyItems: FC<ConfirmationPromptHandles & { selected: BulkSelectionDTO }> = ({
    selected,
    onConfirm,
    onCancel,
}) => {
    const deletedItemsCount = getCountOfBulkSelectionDTO(selected);
    const { aliasCount } = useBulkSelect();

    return (
        <ConfirmationPrompt
            open
            danger
            onCancel={onCancel}
            onConfirm={onConfirm}
            title={c('Title').ngettext(
                msgid`Delete ${deletedItemsCount} item?`,
                `Delete ${deletedItemsCount} items?`,
                deletedItemsCount
            )}
            message={
                <>
                    {aliasCount > 0 && (
                        <Alert className="mb-4" type="error">
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
                    <span>
                        {c('Warning').ngettext(
                            msgid`Are you sure you want to permanently delete ${deletedItemsCount} item?`,
                            `Are you sure you want to permanently delete ${deletedItemsCount} items?`,
                            deletedItemsCount
                        )}
                    </span>
                </>
            }
            confirmText={c('Action').ngettext(
                msgid`Understood, I will never need it`,
                `Understood, I will never need them`,
                deletedItemsCount
            )}
        />
    );
};
