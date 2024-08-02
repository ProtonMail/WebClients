import type { Dispatch, SetStateAction } from 'react';
import { useCallback, useRef, useState } from 'react';

const isFunctionGuard = <S>(setStateAction: SetStateAction<S>): setStateAction is (prevState: S) => S =>
    typeof setStateAction === 'function';

type ReadOnlyRefObject<T> = {
    readonly current: T;
};

type UseStateRef = {
    <S>(initialState: S | (() => S)): [S, Dispatch<SetStateAction<S>>, ReadOnlyRefObject<S>];
    <S = undefined>(): [S | undefined, Dispatch<SetStateAction<S | undefined>>, ReadOnlyRefObject<S | undefined>];
};

/**
 * Allow to read state values in memoized functions via ref
 * RefValue is readonly, do not update it's value, it wont be reflected in state.
 *
 * Example usage:
 * ```
 * const [state, setState, stateRef] = useStateRef(0);
 *
 * const memoizedIncrement = useCallback(() => {
 *   // read state value via ref because
 *   // for some reasons state cannot be in dependency array
 *   if(stateRef.current > 12) ...do something
 *
 *   // do not update stateRef.current, it wont be reflected in state
 *   // prefer the following
 *   setState(prevState => prevState + 1);
 * }, []);
 *
 * ```
 */
const useStateRef: UseStateRef = <S>(initialState?: S | (() => S)) => {
    const [state, setState] = useState(initialState);
    const ref = useRef(state);

    const dispatch: typeof setState = useCallback((setStateAction: any) => {
        ref.current = isFunctionGuard(setStateAction) ? setStateAction(ref.current) : setStateAction;

        setState(ref.current);
    }, []);

    return [state, dispatch, ref];
};

export default useStateRef;
