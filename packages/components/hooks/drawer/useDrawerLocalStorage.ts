import { useEffect, useRef } from 'react';

import { useGetUser } from '@proton/components/hooks';
import { LOCALSTORAGE_DRAWER_KEY } from '@proton/shared/lib/drawer/constants';
import { DRAWER_APPS, DrawerLocalStorageValue, IframeSrcMap } from '@proton/shared/lib/drawer/interfaces';
import { removeItem, setItem } from '@proton/shared/lib/helpers/storage';

const useDrawerLocalStorage = (iframeSrcMap: IframeSrcMap, appInView?: DRAWER_APPS) => {
    const getUser = useGetUser();

    /**
     * Use a ref to allow deletion of the localStorage value only if we opened an app during the session.
     * Otherwise, when loading the app, no app is opened in the drawer, and we would delete the value stored.
     * By deleting this value directly, we would not be able to open the previously opened app
     */
    const hasSetAppInView = useRef(false);

    const setDrawerLocalStorageKey = (item: DrawerLocalStorageValue) => {
        setItem(LOCALSTORAGE_DRAWER_KEY, JSON.stringify(item));
    };

    const handleSetLocalStorage = async () => {
        if (appInView) {
            const url = iframeSrcMap[appInView];
            const user = await getUser();
            hasSetAppInView.current = true;
            const item = { app: appInView, url, userID: user.ID } as DrawerLocalStorageValue;
            setDrawerLocalStorageKey(item);
        } else if (hasSetAppInView.current) {
            // When closing the drawer, clean up the value from the drawer local storage item
            removeItem(LOCALSTORAGE_DRAWER_KEY);
        }
    };

    useEffect(() => {
        void handleSetLocalStorage();
    }, [appInView]);

    return { setDrawerLocalStorageKey };
};

export default useDrawerLocalStorage;
