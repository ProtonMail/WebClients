import { useEffect } from 'react';

import { useUser } from '@proton/account/user/hooks';
import { useConfig } from '@proton/app-context/useConfig';
import type { ProtonDriveClient } from '@proton/drive/sdk';
import { useDrive } from '@proton/drive/sdk';
import { isPaid } from '@proton/shared/lib/user/helpers';

interface DriveStarterProps {
    onReady: (drive: ProtonDriveClient) => void;
}

/**
 * The only part of Mail that imports Drive's code, so it's only ever loaded lazily.
 * Starts the Drive client once per page and hands it to `onReady`.
 */
const DriveStarter = ({ onReady }: DriveStarterProps) => {
    const { APP_NAME, APP_VERSION } = useConfig();
    const [user] = useUser();
    const { init, drive } = useDrive();

    useEffect(() => {
        // The client outlives this component, and starting it a second time throws.
        if (drive) {
            return;
        }
        init({ appName: APP_NAME, appVersion: APP_VERSION, userPlan: isPaid(user) ? 'paid' : 'free' });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (drive) {
            onReady(drive);
        }
    }, [drive, onReady]);

    return null;
};

export default DriveStarter;
