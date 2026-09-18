import { type FC, useEffect } from 'react';

import { c } from 'ttag';

import Alert from '@proton/components/components/alert/Alert';
import noop from '@proton/utils/noop';

import { useMemoSelector } from '../../../hooks/useMemoSelector';
import { isAliasItem } from '../../../lib/items/item.predicates';
import { selectFolder, selectItemSecureLinks, selectItemShared } from '../../../store/selectors';
import type { ItemMoveIntent, ItemRevision } from '../../../types';
import { ConfirmationPrompt, type ConfirmationPromptHandles } from '../../Confirmation/ConfirmationPrompt';
import { WithVault } from '../../Vault/WithVault';
import { ConfirmDeleteAlias } from './ConfirmAliasActions';

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
    targetFolderId,
    onCancel,
    onConfirm,
}) => {
    const secureLinks = useMemoSelector(selectItemSecureLinks, [shareId, itemId]);
    const hasLinks = Boolean(secureLinks.length);
    const shared = useMemoSelector(selectItemShared, [shareId, itemId]);
    const folder = useMemoSelector(selectFolder, [targetShareId, targetFolderId ?? '']);

    /** Don't show warning if moving to a different folder in the same vault (sharing unaffected).
     * Future TODO: change this when folder sharing is implemented */
    const crossVault = shareId !== targetShareId;

    /** Auto-confirm on mount if no warnings should
     * be shown in the confirmation prompt */
    const autoConfirm = !crossVault || !(hasLinks || shared);
    useEffect(autoConfirm ? onConfirm : noop, []);

    return (
        !autoConfirm && (
            <WithVault shareId={targetShareId} onFallback={onCancel}>
                {({ content: { name: vaultName } }) => {
                    const target = folder ? `${vaultName} > ${folder.name}` : vaultName;

                    return (
                        <ConfirmationPrompt
                            onConfirm={onConfirm}
                            onCancel={onCancel}
                            title={c('Title').t`Move item to "${target}"`}
                            message={
                                <div className="flex gap-y-4">
                                    {shared && (
                                        <Alert type="error">
                                            {c('Warning')
                                                .t`This item is currently shared. Moving it to another vault will remove access for all other users.`}
                                        </Alert>
                                    )}

                                    {hasLinks &&
                                        c('Info').t`Moving an item to another vault will erase its secure links.`}
                                </div>
                            }
                        />
                    );
                }}
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
