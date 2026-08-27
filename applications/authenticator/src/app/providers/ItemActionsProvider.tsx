import { type FC, type PropsWithChildren, createContext, useContext, useMemo, useState } from 'react';

import type { MaybeNull } from '@proton/pass/types';

import type { ImportProvider } from '../../lib/importers/types';
import { ImportModal } from '../components/Settings/Import/ImportModal';

// TODO: move other item actions (edit/add) to this context
type ItemActionsContextValue = { import: (provider: ImportProvider) => void };
type ItemActionState = { view: 'import'; provider: ImportProvider };

export const ItemActionsContext = createContext<MaybeNull<ItemActionsContextValue>>(null);
export const useItemsActions = (): ItemActionsContextValue => useContext(ItemActionsContext)!;

export const ItemActionsProvider: FC<PropsWithChildren> = ({ children }) => {
    const [state, setState] = useState<MaybeNull<ItemActionState>>();
    const reset = () => setState(null);

    const actions = useMemo<ItemActionsContextValue>(
        () => ({ import: (provider) => setState({ view: 'import', provider }) }),
        []
    );

    return (
        <ItemActionsContext.Provider value={actions}>
            {children}

            {(() => {
                if (!state) return;

                switch (state?.view) {
                    case 'import':
                        return <ImportModal provider={state.provider} onClose={reset} />;
                }
            })()}
        </ItemActionsContext.Provider>
    );
};
