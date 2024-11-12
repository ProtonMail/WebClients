import type { FC } from 'react';
import { useCallback, useState } from 'react';
import { useDispatch } from 'react-redux';

import { c } from 'ttag';

import { useConfirm } from '@proton/pass/hooks/useConfirm';
import { vaultMoveAllItemsIntent } from '@proton/pass/store/actions';
import { type VaultShareItem } from '@proton/pass/store/reducers';
import type { MaybeNull } from '@proton/pass/types';
import { pipe, tap } from '@proton/pass/utils/fp/pipe';

import { ConfirmVaultMove } from './Actions/ConfirmVaultMove';
import { VaultSelect, VaultSelectMode } from './VaultSelect';

type Props = { vault: VaultShareItem; onClose: () => void };
type VaultMoveSteps = { view: 'select' | 'confirm'; destinationShareId: MaybeNull<string> };

export const VaultMove: FC<Props> = ({ vault, onClose }) => {
    const dispatch = useDispatch();
    const [step, setStep] = useState<VaultMoveSteps>({ view: 'select', destinationShareId: null });

    const vaultMove = useConfirm(
        useCallback(
            (options: { destinationShareId: string }) => {
                const { shareId, content } = vault;
                dispatch(vaultMoveAllItemsIntent({ ...options, content, shareId }));
            },
            [vault]
        )
    );

    const onConfirm = pipe(vaultMove.confirm, tap(onClose));
    const onCancel = pipe(vaultMove.cancel, tap(onClose));

    return (
        <>
            <VaultSelect
                shareId={vault.shareId}
                mode={VaultSelectMode.Writable}
                open={step.view === 'select'}
                title={c('Info').t`Select destination vault`}
                onClose={onClose}
                onSubmit={(destinationShareId) => {
                    setStep({ view: 'confirm', destinationShareId });
                    vaultMove.prompt({ destinationShareId });
                }}
                downgradeMessage={c('Info')
                    .t`You have exceeded the number of vaults included in your subscription. Items can only be moved to your first two vaults. To move items between all vaults upgrade your subscription.`}
            />

            {vaultMove.pending && (
                <ConfirmVaultMove
                    destinationShareId={vaultMove.param.destinationShareId}
                    shareId={vault.shareId}
                    onConfirm={onConfirm}
                    onCancel={onCancel}
                />
            )}
        </>
    );
};
