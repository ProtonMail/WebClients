import { useLayoutEffect, useState } from 'react';
import usePrevious from '../../hooks/usePrevious';

const useIsClosing = (isOpen = false): [boolean, boolean, () => void] => {
    const [[isClosed, isClosing], setResult] = useState(() => [false, !isOpen]);
    const isOpenPrevious = usePrevious(isOpen);

    useLayoutEffect(() => {
        if (isOpen) {
            setResult([false, false]);
        } else if (!isOpen && isOpenPrevious) {
            setResult([true, false]);
        }
    }, [isOpen, isOpenPrevious]);

    const setIsClosed = () => setResult([false, true]);

    return [isClosed, isClosing, setIsClosed];
};

export default useIsClosing;
