import type { PropsWithChildren } from 'react';
import { type FC, createContext, useCallback, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';

import { c } from 'ttag';

import { ConfirmationModal } from '@proton/pass/components/Confirmation/ConfirmationModal';
import { useNavigate } from '@proton/pass/components/Navigation/NavigationActions';
import { useNavigationFilters } from '@proton/pass/components/Navigation/NavigationFilters';
import { getLocalPath, getTrashRoute } from '@proton/pass/components/Navigation/routing';
import { ConfirmTrashEmpty } from '@proton/pass/components/Vault/Actions/ConfirmTrashEmpty';
import { OrganizeVaultsModal } from '@proton/pass/components/Vault/OrganizeVaultsModal';
import { VaultDelete } from '@proton/pass/components/Vault/Vault.delete';
import { createUseContext } from '@proton/pass/hooks/useContextFactory';
import {
    emptyTrashIntent,
    restoreTrashIntent,
    shareLeaveIntent,
    sharesVisibilityEdit,
} from '@proton/pass/store/actions';
import type { VaultShareItem } from '@proton/pass/store/reducers';
import type { ShareVisibilityMap } from '@proton/pass/types';
import { type MaybeNull, ShareType } from '@proton/pass/types';
import { pipe } from '@proton/pass/utils/fp/pipe';

import { VaultEdit } from './Vault.edit';
import { VaultMove } from './Vault.move';
import { VaultNew } from './Vault.new';

type VaultActionsContextValue = {
    create: () => void;
    delete: (vault: VaultShareItem) => void;
    edit: (vault: VaultShareItem) => void;
    leave: (vault: VaultShareItem) => void;
    moveItems: (vault: VaultShareItem) => void;
    select: (selected: string) => void;
    trashEmpty: () => void;
    trashRestore: () => void;
    organize: () => void;
};

type VaultActionState =
    | { view: 'create' | 'trash-empty' | 'organize' }
    | { view: 'edit' | 'delete' | 'move' | 'leave'; vault: VaultShareItem };

export const VaultActionsContext = createContext<MaybeNull<VaultActionsContextValue>>(null);
export const useVaultActions = createUseContext(VaultActionsContext);

export const handleSelect = (navigate: ReturnType<typeof useNavigate>, selected: string) => {
    switch (selected) {
        case 'all':
            return navigate(getLocalPath(), {
                filters: {
                    selectedShareId: null,
                },
            });
        case 'trash':
            return navigate(getTrashRoute(), {
                filters: {
                    selectedShareId: null,
                    type: '*',
                },
            });
        default: {
            return navigate(getLocalPath(`share/${selected}`), {
                filters: {
                    selectedShareId: selected,
                },
            });
        }
    }
};

export const VaultActionsProvider: FC<PropsWithChildren> = ({ children }) => {
    const navigate = useNavigate();
    const { filters, setFilters } = useNavigationFilters();
    const dispatch = useDispatch();

    const [state, setState] = useState<MaybeNull<VaultActionState>>();
    const reset = () => setState(null);

    const onTrashEmpty = useCallback(() => dispatch(emptyTrashIntent()), []);

    const onVaultDisabled = (shareId: string) => {
        if (filters.selectedShareId === shareId) setFilters({ selectedShareId: null });
        reset();
    };

    const onVaultCreated = (selectedShareId: string) => setFilters({ selectedShareId });

    const onVaultLeave = ({ shareId }: VaultShareItem) => {
        onVaultDisabled(shareId);
        dispatch(shareLeaveIntent({ shareId, targetType: ShareType.Vault }));
    };

    const onVaultOrganize = useCallback(
        (visibilityMap: ShareVisibilityMap) => dispatch(sharesVisibilityEdit.intent({ visibilityMap })),
        []
    );

    const actions = useMemo<VaultActionsContextValue>(
        () => ({
            create: () => setState({ view: 'create' }),
            delete: (vault) => setState({ view: 'delete', vault }),
            edit: (vault) => setState({ view: 'edit', vault }),
            leave: (vault) => setState({ view: 'leave', vault }),
            moveItems: (vault) => setState({ view: 'move', vault }),
            select: (selected) => handleSelect(navigate, selected),
            trashEmpty: () => setState({ view: 'trash-empty' }),
            trashRestore: () => dispatch(restoreTrashIntent()),
            organize: () => setState({ view: 'organize' }),
        }),
        []
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
                        return <VaultDelete vault={state.vault} onSubmit={onVaultDisabled} onClose={reset} />;
                    case 'move':
                        return <VaultMove vault={state.vault} onClose={reset} />;

                    case 'leave':
                        return (
                            <ConfirmationModal
                                open
                                onClose={reset}
                                onSubmit={() => onVaultLeave(state.vault)}
                                title={c('Title').t`Leave vault?`}
                                submitText={c('Action').t`Leave`}
                                alertText={c('Warning')
                                    .t`You will no longer have access to this vault. To join it again, you will need a new invitation.`}
                            />
                        );
                    case 'trash-empty':
                        return <ConfirmTrashEmpty onCancel={reset} onConfirm={pipe(onTrashEmpty, reset)} />;
                    case 'organize':
                        return <OrganizeVaultsModal onConfirm={pipe(onVaultOrganize, reset)} onClose={reset} />;
                }
            })()}
        </VaultActionsContext.Provider>
    );
};
