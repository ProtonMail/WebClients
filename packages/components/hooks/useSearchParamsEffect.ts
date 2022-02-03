import { useEffect } from 'react';
import { useHistory, useLocation } from 'react-router-dom';

const useSearchParamsEffect = (cb: (params: URLSearchParams) => URLSearchParams | undefined, deps: any[]) => {
    const history = useHistory();
    const location = useLocation();
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const result = cb(params);
        if (result) {
            history.replace({ ...location, search: result.toString() });
        }
    }, [location.search, ...deps]);
};

export default useSearchParamsEffect;
