import { useEffect } from 'react';
import { useRouteMatch } from 'react-router';
import { load } from 'proton-shared/lib/api/core/load';

import useApi from './useApi';

const useLoad = () => {
    const api = useApi();

    /*
     * The "path" property on React Router's "match" object contains the
     * path pattern that was used to match the current pathname.
     *
     * It therefore contains the names of any dynamic parameters rather
     * than their values.
     *
     * This is an important distinction for three reasons:
     * - it makes it possible to tell which segments of the pathname are parameters (":")
     * - this path looks the same indifferent of how the parameters are populated
     * - it allows us to send the load request without leaking any potentially sensitive data
     */
    const { path } = useRouteMatch();

    useEffect(() => {
        api({ ...load(path), silence: true });
    }, []);
};

export default useLoad;
