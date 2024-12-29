import { type FC, type PropsWithChildren, useState } from 'react';

import { BulkSelectActions } from '@proton/pass/components/Bulk/BulkSelectionActions';
import { BulkSelectionState } from '@proton/pass/components/Bulk/BulkSelectionState';

export type BulkSelection = Map<string, Set<string>>;

/** Splits `BulkSelection` contexts into State/Actions contexts :
 * - Components using only bulk actions won't re-render on selection changes
 * - Actions can be consumed by other providers without triggering re-renders
 * - Prevents cascading updates through the context tree on state changes */
export const BulkSelectProvider: FC<PropsWithChildren> = ({ children }) => {
    const [selection, setSelection] = useState<BulkSelection>(new Map());
    const [enabled, setEnabled] = useState(false);

    return (
        <BulkSelectionState selection={selection} enabled={enabled}>
            <BulkSelectActions setSelection={setSelection} setEnabled={setEnabled}>
                {children}
            </BulkSelectActions>
        </BulkSelectionState>
    );
};
