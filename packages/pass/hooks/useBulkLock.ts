import { useEffect } from 'react';

import { useBulkSelect } from '@proton/pass/components/Bulk/BulkSelectProvider';
import { truthy } from '@proton/pass/utils/fp/predicates';
import noop from '@proton/utils/noop';

/** Will lock bulk selection whenever all supplied conditions
 * are truthy. If any modal is still opened, lock bulk selection.
 * Will unlock on unmount */
export const useBulkLock = (conditions: boolean[]) => {
    const bulk = useBulkSelect();

    useEffect(() => {
        const shouldLock = conditions.every(truthy);
        const openedModals = document.querySelectorAll('.modal-two').length > 0;

        return shouldLock || openedModals ? bulk.lock() : noop;
    }, [conditions]);
};
