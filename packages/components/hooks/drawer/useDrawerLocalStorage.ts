import { useEffect, useRef } from 'react';

import { LOCALSTORAGE_DRAWER_KEY } from '@proton/shared/lib/drawer/constants';
import { DRAWER_APPS, DrawerLocalStorageValue, IframeSrcMap } from '@proton/shared/lib/drawer/interfaces';
import { removeItem, setItem } from '@proton/shared/lib/helpers/storage';

const useDrawerLocalStorage = (iframeSrcMap: IframeSrcMap, appInView?: DRAWER_APPS) => {
    /**
     * Use a ref to allow deletion of the localStorage value only if we opened an app during the session.
     * Otherwise, when loading the app, no app is opened in the drawer, and we would delete the value stored.
     * By deleting this value directly, we would not be able to open the previously opened app
     */
    const hasSetAppInView = useRef(false);

    const setDrawerLocalStorageKey = (item: DrawerLocalStorageValue) => {
        setItem(LOCALSTORAGE_DRAWER_KEY, JSON.stringify(item));
    };

    useEffect(() => {
        if (appInView) {
            const url = iframeSrcMap[appInView];
            hasSetAppInView.current = true;
            const item = { app: appInView, url } as DrawerLocalStorageValue;
            setDrawerLocalStorageKey(item);
        } else if (hasSetAppInView.current) {
            // When closing the drawer, clean up the value from the drawer local storage item
            removeItem(LOCALSTORAGE_DRAWER_KEY);
        }
    }, [appInView]);

    return { setDrawerLocalStorageKey };
};

export default useDrawerLocalStorage;
