import { useEffect, useLayoutEffect } from 'react';

import usePrevious from './usePrevious';

/*
 * Executes callback "cb" if "value" has changed from
 * "from" to "to"
 */
const useChanged = (
    options: { value: any; from: any; to: any; effectFn?: typeof useEffect | typeof useLayoutEffect },
    cb: () => void
) => {
    const { value, from, to, effectFn = useEffect } = options;

    const previous = usePrevious(value);

    effectFn(() => {
        if (previous === from && value === to) {
            cb();
        }
    }, [previous, value]);
};

export default useChanged;
