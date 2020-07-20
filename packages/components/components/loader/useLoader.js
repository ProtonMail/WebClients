import { useState } from 'react';

const useLoader = (initialState = false) => {
    const [isDisplay, setLoader] = useState(initialState);
    const show = () => setLoader(true);
    const hide = () => setLoader(false);
    const toggle = () => setLoader(!isDisplay);

    return {
        isDisplay,
        show,
        toggle,
        hide,
    };
};

export default useLoader;
