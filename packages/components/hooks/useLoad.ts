import { useEffect } from 'react';

import noop from '@proton/utils/noop';

const useLoad = () => {
    useEffect(() => {
        const url = new URL(window.location.href);
        url.search = '?load=ajax';
        url.hash = '';
        fetch(url).catch(noop);
    }, []);
};

export default useLoad;
