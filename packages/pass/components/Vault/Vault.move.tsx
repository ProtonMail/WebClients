import type { FC } from 'react';
import { useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { c } from 'ttag';

import { useConfirm } from '@proton/pass/hooks/useConfirm';
import { vaultMoveAllItemsIntent } from '@proton/pass/store/actions';
import { type VaultShareItem } from '@proton/pass/store/reducers';
import { selectShare, selectWritableVaultsWithItemsCount } from '@proton/pass/store/selectors';
import type { MaybeNull, ShareType } from '@proton/pass/types';
import { pipe, tap } from '@proton/pass/utils/fp/pipe';

import { ConfirmationModal } from '../Confirmation/ConfirmationModal';
import { VaultSelect } from './VaultSelect';

type Props = { vault: VaultShareItem; onClose: () => void };

type VaultMoveSteps = { view: 'select' | 'confirm'; destinationShareId: MaybeNull<string> };

export const VaultMove: FC<Props> = ({ vault, onClose }) => {
    const dispatch = useDispatch();
    const [step, setStep] = useState<VaultMoveSteps>({ view: 'select', destinationShareId: null });
    const destination = useSelector(selectShare<ShareType.Vault>(step.destinationShareId));

    const fromVaultName = vault.content.name;
    const toVaultName = destination?.content.name ?? '';

    const handleMoveItems = useConfirm(
        useCallback(
            (destinationShareId: string) => {
                const { shareId, content } = vault;
                dispatch(vaultMoveAllItemsIntent({ destinationShareId, content, shareId }));
            },
            [vault]
        )
    );

    return (
        <>
            <VaultSelect
                shareId={vault.shareId}
                optionsSelector={selectWritableVaultsWithItemsCount}
                open={step.view === 'select'}
                title={c('Info').t`Select destination vault`}
                onClose={onClose}
                onSubmit={(destinationShareId) => {
                    setStep({ view: 'confirm', destinationShareId });
                    handleMoveItems.prompt(destinationShareId);
                }}
                downgradeMessage={c('Info')
                    .t`You have exceeded the number of vaults included in your subscription. Items can only be moved to your first two vaults. To move items between all vaults upgrade your subscription.`}
            />

            <ConfirmationModal
                open={handleMoveItems.pending}
                onClose={pipe(handleMoveItems.cancel, tap(onClose))}
                onSubmit={pipe(handleMoveItems.confirm, tap(onClose))}
                submitText={c('Action').t`Move all items`}
                title={c('Title').t`Move all items ?`}
                alertText={
                    // translator: variables here are the names of the source and destination vault
                    c('Info').t`Are you sure you want to move all items from "${fromVaultName}" to "${toVaultName}" ?`
                }
            />
        </>
    );
};
