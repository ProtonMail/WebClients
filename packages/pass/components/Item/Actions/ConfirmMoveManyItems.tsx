import { type FC } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import {
    ConfirmationPrompt,
    type ConfirmationPromptHandles,
} from '@proton/pass/components/Confirmation/ConfirmationPrompt';
import { WithVault } from '@proton/pass/components/Vault/WithVault';
import { selectSecureLinksByItems } from '@proton/pass/store/selectors';
import type { BulkSelectionDTO } from '@proton/pass/types';

type Props = ConfirmationPromptHandles & {
    selected: BulkSelectionDTO;
    shareId: string;
};

export const ConfirmMoveManyItems: FC<Props> = ({ open, selected, shareId, onCancel, onConfirm }) => {
    const hasLinks = Boolean(useSelector(selectSecureLinksByItems(selected)).length);

    return (
        <WithVault shareId={shareId} onFallback={onCancel}>
            {({ content: { name: vaultName } }) => (
                <ConfirmationPrompt
                    open={open}
                    onConfirm={onConfirm}
                    onCancel={onCancel}
                    title={c('Title').t`Move items to "${vaultName}"?`}
                    message={
                        hasLinks
                            ? c('Info').t`Moving items to another vault will erase their history and all secure links.`
                            : c('Info').t`Moving items to another vault will erase their history.`
                    }
                />
            )}
        </WithVault>
    );
};
