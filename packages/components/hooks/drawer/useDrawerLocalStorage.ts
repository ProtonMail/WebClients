import { useEffect, useRef } from 'react';

import { useGetUser } from '@proton/account/user/hooks';
import { stripLocalBasenameFromPathname } from '@proton/shared/lib/authentication/pathnameHelper';
import { getLocalStorageUserDrawerKey } from '@proton/shared/lib/drawer/helpers';
import type { DrawerApp, DrawerLocalStorageValue, IframeSrcMap } from '@proton/shared/lib/drawer/interfaces';
import { removeItem, setItem } from '@proton/shared/lib/helpers/storage';

const useDrawerLocalStorage = (iframeSrcMap: IframeSrcMap, drawerIsReady: boolean, appInView?: DrawerApp) => {
    const getUser = useGetUser();

    /**
     * Use a ref to allow deletion of the localStorage value only if we opened an app during the session.
     * Otherwise, when loading the app, no app is opened in the drawer, and we would delete the value stored.
     * By deleting this value directly, we would not be able to open the previously opened app
     */
    const hasSetAppInView = useRef(false);

    const setDrawerLocalStorageKey = (item: DrawerLocalStorageValue, userID: string) => {
        setItem(getLocalStorageUserDrawerKey(userID), JSON.stringify(item));
    };

    const handleSetLocalStorage = async () => {
        // Only perform these actions when drawer can be shown
        // Otherwise it can trigger /users request when not authenticated
        if (drawerIsReady) {
            const { ID } = await getUser();

            if (appInView) {
                const url = iframeSrcMap[appInView];
                const pathname = url ? new URL(url).pathname : '';
                const path = stripLocalBasenameFromPathname(pathname);
                hasSetAppInView.current = true;
                const item: DrawerLocalStorageValue = { app: appInView, path };
                setDrawerLocalStorageKey(item, ID);
            } else if (hasSetAppInView.current) {
                // When closing the drawer, clean up the value from the drawer local storage item
                removeItem(getLocalStorageUserDrawerKey(ID));
            }
        }
    };

    useEffect(() => {
        void handleSetLocalStorage();
    }, [appInView, drawerIsReady]);

    return { setDrawerLocalStorageKey };
};

export default useDrawerLocalStorage;
