import { useEffect } from 'react';

import { formatURLForAjaxRequest } from '@proton/shared/lib/helpers/url';
import noop from '@proton/utils/noop';

const useLoad = (urlParameters?: Record<string, string>) => {
    useEffect(() => {
        const url = formatURLForAjaxRequest(window.location.href, urlParameters);
        fetch(url).catch(noop);
    }, []);
};

export default useLoad;
