import { useState } from 'react';

const useLoader = (initialState = false) => {
    const [isOpen, setLoader] = useState(initialState);
    const show = () => setLoader(true);
    const hide = () => setLoader(false);
    const toggle = () => setLoader(!isOpen);

    return {
        isDisplay,
        show,
        toggle,
        hide
    };
};

export default useLoader;