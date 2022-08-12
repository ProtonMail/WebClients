// https://usehooks-ts.com/react-hook/use-interval
// See also https://overreacted.io/making-setinterval-declarative-with-react-hooks/
import { useEffect, useRef } from 'react';

import noop from '@proton/utils/noop';

const useInterval = (callback: () => void, delay: number | null) => {
    const savedCallback = useRef<() => void>(noop);

    // Remember the latest callback.
    useEffect(() => {
        savedCallback.current = callback;
    }, [callback]);

    // Set up the interval.
    useEffect(() => {
        if (delay === null) {
            return;
        }

        const id = setInterval(() => savedCallback.current(), delay);

        return () => clearInterval(id);
    }, [delay]);
};

export default useInterval;
