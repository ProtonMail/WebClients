import type { FC } from 'react';
import { useCallback, useState } from 'react';
import { useDispatch } from 'react-redux';

import { c } from 'ttag';

import { Alert } from '@proton/components/index';
import { Card } from '@proton/pass/components/Layout/Card/Card';
import { useConfirm } from '@proton/pass/hooks/useConfirm';
import { vaultMoveAllItemsIntent } from '@proton/pass/store/actions';
import { type VaultShareItem } from '@proton/pass/store/reducers';
import type { MaybeNull } from '@proton/pass/types';
import { pipe, tap } from '@proton/pass/utils/fp/pipe';

import { ConfirmationModal } from '../Confirmation/ConfirmationModal';
import { VaultSelect, VaultSelectMode } from './VaultSelect';
import { WithVault } from './WithVault';

type Props = { vault: VaultShareItem; onClose: () => void };
type VaultMoveSteps = { view: 'select' | 'confirm'; destinationShareId: MaybeNull<string> };

export const VaultMove: FC<Props> = ({ vault, onClose }) => {
    const dispatch = useDispatch();
    const [step, setStep] = useState<VaultMoveSteps>({ view: 'select', destinationShareId: null });

    const moveItems = useConfirm(
        useCallback(
            (options: { destinationShareId: string }) => {
                const { shareId, content } = vault;
                dispatch(vaultMoveAllItemsIntent({ ...options, content, shareId }));
            },
            [vault]
        )
    );

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
                    moveItems.prompt({ destinationShareId });
                }}
                downgradeMessage={c('Info')
                    .t`You have exceeded the number of vaults included in your subscription. Items can only be moved to your first two vaults. To move items between all vaults upgrade your subscription.`}
            />

            <WithVault shareId={moveItems.param?.destinationShareId}>
                {({ content: { name: toVaultName } }) => {
                    const fromVaultName = vault.content.name;

                    return (
                        <ConfirmationModal
                            open={moveItems.pending}
                            onClose={pipe(moveItems.cancel, tap(onClose))}
                            onSubmit={pipe(moveItems.confirm, tap(onClose))}
                            submitText={c('Action').t`Move all items`}
                            title={c('Title').t`Move all items ?`}
                        >
                            <Card className="mb-2">{c('Info')
                                .t`Moving an item to another vault will erase its history`}</Card>
                            <Alert className="mb-4" type="info">
                                {
                                    // translator: variables here are the names of the source and destination vault
                                    c('Info')
                                        .t`Are you sure you want to move all items from "${fromVaultName}" to "${toVaultName}" ?`
                                }
                            </Alert>
                        </ConfirmationModal>
                    );
                }}
            </WithVault>
        </>
    );
};
