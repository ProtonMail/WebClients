import { type FC, createContext, useCallback, useContext, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';

import { c } from 'ttag';

import { ConfirmationModal } from '@proton/pass/components/Confirmation/ConfirmationModal';
import { useInviteContext } from '@proton/pass/components/Invite/InviteContextProvider';
import { VaultDelete } from '@proton/pass/components/Vault/Vault.delete';
import { emptyTrashIntent, restoreTrashIntent, shareLeaveIntent } from '@proton/pass/store/actions';
import type { VaultShareItem } from '@proton/pass/store/reducers';
import type { MaybeNull } from '@proton/pass/types';
import { pipe } from '@proton/pass/utils/fp/pipe';
import noop from '@proton/utils/noop';

import { VaultEdit } from './Vault.edit';
import { VaultMove } from './Vault.move';
import { VaultNew } from './Vault.new';

type VaultActionsContextValue = {
    create: () => void;
    delete: (vault: VaultShareItem) => void;
    edit: (vault: VaultShareItem) => void;
    invite: (vault: VaultShareItem) => void;
    leave: (vault: VaultShareItem) => void;
    manage: (vault: VaultShareItem) => void;
    moveItems: (vault: VaultShareItem) => void;
    trashEmpty: () => void;
    trashRestore: () => void;
};

type VaultActionsProviderProps = {
    onVaultCreated: (shareId: string) => void;
    onVaultDeleted: (shareId: string) => void;
};

type VaultActionState =
    | { view: 'create' | 'trash-empty' }
    | { view: 'edit' | 'delete' | 'move' | 'leave'; vault: VaultShareItem };

export const VaultActionsContext = createContext<VaultActionsContextValue>({
    create: noop,
    delete: noop,
    edit: noop,
    invite: noop,
    leave: noop,
    manage: noop,
    moveItems: noop,
    trashEmpty: noop,
    trashRestore: noop,
});

export const useVaultActions = () => useContext(VaultActionsContext);

export const VaultActionsProvider: FC<VaultActionsProviderProps> = ({ onVaultCreated, onVaultDeleted, children }) => {
    const inviteContext = useInviteContext();
    const dispatch = useDispatch();

    const [state, setState] = useState<MaybeNull<VaultActionState>>();
    const reset = () => setState(null);

    const handleVaultLeave = useCallback(({ shareId }: VaultShareItem) => dispatch(shareLeaveIntent({ shareId })), []);
    const handleTrashEmpty = useCallback(() => dispatch(emptyTrashIntent()), []);

    const actions = useMemo<VaultActionsContextValue>(
        () => ({
            create: () => setState({ view: 'create' }),
            delete: (vault) => setState({ view: 'delete', vault }),
            edit: (vault) => setState({ view: 'edit', vault }),
            invite: (vault) => inviteContext.createInvite({ vault }),
            leave: (vault) => setState({ view: 'leave', vault }),
            manage: (vault) => inviteContext.manageAccess(vault.shareId),
            moveItems: (vault) => setState({ view: 'move', vault }),
            trashEmpty: () => setState({ view: 'trash-empty' }),
            trashRestore: () => dispatch(restoreTrashIntent()),
        }),
        [inviteContext]
    );

    return (
        <VaultActionsContext.Provider value={actions}>
            {children}

            {(() => {
                if (!state) return;
                switch (state?.view) {
                    case 'create':
                        return <VaultNew onSuccess={pipe(onVaultCreated, reset)} onClose={reset} />;
                    case 'edit':
                        return <VaultEdit vault={state.vault} onSuccess={reset} onClose={reset} />;
                    case 'delete':
                        return (
                            <VaultDelete vault={state.vault} onSubmit={pipe(onVaultDeleted, reset)} onClose={reset} />
                        );
                    case 'move':
                        return <VaultMove vault={state.vault} onClose={reset} />;

                    case 'leave':
                        return (
                            <ConfirmationModal
                                open
                                onClose={reset}
                                onSubmit={pipe(() => handleVaultLeave(state.vault), reset)}
                                title={c('Title').t`Leave vault ?`}
                                submitText={c('Action').t`Leave`}
                                alertText={c('Warning')
                                    .t`You will no longer have access to this vault. To join it again, you will need a new invitation.`}
                            />
                        );
                    case 'trash-empty':
                        return (
                            <ConfirmationModal
                                open
                                onClose={reset}
                                onSubmit={pipe(handleTrashEmpty, reset)}
                                title={c('Title').t`Permanently remove all items ?`}
                                submitText={c('Action').t`Delete all`}
                                alertText={c('Warning')
                                    .t`All your trashed items will be permanently deleted. You cannot undo this action.`}
                            />
                        );
                }
            })()}
        </VaultActionsContext.Provider>
    );
};
