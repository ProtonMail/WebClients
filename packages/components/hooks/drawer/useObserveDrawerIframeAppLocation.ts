import { useEffect } from 'react';

import useDrawer from '@proton/components/hooks/drawer/useDrawer';
import useConfig from '@proton/components/hooks/useConfig';
import { postMessageFromIframe } from '@proton/shared/lib/drawer/helpers';
import type { DrawerApp } from '@proton/shared/lib/drawer/interfaces';
import { DRAWER_EVENTS } from '@proton/shared/lib/drawer/interfaces';

const useObserveDrawerIframeAppLocation = () => {
    const { APP_NAME } = useConfig();
    const { parentApp } = useDrawer();

    useEffect(() => {
        if (parentApp) {
            postMessageFromIframe(
                {
                    type: DRAWER_EVENTS.CHILD_URL_UPDATE,
                    payload: {
                        url: window.location.href,
                        app: APP_NAME as DrawerApp,
                    },
                },
                parentApp
            );
        }
    }, [window.location.href]);
};

export default useObserveDrawerIframeAppLocation;
