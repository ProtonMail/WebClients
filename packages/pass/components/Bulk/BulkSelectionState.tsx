import { type FC, type PropsWithChildren, createContext, useContext, useMemo } from 'react';

import { createUseContext } from '@proton/pass/hooks/useContextFactory';
import { useMemoSelector } from '@proton/pass/hooks/useMemoSelector';
import { selectBulkSelectionAliasCount } from '@proton/pass/store/selectors';
import type { MaybeNull } from '@proton/pass/types';

import type { BulkSelection } from './types';
import { bulkSelectionDTO } from './utils';

type Props = { selection: BulkSelection; enabled: boolean };
type BulkSelectionContextValue = { count: number; selection: BulkSelection };

const BulkEnabledContext = createContext<boolean>(false);
const BulkSelectionContext = createContext<MaybeNull<BulkSelectionContextValue>>(null);

/** The separation between enabled/selection state contexts optimizes performance as
 * bulk mode is used across multiple components/contexts. Components only depending on
 * the enabled state shouldn't re-render when selection changes */
export const BulkSelectionState: FC<PropsWithChildren<Props>> = ({ children, selection, enabled }) => {
    const context = useMemo<BulkSelectionContextValue>(
        () => ({
            count: Array.from(selection.values()).reduce((count, { size }) => count + size, 0),
            selection,
        }),
        [selection]
    );

    return (
        <BulkEnabledContext.Provider value={enabled}>
            <BulkSelectionContext.Provider value={context}>{children}</BulkSelectionContext.Provider>
        </BulkEnabledContext.Provider>
    );
};

export const useBulkSelection = createUseContext(BulkSelectionContext);
export const useBulkEnabled = () => useContext(BulkEnabledContext);

export const useBulkSelectionAliasCount = () => {
    const { selection } = useBulkSelection();
    const selectionDTO = useMemo(() => bulkSelectionDTO(selection), [selection]);
    return useMemoSelector(selectBulkSelectionAliasCount, [selectionDTO]);
};
