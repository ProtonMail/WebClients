import { type FC } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import {
    ConfirmationPrompt,
    type ConfirmationPromptHandles,
} from '@proton/pass/components/Confirmation/ConfirmationPrompt';
import { WithVault } from '@proton/pass/components/Vault/WithVault';
import { selectItemSecureLinks } from '@proton/pass/store/selectors';
import type { ItemRevision } from '@proton/pass/types';

type Props = ConfirmationPromptHandles & {
    item: ItemRevision;
    shareId: string;
};

export const ConfirmMoveItem: FC<Props> = ({ item, open, shareId, onCancel, onConfirm }) => {
    const hasLinks = Boolean(useSelector(selectItemSecureLinks(item.shareId, item.itemId)).length);

    return (
        <WithVault shareId={shareId} onFallback={onCancel}>
            {({ content: { name: vaultName } }) => (
                <ConfirmationPrompt
                    open={open}
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
