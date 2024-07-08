import type { FC } from 'react';
import { useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Prompt } from '@proton/components/index';
import { useConfirm } from '@proton/pass/hooks/useConfirm';
import { vaultMoveAllItemsIntent } from '@proton/pass/store/actions';
import { type VaultShareItem } from '@proton/pass/store/reducers';
import { selectSecureLinksByShareId } from '@proton/pass/store/selectors';
import type { MaybeNull } from '@proton/pass/types';
import { pipe, tap } from '@proton/pass/utils/fp/pipe';

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

    const hasSecureLinks = Boolean(useSelector(selectSecureLinksByShareId(vault.shareId)).length);

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
                {({ content: { name: toVaultName } }) => (
                    <Prompt
                        open={moveItems.pending}
                        title={c('Title').t`Move all items to "${toVaultName}"?`}
                        buttons={[
                            <Button color="norm" onClick={pipe(moveItems.confirm, tap(onClose))}>{c('Action')
                                .t`Confirm`}</Button>,
                            <Button onClick={pipe(moveItems.cancel, tap(onClose))}>{c('Action').t`Cancel`}</Button>,
                        ]}
                    >
                        {hasSecureLinks
                            ? c('Info').t`Moving an item to another vault will erase its history and all secure links.`
                            : c('Info').t`Moving an item to another vault will erase its history.`}
                    </Prompt>
                )}
            </WithVault>
        </>
    );
};
