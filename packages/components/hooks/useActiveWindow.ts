import { useEffect, useState } from 'react';

const useActiveWindow = () => {
    const [windowIsActive, setWindowIsActive] = useState(true);
    const onFocus = () => setWindowIsActive(true);
    const onBlur = () => setWindowIsActive(false);

    useEffect(() => {
        window.addEventListener('focus', onFocus);
        window.addEventListener('blur', onBlur);

        return () => {
            window.removeEventListener('focus', onFocus);
            window.removeEventListener('blur', onBlur);
        };
    }, []);

    return windowIsActive;
};

export default useActiveWindow;
