import { useCallback, useEffect, useState } from 'react';

import _debounce from 'lodash/debounce';

export const useDebouncedValue = <T extends string | number>(valueIn: T, time: number): T => {
    const [valueOut, setValueOut] = useState(valueIn);
    const debounce = useCallback(
        _debounce((value) => setValueOut(value), time, { leading: true }),
        [time]
    );
    useEffect(() => debounce(valueIn), [valueIn]);
    useEffect(() => () => debounce.cancel(), []);
    return valueOut;
};
