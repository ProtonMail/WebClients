import { useEffect } from 'react';
import { useAuthentication } from '../../hooks';

const useOnLogout = (cb: () => Promise<void>) => {
    const { onLogout } = useAuthentication();
    useEffect(() => {
        return onLogout(cb);
    }, [cb]);
};

export default useOnLogout;
