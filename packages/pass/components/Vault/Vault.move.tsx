import type { FC } from 'react';
import { useCallback, useState } from 'react';
import { useDispatch } from 'react-redux';

import { c } from 'ttag';

import { useConfirm } from '../../hooks/useConfirm';
import { vaultMoveAllItemsIntent } from '../../store/actions/creators/vault';
import type { VaultShareItem } from '../../store/reducers';
import type { ItemDestination } from '../../types/data/items.dto';
import { pipe, tap } from '../../utils/fp/pipe';
import { ConfirmVaultMove } from './Actions/ConfirmVaultMove';
import { VaultSelect, VaultSelectMode } from './VaultSelect';

type Props = { vault: VaultShareItem; onClose: () => void };

export const VaultMove: FC<Props> = ({ vault, onClose }) => {
    const dispatch = useDispatch();
    const [selecting, setSelecting] = useState(true);

    const vaultMove = useConfirm(
        useCallback(
            (options: ItemDestination) => {
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
                folderId={null}
                showFolders
                mode={VaultSelectMode.Writable}
                open={selecting}
                title={c('Info').t`Select destination vault`}
                onClose={onClose}
                onSubmit={(targetShareId, targetFolderId) => {
                    setSelecting(false);
                    vaultMove.prompt({ targetShareId, targetFolderId });
                }}
                downgradeMessage={c('Info')
                    .t`You have exceeded the number of vaults included in your subscription. Items can only be moved to your first two vaults. To move items between all vaults upgrade your subscription.`}
            />

            {vaultMove.pending && (
                <ConfirmVaultMove
                    targetShareId={vaultMove.param.targetShareId}
                    targetFolderId={vaultMove.param.targetFolderId}
                    shareId={vault.shareId}
                    onConfirm={onConfirm}
                    onCancel={onCancel}
                />
            )}
        </>
    );
};
