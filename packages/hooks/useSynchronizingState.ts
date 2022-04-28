import { useEffect, useState } from 'react';

/*
 * Same as setState with the difference being that the value
 * passed in the argument of the hook is not only an initial
 * value but will synchronize with the returned state should
 * it change (pointer identity).
 */
const useSynchronizingState = <V>(value: V) => {
    const [state, setState] = useState<V>(value);

    useEffect(() => {
        setState(value);
    }, [value]);

    return [state, setState] as const;
};

export default useSynchronizingState;
