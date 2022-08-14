import { useContext, useEffect } from 'react';

import { getAppFromPathnameSafe } from '@proton/shared/lib/apps/slugHelper';
import { getIsAuthorizedApp } from '@proton/shared/lib/sideApp/helpers';

import { SideAppContext } from './useSideApp';

export default function useSideAppParent() {
    const { setParentApp } = useContext(SideAppContext) || {
        setParentApp: undefined,
    };

    useEffect(() => {
        const parentApp = getAppFromPathnameSafe(window.location.pathname);

        if (parentApp && getIsAuthorizedApp(parentApp)) {
            setParentApp?.(parentApp);
        }
    }, []);
}
