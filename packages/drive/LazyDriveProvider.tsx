import { type ReactNode, useEffect } from 'react';

import { useUser } from '@proton/account/user/hooks';
import useConfig from '@proton/components/hooks/useConfig';
import { isPaid } from '@proton/shared/lib/user/helpers';

import type { ProtonDriveClient } from './index';
import { useDrive } from './index';

export function LazyDriveProvider({ children }: { children: (drive: ProtonDriveClient | undefined) => ReactNode }) {
    const { APP_NAME, APP_VERSION } = useConfig();
    const [user] = useUser();
    const { init, drive } = useDrive();
    const isPaidUser = isPaid(user);

    useEffect(() => {
        if (drive) {
            return;
        }
        init({ appName: APP_NAME, appVersion: APP_VERSION, userPlan: isPaidUser ? 'paid' : 'free' });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return <>{children(drive)}</>;
}
