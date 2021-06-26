import { SetStateAction, useRef, useState } from 'react';
import { useIsMounted } from 'react-components';

/**
 * Enhanced useState supporting to continue living after component unmounting through the use of a ref.
 * Add a getter function which allow to get current value event after unmounting.
 */
export const useLongLivingState = <S>(
    initialState: S | (() => S)
): [S, (action: SetStateAction<S>) => void, () => S] => {
    const isMounted = useIsMounted();
    const [stateValue, setStateValue] = useState(initialState);
    const refValue = useRef<S>(stateValue);

    const setState = (action: SetStateAction<S>) => {
        refValue.current = action instanceof Function ? action(refValue.current) : action;

        if (isMounted()) {
            setStateValue(refValue.current);
        }
    };

    const getState = () => refValue.current;

    return [stateValue, setState, getState];
};
