import type { FC } from 'react';

import { c } from 'ttag';

import {
    ConfirmationPrompt,
    type ConfirmationPromptHandles,
} from '@proton/pass/components/Confirmation/ConfirmationPrompt';
import { WithVault } from '@proton/pass/components/Vault/WithVault';
import { useMemoSelector } from '@proton/pass/hooks/useMemoSelector';
import { selectSecureLinksByShareId } from '@proton/pass/store/selectors';

type Props = ConfirmationPromptHandles & { targetShareId: string; shareId: string };

export const ConfirmVaultMove: FC<Props> = ({ targetShareId, shareId, onCancel, onConfirm }) => {
    const secureLinks = useMemoSelector(selectSecureLinksByShareId, [shareId]);
    const hasLinks = Boolean(secureLinks.length);

    return (
        <WithVault shareId={targetShareId} onFallback={onCancel}>
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
