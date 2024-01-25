import { useEffect } from 'react';

import { useBulkSelect } from '@proton/pass/components/Bulk/BulkSelectProvider';
import { truthy } from '@proton/pass/utils/fp/predicates';
import noop from '@proton/utils/noop';

export const useBulkLock = (conditions: boolean[]) => {
    const bulk = useBulkSelect();
    useEffect(() => (conditions.every(truthy) ? bulk.lock() : noop), [conditions]);
};
