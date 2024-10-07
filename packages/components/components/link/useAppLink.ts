import { useCallback } from 'react';
import { useHistory } from 'react-router-dom';

import useAuthentication from '@proton/components/hooks/useAuthentication';
import useConfig from '@proton/components/hooks/useConfig';
import { appLink } from '@proton/shared/lib/apps/appLink';
import type { APP_NAMES } from '@proton/shared/lib/constants';

const useAppLink = () => {
    const { APP_NAME } = useConfig();
    const authentication = useAuthentication();
    const history = useHistory();

    return useCallback(
        (to: string, toApp?: APP_NAMES, newTab?: boolean) => {
            appLink({
                to,
                toApp,
                app: APP_NAME,
                authentication,
                history,
                newTab,
            });
        },
        [authentication]
    );
};

export default useAppLink;
