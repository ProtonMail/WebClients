import { useMemo } from 'react';

import { useStatefulRef } from '@proton/pass/hooks/useStatefulRef';

export const useStableRef = <T extends object>(value: T) => {
    const ref = useStatefulRef(value);

    return useMemo(
        () =>
            new Proxy({} as unknown as T, {
                get: (_, prop) => {
                    if (prop === Symbol.toPrimitive || prop === 'toJSON') return () => ref.current;
                    const value = Reflect.get(ref.current, prop);
                    return typeof value === 'function' ? value.bind(ref.current) : value;
                },
            }),
        []
    );
};
