import { useState, useEffect } from 'react';
import { debounce } from '@proton/shared/lib/helpers/function';

const getWindowSize = (): [number, number] => {
    return [window.innerWidth, window.innerHeight];
};

const useWindowSize = () => {
    const [windowSize, setWindowSize] = useState(() => getWindowSize());

    useEffect(() => {
        const reducer = (oldValue: [number, number], newValue: [number, number]) => {
            if (oldValue[0] === newValue[0] && oldValue[1] === newValue[1]) {
                return oldValue;
            }
            return newValue;
        };

        const onResize = debounce(() => {
            setWindowSize((old) => reducer(old, getWindowSize()));
        }, 100);

        window.addEventListener('resize', onResize);
        setWindowSize((old) => reducer(old, getWindowSize()));
        return () => {
            window.removeEventListener('resize', onResize);
        };
    }, []);

    return windowSize;
};

export default useWindowSize;
