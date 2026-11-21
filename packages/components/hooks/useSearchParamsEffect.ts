import { useEffect } from 'react';
import { useHistory, useLocation } from 'react-router-dom';

const useSearchParamsEffect = (cb: (params: URLSearchParams) => URLSearchParams | undefined, deps: any[]) => {
    const history = useHistory();
    const location = useLocation();
    useEffect(() => {
        // Read history.location: a render can still carry search params that an earlier run already replaced
        const params = new URLSearchParams(history.location.search);
        const result = cb(params);
        if (result) {
            history.replace({ ...history.location, search: result.toString() });
        }
    }, [location.search, ...deps]);
};

export default useSearchParamsEffect;
