import { useRef } from 'react';

import usePopperState from './usePopperState';

const usePopperAnchor = <T>(onChange?: (state: boolean) => void) => {
    const ref = useRef<T>(null);
    const state = usePopperState(onChange);
    return { ...state, anchorRef: ref };
};

export default usePopperAnchor;
