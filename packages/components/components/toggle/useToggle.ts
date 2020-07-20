import { useState, useEffect } from 'react';

const useToggle = (initialState = false) => {
    const [state, setState] = useState(initialState);
    const toggle = () => setState(!state);

    useEffect(() => {
        setState(initialState);
    }, [initialState]);

    return {
        state,
        toggle,
        set: setState,
    };
};

export default useToggle;
