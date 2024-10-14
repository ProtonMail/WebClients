import { useState } from 'react';

import { useInterval } from './useHandler';

/**
 * Run current date and update it at the given frequency.
 */
export const useNow = (interval: number) => {
    const [now, setNow] = useState(() => new Date());
    useInterval(interval, () => setNow(new Date()));

    return now;
};
