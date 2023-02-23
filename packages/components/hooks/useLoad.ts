import { useEffect } from 'react';

import { formatURLForAjaxRequest } from '@proton/shared/lib/helpers/url';
import noop from '@proton/utils/noop';

const useLoad = () => {
    useEffect(() => {
        const url = formatURLForAjaxRequest();
        fetch(url).catch(noop);
    }, []);
};

export default useLoad;
