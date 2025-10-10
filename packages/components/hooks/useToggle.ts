import { useEffect, useState } from 'react';

/**
 * **Attention:**\
 * Unlike useState or useReducer, if the input parameter is changed,
 * the internal state will be updated accordingly.
 *
 * This does not limit the toggle functionality.
 */
const useToggle = (forcedState = false) => {
    const [state, setState] = useState(forcedState);
    /** TODO: This function should be wrapped in useCallback to avoid unnecessary re-renders. See VPNBE-1602 */
    const toggle = () => setState(!state);

    useEffect(() => {
        setState(forcedState);
    }, [forcedState]);

    return {
        state,
        toggle,
        set: setState,
    };
};

export default useToggle;
