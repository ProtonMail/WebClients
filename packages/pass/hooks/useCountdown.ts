import { useEffect, useMemo, useRef, useState } from 'react';

import type { Maybe } from '@proton/pass/types';

export const useCountdown = (initial?: number) => {
    const interval = useRef<Maybe<NodeJS.Timeout>>();
    const [value, setValue] = useState<number>(0);

    const handle = useRef({
        start: (value: number) => {
            clearInterval(interval.current);
            setValue(value);
            interval.current = setInterval(
                () =>
                    setValue((prev) => {
                        if (prev === 0) clearInterval(interval.current);
                        return Math.max(0, prev - 1);
                    }),
                1_000
            );
        },
        cancel: () => {
            clearInterval(interval.current);
            setValue(0);
        },
    });

    useEffect(() => {
        if (initial) handle.current.start(initial);
        return handle.current.cancel;
    }, []);

    return useMemo(() => [value, handle.current] as const, [value]);
};
