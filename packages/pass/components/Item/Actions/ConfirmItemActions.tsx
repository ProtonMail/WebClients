import { type FC, useEffect } from 'react';

import { c } from 'ttag';

import Alert from '@proton/components/components/alert/Alert';
import {
    ConfirmationPrompt,
    type ConfirmationPromptHandles,
} from '@proton/pass/components/Confirmation/ConfirmationPrompt';
import { ConfirmDeleteAlias } from '@proton/pass/components/Item/Actions/ConfirmAliasActions';
import { WithVault } from '@proton/pass/components/Vault/WithVault';
import { useMemoSelector } from '@proton/pass/hooks/useMemoSelector';
import { isAliasItem } from '@proton/pass/lib/items/item.predicates';
import { selectItemSecureLinks, selectItemShared } from '@proton/pass/store/selectors';
import type { ItemMoveIntent, ItemRevision } from '@proton/pass/types';
import noop from '@proton/utils/noop';

export const ConfirmDeleteItem: FC<ConfirmationPromptHandles & { item: ItemRevision }> = (props) => {
    const { shareId, itemId } = props.item;
    const shared = useMemoSelector(selectItemShared, [shareId, itemId]);

    return isAliasItem(props.item.data) ? (
        <ConfirmDeleteAlias {...props} />
    ) : (
        <ConfirmationPrompt
            {...props}
            danger
            title={c('Title').t`Delete this item?`}
            message={
                <div className="flex gap-y-4">
                    {shared && (
                        <Alert type="error">
                            {c('Warning')
                                .t`This item is currently shared. Deleting it will remove access for all other users.`}
                        </Alert>
                    )}
                    {c('Warning').t`Are you sure you want to permanently delete this item?`}
                </div>
            }
        />
    );
};

export const ConfirmMoveItem: FC<ConfirmationPromptHandles & ItemMoveIntent> = ({
    itemId,
    shareId,
    targetShareId,
    onCancel,
    onConfirm,
}) => {
    const secureLinks = useMemoSelector(selectItemSecureLinks, [shareId, itemId]);
    const hasLinks = Boolean(secureLinks.length);
    const shared = useMemoSelector(selectItemShared, [shareId, itemId]);

    /** Auto-confirm on mount if no warnings should
     * be shown in the confirmation prompt */
    const autoConfirm = !(hasLinks || shared);
    useEffect(autoConfirm ? onConfirm : noop, []);

    return (
        !autoConfirm && (
            <WithVault shareId={targetShareId} onFallback={onCancel}>
                {({ content: { name: vaultName } }) => (
                    <ConfirmationPrompt
                        onConfirm={onConfirm}
                        onCancel={onCancel}
                        title={c('Title').t`Move item to "${vaultName}"`}
                        message={
                            <div className="flex gap-y-4">
                                {shared && (
                                    <Alert type="error">
                                        {c('Warning')
                                            .t`This item is currently shared. Moving it to another vault will remove access for all other users.`}
                                    </Alert>
                                )}

                                {hasLinks && c('Info').t`Moving an item to another vault will erase its secure links.`}
                            </div>
                        }
                    />
                )}
            </WithVault>
        )
    );
};

export const ConfirmLeaveItem: FC<ConfirmationPromptHandles & { item: ItemRevision }> = (props) => (
    <ConfirmationPrompt
        {...props}
        danger
        title={c('Title').t`Leave this item?`}
        message={c('Warning').t`You will lose access to this item and its details. Do you want to continue?`}
    />
);
