import { useRef } from 'react';

import usePopperState from './usePopperState';

const usePopperAnchor = <T>() => {
    const ref = useRef<T>(null);
    const state = usePopperState();
    return { ...state, anchorRef: ref };
};

export default usePopperAnchor;
