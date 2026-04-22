import { useContext, useEffect } from 'react';

import { getAppFromPathnameSafe } from '@proton/shared/lib/apps/slugHelper';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { addParentAppToUrl, getIsAuthorizedApp } from '@proton/shared/lib/drawer/helpers';

import { DrawerContext } from './useDrawer';

export default function useDrawerParent(parentApp?: APP_NAMES) {
    const drawerContext = useContext(DrawerContext);

    if (!drawerContext) {
        throw new Error('DrawerContext should be initialised in parent component');
    }

    const { setParentApp } = drawerContext;

    useEffect(() => {
        const app = parentApp ?? getAppFromPathnameSafe(window.location.pathname);

        if (app && getIsAuthorizedApp(app)) {
            setParentApp?.(app);

            // If the URL was rewritten during bootstrap (e.g. session fallback) and lost
            // the parent app segment, restore it so the correct drawer view is shown.
            // This will trigger a new render, but at least user will see the correct view and not be stuck with
            // a view that cannot be closed (because the close button is shown in drawer view only)
            if (parentApp && !getAppFromPathnameSafe(window.location.pathname)) {
                const updatedURL = addParentAppToUrl(window.location.href, parentApp, false);
                window.history.replaceState(null, '', updatedURL);
            }
        }
    }, []);
}
