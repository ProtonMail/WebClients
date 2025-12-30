import { useEffect, useState } from 'react';

import isDeepEqual from 'lodash/isEqual';

import usePrevious from '@proton/hooks/usePrevious';

export const useAsyncValue = <T extends unknown>(promise: Promise<T>, dv: T) => {
    const [v, s] = useState(dv);
    const p = usePrevious(v);

    useEffect(() => {
        void promise.then((d) => {
            if (!isDeepEqual(p, d)) {
                s(d);
            }
        });
    }, [promise, p]);

    return v;
};
