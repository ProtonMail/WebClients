import { useCallback } from 'react';
import { useHistory } from 'react-router-dom';
import {
    APP_NAMES,
    isSSOMode,
    isStandaloneMode
} from 'proton-shared/lib/constants';
import { getAppHref, getAppHrefBundle } from 'proton-shared/lib/apps/helper';

import { useAuthentication, useConfig } from '../..';

const useAppLink = () => {
    const { APP_NAME } = useConfig();
    const authentication = useAuthentication();
    const history = useHistory();

    return useCallback((to: string, toApp?: APP_NAMES) => {
        if (toApp && toApp !== APP_NAME) {
            if (isSSOMode) {
                const localID = authentication.getLocalID?.();
                const href = getAppHref(to, toApp, localID);
                return document.location.assign(href);
            }
            if (isStandaloneMode) {
                return;
            }
            return document.location.assign(getAppHrefBundle(to, toApp));
        }
        return history.push(to);
    }, [authentication]);
};

export default useAppLink;
