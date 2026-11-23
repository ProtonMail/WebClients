import { useLocation } from 'react-router-dom';

import { useUser } from '@proton/account/user/hooks';
import { getAppFromPathnameSafe } from '@proton/shared/lib/apps/slugHelper';
import { getToApp } from '@proton/shared/lib/authentication/apps';
import { APPS } from '@proton/shared/lib/constants';

export const useSettingsApp = () => {
    const location = useLocation();
    const [user] = useUser();

    const appFromPathname = getAppFromPathnameSafe(location.pathname);
    const isGenericSettings = !appFromPathname;
    const app = appFromPathname ?? (isGenericSettings ? APPS.PROTONACCOUNT : getToApp(undefined, user));

    return { app, appFromPathname, isGenericSettings };
};
