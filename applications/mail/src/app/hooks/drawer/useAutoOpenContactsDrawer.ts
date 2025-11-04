import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

import useDrawer from '@proton/components/hooks/drawer/useDrawer';
import { isContactSearchParams } from '@proton/mail/hooks/autoOpenContacts/helper';
import { DRAWER_NATIVE_APPS } from '@proton/shared/lib/drawer/interfaces';

const useAutoOpenContactsDrawer = () => {
    const location = useLocation();

    const { setAppInView } = useDrawer();

    useEffect(() => {
        if (isContactSearchParams(location)) {
            setAppInView(DRAWER_NATIVE_APPS.CONTACTS);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps -- autofix-eslint-88D165
    }, []);
};

export default useAutoOpenContactsDrawer;
