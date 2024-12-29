import type { Dispatch, SetStateAction } from 'react';
import { type FC, type PropsWithChildren, createContext, useMemo } from 'react';

import { createUseContext } from '@proton/pass/hooks/useContextFactory';
import type { MaybeNull, SelectedItem } from '@proton/pass/types';
import { pipe } from '@proton/pass/utils/fp/pipe';

import type { BulkSelection } from './types';

type Props = {
    setSelection: Dispatch<SetStateAction<BulkSelection>>;
    setEnabled: Dispatch<SetStateAction<boolean>>;
};

type BulkSelectActionsContextValue = {
    clear: () => void;
    disable: () => void;
    enable: () => void;
    toggle: (item: SelectedItem) => void;
};

const BulkSelectActionsContext = createContext<MaybeNull<BulkSelectActionsContextValue>>(null);

export const BulkSelectActions: FC<PropsWithChildren<Props>> = ({ children, setSelection, setEnabled }) => {
    const context = useMemo<BulkSelectActionsContextValue>(() => {
        const clear = () => setSelection((curr) => (curr.size > 0 ? new Map() : curr));

        return {
            clear,

            enable: () => setEnabled(true),
            disable: pipe(() => setEnabled(false), clear),

            toggle: ({ shareId, itemId }) => {
                setSelection((curr) => {
                    const share = new Set(curr.get(shareId) ?? []);

                    if (share?.has(itemId)) share.delete(itemId);
                    else share.add(itemId);

                    return new Map(curr).set(shareId, share);
                });
            },
        };
    }, []);

    return <BulkSelectActionsContext.Provider value={context}>{children}</BulkSelectActionsContext.Provider>;
};

export const useBulkActions = createUseContext(BulkSelectActionsContext);
