import { useEffect } from 'react';

import { selectUser } from '@proton/account/user';
import { useConfig } from '@proton/app-context/useConfig';
import { getDrive, useDrive } from '@proton/drive';
import { useMeetSelector } from '@proton/meet/store/hooks';
import { isPaid } from '@proton/shared/lib/user/helpers';

export const useInitDrive = (enabled: boolean) => {
    const { init } = useDrive();
    const { APP_NAME, APP_VERSION } = useConfig();
    const user = useMeetSelector(selectUser)?.value;

    useEffect(() => {
        if (!enabled || !user || getDrive()) {
            return;
        }

        init({ appName: APP_NAME, appVersion: APP_VERSION, userPlan: isPaid(user) ? 'paid' : 'free' });
    }, [enabled, user, init, APP_NAME, APP_VERSION]);
};
