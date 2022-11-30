import { useContext, useEffect } from 'react';

import { getAppFromPathnameSafe } from '@proton/shared/lib/apps/slugHelper';
import { getIsAuthorizedApp } from '@proton/shared/lib/drawer/helpers';

import { DrawerContext } from './useDrawer';

export default function useDrawerParent() {
    const drawerContext = useContext(DrawerContext);

    if (!drawerContext) {
        throw new Error('DrawerContext should be initialised in parent component');
    }

    const { setParentApp } = drawerContext;

    useEffect(() => {
        const parentApp = getAppFromPathnameSafe(window.location.pathname);

        if (parentApp && getIsAuthorizedApp(parentApp)) {
            setParentApp?.(parentApp);
        }
    }, []);
};
