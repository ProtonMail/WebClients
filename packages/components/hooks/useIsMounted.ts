import { useCallback, useEffect, useRef } from 'react';

const useIsMounted = () => {
    const ref = useRef(false);

    useEffect(() => {
        ref.current = true;
        return () => {
            ref.current = false;
        };
    }, []);

    return useCallback(() => {
        return ref.current;
    }, []);
};

export default useIsMounted;
