import { useEffect, useState } from 'react';

import usePrevious from '@proton/hooks/usePrevious';
import isDeepEqual from '@proton/shared/lib/helpers/isDeepEqual';

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
