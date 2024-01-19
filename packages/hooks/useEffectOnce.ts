import { useEffect, useRef } from 'react';

const useEffectOnce = (cb: () => void, deps: any[] = []) => {
    const ref = useRef(false);
    useEffect(() => {
        if (ref.current) {
            return;
        }
        ref.current = true;
        return cb();
    }, deps);
};
export default useEffectOnce;
