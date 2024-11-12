import { type FC } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import {
    ConfirmationPrompt,
    type ConfirmationPromptHandles,
} from '@proton/pass/components/Confirmation/ConfirmationPrompt';
import { WithVault } from '@proton/pass/components/Vault/WithVault';
import { selectSecureLinksByShareId } from '@proton/pass/store/selectors';

type Props = ConfirmationPromptHandles & { destinationShareId: string; shareId: string };

export const ConfirmVaultMove: FC<Props> = ({ destinationShareId, shareId, onCancel, onConfirm }) => {
    const hasLinks = Boolean(useSelector(selectSecureLinksByShareId(shareId)).length);

    return (
        <WithVault shareId={destinationShareId} onFallback={onCancel}>
            {({ content: { name: vaultName } }) => (
                <ConfirmationPrompt
                    onCancel={onCancel}
                    onConfirm={onConfirm}
                    title={c('Title').t`Move all items to "${vaultName}"?`}
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
