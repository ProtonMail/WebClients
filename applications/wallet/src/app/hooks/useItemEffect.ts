import { useEffect } from 'react';

import usePrevious from '@proton/hooks/usePrevious';
import isDeepEqual from '@proton/shared/lib/helpers/isDeepEqual';

export const useItemEffect = <T>(effect: (item: T) => void | (() => void), items: T[], otherDeps?: any[]) => {
    const previous = usePrevious(items);

    useEffect(() => {
        const cleanups = new Set<() => void>();
        items.forEach((item, index) => {
            if (isDeepEqual(previous?.[index], item)) {
                return;
            }

            const cleanup = effect(item);

            if (cleanup) {
                cleanups.add(cleanup);
            }
        });

        return () => {
            cleanups.forEach((c) => c());
        };

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [items, otherDeps]);
};
